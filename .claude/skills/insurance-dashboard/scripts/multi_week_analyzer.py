#!/usr/bin/env python3
"""
多周趋势分析引擎
支持多数据源、多维度、交互式可视化
"""

import pandas as pd
import json
import glob
import os
import numpy as np
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class NumpyEncoder(json.JSONEncoder):
    """处理 numpy 类型的 JSON 编码器"""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

class MultiWeekAnalyzer:
    """多周趋势分析器"""
    
    def __init__(self, data_sources):
        """
        初始化分析器
        
        Args:
            data_sources: str or list - CSV文件路径或路径列表/通配符
        """
        self.data_sources = data_sources
        self.df_all = None
        self.weeks_available = []
        self.dimensions = {
            'time': ['week_number', 'snapshot_date'],
            'business': ['business_type_category', 'insurance_type', 'coverage_type'],
            'geography': ['chengdu_branch', 'second_level_organization', 'third_level_organization'],
            'vehicle': ['is_new_energy_vehicle', 'is_transferred_vehicle', 'renewal_status'],
            'risk': ['vehicle_insurance_grade', 'highway_risk_grade'],
            'channel': ['terminal_source']
        }
        
    def load_multi_week_data(self):
        """加载多周数据"""
        if isinstance(self.data_sources, str):
            # 支持通配符
            if '*' in self.data_sources:
                files = glob.glob(self.data_sources)
            else:
                files = [self.data_sources]
        else:
            files = self.data_sources
        
        dfs = []
        for file in files:
            try:
                df = pd.read_csv(file, encoding='utf-8-sig')
                dfs.append(df)
                print(f"✓ 加载: {os.path.basename(file)} ({len(df)} 条记录)")
            except Exception as e:
                print(f"✗ 失败: {os.path.basename(file)} - {e}")
        
        if not dfs:
            raise ValueError("没有成功加载任何数据文件")
        
        self.df_all = pd.concat(dfs, ignore_index=True)
        self.weeks_available = sorted(self.df_all['week_number'].unique())
        
        print(f"\n✓ 总计加载 {len(self.df_all)} 条记录")
        print(f"✓ 周数范围: 第 {min(self.weeks_available)} - {max(self.weeks_available)} 周")
        
        return self.df_all
    
    def calculate_weekly_metrics(self):
        """计算每周核心指标"""
        weekly = self.df_all.groupby('week_number').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
            'policy_count': 'sum',
            'claim_case_count': 'sum'
        }).reset_index()
        
        # 计算比率
        weekly['loss_ratio'] = (
            weekly['reported_claim_payment_yuan'] / 
            weekly['matured_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        weekly['expense_ratio'] = (
            weekly['expense_amount_yuan'] / 
            weekly['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        weekly['combined_ratio'] = (
            weekly['loss_ratio'] + weekly['expense_ratio']
        ).round(2)
        
        weekly['margin_ratio'] = (
            weekly['marginal_contribution_amount_yuan'] / 
            weekly['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        weekly['claim_frequency'] = (
            weekly['claim_case_count'] / 
            weekly['policy_count'] * 100
        ).fillna(0).round(2)
        
        # 转换为万元
        for col in ['signed_premium_yuan', 'matured_premium_yuan', 
                    'reported_claim_payment_yuan', 'expense_amount_yuan',
                    'marginal_contribution_amount_yuan']:
            weekly[col] = (weekly[col] / 10000).round(2)
        
        return weekly.to_dict('records')
    
    def analyze_by_dimension(self, dimension, top_n=10):
        """按指定维度分析"""
        if dimension not in self.df_all.columns:
            return None
        
        grouped = self.df_all.groupby([dimension, 'week_number']).agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'policy_count': 'sum'
        }).reset_index()
        
        # 计算比率
        grouped['loss_ratio'] = (
            grouped['reported_claim_payment_yuan'] / 
            grouped['matured_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        grouped['expense_ratio'] = (
            grouped['expense_amount_yuan'] / 
            grouped['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        grouped['combined_ratio'] = (
            grouped['loss_ratio'] + grouped['expense_ratio']
        ).round(2)
        
        # 转换为万元
        grouped['signed_premium_yuan'] = (grouped['signed_premium_yuan'] / 10000).round(2)
        
        # 获取TOP N（按总保费）
        if top_n:
            top_categories = (
                grouped.groupby(dimension)['signed_premium_yuan']
                .sum()
                .nlargest(top_n)
                .index.tolist()
            )
            grouped = grouped[grouped[dimension].isin(top_categories)]
        
        return grouped.to_dict('records')
    
    def analyze_nev_trend(self):
        """新能源车趋势分析"""
        nev_weekly = self.df_all.groupby(['week_number', 'is_new_energy_vehicle']).agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'policy_count': 'sum'
        }).reset_index()
        
        # 计算指标
        nev_weekly['loss_ratio'] = (
            nev_weekly['reported_claim_payment_yuan'] / 
            nev_weekly['matured_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        nev_weekly['expense_ratio'] = (
            nev_weekly['expense_amount_yuan'] / 
            nev_weekly['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        nev_weekly['combined_ratio'] = (
            nev_weekly['loss_ratio'] + nev_weekly['expense_ratio']
        ).round(2)
        
        # 转换为万元
        nev_weekly['signed_premium_yuan'] = (nev_weekly['signed_premium_yuan'] / 10000).round(2)
        
        # 分离传统车和新能源车
        result = {
            'traditional': nev_weekly[~nev_weekly['is_new_energy_vehicle']].to_dict('records'),
            'nev': nev_weekly[nev_weekly['is_new_energy_vehicle']].to_dict('records')
        }
        
        return result
    
    def generate_interactive_data(self):
        """生成完整的交互式数据包"""
        data_package = {
            'metadata': {
                'weeks': self.weeks_available,
                'total_records': len(self.df_all),
                'dimensions_available': self.dimensions,
                'generated_at': datetime.now().isoformat()
            },
            'weekly_trend': self.calculate_weekly_metrics(),
            'nev_trend': self.analyze_nev_trend(),
            'dimensions': {
                'branch': self.analyze_by_dimension('third_level_organization', top_n=10),
                'business_type': self.analyze_by_dimension('business_type_category', top_n=8),
                'insurance_type': self.analyze_by_dimension('insurance_type', top_n=None),
                'risk_grade': self.analyze_by_dimension('vehicle_insurance_grade', top_n=None)
            }
        }
        
        return data_package

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python multi_week_analyzer.py <data_pattern>")
        print("示例: python multi_week_analyzer.py 'data/week_*.csv'")
        sys.exit(1)
    
    data_pattern = sys.argv[1]
    
    analyzer = MultiWeekAnalyzer(data_pattern)
    analyzer.load_multi_week_data()
    
    data_package = analyzer.generate_interactive_data()
    
    # 输出 JSON
    print("\n" + "="*50)
    print(json.dumps(data_package, ensure_ascii=False, indent=2, cls=NumpyEncoder))

if __name__ == '__main__':
    main()
