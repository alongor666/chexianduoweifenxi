# weekpi-html - 华安保险车险周报HTML可视化生成器

## 概述

将车险周报数据转化为交互式网页仪表盘，支持标签页切换和下钻分析。

## 快速开始

```bash
# 安装依赖
pip install pandas numpy openpyxl

# 生成HTML仪表盘
cd scripts
python generate_html_dashboard.py <数据文件> <周次> <机构名称> ../references

# 示例
python generate_html_dashboard.py ../data.xlsx 49 四川分公司 ../references
```

## 主要特性

✅ **标签页切换** - 5个核心分析维度（经营概览、保费进度、变动成本、损失暴露、费用支出）
✅ **下钻分析** - 机构/客户类别双维度切换
✅ **交互式图表** - 基于 ECharts 的动态可视化
✅ **响应式布局** - 适配桌面/平板/移动设备
✅ **麦肯锡风格** - 专业视觉设计
✅ **单文件输出** - 无需服务器部署
✅ **数据隐私** - 本地运行，无外部请求

## 支持的数据格式

- Excel (.xlsx, .xls)
- CSV (.csv)
- JSON (.json)
- DuckDB (.db, .duckdb)

## 必需字段

- `机构` - 三级机构名称
- `客户类别` - 客户分类
- `签单保费` - 本周保费收入（元）
- `满期赔付率` - 百分比值
- `费用率` - 百分比值
- `变动成本率` - 百分比值
- `已报告赔款` - 已报案赔款金额（元）
- `出险率` - 百分比值
- `案均赔款` - 平均每案赔款（元）

## 配置文件

### references/thresholds.json

定义阈值和状态评价标准。

### references/plans.json

保费计划数据，用于计算达成率（可选）。

## 输出示例

生成的HTML文件包含:

1. **经营概览** - 核心指标卡片 + 四象限图
2. **保费进度** - 计划达成率分析
3. **变动成本** - 赔付率 vs 费用率
4. **损失暴露** - 气泡图 + 二级指标分析
5. **费用支出** - 费用率分析

每个标签页支持按机构/按客户类别切换。

## 技术栈

- Python 3.7+
- pandas, numpy
- ECharts 5.x (CDN)
- HTML5 + CSS3 + JavaScript

## 版本

v1.0.0 - 2025-12-09

## 许可证

与 insurance-weekly-report 技能保持一致
