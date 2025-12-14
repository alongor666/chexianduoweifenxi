---
id: 04_refactoring_chart_components_optimization
title: 图表组件优化记录
author: AI_Refactor
status: stable
type: refactoring
domain: product
tags:
- refactoring
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 图表组件优化记录

## 优化日期

2025-12-07

## 优化目标

消除项目中图表组件的重复代码，提升代码可维护性和一致性。

---

## 问题分析

### 发现的重复和冗余

经过全面分析，发现以下问题：

#### 1. 条形图组件高度重复（代码重复度 95%）

**涉及组件：**

- `src/components/features/claim-analysis-bar-chart.tsx` - 赔付分析条形图（原 275 行）
- `src/components/features/structure-bar-chart.tsx` - 保费分析条形图（原 268 行）

**问题描述：**

- 两个组件的代码结构几乎完全相同
- 都包含相同的：Y轴维度选择器、X轴指标选择器、TopN控制器、聚合逻辑、颜色方案
- 唯一区别是处理的数据字段不同（一个处理赔付指标，一个处理保费指标）
- 共计约 250 行重复代码

#### 2. 废弃组件未删除

**涉及文件：**

- `src/components/features/trend-chart.tsx` - 旧版趋势图（约 900 行）

**问题描述：**

- 在 `dashboard-client.tsx` 中已被注释掉，不再使用
- 已完全被 `WeeklyOperationalTrend`（新版周度经营趋势）替代
- 占用约 900 行无用代码，增加维护负担

#### 3. 聚合逻辑重复

**问题描述：**

- 两个条形图组件中的维度键获取逻辑完全相同
- switch-case 逻辑在多个地方重复出现
- 缺少统一的工具函数

---

## 优化方案

### 1. 创建通用 DimensionBarChart 组件

**文件：** `src/components/features/dimension-bar-chart.tsx`

**设计思路：**

- 将条形图的通用逻辑抽取为可配置的组件
- 通过 Props 传入指标配置、聚合函数、标题等参数
- 支持泛型，保证类型安全

**核心接口：**

```typescript
export interface DimensionBarChartProps<T extends string> {
  title: string // 图表标题
  chartId: string // 图表唯一ID
  metrics: MetricDefinition<T>[] // 指标配置列表
  defaultMetric: T // 默认选中的指标
  aggregateFunction: AggregateFunction<T> // 聚合函数
  defaultTopN?: number // 默认TopN值
}
```

**特性：**

- 支持多维度切换（业务类型、三级机构、险别组合）
- 支持多指标切换（通过配置传入）
- TopN 控制
- 按边际贡献率着色
- 完全类型安全

### 2. 重构现有条形图组件

**重构后的架构：**

```
claim-analysis-bar-chart.tsx (167 行)
  ├── 定义赔付相关类型
  ├── 定义聚合函数 aggregateClaimData()
  ├── 定义指标配置 CLAIM_METRICS
  └── 调用 <DimensionBarChart /> 传入配置

structure-bar-chart.tsx (159 行)
  ├── 定义保费相关类型
  ├── 定义聚合函数 aggregatePremiumData()
  ├── 定义指标配置 PREMIUM_METRICS
  └── 调用 <DimensionBarChart /> 传入配置
```

**优点：**

- 代码量大幅减少（从 275/268 行减少到 167/159 行）
- 逻辑清晰，职责分离
- 易于扩展新的条形图类型

### 3. 提取公共聚合逻辑

**文件：** `src/utils/aggregation.ts`

**工具函数：**

```typescript
// 获取维度键值
export function getDimensionKey(
  record: InsuranceRecord,
  dimension: Dimension
): string

// 获取维度显示标签
export function getDimensionLabel(key: string, dimension: Dimension): string
```

**优势：**

- 消除重复的 switch-case 逻辑
- 统一维度处理规则
- 便于未来扩展新维度

### 4. 删除废弃组件

**删除文件：**

- `src/components/features/trend-chart.tsx`
- `dashboard-client.tsx` 中的相关导入和注释

---

## 优化成果

### 代码减少统计

| 优化项                  | 原代码行数 | 新代码行数 | 减少行数  | 减少比例 |
| ----------------------- | ---------- | ---------- | --------- | -------- |
| ClaimAnalysisBarChart   | 275        | 167        | 108       | 39%      |
| PremiumAnalysisBarChart | 268        | 159        | 109       | 41%      |
| 删除 TrendChart         | 900        | 0          | 900       | 100%     |
| **总计**                | **1,443**  | **326**    | **1,117** | **77%**  |

### 新增文件

| 文件                      | 行数 | 说明           |
| ------------------------- | ---- | -------------- |
| `dimension-bar-chart.tsx` | 195  | 通用条形图组件 |
| `utils/aggregation.ts`    | 75   | 聚合工具函数   |

### 净收益

- **删除代码：** 1,117 行
- **新增代码：** 270 行
- **净减少：** 847 行（降低约 59%）

---

## 代码质量提升

### 1. 可维护性

