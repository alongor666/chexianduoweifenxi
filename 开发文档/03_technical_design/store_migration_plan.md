---
id: 03_technical_design_store_migration_plan
title: Store架构迁移计划
author: AI_Refactor
status: stable
type: technical
domain: product
tags:
- technical
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# Store架构迁移计划

> 生成时间：2025-11-25
> 状态：进行中
> 预计完成时间：16个工作日

## 执行摘要

项目存在新旧两套状态管理系统并存，需要系统性迁移：

- **旧架构**：`use-app-store.ts`（813行单体Store）
- **新架构**：`store/domains/` 5个领域Store
- **影响范围**：43个文件需要迁移
- **策略**：自底向上，由边缘到核心，渐进式迁移

---

## 一、架构对比

### 功能对比表

| 功能领域 | 旧Store                            | 新Store        | 代码行数 | 状态    |
| -------- | ---------------------------------- | -------------- | -------- | ------- |
| 数据管理 | rawData, setRawData, appendRawData | dataStore.ts   | 813→256  | ✅ 完备 |
| 筛选条件 | filters, updateFilters             | filterStore.ts | 813→211  | ✅ 增强 |
| 计算缓存 | computedKPIs Map                   | cacheStore.ts  | 813→243  | ✅ 增强 |
| UI状态   | viewMode, expandedPanels           | uiStore.ts     | 813→394  | ✅ 扩展 |
| 目标管理 | premiumTargets                     | targetStore.ts | 813→615  | ✅ 增强 |

**收益**：

- 单个Store平均行数：344行（降低60%复杂度）
- 领域职责清晰，易于维护和测试
- 支持独立的持久化策略

---

## 二、迁移统计

### 文件分类

| 类型              | 待迁移数量 | 预计工时 |
| ----------------- | ---------- | -------- |
| 🟢 简单组件/Hooks | 10         | 1-2天    |
| 🟡 筛选器生态     | 10         | 2-3天    |
| 🟡 业务组件       | 10         | 3-4天    |
| 🔴 核心Hooks重构  | 13         | 5-6天    |
| **总计**          | **43**     | **16天** |

### 难度分布

```
🟢 简单迁移   23% (10个)  ████████░░░░░░░░░░░░
🟡 中等难度   47% (20个)  ███████████████████░
🔴 高难度     30% (13个)  ████████████░░░░░░░░
```

---

## 三、迁移路线图

### 📅 总体时间线

```
周1-2: 准备+阶段1  → 10个简单文件迁移
周3:   阶段2       → 10个筛选器组件迁移
周4:   阶段3       → 10个业务组件迁移
周5-6: 阶段4       → 13个Hooks重构
周7:   阶段5       → 清理优化+测试
```

### 阶段划分

#### 🎯 阶段1：零风险边缘文件（2天）

**目标**：迁移10个无依赖的简单文件

| 文件                        | 迁移方式             | 风险 |
| --------------------------- | -------------------- | ---- |
| use-filter-presets.ts       | → useFilterPresets   | 低   |
| use-persist-data.ts         | → persistenceService | 低   |
| view-mode-selector.tsx      | → useUIStore         | 低   |
| filter-feedback.tsx         | → useFilterStore     | 低   |
| store-initializer.tsx       | → useDataStore       | 低   |
| upload-history.tsx          | → persistenceService | 低   |
| data-export.tsx             | → useInsuranceData   | 低   |
| data-management-panel.tsx   | → useDataStore       | 中   |
| filter-management-panel.tsx | 完成剩余部分         | 低   |
| data-view-selector.tsx      | → useFiltering       | 低   |

**验证标准**：

- ✅ npm run dev 启动成功
- ✅ 手动测试每个功能
- ✅ tsc --noEmit 无错误

#### 🎯 阶段2：筛选器生态（3天）

**目标**：迁移10个筛选器组件，建立统一筛选模式

**核心组件**（第1天）：

- filter-panel.tsx（核心面板）
- time-filter.tsx（时间筛选）
- week-selector.tsx（周次选择）
- organization-filter.tsx（机构筛选）

