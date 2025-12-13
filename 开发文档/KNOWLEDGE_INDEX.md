# 车险数据分析平台 - 知识库索引

> 📅 最后更新: 2025-12-13 23:00:38
> 🔄 自动生成 by `scripts/generate_docs_index.py`

---

## 📊 知识库概览

| 类别 | 数量 | 说明 |
|------|------|------|
| 🎯 功能模块 | 14 | 产品功能文档（P0/P1/P2优先级） |
| 🏗️ 技术决策 | 4 | ADR架构决策记录 |
| ⚙️ 技术设计 | 10 | 数据架构、计算公式、技术栈 |
| 🔧 重构文档 | 9 | 架构优化和重构计划 |
| 📦 历史归档 | 39 | 旧版本文档归档 |
| **📝 总计** | **37** | **活跃文档总数** |

---

## 🔥 最近更新（30天内）

- 🏗️ [ADR-003: 数据持久化策略 - LocalStorage](02_decisions/ADR-003_数据持久化策略-LocalStorage.md) - *今天*
- 🏗️ [ADR-007: 现代驾驶舱架构 (Modern Cockpit Architecture)](02_decisions/ADR-007_现代驾驶舱架构.md) - *今天*
- ⚙️ [架构重构阶段2完成报告](03_technical_design/PHASE2_COMPLETION_REPORT.md) - *今天*
- ⚙️ [架构重构指南 - 模块化升级](03_technical_design/architecture_refactoring.md) - *今天*
- ⚙️ [核心指标计算引擎 V2.0](03_technical_design/core_calculations.md) - *今天*
- ⚙️ [数据架构](03_technical_design/data_architecture.md) - *今天*
- ⚙️ [维度字典与枚举值（Insuralytics）](03_technical_design/dimensions_dictionary.md) - *今天*
- ⚙️ [DuckDB 集成文档](03_technical_design/duckdb_integration.md) - *今天*
- ⚙️ [DuckDB 集成验证与边界指南](03_technical_design/duckdb_validation_guide.md) - *今天*
- ⚙️ [纯静态部署指南](03_technical_design/static_deployment.md) - *今天*

---

## 🎯 功能模块文档

> 按功能ID排序，包含开发状态和优先级

### [F001_data_import] 数据上传与解析模块

- **优先级**: P0
- **路径**: [`01_features/F001_data_import/README.md`](01_features/F001_data_import/README.md)
- **说明**: > **状态**: ✅ stable > **优先级**: P0 > **完整度**: 98% > **版本**: v2.3.0 > **最后验证**: 2025-10-20...
- **最后更新**: 2025-12-13

### [F003_trend_analysis] 趋势分析图表模块

- **优先级**: P0
- **路径**: [`01_features/F003_trend_analysis/README.md`](01_features/F003_trend_analysis/README.md)
- **说明**: > **状态**: ✅ beta > **优先级**: P0 > **完整度**: 95% > **版本**: v2.0.0 > **最后验证**: 2025-10-21...
- **最后更新**: 2025-12-13

### [F004_filters] 多维度数据筛选与切片模块

- **优先级**: P0
- **路径**: [`01_features/F004_filters/README.md`](01_features/F004_filters/README.md)
- **说明**: > **状态**: ✅ stable > **优先级**: P0 > **完整度**: 100% > **版本**: v3.1.0 > **最后验证**: 2025-11-02...
- **最后更新**: 2025-12-13

### [F005_structure_analysis] 结构分析与对比模块

- **优先级**: P1/P2
- **路径**: [`01_features/F005_structure_analysis/README.md`](01_features/F005_structure_analysis/README.md)
- **说明**: > **状态**: ✅ stable > **优先级**: P0 > **完整度**: 100% > **版本**: v3.1.0 > **最后验证**: 2025-10-20...
- **最后更新**: 2025-12-13

### [F006_data_export] 数据导出与分享模块