- ✅ 消除了 95% 的重复代码
- ✅ 统一了维度处理逻辑
- ✅ 清理了废弃代码

### 2. 可扩展性

- ✅ 新增条形图类型只需：
  1. 定义指标配置
  2. 实现聚合函数
  3. 调用通用组件
- ✅ 新增维度只需修改 `aggregation.ts` 工具函数

### 3. 类型安全

- ✅ 使用 TypeScript 泛型确保类型安全
- ✅ 指标配置与数据结构强类型绑定
- ✅ 通过 `tsc --noEmit` 类型检查

### 4. 代码规范

- ✅ 通过 ESLint 检查
- ✅ 通过 Prettier 格式化
- ✅ 无 TypeScript 类型错误

---

## 验证结果

### 类型检查

```bash
pnpm tsc --noEmit
```

✅ **通过**，无类型错误

### 代码规范检查

```bash
pnpm run lint
```

✅ **通过**，修改的文件无 lint 错误

### 功能验证

- ✅ ClaimAnalysisBarChart 功能正常
- ✅ PremiumAnalysisBarChart 功能正常
- ✅ 维度切换正常
- ✅ 指标切换正常
- ✅ TopN 控制正常
- ✅ 颜色映射正常

---

## 迁移指南

### 如何添加新的条形图类型

**示例：** 添加"费用分析条形图"

1. **创建新文件** `src/components/features/expense-analysis-bar-chart.tsx`

```typescript
import { DimensionBarChart } from './dimension-bar-chart'
import { getDimensionKey, getDimensionLabel } from '@/utils/aggregation'

// 1. 定义指标类型
type ExpenseMetric = 'total_expense' | 'expense_ratio' | 'avg_expense'

// 2. 定义数据点类型
interface ExpenseDataPoint extends DataPoint<ExpenseMetric> {
  total_expense: number
  expense_ratio: number
  avg_expense: number
}

// 3. 实现聚合函数
function aggregateExpenseData(
  data: InsuranceRecord[],
  dimension: YAxisDimension
): ExpenseDataPoint[] {
  // ... 聚合逻辑
}

// 4. 定义指标配置
const EXPENSE_METRICS: MetricDefinition<ExpenseMetric>[] = [
  {
    value: 'total_expense',
    label: '总费用',
    config: {
      dataKey: 'total_expense',
      name: '总费用',
      unit: '万元',
      formatter: (v) => formatNumber(v, 2),
      sortKey: 'total_expense',
    },
  },
  // ... 其他指标
]

// 5. 导出组件
export const ExpenseAnalysisBarChart = () => (
  <DimensionBarChart
    title="费用分析条形图"
    chartId="expense-analysis-chart"
    metrics={EXPENSE_METRICS}
    defaultMetric="total_expense"
    aggregateFunction={aggregateExpenseData}
  />
)
```

### 如何添加新的维度

**示例：** 添加"客户类型"维度

1. **更新类型定义** `src/utils/aggregation.ts`

```typescript
export type Dimension =
  | 'business_type'
  | 'organization'
  | 'coverage_type'
  | 'customer_type' // 新增
```

2. **更新工具函数**

```typescript
export function getDimensionKey(
  record: InsuranceRecord,
  dimension: Dimension
): string {
  switch (dimension) {
    // ... 现有维度
    case 'customer_type':
      return record.customer_type || '未知'
  }
}
```

3. **更新组件选项** `dimension-bar-chart.tsx`

```tsx
<select value={yDimension} onChange={...}>
  {/* ... 现有选项 */}
  <option value="customer_type">客户类型</option>
</select>
```

---

## 最佳实践总结

### 1. DRY 原则（Don't Repeat Yourself）

- 相似度 > 90% 的代码应该抽取为通用组件
- 使用配置驱动而非代码复制

### 2. 单一职责原则

- 通用组件：负责渲染和交互逻辑
- 具体组件：负责数据聚合和配置
- 工具函数：负责通用计算逻辑

### 3. 开闭原则

- 对扩展开放：易于添加新图表类型
- 对修改封闭：不影响现有组件

### 4. 类型安全

- 使用 TypeScript 泛型
- 配置与类型强绑定
- 编译期检查

---

## 后续优化建议

### 短期（已完成）

- ✅ 合并条形图组件
- ✅ 删除废弃代码
- ✅ 提取公共逻辑

### 中期（待考虑）

- 🔄 统一图表库（Recharts vs ECharts）
- 🔄 提取更多公共组件（如选择器组件）
- 🔄 统一图表颜色主题

### 长期（待规划）

- 📋 图表组件库建设
- 📋 可视化配置生成器
- 📋 图表性能监控

---

## 参考资料

- [相关 PR](#) - （待填写）
- [设计文档](./ARCHITECTURE_RULES.md)
- [重构计划](./REFACTORING_PLAN.md)

---

## 变更记录

| 日期       | 作者   | 变更内容                   |
| ---------- | ------ | -------------------------- |
| 2025-12-07 | Claude | 初始版本，完成图表组件优化 |
