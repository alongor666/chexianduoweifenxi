---
id: 01_features_f016_enterprise_cockpit_readme
title: 'F016: 企业驾驶舱 (Enterprise Cockpit)'
author: AI_Refactor
status: stable
type: feature
domain: product
tags:
- feature
- product
created_at: '2025-12-14'
updated_at: '2025-12-15'
---

# F016: 企业驾驶舱 (Enterprise Cockpit)

**最后更新**: 2025-12-15
**状态**: ✅ 已完成核心功能重构
**优先级**: P0

## 概述
统一驾驶舱布局与可视化规范，提供业务健康快照与经营观察入口。基于统一的5级阈值体系和"从最差到最好"排序规范，实现核心KPI监控和风险预警。

## 核心设计原则

### 1. 全局排序规则
- **强制要求**: 所有柱状图、表格必须排序
- **排序方向**: 从最差 → 最好
- **实现方式**: 使用 `sortByValue()` 函数统一排序

### 2. 布局规范
- **一行一图**: 每个图表独占一行
- **统一样式**: `rounded-xl border p-4 bg-white/70 backdrop-blur-sm`
- **间距统一**: `space-y-6`

### 3. 状态与颜色映射
- **五档阈值**: 卓越/优秀/健康/预警/危险
- **颜色一致**: 危险=红色(#ef4444)、预警=橙色(#f59e0b)、健康=绿色(#10b981)
- **配置文件**: `src/config/thresholds.ts`

## 布局结构

### 第一行：结果型核心指标（4个）
1. **时间进度达成率**: 保费时间进度达成率（单一主指标）
2. **变动成本率**: 成本控制核心指标
3. **满期赔付率**: 赔付风险核心指标
4. **费用率**: 费用控制核心指标

**组件**: `src/components/features/cockpit/kpi-metrics-row.tsx`

### 第二行：风险数量型指标（4个）
1. **时间进度达成率落后机构数**: 预警或危险状态的机构数量
2. **变动成本率>92%机构数**: 超过风险阈值的机构数量
3. **满期赔付率>70%机构数**: 超过风险阈值的机构数量
4. **满期赔付率>70%业务类型数**: 超过风险阈值的业务类型数量

**组件**: `src/components/features/cockpit/statistics-row.tsx`
**新增Hook**: `useBusinessTypeComparison()` - 业务类型维度分析

### 第三部分：经营观察模块（6个图表）
1. **时间进度达成率观察**: 落后机构横向条形图，从最差到最好排序
2. **变动成本率观察**: 支持机构/业务类型维度切换，显示危险和预警状态
3. **业务健康度热力图**: 业务类型健康状态分布
4. **多维健康度雷达**: 支持机构/业务类型切换的多指标综合呈现
5. **动态条形图**: 结构对比分析，强制从最差到最好排序
6. **占比分析图**: 结构构成展示

## 技术实现
- 主组件：`src/components/features/enterprise-cockpit.tsx`
- 子组件：
  - `src/components/features/cockpit/kpi-metrics-row.tsx`
  - `src/components/features/cockpit/statistics-row.tsx`
  - `src/components/features/cockpit/business-observation/*`
  - 主页面集成：`src/components/dashboard-client.tsx`（在 `cockpit` 标签页渲染 `EnterpriseCockpit`）
- KPI卡片：`src/components/features/compact-kpi-card.tsx`（支持显示公式提示，公式口径来自《核心指标计算引擎 V2.0》）

### 主组件架构
```
EnterpriseCockpit (主容器)
├── KPIMetricsRow (第一行：4个结果型KPI)
├── StatisticsRow (第二行：4个风险数量型指标)
├── TimeProgressAnalysis (时间进度达成率观察)
├── CostRiskAnalysis (变动成本率观察)
├── BusinessHealthHeatmap (业务健康度热力图)
├── MultiDimensionRadarWrapper (多维健康度雷达)
├── DynamicBarChart (动态条形图)
└── ProportionChart (占比分析图)
```

### 核心组件

#### 1. KPIMetricsRow
- **路径**: `src/components/features/cockpit/kpi-metrics-row.tsx`
- **功能**: 展示4个结果型核心指标
- **数据源**: `useKPI()` hook
- **特点**: 根据阈值显示状态颜色和标签

#### 2. StatisticsRow
- **路径**: `src/components/features/cockpit/statistics-row.tsx`
- **功能**: 展示4个风险数量型指标
- **数据源**: `useOrganizationComparison()` + `useBusinessTypeComparison()`
- **特点**: 图标+数值展示，颜色区分风险类型

#### 3. TimeProgressAnalysis
- **路径**: `src/components/features/cockpit/business-observation/TimeProgressAnalysis.tsx`
- **功能**: 时间进度达成率落后机构分析
- **实现**:
  - 筛选预警或危险状态的机构
  - 横向条形图展示
  - `sortByValue()` 强制从最差到最好排序
  - ECharts渲染

#### 4. CostRiskAnalysis
- **路径**: `src/components/features/cockpit/business-observation/CostRiskAnalysis.tsx`
- **功能**: 变动成本率风险分析
- **实现**:
  - 支持机构/业务类型维度切换
  - 筛选危险或预警状态
  - 顶部显示风险统计
  - `sortByValue()` 排序

#### 5. BusinessHealthHeatmap / BusinessTypeHeatmap
- **路径**:
  - 包装组件：`src/components/features/cockpit/business-observation/BusinessHealthHeatmap.tsx`
  - 核心图表：`src/components/features/business-type-heatmap.tsx`
- **数据对齐口径**：内部按 `BusinessTypeCode`（英文代码）聚合与对齐，避免 CSV/历史口径中文文案不一致导致“整行缺失”（例如：`10吨以上-普货`、`2-9吨营业货车` 等会先映射为稳定 code，再映射回标准中文全称用于展示）。
- **缺失呈现规则**：
  - 某周某业务类型无记录 → 显示“暂无数据”
  - 有记录但分母为 0（指标不可计算）→ Domain 层计算返回 `null`，前端同样显示“暂无数据”（不再用 0 伪造健康值）
- **KPI计算统一**：使用 `src/domain/rules/kpi-calculator-enhanced.ts` 的 `calculate*Ratio` 系列函数，确保口径与核心计算引擎一致。

### 数据源Hook

#### useKPI()
- **路径**: `src/hooks/use-kpi.ts`
- **功能**: 全局KPI计算
- **返回**: 包含所有核心KPI指标的对象

#### useOrganizationComparison()
- **路径**: `src/hooks/use-comparison-analysis.ts`
- **功能**: 按机构分组计算KPI
- **返回**: 机构对比数据数组

#### useBusinessTypeComparison() ⭐ 新增
- **路径**: `src/hooks/use-comparison-analysis.ts`
- **功能**: 按业务类型分组计算KPI
- **返回**: 业务类型对比数据数组
- **用途**: 支持第二行第4个指标和变动成本率观察的业务类型维度

### 统一阈值管理

**配置文件**: `src/config/thresholds.ts`

**核心函数**:
- `getThresholdLevel(value, metricKey)`: 判断指标状态等级
- `getThresholdConfig(level)`: 获取状态配置（颜色、标签）
- `sortByValue(items, getValue, metricKey)`: 按指标从最差到最好排序
- `getMetricColor(value, metricKey)`: 获取指标对应颜色

**使用示例**:
```typescript
import { getThresholdLevel, sortByValue } from '@/config/thresholds'

// 判断状态
const level = getThresholdLevel(value, 'loss_ratio')

// 排序数据（从最差到最好）
const sorted = sortByValue(items, item => item.kpi.loss_ratio, 'loss_ratio')
```

## 本次重构内容（2025-12-13）

> ℹ️ **提示**：详细开发记录与计划已迁移至 [开发记录表](../../开发记录表.md)。

## 依赖与口径
- **阈值体系**: `src/config/thresholds.ts` - 统一的5级阈值配置
- **排序工具**: `src/config/thresholds.ts` 中的 `sortByValue()` 函数
- **指标计算**: Domain 层 `src/domain/rules/kpi-calculator-enhanced.ts`
- **架构规范**: Hook 层调用 Domain 层，组件层调用 Hook 层，不在组件内做业务计算
- **年度计划**: `src/config/year-plans.json` - 各机构年度保费目标配置

## 年度目标配置

**时间进度达成率**依赖年度保费目标进行计算。系统提供以下方式管理目标:

### 1. 年度计划导入

**配置文件**: `src/config/year-plans.json`
```json
{
  "年度保费计划": {
    "四川分公司": 431000000,
    "天府": 197300000,
    ...
  }
}
```

**导入方式**: 在浏览器控制台执行
```javascript
import('/utils/import-year-plans').then(m => m.importYearPlans())
```

**详细指南**: 参见 [年度计划导入指南](../../05_guides/年度计划导入指南.md)

### 2. 目标解析优先级

系统使用以下优先级解析目标（在 `use-kpi.ts` 中实现）:
1. 业务类型目标 (最高)
2. 三级机构目标 (year-plans.json 导入的数据)
3. 客户类别目标
4. 险种目标
5. 全公司总目标 (最低)

### 3. 计算公式

**累计模式**:
```
时间进度达成率 = (累计签单保费 / 年度目标) ÷ (当前周数 / 50周) × 100%
```

**增量模式**:
```
时间进度达成率 = (本周签单保费 / 周均目标) × 100%
```

**实现位置**: `src/domain/rules/kpi-calculator-enhanced.ts:346-364`

## 相关文档
- [统一阈值配置](../../03_technical_design/core_calculations.md)
- [驾驶舱架构决策](../../02_decisions/ADR-007_现代驾驶舱架构.md)
- [统一ECharts架构](../../04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)
- [年度计划集成方案](../../02_decisions/ADR-009_年度计划集成方案.md)
- [年度计划导入指南](../../05_guides/年度计划导入指南.md)
