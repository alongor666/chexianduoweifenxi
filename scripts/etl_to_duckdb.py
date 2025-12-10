#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据 ETL (提取、转换、加载) 脚本

功能:
1. 从指定目录提取 Excel (.xlsx, .xls) 和 .csv 文件。
2. 应用业务逻辑进行数据转换、清洗、计算，内置“别名-验证”模式。
3. 将处理后的干净数据加载到单个 DuckDB 数据库文件中。
4. 创建索引并优化数据库以提高查询性能。

使用方法:
    # 使用默认路径 (输入: '实际数据/', 输出: 'insurance_data.duckdb')
    python scripts/etl_to_duckdb.py

    # 指定输入和输出路径
    python scripts/etl_to_duckdb.py --input-dir /path/to/data --output-db /path/to/output.duckdb
"""

import os
import re
import sys
import glob
import argparse
import duckdb
import pandas as pd
from datetime import datetime
from pathlib import Path

class DataProcessor:
    """
    数据处理器 - 核心逻辑从 app.py 移植而来。
    负责所有的数据转换、验证和计算。
    """
    
    def __init__(self):
        # 最终输出的27个标准字段
        self.required_fields = [
            'snapshot_date', 'policy_start_year', 'business_type_category', 'chengdu_branch',
            'second_level_organization', 'third_level_organization', 'customer_category_3',
            'insurance_type', 'is_new_energy_vehicle', 'coverage_type', 'is_transferred_vehicle',
            'renewal_status', 'vehicle_insurance_grade', 'highway_risk_grade', 'large_truck_score',
            'small_truck_score', 'terminal_source', 'signed_premium_yuan', 'matured_premium_yuan',
            'policy_count', 'claim_case_count', 'reported_claim_payment_yuan', 'expense_amount_yuan',
            'commercial_premium_before_discount_yuan', 'premium_plan_yuan',
            'marginal_contribution_amount_yuan', 'week_number'
        ]
        
        # 字段别名映射，用于兼容不同语言环境的列名
        self.field_alias_mapping = {
            'snapshot_date': ['snapshot_date', '刷新时间', 'Snapshot Date'],
            'policy_start_year': ['policy_start_year', '保险起期', 'Policy Start Year'],
            'business_type_category': ['business_type_category', '业务类型分类', 'Business Type Category'],
            'chengdu_branch': ['chengdu_branch', '成都中支', 'Chengdu Branch'],
            'second_level_organization': ['second_level_organization', '二级机构', 'Second Level Organization'],
            'third_level_organization': ['third_level_organization', '三级机构', 'Third Level Organization'],
            'customer_category_3': ['customer_category_3', '客户类别3', 'Customer Category 3'],
            'insurance_type': ['insurance_type', '险种类', 'Insurance Type'],
            'is_new_energy_vehicle': ['is_new_energy_vehicle', '是否新能源车1', 'Is New Energy Vehicle'],
            'coverage_type': ['coverage_type', '交三/主全', 'Coverage Type'],
            'is_transferred_vehicle': ['is_transferred_vehicle', '是否过户车', 'Is Transferred Vehicle'],
            'renewal_status': ['renewal_status', '续保情况', 'Renewal Status'],
            'vehicle_insurance_grade': ['vehicle_insurance_grade', '车险分等级', 'Vehicle Insurance Grade'],
            'highway_risk_grade': ['highway_risk_grade', '高速风险等级', 'Highway Risk Grade'],
            'large_truck_score': ['large_truck_score', '大货车评分', 'Large Truck Score'],
            'small_truck_score': ['small_truck_score', '小货车评分', 'Small Truck Score'],
            'terminal_source': ['terminal_source', '终端来源', 'Terminal Source'],
            'signed_premium_wan': ['signed_premium_wan', '跟单保费(万)', '跟单保费(Ten Thousand)'],
            'average_premium': ['average_premium', '单均保费', 'Average Premium'],
            'matured_premium_wan': ['matured_premium_wan', '满期净保费(万)', '满期净保费(Ten Thousand)'],
            'claim_frequency': ['claim_frequency', '出险频度', 'Claim Frequency'],
            'claim_case_count': ['claim_case_count', '案件数', 'Claim Case Count'],
            'average_claim_amount': ['average_claim_amount', '案均赔款', 'Average Claim Amount'],
            'total_claim_wan': ['total_claim_wan', '总赔款(万)', '总赔款(Ten Thousand)'],
            'matured_claim_ratio': ['matured_claim_ratio', '满期赔付率', 'Matured Claim Ratio'],
            'expense_ratio': ['expense_ratio', '费用率', 'Expense Ratio'],
            'variable_cost_ratio': ['variable_cost_ratio', '变动成本率', 'Variable Cost Ratio'],
            'commercial_autonomous_coefficient': ['commercial_autonomous_coefficient', '商业险自主系数', 'Commercial Autonomous Coefficient'],
            'week_number': ['week_number', '周次', 'Week Number']
        }
        
        self.boolean_map = {'是': True, '否': False, 'Y': True, 'N': False, 'true': True, 'false': False, True: True, False: False}

    def standardize_fields(self, df, original_filename=None, user_week_number=None):
        """标准化字段名和数据类型, 使用别名系统兼容多语言列名"""
        # 预处理：如果是已处理的数据（包含最终字段），则逆向生成必要的中间字段
        if 'signed_premium_yuan' in df.columns:
            # Helper to safely convert to numeric
            def safe_numeric(col): return pd.to_numeric(df[col], errors='coerce').fillna(0)
            
            if 'signed_premium_wan' not in df.columns:
                df['signed_premium_wan'] = safe_numeric('signed_premium_yuan') / 10000
            
            if 'matured_premium_yuan' in df.columns and 'matured_premium_wan' not in df.columns:
                df['matured_premium_wan'] = safe_numeric('matured_premium_yuan') / 10000
                
            if 'reported_claim_payment_yuan' in df.columns and 'total_claim_wan' not in df.columns:
                df['total_claim_wan'] = safe_numeric('reported_claim_payment_yuan') / 10000
                
            if 'expense_amount_yuan' in df.columns and 'expense_ratio' not in df.columns:
                # expense_ratio = expense_amount / signed_premium
                # Handle division by zero
                sp = safe_numeric('signed_premium_yuan')
                ea = safe_numeric('expense_amount_yuan')
                df['expense_ratio'] = ea / sp.replace(0, 1) # Avoid div by zero, will be 0/1=0 if sp is 0 but ea is 0. If ea>0 sp=0, it's problematic but let's assume 0.
                df.loc[sp == 0, 'expense_ratio'] = 0

            if 'marginal_contribution_amount_yuan' in df.columns and 'variable_cost_ratio' not in df.columns:
                # variable_cost_ratio = 1 - (marginal_contribution / matured_premium)
                mp = safe_numeric('matured_premium_yuan')
                mc = safe_numeric('marginal_contribution_amount_yuan')
                df['variable_cost_ratio'] = 1 - (mc / mp.replace(0, 1))
                df.loc[mp == 0, 'variable_cost_ratio'] = 0
                
            if 'average_premium' not in df.columns and 'policy_count' in df.columns:
                 # average_premium = matured_premium / policy_count
                 mp = safe_numeric('matured_premium_yuan')
                 pc = safe_numeric('policy_count')
                 df['average_premium'] = mp / pc.replace(0, 1)
                 df.loc[pc == 0, 'average_premium'] = 0

            if 'commercial_premium_before_discount_yuan' in df.columns and 'commercial_autonomous_coefficient' not in df.columns:
                # coeff = matured_premium / commercial_premium_before_discount
                mp = safe_numeric('matured_premium_yuan')
                cp = safe_numeric('commercial_premium_before_discount_yuan')
                df['commercial_autonomous_coefficient'] = mp / cp.replace(0, 1)
                df.loc[cp == 0, 'commercial_autonomous_coefficient'] = 1.0

        rename_map = {}
        found_internal_fields = set()
        input_columns = df.columns.tolist()
        
        for internal_name, aliases in self.field_alias_mapping.items():
            for alias in aliases:
                if alias in input_columns:
                    rename_map[alias] = internal_name
                    found_internal_fields.add(internal_name)
                    break
        
        required_for_calc = {
            'signed_premium_wan', 'matured_premium_wan', 'average_premium', 
            'claim_case_count', 'total_claim_wan', 'expense_ratio', 
            'variable_cost_ratio', 'commercial_autonomous_coefficient'
        }
        
        missing_fields = [f"'{field}' (别名: {', '.join(self.field_alias_mapping.get(field, []))})" for field in required_for_calc if field not in found_internal_fields]

        if missing_fields:
            raise ValueError(f"处理失败：输入文件 '{original_filename}' 缺少以下必需的列：\n" + "\n".join(missing_fields))

        df_renamed = df.rename(columns=rename_map)
        result_df = df_renamed.copy()
        
        # 确保关键维度字段存在，否则赋予默认值
        for field in ['is_new_energy_vehicle', 'is_transferred_vehicle']:
            if field not in result_df.columns: result_df[field] = False
            result_df[field] = result_df[field].apply(lambda x: self.boolean_map.get(x, False))

        if 'policy_start_year' in result_df.columns:
            def extract_year(value):
                if pd.isna(value): return 0
                try:
                    if isinstance(value, str):
                        text = value.strip()
                        if not text: return 0
                        year_match = re.search(r'(19|20)\d{2}', text)
                        if year_match: return int(year_match.group(0))
                        date_obj = pd.to_datetime(text, errors='coerce')
                        return int(date_obj.year) if pd.notna(date_obj) else 0
                    if isinstance(value, (int, float)) and 1900 <= value <= 2100: return int(value)
                    date_obj = pd.to_datetime(value, errors='coerce')
                    return int(date_obj.year) if pd.notna(date_obj) else 0
                except Exception: return 0
            result_df['policy_start_year'] = result_df['policy_start_year'].apply(extract_year)
        else:
            result_df['policy_start_year'] = 0

        week_number = 40
        if user_week_number is not None:
            week_number = user_week_number
        elif original_filename:
            patterns = [r'第(\d+)周', r'周(\d+)', r'W(\d+)', r'week\s*(\d+)', r'(\d+)周']
            for pattern in patterns:
                match = re.search(pattern, original_filename, re.IGNORECASE)
                if match:
                    week_number = int(match.group(1))
                    break
        result_df['week_number'] = week_number
        
        # 确保二级机构始终为'四川'
        result_df['second_level_organization'] = '四川'
        
        # 为其他缺失的维度字段设置安全默认值
        for field in ['snapshot_date', 'business_type_category', 'chengdu_branch', 'third_level_organization', 'customer_category_3', 'insurance_type', 'coverage_type', 'renewal_status', 'vehicle_insurance_grade', 'highway_risk_grade', 'large_truck_score', 'small_truck_score', 'terminal_source']:
            if field not in result_df.columns:
                result_df[field] = '' if field != 'snapshot_date' else pd.NaT

        return result_df

    def calculate_absolute_fields(self, df):
        """计算9个绝对值字段"""
        result_df = df.copy()
        
        # Helper to safely convert to numeric
        def to_numeric(series):
            return pd.to_numeric(series, errors='coerce').fillna(0)

        signed_premium_wan = to_numeric(df.get('signed_premium_wan', 0))
        matured_premium_wan = to_numeric(df.get('matured_premium_wan', 0))
        avg_premium = to_numeric(df.get('average_premium', 1.0)).replace(0, 1.0)
        coeff = to_numeric(df.get('commercial_autonomous_coefficient', 1.0)).replace(0, 1.0)
        expense_ratio = to_numeric(df.get('expense_ratio', 0))
        variable_cost_ratio = to_numeric(df.get('variable_cost_ratio', 0))

        result_df['signed_premium_yuan'] = signed_premium_wan * 10000
        result_df['matured_premium_yuan'] = matured_premium_wan * 10000
        result_df['commercial_premium_before_discount_yuan'] = result_df['matured_premium_yuan'] / coeff
        result_df['policy_count'] = (result_df['matured_premium_yuan'] / avg_premium).round().astype(int)
        result_df['claim_case_count'] = to_numeric(df.get('claim_case_count', 0)).astype(int)
        result_df['reported_claim_payment_yuan'] = to_numeric(df.get('total_claim_wan', 0)) * 10000
        result_df['expense_amount_yuan'] = result_df['signed_premium_yuan'] * expense_ratio
        result_df['premium_plan_yuan'] = result_df['matured_premium_yuan'] # 默认等于满期保费
        result_df['marginal_contribution_amount_yuan'] = result_df['matured_premium_yuan'] * (1 - variable_cost_ratio)
        
        return result_df

    def finalize_output(self, df):
        """确保最终输出的字段、顺序和类型正确"""
        output_df = pd.DataFrame()
        for field in self.required_fields:
            output_df[field] = df.get(field)
        
        # 类型转换
        for col in output_df.columns:
            if 'yuan' in col or 'amount' in col or 'score' in col:
                output_df[col] = pd.to_numeric(output_df[col], errors='coerce').fillna(0)
            elif 'count' in col:
                output_df[col] = pd.to_numeric(output_df[col], errors='coerce').fillna(0).astype(int)
            elif 'year' in col or 'week' in col:
                 output_df[col] = pd.to_numeric(output_df[col], errors='coerce').fillna(0).astype(int)
            elif 'date' in col:
                output_df[col] = pd.to_datetime(output_df[col], errors='coerce')
        return output_df

class ETLConverter:
    """ETL 转换器"""

    def __init__(self, input_dir: str, output_db: str, table_name: str):
        self.input_dir = input_dir
        self.output_db = output_db
        self.table_name = table_name
        self.conn = None
        self.data_processor = DataProcessor()

    def find_files(self) -> list:
        """查找所有支持的文件 (Excel, CSV)"""
        patterns = ["*.xlsx", "*.xls", "*.csv"]
        files = []
        for pattern in patterns:
            files.extend(glob.glob(os.path.join(self.input_dir, pattern)))
        
        if not files:
            print(f"❌ 错误: 在目录 '{self.input_dir}' 中未找到任何 .xlsx, .xls, 或 .csv 文件")
            sys.exit(1)

        print(f"📁 找到 {len(files)} 个待处理文件:")
        total_size_mb = 0
        for i, file in enumerate(files, 1):
            size_mb = os.path.getsize(file) / (1024 * 1024)
            total_size_mb += size_mb
            print(f"   {i}. {Path(file).name} ({size_mb:.2f} MB)")
        print(f"   总大小: {total_size_mb:.2f} MB")
        return files

    def create_database(self):
        """创建或覆盖数据库"""
        print(f"\n🔨 准备数据库: {self.output_db}")
        if os.path.exists(self.output_db):
            os.remove(self.output_db)
            print(f"   ⚠️  已删除旧的数据库文件")
        self.conn = duckdb.connect(self.output_db)
        print("   ✅ 数据库连接已建立")

    def process_and_import_files(self, files: list):
        """处理并导入所有文件"""
        print(f"\n📥 开始处理和导入文件...")
        total_start = datetime.now()

        for i, file_path in enumerate(files, 1):
            file_start = datetime.now()
            filename = Path(file_path).name
            print(f"\n   [{i}/{len(files)}] 处理: {filename}")

            try:
                # 1. 提取 (Extract)
                if file_path.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(file_path)
                else:
                    df = pd.read_csv(file_path)
                
                # 2. 转换 (Transform)
                df_std = self.data_processor.standardize_fields(df, filename)
                df_calc = self.data_processor.calculate_absolute_fields(df_std)
                final_df = self.data_processor.finalize_output(df_calc)
                
                # 3. 加载 (Load)
                if i == 1:
                    self.conn.execute(f"CREATE TABLE {self.table_name} AS SELECT * FROM final_df")
                    print(f"      ✅ 表 '{self.table_name}' 已创建")
                else:
                    self.conn.execute(f"INSERT INTO {self.table_name} SELECT * FROM final_df")
                    print(f"      ✅ 数据已追加")
                
                elapsed = (datetime.now() - file_start).total_seconds()
                print(f"      ⏱️  耗时: {elapsed:.2f}秒")

            except Exception as e:
                print(f"      ❌ 处理失败: {e}")
                raise

        total_elapsed = (datetime.now() - total_start).total_seconds()
        print(f"\n✅ 所有文件导入完成，总耗时: {total_elapsed:.2f}秒")

    def clean_data(self):
        """数据清洗：删除关键指标为空的记录"""
        print(f"\n🧹 数据清洗...")
        result = self.conn.execute(f"""
            DELETE FROM {self.table_name}
            WHERE policy_start_year = 0 OR signed_premium_yuan = 0 OR week_number = 0
        """)
        deleted_count = result.fetchall()[0][0] if result else 0
        if deleted_count > 0: print(f"   ⚠️  删除了 {deleted_count} 条无效记录")
        else: print(f"   ✅ 数据完整，无需清理")

    def create_indexes(self):
        """创建索引以优化查询性能"""
        print(f"\n⚡ 创建索引...")
        indexes = [
            ("idx_week", "week_number"), ("idx_year", "policy_start_year"),
            ("idx_org", "third_level_organization"), ("idx_business", "business_type_category"),
            ("idx_year_week", "policy_start_year, week_number"),
        ]
        for idx_name, columns in indexes:
            try:
                self.conn.execute(f"CREATE INDEX {idx_name} ON {self.table_name}({columns})")
                print(f"   ✅ {idx_name} on ({columns})")
            except Exception as e:
                print(f"   ⚠️  {idx_name} 创建失败: {e}")

    def analyze_data(self):
        """数据分析并显示统计信息"""
        print(f"\n📊 数据统计:")
        stats_q = f"""
            SELECT COUNT(*), MIN(policy_start_year), MAX(policy_start_year),
                   COUNT(DISTINCT week_number), MIN(week_number), MAX(week_number),
                   COUNT(DISTINCT third_level_organization), SUM(signed_premium_yuan), SUM(policy_count)
            FROM {self.table_name}
        """
        stats = self.conn.execute(stats_q).fetchone()
        print(f"""
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   总记录数:     {stats[0]:,} 条
   年份范围:     {stats[1]} ~ {stats[2]}
   周次范围:     第 {stats[4]} 周 ~ 第 {stats[5]} 周 (共 {stats[3]} 周)
   三级机构:     {stats[6]} 个
   签单保费:     {stats[7]/10000:,.2f} 万元
   保单件数:     {stats[8]:,} 件
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        """)

    def optimize_database(self):
        """优化数据库"""
        print(f"\n🗜️  优化数据库...")
        self.conn.execute("VACUUM; ANALYZE;")
        print(f"   ✅ 数据库已优化")

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print(f"\n✅ 数据库连接已关闭")

    def run(self):
        """执行完整的ETL流程"""
        try:
            print("=" * 80)
            print("🚀 数据 ETL (Excel/CSV -> DuckDB) 转换工具")
            print("=" * 80)

            files = self.find_files()
            self.create_database()
            self.process_and_import_files(files)
            self.clean_data()
            self.create_indexes()
            self.optimize_database()
            self.analyze_data()

            print("\n" + "=" * 80)
            print("🎉 ETL 流程成功完成！")
            print(f"下一步: 在您的分析工具或应用中连接 {self.output_db} 文件。")
            print("=" * 80)

        except Exception as e:
            print(f"\n❌ 转换失败: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            self.close()

def main():
    """主函数：解析参数并启动转换器"""
    parser = argparse.ArgumentParser(description="从 Excel/CSV 文件到 DuckDB 的 ETL 工具。")
    parser.add_argument(
        "--input-dir",
        type=str,
        default="实际数据",
        help="包含源数据文件 (Excel/CSV) 的目录路径。"
    )
    parser.add_argument(
        "--output-db",
        type=str,
        default="insurance_data.duckdb",
        help="输出的 DuckDB 数据库文件路径。"
    )
    parser.add_argument(
        "--table-name",
        type=str,
        default="insurance_records",
        help="在 DuckDB 中创建的表名。"
    )
    args = parser.parse_args()

    converter = ETLConverter(
        input_dir=args.input_dir,
        output_db=args.output_db,
        table_name=args.table_name
    )
    converter.run()

if __name__ == "__main__":
    main()
