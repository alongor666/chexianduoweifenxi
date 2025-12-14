---
id: 01_features_f013_premium_claim_bar_charts_readme
title: 保费与赔付分析条形图模块
author: AI_Refactor
status: draft
type: feature
domain: product
tags:
- feature
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 保费与赔付分析条形图模块

> **状态**: ✅ active
> **优先级**: P1
> **完整度**: 100%
> **版本**: v1.0.0
> **最后验证**: 2025-11-02

## 功能概述

提供灵活的多维度条形图分析能力，支持从不同业务维度和指标视角分析保费和赔付数据。该模块由两个核心图表组件构成：

1. **保费分析条形图**：聚焦保费收入侧的多维度分析
2. **赔付分析条形图**：聚焦赔付成本侧的多维度分析

## 核心能力

### 保费分析条形图 (Premium Analysis Bar Chart)

通过灵活的维度和指标组合，实现对保费业务的深度分析：

- ✅ **Y轴维度选择**：
  - 业务类型（按 `business_type_category` 聚合）
  - 三级机构（按 `third_level_organization` 聚合）
  - 险别组合（按 `coverage_type` 聚合）

- ✅ **X轴指标选择**：
  - 签单保费（万元）
  - 满期保费（万元）
  - 单均保费（元）
  - 保单件数（件）
  - 满期率（%）

- ✅ **交互控制**：
  - Top N 排序控制（1-50条）
  - 自动按选定指标降序排列
  - 响应式设计，适配不同屏幕尺寸

### 赔付分析条形图 (Claim Analysis Bar Chart)

提供对赔付成本和风险管理的多维度洞察：

- ✅ **Y轴维度选择**：
  - 业务类型
  - 三级机构
  - 险别组合

- ✅ **X轴指标选择**：
  - 已报告赔款（万元）
  - 赔案件数（件）
  - 案均赔款（元）
  - 满期出险率（%） = (赔案件数 / 保单件数) × 100
  - 满期赔付率（%） = (已报告赔款 / 满期保费) × 100

- ✅ **交互控制**：
  - Top N 排序控制
  - 自动按选定指标降序排列
  - 统一的视觉设计风格

## 实现文件

- ✅ [`src/components/features/structure-bar-chart.tsx`](../../../src/components/features/structure-bar-chart.tsx) - 保费分析条形图组件
- ✅ [`src/components/features/claim-analysis-bar-chart.tsx`](../../../src/components/features/claim-analysis-bar-chart.tsx) - 赔付分析条形图组件

## 数据聚合逻辑

### 聚合算法

两个图表组件都使用相同的聚合模式：

1. **数据过滤**：使用全局筛选器过滤后的数据
2. **维度分组**：按选定的Y轴维度（业务类型/机构/险别）进行分组
3. **指标聚合**：
   - 签单保费、满期保费、赔款等：累加求和
   - 单均/案均指标：总额除以件数
   - 率值指标：通过公式计算
4. **排序与截断**：按X轴指标降序排序，取Top N条

### 计算公式

```typescript
// 保费分析
单均保费 = 签单保费 / 保单件数
满期率 = (满期保费 / 签单保费) × 100
满期边际贡献率 = (Σ边际贡献额 / Σ满期保费) × 100

// 赔付分析
案均赔款 = 已报告赔款 / 赔案件数
满期出险率 = (赔案件数 / 保单件数) × 100
满期赔付率 = (已报告赔款 / 满期保费) × 100
```

## 技术实现

### 核心技术栈

- **React 18+**: 使用 `React.memo` 优化性能
- **Recharts**: 条形图渲染库
- **TypeScript**: 完整的类型定义
- **Zustand Store**: 通过 `useFilteredData` 获取筛选后的数据

### 性能优化

1. **React.memo**：组件级缓存，避免不必要的重渲染
2. **useMemo**：数据聚合和排序结果缓存
3. **依赖追踪**：精确的依赖数组，最小化重新计算

### 样式设计

- **玻璃态风格**：`bg-white/40 backdrop-blur-xl`
- **渐变边框**：`border border-white/50`
- **响应式高度**：固定 `h-80` (320px)
- **自适应Y轴**：`width={120}` 确保标签完整显示
- **圆角条形**：`radius={[0, 4, 4, 0]}` 右侧圆角
- **颜色编码**：条形根据全局 `getContributionMarginHexColor` 规则随满期边际贡献率区间自动着色（>12%、8-12%、6-8%、4-6%、0-4%、<0 六级）

## 集成方式

### 页面集成

在多维图表标签页 (multichart) 中展示：

```tsx
// src/components/dashboard-client.tsx
{activeTab === 'multichart' && (
  <div className="space-y-8">
    <MultiDimensionRadar {...} />
    <PremiumAnalysisBarChart />
    <ClaimAnalysisBarChart />
    <DistributionPieChart />
    <ComparisonAnalysisPanel />
  </div>
)}
```

### 数据流

```
筛选器 (FilterState)
    ↓
useFilteredData Hook
    ↓
aggregateByDimension()
    ↓
排序 & TopN
    ↓
Recharts BarChart
```

## 使用说明

### 保费分析场景

1. **机构业绩对比**：选择"三级机构" + "满期保费"，查看各机构保费贡献
2. **产品线分析**：选择"业务类型" + "签单保费"，了解各业务线规模
3. **盈利质量诊断**：选择"业务类型" + "单均保费"，判断业务含金量
4. **满期管理**：选择"三级机构" + "满期率"，监控保费确认进度

### 赔付分析场景

1. **成本热点定位**：选择"业务类型" + "已报告赔款"，找出高赔付业务
2. **风险管理评估**：选择"三级机构" + "满期出险率"，识别高风险区域
3. **赔付效率分析**：选择"业务类型" + "案均赔款"，评估案件处理质量
4. **综合风险指标**：选择"险别组合" + "满期赔付率"，综合评价承保质量

## 相关模块

- [F004 筛选器模块](../F004_filters/README.md) - 数据筛选
- [F009 多维雷达图](../F009_multi_dimension_radar/README.md) - 综合评分
- [核心计算引擎](../../03_technical_design/core_calculations.md) - KPI公式

## 版本历史

### v1.0.0 (2025-11-02)

- ✅ 重构原"结构分布图"为"保费分析条形图"
- ✅ 新增"赔付分析条形图"组件
- ✅ 支持3种Y轴维度选择
- ✅ 保费分析支持5种X轴指标
- ✅ 赔付分析支持5种X轴指标
- ✅ 统一的UI设计和交互体验

---

_本文档记录了保费与赔付分析条形图模块的完整设计与实现_
_创建时间: 2025-11-02_