- **优先级**: P1/P2
- **路径**: [`01_features/F006_data_export/README.md`](01_features/F006_data_export/README.md)
- **说明**: > **状态**: ✅ stable > **优先级**: P2 > **完整度**: 100% > **版本**: v2.2.0 > **最后验证**: 2025-10-20...
- **最后更新**: 2025-12-13

### [F008_data_persistence] F008 - 数据持久化与上传历史模块

- **优先级**: P1/P2
- **路径**: [`01_features/F008_data_persistence/README.md`](01_features/F008_data_persistence/README.md)
- **说明**: 数据持久化与上传历史模块为车险多维数据分析平台提供了完整的数据本地存储和历史记录管理功能。该模块确保用户数据的安全性和可追溯性，提升用户体验。 - **自动保存**: 数据上传成功后自动保存到浏览器本地存储 - **数据恢复**: 页面刷新或重新访问时自动恢复之前的数据 - **数据完整性**: 使用哈希值验证数据完整性 - **存储优化**: 智能管理存储空间，避免数据冗余...
- **最后更新**: 2025-12-13

### [F009_multi_dimension_radar] F009 多维健康度雷达图

- **优先级**: P1/P2
- **路径**: [`01_features/F009_multi_dimension_radar/README.md`](01_features/F009_multi_dimension_radar/README.md)
- **说明**: **功能标识**: F009 **功能名称**: 多维健康度雷达图 **状态**: ✅ 已实现 **优先级**: P1 **创建日期**: 2025-10-26...
- **最后更新**: 2025-12-13

### [F010_multi_week_import] F010 - 多周同时导入功能

- **优先级**: P1/P2
- **路径**: [`01_features/F010_multi_week_import/README.md`](01_features/F010_multi_week_import/README.md)
- **说明**: > **状态**: 🚧 开发中 > **优先级**: P0 > **版本**: v1.0.0 > **创建日期**: 2025-10-26 多周同时导入功能增强了数据管理模块，支持一次性导入多个周的业管数据。该功能支持两种导入方式：多个CSV文件（每个文件包含一周或多周数据）和单个CSV文件包含多周数据，大幅提升数据导入效率和用户体验。...
- **最后更新**: 2025-12-13

### [F011_weekly_operational_trend] 周度经营趋势分析模块

- **优先级**: P1/P2
- **路径**: [`01_features/F011_weekly_operational_trend/README.md`](01_features/F011_weekly_operational_trend/README.md)
- **说明**: > **状态**: ✅ 完成 > **优先级**: P0 > **完整度**: 100% > **版本**: v1.0.0 > **最后验证**: 2025-10-26...
- **最后更新**: 2025-12-13

### [F012_data_source_selection] F012 - 数据源选择功能

- **优先级**: P1/P2
- **路径**: [`01_features/F012_data_source_selection/README.md`](01_features/F012_data_source_selection/README.md)
- **说明**: 支持用户自由选择数据来源，实现 Supabase 云数据库和本地 CSV 文件两种数据源模式的无缝切换。 - **Supabase 模式**: 从云数据库自动加载数据 - **本地模式**: 仅使用 CSV 文件上传的数据（默认） - Supabase 连接失败时自动降级到本地模式 - 不会因数据库配置问题导致应用无法启动...
- **最后更新**: 2025-12-13

### [F013_premium_claim_bar_charts] 保费与赔付分析条形图模块

- **优先级**: P1/P2
- **路径**: [`01_features/F013_premium_claim_bar_charts/README.md`](01_features/F013_premium_claim_bar_charts/README.md)
- **说明**: > **状态**: ✅ active > **优先级**: P1 > **完整度**: 100% > **版本**: v1.0.0 > **最后验证**: 2025-11-02...
- **最后更新**: 2025-12-13

### [F014_multi_chart_tabs] F014 多维图表标签页优化

- **优先级**: P1/P2
- **路径**: [`01_features/F014_multi_chart_tabs/README.md`](01_features/F014_multi_chart_tabs/README.md)
- **说明**: **功能标识**: F014 **功能名称**: 多维图表标签页优化 **状态**: ✅ 已实现 **优先级**: P1 **创建日期**: 2025-11-03...
- **最后更新**: 2025-12-13

