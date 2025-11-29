#!/usr/bin/env python3
"""
车险CSV数据验证脚本
基于data-validator skill规范

验证项:
1. 字段完整性 - 27个字段
2. 数据类型验证
3. 业务规则验证
4. 枚举值验证
"""

import csv
import sys
from datetime import datetime
from typing import Dict, List, Set, Tuple
import os


# 标准27字段定义
REQUIRED_FIELDS = [
    "snapshot_date",
    "policy_start_year",
    "business_type_category",
    "chengdu_branch",
    "second_level_organization",  # 可选
    "third_level_organization",
    "customer_category_3",
    "insurance_type",
    "is_new_energy_vehicle",
    "coverage_type",
    "is_transferred_vehicle",
    "renewal_status",
    "vehicle_insurance_grade",  # 可选
    "highway_risk_grade",  # 可选
    "large_truck_score",  # 可选
    "small_truck_score",  # 可选
    "terminal_source",
    "signed_premium_yuan",
    "matured_premium_yuan",
    "policy_count",
    "claim_case_count",
    "reported_claim_payment_yuan",
    "expense_amount_yuan",
    "commercial_premium_before_discount_yuan",
    "premium_plan_yuan",  # 可选
    "marginal_contribution_amount_yuan",
    "week_number"
]

OPTIONAL_FIELDS = {
    "second_level_organization",
    "vehicle_insurance_grade",
    "highway_risk_grade",
    "large_truck_score",
    "small_truck_score",
    "premium_plan_yuan"
}

# 枚举值定义
ENUM_VALUES = {
    "chengdu_branch": ["成都", "中支"],
    "insurance_type": ["商业险", "交强险"],
    "coverage_type": ["主全", "交三", "单交"],
    "renewal_status": ["新保", "续保", "转保"],
    "is_new_energy_vehicle": ["True", "False"],
    "is_transferred_vehicle": ["True", "False"],
    "vehicle_insurance_grade": ["A", "B", "C", "D", "E", "F", "G", "X", ""],
    "highway_risk_grade": ["A", "B", "C", "D", "E", "F", "X", ""],
    "large_truck_score": ["A", "B", "C", "D", "E", "X", ""],
    "small_truck_score": ["A", "B", "C", "D", "E", "X", ""],
}


class ValidationError:
    def __init__(self, row_num: int, field: str, message: str, severity: str = "error"):
        self.row_num = row_num
        self.field = field
        self.message = message
        self.severity = severity  # error, warning, info

    def __repr__(self):
        icon = "❌" if self.severity == "error" else "⚠️" if self.severity == "warning" else "ℹ️"
        return f"{icon} 第 {self.row_num} 行, 字段 [{self.field}]: {self.message}"


def validate_csv(file_path: str, sample_mode: bool = False) -> Tuple[List[ValidationError], Dict]:
    """验证CSV文件"""
    errors: List[ValidationError] = []
    stats = {
        "total_records": 0,
        "valid_records": 0,
        "error_records": 0,
        "warning_records": 0,
        "field_stats": {}
    }

    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            # 读取第一行检查BOM
            first_line = f.readline()
            f.seek(0)

            # 检查是否有UTF-8 BOM
            if first_line.startswith('\ufeff'):
                f = open(file_path, 'r', encoding='utf-8-sig')

            reader = csv.DictReader(f)

            # 验证字段完整性
            if reader.fieldnames:
                missing_fields = set(REQUIRED_FIELDS) - set(reader.fieldnames)
                extra_fields = set(reader.fieldnames) - set(REQUIRED_FIELDS)

                if missing_fields:
                    for field in missing_fields:
                        errors.append(ValidationError(0, field, f"缺少必需字段", "error"))

                if extra_fields:
                    for field in extra_fields:
                        errors.append(ValidationError(0, field, f"包含多余字段", "warning"))

            # 验证每行数据
            max_rows = 100 if sample_mode else float('inf')
            for i, row in enumerate(reader, start=2):  # 从第2行开始(第1行是表头)
                if i > max_rows + 1:
                    break

                stats["total_records"] += 1
                row_errors = []

                # 验证必填字段
                for field in REQUIRED_FIELDS:
                    if field not in OPTIONAL_FIELDS and not row.get(field, "").strip():
                        row_errors.append(ValidationError(i, field, "必填字段为空", "error"))

                # 验证数据类型和格式
                if row.get("snapshot_date"):
                    try:
                        datetime.strptime(row["snapshot_date"], "%Y-%m-%d")
                    except ValueError:
                        row_errors.append(ValidationError(i, "snapshot_date", f"日期格式错误,应为YYYY-MM-DD,实际值:{row['snapshot_date']}", "error"))

                # 验证整数字段
                int_fields = ["policy_start_year", "week_number", "policy_count", "claim_case_count"]
                for field in int_fields:
                    if row.get(field):
                        try:
                            int_val = int(float(row[field]))
                        except ValueError:
                            row_errors.append(ValidationError(i, field, f"不是有效的整数,实际值:{row[field]}", "error"))

                # 验证数值字段
                number_fields = [
                    "signed_premium_yuan", "matured_premium_yuan",
                    "reported_claim_payment_yuan", "expense_amount_yuan",
                    "commercial_premium_before_discount_yuan", "marginal_contribution_amount_yuan"
                ]
                for field in number_fields:
                    if row.get(field):
                        try:
                            float_val = float(row[field])
                            # 边际贡献额可以为负
                            if field != "marginal_contribution_amount_yuan" and float_val < 0:
                                row_errors.append(ValidationError(i, field, f"金额不能为负数,实际值:{float_val}", "error"))
                        except ValueError:
                            row_errors.append(ValidationError(i, field, f"不是有效的数值,实际值:{row[field]}", "error"))

                # 验证布尔字段
                bool_fields = ["is_new_energy_vehicle", "is_transferred_vehicle"]
                for field in bool_fields:
                    if row.get(field) and row[field] not in ["True", "False"]:
                        row_errors.append(ValidationError(i, field, f"布尔值应为True或False,实际值:{row[field]}", "error"))

                # 验证枚举值
                for field, valid_values in ENUM_VALUES.items():
                    if field in row and row[field]:
                        if row[field] not in valid_values:
                            row_errors.append(ValidationError(i, field, f"枚举值不合法,实际值:{row[field]},合法值:{valid_values}", "warning"))

                # 验证业务规则
                if row.get("policy_start_year"):
                    try:
                        year = int(row["policy_start_year"])
                        if year < 2024 or year > 2025:
                            row_errors.append(ValidationError(i, "policy_start_year", f"年度应在2024-2025范围内,实际值:{year}", "warning"))
                    except ValueError:
                        pass

                if row.get("week_number"):
                    try:
                        week = int(float(row["week_number"]))
                        if week < 1 or week > 105:
                            row_errors.append(ValidationError(i, "week_number", f"周次应在1-105范围内,实际值:{week}", "warning"))
                    except ValueError:
                        pass

                # 统计
                if row_errors:
                    has_error = any(e.severity == "error" for e in row_errors)
                    if has_error:
                        stats["error_records"] += 1
                    else:
                        stats["warning_records"] += 1
                    errors.extend(row_errors)
                else:
                    stats["valid_records"] += 1

    except UnicodeDecodeError:
        errors.append(ValidationError(0, "文件编码", "文件编码不是UTF-8", "error"))
    except Exception as e:
        errors.append(ValidationError(0, "文件读取", f"读取文件时发生错误: {str(e)}", "error"))

    return errors, stats