**扩展组件**（第2天）：

- product-filter.tsx（产品筛选）
- channel-filter.tsx（渠道筛选）
- customer-filter.tsx（客户筛选）

**复合组件**（第3天）：

- compact-time-filter.tsx
- compact-organization-filter.tsx
- more-filters-panel.tsx
- filter-interaction-manager.tsx（关键：筛选联动）

**验证标准**：

- ✅ 筛选功能E2E测试通过
- ✅ 筛选器联动正常
- ✅ 状态持久化测试通过

#### 🎯 阶段3：业务组件（3-4天）

**数据组件**（第1天）：

- file-upload.tsx → useDataStore + persistenceService
- pdf-report-export.tsx → useInsuranceData + useKPICalculation
- filter-presets.tsx → useFilterPresets

**图表组件**（第2天）：

- trend-chart.tsx → useKPITrend
- structure-bar-chart.tsx → useInsuranceDataByDimension
- claim-analysis-bar-chart.tsx → useKPIByDimension
- weekly-operational-trend.tsx → useKPITrend

**业务组件**（第3天）：

- time-progress-indicator.tsx → useTargetStore + KPIService
- prediction-manager.tsx → useInsuranceData + 预测Service

**验证标准**：

- ✅ 功能完整性测试
- ✅ 数据准确性验证
- ✅ 性能测试

#### 🎯 阶段4：Hooks重构（5-6天）

**直接替换**（2天）：

- use-filtered-data.ts → useInsuranceData
- use-kpi.ts → useKPICalculation
- use-smart-comparison.ts → useSmartKPIComparison
- use-kpi-trend.ts → useKPITrend

**维度分析重构**（2天）：

- use-premium-dimension-analysis.ts → useKPIByDimension
- use-loss-dimension-analysis.ts → useKPIByDimension
- use-organization-kpi.ts → useKPIByDimension
- use-marginal-contribution-analysis.ts → 扩展KPIService

**聚合与上传**（2天）：

- use-aggregation.ts → DataService.groupBy
- use-trend.ts → 整合到useKPITrend
- use-premium-targets.ts → useTargetStore
- use-file-upload.ts → 拆分为UploadService + 新Hook

**验证标准**：

- ✅ 所有使用旧Hooks的组件功能测试通过
- ✅ 单元测试覆盖新Hooks
- ✅ 性能对比测试无下降

#### 🎯 阶段5：清理与优化（2天）

**第1天：移除冗余代码**

- 移除use-app-store.ts中已迁移功能
- 移除useFiltering中的双写逻辑
- 删除已废弃的旧Hooks文件

**第2天：测试与文档**

- 运行完整测试套件
- 性能基准测试对比
- 更新文档

**验证标准**：

- ✅ 所有E2E测试通过
- ✅ 性能指标无明显下降
- ✅ 代码覆盖率≥80%
- ✅ 文档完整更新

---

## 四、迁移模式

### 模式1：简单状态读取

```typescript
// ❌ 旧代码
import { useAppStore } from '@/store/use-app-store'
const filters = useAppStore(state => state.filters)

// ✅ 新代码
import { useFilterStore } from '@/store/domains/filterStore'
const filters = useFilterStore(state => state.filters)
```

### 模式2：状态更新操作

```typescript
// ❌ 旧代码
import { useAppStore } from '@/store/use-app-store'
const updateFilters = useAppStore(state => state.updateFilters)
updateFilters({ weeks: [1, 2, 3] })

// ✅ 新代码
import { useFiltering } from '@/hooks/domains/useFiltering'
const { setWeeks } = useFiltering()
setWeeks([1, 2, 3])
```

### 模式3：数据访问+计算

```typescript
// ❌ 旧代码
import { useFilteredData } from '@/store/use-app-store'
import { useKPI } from '@/hooks/use-kpi'
const filteredData = useFilteredData()
const kpiData = useKPI()

// ✅ 新代码
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { useKPICalculation } from '@/hooks/domains/useKPICalculation'
const { filteredData } = useInsuranceData()
const { currentKpi } = useKPICalculation()
```

