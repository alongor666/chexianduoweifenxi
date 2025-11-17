#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
车险业务数据分析仪表板生成器

功能:
1. 单周综合分析 - 全面的业务指标分析
2. 多周趋势分析 - 时间序列对比
3. 专项分析 - 新能源车、分支机构、风险分级

使用方法:
    python scripts/generate_dashboard.py --input data/week_46.csv --output dashboard.html --mode comprehensive
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px


# 枚举值映射（与前端 fuzzy-matcher.ts 保持一致）
ENUM_MAPPINGS = {
    'insurance_type': {
        '商业保险': '商业险',
        '商险': '商业险',
        '商业': '商业险',
        '交强': '交强险',
        '交强保险': '交强险',
        '强制险': '交强险',
    }
}


class DashboardGenerator:
    """仪表板生成器"""

    def __init__(self, input_file: str, output_file: str, mode: str = 'comprehensive', theme: str = 'mckinsey'):
        self.input_file = input_file
        self.output_file = output_file
        self.mode = mode
        self.theme = theme
        self.df = None
        self.kpis = {}

        # 主题配色
        self.themes = {
            'mckinsey': {
                'primary': '#00A4E4',  # McKinsey 蓝
                'secondary': '#FF6F00',  # 橙色
                'success': '#00C853',  # 绿色
                'warning': '#FFB300',  # 黄色
                'danger': '#D32F2F',  # 红色
                'background': '#FFFFFF',
                'text': '#212121',
            },
            'apple': {
                'primary': '#007AFF',  # iOS 蓝
                'secondary': '#FF9500',  # iOS 橙
                'success': '#34C759',  # iOS 绿
                'warning': '#FFCC00',  # iOS 黄
                'danger': '#FF3B30',  # iOS 红
                'background': '#F9F9F9',
                'text': '#1C1C1E',
            }
        }

        self.colors = self.themes.get(theme, self.themes['mckinsey'])

    def load_data(self):
        """加载CSV数据"""
        print(f"\n📥 加载数据: {self.input_file}")

        try:
            # 读取CSV（UTF-8 with BOM）
            self.df = pd.read_csv(self.input_file, encoding='utf-8-sig')

            # 数据清洗：映射枚举值
            if 'insurance_type' in self.df.columns:
                self.df['insurance_type'] = self.df['insurance_type'].replace(
                    ENUM_MAPPINGS['insurance_type']
                )

            # 转换布尔值
            bool_cols = ['is_new_energy_vehicle', 'is_transferred_vehicle']
            for col in bool_cols:
                if col in self.df.columns:
                    self.df[col] = self.df[col].map({'True': True, 'False': False})

            print(f"✅ 数据加载成功: {len(self.df):,} 条记录")

            # 数据概览
            if 'week_number' in self.df.columns:
                weeks = self.df['week_number'].unique()
                print(f"   周次: {sorted(weeks)}")

            return True

        except Exception as e:
            print(f"❌ 数据加载失败: {e}")
            return False

    def calculate_kpis(self):
        """计算核心KPI指标"""
        print(f"\n📊 计算KPI指标...")

        df = self.df

        # 基础指标（元转万元）
        self.kpis['signed_premium'] = df['signed_premium_yuan'].sum() / 10000
        self.kpis['matured_premium'] = df['matured_premium_yuan'].sum() / 10000
        self.kpis['policy_count'] = df['policy_count'].sum()
        self.kpis['claim_case_count'] = df['claim_case_count'].sum()
        self.kpis['reported_claim_payment'] = df['reported_claim_payment_yuan'].sum() / 10000
        self.kpis['expense_amount'] = df['expense_amount_yuan'].sum() / 10000
        self.kpis['marginal_contribution'] = df['marginal_contribution_amount_yuan'].sum() / 10000

        # 比率指标
        if self.kpis['matured_premium'] > 0:
            self.kpis['loss_ratio'] = (self.kpis['reported_claim_payment'] / self.kpis['matured_premium']) * 100
            self.kpis['expense_ratio'] = (self.kpis['expense_amount'] / self.kpis['matured_premium']) * 100
            self.kpis['contribution_margin_ratio'] = (self.kpis['marginal_contribution'] / self.kpis['matured_premium']) * 100
        else:
            self.kpis['loss_ratio'] = 0
            self.kpis['expense_ratio'] = 0
            self.kpis['contribution_margin_ratio'] = 0

        if self.kpis['signed_premium'] > 0:
            self.kpis['maturity_ratio'] = (self.kpis['matured_premium'] / self.kpis['signed_premium']) * 100
        else:
            self.kpis['maturity_ratio'] = 0

        # 均值指标（元）
        if self.kpis['policy_count'] > 0:
            self.kpis['avg_premium'] = (df['signed_premium_yuan'].sum() / self.kpis['policy_count'])
            self.kpis['avg_expense'] = (df['expense_amount_yuan'].sum() / self.kpis['policy_count'])
            self.kpis['avg_contribution'] = (df['marginal_contribution_amount_yuan'].sum() / self.kpis['policy_count'])
        else:
            self.kpis['avg_premium'] = 0
            self.kpis['avg_expense'] = 0
            self.kpis['avg_contribution'] = 0

        if self.kpis['claim_case_count'] > 0:
            self.kpis['avg_claim'] = (df['reported_claim_payment_yuan'].sum() / self.kpis['claim_case_count'])
        else:
            self.kpis['avg_claim'] = 0

        print(f"✅ KPI计算完成")

    def create_kpi_cards(self) -> str:
        """生成KPI指标卡片HTML"""
        cards_html = """
        <div class="kpi-grid">
        """

        kpi_items = [
            ('签单保费', f"{self.kpis['signed_premium']:.2f} 万元", 'primary'),
            ('满期保费', f"{self.kpis['matured_premium']:.2f} 万元", 'primary'),
            ('保单件数', f"{self.kpis['policy_count']:,.0f} 件", 'secondary'),
            ('满期赔付率', f"{self.kpis['loss_ratio']:.2f}%",
             'danger' if self.kpis['loss_ratio'] > 70 else 'success'),
            ('费用率', f"{self.kpis['expense_ratio']:.2f}%",
             'warning' if self.kpis['expense_ratio'] > 15 else 'success'),
            ('边际贡献率', f"{self.kpis['contribution_margin_ratio']:.2f}%",
             'success' if self.kpis['contribution_margin_ratio'] > 30 else 'warning'),
            ('单均保费', f"{self.kpis['avg_premium']:.2f} 元", 'secondary'),
            ('案均赔款', f"{self.kpis['avg_claim']:.2f} 元", 'secondary'),
        ]

        for title, value, color in kpi_items:
            color_hex = self.colors[color]
            cards_html += f"""
            <div class="kpi-card">
                <div class="kpi-title">{title}</div>
                <div class="kpi-value" style="color: {color_hex};">{value}</div>
            </div>
            """

        cards_html += "</div>"
        return cards_html

    def create_business_type_chart(self):
        """生成业务类型分析图表"""
        df_agg = self.df.groupby('business_type_category').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'policy_count': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
        }).reset_index()

        df_agg['signed_premium_wan'] = df_agg['signed_premium_yuan'] / 10000
        df_agg['contribution_margin_ratio'] = (
            df_agg['marginal_contribution_amount_yuan'] / df_agg['matured_premium_yuan'] * 100
        ).round(2)

        df_agg = df_agg.sort_values('signed_premium_wan', ascending=False).head(10)

        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('保费规模 TOP10', '边际贡献率'),
            specs=[[{"type": "bar"}, {"type": "bar"}]]
        )

        # 保费规模
        fig.add_trace(
            go.Bar(
                x=df_agg['business_type_category'],
                y=df_agg['signed_premium_wan'],
                name='签单保费',
                marker_color=self.colors['primary'],
                text=df_agg['signed_premium_wan'].round(2),
                textposition='outside'
            ),
            row=1, col=1
        )

        # 边际贡献率
        fig.add_trace(
            go.Bar(
                x=df_agg['business_type_category'],
                y=df_agg['contribution_margin_ratio'],
                name='边际贡献率',
                marker_color=self.colors['secondary'],
                text=df_agg['contribution_margin_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='outside'
            ),
            row=1, col=2
        )

        fig.update_xaxes(tickangle=-45)
        fig.update_layout(
            height=500,
            showlegend=False,
            title_text="业务类型分析",
            title_font_size=20
        )

        return fig.to_html(include_plotlyjs=False, div_id="chart_business_type")

    def create_nev_comparison_chart(self):
        """生成新能源车对比图表"""
        df_nev = self.df.groupby('is_new_energy_vehicle').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'policy_count': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
        }).reset_index()

        df_nev['loss_ratio'] = (
            df_nev['reported_claim_payment_yuan'] / df_nev['matured_premium_yuan'] * 100
        ).round(2)

        df_nev['contribution_margin_ratio'] = (
            df_nev['marginal_contribution_amount_yuan'] / df_nev['matured_premium_yuan'] * 100
        ).round(2)

        df_nev['label'] = df_nev['is_new_energy_vehicle'].map({True: '新能源车', False: '传统车'})

        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('赔付率对比', '边际贡献率对比'),
            specs=[[{"type": "bar"}, {"type": "bar"}]]
        )

        colors = [self.colors['success'], self.colors['primary']]

        fig.add_trace(
            go.Bar(
                x=df_nev['label'],
                y=df_nev['loss_ratio'],
                marker_color=colors,
                text=df_nev['loss_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='outside'
            ),
            row=1, col=1
        )

        fig.add_trace(
            go.Bar(
                x=df_nev['label'],
                y=df_nev['contribution_margin_ratio'],
                marker_color=colors,
                text=df_nev['contribution_margin_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='outside'
            ),
            row=1, col=2
        )

        fig.update_layout(
            height=400,
            showlegend=False,
            title_text="新能源车 vs 传统车",
            title_font_size=20
        )

        return fig.to_html(include_plotlyjs=False, div_id="chart_nev")

    def create_organization_chart(self):
        """生成三级机构绩效图表"""
        df_org = self.df.groupby('third_level_organization').agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'policy_count': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
        }).reset_index()

        df_org['signed_premium_wan'] = df_org['signed_premium_yuan'] / 10000
        df_org['contribution_margin_ratio'] = (
            df_org['marginal_contribution_amount_yuan'] / df_org['matured_premium_yuan'] * 100
        ).round(2)

        df_org = df_org.sort_values('signed_premium_wan', ascending=True)

        fig = go.Figure()

        fig.add_trace(go.Bar(
            y=df_org['third_level_organization'],
            x=df_org['signed_premium_wan'],
            orientation='h',
            marker_color=self.colors['primary'],
            text=df_org['signed_premium_wan'].round(2),
            textposition='outside'
        ))

        fig.update_layout(
            height=500,
            title_text="三级机构保费规模",
            title_font_size=20,
            xaxis_title="签单保费 (万元)",
            yaxis_title=""
        )

        return fig.to_html(include_plotlyjs=False, div_id="chart_organization")

    def create_coverage_type_chart(self):
        """生成险别组合分析图表"""
        df_cov = self.df.groupby('coverage_type').agg({
            'signed_premium_yuan': 'sum',
            'policy_count': 'sum',
        }).reset_index()

        df_cov['signed_premium_wan'] = df_cov['signed_premium_yuan'] / 10000

        fig = go.Figure(data=[go.Pie(
            labels=df_cov['coverage_type'],
            values=df_cov['signed_premium_wan'],
            hole=.4,
            marker_colors=[self.colors['primary'], self.colors['secondary'], self.colors['success']],
            textinfo='label+percent',
            textposition='outside'
        )])

        fig.update_layout(
            height=400,
            title_text="险别组合占比",
            title_font_size=20
        )

        return fig.to_html(include_plotlyjs=False, div_id="chart_coverage")

    def generate_html(self):
        """生成完整的HTML仪表板"""
        print(f"\n🎨 生成仪表板...")

        # 获取周次信息
        week_info = ""
        if 'week_number' in self.df.columns and 'policy_start_year' in self.df.columns:
            year = self.df['policy_start_year'].iloc[0]
            week = self.df['week_number'].iloc[0]
            week_info = f" - {year}年第{week}周"

        # 生成图表
        kpi_cards = self.create_kpi_cards()
        business_chart = self.create_business_type_chart()
        nev_chart = self.create_nev_comparison_chart()
        org_chart = self.create_organization_chart()
        coverage_chart = self.create_coverage_type_chart()

        # 完整HTML
        html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>车险业务分析仪表板{week_info}</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: {self.colors['background']};
            color: {self.colors['text']};
            padding: 20px;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .header {{
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}

        .header h1 {{
            font-size: 32px;
            color: {self.colors['primary']};
            margin-bottom: 10px;
        }}

        .header .subtitle {{
            color: #666;
            font-size: 16px;
        }}

        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}

        .kpi-card {{
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }}

        .kpi-card:hover {{
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }}

        .kpi-title {{
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
            font-weight: 500;
        }}

        .kpi-value {{
            font-size: 28px;
            font-weight: 700;
        }}

        .chart-container {{
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }}

        .footer {{
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #999;
            font-size: 14px;
        }}

        @media print {{
            body {{
                background: white;
            }}
            .chart-container {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>车险业务分析仪表板{week_info}</h1>
            <div class="subtitle">
                多维度业务洞察 | 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </div>
        </div>

        <h2 style="margin-bottom: 20px; color: {self.colors['primary']};">📊 核心指标概览</h2>
        {kpi_cards}

        <h2 style="margin: 40px 0 20px; color: {self.colors['primary']};">📈 业务维度分析</h2>

        <div class="chart-container">
            {business_chart}
        </div>

        <div class="chart-container">
            {nev_chart}
        </div>

        <div class="chart-container">
            {org_chart}
        </div>

        <div class="chart-container">
            {coverage_chart}
        </div>

        <div class="footer">
            🤖 Generated with Claude Code | 车险业务分析平台
        </div>
    </div>
</body>
</html>
        """

        # 保存文件
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"✅ 仪表板已生成: {self.output_file}")
        print(f"   文件大小: {Path(self.output_file).stat().st_size / 1024:.2f} KB")

    def generate(self):
        """执行完整的生成流程"""
        try:
            print("=" * 80)
            print("🚀 车险业务分析仪表板生成器")
            print("=" * 80)

            # 1. 加载数据
            if not self.load_data():
                return False

            # 2. 计算KPI
            self.calculate_kpis()

            # 3. 生成HTML
            self.generate_html()

            print("\n" + "=" * 80)
            print("🎉 仪表板生成成功！")
            print("=" * 80)
            print(f"\n📂 输出文件: {Path(self.output_file).absolute()}")
            print(f"💡 提示: 在浏览器中打开 {self.output_file} 查看交互式仪表板")

            return True

        except Exception as e:
            print(f"\n❌ 生成失败: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='车险业务分析仪表板生成器')
    parser.add_argument('--input', '-i', required=True, help='输入CSV文件路径')
    parser.add_argument('--output', '-o', default='dashboard.html', help='输出HTML文件路径')
    parser.add_argument('--mode', '-m', default='comprehensive',
                       choices=['comprehensive', 'nev', 'branch', 'risk'],
                       help='分析模式: comprehensive(综合), nev(新能源), branch(分支机构), risk(风险)')
    parser.add_argument('--theme', '-t', default='mckinsey',
                       choices=['mckinsey', 'apple'],
                       help='主题风格: mckinsey, apple')

    args = parser.parse_args()

    generator = DashboardGenerator(args.input, args.output, args.mode, args.theme)
    success = generator.generate()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