def print_report(errors: List[ValidationError], stats: Dict, file_path: str):
    """打印验证报告"""
    print("=" * 80)
    print("📊 车险CSV数据验证报告")
    print("=" * 80)
    print(f"文件路径: {file_path}")
    print(f"文件大小: {os.path.getsize(file_path) / 1024 / 1024:.2f} MB")
    print()

    print("=" * 80)
    print("📈 概览统计")
    print("=" * 80)
    print(f"总记录数: {stats['total_records']:,}")
    print(f"验证通过: {stats['valid_records']:,} 条")
    print(f"严重错误: {stats['error_records']:,} 条")
    print(f"警告信息: {stats['warning_records']:,} 条")

    if stats['total_records'] > 0:
        error_rate = (stats['error_records'] / stats['total_records']) * 100
        print(f"错误率: {error_rate:.2f}%")
    print()

    # 按严重程度分组错误
    error_list = [e for e in errors if e.severity == "error"]
    warning_list = [e for e in errors if e.severity == "warning"]

    if error_list:
        print("=" * 80)
        print(f"❌ 严重错误 ({len(error_list)} 项)")
        print("=" * 80)
        # 只显示前20个错误
        for error in error_list[:20]:
            print(error)
        if len(error_list) > 20:
            print(f"... 还有 {len(error_list) - 20} 个错误未显示")
        print()

    if warning_list:
        print("=" * 80)
        print(f"⚠️ 警告信息 ({len(warning_list)} 项)")
        print("=" * 80)
        # 只显示前20个警告
        for warning in warning_list[:20]:
            print(warning)
        if len(warning_list) > 20:
            print(f"... 还有 {len(warning_list) - 20} 个警告未显示")
        print()

    if not errors:
        print("=" * 80)
        print("✅ 验证通过")
        print("=" * 80)
        print("所有数据验证通过,没有发现任何错误或警告!")
        print()

    print("=" * 80)
    print("📋 修复建议")
    print("=" * 80)
    if error_list:
        print("1. 优先修复严重错误(❌),这些错误会导致数据无法正常导入")
        print("2. 检查数据类型错误,确保日期、数值、布尔值格式正确")
        print("3. 确认文件编码为UTF-8")
    if warning_list:
        print("4. 修复警告信息(⚠️),这些不会阻止导入但可能影响数据准确性")
        print("5. 检查枚举值是否符合业务规范")
    if not errors:
        print("无需修复,数据质量良好! ✨")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 validate_csv_data.py <CSV文件路径> [--sample]")
        sys.exit(1)

    file_path = sys.argv[1]
    sample_mode = "--sample" in sys.argv

    if not os.path.exists(file_path):
        print(f"❌ 错误: 文件不存在 {file_path}")
        sys.exit(1)

    print(f"开始验证: {file_path}")
    if sample_mode:
        print("⚡ 快速验证模式 - 仅检查前100行")
    print()

    errors, stats = validate_csv(file_path, sample_mode)
    print_report(errors, stats, file_path)

    # 返回错误码
    if any(e.severity == "error" for e in errors):
        sys.exit(1)
    else:
        sys.exit(0)
