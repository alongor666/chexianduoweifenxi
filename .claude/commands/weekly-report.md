---
description: 生成麦肯锡风格的车险周报董事会PPT
---

# 周报生成命令 (/weekly-report)

从周度车险数据生成麦肯锡风格的董事会汇报 PPT。

## 用法

```
/weekly-report [文件路径] [选项]
```

## 参数

- `文件路径` - Excel/CSV 数据文件路径
- `--week=N` - 指定周次（可选，默认从文件名提取）
- `--compare` - 启用周环比分析（需要上周数据）
- `--output=路径` - 指定输出路径

## 快速启动

```
/weekly-report                              # 使用最近上传的数据
/weekly-report data/第45周.xlsx             # 指定文件
/weekly-report --week=45                    # 指定周次
/weekly-report --compare                    # 包含周环比分析
```

## 生成的 PPT 结构

### 7 页核心幻灯片

1. **封面** - 标题、日期范围、汇报人
2. **执行摘要** - 核心指标 + 3 个关键发现/风险
3. **保费分析** - 收入趋势、业务结构、同比变化
4. **盈利能力分析** - 综合成本率分解、分客群成本率
5. **新能源业务聚焦** - NEV 渗透率、与传统车对比
6. **风险管理** - 出险频率热力图、高风险业务清单
7. **行动项** - 基于数据自动生成的建议

### 设计原则 (麦肯锡三支柱)

1. **结论先行标题** - 每页标题回答"所以呢？"
2. **极简布局** - 大量留白，单一红色强调线
3. **左对齐结构** - 专业商务风格

## 输出

```
生成完成!
输出文件: /mnt/user-data/outputs/华安车险周报_第45周_麦肯锡版.pptx

包含:
- 7 页麦肯锡风格幻灯片
- 16+ KPI 指标分析
- 自动生成的行动建议
- 可选: 周环比变化分析
```

## 配置

### 预警阈值

编辑 `.claude/skills/weekly-kpi-report/config.json`:

```json
{
  "预警阈值": {
    "综合成本率_上限": 95,
    "新能源车赔付率差距": 10
  }
}
```

### 颜色配置

- 主色: 深红 (#a02724) - 60% 使用率
- 警告: 亮红 (#c00000)
- 文字: 黑色 (#000000)
- 背景: 白色 (#FFFFFF)

## 工作流程

```
1. 数据验证 → 检查必需字段、数据类型、周次
2. KPI 计算 → 16+ 指标、四大类别
3. PPT 生成 → 麦肯锡模板、结论先行
4. 输出文件 → 可直接用于董事会汇报
```

## 关联技能

此命令调用 `weekly-kpi-report` 技能执行完整流程。

## 参考

- 技能定义: `.claude/skills/weekly-kpi-report/SKILL.md`
- 风格指南: `.claude/skills/weekly-kpi-report/references/mckinsey-style-guide.md`
- 配置说明: `.claude/skills/weekly-kpi-report/references/config-guide.md`
