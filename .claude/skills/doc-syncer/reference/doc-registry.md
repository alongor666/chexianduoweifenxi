# 文档注册表 (Document Registry)

> **作用**: 维护所有活跃文档的主清单，防止文档泛滥和孤立

**最后更新**: 2025-12-06
**状态**: ✅ 活跃维护

---

## 📊 文档统计概览

| 类别 | 数量 | 状态 |
|------|------|------|
| 核心约定 | 1 | ✅ 活跃 |
| 功能文档 | 15 | ✅ 活跃 |
| 决策记录 | 3 | ✅ 活跃 |
| 技术设计 | 8 | ✅ 活跃 |
| 重构文档 | 5 | ⚠️ 建议归档 |
| 历史归档 | 67 | 🗄️ 已归档 |
| **总计** | **99** | - |

**文档健康度**: 90/100 ✅

---

## 📋 活跃文档清单

### 第一层：项目级文档

| ID | 文档路径 | 用途 | 状态 | 依赖关系 | 更新频率 |
|----|---------|------|------|---------|---------|
| DOC-000 | CLAUDE.md | 项目协作约定 | ✅ 活跃 | 被所有文档引用 | 按需更新 |
| DOC-001 | 开发文档/README.md | 文档总览 | ✅ 活跃 | 链接所有子文档 | 每周检查 |
| DOC-002 | 开发文档/00_conventions.md | 文档约定 | ✅ 活跃 | - | 按需更新 |
| DOC-003 | 开发文档/文档代码一致性分析报告.md | 一致性分析 | ✅ 活跃 | 所有技术文档 | 每月更新 |

---

### 第二层：功能文档 (01_features/)

| ID | 文档路径 | 功能编号 | 状态 | 代码依赖 | 更新频率 |
|----|---------|---------|------|---------|---------|
| F001 | F001_data_import/README.md | 数据导入 | ✅ 完成 | src/components/features/file-upload.tsx | 按需 |
| F002 | F002_kpi_dashboard/README.md | KPI看板 | ✅ 完成 | src/components/features/kpi-dashboard.tsx | 按需 |
| F003 | F003_trend_analysis/README.md | 趋势分析 | ✅ 完成 | src/components/features/trend-chart/ | 按需 |
| F004 | F004_filters/README.md | 多维筛选 | ✅ 完成 | src/components/filters/ | 按需 |
| F005 | F005_structure_analysis/README.md | 结构分析 | ✅ 完成 | src/components/features/comparison-analysis.tsx | 按需 |
| F006 | F006_data_export/README.md | 数据导出 | ✅ 完成 | src/lib/export/ | 按需 |
| F008 | F008_data_persistence/README.md | 数据持久化 | ✅ 完成 | src/lib/storage/ | 按需 |
| F009 | F009_multi_dimension_radar/README.md | 多维雷达图 | ✅ 完成 | src/components/features/multi-dimension-radar.tsx | 按需 |
| F010 | F010_multi_week_import/README.md | 多周导入 | ✅ 完成 | src/components/features/file-upload.tsx | 按需 |
| F011 | F011_weekly_operational_trend/README.md | 周度运营趋势 | ✅ 完成 | src/components/features/weekly-operational-trend/ | 按需 |
| F012 | F012_data_source_selection/README.md | 数据源选择 | ✅ 完成 | src/config/features.ts | 按需 |
| F013 | F013_premium_claim_bar_charts/README.md | 保费赔款柱状图 | ✅ 完成 | src/components/features/claim-analysis-bar-chart.tsx | 按需 |
| F014 | F014_multi_chart_tabs/README.md | 多图表标签页 | ✅ 完成 | src/components/features/multi-chart-tabs.tsx | 按需 |

**功能文档规范**:
- 编号: F001-F999
- 路径: `开发文档/01_features/FXXX_功能名/README.md`
- 必须包含: 概述、技术实现、使用示例、测试要点

---

### 第三层：决策记录 (02_decisions/)

| ID | 文档路径 | 决策主题 | 状态 | 影响范围 | 更新频率 |
|----|---------|---------|------|---------|---------|
| ADR-001 | ADR-001_状态管理选型-Zustand.md | 状态管理 | ✅ 已采纳 | 全项目 | 稳定 |
| ADR-002 | ADR-002_CSV解析策略-流式处理.md | CSV解析 | ✅ 已采纳 | F001 | 稳定 |
| ADR-003 | ADR-003_数据持久化策略-LocalStorage.md | 数据持久化 | ✅ 已采纳 | F008 | 稳定 |

**决策文档规范**:
- 编号: ADR-001-ADR-999
- 格式: ADR-XXX_主题-决策.md
- 必须包含: 背景、决策、后果、替代方案

---

### 第四层：技术设计 (03_technical_design/)

