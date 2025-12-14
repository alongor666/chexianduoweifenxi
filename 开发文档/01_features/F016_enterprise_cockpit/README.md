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
updated_at: '2025-12-14'
---

# F016: 企业驾驶舱 (Enterprise Cockpit)

**最后更新**: 2025-12-13
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

## 相关文档
- [统一阈值配置](../../03_technical_design/core_calculations.md)
- [驾驶舱架构决策](../../02_decisions/ADR-007_现代驾驶舱架构.md)
- [统一ECharts架构](../../04_refactoring/UNIFIED_ECHARTS_ARCHITECTURE.md)

