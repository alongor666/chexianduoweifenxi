#!/usr/bin/env python3
"""
华安保险车险周报HTML可视化生成器
生成交互式网页仪表盘，支持标签页切换和下钻分析
"""

import sys
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

class HTMLDashboardGenerator:
    """HTML仪表盘生成器"""

    def __init__(self, data_file: str, week: int, organization: str, config_dir: str):
        """
        初始化生成器

        Args:
            data_file: 数据文件路径
            week: 周次
            organization: 机构名称
            config_dir: 配置文件目录
        """
        self.data_file = data_file
        self.week = week
        self.organization = organization
        self.config_dir = Path(config_dir)

        # 加载数据
        self.df = self._load_data()

        # 加载配置
        self.thresholds = self._load_config('thresholds.json')
        self.plans = self._load_config('plans.json', required=False)

        # 检测数据格式并选择正确的字段名
        is_raw = 'signed_premium_yuan' in self.df.columns
        org_field = 'third_level_organization' if is_raw else '机构'
        category_field = 'customer_category_3' if is_raw else '客户类别'

        # 计算聚合数据
        self.data_by_org = self._aggregate_by_dimension(org_field)
        self.data_by_category = self._aggregate_by_dimension(category_field)

    def _load_data(self) -> pd.DataFrame:
        """加载数据文件"""
        file_ext = Path(self.data_file).suffix.lower()

        if file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(self.data_file)
        elif file_ext == '.csv':
            df = pd.read_csv(self.data_file, encoding='utf-8')
        elif file_ext == '.json':
            df = pd.read_json(self.data_file)
        elif file_ext in ['.db', '.duckdb']:
            import duckdb
            conn = duckdb.connect(self.data_file)
            df = conn.execute("SELECT * FROM insurance_data").df()
            conn.close()
        else:
            raise ValueError(f"不支持的文件格式: {file_ext}")

        # 检测数据格式类型
        # 类型1: 原始CSV（包含金额字段）- 推荐
        # 类型2: 预处理CSV（包含已计算的比率）- 兼容旧数据

        raw_fields = ['signed_premium_yuan', 'matured_premium_yuan',
                      'reported_claim_payment_yuan', 'expense_amount_yuan']
        processed_fields = ['机构', '客户类别', '签单保费', '满期赔付率']

        is_raw_format = all(f in df.columns for f in raw_fields)
        is_processed_format = all(f in df.columns for f in processed_fields)

        if is_raw_format:
            print("✓ 检测到原始CSV格式，将使用标准KPI计算公式")
            # 不需要额外处理，在聚合时会正确计算
            return df
        elif is_processed_format:
            print("⚠️ 检测到预处理CSV格式（可能存在KPI计算误差）")
            return df
        else:
            available = list(df.columns)
            raise ValueError(
                f"无法识别数据格式。\n"
                f"期望格式1（原始CSV）: {raw_fields}\n"
                f"期望格式2（预处理CSV）: {processed_fields}\n"
                f"实际字段: {available}"
            )

        return df

    def _load_config(self, filename: str, required: bool = True) -> Optional[Dict]:
        """加载配置文件"""
        config_path = self.config_dir / filename

        if not config_path.exists():
            if required:
                print(f"警告: 配置文件 {filename} 不存在，使用默认配置")
                return self._get_default_config(filename)
            return None

        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _get_default_config(self, filename: str) -> Dict:
        """获取默认配置"""
        if filename == 'thresholds.json':
            return {
                "四象限基准线": {
                    "保费达成率": 100,
                    "变动成本率": 90,
                    "满期赔付率": 70,
                    "费用率": 18,
                    "出险率": 20,
                    "案均赔款": 6000
                },
                "问题机构识别阈值": {
                    "年保费未达标": 95,
                    "变动成本率超标": 95,
                    "满期赔付率超标": 75,
                    "费用率超标": 20
                }
            }
        return {}

    def _aggregate_by_dimension(self, dimension: str) -> List[Dict]:
        """按维度聚合数据"""
        # 检测数据格式
        is_raw = 'signed_premium_yuan' in self.df.columns
        original_dimension = dimension  # 保存原始dimension，因为后续会被重命名

        if is_raw:
            # 原始CSV格式：先聚合金额，再计算比率（标准KPI计算方法）
            grouped = self.df.groupby(dimension).agg({
                'signed_premium_yuan': 'sum',
                'matured_premium_yuan': 'sum',
                'reported_claim_payment_yuan': 'sum',
                'expense_amount_yuan': 'sum',
                'policy_count': 'sum',
                'claim_case_count': 'sum'
            }).reset_index()

            # 重命名为中文（保持兼容性）
            rename_dict = {
                'signed_premium_yuan': '签单保费',
                'matured_premium_yuan': '满期保费',
                'reported_claim_payment_yuan': '已报告赔款',
                'expense_amount_yuan': '费用额',
                'policy_count': '保单件数',
                'claim_case_count': '赔案件数',
                'third_level_organization': '机构',
                'customer_category_3': '客户类别'
            }
            grouped.rename(columns=rename_dict, inplace=True)

            # 确定重命名后的dimension字段名
            if original_dimension in rename_dict:
                dimension = rename_dict[original_dimension]

            # 安全除法函数
            def safe_divide(num, denom):
                return (num / denom) if denom > 0 else 0

            # 按标准KPI公式计算比率
            grouped['满期赔付率'] = grouped.apply(
                lambda x: safe_divide(x['已报告赔款'], x['满期保费']) * 100, axis=1
            )
            grouped['费用率'] = grouped.apply(
                lambda x: safe_divide(x['费用额'], x['签单保费']) * 100, axis=1
            )
            grouped['变动成本率'] = grouped['满期赔付率'] + grouped['费用率']
            grouped['出险率'] = grouped.apply(
                lambda x: safe_divide(x['赔案件数'], x['保单件数']) * 100, axis=1
            )
            grouped['案均赔款'] = grouped.apply(
                lambda x: safe_divide(x['已报告赔款'], x['赔案件数']), axis=1
            )

        else:
            # 预处理CSV格式（兼容旧数据，但可能不准确）
            grouped = self.df.groupby(dimension).agg({
                '签单保费': 'sum',
                '满期赔付率': 'mean',  # ⚠️ 简单平均，可能不准确
                '费用率': 'mean',
                '变动成本率': 'mean',
                '已报告赔款': 'sum',
                '出险率': 'mean',
                '案均赔款': 'mean'
            }).reset_index()

        # 计算占比
        total_premium = grouped['签单保费'].sum()
        grouped['保费占比'] = grouped['签单保费'] / total_premium * 100

        # 计算已报告赔款占比
        total_claims = grouped['已报告赔款'].sum()
        grouped['已报告赔款占比'] = grouped['已报告赔款'] / total_claims * 100 if total_claims > 0 else 0

        # 计算年计划达成率（优先使用原始数据中的保费计划字段）
        if is_raw and 'premium_plan_yuan' in self.df.columns:
            # 使用original_dimension聚合计划数据
            plan_data = self.df.groupby(original_dimension).agg({
                'premium_plan_yuan': 'sum'
            }).reset_index()

            # 重命名为中文字段（与grouped保持一致）
            rename_dict = {
                'third_level_organization': '机构',
                'customer_category_3': '客户类别'
            }

            if original_dimension in rename_dict:
                plan_data.rename(columns={original_dimension: rename_dict[original_dimension]}, inplace=True)
                dim_name = rename_dict[original_dimension]
            else:
                dim_name = original_dimension

            # 合并计划数据（此时grouped已经被重命名了，使用重命名后的dimension）
            grouped = grouped.merge(plan_data, on=dim_name, how='left')
            grouped['年计划达成率'] = grouped.apply(
                lambda x: (x['签单保费'] / x['premium_plan_yuan'] * 100) if x.get('premium_plan_yuan', 0) > 0 else None,
                axis=1
            )
        elif self.plans and '年度保费计划' in self.plans:
            # 使用配置文件中的计划数据
            grouped['年计划达成率'] = grouped.apply(
                lambda x: (x['签单保费'] / self.plans['年度保费计划'].get(x[dimension], 1)) * 100
                if x[dimension] in self.plans['年度保费计划'] else None,
                axis=1
            )
        else:
            # 没有计划数据，设置为None
            grouped['年计划达成率'] = None

        return grouped.to_dict('records')

    def _calculate_summary_metrics(self) -> Dict:
        """计算汇总指标"""
        # 检测数据格式
        is_raw = 'signed_premium_yuan' in self.df.columns

        if is_raw:
            # 原始CSV：先聚合金额，再计算比率
            total = self.df.agg({
                'signed_premium_yuan': 'sum',
                'matured_premium_yuan': 'sum',
                'reported_claim_payment_yuan': 'sum',
                'expense_amount_yuan': 'sum'
            })

            # 安全除法
            def safe_divide(num, denom):
                return (num / denom) if denom > 0 else 0

            # 按标准KPI公式计算
            matured_loss_ratio = safe_divide(
                total['reported_claim_payment_yuan'],
                total['matured_premium_yuan']
            ) * 100

            expense_ratio = safe_divide(
                total['expense_amount_yuan'],
                total['signed_premium_yuan']
            ) * 100

            variable_cost_ratio = matured_loss_ratio + expense_ratio

            return {
                '签单保费': float(total['signed_premium_yuan']),
                '满期赔付率': round(float(matured_loss_ratio), 2),
                '费用率': round(float(expense_ratio), 2),
                '变动成本率': round(float(variable_cost_ratio), 2),
                '已报告赔款': float(total['reported_claim_payment_yuan'])
            }

        else:
            # 预处理CSV（兼容旧格式，但可能不准确）
            total = self.df.agg({
                '签单保费': 'sum',
                '满期赔付率': 'mean',
                '费用率': 'mean',
                '变动成本率': 'mean',
                '已报告赔款': 'sum'
            })

            return {
                '签单保费': float(total['签单保费']),
                '满期赔付率': round(float(total['满期赔付率']), 2),
                '费用率': round(float(total['费用率']), 2),
                '变动成本率': round(float(total['变动成本率']), 2),
                '已报告赔款': float(total['已报告赔款'])
            }

    def _identify_problem_orgs(self) -> List[str]:
        """识别问题机构"""
        problems = []
        threshold = self.thresholds.get('问题机构识别阈值', {})

        for item in self.data_by_org:
            org = item['机构']

            # 检查各项指标
            if item.get('年计划达成率') and item['年计划达成率'] < threshold.get('年保费未达标', 95):
                problems.append(f"{org}(保费未达标)")

            if item['变动成本率'] > threshold.get('变动成本率超标', 95):
                problems.append(f"{org}(成本超标)")

            if item['满期赔付率'] > threshold.get('满期赔付率超标', 75):
                problems.append(f"{org}(赔付率高)")

            if item['费用率'] > threshold.get('费用率超标', 20):
                problems.append(f"{org}(费用率高)")

        return problems[:5]  # 最多返回5个问题机构

    def generate_html(self, output_path: Optional[str] = None) -> str:
        """
        生成HTML仪表盘

        Args:
            output_path: 输出文件路径（可选）

        Returns:
            生成的HTML文件路径
        """
        # 准备数据
        summary = self._calculate_summary_metrics()
        problems = self._identify_problem_orgs()

        # 生成HTML内容
        html_content = self._build_html_template(
            summary=summary,
            problems=problems,
            data_by_org=self.data_by_org,
            data_by_category=self.data_by_category,
            thresholds=self.thresholds
        )

        # 确定输出路径
        if output_path is None:
            timestamp = datetime.now().strftime('%Y%m%d')
            output_path = f"车险第{self.week}周经营分析_{self.organization}_{timestamp}.html"

        # 写入文件（使用UTF-8 BOM避免浏览器乱码）
        with open(output_path, 'w', encoding='utf-8-sig') as f:
            f.write(html_content)

        print(f"✅ HTML仪表盘生成成功: {output_path}")
        print(f"📊 数据概览: 签单保费 {summary['签单保费']:,.0f}元, 变动成本率 {summary['变动成本率']}%")

        if problems:
            print(f"⚠️  问题机构: {', '.join(problems)}")

        return output_path

    def _build_html_template(self, **data) -> str:
        """构建HTML模板"""
        # 读取模板文件
        template_path = Path(__file__).parent.parent / 'assets' / 'templates' / 'dashboard.html'

        if template_path.exists():
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()

            # 使用简单的字符串替换（如果模板存在）
            return template.replace('{{DATA}}', json.dumps(data, ensure_ascii=False))

        # 如果模板不存在，生成默认HTML
        return self._generate_default_html(**data)

    def _download_echarts(self) -> str:
        """尝试下载或读取 ECharts 库内容，如果失败则返回 CDN 链接"""
        echarts_url = "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"
        
        # 1. 尝试从本地 assets 读取
        local_path = Path(__file__).parent.parent / 'assets' / 'js' / 'echarts.min.js'
        if local_path.exists():
            try:
                with open(local_path, 'r', encoding='utf-8') as f:
                    return f"<script>{f.read()}</script>"
            except Exception:
                pass

        # 2. 尝试联网下载
        try:
            import urllib.request
            # 设置超时时间，避免长时间阻塞
            with urllib.request.urlopen(echarts_url, timeout=3) as response:
                content = response.read().decode('utf-8')
                return f"<script>{content}</script>"
        except Exception:
            pass
            
        # 3. 失败则回退到 CDN
        return f'<script src="{echarts_url}"></script>'

    def _generate_default_html(self, summary: Dict, problems: List[str],
                                data_by_org: List[Dict], data_by_category: List[Dict],
                                thresholds: Dict) -> str:
        """生成默认HTML（内嵌模板）"""

        # 转换数据为JSON
        data_json = json.dumps({
            'summary': summary,
            'problems': problems,
            'dataByOrg': data_by_org,
            'dataByCategory': data_by_category,
            'thresholds': thresholds,
            'week': self.week,
            'organization': self.organization
        }, ensure_ascii=False, indent=2)

        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>华安保险车险第{self.week}周经营分析 - {self.organization}</title>
    {self._download_echarts()}
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        :root {{
            --primary-red: #a02724;
            --success-green: #00b050;
            --warning-yellow: #ffc000;
            --danger-red: #c00000;
            --gray-dark: #333333;
            --gray-medium: #666666;
            --gray-light: #cccccc;
            --background: #f5f5f5;

            /* macOS风格变量 */
            --blur-backdrop: blur(20px);
            --card-shadow: 0 2px 12px rgba(0,0,0,0.08);
            --card-shadow-hover: 0 4px 20px rgba(0,0,0,0.12);
            --border-radius: 12px;
            --border-radius-sm: 8px;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ebef 100%);
            color: var(--gray-dark);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }}

        .header {{
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: var(--blur-backdrop);
            -webkit-backdrop-filter: var(--blur-backdrop);
            padding: 24px 48px;
            border-bottom: 1px solid rgba(160, 39, 36, 0.1);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            position: sticky;
            top: 0;
            z-index: 100;
        }}

        .header h1 {{
            font-size: 28px;
            font-weight: 600;
            color: var(--primary-red);
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }}

        .header-info {{
            font-size: 13px;
            color: var(--gray-medium);
            font-weight: 400;
        }}

        .tabs {{
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: var(--blur-backdrop);
            -webkit-backdrop-filter: var(--blur-backdrop);
            padding: 0 48px;
            display: flex;
            gap: 4px;
            border-bottom: 1px solid rgba(0,0,0,0.06);
            position: sticky;
            top: 76px;
            z-index: 99;
        }}

        .tab {{
            padding: 14px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: var(--transition);
            font-size: 15px;
            color: var(--gray-medium);
            font-weight: 400;
            border-radius: 6px 6px 0 0;
            position: relative;
        }}

        .tab:hover {{
            background: rgba(160, 39, 36, 0.05);
            color: var(--gray-dark);
        }}

        .tab.active {{
            color: var(--primary-red);
            border-bottom-color: var(--primary-red);
            font-weight: 500;
            background: rgba(255, 255, 255, 0.9);
        }}

        .content {{
            max-width: 1400px;
            margin: 30px auto;
            padding: 0 40px;
        }}

        .metric-cards {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }}

        .metric-card {{
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 28px 24px;
            border-radius: var(--border-radius);
            box-shadow: var(--card-shadow);
            transition: var(--transition);
            border: 1px solid rgba(0,0,0,0.04);
        }}

        .metric-card:hover {{
            box-shadow: var(--card-shadow-hover);
            transform: translateY(-2px);
        }}

        .metric-label {{
            font-size: 13px;
            color: var(--gray-medium);
            margin-bottom: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            opacity: 0.8;
        }}

        .metric-value {{
            font-size: 48px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif;
            letter-spacing: -1.5px;
            line-height: 1.1;
        }}

        .metric-unit {{
            font-size: 18px;
            color: var(--gray-medium);
            margin-left: 6px;
            font-weight: 400;
        }}

        .status-good {{ color: var(--success-green); }}
        .status-warning {{ color: var(--warning-yellow); }}
        .status-danger {{ color: var(--danger-red); }}

        .dimension-switch {{
            display: inline-flex;
            gap: 0;
            margin-bottom: 20px;
            background: rgba(160, 39, 36, 0.08);
            border-radius: 10px;
            padding: 3px;
        }}

        .dimension-btn {{
            padding: 10px 24px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: var(--transition);
            font-size: 14px;
            color: var(--gray-dark);
            font-weight: 500;
        }}

        .dimension-btn:hover {{
            background: rgba(160, 39, 36, 0.12);
        }}

        .dimension-btn.active {{
            background: white;
            color: var(--primary-red);
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }}
        
        /* 子标签页样式 */
        .sub-tabs {{
            display: inline-flex;
            gap: 0;
            margin-bottom: 20px;
            background: rgba(160, 39, 36, 0.06);
            border-radius: 9px;
            padding: 3px;
        }}

        .sub-tab {{
            padding: 8px 20px;
            cursor: pointer;
            border-radius: 7px;
            font-size: 13px;
            color: var(--gray-dark);
            background: transparent;
            border: none;
            transition: var(--transition);
            font-weight: 500;
        }}

        .sub-tab:hover {{
            background: rgba(160, 39, 36, 0.1);
        }}

        .sub-tab.active {{
            background: white;
            color: var(--primary-red);
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
        }}

        .chart-container {{
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 32px;
            border-radius: var(--border-radius);
            box-shadow: var(--card-shadow);
            margin-bottom: 24px;
            border: 1px solid rgba(0,0,0,0.04);
            transition: var(--transition);
        }}

        .chart-container:hover {{
            box-shadow: var(--card-shadow-hover);
        }}

        .chart {{
            width: 100%;
            height: 500px;
        }}

        .tab-content {{
            display: none;
        }}

        .tab-content.active {{
            display: block;
        }}

        .problem-list {{
            background: linear-gradient(135deg, rgba(255, 192, 0, 0.08) 0%, rgba(255, 192, 0, 0.12) 100%);
            border-left: 3px solid var(--warning-yellow);
            padding: 20px 24px;
            margin-bottom: 24px;
            border-radius: var(--border-radius);
            box-shadow: 0 2px 8px rgba(255, 192, 0, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }}

        .problem-list h3 {{
            font-size: 15px;
            color: var(--gray-dark);
            margin-bottom: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .problem-list ul {{
            list-style: none;
        }}

        .problem-list li {{
            padding: 6px 0;
            color: var(--gray-dark);
            font-size: 14px;
        }}
        
        .error-banner {{
            display: none;
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
        }}

        @media (max-width: 768px) {{
            .metric-cards {{
                grid-template-columns: 1fr;
            }}

            .tabs {{
                overflow-x: auto;
            }}

            .header, .tabs, .content {{
                padding-left: 20px;
                padding-right: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>华安保险车险第{self.week}周经营分析</h1>
        <div class="header-info">
            {self.organization} | {datetime.now().strftime('%Y年%m月%d日')}
        </div>
    </div>

    <div class="tabs">
        <div class="tab active" data-tab="overview">经营概览</div>
        <div class="tab" data-tab="premium">保费进度</div>
        <div class="tab" data-tab="cost">变动成本</div>
        <div class="tab" data-tab="loss">损失暴露</div>
        <div class="tab" data-tab="expense">费用支出</div>
    </div>

    <div class="content">
        <div id="error-banner" class="error-banner"></div>
    
        <!-- 经营概览 -->
        <div id="tab-overview" class="tab-content active">
            <div class="metric-cards">
                <div class="metric-card">
                    <div class="metric-label">签单保费</div>
                    <div class="metric-value">{int(summary['签单保费']/10000)}<span class="metric-unit">万元</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">变动成本率</div>
                    <div class="metric-value status-{self._get_status(summary['变动成本率'], 'cost')}">{summary['变动成本率']:.1f}<span class="metric-unit">%</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">满期赔付率</div>
                    <div class="metric-value">{summary['满期赔付率']:.1f}<span class="metric-unit">%</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">费用率</div>
                    <div class="metric-value">{summary['费用率']:.1f}<span class="metric-unit">%</span></div>
                </div>
            </div>

            {self._render_problem_list(problems)}

            <div class="dimension-switch">
                <button class="dimension-btn active" onclick="switchDimension('overview', 'org')">按机构</button>
                <button class="dimension-btn" onclick="switchDimension('overview', 'category')">按客户类别</button>
            </div>

            <div class="chart-container">
                <div id="chart-overview" class="chart"></div>
            </div>
        </div>

        <!-- 其他标签页内容 -->
        <div id="tab-premium" class="tab-content">
            <div class="dimension-switch">
                <button class="dimension-btn active" onclick="switchDimension('premium', 'org')">按机构</button>
                <button class="dimension-btn" onclick="switchDimension('premium', 'category')">按客户类别</button>
            </div>
            <div class="chart-container">
                <div id="chart-premium" class="chart"></div>
            </div>
        </div>

        <div id="tab-cost" class="tab-content">
            <div class="dimension-switch">
                <button class="dimension-btn active" onclick="switchDimension('cost', 'org')">按机构</button>
                <button class="dimension-btn" onclick="switchDimension('cost', 'category')">按客户类别</button>
            </div>
            <div class="chart-container">
                <div id="chart-cost" class="chart"></div>
            </div>
        </div>

        <div id="tab-loss" class="tab-content">
            <div class="dimension-switch">
                <button class="dimension-btn active" onclick="switchDimension('loss', 'org')">按机构</button>
                <button class="dimension-btn" onclick="switchDimension('loss', 'category')">按客户类别</button>
            </div>
            
            <div class="sub-tabs">
                <div class="sub-tab active" onclick="switchSubTab('loss', 'bubble')">气泡图分析</div>
                <div class="sub-tab" onclick="switchSubTab('loss', 'quadrant')">二级指标分析</div>
            </div>
            
            <div class="chart-container">
                <div id="chart-loss" class="chart"></div>
            </div>
        </div>

        <div id="tab-expense" class="tab-content">
            <div class="dimension-switch">
                <button class="dimension-btn active" onclick="switchDimension('expense', 'org')">按机构</button>
                <button class="dimension-btn" onclick="switchDimension('expense', 'category')">按客户类别</button>
            </div>
            <div class="chart-container">
                <div id="chart-expense" class="chart"></div>
            </div>
        </div>
    </div>

    <script>
        // 全局错误处理
        window.onerror = function(message, source, lineno, colno, error) {{
            const banner = document.getElementById('error-banner');
            banner.style.display = 'block';
            banner.innerHTML = `<strong>发生错误:</strong> ${{message}}<br><small>${{source}}:${{lineno}}</small>`;
            console.error('Global error:', error);
            return false;
        }};

        // 数据
        const DATA = {data_json};

        // 当前维度
        let currentDimensions = {{
            overview: 'org',
            premium: 'org',
            cost: 'org',
            loss: 'org',
            expense: 'org'
        }};
        
        // 当前子标签页
        let currentSubTab = {{
            loss: 'bubble'
        }};

        // 标签页切换
        document.querySelectorAll('.tab').forEach(tab => {{
            tab.addEventListener('click', () => {{
                try {{
                    const tabName = tab.dataset.tab;

                    // 更新标签样式
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // 更新内容显示
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    document.getElementById(`tab-${{tabName}}`).classList.add('active');

                    // 渲染图表
                    renderChart(tabName);
                }} catch (e) {{
                    console.error('Tab switch error:', e);
                    document.getElementById('error-banner').style.display = 'block';
                    document.getElementById('error-banner').innerText = '切换标签页时出错: ' + e.message;
                }}
            }});
        }});

        // 维度切换
        function switchDimension(tab, dimension) {{
            try {{
                currentDimensions[tab] = dimension;

                // 更新按钮样式
                const container = document.querySelector(`#tab-${{tab}} .dimension-switch`);
                container.querySelectorAll('.dimension-btn').forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');

                // 重新渲染图表
                renderChart(tab);
            }} catch (e) {{
                console.error('Dimension switch error:', e);
                alert('切换维度出错: ' + e.message);
            }}
        }}
        
        // 子标签页切换
        function switchSubTab(tab, subTab) {{
            try {{
                currentSubTab[tab] = subTab;
                
                // 更新按钮样式
                const container = document.querySelector(`#tab-${{tab}} .sub-tabs`);
                container.querySelectorAll('.sub-tab').forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
                
                // 重新渲染图表
                renderChart(tab);
            }} catch (e) {{
                console.error('Sub-tab switch error:', e);
                alert('切换视图出错: ' + e.message);
            }}
        }}

        // 渲染图表
        function renderChart(tab) {{
            try {{
                const dimension = currentDimensions[tab];
                const data = dimension === 'org' ? DATA.dataByOrg : DATA.dataByCategory;
                const dimField = dimension === 'org' ? '机构' : '客户类别';

                const chartDom = document.getElementById(`chart-${{tab}}`);
                if (!chartDom) return;
                
                // 确保 echarts 已加载
                if (typeof echarts === 'undefined') {{
                    throw new Error('图表库加载失败，请检查网络连接');
                }}
                
                // 销毁旧实例以避免冲突
                const oldChart = echarts.getInstanceByDom(chartDom);
                if (oldChart) {{
                    oldChart.dispose();
                }}
                
                const chart = echarts.init(chartDom);

                let option;

                if (tab === 'overview') {{
                    // 经营概览 - 检查是否有年计划达成率数据
                    const hasYearPlan = data.some(d => d.年计划达成率 !== null && d.年计划达成率 !== undefined);

                    if (hasYearPlan) {{
                        // 四象限散点图：年计划达成率 vs 变动成本率
                        option = {{
                            title: {{
                                text: '年计划达成率 vs 变动成本率',
                                left: 'center',
                                textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                            }},
                            tooltip: {{
                                trigger: 'item',
                                formatter: params => {{
                                    const d = params.data;
                                    return `${{d.name}}<br/>
                                           年计划达成率: ${{d.value[0].toFixed(1)}}%<br/>
                                           变动成本率: ${{d.value[1].toFixed(1)}}%<br/>
                                           签单保费: ${{Math.round(d.value[2]/10000)}}万元`;
                                }}
                            }},
                            xAxis: {{
                                name: '年计划达成率 (%)',
                                nameLocation: 'middle',
                                nameGap: 30,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            yAxis: {{
                                name: '变动成本率 (%)',
                                nameLocation: 'middle',
                                nameGap: 40,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            series: [{{
                                type: 'scatter',
                                symbolSize: d => Math.sqrt(d[2]) / 100,
                                data: data.filter(d => d.年计划达成率).map(d => ({{
                                    name: d[dimField],
                                    value: [d.年计划达成率, d.变动成本率, d.签单保费],
                                    itemStyle: {{
                                        color: d.变动成本率 > 95 ? '#c00000' : '#00b050'
                                    }}
                                }})),
                                markLine: {{
                                    silent: true,
                                    lineStyle: {{ type: 'dashed', color: '#999' }},
                                    data: [
                                        {{ xAxis: 100 }},
                                        {{ yAxis: 90 }}
                                    ]
                                }}
                            }}]
                        }};
                    }} else {{
                        // 无计划数据 - 使用保费占比 vs 变动成本率
                        const sortedData = [...data].sort((a, b) => a.变动成本率 - b.变动成本率);
                        option = {{
                            title: {{
                                text: '变动成本率分布（按' + (dimension === 'org' ? '机构' : '客户类别') + '）',
                                left: 'center',
                                textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                            }},
                            tooltip: {{
                                trigger: 'axis',
                                axisPointer: {{ type: 'shadow' }},
                                formatter: params => {{
                                    const name = params[0].name;
                                    const idx = sortedData.findIndex(d => d[dimField] === name);
                                    const item = sortedData[idx];
                                    return `${{name}}<br/>
                                           变动成本率: ${{item.变动成本率.toFixed(1)}}%<br/>
                                           签单保费: ${{Math.round(item.签单保费/10000)}}万元<br/>
                                           保费占比: ${{item.保费占比.toFixed(1)}}%`;
                                }}
                            }},
                            grid: {{
                                left: '3%',
                                right: '4%',
                                bottom: '15%',
                                containLabel: true
                            }},
                            xAxis: {{
                                type: 'category',
                                data: sortedData.map(d => d[dimField]),
                                axisLabel: {{
                                    rotate: 45,
                                    interval: 0
                                }}
                            }},
                            yAxis: {{
                                type: 'value',
                                name: '变动成本率 (%)',
                                axisLine: {{ show: true }}
                            }},
                            series: [{{
                                name: '变动成本率',
                                type: 'bar',
                                data: sortedData.map(d => ({{
                                    value: parseFloat(d.变动成本率.toFixed(1)),
                                    itemStyle: {{
                                        color: d.变动成本率 > 95 ? '#c00000' :
                                               d.变动成本率 > 85 ? '#ffc000' : '#00b050'
                                    }}
                                }})),
                                label: {{
                                    show: true,
                                    position: 'top',
                                    formatter: params => `${{params.value.toFixed(1)}}%`,
                                    fontSize: 10
                                }},
                                markLine: {{
                                    silent: true,
                                    lineStyle: {{ type: 'dashed', color: '#999', width: 2 }},
                                    data: [{{ yAxis: 90, label: {{ formatter: '成本率基准: 90%' }} }}]
                                }}
                            }}]
                        }};
                    }}
                }} else if (tab === 'cost') {{
                    // 满期赔付率 vs 费用率
                    option = {{
                        title: {{
                            text: '满期赔付率 vs 费用率',
                            left: 'center',
                            textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                        }},
                        tooltip: {{
                            trigger: 'item',
                            formatter: params => {{
                                const d = params.data;
                                return `${{d.name}}<br/>
                                       满期赔付率: ${{d.value[0].toFixed(1)}}%<br/>
                                       费用率: ${{d.value[1].toFixed(1)}}%<br/>
                                       签单保费占比: ${{d.value[2].toFixed(1)}}%`;
                            }}
                        }},
                        xAxis: {{
                            name: '满期赔付率 (%)',
                            nameLocation: 'middle',
                            nameGap: 30,
                            splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                        }},
                        yAxis: {{
                            name: '费用率 (%)',
                            nameLocation: 'middle',
                            nameGap: 40,
                            splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                        }},
                        series: [{{
                            type: 'scatter',
                            symbolSize: d => d[2] * 5,
                            data: data.map(d => ({{
                                name: d[dimField],
                                value: [d.满期赔付率, d.费用率, d.保费占比],
                                itemStyle: {{
                                    color: d.变动成本率 > 95 ? '#c00000' : '#00b050'
                                }}
                            }})),
                            markLine: {{
                                silent: true,
                                lineStyle: {{ type: 'dashed', color: '#999' }},
                                data: [
                                    {{ xAxis: 70 }},
                                    {{ yAxis: 18 }}
                                ]
                            }}
                        }}]
                    }};
                }} else if (tab === 'premium') {{
                    // 保费进度 - 检查是否有年计划达成率数据
                    const premiumData = data.filter(d => d.年计划达成率 !== null && d.年计划达成率 !== undefined);

                    if (premiumData.length > 0) {{
                        // 有计划数据 - 显示年计划达成率柱状图（从低到高排序）
                        premiumData.sort((a, b) => a.年计划达成率 - b.年计划达成率);
                        option = {{
                        title: {{
                            text: '年计划达成率对比',
                            left: 'center',
                            textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                        }},
                        tooltip: {{
                            trigger: 'axis',
                            axisPointer: {{ type: 'shadow' }},
                            formatter: params => {{
                                const p = params[0];
                                const index = p.dataIndex;
                                const item = premiumData[index];
                                return `${{item[dimField]}}<br/>
                                   年计划达成率: ${{item.年计划达成率.toFixed(1)}}%<br/>
                                   签单保费: ${{Math.round(item.签单保费/10000)}}万元`;
                            }}
                        }},
                        grid: {{
                            left: '3%',
                            right: '4%',
                            bottom: '15%',
                            containLabel: true
                        }},
                        xAxis: {{
                            type: 'category',
                            data: premiumData.map(d => d[dimField]),
                            axisLabel: {{
                                rotate: 45,
                                interval: 0
                            }}
                        }},
                        yAxis: {{
                            type: 'value',
                            name: '年计划达成率 (%)',
                            axisLine: {{ show: true }}
                        }},
                        series: [{{
                            name: '年计划达成率',
                            type: 'bar',
                            data: premiumData.map(d => ({{
                                value: d.年计划达成率,
                                itemStyle: {{
                                    color: d.年计划达成率 < 100 ? '#c00000' : '#00b050'
                                }}
                            }})),
                            label: {{
                                show: true,
                                position: 'top',
                                formatter: params => `${{params.value.toFixed(1)}}%`,
                                fontSize: 10
                            }},
                            markLine: {{
                                silent: true,
                                lineStyle: {{ type: 'dashed', color: '#999', width: 2 }},
                                data: [{{ yAxis: 100, label: {{ formatter: '达标线: 100%' }} }}]
                            }}
                        }}]
                    }};
                    }} else {{
                        // 无计划数据 - 显示签单保费分布（从低到高排序）
                        const sortedData = [...data].sort((a, b) => a.签单保费 - b.签单保费);
                        option = {{
                            title: {{
                                text: '签单保费分布',
                                left: 'center',
                                textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                            }},
                            tooltip: {{
                                trigger: 'axis',
                                axisPointer: {{ type: 'shadow' }},
                                formatter: params => {{
                                    const name = params[0].name;
                                    const idx = sortedData.findIndex(d => d[dimField] === name);
                                    const item = sortedData[idx];
                                    return `${{name}}<br/>
                                           签单保费: ${{Math.round(item.签单保费/10000)}}万元<br/>
                                           保费占比: ${{item.保费占比.toFixed(1)}}%<br/>
                                           变动成本率: ${{item.变动成本率.toFixed(1)}}%`;
                                }}
                            }},
                            grid: {{
                                left: '3%',
                                right: '4%',
                                bottom: '15%',
                                containLabel: true
                            }},
                            xAxis: {{
                                type: 'category',
                                data: sortedData.map(d => d[dimField]),
                                axisLabel: {{
                                    rotate: 45,
                                    interval: 0
                                }}
                            }},
                            yAxis: {{
                                type: 'value',
                                name: '签单保费 (万元)',
                                axisLine: {{ show: true }}
                            }},
                            series: [{{
                                name: '签单保费',
                                type: 'bar',
                                data: sortedData.map(d => ({{
                                    value: Math.round(d.签单保费/10000),
                                    itemStyle: {{ color: '#a02724' }}
                                }})),
                                label: {{
                                    show: true,
                                    position: 'top',
                                    formatter: params => `${{params.value}}万`,
                                    fontSize: 10
                                }}
                            }}]
                        }};
                    }}
                }} else if (tab === 'loss') {{
                    // 损失暴露 - 气泡图或二级指标分析
                    const subTab = currentSubTab['loss'] || 'bubble';
                    
                    if (subTab === 'bubble') {{
                        // 气泡图: X=满期赔付率, Y=当年已报告赔款占比, Size=签单保费
                        option = {{
                            title: {{
                                text: '满期赔付率 vs 已报告赔款占比',
                                left: 'center',
                                textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                            }},
                            tooltip: {{
                                trigger: 'item',
                                formatter: params => {{
                                    const d = params.data;
                                    return `${{d.name}}<br/>
                                           满期赔付率: ${{d.value[0].toFixed(1)}}%<br/>
                                           已报告赔款占比: ${{d.value[1].toFixed(1)}}%<br/>
                                           签单保费: ${{Math.round(d.value[2]/10000)}}万元`;
                                }}
                            }},
                            xAxis: {{
                                name: '满期赔付率 (%)',
                                nameLocation: 'middle',
                                nameGap: 30,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            yAxis: {{
                                name: '已报告赔款占比 (%)',
                                nameLocation: 'middle',
                                nameGap: 40,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            series: [{{
                                type: 'scatter',
                                symbolSize: d => Math.sqrt(d[2]) / 80,
                                data: data.map(d => ({{
                                    name: d[dimField],
                                    value: [d.满期赔付率, d.已报告赔款占比, d.签单保费],
                                    itemStyle: {{
                                        color: d.满期赔付率 > 75 ? '#c00000' :
                                               d.满期赔付率 > 60 ? '#ffc000' : '#00b050',
                                        opacity: 0.7
                                    }}
                                }})),
                                markLine: {{
                                    silent: true,
                                    lineStyle: {{ type: 'dashed', color: '#999' }},
                                    data: [
                                        {{ xAxis: 70, label: {{ formatter: '赔付率基准: 70%' }} }}
                                    ]
                                }}
                            }}]
                        }};
                    }} else {{
                        // 二级指标: X=出险率, Y=案均赔款
                        option = {{
                            title: {{
                                text: '出险率 vs 案均赔款',
                                left: 'center',
                                textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                            }},
                            tooltip: {{
                                trigger: 'item',
                                formatter: params => {{
                                    const d = params.data;
                                    return `${{d.name}}<br/>
                                           出险率: ${{d.value[0].toFixed(1)}}%<br/>
                                           案均赔款: ${{Math.round(d.value[1])}}元<br/>
                                           签单保费: ${{Math.round(d.value[2]/10000)}}万元`;
                                }}
                            }},
                            xAxis: {{
                                name: '出险率 (%)',
                                nameLocation: 'middle',
                                nameGap: 30,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            yAxis: {{
                                name: '案均赔款 (元)',
                                nameLocation: 'middle',
                                nameGap: 40,
                                splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                            }},
                            series: [{{
                                type: 'scatter',
                                symbolSize: d => Math.sqrt(d[2]) / 80,
                                data: data.map(d => ({{
                                    name: d[dimField],
                                    value: [d.出险率, d.案均赔款, d.签单保费],
                                    itemStyle: {{
                                        color: '#1890ff',
                                        opacity: 0.7
                                    }}
                                }})),
                                markLine: {{
                                    silent: true,
                                    lineStyle: {{ type: 'dashed', color: '#999' }},
                                    data: [
                                        {{ xAxis: 20, label: {{ formatter: '出险率基准: 20%' }} }},
                                        {{ yAxis: 6000, label: {{ formatter: '案均基准: 6000' }} }}
                                    ]
                                }}
                            }}]
                        }};
                    }}
                }} else if (tab === 'expense') {{
                    // 费用支出 - 费用率散点图
                    option = {{
                        title: {{
                            text: '费用率 vs 费用占比差异',
                            left: 'center',
                            textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                        }},
                        tooltip: {{
                            trigger: 'item',
                            formatter: params => {{
                                const d = params.data;
                                const expenseShare = d.value[3];
                                const premiumShare = d.value[4];
                                const diff = expenseShare - premiumShare;
                                return `${{d.name}}<br/>
                                       费用率: ${{d.value[0].toFixed(1)}}%<br/>
                                       费用占比差异: ${{diff.toFixed(1)}}%<br/>
                                       保费占比: ${{premiumShare.toFixed(1)}}%<br/>
                                       签单保费: ${{Math.round(d.value[2]/10000)}}万元`;
                            }}
                        }},
                        xAxis: {{
                            name: '费用率 (%)',
                            nameLocation: 'middle',
                            nameGap: 30,
                            splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                        }},
                        yAxis: {{
                            name: '费用占比超保费占比 (%)',
                            nameLocation: 'middle',
                            nameGap: 40,
                            splitLine: {{ lineStyle: {{ type: 'dashed' }} }}
                        }},
                        series: [{{
                            type: 'scatter',
                            symbolSize: d => Math.sqrt(d[2]) / 100,
                            data: data.map(d => {{
                                // 计算费用占比（假设费用 = 签单保费 * 费用率）
                                const totalPremium = data.reduce((sum, item) => sum + item.签单保费, 0);
                                const totalExpense = data.reduce((sum, item) => sum + (item.签单保费 * item.费用率 / 100), 0);
                                const expenseShare = (d.签单保费 * d.费用率 / 100) / totalExpense * 100;
                                const premiumShare = d.保费占比;
                                const diff = expenseShare - premiumShare;

                                return {{
                                    name: d[dimField],
                                    value: [d.费用率, diff, d.签单保费, expenseShare, premiumShare],
                                    itemStyle: {{
                                        color: diff > 2 ? '#c00000' :
                                               diff > 0 ? '#ffc000' : '#00b050',
                                        opacity: 0.7
                                    }}
                                }};
                            }}),
                            markLine: {{
                                silent: true,
                                lineStyle: {{ type: 'dashed', color: '#999' }},
                                data: [
                                    {{ xAxis: 18, label: {{ formatter: '费用率基准: 18%' }} }},
                                    {{ yAxis: 0, label: {{ formatter: '平衡线' }} }}
                                ]
                            }}
                        }}]
                    }};
                }} else {{
                    // 默认柱状图（按签单保费从低到高排序）
                    const sortedData = [...data].sort((a, b) => a.签单保费 - b.签单保费);
                    option = {{
                        title: {{
                            text: '各项指标对比',
                            left: 'center',
                            textStyle: {{ fontSize: 18, fontWeight: 'bold' }}
                        }},
                        tooltip: {{
                            trigger: 'axis',
                            axisPointer: {{ type: 'shadow' }},
                            formatter: params => {{
                                const name = params[0].name;
                                let result = `${{name}}<br/>`;
                                params.forEach(p => {{
                                    const value = p.seriesName === '签单保费'
                                        ? Math.round(p.value) + '万元'
                                        : p.value.toFixed(1) + '%';
                                    result += `${{p.marker}}${{p.seriesName}}: ${{value}}<br/>`;
                                }});
                                return result;
                            }}
                        }},
                        legend: {{
                            data: ['签单保费', '变动成本率'],
                            bottom: 10
                        }},
                        xAxis: {{
                            type: 'category',
                            data: sortedData.map(d => d[dimField]),
                            axisLabel: {{
                                rotate: 45,
                                interval: 0
                            }}
                        }},
                        yAxis: [
                            {{ type: 'value', name: '签单保费(万元)' }},
                            {{ type: 'value', name: '成本率(%)' }}
                        ],
                        series: [
                            {{
                                name: '签单保费',
                                type: 'bar',
                                data: sortedData.map(d => Math.round(d.签单保费 / 10000)),
                                itemStyle: {{ color: '#a02724' }}
                            }},
                            {{
                                name: '变动成本率',
                                type: 'line',
                                yAxisIndex: 1,
                                data: sortedData.map(d => parseFloat(d.变动成本率.toFixed(1))),
                                itemStyle: {{ color: '#00b050' }}
                            }}
                        ]
                    }};
                }}

                chart.setOption(option);
            }} catch (e) {{
                console.error('Render chart error:', e);
                const chartDom = document.getElementById(`chart-${{tab}}`);
                if (chartDom) {{
                    chartDom.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:red;">图表渲染出错: ${{e.message}}</div>`;
                }}
            }}
        }}

        // 初始化渲染
        renderChart('overview');
    </script>
</body>
</html>"""

        return html

    def _get_status(self, value: float, metric_type: str) -> str:
        """获取指标状态"""
        if metric_type == 'cost':
            if value < 85:
                return 'good'
            elif value < 95:
                return 'warning'
            else:
                return 'danger'
        return 'good'

    def _render_problem_list(self, problems: List[str]) -> str:
        """渲染问题列表"""
        if not problems:
            return ""

        items = ''.join([f"<li>• {p}</li>" for p in problems])
        return f"""
        <div class="problem-list">
            <h3>⚠️ 需要关注的问题</h3>
            <ul>{items}</ul>
        </div>
        """


def main():
    """主函数"""
    if len(sys.argv) < 4:
        print("用法: python generate_html_dashboard.py <数据文件> <周次> <机构名称> [配置目录]")
        print("示例: python generate_html_dashboard.py data.xlsx 49 四川分公司 ../references")
        sys.exit(1)

    data_file = sys.argv[1]
    week = int(sys.argv[2])
    organization = sys.argv[3]
    config_dir = sys.argv[4] if len(sys.argv) > 4 else '../references'

    try:
        generator = HTMLDashboardGenerator(data_file, week, organization, config_dir)
        output_path = generator.generate_html()

        print(f"\n🎉 生成完成!")
        print(f"📄 输出文件: {os.path.abspath(output_path)}")
        print(f"💡 使用浏览器打开文件即可查看交互式仪表盘")

    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
