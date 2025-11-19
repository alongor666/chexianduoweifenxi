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
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
import numpy as np


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


def get_week_date_range(year: int, week: int) -> str:
    """
    获取指定周的日期范围

    Args:
        year: 年份
        week: 周数

    Returns:
        日期范围字符串，格式：MM/DD-MM/DD
    """
    # ISO 8601周历：周一为一周的第一天
    # 计算该年第1周的第1天（周一）
    jan4 = datetime(year, 1, 4)  # ISO规定：包含1月4日的周为第1周
    week1_monday = jan4 - timedelta(days=jan4.weekday())

    # 计算目标周的周一
    target_monday = week1_monday + timedelta(weeks=week - 1)
    target_sunday = target_monday + timedelta(days=6)

    # 格式化日期
    return f"{target_monday.month}/{target_monday.day}-{target_sunday.month}/{target_sunday.day}"


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

    def create_weekly_trend_chart(self):
        """
        生成周度经营趋势分析图表
        包含橙色风险点下钻功能（三级机构→业务类型→险别组合→新转续状态）
        """
        # 检查是否有周数据
        if 'week_number' not in self.df.columns:
            return ""

        # 按周汇总核心指标
        df_weekly = self.df.groupby(['policy_start_year', 'week_number']).agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
            'policy_count': 'sum',
        }).reset_index()

        # 计算关键比率
        df_weekly['loss_ratio'] = (
            df_weekly['reported_claim_payment_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0).round(2)

        df_weekly['expense_ratio'] = (
            df_weekly['expense_amount_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0).round(2)

        df_weekly['contribution_margin_ratio'] = (
            df_weekly['marginal_contribution_amount_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0).round(2)

        df_weekly['signed_premium_wan'] = df_weekly['signed_premium_yuan'] / 10000

        # 生成周标签（包含日期范围）
        df_weekly['week_label'] = df_weekly.apply(
            lambda row: f"第{int(row['week_number'])}周\n({get_week_date_range(int(row['policy_start_year']), int(row['week_number']))})",
            axis=1
        )

        # 识别风险点（赔付率>70%或费用率>15%）
        df_weekly['is_risk'] = (
            (df_weekly['loss_ratio'] > 70) | (df_weekly['expense_ratio'] > 15)
        )

        # 创建带下钻功能的图表
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=(
                '保费规模趋势',
                '赔付率与费用率趋势',
                '边际贡献率趋势'
            ),
            vertical_spacing=0.12,
            row_heights=[0.33, 0.33, 0.33]
        )

        # 1. 保费规模趋势
        fig.add_trace(
            go.Scatter(
                x=df_weekly['week_label'],
                y=df_weekly['signed_premium_wan'],
                mode='lines+markers+text',
                name='签单保费',
                line=dict(color=self.colors['primary'], width=3),
                marker=dict(size=10),
                text=df_weekly['signed_premium_wan'].round(1),
                textposition='top center',
                textfont=dict(size=10),
                hovertemplate='<b>%{x}</b><br>签单保费: %{y:.2f} 万元<extra></extra>'
            ),
            row=1, col=1
        )

        # 2. 赔付率趋势（带风险点标记）
        colors = [self.colors['secondary'] if risk else self.colors['primary']
                 for risk in df_weekly['is_risk']]

        fig.add_trace(
            go.Scatter(
                x=df_weekly['week_label'],
                y=df_weekly['loss_ratio'],
                mode='lines+markers+text',
                name='赔付率',
                line=dict(color=self.colors['danger'], width=2),
                marker=dict(
                    size=12,
                    color=colors,
                    line=dict(width=2, color='white')
                ),
                text=df_weekly['loss_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='top center',
                textfont=dict(size=10),
                customdata=df_weekly[['policy_start_year', 'week_number']],
                hovertemplate='<b>%{x}</b><br>赔付率: %{y:.1f}%<br><i>点击下钻查看详情</i><extra></extra>'
            ),
            row=2, col=1
        )

        # 3. 费用率趋势
        fig.add_trace(
            go.Scatter(
                x=df_weekly['week_label'],
                y=df_weekly['expense_ratio'],
                mode='lines+markers+text',
                name='费用率',
                line=dict(color=self.colors['warning'], width=2),
                marker=dict(size=10),
                text=df_weekly['expense_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='bottom center',
                textfont=dict(size=10),
                hovertemplate='<b>%{x}</b><br>费用率: %{y:.1f}%<extra></extra>'
            ),
            row=2, col=1
        )

        # 4. 边际贡献率趋势
        fig.add_trace(
            go.Scatter(
                x=df_weekly['week_label'],
                y=df_weekly['contribution_margin_ratio'],
                mode='lines+markers+text',
                name='边际贡献率',
                line=dict(color=self.colors['success'], width=3),
                marker=dict(size=10),
                text=df_weekly['contribution_margin_ratio'].apply(lambda x: f"{x:.1f}%"),
                textposition='top center',
                textfont=dict(size=10),
                hovertemplate='<b>%{x}</b><br>边际贡献率: %{y:.1f}%<extra></extra>'
            ),
            row=3, col=1
        )

        # 添加风险阈值线
        fig.add_hline(y=70, line_dash="dash", line_color="red", opacity=0.5,
                     annotation_text="赔付率警戒线(70%)", row=2, col=1)
        fig.add_hline(y=15, line_dash="dash", line_color="orange", opacity=0.5,
                     annotation_text="费用率警戒线(15%)", row=2, col=1)

        # 更新布局
        fig.update_xaxes(title_text="", row=1, col=1)
        fig.update_xaxes(title_text="", row=2, col=1)
        fig.update_xaxes(title_text="周次", row=3, col=1)

        fig.update_yaxes(title_text="保费 (万元)", row=1, col=1)
        fig.update_yaxes(title_text="比率 (%)", row=2, col=1)
        fig.update_yaxes(title_text="比率 (%)", row=3, col=1)

        fig.update_layout(
            height=1000,
            showlegend=True,
            hovermode='x unified',
            title_text="周度经营趋势分析",
            title_font_size=20
        )

        return fig.to_html(include_plotlyjs=False, div_id="chart_weekly_trend")

    def generate_weekly_insights(self) -> str:
        """
        生成周度趋势的文字洞察（不包含管理建议）
        """
        if 'week_number' not in self.df.columns:
            return ""

        # 按周汇总
        df_weekly = self.df.groupby(['policy_start_year', 'week_number']).agg({
            'signed_premium_yuan': 'sum',
            'matured_premium_yuan': 'sum',
            'reported_claim_payment_yuan': 'sum',
            'expense_amount_yuan': 'sum',
            'marginal_contribution_amount_yuan': 'sum',
        }).reset_index()

        df_weekly['loss_ratio'] = (
            df_weekly['reported_claim_payment_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0)

        df_weekly['expense_ratio'] = (
            df_weekly['expense_amount_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0)

        df_weekly['contribution_margin_ratio'] = (
            df_weekly['marginal_contribution_amount_yuan'] / df_weekly['matured_premium_yuan'] * 100
        ).fillna(0)

        insights = []

        # 保费趋势洞察
        if len(df_weekly) > 1:
            premium_change = (
                (df_weekly.iloc[-1]['signed_premium_yuan'] - df_weekly.iloc[0]['signed_premium_yuan'])
                / df_weekly.iloc[0]['signed_premium_yuan'] * 100
            )
            trend = "上升" if premium_change > 0 else "下降"
            insights.append(
                f"📈 <strong>保费趋势</strong>：期间保费整体呈{trend}趋势，变动幅度{abs(premium_change):.1f}%"
            )

        # 风险点识别
        risk_weeks = df_weekly[
            (df_weekly['loss_ratio'] > 70) | (df_weekly['expense_ratio'] > 15)
        ]
        if len(risk_weeks) > 0:
            risk_week_nums = risk_weeks['week_number'].tolist()
            insights.append(
                f"⚠️ <strong>风险周次</strong>：第{', '.join(map(str, [int(w) for w in risk_week_nums]))}周存在风险点（赔付率>70%或费用率>15%），<span style='color:{self.colors['secondary']};font-weight:bold;'>点击橙色风险点可下钻查看详情</span>"
            )

        # 边际贡献表现
        avg_margin = df_weekly['contribution_margin_ratio'].mean()
        performance = "优秀" if avg_margin > 35 else "良好" if avg_margin > 30 else "需改善"
        insights.append(
            f"💰 <strong>盈利能力</strong>：平均边际贡献率{avg_margin:.1f}%，整体表现{performance}"
        )

        # 生成HTML
        insights_html = '<div class="insights-box">'
        insights_html += '<h3 style="margin-bottom: 15px; color: ' + self.colors['primary'] + ';">📊 数据洞察</h3>'
        insights_html += '<ul style="line-height: 2; padding-left: 20px;">'
        for insight in insights:
            insights_html += f'<li>{insight}</li>'
        insights_html += '</ul>'
        insights_html += '</div>'

        return insights_html

    def create_drilldown_data(self):
        """
        创建下钻数据（三级机构→业务类型→险别组合→新转续状态）
        返回JSON格式的下钻数据，供前端JavaScript使用
        """
        if 'week_number' not in self.df.columns:
            return "{}"

        drilldown_data = {}

        # 获取所有周次
        weeks = self.df['week_number'].unique()

        for week in weeks:
            week_key = f"week_{int(week)}"
            week_data = self.df[self.df['week_number'] == week]

            # 第1层：三级机构
            org_agg = week_data.groupby('third_level_organization').agg({
                'matured_premium_yuan': 'sum',
                'reported_claim_payment_yuan': 'sum',
                'expense_amount_yuan': 'sum',
            }).reset_index()

            org_agg['loss_ratio'] = (
                org_agg['reported_claim_payment_yuan'] / org_agg['matured_premium_yuan'] * 100
            ).round(2)

            org_agg['expense_ratio'] = (
                org_agg['expense_amount_yuan'] / org_agg['matured_premium_yuan'] * 100
            ).round(2)

            drilldown_data[week_key] = {
                'organizations': org_agg.to_dict('records'),
                'business_types': {},
                'coverage_types': {},
                'renewal_status': {}
            }

            # 第2层：业务类型（按三级机构）
            for org in org_agg['third_level_organization']:
                org_week_data = week_data[week_data['third_level_organization'] == org]
                business_agg = org_week_data.groupby('business_type_category').agg({
                    'matured_premium_yuan': 'sum',
                    'reported_claim_payment_yuan': 'sum',
                    'expense_amount_yuan': 'sum',
                }).reset_index()

                business_agg['loss_ratio'] = (
                    business_agg['reported_claim_payment_yuan'] / business_agg['matured_premium_yuan'] * 100
                ).round(2)

                drilldown_data[week_key]['business_types'][org] = business_agg.to_dict('records')

                # 第3层：险别组合（按业务类型）
                for biz in business_agg['business_type_category']:
                    biz_data = org_week_data[org_week_data['business_type_category'] == biz]
                    coverage_agg = biz_data.groupby('coverage_type').agg({
                        'matured_premium_yuan': 'sum',
                        'reported_claim_payment_yuan': 'sum',
                    }).reset_index()

                    coverage_agg['loss_ratio'] = (
                        coverage_agg['reported_claim_payment_yuan'] / coverage_agg['matured_premium_yuan'] * 100
                    ).round(2)

                    drilldown_data[week_key]['coverage_types'][f"{org}_{biz}"] = coverage_agg.to_dict('records')

                    # 第4层：新转续状态（按险别组合）
                    for cov in coverage_agg['coverage_type']:
                        cov_data = biz_data[biz_data['coverage_type'] == cov]

                        # 使用新转续标志字段
                        if 'is_transferred_vehicle' in cov_data.columns:
                            renewal_agg = cov_data.groupby('is_transferred_vehicle').agg({
                                'matured_premium_yuan': 'sum',
                                'reported_claim_payment_yuan': 'sum',
                            }).reset_index()

                            renewal_agg['loss_ratio'] = (
                                renewal_agg['reported_claim_payment_yuan'] / renewal_agg['matured_premium_yuan'] * 100
                            ).round(2)

                            renewal_agg['status'] = renewal_agg['is_transferred_vehicle'].map({
                                True: '转保',
                                False: '续保'
                            })

                            drilldown_data[week_key]['renewal_status'][f"{org}_{biz}_{cov}"] = renewal_agg.to_dict('records')

        import json
        return json.dumps(drilldown_data, ensure_ascii=False, indent=2)

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

        # 生成周度趋势分析（如果有周数据）
        weekly_insights = self.generate_weekly_insights()
        weekly_trend_chart = self.create_weekly_trend_chart()
        drilldown_data_json = self.create_drilldown_data()

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

        .insights-box {{
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border-left: 4px solid {self.colors['primary']};
        }}

        .insights-box ul {{
            margin: 0;
            padding-left: 20px;
        }}

        .insights-box li {{
            margin-bottom: 10px;
            line-height: 1.8;
        }}

        .drilldown-modal {{
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }}

        .drilldown-content {{
            background-color: white;
            margin: 5% auto;
            padding: 30px;
            border-radius: 12px;
            width: 80%;
            max-width: 900px;
            max-height: 80vh;
            overflow-y: auto;
        }}

        .close-button {{
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }}

        .close-button:hover {{
            color: #000;
        }}

        .drilldown-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}

        .drilldown-table th,
        .drilldown-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}

        .drilldown-table th {{
            background-color: {self.colors['primary']};
            color: white;
            font-weight: 600;
        }}

        .drilldown-table tr:hover {{
            background-color: #f5f5f5;
            cursor: pointer;
        }}

        .breadcrumb {{
            padding: 10px 0;
            margin-bottom: 20px;
            color: #666;
        }}

        .breadcrumb a {{
            color: {self.colors['primary']};
            text-decoration: none;
            cursor: pointer;
        }}

        .breadcrumb a:hover {{
            text-decoration: underline;
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

        <!-- 周度趋势分析板块 -->
        {'<h2 style="margin: 40px 0 20px; color: ' + self.colors['primary'] + ';">📈 周度经营趋势分析</h2>' if weekly_trend_chart else ''}

        {weekly_insights if weekly_insights else ''}

        {'<div class="chart-container">' + weekly_trend_chart + '</div>' if weekly_trend_chart else ''}

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

        <!-- 下钻模态框 -->
        <div id="drilldownModal" class="drilldown-modal">
            <div class="drilldown-content">
                <span class="close-button" onclick="closeDrilldown()">&times;</span>
                <div class="breadcrumb" id="breadcrumb"></div>
                <div id="drilldownContent"></div>
            </div>
        </div>

        <div class="footer">
            🤖 Generated with Claude Code | 车险业务分析平台
        </div>
    </div>

    <script>
    // 下钻数据
    const drilldownData = {drilldown_data_json};

    // 当前下钻状态
    let currentDrilldown = {{
        week: null,
        level: 0,  // 0: 初始, 1: 三级机构, 2: 业务类型, 3: 险别组合, 4: 新转续状态
        organization: null,
        businessType: null,
        coverageType: null
    }};

    // 监听图表点击事件（橙色风险点）
    document.addEventListener('DOMContentLoaded', function() {{
        const chartDiv = document.getElementById('chart_weekly_trend');
        if (chartDiv) {{
            chartDiv.on('plotly_click', function(data) {{
                const point = data.points[0];
                // 检查是否点击的是风险点（橙色标记）
                if (point.curveNumber === 1) {{  // 赔付率曲线
                    const weekNum = point.customdata[1];
                    showDrilldown(weekNum, 1);
                }}
            }});
        }}
    }});

    function showDrilldown(week, level) {{
        const weekKey = `week_${{week}}`;
        if (!drilldownData[weekKey]) {{
            alert('暂无该周的下钻数据');
            return;
        }}

        currentDrilldown.week = week;
        currentDrilldown.level = level;

        const modal = document.getElementById('drilldownModal');
        modal.style.display = 'block';

        updateBreadcrumb();
        updateDrilldownContent();
    }}

    function updateBreadcrumb() {{
        const breadcrumb = document.getElementById('breadcrumb');
        let html = `<a onclick="closeDrilldown()">周度趋势</a> &gt; `;
        html += `<a onclick="showDrilldown(${{currentDrilldown.week}}, 1)">第${{currentDrilldown.week}}周</a>`;

        if (currentDrilldown.level >= 2) {{
            html += ` &gt; <a onclick="showDrilldown(${{currentDrilldown.week}}, 2)">${{currentDrilldown.organization}}</a>`;
        }}
        if (currentDrilldown.level >= 3) {{
            html += ` &gt; <a onclick="showDrilldown(${{currentDrilldown.week}}, 3)">${{currentDrilldown.businessType}}</a>`;
        }}
        if (currentDrilldown.level >= 4) {{
            html += ` &gt; ${{currentDrilldown.coverageType}}`;
        }}

        breadcrumb.innerHTML = html;
    }}

    function updateDrilldownContent() {{
        const weekKey = `week_${{currentDrilldown.week}}`;
        const content = document.getElementById('drilldownContent');

        let html = '';

        if (currentDrilldown.level === 1) {{
            // 显示三级机构
            html = '<h3>三级机构风险分析</h3>';
            html += '<table class="drilldown-table">';
            html += '<thead><tr><th>三级机构</th><th>赔付率</th><th>费用率</th><th>操作</th></tr></thead><tbody>';

            const orgs = drilldownData[weekKey].organizations;
            orgs.forEach(org => {{
                const riskClass = (org.loss_ratio > 70 || org.expense_ratio > 15) ?
                    'style="background-color: #FFF3E0;"' : '';
                html += `<tr ${{riskClass}}>`;
                html += `<td>${{org.third_level_organization}}</td>`;
                html += `<td>${{org.loss_ratio.toFixed(2)}}%</td>`;
                html += `<td>${{org.expense_ratio.toFixed(2)}}%</td>`;
                html += `<td><a onclick="drillToBusinessType('${{org.third_level_organization}}')" style="color: {self.colors['primary']}; cursor: pointer;">查看业务类型 &gt;</a></td>`;
                html += '</tr>';
            }});
            html += '</tbody></table>';
        }}
        else if (currentDrilldown.level === 2) {{
            // 显示业务类型
            html = `<h3>${{currentDrilldown.organization}} - 业务类型分析</h3>`;
            html += '<table class="drilldown-table">';
            html += '<thead><tr><th>业务类型</th><th>赔付率</th><th>操作</th></tr></thead><tbody>';

            const bizTypes = drilldownData[weekKey].business_types[currentDrilldown.organization] || [];
            bizTypes.forEach(biz => {{
                html += '<tr>';
                html += `<td>${{biz.business_type_category}}</td>`;
                html += `<td>${{biz.loss_ratio.toFixed(2)}}%</td>`;
                html += `<td><a onclick="drillToCoverageType('${{biz.business_type_category}}')" style="color: {self.colors['primary']}; cursor: pointer;">查看险别组合 &gt;</a></td>`;
                html += '</tr>';
            }});
            html += '</tbody></table>';
        }}
        else if (currentDrilldown.level === 3) {{
            // 显示险别组合
            html = `<h3>${{currentDrilldown.organization}} - ${{currentDrilldown.businessType}} - 险别组合分析</h3>`;
            html += '<table class="drilldown-table">';
            html += '<thead><tr><th>险别组合</th><th>赔付率</th><th>操作</th></tr></thead><tbody>';

            const coverageKey = `${{currentDrilldown.organization}}_${{currentDrilldown.businessType}}`;
            const coverages = drilldownData[weekKey].coverage_types[coverageKey] || [];
            coverages.forEach(cov => {{
                html += '<tr>';
                html += `<td>${{cov.coverage_type}}</td>`;
                html += `<td>${{cov.loss_ratio.toFixed(2)}}%</td>`;
                html += `<td><a onclick="drillToRenewalStatus('${{cov.coverage_type}}')" style="color: {self.colors['primary']}; cursor: pointer;">查看新转续 &gt;</a></td>`;
                html += '</tr>';
            }});
            html += '</tbody></table>';
        }}
        else if (currentDrilldown.level === 4) {{
            // 显示新转续状态
            html = `<h3>${{currentDrilldown.organization}} - ${{currentDrilldown.businessType}} - ${{currentDrilldown.coverageType}} - 新转续分析</h3>`;
            html += '<table class="drilldown-table">';
            html += '<thead><tr><th>状态</th><th>赔付率</th></tr></thead><tbody>';

            const renewalKey = `${{currentDrilldown.organization}}_${{currentDrilldown.businessType}}_${{currentDrilldown.coverageType}}`;
            const renewals = drilldownData[weekKey].renewal_status[renewalKey] || [];
            renewals.forEach(renewal => {{
                html += '<tr>';
                html += `<td>${{renewal.status}}</td>`;
                html += `<td>${{renewal.loss_ratio.toFixed(2)}}%</td>`;
                html += '</tr>';
            }});
            html += '</tbody></table>';
        }}

        content.innerHTML = html;
    }}

    function drillToBusinessType(org) {{
        currentDrilldown.organization = org;
        currentDrilldown.level = 2;
        updateBreadcrumb();
        updateDrilldownContent();
    }}

    function drillToCoverageType(bizType) {{
        currentDrilldown.businessType = bizType;
        currentDrilldown.level = 3;
        updateBreadcrumb();
        updateDrilldownContent();
    }}

    function drillToRenewalStatus(coverageType) {{
        currentDrilldown.coverageType = coverageType;
        currentDrilldown.level = 4;
        updateBreadcrumb();
        updateDrilldownContent();
    }}

    function closeDrilldown() {{
        const modal = document.getElementById('drilldownModal');
        modal.style.display = 'none';
        currentDrilldown = {{
            week: null,
            level: 0,
            organization: null,
            businessType: null,
            coverageType: null
        }};
    }}

    // 点击模态框外部关闭
    window.onclick = function(event) {{
        const modal = document.getElementById('drilldownModal');
        if (event.target === modal) {{
            closeDrilldown();
        }}
    }}
    </script>
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