### 模式4：Hook重构为Service

```typescript
// ❌ 旧代码 - use-aggregation.ts
export function useAggregation(dimension: string) {
  const filteredData = useFilteredData()
  return useMemo(
    () => groupByDimension(filteredData, dimension),
    [filteredData]
  )
}

// ✅ 新代码 - 直接使用Service
import { DataService } from '@/services/DataService'
const aggregated = useMemo(
  () => DataService.groupBy(filteredData, 'business_type_category'),
  [filteredData]
)
```

---

## 五、风险管理

### 主要风险

| 风险             | 严重度 | 缓解策略                    |
| ---------------- | ------ | --------------------------- |
| 数据同步不一致   | 🔴 高  | 保持双写2周，增加一致性校验 |
| 分层筛选功能缺失 | 🟡 中  | 阶段5单独处理               |
| 依赖循环         | 🟡 中  | 代码审查检测循环依赖        |
| 类型不匹配       | 🟢 低  | TypeScript严格检查          |
| 性能下降         | 🟡 中  | 性能监控和优化选择器        |
| 测试覆盖不足     | 🟡 中  | 每阶段运行E2E测试           |

### 缓解措施

#### 双写保护期（2周）

```typescript
// 迁移期间保持新旧store同步
export function useFiltering() {
  const filterStore = useFilterStore()
  const appStore = useAppStore() // 临时保留

  const updateFilters = filters => {
    filterStore.updateFilters(filters) // 新store
    appStore.updateFilters(filters) // 旧store双写
  }
}
```

#### 数据一致性校验

```typescript
export function validateStoreConsistency() {
  const oldData = useAppStore.getState().rawData
  const newData = useDataStore.getState().rawData

  if (oldData.length !== newData.length) {
    logger.error('数据不一致', { oldCount, newCount })
  }
}
```

#### 回滚计划

```bash
# 每个阶段完成后打Git标签
git tag migration-phase-1-complete
git tag migration-phase-2-complete

# 如果出现问题，快速回滚
git reset --hard migration-phase-1-complete
```

---

## 六、测试策略

### 测试金字塔

```
           🔺 E2E测试 (10%)
          核心业务流程测试

       🔺 集成测试 (30%)
      Hook + Store集成测试

   🔺 单元测试 (60%)
  Service/Store/Hook单元测试
```

### 关键测试用例

- **单元测试**：Service层100%覆盖
- **集成测试**：Hook与Store交互测试
- **E2E测试**：上传→筛选→KPI完整流程

---

## 七、成功标准

### 完成标准

- ✅ 所有43个文件迁移完成
- ✅ E2E测试100%通过
- ✅ 性能指标无明显下降
- ✅ 代码覆盖率≥80%
- ✅ 无已知critical/major bug

### 质量指标

| 指标       | 目标 | 当前 |
| ---------- | ---- | ---- |
| 迁移完成度 | 100% | 0%   |
| 测试通过率 | 100% | -    |
| 代码覆盖率 | ≥80% | -    |
| 性能下降   | <5%  | -    |

---

## 八、进度跟踪

### 当前状态：准备阶段

- [x] 深度架构分析完成
- [x] 迁移计划制定
- [ ] 测试套件准备
- [ ] 备份关键文件
- [ ] 开始阶段1迁移

### 里程碑

- **里程碑1**（第2天）：10个零风险文件迁移
- **里程碑2**（第5天）：筛选器生态迁移
- **里程碑3**（第8天）：业务组件迁移50%
- **里程碑4**（第13天）：Hooks重构完成80%
- **里程碑5**（第16天）：迁移全部完成

---

## 九、参考资料

- [Zustand 最佳实践](https://github.com/pmndrs/zustand/wiki/Best-Practices)
- [领域驱动设计（DDD）](https://martinfowler.com/tags/domain%20driven%20design.html)
- [React 状态管理模式](https://kentcdodds.com/blog/application-state-management-with-react)

---

**文档维护**：

- 每阶段完成后更新进度
- 记录遇到的问题和解决方案
- 更新风险评估和缓解措施
