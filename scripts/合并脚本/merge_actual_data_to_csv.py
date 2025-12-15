#!/usr/bin/env python3
"""
合并并清洗“实际数据/”目录下的周度明细 CSV，生成可直接上传到项目的单一 CSV。

设计目标（KISS/YAGNI）：
- 仅处理当前项目“实际数据/”中的 CSV 文件（如后续出现 Excel，可先用现有 ETL 转换后再合并）。
- 输出字段顺序与项目数据规范保持一致（默认输出 27 列标准字段；可选去除 second_level_organization 以兼容旧工具）。
- 对关键字段做清洗与轻量校验：去 BOM/空白、枚举值映射、布尔/数值/日期规范化、基础规则校验。

用法示例：
  python3 "scripts/合并脚本/merge_actual_data_to_csv.py"
  python3 "scripts/合并脚本/merge_actual_data_to_csv.py" --drop-second-level-organization
  python3 "scripts/合并脚本/merge_actual_data_to_csv.py" --input-dir "实际数据" --output-csv "outputs/actual_data_clean.csv"
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional


REQUIRED_FIELDS_26 = [
    "snapshot_date",
    "policy_start_year",
    "business_type_category",
    "chengdu_branch",
    "third_level_organization",
    "customer_category_3",
    "insurance_type",
    "is_new_energy_vehicle",
    "coverage_type",
    "is_transferred_vehicle",
    "renewal_status",
    "vehicle_insurance_grade",
    "highway_risk_grade",
    "large_truck_score",
    "small_truck_score",
    "terminal_source",
    "signed_premium_yuan",
    "matured_premium_yuan",
    "policy_count",
    "claim_case_count",
    "reported_claim_payment_yuan",
    "expense_amount_yuan",
    "commercial_premium_before_discount_yuan",
    "premium_plan_yuan",
    "marginal_contribution_amount_yuan",
    "week_number",
]

OPTIONAL_FIELD_SECOND_LEVEL = "second_level_organization"

EXPECTED_FIELDS_27_ORDER = [
    "snapshot_date",
    "policy_start_year",
    "business_type_category",
    "chengdu_branch",
    "second_level_organization",
    "third_level_organization",
    "customer_category_3",
    "insurance_type",
    "is_new_energy_vehicle",
    "coverage_type",
    "is_transferred_vehicle",
    "renewal_status",
    "vehicle_insurance_grade",
    "highway_risk_grade",
    "large_truck_score",
    "small_truck_score",
    "terminal_source",
    "signed_premium_yuan",
    "matured_premium_yuan",
    "policy_count",
    "claim_case_count",
    "reported_claim_payment_yuan",
    "expense_amount_yuan",
    "commercial_premium_before_discount_yuan",
    "premium_plan_yuan",
    "marginal_contribution_amount_yuan",
    "week_number",
]

# 与项目校验（src/lib/validations/insurance-schema.ts）保持一致的枚举取值
VALID_ENUMS = {
    "chengdu_branch": {"成都", "中支"},
    "insurance_type": {"商业险", "交强险"},
    "coverage_type": {"主全", "交三", "单交"},
    "renewal_status": {"新保", "续保", "转保"},
}

# 与项目的兼容映射（参考 scripts/test_upload.js 与 src/lib/parsers/fuzzy-matcher.ts）
ENUM_MAPPINGS = {
    "insurance_type": {
        "商业保险": "商业险",
        "商险": "商业险",
        "商业": "商业险",
        "交强": "交强险",
        "交强保险": "交强险",
        "强制险": "交强险",
    },
    "renewal_status": {
        "新": "新保",
        "新保单": "新保",
        "续": "续保",
        "续保单": "续保",
        "转": "转保",
        "转保单": "转保",
    },
}


ZERO_WIDTH_CHARS = "\u200b\u200c\u200d\ufeff\ufffd"


def _normalize_text(value: object) -> str:
    if value is None:
        return ""
    s = str(value)
    if not s:
        return ""
    s = s.translate({ord(ch): None for ch in ZERO_WIDTH_CHARS})
    s = s.replace("\u3000", " ")
    s = " ".join(s.strip().split())
    return s


def _normalize_date_yyyy_mm_dd(value: object) -> tuple[str, Optional[str]]:
    raw = _normalize_text(value)
    if not raw:
        return "", "snapshot_date: 为空"

    candidates = [
        ("%Y-%m-%d", raw),
        ("%Y/%m/%d", raw),
        ("%Y.%m.%d", raw),
    ]
    for fmt, text in candidates:
        try:
            d = dt.datetime.strptime(text, fmt).date()
            return d.strftime("%Y-%m-%d"), None
        except ValueError:
            continue

    return raw, f'snapshot_date: 无法解析日期格式 "{raw}"'


def _normalize_bool(value: object, field: str) -> tuple[bool, Optional[str]]:
    if isinstance(value, bool):
        return value, None
    raw = _normalize_text(value)
    if raw == "":
        return False, f"{field}: 为空，已默认 False"

    if raw in {"True", "False"}:
        return raw == "True", None

    lower = raw.lower()
    if lower in {"true", "1", "yes", "y", "是", "on", "enabled"}:
        return True, f'{field}: 非标准布尔值 "{raw}" 已按 True 处理'
    if lower in {"false", "0", "no", "n", "否", "off", "disabled"}:
        return False, f'{field}: 非标准布尔值 "{raw}" 已按 False 处理'

    return False, f'{field}: 无效布尔值 "{raw}"，已默认 False'


def _parse_number(
    value: object,
    field: str,
    *,
    allow_blank: bool,
    default_if_blank: str = "0",
) -> tuple[str, float, Optional[str]]:
    raw = _normalize_text(value)
    if raw == "":
        if allow_blank:
            return "", 0.0, None
        return default_if_blank, 0.0, f"{field}: 为空，已默认 {default_if_blank}"

    normalized = raw.replace(",", "")
    try:
        num = float(normalized)
    except ValueError:
        return raw, 0.0, f'{field}: 无效数字格式 "{raw}"'

    return normalized, num, None


def _parse_int(
    value: object,
    field: str,
    *,
    allow_blank: bool,
    default_if_blank: str = "0",
) -> tuple[str, int, Optional[str]]:
    s, num, warn_or_err = _parse_number(
        value,
        field,
        allow_blank=allow_blank,
        default_if_blank=default_if_blank,
    )
    if warn_or_err and "无效数字格式" in warn_or_err:
        return s, 0, warn_or_err
    if s == "" and allow_blank:
        return "", 0, None

    if not float(num).is_integer():
        return s, int(num), f'{field}: 必须为整数，当前值 "{s}"'
    return str(int(num)), int(num), warn_or_err


def _map_enum(field: str, value: object) -> str:
    raw = _normalize_text(value)
    if raw == "":
        return ""
    mapping = ENUM_MAPPINGS.get(field, {})
    mapped = mapping.get(raw, raw)
    return mapped


@dataclass(frozen=True)
class RowContext:
    source_file: str
    source_row: int


def _clean_row(
    row: dict[str, object],
    ctx: RowContext,
    *,
    include_second_level_organization: bool,
) -> tuple[Optional[dict[str, str]], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    snapshot_date, err = _normalize_date_yyyy_mm_dd(row.get("snapshot_date"))
    if err:
        errors.append(err)
    else:
        try:
            d = dt.date.fromisoformat(snapshot_date)
            if d < dt.date(2020, 1, 1) or d > dt.date.today():
                errors.append("snapshot_date: 快照日期必须在 2020-01-01 至今之间")
        except ValueError:
            errors.append("snapshot_date: 快照日期格式必须为 YYYY-MM-DD")

    policy_start_year_s, policy_start_year, err = _parse_int(
        row.get("policy_start_year"),
        "policy_start_year",
        allow_blank=False,
        default_if_blank="0",
    )
    if err:
        # 年份为空/非整数不做兜底（避免默默污染数据）
        errors.append(err)
    if policy_start_year < 2020 or policy_start_year > 2030:
        errors.append("policy_start_year: 保单年度必须在 2020-2030 之间")

    week_number_s, week_number, err = _parse_int(
        row.get("week_number"),
        "week_number",
        allow_blank=False,
        default_if_blank="0",
    )
    if err:
        errors.append(err)
    if week_number < 1 or week_number > 105:
        errors.append("week_number: 周序号必须在 1-105 之间")

    chengdu_branch = _normalize_text(row.get("chengdu_branch"))
    if chengdu_branch not in VALID_ENUMS["chengdu_branch"]:
        errors.append('chengdu_branch: 地域属性必须为"成都"或"中支"')

    third_level_organization = _normalize_text(row.get("third_level_organization"))
    if not third_level_organization:
        errors.append("third_level_organization: 三级机构不能为空")

    customer_category_3 = _normalize_text(row.get("customer_category_3"))
    if not customer_category_3:
        errors.append("customer_category_3: 客户类型不能为空")

    business_type_category = _normalize_text(row.get("business_type_category"))
    if not business_type_category:
        errors.append("business_type_category: 业务类型不能为空")

    insurance_type = _map_enum("insurance_type", row.get("insurance_type"))
    if insurance_type not in VALID_ENUMS["insurance_type"]:
        errors.append('insurance_type: 保险类型只能是"商业险"或"交强险"')

    coverage_type = _map_enum("coverage_type", row.get("coverage_type"))
    if coverage_type not in VALID_ENUMS["coverage_type"]:
        errors.append('coverage_type: 险别组合必须是"主全"、"交三"或"单交"')

    renewal_status = _map_enum("renewal_status", row.get("renewal_status"))
    if renewal_status not in VALID_ENUMS["renewal_status"]:
        errors.append('renewal_status: 新续转状态必须是"新保"、"续保"或"转保"')

    is_new_energy_vehicle, w = _normalize_bool(
        row.get("is_new_energy_vehicle"), "is_new_energy_vehicle"
    )
    if w:
        warnings.append(w)

    is_transferred_vehicle, w = _normalize_bool(
        row.get("is_transferred_vehicle"), "is_transferred_vehicle"
    )
    if w:
        warnings.append(w)

    terminal_source = _normalize_text(row.get("terminal_source"))
    if not terminal_source:
        errors.append("terminal_source: 终端来源不能为空")

    signed_premium_s, signed_premium, w = _parse_number(
        row.get("signed_premium_yuan"),
        "signed_premium_yuan",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    if signed_premium < 0 or signed_premium > 10_000_000:
        errors.append("signed_premium_yuan: 签单保费必须为 0-1000 万元")

    matured_premium_s, matured_premium, w = _parse_number(
        row.get("matured_premium_yuan"),
        "matured_premium_yuan",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    if matured_premium < 0 or matured_premium > 10_000_000:
        errors.append("matured_premium_yuan: 满期保费必须为 0-1000 万元")
    if matured_premium > signed_premium:
        errors.append("matured_premium_yuan: 满期保费不能超过签单保费")

    policy_count_s, policy_count, w = _parse_int(
        row.get("policy_count"),
        "policy_count",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    if policy_count < 0:
        errors.append("policy_count: 保单件数必须为非负数")

    claim_case_count_s, claim_case_count, w = _parse_int(
        row.get("claim_case_count"),
        "claim_case_count",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    if claim_case_count < 0:
        errors.append("claim_case_count: 赔案件数必须为非负数")

    reported_claim_payment_s, reported_claim_payment, w = _parse_number(
        row.get("reported_claim_payment_yuan"),
        "reported_claim_payment_yuan",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    # 注意：按项目数据规范，reported_claim_payment_yuan 可为负（如追偿/冲减）。

    expense_amount_s, expense_amount, w = _parse_number(
        row.get("expense_amount_yuan"),
        "expense_amount_yuan",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    if expense_amount < 0:
        errors.append("expense_amount_yuan: 费用金额必须为非负数")

    commercial_premium_before_discount_s, commercial_premium_before_discount, w = (
        _parse_number(
            row.get("commercial_premium_before_discount_yuan"),
            "commercial_premium_before_discount_yuan",
            allow_blank=False,
            default_if_blank="0",
        )
    )
    if w:
        warnings.append(w)
    if commercial_premium_before_discount < 0:
        errors.append(
            "commercial_premium_before_discount_yuan: 商业险折前保费必须为非负数"
        )

    premium_plan_s, premium_plan, err = _parse_number(
        row.get("premium_plan_yuan"),
        "premium_plan_yuan",
        allow_blank=True,
    )
    if err and "无效数字格式" in err:
        errors.append(err)
    # 空值作为 null（CSV 中用空字符串表达）

    marginal_contribution_s, marginal_contribution, w = _parse_number(
        row.get("marginal_contribution_amount_yuan"),
        "marginal_contribution_amount_yuan",
        allow_blank=False,
        default_if_blank="0",
    )
    if w:
        warnings.append(w)
    # 允许为负数（不做范围校验）

    vehicle_insurance_grade = _normalize_text(row.get("vehicle_insurance_grade"))
    highway_risk_grade = _normalize_text(row.get("highway_risk_grade"))
    large_truck_score = _normalize_text(row.get("large_truck_score"))
    small_truck_score = _normalize_text(row.get("small_truck_score"))

    second_level_organization = _normalize_text(row.get("second_level_organization"))

    if errors:
        return None, errors, warnings

    cleaned: dict[str, str] = {
        "snapshot_date": snapshot_date,
        "policy_start_year": policy_start_year_s,
        "business_type_category": business_type_category,
        "chengdu_branch": chengdu_branch,
        "third_level_organization": third_level_organization,
        "customer_category_3": customer_category_3,
        "insurance_type": insurance_type,
        "is_new_energy_vehicle": "True" if is_new_energy_vehicle else "False",
        "coverage_type": coverage_type,
        "is_transferred_vehicle": "True" if is_transferred_vehicle else "False",
        "renewal_status": renewal_status,
        "vehicle_insurance_grade": vehicle_insurance_grade,
        "highway_risk_grade": highway_risk_grade,
        "large_truck_score": large_truck_score,
        "small_truck_score": small_truck_score,
        "terminal_source": terminal_source,
        "signed_premium_yuan": signed_premium_s,
        "matured_premium_yuan": matured_premium_s,
        "policy_count": policy_count_s,
        "claim_case_count": claim_case_count_s,
        "reported_claim_payment_yuan": reported_claim_payment_s,
        "expense_amount_yuan": expense_amount_s,
        "commercial_premium_before_discount_yuan": commercial_premium_before_discount_s,
        "premium_plan_yuan": premium_plan_s,
        "marginal_contribution_amount_yuan": marginal_contribution_s,
        "week_number": week_number_s,
    }

    if include_second_level_organization:
        cleaned["second_level_organization"] = second_level_organization

    return cleaned, errors, warnings


def _list_input_csv_files(input_dir: Path) -> list[Path]:
    if not input_dir.exists():
        raise FileNotFoundError(f'未找到输入目录："{input_dir}"')
    if not input_dir.is_dir():
        raise NotADirectoryError(f'输入路径不是目录："{input_dir}"')

    all_files = sorted([p for p in input_dir.iterdir() if p.is_file()])
    non_csv = [p for p in all_files if p.suffix.lower() != ".csv"]
    if non_csv:
        names = ", ".join([p.name for p in non_csv[:10]])
        raise ValueError(
            f'检测到非 CSV 文件（本脚本当前仅处理 CSV）：{names}'
            + (" ..." if len(non_csv) > 10 else "")
        )
    return [p for p in all_files if p.suffix.lower() == ".csv"]


def _read_csv_rows(path: Path) -> Iterable[tuple[int, dict[str, object]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return
        for idx, row in enumerate(reader, start=2):  # 1 是表头
            yield idx, row


def main() -> int:
    parser = argparse.ArgumentParser(description="合并并清洗实际数据 CSV")
    parser.add_argument(
        "--input-dir",
        default="实际数据",
        help='输入目录（默认："实际数据"）',
    )
    parser.add_argument(
        "--output-csv",
        default="outputs/actual_data_merged_clean.csv",
        help='输出清洗后 CSV（默认："outputs/actual_data_merged_clean.csv"）',
    )
    parser.add_argument(
        "--invalid-csv",
        default="outputs/actual_data_invalid_rows.csv",
        help='输出被剔除的行（默认："outputs/actual_data_invalid_rows.csv"）',
    )
    parser.add_argument(
        "--drop-second-level-organization",
        action="store_true",
        help="输出中移除 second_level_organization 列（默认保留，符合数据架构 27 字段规范）",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_csv = Path(args.output_csv)
    invalid_csv = Path(args.invalid_csv)
    include_second = not bool(args.drop_second_level_organization)

    files = _list_input_csv_files(input_dir)
    if not files:
        print(f'未找到 CSV 文件："{input_dir}"', file=sys.stderr)
        return 2

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    invalid_csv.parent.mkdir(parents=True, exist_ok=True)

    out_fields = (
        EXPECTED_FIELDS_27_ORDER
        if include_second
        else [f for f in EXPECTED_FIELDS_27_ORDER if f != OPTIONAL_FIELD_SECOND_LEVEL]
    )
    required_fields = set(REQUIRED_FIELDS_26)

    total_rows = 0
    valid_rows = 0
    invalid_rows = 0

    error_stats: Counter[str] = Counter()
    warning_stats: Counter[str] = Counter()
    error_examples: dict[str, list[str]] = defaultdict(list)

    with output_csv.open("w", encoding="utf-8", newline="") as out_f, invalid_csv.open(
        "w", encoding="utf-8", newline=""
    ) as bad_f:
        out_writer = csv.DictWriter(out_f, fieldnames=out_fields, extrasaction="ignore")
        out_writer.writeheader()

        bad_fields = ["__source_file", "__source_row", "__errors"] + EXPECTED_FIELDS_27_ORDER
        bad_writer = csv.DictWriter(bad_f, fieldnames=bad_fields, extrasaction="ignore")
        bad_writer.writeheader()

        for file in files:
            # 表头检查：必须包含 26 个必需字段；second_level_organization 可选
            with file.open("r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                fieldnames = [(_normalize_text(x).lstrip("\ufeff")) for x in (reader.fieldnames or [])]
            missing = sorted([x for x in required_fields if x not in fieldnames])
            if missing:
                raise ValueError(
                    f'文件 "{file}" 缺少必需字段（{len(missing)}个）：{", ".join(missing)}'
                )

            for source_row, row in _read_csv_rows(file):
                total_rows += 1
                ctx = RowContext(source_file=file.name, source_row=source_row)

                cleaned, errors, warnings = _clean_row(
                    row,
                    ctx,
                    include_second_level_organization=include_second,
                )

                for w in warnings:
                    warning_stats[w] += 1

                if errors:
                    invalid_rows += 1
                    for e in errors:
                        error_stats[e] += 1
                        if len(error_examples[e]) < 3:
                            error_examples[e].append(
                                f'{file.name}#L{source_row}: {e}'
                            )

                    bad_row = {"__source_file": file.name, "__source_row": str(source_row), "__errors": " | ".join(errors)}
                    # 保留原始字段，便于回溯
                    for k in EXPECTED_FIELDS_27_ORDER:
                        bad_row[k] = _normalize_text(row.get(k))
                    bad_writer.writerow(bad_row)
                    continue

                assert cleaned is not None
                # 输出列缺失时补空
                for k in out_fields:
                    cleaned.setdefault(k, "")
                out_writer.writerow(cleaned)
                valid_rows += 1

    print("===== 合并清洗结果 =====")
    print(f'输入目录: "{input_dir}"')
    print(f"文件数: {len(files)}")
    print(f"总行数: {total_rows}")
    print(f"有效行: {valid_rows}")
    print(f"无效行: {invalid_rows}")
    print(f'输出文件: "{output_csv}"')
    print(f'无效行明细: "{invalid_csv}"')

    if warning_stats:
        top_warnings = warning_stats.most_common(10)
        print("\n===== 警告（Top 10） =====")
        for msg, cnt in top_warnings:
            print(f"- {cnt} × {msg}")

    if error_stats:
        top_errors = error_stats.most_common(10)
        print("\n===== 错误（Top 10） =====")
        for msg, cnt in top_errors:
            print(f"- {cnt} × {msg}")
            for ex in error_examples.get(msg, []):
                print(f"  - {ex}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