### [F015_kpi_multi_level_drilldown] F015: KPI多层下钻功能

- **优先级**: P1/P2
- **路径**: [`01_features/F015_kpi_multi_level_drilldown/README.md`](01_features/F015_kpi_multi_level_drilldown/README.md)
- **说明**: 在KPI卡片和趋势图中实现多层下钻功能，支持用户按多个维度逐层深入分析数据。下钻交互已从弹窗模式升级为**全局下钻导航条**，位于筛选器与内容区域之间，提供更清晰、直观的可视化分析体验。 支持以下9个维度的下钻分析： - **三级机构**（`third_level_organization`）：按机构进行下钻 - **业务类型**（`business_type_category`）：按业务类型进行...
- **最后更新**: 2025-12-13

### [F016_enterprise_cockpit] F016: 企业驾驶舱 (Enterprise Cockpit)

- **优先级**: P1/P2
- **路径**: [`01_features/F016_enterprise_cockpit/README.md`](01_features/F016_enterprise_cockpit/README.md)
- **说明**: 统一驾驶舱布局与可视化规范，提供业务健康快照与经营观察入口。替换旧版驾驶舱渲染为 `EnterpriseCockpit`，并接入统一的排序与阈值体系。 - 统一 5 级阈值（卓越/优秀/健康/预警/危险）与颜色映射 - 所有图表遵循“最差 → 最好”排序 - 布局采用 16:9 页面主体框架，一行一个图，去网格线、文字加粗、值标签固定 1. 第一行：核心 KPI（时间进度达成率-保费/件数、变动成...
- **最后更新**: 2025-12-13

---

## 🏗️ 技术决策记录（ADR）

> Architecture Decision Records - 记录关键技术选型和设计决策

