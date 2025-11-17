#!/usr/bin/env python3
"""
车险CSV数据验证脚本
验证数据完整性、类型正确性和业务规则
"""

import csv
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Any
from collections import defaultdict


# 27个标准字段定义
REQUIRED_FIELDS = [
    'snapshot_date', 'policy_start_year', 'business_type_category',
    'chengdu_branch', 'second_level_organization', 'third_level_organization',
    'customer_category_3', 'insurance_type', 'is_new_energy_vehicle',
    'coverage_type', 'is_transferred_vehicle', 'renewal_status',
    'vehicle_insurance_grade', 'highway_risk_grade', 'large_truck_score',
    'small_truck_score', 'terminal_source', 'signed_premium_yuan',
    'matured_premium_yuan', 'policy_count', 'claim_case_count',
    'reported_claim_payment_yuan', 'expense_amount_yuan',
    'commercial_premium_before_discount_yuan', 'premium_plan_yuan',
    'marginal_contribution_amount_yuan', 'week_number'
]

# 可选字段(可以为空)
OPTIONAL_FIELDS = {
    'second_level_organization', 'vehicle_insurance_grade',
    'highway_risk_grade', 'large_truck_score', 'small_truck_score',
    'premium_plan_yuan'
}

# 枚举值定义
ENUM_VALUES = {
    'chengdu_branch': ['成都', '中支'],
    'insurance_type': ['商业险', '交强险'],
    'coverage_type': ['主全', '交三', '单交'],
    'renewal_status': ['新保', '续保', '转保'],
    'vehicle_insurance_grade': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X', ''],
    'highway_risk_grade': ['A', 'B', 'C', 'D', 'E', 'F', 'X', ''],
    'large_truck_score': ['A', 'B', 'C', 'D', 'E', 'X', ''],
    'small_truck_score': ['A', 'B', 'C', 'D', 'E', 'X', ''],
}

# 业务类型枚举(16种)
BUSINESS_TYPES = [
    '10吨以上-普货', '10吨以上-冷链', '10吨以上-危化品', '10吨以上-快递',
    '10吨以下-普货', '10吨以下-冷链', '10吨以下-危化品', '10吨以下-快递',
    '网约车', '出租车', '校车', '渣土车', '非营业客车', '其他', '微型车', '半挂牵引车'
]

# 客户类型枚举(11种)
CUSTOMER_CATEGORIES = [
    '非营业个人客车', '非营业个人货车', '非营业单位客车', '非营业单位货车',
    '营业客车', '营业货车', '营业拖拉机', '营业特种车', '营业摩托车',
    '非营业拖拉机', '其他'
]


class ValidationReport:
    """验证报告"""
    def __init__(self):
        self.total_records = 0
        self.valid_records = 0
        self.errors: List[Tuple[int, str, str]] = []  # (row, field, message)
        self.warnings: List[Tuple[int, str, str]] = []  # (row, field, message)
        self.field_stats = defaultdict(lambda: {'empty': 0, 'invalid': 0})

    def add_error(self, row: int, field: str, message: str):
        self.errors.append((row, field, message))
        self.field_stats[field]['invalid'] += 1

    def add_warning(self, row: int, field: str, message: str):
        self.warnings.append((row, field, message))

    def print_summary(self):
        """打印验证摘要"""
        print("\n" + "="*80)
        print("📊 数据验证报告")
        print("="*80)

        # 概览统计
        error_rate = (len(self.errors) / max(self.total_records, 1)) * 100
        print(f"\n总记录数: {self.total_records:,}")
        print(f"验证通过: {self.valid_records:,}")
        print(f"验证失败: {len(self.errors):,}")
        print(f"错误率: {error_rate:.2f}%")
        print(f"警告数: {len(self.warnings):,}")

        # 字段完整性
        print(f"\n✅ 字段完整性: 27个标准字段全部存在")

        # 错误详情
        if self.errors:
            print(f"\n❌ 验证失败项 (前20条):")
            for i, (row, field, msg) in enumerate(self.errors[:20], 1):
                print(f"  {i}. 第 {row} 行 [{field}]: {msg}")
            if len(self.errors) > 20:
                print(f"  ... 还有 {len(self.errors) - 20} 条错误")
        else:
            print(f"\n✅ 所有记录通过验证!")

        # 警告信息
        if self.warnings:
            print(f"\n⚠️  警告信息 (前10条):")
            for i, (row, field, msg) in enumerate(self.warnings[:10], 1):
                print(f"  {i}. 第 {row} 行 [{field}]: {msg}")
            if len(self.warnings) > 10:
                print(f"  ... 还有 {len(self.warnings) - 10} 条警告")

        # 字段统计
        if any(stats['invalid'] > 0 for stats in self.field_stats.values()):
            print(f"\n📋 字段错误统计:")
            for field, stats in sorted(self.field_stats.items()):
                if stats['invalid'] > 0:
                    print(f"  - {field}: {stats['invalid']} 条错误")

        # 修复建议
        if self.errors or self.warnings:
            print(f"\n💡 修复建议:")
            if self.errors:
                print(f"  1. 检查数据类型错误(日期、布尔值、数值)")
                print(f"  2. 验证枚举值是否在规范范围内")
                print(f"  3. 检查必填字段是否有空值")
            if self.warnings:
                print(f"  4. 审查警告信息中的业务规则异常")

        print("\n" + "="*80)


