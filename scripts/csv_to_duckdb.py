#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV 转 DuckDB 数据库脚本

功能:
1. 读取多个 CSV 文件并合并到单个 DuckDB 数据库
2. 自动数据清洗和验证
3. 创建索引优化查询性能
4. 压缩存储减小文件体积

使用方法:
    python scripts/csv_to_duckdb.py

输出:
    insurance_data.duckdb - 优化后的数据库文件
"""

import duckdb
import glob
import os
import sys
from pathlib import Path
from datetime import datetime

class CSVToDuckDBConverter:
    """CSV 到 DuckDB 转换器"""

    def __init__(self, csv_pattern: str = "实际数据/*.csv", output_db: str = "insurance_data.duckdb"):
        self.csv_pattern = csv_pattern
        self.output_db = output_db
        self.conn = None

    def find_csv_files(self) -> list:
        """查找所有符合模式的 CSV 文件"""
        csv_files = sorted(glob.glob(self.csv_pattern))

        if not csv_files:
            print(f"❌ 错误: 未找到匹配的 CSV 文件 ({self.csv_pattern})")
            sys.exit(1)

        print(f"📁 找到 {len(csv_files)} 个 CSV 文件:")
        for i, file in enumerate(csv_files, 1):
            size_mb = os.path.getsize(file) / (1024 * 1024)
            print(f"   {i}. {Path(file).name} ({size_mb:.2f} MB)")

        return csv_files

    def create_database(self):
        """创建或打开数据库连接"""
        print(f"\n🔨 创建数据库: {self.output_db}")

        # 如果数据库已存在,删除旧文件
        if os.path.exists(self.output_db):
            print(f"⚠️  检测到已存在的数据库文件,将被覆盖")
            os.remove(self.output_db)

        self.conn = duckdb.connect(self.output_db)
        print("✅ 数据库连接已建立")

    def import_csv_files(self, csv_files: list):
        """导入所有 CSV 文件到数据库"""
        print(f"\n📥 开始导入 CSV 文件...")

        total_start = datetime.now()

        for i, csv_file in enumerate(csv_files, 1):
            file_start = datetime.now()
            print(f"\n   [{i}/{len(csv_files)}] 处理: {Path(csv_file).name}")

            try:
                if i == 1:
                    # 第一个文件: 创建表
                    self.conn.execute(f"""
                        CREATE TABLE insurance_records AS
                        SELECT * FROM read_csv_auto('{csv_file}',
                            header=true,
                            sample_size=-1,
                            ignore_errors=false
                        )
                    """)
                    print(f"      ✅ 表已创建")
                else:
                    # 后续文件: 追加数据
                    self.conn.execute(f"""
                        INSERT INTO insurance_records
                        SELECT * FROM read_csv_auto('{csv_file}',
                            header=true,
                            sample_size=-1,
                            ignore_errors=false
                        )
                    """)
                    print(f"      ✅ 数据已追加")

                # 显示导入耗时
                elapsed = (datetime.now() - file_start).total_seconds()
                print(f"      ⏱️  耗时: {elapsed:.2f}秒")

            except Exception as e:
                print(f"      ❌ 导入失败: {e}")
                raise

        total_elapsed = (datetime.now() - total_start).total_seconds()
        print(f"\n✅ 所有文件导入完成，总耗时: {total_elapsed:.2f}秒")

    def clean_data(self):
        """数据清洗：删除无效记录"""
        print(f"\n🧹 数据清洗...")

        # 删除关键字段为空的记录
        result = self.conn.execute("""
            DELETE FROM insurance_records
            WHERE snapshot_date IS NULL
               OR policy_start_year IS NULL
               OR week_number IS NULL
               OR signed_premium_yuan IS NULL
        """)

        deleted_count = result.fetchall()[0][0] if result else 0

        if deleted_count > 0:
            print(f"   ⚠️  删除了 {deleted_count} 条无效记录")
        else:
            print(f"   ✅ 数据完整，无需清理")

    def create_indexes(self):
        """创建索引以优化查询性能"""
        print(f"\n⚡ 创建索引...")

        indexes = [
            ("idx_week", "week_number"),
            ("idx_year", "policy_start_year"),
            ("idx_org", "third_level_organization"),
            ("idx_business", "business_type_category"),
            ("idx_customer", "customer_category_3"),
            ("idx_insurance_type", "insurance_type"),
            ("idx_year_week", "policy_start_year, week_number"),  # 复合索引
        ]

        for idx_name, columns in indexes:
            try:
                self.conn.execute(f"CREATE INDEX {idx_name} ON insurance_records({columns})")
                print(f"   ✅ {idx_name}: {columns}")
            except Exception as e:
                print(f"   ⚠️  {idx_name} 创建失败: {e}")

    def analyze_data(self):
        """分析数据并显示统计信息"""
        print(f"\n📊 数据统计:")

        # 基本统计
        stats = self.conn.execute("""
            SELECT
                COUNT(*) as total_records,
                COUNT(DISTINCT week_number) as week_count,
                MIN(week_number) as min_week,
                MAX(week_number) as max_week,
                COUNT(DISTINCT third_level_organization) as org_count,
                COUNT(DISTINCT business_type_category) as business_type_count,
                SUM(signed_premium_yuan) as total_premium_yuan,
                SUM(policy_count) as total_policy_count
            FROM insurance_records
        """).fetchone()

        print(f"""
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   总记录数:     {stats[0]:,} 条
   周次范围:     第 {stats[2]} 周 ~ 第 {stats[3]} 周 (共 {stats[1]} 周)
   三级机构:     {stats[4]} 个
   业务类型:     {stats[5]} 种
   签单保费:     {stats[6]/10000:,.2f} 万元
   保单件数:     {stats[7]:,} 件
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        """)

        # 周度分布
        print(f"   📅 各周数据量:")
        weekly_stats = self.conn.execute("""
            SELECT
                week_number,
                COUNT(*) as record_count,
                SUM(signed_premium_yuan)/10000 as premium_wan
            FROM insurance_records
            GROUP BY week_number
            ORDER BY week_number
        """).fetchall()

        for week, count, premium in weekly_stats:
            print(f"      第 {week} 周: {count:,} 条记录, {premium:,.2f} 万元")

    def optimize_database(self):
        """优化数据库: 压缩和整理"""
        print(f"\n🗜️  优化数据库...")

        # VACUUM 命令会:
        # 1. 回收未使用的空间
        # 2. 压缩数据文件
        # 3. 重组数据以提高查询效率
        self.conn.execute("VACUUM")
        self.conn.execute("ANALYZE")

        print(f"   ✅ 数据库已优化")

    def get_database_info(self):
        """获取数据库文件信息"""
        if os.path.exists(self.output_db):
            size_mb = os.path.getsize(self.output_db) / (1024 * 1024)
            print(f"\n💾 数据库文件:")
            print(f"   路径: {os.path.abspath(self.output_db)}")
            print(f"   大小: {size_mb:.2f} MB")

            # 估算压缩比
            csv_total_size = sum(os.path.getsize(f) for f in glob.glob(self.csv_pattern))
            csv_total_mb = csv_total_size / (1024 * 1024)
            compression_ratio = (1 - size_mb / csv_total_mb) * 100 if csv_total_mb > 0 else 0

            print(f"   压缩比: {compression_ratio:.1f}% (原始CSV: {csv_total_mb:.2f} MB)")

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print(f"\n✅ 数据库连接已关闭")

    def convert(self):
        """执行完整的转换流程"""
        try:
            print("=" * 80)
            print("🚀 CSV 转 DuckDB 转换工具")
            print("=" * 80)

            # 1. 查找 CSV 文件
            csv_files = self.find_csv_files()

            # 2. 创建数据库
            self.create_database()

            # 3. 导入数据
            self.import_csv_files(csv_files)

            # 4. 清洗数据
            self.clean_data()

            # 5. 创建索引
            self.create_indexes()

            # 6. 优化数据库
            self.optimize_database()

            # 7. 分析数据
            self.analyze_data()

            # 8. 显示文件信息
            self.get_database_info()

            print("\n" + "=" * 80)
            print("🎉 转换成功完成！")
            print("=" * 80)
            print(f"\n下一步: 在网页中选择 {self.output_db} 文件进行分析")

        except Exception as e:
            print(f"\n❌ 转换失败: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            self.close()


def main():
    """主函数"""
    converter = CSVToDuckDBConverter()
    converter.convert()


if __name__ == "__main__":
    main()