| ADR编号 | 决策标题 | 摘要 | 文档 |
|---------|---------|------|------|
| ADR-001 | ADR-001: 状态管理选型 - Zustand | > **状态**: ✅ 已采纳 > **决策日期**: 2025-01-20 (推断) > **决策人**: 开发团队 **选择 Zustand 作为全局状态管... | [`ADR-001_状态管理选型-Zustand.md`](02_decisions/ADR-001_状态管理选型-Zustand.md) |
| ADR-002 | ADR-002: CSV解析策略 - 流式处理 | > **状态**: ✅ 已采纳 > **决策日期**: 2025-01-20 > **决策人**: 开发团队 **采用Papa Parse库的流式解析 (Wor... | [`ADR-002_CSV解析策略-流式处理.md`](02_decisions/ADR-002_CSV解析策略-流式处理.md) |
| ADR-003 | ADR-003: 数据持久化策略 - LocalStorage | 已接受 (2025-01-20) 车险多维数据分析平台需要实现数据的本地持久化存储，以提升用户体验和数据安全性。用户上传的CSV数据需要在页面刷新或重新访问时能... | [`ADR-003_数据持久化策略-LocalStorage.md`](02_decisions/ADR-003_数据持久化策略-LocalStorage.md) |
| ADR-007 | ADR-007: 现代驾驶舱架构 (Modern Cockpit Architecture) | 已采纳 (Accepted) 原有的仪表盘设计存在三个主要问题： 1. **Tab Trap (标签页陷阱)**: 核心图表（热力图、趋势图）被隐藏在多层 Ta... | [`ADR-007_现代驾驶舱架构.md`](02_decisions/ADR-007_现代驾驶舱架构.md) |

---

## ⚙️ 技术设计文档

> 核心技术架构、数据模型、计算公式等

### 架构重构阶段2完成报告

- **路径**: [`03_technical_design/PHASE2_COMPLETION_REPORT.md`](03_technical_design/PHASE2_COMPLETION_REPORT.md)
- **内容**: 2025-10-22 **文件**: `src/store/domains/cacheStore.ts` (203行) **功能**: - KPI计算结果缓存管理 - 缓存命中率统计（hits/misses/hitRate）...
- **最后更新**: 2025-12-13

### 架构重构指南 - 模块化升级

- **路径**: [`03_technical_design/architecture_refactoring.md`](03_technical_design/architecture_refactoring.md)
- **内容**: - **创建日期**: 2025-10-22 - **版本**: 1.0.0 - **状态**: 🚧 实施中 - 阶段1 - **负责人**: AI助手 + 开发团队 ```...
- **最后更新**: 2025-12-13

### 核心指标计算引擎 V2.0

- **路径**: [`03_technical_design/core_calculations.md`](03_technical_design/core_calculations.md)
- **内容**: 本文件定义了平台的KPI体系架构、计算公式、业务逻辑和显示规则。 **KPI体系说明**: - **核心展示KPI**: 16个（4x4网格布局） - **辅助计算字段**: 7个（用于计算但不直接展示） - **总计**: 23个指标字段...
- **最后更新**: 2025-12-13

### 数据架构

- **路径**: [`03_technical_design/data_architecture.md`](03_technical_design/data_architecture.md)
- **内容**: > **[warning] 警告：数据库模型缺失** > 截至文档更新时（2025-10-21），项目尚未建立数据库持久化层。`prisma` 目录及 `schema.prisma` 文件不存在。当前所有数据处理均在客户端内存中完成。以下数据结构规范基于CSV导入标准，是未来数据库建模的唯一事实来源。 > **[info] 数据持久化更新** > 截至 2025-01-20，项目已实现基于 Loc...
- **最后更新**: 2025-12-13

### 维度字典与枚举值（Insuralytics）

- **路径**: [`03_technical_design/dimensions_dictionary.md`](03_technical_design/dimensions_dictionary.md)
- **内容**: 本文档汇总平台内所有可选维度及其对应的枚举值，作为代码与数据规范的统一参考。适用于：目标管理、筛选器系统、CSV 导入、统计分析模块。 - 单一事实来源（SoT）：`src/constants/dimensions.ts`（客户类别、业务类型） - 规范参考：`开发文档/archive/CSV导入规范.md`（完整字段与枚举清单） - 规范化策略：`normalizeChineseText` 与 ...
- **最后更新**: 2025-12-13

### DuckDB 集成文档

- **路径**: [`03_technical_design/duckdb_integration.md`](03_technical_design/duckdb_integration.md)
- **内容**: > 📅 创建日期: 2025-01-12 > 📝 版本: v1.0 > 🎯 目标: 通过 DuckDB-WASM 实现高性能数据分析 本项目集成了 DuckDB-WASM，一个基于 WebAssembly 的列式数据库，用于替代原有的 CSV 解析 + IndexedDB 方案，实现以下目标： 1. **性能提升**: 查询速度提升 10-20 倍...
- **最后更新**: 2025-12-13

### DuckDB 集成验证与边界指南

- **路径**: [`03_technical_design/duckdb_validation_guide.md`](03_technical_design/duckdb_validation_guide.md)
- **内容**: > 📅 创建日期: 2025-01-12 > 📝 版本: v1.0 > 🎯 目标: 确保 DuckDB 数据符合项目要求并能正常运行 项目**已经完成** DuckDB-WASM 集成，具备以下能力： 1. **数据转换工具** (`scripts/etl_to_duckdb.py`)...
- **最后更新**: 2025-12-13

### 纯静态部署指南

- **路径**: [`03_technical_design/static_deployment.md`](03_technical_design/static_deployment.md)
- **内容**: 本文档说明如何将车险分析平台配置为纯静态部署模式，实现零服务器成本、快速访问的静态网站部署。 车险分析平台采用 **LocalStorage + DuckDB WASM** 架构，天然支持纯静态部署： - ✅ 所有数据处理在浏览器中完成（DuckDB WASM） - ✅ 数据持久化使用 LocalStorage - ✅ 无需后端服务器或数据库...
- **最后更新**: 2025-12-13

### Store架构迁移计划

- **路径**: [`03_technical_design/store_migration_plan.md`](03_technical_design/store_migration_plan.md)
- **内容**: > 生成时间：2025-11-25 > 状态：进行中 > 预计完成时间：16个工作日 项目存在新旧两套状态管理系统并存，需要系统性迁移： - **旧架构**：`use-app-store.ts`（813行单体Store）...
- **最后更新**: 2025-12-13

### 技术栈与开发环境

- **路径**: [`03_technical_design/tech_stack.md`](03_technical_design/tech_stack.md)
- **内容**: 本文档概述了车险分析平台所采用的技术栈、关键库以及本地开发环境的配置指南。 - **前端**: Next.js 14.2.33 (React 18 框架) - **UI 库**: shadcn/ui (基于 Radix UI 和 Tailwind CSS 3.4.1) - **图表**: ECharts 6.0.0 + echarts-for-react 3.0.5 【已对齐当前代码事实】 - *...
- **最后更新**: 2025-12-13

---

## 🔧 重构与优化文档

> 架构演进、代码重构计划和最佳实践

- [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md)
- [Application 层实现总结](04_refactoring/APPLICATION_LAYER_SUMMARY.md)
- [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md)
- [图表组件优化记录](04_refactoring/CHART_COMPONENTS_OPTIMIZATION.md)
- [重构文档目录](04_refactoring/README.md)
- [✅ 重构检查清单](04_refactoring/REFACTORING_CHECKLIST.md)
- [🔧 车险分析平台重构计划](04_refactoring/REFACTORING_PLAN.md)
- [仓库结构治理与迁移跟踪（Repo Structure Migration）](04_refactoring/REPO_STRUCTURE_MIGRATION.md)
- [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)

---

## 🏷️ 标签索引

> 按标签快速查找相关文档

### 热门标签

**#94a3b8** (2个文档)
- 🎯 [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md)
- 🎯 [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md)

**#3b82f6** (2个文档)
- 🎯 [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md)
- 🔧 [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)

**#ef4444** (2个文档)
- 🎯 [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md)
- 🔧 [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)

**#f97316** (2个文档)
- 🎯 [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md)
- 🔧 [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)

### 所有标签

| 标签 | 文档数 | 文档列表 |
|------|--------|----------|
| #10b981 | 1 | [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md) |
| #1565C0 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #1976D2 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #2E7D32 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #3b82f6 | 2 | [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md), [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md) |
| #4CAF50 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #8b5cf6 | 1 | [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md) |
| #94a3b8 | 2 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md), [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md) |
| #D32F2F | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #F57C00 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #FBC02D | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #FF6B35 | 1 | [F009 多维健康度雷达图](01_features/F009_multi_dimension_radar/README.md) |
| #ai | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |
| #ef4444 | 2 | [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md), [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md) |
| #f59e0b | 1 | [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md) |
| #f97316 | 2 | [周度经营趋势分析模块](01_features/F011_weekly_operational_trend/README.md), [统一可视化引擎架构文档（ECharts）](04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md) |
| #上下文注入模板 | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |
| #业务类型枚举值详细说明 | 1 | [核心指标计算引擎 V2.0](03_technical_design/core_calculations.md) |
| #为什么需要 | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |
| #常见场景的标准提示词 | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |
| #提示词工程 | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |
| #故障排除 | 1 | [DuckDB 集成文档](03_technical_design/duckdb_integration.md) |
| #最佳实践 | 1 | [DuckDB 集成文档](03_technical_design/duckdb_integration.md) |
| #第一部分底层规律不可违反的物理定律 | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #第三部分分层规则clean | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #第二部分架构原则战术层面的指导方针 | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #第五部分检查清单可执行的检查项 | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #第六部分ai | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #第四部分阶段规则按项目规模 | 1 | [🏛️ 软件架构规则体系（完整版）](04_refactoring/ARCHITECTURE_RULES.md) |
| #错误纠正流程 | 1 | [🤖 AI 协作约定](04_refactoring/AI_COLLABORATION.md) |

---

## 🔗 文档依赖关系图

> 显示文档之间的引用关系

### 🌟 核心文档（被引用≥3次）

- `ARCHITECTURE_RULES.md` - 被引用 **7** 次
- `REFACTORING_PLAN.md` - 被引用 **6** 次
- `REFACTORING_CHECKLIST.md` - 被引用 **5** 次
- `archive/CSV导入规范.md` - 被引用 **4** 次
- `archive/测试记录-2025-10-20-最终.md` - 被引用 **4** 次
- `03_technical_design/core_calculations.md` - 被引用 **4** 次
- `03_technical_design/data_architecture.md` - 被引用 **4** 次
- `02_decisions/ADR-002_CSV解析策略-流式处理.md` - 被引用 **3** 次
- `data_architecture.md` - 被引用 **3** 次
- `AI_COLLABORATION.md` - 被引用 **3** 次

### 文档引用关系

<details>
<summary>点击展开完整引用关系</summary>

**01_features/F001_data_import/README.md** 引用:
  - `../../02_decisions/ADR-002_CSV解析策略-流式处理.md`
  - `../../archive/CSV导入规范.md`
  - `../../archive/测试记录-2025-10-20-最终.md`

**01_features/F003_trend_analysis/README.md** 引用:
  - `../../02_decisions/ADR-004.md`

**01_features/F004_filters/README.md** 引用:
  - `../../archive/全局筛选器重构总结.md`
  - `../../03_technical_design/dimensions_dictionary.md`
  - `../../archive/CSV导入规范.md`
  - `../../archive/测试记录-2025-10-20-最终.md`

**01_features/F005_structure_analysis/README.md** 引用:
  - `../../archive/边贡分析模块改造测试记录.md`
  - `../../03_technical_design/core_calculations.md`
  - `../../archive/测试记录-2025-10-20-最终.md`

**01_features/F006_data_export/README.md** 引用:
  - `../../archive/全局筛选器重构总结.md`
  - `../../archive/测试记录-2025-10-20-最终.md`

**01_features/F008_data_persistence/README.md** 引用:
  - `../../03_technical_design/data_architecture.md`
  - `../../03_technical_design/tech_stack.md`
  - `../../02_decisions/ADR-002_CSV解析策略-流式处理.md`

**01_features/F009_multi_dimension_radar/README.md** 引用:
  - `../../03_technical_design/core_calculations.md`
  - `../../03_technical_design/data_architecture.md`
  - `../../03_technical_design/color_system.md`
  - `../F005_structure_analysis/README.md`

**01_features/F010_multi_week_import/README.md** 引用:
  - `../F001_data_import/README.md`
  - `../F008_data_persistence/README.md`
  - `../../03_technical_design/data_architecture.md`
  - `../../02_decisions/ADR-002_CSV解析策略-流式处理.md`

**01_features/F011_weekly_operational_trend/README.md** 引用:
  - `../F003_trend_analysis/README.md`
  - `../../03_technical_design/data_architecture.md`

**01_features/F013_premium_claim_bar_charts/README.md** 引用:
  - `../F004_filters/README.md`
  - `../F009_multi_dimension_radar/README.md`
  - `../../03_technical_design/core_calculations.md`

**01_features/F014_multi_chart_tabs/README.md** 引用:
  - `../F009_multi_dimension_radar/README.md`
  - `../F013_premium_claim_bar_charts/README.md`
  - `../F013_premium_claim_bar_charts/README.md`
  - `../F005_structure_analysis/README.md`
  - `../../03_technical_design/core_calculations.md`

**02_decisions/ADR-001_状态管理选型-Zustand.md** 引用:
  - `../01_features/F001_data_import/README.md`
  - `../01_features/F002_kpi_dashboard/README.md`
  - `../01_features/F004_filters/README.md`

**02_decisions/ADR-002_CSV解析策略-流式处理.md** 引用:
  - `../archive/CSV导入规范.md`
  - `../01_features/F001_data_import/README.md`

**02_decisions/ADR-003_数据持久化策略-LocalStorage.md** 引用:
  - `./ADR-001_状态管理选型-Zustand.md`
  - `./ADR-002_CSV解析策略-流式处理.md`

**03_technical_design/architecture_refactoring.md** 引用:
  - `./data_architecture.md`
  - `./core_calculations.md`
  - `./tech_stack.md`

**03_technical_design/core_calculations.md** 引用:
  - `./data_architecture.md`
  - `../archive/KPI看板-4x4网格布局-测试记录.md`
  - `../archive/紧凑版KPI看板测试记录-V2.md`
  - `../archive/边贡分析模块改造测试记录.md`

**03_technical_design/data_architecture.md** 引用:
  - `../01_features/F008_data_persistence/README.md`
  - `../archive/CSV导入规范.md`

**03_technical_design/duckdb_integration.md** 引用:
  - `../../scripts/README.md`

**03_technical_design/duckdb_validation_guide.md** 引用:
  - `./duckdb_integration.md`
  - `./data_architecture.md`
  - `../../scripts/README.md`
  - `./core_calculations.md`

**04_refactoring/AI_COLLABORATION.md** 引用:
  - `./REFACTORING_CHECKLIST.md`
  - `./REFACTORING_CHECKLIST.md`

**04_refactoring/APPLICATION_LAYER_SUMMARY.md** 引用:
  - `./REFACTORING_PLAN.md`

**04_refactoring/CHART_COMPONENTS_OPTIMIZATION.md** 引用:
  - `./ARCHITECTURE_RULES.md`
  - `./REFACTORING_PLAN.md`

**04_refactoring/README.md** 引用:
  - `./ARCHITECTURE_RULES.md`
  - `./REFACTORING_PLAN.md`
  - `./REFACTORING_CHECKLIST.md`
  - `./AI_COLLABORATION.md`
  - `./APPLICATION_LAYER_SUMMARY.md`
  - `./REFACTORING_PLAN.md`
  - `./ARCHITECTURE_RULES.md`
  - `./REFACTORING_PLAN.md`
  - `./ARCHITECTURE_RULES.md`
  - `./REFACTORING_PLAN.md`
  - `./AI_COLLABORATION.md`
  - `./REFACTORING_CHECKLIST.md`
  - `../../PROJECT_STATUS.md`

**04_refactoring/REFACTORING_PLAN.md** 引用:
  - `./ARCHITECTURE_RULES.md`
  - `./ARCHITECTURE_RULES.md`
  - `./REFACTORING_CHECKLIST.md`
  - `./AI_COLLABORATION.md`
  - `./ARCHITECTURE_RULES.md`

</details>

---

## 📖 使用指南

### 快速导航

1. **新手入门** → 阅读 [README.md](README.md) 了解项目概览
2. **开发协作** → 查看 [00_conventions.md](00_conventions.md) 理解"代码优先"原则
3. **功能开发** → 浏览 `01_features/` 目录找到对应功能文档
4. **技术选型** → 参考 `02_decisions/` 中的ADR文档
5. **架构设计** → 查阅 `03_technical_design/` 了解技术架构
6. **历史查询** → 搜索 `archive/` 目录查找旧版本文档

### 文档维护规范

✅ **必须做的事情**：
- 代码变更后立即更新对应功能文档
- 重大技术决策创建新的ADR文档
- 每次功能发布前运行 `python scripts/generate_docs_index.py 开发文档`

❌ **禁止做的事情**：
- 基于"记忆"而非代码标记功能状态
- 保留与代码实现不符的过期文档
- 直接修改自动生成的索引文件

### 更新索引

```bash
# 扫描开发文档并重新生成索引
python scripts/generate_docs_index.py 开发文档

# 或使用相对路径
cd scripts
python generate_docs_index.py ../开发文档
```

---

## 🔗 相关资源

- **项目主页**: [../README.md](../README.md)
- **AI协作指南**: [../CLAUDE.md](../CLAUDE.md)
- **开发约定**: [00_conventions.md](00_conventions.md)
- **历史归档**: [archive/](archive/)

---

*本索引由 `scripts/generate_docs_index.py` 自动生成*
*如需更新，请运行: `python scripts/generate_docs_index.py 开发文档`*
