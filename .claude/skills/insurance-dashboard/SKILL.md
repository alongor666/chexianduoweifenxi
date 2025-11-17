---
name: insurance-dashboard
description: 车险业务分析仪表板生成器。支持单周静态分析和多周趋势分析，生成多维度交互式仪表板，包括综合成本率分析、保费计划达成、边际贡献、新能源车对比、分支机构绩效、时间序列趋势等。当用户需要分析车险数据、生成业务报告、评估分支机构表现、进行保险产品盈利性分析、或查看多周业务趋势时使用此技能。
---

# Instructions

## 核心职责

本技能用于生成中国车险行业的数据分析仪表板，支持单周静态分析和多周趋势分析。

**职责范围**：
- ✅ 生成交互式 HTML 仪表板
- ✅ 计算核心指标（赔付率、费用率、边际贡献率等）
- ✅ 多维度分析（新能源车、分支机构、业务类型、风险分级）
- ❌ 不采集和清洗原始数据（假设输入数据已验证）
- ❌ 不做业务决策建议

## 执行流程

### 1. 确认分析需求
询问用户：
- **数据文件路径**：CSV 格式，必须符合 26 字段标准
- **分析模式**：单周分析 / 多周趋势分析
- **分析维度**（可选）：综合分析 / 新能源车专项 / 分支机构绩效 / 风险分级

### 2. 验证数据格式
建议先使用 `data-validator` 技能验证数据：
```bash
# 推荐先验证数据
使用 data-validator skill 验证 CSV 文件
```

### 3. 调用生成脚本

#### 单周综合分析
```bash
python scripts/generate_dashboard.py \
  --input data/week_42.csv \
  --output dashboard.html \
  --mode comprehensive
```

#### 多周趋势分析
```bash
python scripts/multi_week_analyzer.py \
  data/week_40.csv data/week_41.csv data/week_42.csv
```

#### 专项分析
```bash
# 新能源车分析
python scripts/generate_dashboard.py --mode nev

# 分支机构绩效
python scripts/generate_dashboard.py --mode branch

# 风险分级
python scripts/generate_dashboard.py --mode risk
```

### 4. 验证输出
检查 HTML 文件是否成功生成。

### 5. 提供访问说明
告知用户：
> 仪表板已生成到 `dashboard.html`，请在浏览器中打开查看。

## 限制与边界

- **仅支持标准 CSV 格式**：数据必须符合 26 字段 `InsuranceRecord` 结构
- **不进行数据清洗**：假设输入数据已验证
- **不直接修改数据**：只读取和分析
- **依赖 Python 环境**：需要 Python 3.x 和相关依赖包

## 输出格式

支持的输出格式：
- **HTML**（交互式，推荐）
- **PDF**（静态，管理层汇报用）
- **PPTX**（演示文稿格式）

主题风格：
- **McKinsey** - 专业商务风格，深蓝+橙色
- **Apple** - 现代简约风格，渐变色系

详细功能说明请参考 `references/` 目录：
- `data-schema.md` - 数据字段说明
- `metrics-calculation.md` - 指标计算公式
- `quick-start.md` - 快速开始指南
- `multi-week-guide.md` - 多周分析指南

# Examples

## 示例 1：单周综合分析

**用户输入**：
> 帮我分析第 42 周的数据，生成业务仪表板

**正确处理流程**：
1. 确认数据文件路径（如用户未提供，询问）
2. 验证 CSV 文件格式（建议使用 data-validator）
3. 执行命令：
   ```bash
   python scripts/generate_dashboard.py \
     --input data/week_42.csv \
     --output dashboard.html \
     --mode comprehensive
   ```
4. 验证输出文件生成成功
5. 告知用户："仪表板已生成到 `dashboard.html`，请在浏览器中打开查看"

## 示例 2：多周趋势分析

**用户输入**：
> 对比第 40-44 周的业务趋势

**正确处理流程**：
1. 确认数据文件路径
2. 执行命令：
   ```bash
   python scripts/multi_week_analyzer.py \
     data/week_40.csv data/week_41.csv data/week_42.csv data/week_43.csv data/week_44.csv
   ```
3. 输出包含：时间序列趋势、同比环比分析、异常波动标记
4. 提供业务洞察建议（可选）

## 示例 3：新能源车专项分析

**用户输入**：
> 分析新能源车的盈利情况

**正确处理流程**：
1. 确认数据文件
2. 执行命令：
   ```bash
   python scripts/generate_dashboard.py --mode nev
   ```
3. 生成 NEV vs 传统车对比仪表板
4. 提供关键发现

# Version History

## v1.0 (2025-11-17)
- 初始版本，支持单周和多周分析
- 提供综合分析、NEV专项、分支机构绩效、风险分级等模式
- 支持 McKinsey 和 Apple 主题风格
- 遵循 Anthropic 官方 Skills 最佳实践
