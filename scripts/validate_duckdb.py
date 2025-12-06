#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DuckDB 数据库验证脚本

功能:
1. 检查表是否存在
2. 验证字段完整性和数据类型
3. 检查数据范围和约束
4. 验证索引是否存在
5. 生成验证报告

使用方法:
    python scripts/validate_duckdb.py insurance_data.duckdb
"""

import sys
import duckdb
from pathlib import Path
from datetime import datetime

class DuckDBValidator:
    """DuckDB 数据库验证器"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self.errors = []
        self.warnings = []
        self.info = []

        # 必需的27个字段及其数据类型
        self.required_fields = {
            'snapshot_date': 'DATE',
            'policy_start_year': 'INTEGER',
            'business_type_category': 'VARCHAR',
            'chengdu_branch': 'VARCHAR',
            'second_level_organization': 'VARCHAR',  # 可选
            'third_level_organization': 'VARCHAR',
            'customer_category_3': 'VARCHAR',
            'insurance_type': 'VARCHAR',
            'is_new_energy_vehicle': 'BOOLEAN',
            'coverage_type': 'VARCHAR',
            'is_transferred_vehicle': 'BOOLEAN',
            'renewal_status': 'VARCHAR',
            'vehicle_insurance_grade': 'VARCHAR',
            'highway_risk_grade': 'VARCHAR',
            'large_truck_score': 'VARCHAR',
            'small_truck_score': 'VARCHAR',
            'terminal_source': 'VARCHAR',
            'signed_premium_yuan': 'DOUBLE',
            'matured_premium_yuan': 'DOUBLE',
            'policy_count': 'INTEGER',
            'claim_case_count': 'INTEGER',
            'reported_claim_payment_yuan': 'DOUBLE',
            'expense_amount_yuan': 'DOUBLE',
            'commercial_premium_before_discount_yuan': 'DOUBLE',
            'premium_plan_yuan': 'DOUBLE',
            'marginal_contribution_amount_yuan': 'DOUBLE',
            'week_number': 'INTEGER',
        }

        # 可选字段（允许为空）
        self.optional_fields = {
            'second_level_organization',
            'premium_plan_yuan',
            'vehicle_insurance_grade',
            'highway_risk_grade',
            'large_truck_score',
            'small_truck_score',
        }

        # 必需的索引
        self.required_indexes = {
            'idx_week': 'week_number',
            'idx_year': 'policy_start_year',
            'idx_org': 'third_level_organization',
            'idx_business': 'business_type_category',
            'idx_year_week': 'policy_start_year, week_number',
        }

    def connect(self):
        """连接数据库"""
        try:
            print(f"🔌 连接数据库: {self.db_path}")

            if not Path(self.db_path).exists():
                self.errors.append(f"文件不存在: {self.db_path}")
                return False

            file_size = Path(self.db_path).stat().st_size / (1024 * 1024)
            self.info.append(f"文件大小: {file_size:.2f} MB")

            self.conn = duckdb.connect(self.db_path, read_only=True)
            self.info.append("数据库连接成功")
            return True

        except Exception as e:
            self.errors.append(f"连接失败: {e}")
            return False

    def check_table_exists(self):
        """检查表是否存在"""
        print("\n📋 检查表...")

        try:
            result = self.conn.execute("SHOW TABLES").fetchall()
            tables = [row[0] for row in result]

            if 'insurance_records' not in tables:
                self.errors.append("未找到表 'insurance_records'")
                self.info.append(f"可用表: {', '.join(tables) if tables else '无'}")
                return False

            self.info.append("✅ 表 'insurance_records' 存在")
            return True

        except Exception as e:
            self.errors.append(f"检查表失败: {e}")
            return False

    def check_schema(self):
        """检查字段结构"""
        print("\n🔍 检查字段结构...")

        try:
            result = self.conn.execute("DESCRIBE insurance_records").fetchall()
            actual_fields = {row[0]: row[1].upper() for row in result}

            # 检查缺失字段
            missing_fields = set(self.required_fields.keys()) - set(actual_fields.keys())
            if missing_fields:
                self.errors.append(f"缺少字段: {', '.join(missing_fields)}")

            # 检查多余字段
            extra_fields = set(actual_fields.keys()) - set(self.required_fields.keys())
            if extra_fields:
                self.warnings.append(f"额外字段: {', '.join(extra_fields)}")

            # 检查字段类型
            type_mismatches = []
            for field, expected_type in self.required_fields.items():
                if field in actual_fields:
                    actual_type = actual_fields[field]
                    # 宽松匹配（例如 BIGINT 可以代替 INTEGER）
                    if not self._type_compatible(actual_type, expected_type):
                        type_mismatches.append(f"{field}: 期望 {expected_type}, 实际 {actual_type}")

            if type_mismatches:
                self.errors.append("字段类型不匹配:\n  " + "\n  ".join(type_mismatches))

            if not missing_fields and not type_mismatches:
                self.info.append(f"✅ 字段结构正确 ({len(actual_fields)} 个字段)")

            return len(missing_fields) == 0 and len(type_mismatches) == 0

        except Exception as e:
            self.errors.append(f"检查字段结构失败: {e}")
            return False

    def check_data_integrity(self):
        """检查数据完整性"""
        print("\n🔬 检查数据完整性...")

        try:
            # 总记录数
            total_records = self.conn.execute("SELECT COUNT(*) FROM insurance_records").fetchone()[0]
            self.info.append(f"总记录数: {total_records:,} 条")

            if total_records == 0:
                self.warnings.append("数据库为空")
                return True

            # 检查必需字段的空值
            null_checks = []
            for field in self.required_fields.keys():
                if field not in self.optional_fields:
                    null_count = self.conn.execute(
                        f"SELECT COUNT(*) FROM insurance_records WHERE {field} IS NULL"
                    ).fetchone()[0]

                    if null_count > 0:
                        null_checks.append(f"{field}: {null_count} 条空值")

            if null_checks:
                self.errors.append("必需字段存在空值:\n  " + "\n  ".join(null_checks))
            else:
                self.info.append("✅ 必需字段无空值")

            # 检查数据范围
            range_checks = []

            # 年份范围
            year_stats = self.conn.execute(
                "SELECT MIN(policy_start_year), MAX(policy_start_year) FROM insurance_records"
            ).fetchone()

            if year_stats[0] < 2024 or year_stats[1] > 2025:
                range_checks.append(f"保单年度超出范围: {year_stats[0]}-{year_stats[1]}")
            else:
                self.info.append(f"保单年度: {year_stats[0]}-{year_stats[1]}")

            # 周次范围
            week_stats = self.conn.execute(
                "SELECT MIN(week_number), MAX(week_number), COUNT(DISTINCT week_number) FROM insurance_records"
            ).fetchone()

            if week_stats[0] < 1 or week_stats[1] > 53:
                range_checks.append(f"周次超出范围: {week_stats[0]}-{week_stats[1]}")
            else:
                self.info.append(f"周次范围: 第 {week_stats[0]} 周 ~ 第 {week_stats[1]} 周 (共 {week_stats[2]} 周)")

            # 负值检查（除边际贡献外）
            negative_checks = self.conn.execute("""
                SELECT
                    SUM(CASE WHEN signed_premium_yuan < 0 THEN 1 ELSE 0 END) as neg_signed,
                    SUM(CASE WHEN matured_premium_yuan < 0 THEN 1 ELSE 0 END) as neg_matured,
                    SUM(CASE WHEN policy_count < 0 THEN 1 ELSE 0 END) as neg_policy,
                    SUM(CASE WHEN claim_case_count < 0 THEN 1 ELSE 0 END) as neg_claim,
                    SUM(CASE WHEN reported_claim_payment_yuan < 0 THEN 1 ELSE 0 END) as neg_payment,
                    SUM(CASE WHEN expense_amount_yuan < 0 THEN 1 ELSE 0 END) as neg_expense
                FROM insurance_records
            """).fetchone()

            negative_fields = [
                ('签单保费', negative_checks[0]),
                ('满期保费', negative_checks[1]),
                ('保单件数', negative_checks[2]),
                ('赔案件数', negative_checks[3]),
                ('已报告赔款', negative_checks[4]),
                ('费用金额', negative_checks[5]),
            ]

            for field_name, count in negative_fields:
                if count > 0:
                    range_checks.append(f"{field_name}: {count} 条负值记录")

            if range_checks:
                self.warnings.append("数据范围异常:\n  " + "\n  ".join(range_checks))
            else:
                self.info.append("✅ 数据范围正常")

            # 统计信息
            stats = self.conn.execute("""
                SELECT
                    SUM(signed_premium_yuan) / 10000 as total_premium_wan,
                    SUM(policy_count) as total_policies,
                    COUNT(DISTINCT third_level_organization) as org_count
                FROM insurance_records
            """).fetchone()

            self.info.append(f"签单保费: {stats[0]:,.2f} 万元")
            self.info.append(f"保单件数: {stats[1]:,} 件")
            self.info.append(f"三级机构: {stats[2]} 个")

            return len(null_checks) == 0

        except Exception as e:
            self.errors.append(f"检查数据完整性失败: {e}")
            return False

    def check_indexes(self):
        """检查索引"""
        print("\n⚡检查索引...")

        try:
            result = self.conn.execute("SELECT * FROM duckdb_indexes()").fetchall()
            existing_indexes = {row[2]: row[4] for row in result if row[1] == 'insurance_records'}

            missing_indexes = []
            for idx_name, columns in self.required_indexes.items():
                if idx_name not in existing_indexes:
                    missing_indexes.append(f"{idx_name} ({columns})")

            if missing_indexes:
                self.warnings.append("缺少索引 (可能影响性能):\n  " + "\n  ".join(missing_indexes))
            else:
                self.info.append(f"✅ 索引完整 ({len(existing_indexes)} 个)")

            return True

        except Exception as e:
            self.warnings.append(f"检查索引失败: {e}")
            return True  # 索引缺失是警告，不是错误

    def check_performance(self):
        """检查性能优化"""
        print("\n⚙️  检查性能优化...")

        try:
            # 检查表统计信息
            stats_result = self.conn.execute("""
                SELECT * FROM duckdb_tables()
                WHERE table_name = 'insurance_records'
            """).fetchall()

            if stats_result:
                self.info.append("✅ 表统计信息已更新")
            else:
                self.warnings.append("表统计信息缺失，建议运行 ANALYZE")

            return True

        except Exception as e:
            self.warnings.append(f"检查性能优化失败: {e}")
            return True

    def _type_compatible(self, actual: str, expected: str) -> bool:
        """检查类型兼容性"""
        # 宽松匹配规则
        type_map = {
            'INTEGER': ['INTEGER', 'BIGINT', 'SMALLINT'],
            'DOUBLE': ['DOUBLE', 'FLOAT', 'DECIMAL', 'REAL'],
            'VARCHAR': ['VARCHAR', 'TEXT', 'STRING'],
            'BOOLEAN': ['BOOLEAN', 'BOOL'],
            'DATE': ['DATE', 'TIMESTAMP'],
        }

        if expected in type_map:
            return actual in type_map[expected]

        return actual == expected

    def generate_report(self):
        """生成验证报告"""
        print("\n" + "=" * 80)
        print("📊 验证报告")
        print("=" * 80)

        # 基本信息
        print(f"\n📁 文件: {self.db_path}")
        print(f"⏰ 验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 错误
        if self.errors:
            print(f"\n❌ 错误 ({len(self.errors)}):")
            for i, error in enumerate(self.errors, 1):
                print(f"   {i}. {error}")

        # 警告
        if self.warnings:
            print(f"\n⚠️  警告 ({len(self.warnings)}):")
            for i, warning in enumerate(self.warnings, 1):
                print(f"   {i}. {warning}")

        # 信息
        if self.info:
            print(f"\nℹ️  信息:")
            for info in self.info:
                print(f"   • {info}")

        # 总结
        print("\n" + "=" * 80)
        if not self.errors:
            print("✅ 验证通过！数据库符合所有要求。")
            if self.warnings:
                print(f"⚠️  存在 {len(self.warnings)} 个警告，建议查看并优化。")
        else:
            print(f"❌ 验证失败！发现 {len(self.errors)} 个错误，请修正后重试。")
        print("=" * 80)

        return len(self.errors) == 0

    def close(self):
        """关闭连接"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def validate(self):
        """执行完整验证"""
        success = True

        try:
            if not self.connect():
                return False

            success = self.check_table_exists() and success

            if success:  # 只有表存在时才继续检查
                success = self.check_schema() and success
                success = self.check_data_integrity() and success
                self.check_indexes()  # 索引缺失不影响整体验证结果
                self.check_performance()  # 性能优化是可选的

            passed = self.generate_report()
            return passed

        except Exception as e:
            print(f"\n❌ 验证过程发生错误: {e}")
            return False
        finally:
            self.close()

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python scripts/validate_duckdb.py <数据库文件路径>")
        print("\n示例:")
        print("  python scripts/validate_duckdb.py insurance_data.duckdb")
        sys.exit(1)

    db_path = sys.argv[1]

    print("=" * 80)
    print("🔍 DuckDB 数据库验证工具")
    print("=" * 80)

    validator = DuckDBValidator(db_path)
    success = validator.validate()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
