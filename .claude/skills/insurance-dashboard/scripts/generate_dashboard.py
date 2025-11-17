#!/usr/bin/env python3
"""
车险业务分析仪表板生成器
自动处理保单数据并生成交互式 HTML 仪表板
"""

import pandas as pd
import json
import sys
from pathlib import Path
from datetime import datetime

class InsuranceDashboard:
    """车险业务分析仪表板生成器"""
    
    def __init__(self, data_path, mode='comprehensive'):
        """
        初始化仪表板生成器
        
        Args:
            data_path: CSV 数据文件路径
            mode: 分析模式 (comprehensive/nev/branch/risk)
        """
        self.data_path = data_path
        self.mode = mode
        self.df = None
        self.metrics = {}
        
    def load_data(self):
        """加载并验证数据"""
        try:
            self.df = pd.read_csv(self.data_path, encoding='utf-8-sig')
            print(f"✓ 成功加载 {len(self.df)} 条记录")
            return True
        except Exception as e:
            print(f"✗ 数据加载失败: {e}")
            return False
    
    def calculate_metrics(self):
        """计算核心指标"""
        # 赔付率
        total_claim = self.df['reported_claim_payment_yuan'].sum()
        total_matured = self.df['matured_premium_yuan'].sum()
        loss_ratio = (total_claim / total_matured * 100) if total_matured > 0 else 0
        
        # 费用率
        total_expense = self.df['expense_amount_yuan'].sum()
        total_signed = self.df['signed_premium_yuan'].sum()
        expense_ratio = (total_expense / total_signed * 100) if total_signed > 0 else 0
        
        # 综合成本率
        combined_ratio = loss_ratio + expense_ratio
        
        # 边际贡献
        total_margin = self.df['marginal_contribution_amount_yuan'].sum()
        margin_ratio = (total_margin / total_signed * 100) if total_signed > 0 else 0
        
        # 出险率
        total_policies = self.df['policy_count'].sum()
        total_claims = self.df['claim_case_count'].sum()
        claim_freq = (total_claims / total_policies * 100) if total_policies > 0 else 0
        
        self.metrics = {
            'loss_ratio': round(loss_ratio, 2),
            'expense_ratio': round(expense_ratio, 2),
            'combined_ratio': round(combined_ratio, 2),
            'margin_ratio': round(margin_ratio, 2),
            'claim_frequency': round(claim_freq, 2),
            'total_premium': round(total_signed / 10000, 2),  # 万元
            'total_policies': int(total_policies),
            'total_margin': round(total_margin / 10000, 2)  # 万元
        }
        
        return self.metrics
    
    def analyze_by_nev(self):
        """新能源车专项分析"""
        nev_data = self.df.groupby('is_new_energy_vehicle').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
            'policy_count': 'sum',
            'claim_case_count': 'sum'
        })
        
        result = {}
        for is_nev, row in nev_data.iterrows():
            label = "新能源车" if is_nev else "传统车"
            loss_ratio = (row['reported_claim_payment_yuan'] / row['matured_premium_yuan'] * 100) if row['matured_premium_yuan'] > 0 else 0
            expense_ratio = (row['expense_amount_yuan'] / row['signed_premium_yuan'] * 100) if row['signed_premium_yuan'] > 0 else 0
            
            result[label] = {
                'premium': round(row['signed_premium_yuan'] / 10000, 2),
                'policies': int(row['policy_count']),
                'loss_ratio': round(loss_ratio, 2),
                'expense_ratio': round(expense_ratio, 2),
                'combined_ratio': round(loss_ratio + expense_ratio, 2),
                'margin': round(row['marginal_contribution_amount_yuan'] / 10000, 2)
            }
        
        return result
    
    def analyze_by_branch(self):
        """分支机构绩效分析"""
        branch_data = self.df.groupby('third_level_organization').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
            'policy_count': 'sum'
        }).reset_index()
        
        # 计算各项指标
        branch_data['loss_ratio'] = (
            branch_data['reported_claim_payment_yuan'] / 
            branch_data['matured_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        branch_data['expense_ratio'] = (
            branch_data['expense_amount_yuan'] / 
            branch_data['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        branch_data['combined_ratio'] = (
            branch_data['loss_ratio'] + branch_data['expense_ratio']
        ).round(2)
        
        branch_data['margin_ratio'] = (
            branch_data['marginal_contribution_amount_yuan'] / 
            branch_data['signed_premium_yuan'] * 100
        ).fillna(0).round(2)
        
        # 按保费排序，取前10
        top_branches = branch_data.nlargest(10, 'signed_premium_yuan')
        
        return top_branches.to_dict('records')
    
    def analyze_by_risk(self):
        """风险分级分析"""
        risk_data = self.df[self.df['vehicle_insurance_grade'].notna()].groupby('vehicle_insurance_grade').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'policy_count': 'sum',
            'claim_case_count': 'sum'
        })
        
        result = {}
        for grade in ['A', 'B', 'C', 'D', 'E']:
            if grade in risk_data.index:
                row = risk_data.loc[grade]
                loss_ratio = (row['reported_claim_payment_yuan'] / row['matured_premium_yuan'] * 100) if row['matured_premium_yuan'] > 0 else 0
                claim_freq = (row['claim_case_count'] / row['policy_count'] * 100) if row['policy_count'] > 0 else 0
                
                result[grade] = {
                    'premium': round(row['signed_premium_yuan'] / 10000, 2),
                    'policies': int(row['policy_count']),
                    'loss_ratio': round(loss_ratio, 2),
                    'claim_frequency': round(claim_freq, 2)
                }
        
        return result
    
    def generate_html(self, output_path):
        """生成交互式 HTML 仪表板"""
        # 根据模式选择分析数据
        if self.mode == 'nev':
            analysis_data = self.analyze_by_nev()
            chart_type = 'nev_comparison'
        elif self.mode == 'branch':
            analysis_data = self.analyze_by_branch()
            chart_type = 'branch_performance'
        elif self.mode == 'risk':
            analysis_data = self.analyze_by_risk()
            chart_type = 'risk_analysis'
        else:
            analysis_data = None
            chart_type = 'comprehensive'
        
        # HTML 模板将由调用者提供或使用默认模板
        # 这里返回数据供外部使用
        return {
            'metrics': self.metrics,
            'analysis_data': analysis_data,
            'chart_type': chart_type,
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python generate_dashboard.py <data.csv> [mode]")
        print("模式: comprehensive | nev | branch | risk")
        sys.exit(1)
    
    data_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'comprehensive'
    
    dashboard = InsuranceDashboard(data_path, mode)
    
    if dashboard.load_data():
        dashboard.calculate_metrics()
        result = dashboard.generate_html('output.html')
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