| ID | 文档路径 | 设计主题 | 状态 | 代码依赖 | 更新频率 |
|----|---------|---------|------|---------|---------|
| TECH-001 | data_architecture.md | 数据架构 | ✅ 现行标准 | src/types/insurance.ts | 数据结构变更时 |
| TECH-002 | core_calculations.md | 核心计算 | ✅ 现行标准 | src/domain/rules/kpi-calculator.ts | KPI逻辑变更时 |
| TECH-003 | tech_stack.md | 技术栈 | ✅ 现行标准 | package.json | 依赖更新时 |
| TECH-004 | dimensions_dictionary.md | 维度字典 | ✅ 现行标准 | src/constants/dimensions.ts | 维度变更时 |
| TECH-005 | duckdb_integration.md | DuckDB集成 | ✅ 现行标准 | src/lib/database/ | 按需 |
| TECH-006 | static_deployment.md | 静态部署 | ✅ 现行标准 | next.config.js | 部署配置变更时 |
| TECH-007 | duckdb_validation_guide.md | DuckDB验证 | ✅ 现行标准 | - | 稳定 |
| TECH-008 | architecture_refactoring.md | 架构重构 | ⚠️ 建议归档 | - | 已过时 |

**技术设计文档规范**:
- 必须包含: 版本号、最后更新日期、状态标识
- 状态: ✅ 现行标准 / 📝 草稿 / ⚠️ 建议归档 / 🗄️ 已归档

---

## 🔗 文档关系图

### 核心关系网络

```
CLAUDE.md (项目根)
    ├─→ 开发文档/README.md (总览)
    │   ├─→ 00_conventions.md
    │   ├─→ 01_features/ (15个功能文档)
    │   ├─→ 02_decisions/ (3个决策记录)
    │   └─→ 03_technical_design/ (8个技术文档)
    │
    ├─→ 开发文档/03_technical_design/data_architecture.md
    │   ├─→ 被 F001, F008, F010 引用
    │   └─→ 引用 CSV导入规范.md (archive)
    │
    ├─→ 开发文档/03_technical_design/core_calculations.md
    │   ├─→ 被 F002, F005, F009, F011 引用
    │   └─→ 引用 KPI看板测试记录.md (archive)
    │
    └─→ 开发文档/03_technical_design/tech_stack.md
        ├─→ 被 F001-F014 引用
        └─→ 引用 package.json
```

### 孤立文档检测

**无入链文档**（可能需要归档）:
- ⚠️ 开发文档/04_refactoring/REFACTORING_PLAN.md
- ⚠️ 开发文档/04_refactoring/APPLICATION_LAYER_SUMMARY.md

**建议**: 评估是否需要归档到 `archive/`

---

## 📈 文档健康度评分

### 评分维度

| 维度 | 分值 | 权重 | 得分 |
|------|------|------|------|
| 一致性 | 95/100 | 30% | 28.5 |
| 完整性 | 90/100 | 25% | 22.5 |
| 可读性 | 92/100 | 20% | 18.4 |
| 链接完整性 | 88/100 | 15% | 13.2 |
| 时效性 | 85/100 | 10% | 8.5 |
| **总分** | - | - | **91.1/100** ✅ |

### 改进建议

1. **P0 - 立即处理**:
   - 归档 `04_refactoring/` 目录下的文档

2. **P1 - 本周处理**:
   - 补充缺失的ADR文档（ADR-004至ADR-006）
   - 更新过时的测试记录文档

3. **P2 - 持续优化**:
   - 定期清理 archive/ 目录
   - 补充文档间的交叉引用

---

## 🚨 文档维护规则

### 新增文档检查清单

在创建新文档前，必须确认:

- [ ] 是否可以合并到现有文档？
- [ ] 是否符合预定义的文档类型？
- [ ] 文档路径是否符合目录结构？
- [ ] 是否已添加到本注册表？
- [ ] 是否建立了与相关文档的链接？

### 归档文档标准

文档符合以下任一条件时应归档:

1. 超过6个月未更新且无入链
2. 对应的代码已被删除或重构
3. 被新文档完全替代
4. 标记为"草稿"且超过3个月未更新

### 删除文档标准

⚠️ **极少删除**，优先归档。只有以下情况才删除:

1. 完全重复的文档
2. 测试/临时文档
3. 空文档或无意义内容

---

## 🔄 自动维护

### 每周自动任务

```bash
# 1. 检测孤立文档
# 2. 检测过时文档
# 3. 更新文档统计
# 4. 生成健康度报告
```

### 触发条件

- 创建新文档 → 自动添加到注册表
- 删除文档 → 自动从注册表移除
- 修改文档 → 自动更新"最后更新"时间

---

*此注册表由 doc-syncer skill 自动维护*
*最后自动更新: 2025-12-06*