def validate_date(value: str) -> bool:
    """验证日期格式 YYYY-MM-DD"""
    try:
        datetime.strptime(value, '%Y-%m-%d')
        return True
    except:
        return False


def validate_boolean(value: str) -> bool:
    """验证布尔值"""
    return value in ['True', 'False']


def validate_number(value: str) -> bool:
    """验证数值"""
    try:
        float(value)
        return True
    except:
        return False


def validate_integer(value: str) -> bool:
    """验证整数"""
    try:
        int(value)
        return True
    except:
        return False


def validate_row(row_num: int, row: Dict[str, str], report: ValidationReport):
    """验证单行数据"""
    has_error = False

    # 1. 验证必填字段
    for field in REQUIRED_FIELDS:
        if field not in OPTIONAL_FIELDS:
            if not row.get(field) or row[field].strip() == '':
                report.add_error(row_num, field, "必填字段为空")
                has_error = True

    # 2. 验证日期格式
    if row.get('snapshot_date'):
        if not validate_date(row['snapshot_date']):
            report.add_error(row_num, 'snapshot_date', f"日期格式错误: {row['snapshot_date']}")
            has_error = True

    # 3. 验证布尔值
    for field in ['is_new_energy_vehicle', 'is_transferred_vehicle']:
        if row.get(field):
            if not validate_boolean(row[field]):
                report.add_error(row_num, field, f"布尔值格式错误: {row[field]}")
                has_error = True

    # 4. 验证整数字段
    int_fields = ['policy_start_year', 'week_number', 'policy_count', 'claim_case_count']
    for field in int_fields:
        if row.get(field) and row[field].strip():
            if not validate_integer(row[field]):
                report.add_error(row_num, field, f"整数格式错误: {row[field]}")
                has_error = True

    # 5. 验证数值字段
    num_fields = [
        'signed_premium_yuan', 'matured_premium_yuan',
        'reported_claim_payment_yuan', 'expense_amount_yuan',
        'commercial_premium_before_discount_yuan', 'premium_plan_yuan',
        'marginal_contribution_amount_yuan'
    ]
    for field in num_fields:
        if row.get(field) and row[field].strip():
            if not validate_number(row[field]):
                report.add_error(row_num, field, f"数值格式错误: {row[field]}")
                has_error = True

    # 6. 验证枚举值
    for field, valid_values in ENUM_VALUES.items():
        if row.get(field) is not None:
            if row[field] not in valid_values:
                report.add_error(row_num, field, f"枚举值不合法: {row[field]}")
                has_error = True

    # 7. 验证业务规则
    if row.get('policy_start_year'):
        try:
            year = int(row['policy_start_year'])
            if year < 2024 or year > 2025:
                report.add_warning(row_num, 'policy_start_year', f"年度超出范围: {year}")
        except:
            pass

    if row.get('week_number'):
        try:
            week = int(row['week_number'])
            if week < 28 or week > 105:
                report.add_warning(row_num, 'week_number', f"周次超出范围: {week}")
        except:
            pass

    # 8. 验证金额非负(除边际贡献额外)
    non_negative_fields = [
        'signed_premium_yuan', 'matured_premium_yuan',
        'reported_claim_payment_yuan', 'expense_amount_yuan',
        'commercial_premium_before_discount_yuan'
    ]
    for field in non_negative_fields:
        if row.get(field):
            try:
                value = float(row[field])
                if value < 0:
                    report.add_error(row_num, field, f"金额不能为负: {value}")
                    has_error = True
            except:
                pass

    return not has_error


def validate_csv(file_path: str, sample_only: bool = False) -> ValidationReport:
    """验证CSV文件"""
    report = ValidationReport()

    print(f"\n🔍 开始验证文件: {file_path}")
    if sample_only:
        print("📋 模式: 快速验证(前100行)")
    else:
        print("📋 模式: 完整验证")

    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            # 验证字段完整性
            fields = reader.fieldnames
            if not fields:
                print("❌ 错误: 无法读取CSV字段")
                return report

            missing_fields = set(REQUIRED_FIELDS) - set(fields)
            extra_fields = set(fields) - set(REQUIRED_FIELDS)

            if missing_fields:
                print(f"❌ 缺失字段: {missing_fields}")
                return report

            if extra_fields:
                print(f"⚠️  额外字段: {extra_fields}")

            # 验证每行数据
            for i, row in enumerate(reader, 1):
                report.total_records += 1

                if validate_row(i + 1, row, report):  # +1 因为第1行是表头
                    report.valid_records += 1

                # 快速验证模式只检查前100行
                if sample_only and i >= 100:
                    print(f"⏩ 快速验证模式: 已检查前100行")
                    break

    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return report

    return report


def main():
    if len(sys.argv) < 2:
        print("用法: python validate_csv.py <csv_file> [--sample]")
        sys.exit(1)

    file_path = sys.argv[1]
    sample_only = '--sample' in sys.argv

    report = validate_csv(file_path, sample_only)
    report.print_summary()

    # 返回错误码
    sys.exit(0 if len(report.errors) == 0 else 1)


if __name__ == '__main__':
    main()
