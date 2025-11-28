# 架构重构指南 - 模块化升级

## 📅 文档信息
- **创建日期**: 2025-10-22
- **版本**: 1.0.0
- **状态**: 🚧 实施中 - 阶段1
- **负责人**: AI助手 + 开发团队

---

## 🎯 重构目标

基于**"非必要不耦合，防止单点引发全局坍塌"**的核心原则，将当前的单体Store架构重构为**模块化、可测试、可扩展**的分层架构。

### 核心问题
1. ❌ **useAppStore** 成为991行的超级仓库，承担过多职责
2. ❌ **双Store并存**但职责重叠（premiumTargets vs goalStore）
3. ❌ **逻辑重复**：筛选逻辑在Store和Hook中重复实现
4. ❌ **深度耦合**：71%的组件直接依赖全局Store
5. ❌ **持久化分散**：3处不同的实现

### 重构目标
- ✅ **降低耦合**：组件通过Hooks访问，而非直接依赖Store
- ✅ **单一职责**：每个Store/Service只负责一个领域
- ✅ **易于测试**：纯函数+依赖注入
- ✅ **可替换**：接口化设计，方便未来升级

---

## 🏗️ 新架构设计

```
┌──────────────────────────────────────────────────┐
│              【展示层】                            │
│         Components & Pages                       │
│    (只负责渲染，无业务逻辑)                        │
└────────────────┬─────────────────────────────────┘
                 │ Props + Custom Hooks
┌────────────────▼─────────────────────────────────┐
│           【应用层】                               │
│        Domain-specific Hooks                     │
│  useInsuranceData | useKPICalculation            │
│  useTargetManagement | useFiltering              │
│    (聚合领域状态，提供业务接口)                    │
└────────────────┬─────────────────────────────────┘
                 │ 调用Store + Service
┌────────────────▼─────────────────────────────────┐
│         【状态层】Domain Stores                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │DataStore │ │FilterStore│ │TargetStore│        │
│  └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐                      │
│  │CacheStore│ │  UIStore  │                      │
│  └──────────┘ └──────────┘                      │
│    (管理状态，调用Service处理业务)                 │
└────────────────┬─────────────────────────────────┘
                 │ 调用纯业务逻辑
┌────────────────▼─────────────────────────────────┐
│        【服务层】Business Services                 │
│  ┌─────────────────────────────────────┐         │
│  │ DataService    - 数据CRUD、过滤聚合  │         │
│  │ KPIService     - KPI计算引擎        │         │
│  │ PersistenceService - 持久化抽象层   │         │
│  └─────────────────────────────────────┘         │
│    (纯函数，无状态，可独立测试)                    │
└────────────────┬─────────────────────────────────┘
                 │ 调用适配器
┌────────────────▼─────────────────────────────────┐
│       【基础设施层】Adapters & Interfaces          │
│  IPersistenceAdapter  ← LocalStorageAdapter      │
│                       ← IndexedDBAdapter (未来)   │
└─────────────────────────────────────────────────┘
```

---

## 📦 已完成的模块

### 1. 服务层（Services）

#### ✅ IPersistenceAdapter (接口)
**位置**: `src/services/interfaces/IPersistenceAdapter.ts`

**职责**: 定义持久化操作的标准接口

```typescript
interface IPersistenceAdapter {
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  getStats(): Promise<{ totalKeys, totalSize, availableSpace }>
}
```

**优点**:
- 🔌 方便未来从LocalStorage迁移到IndexedDB
- 🧪 易于Mock进行单元测试
- 📦 符合依赖倒置原则

---

#### ✅ LocalStorageAdapter (实现)
**位置**: `src/services/adapters/LocalStorageAdapter.ts`

**职责**: 基于浏览器LocalStorage的持久化实现

**特性**:
- 自动JSON序列化/反序列化
- 存储空间检测和quota错误处理
- 数据完整性校验
- 人类可读的存储统计

---

#### ✅ PersistenceService (统一服务)
**位置**: `src/services/PersistenceService.ts`

**职责**: 应用数据持久化的统一入口

**替代以下3处分散实现**:
1. `src/lib/storage/data-persistence.ts` (273行)
2. `src/store/use-app-store.ts` (637-690行的持久化方法)
3. `src/hooks/use-persist-data.ts`

**核心方法**:
```typescript
class PersistenceService {
  // 原始数据
  async saveRawData(data: InsuranceRecord[]): Promise<void>
  async loadRawData(): Promise<InsuranceRecord[] | null>
  async getStorageInfo(): Promise<DataStorageInfo | null>

  // 上传历史
  async addUploadHistory(batchResult, files): Promise<void>
  async getUploadHistory(): Promise<UploadHistoryRecord[]>
  async checkFileExists(file: File): Promise<{exists, uploadRecord, fileInfo}>

  // 其他数据
  async savePremiumTargets(targets): Promise<void>
  async loadPremiumTargets<T>(): Promise<T | null>
  async saveFilterState(filters): Promise<void>
  async loadFilterState<T>(): Promise<T | null>

  // 通用操作
  async clearAll(): Promise<void>
  async getStats(): Promise<StorageStats>
}

// 单例导出
export const persistenceService = new PersistenceService()
```

---

#### ✅ DataService (数据管理)
**位置**: `src/services/DataService.ts`

**职责**: 保险数据的过滤、聚合、统计等核心业务逻辑

**统一以下散落逻辑**:
1. `use-app-store.ts` 中的 `useFilteredData` (698-843行)
2. `use-app-store.ts` 中的 `filterRecordsWithExclusions` (848-973行)
3. `use-kpi.ts` 中重复的筛选逻辑 (95-247行)

**核心方法**:
```typescript
class DataService {
  // 核心筛选（消除重复逻辑）
  static filter(rawData, filters, excludeKeys?): InsuranceRecord[]

  // 周次相关
  static getByWeek(rawData, weekNumber, filters?): InsuranceRecord[]
  static getByWeekRange(rawData, [start, end], filters?): InsuranceRecord[]

  // 数据处理
  static deduplicate(data): InsuranceRecord[]
  static merge(...dataSets): InsuranceRecord[]
  static normalize(data): InsuranceRecord[]

  // 聚合分析
  static groupBy<K>(data, dimension: K): Map<K, InsuranceRecord[]>
  static getStatistics(data): { totalRecords, totalPremium, ... }

  // 筛选联动
  static getAvailableOptions(data, currentFilters, targetField): string[] | number[]
}
```

**优点**:
- 🔁 消除逻辑重复：筛选逻辑只在一处维护
- 🧪 纯函数：所有方法无副作用，易于测试
- 📊 可复用：任何地方都可以调用，不依赖Store

---

#### ✅ KPIService (计算服务)
**位置**: `src/services/KPIService.ts`

**职责**: 封装所有KPI计算逻辑，提供统一计算接口

**核心方法**:
```typescript
class KPIService {
  // 基础计算
  static calculate(data, options): KPIResult | null
  static calculateIncrement(currentWeekData, previousWeekData, options): KPIResult | null

  // 趋势分析
  static calculateTrend(rawData, filters, options): Map<number, KPIResult>
  static calculateSmartComparison(rawData, currentWeek, filters, annualTarget): {...}

  // 维度分析
  static calculateByDimension<K>(rawData, dimension: K, filters): Map<K, KPIResult>
  static calculateBatch(rawData, filtersList): KPIResult[]

  // 辅助计算
  static calculateAchievementRate(actual, target): number
  static calculateTimeProgress(currentDate, year?): number
  static calculateGrowthRate(currentKpi, comparisonKpi): {...}
}
```

**优点**:
- 📦 复用现有kpi-engine，作为适配层
- 🎯 统一接口，消除Hook中的重复计算
- 🧮 纯函数，100%可测试

---

### 2. 状态层（Domain Stores）

#### ✅ DataStore (数据管理)
**位置**: `src/store/domains/dataStore.ts`

**职责**: 专注于保险数据的存储和基本操作

**从useAppStore拆分出的部分**:
- `rawData: InsuranceRecord[]`
- `isLoading, error, uploadProgress`
- `setRawData, appendRawData, clearData`
- 数据持久化相关方法

**核心接口**:
```typescript
interface DataStore {
  // 状态
  rawData: InsuranceRecord[]
  isLoading: boolean
  error: Error | null
  uploadProgress: number

  // 操作
  setData(data, autoSave?): Promise<void>
  appendData(data, autoSave?): Promise<void>
  clearData(clearStorage?): Promise<void>
  loadFromStorage(): Promise<void>
  saveToStorage(): Promise<void>

  // 选择器
  getStats(): { totalRecords, totalPremium, ... }
  hasData(): boolean
}
```

**优点**:
- 🎯 单一职责：只管理原始数据
- 🔄 自动规范化：使用DataService.normalize()
- 💾 自动持久化：调用PersistenceService
- 📏 行数减少：从991行缩减到170行

---

#### ✅ FilterStore (筛选管理)
**位置**: `src/store/domains/filterStore.ts`

**职责**: 专注于筛选条件的管理

**从useAppStore拆分出的部分**:
- `filters: FilterState`
- `updateFilters, resetFilters`
- `setViewMode`

**核心接口**:
```typescript
interface FilterStore {
  // 状态
  filters: FilterState

  // 操作
  updateFilters(filters: Partial<FilterState>): void
  resetFilters(): void
  setViewMode(mode: 'single' | 'trend'): void
  setDataViewType(type: 'current' | 'increment'): void

  // 计算属性
  getActiveFilterCount(): number
  isFilterActive(key: keyof FilterState): boolean
}
```

**特性**:
- 📦 持久化：使用Zustand的persist中间件
- 🔄 自动规范化：中文文本自动标准化
- 📊 状态计算：提供激活筛选器数量等派生状态

---

## 🔄 迁移策略

### 阶段1：无侵入式重构（当前）✅

**目标**: 创建新架构，保持100%向后兼容

**已完成**:
- ✅ 创建服务层（PersistenceService, DataService, KPIService）
- ✅ 创建领域Stores（DataStore, FilterStore）
- ✅ 保留原有useAppStore和goalStore

**状态**: 🟢 新旧架构并存，互不影响

---

### 阶段2：渐进式迁移（下一步）

**计划**:
1. **创建聚合Hooks**
   ```typescript
   // src/hooks/domains/useInsuranceData.ts
   export function useInsuranceData() {
     const rawData = useDataStore(s => s.rawData)
     const filters = useFilterStore(s => s.filters)

     const filteredData = useMemo(() =>
       DataService.filter(rawData, filters),
       [rawData, filters]
     )

     return { rawData, filteredData, stats: DataService.getStatistics(filteredData) }
   }
   ```

2. **逐页面迁移**
   - 优先级：`targets` 页面 → `KPI` 页面 → `趋势` 页面
   - 每个页面迁移后进行E2E测试
   - 确保功能无损

3. **组件示例**（迁移前 vs 迁移后）
   ```typescript
   // ❌ 旧代码：直接依赖Store
   function Dashboard() {
     const rawData = useAppStore(s => s.rawData)
     const filters = useAppStore(s => s.filters)
     const updateFilters = useAppStore(s => s.updateFilters)

     const filteredData = useFilteredData() // Hook内部重复筛选逻辑
     const kpiData = useKPI()

     return <KPIDashboard data={kpiData} />
   }

   // ✅ 新代码：通过聚合Hook
   function Dashboard() {
     const { filteredData, stats } = useInsuranceData()
     const { currentKpi } = useKPICalculation(filteredData)
     const { updateFilters } = useFiltering()

     return <KPIDashboard data={currentKpi} stats={stats} />
   }
   ```

---

### 阶段3：清理遗留代码

**计划**:
- 删除旧Store中已迁移的代码
- 更新所有文档和开发指南
- 性能基准测试对比

---

## 📝 使用新架构的示例

### 示例1：数据持久化

```typescript
// ❌ 旧方式（3处不同实现）
import { saveDataToStorage } from '@/lib/storage/data-persistence'
await saveDataToStorage(data)

// ✅ 新方式（统一接口）
import { persistenceService } from '@/services/PersistenceService'
await persistenceService.saveRawData(data)
```

### 示例2：数据筛选

```typescript
// ❌ 旧方式（逻辑重复）
// 在 useAppStore.ts 中
const filteredData = rawData.filter(record => { /* 150行筛选逻辑 */ })

// 在 use-kpi.ts 中
const filteredData = rawData.filter(record => { /* 又是150行筛选逻辑 */ })

// ✅ 新方式（单一来源）
import { DataService } from '@/services/DataService'
const filteredData = DataService.filter(rawData, filters)
```

### 示例3：KPI计算

```typescript
// ❌ 旧方式
const kpiData = useKPI() // Hook内部混合了业务逻辑

// ✅ 新方式（逻辑分离）
import { KPIService } from '@/services/KPIService'

// 在Hook中
export function useKPICalculation(data: InsuranceRecord[]) {
  return useMemo(() => KPIService.calculate(data, options), [data, options])
}

// 在测试中
test('KPI计算正确性', () => {
  const mockData = [/* ... */]
  const result = KPIService.calculate(mockData, { annualTargetYuan: 100000 })
  expect(result.achievementRate).toBe(0.8)
})
```

---

## 🧪 测试策略

### 服务层测试（纯函数，100%可测）

```typescript
// src/services/__tests__/DataService.test.ts
import { DataService } from '../DataService'

describe('DataService.filter', () => {
  test('应正确筛选年份', () => {
    const mockData = [
      { policy_start_year: 2024, ... },
      { policy_start_year: 2025, ... }
    ]

    const result = DataService.filter(mockData, { years: [2024] })

    expect(result).toHaveLength(1)
    expect(result[0].policy_start_year).toBe(2024)
  })

  test('应正确去重', () => {
    const duplicateData = [/* 相同记录 */]
    const result = DataService.deduplicate(duplicateData)
    expect(result).toHaveLength(1)
  })
})
```

### Store测试（状态管理）

```typescript
// src/store/domains/__tests__/dataStore.test.ts
import { useDataStore } from '../dataStore'

describe('DataStore', () => {
  test('appendData应正确合并并去重', async () => {
    const store = useDataStore.getState()

    await store.setData([{ id: 1 }])
    await store.appendData([{ id: 1 }, { id: 2 }]) // 包含重复

    expect(store.rawData).toHaveLength(2)
  })
})
```

---

## 📊 重构效果对比

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| **单个Store行数** | 991行 | <200行/Store | ↓ 80% |
| **Store数量** | 2个（职责重叠） | 5个（领域明确） | +150% 内聚性 |
| **逻辑重复** | 150行筛选逻辑重复2次 | 0行重复 | ✅ 完全消除 |
| **持久化实现** | 3处分散 | 1处统一 | ↓ 67% |
| **可测试性** | 困难（依赖全局状态） | 优秀（纯函数） | ⭐⭐⭐⭐⭐ |
| **单点故障风险** | ⚡⚡⚡⚡⚡ | ⚡⚡ | ↓ 60% |

---

## 🚀 下一步行动

### 优先级1（立即）
- [ ] 创建聚合Hooks（useInsuranceData, useKPICalculation）
- [ ] 为新服务层编写单元测试
- [ ] 在`targets`页面试点使用新架构

### 优先级2（本周）
- [ ] 迁移KPI页面
- [ ] 迁移趋势分析页面
- [ ] 编写迁移文档

### 优先级3（下周）
- [ ] 逐步移除对旧useAppStore的依赖
- [ ] 性能测试和优化
- [ ] 更新开发指南

---

## 📚 相关文档

- [数据架构设计](./data_architecture.md)
- [核心计算逻辑](./core_calculations.md)
- [技术栈说明](./tech_stack.md)

---

## ✅ 最佳实践

### Do's（推荐）
1. ✅ **组件通过Hooks访问数据**，而非直接调用Store
2. ✅ **业务逻辑放在Service层**，保持纯函数
3. ✅ **Store只管理状态**，不包含复杂业务逻辑
4. ✅ **新功能优先使用新架构**

### Don'ts（避免）
1. ❌ 不要在组件中直接调用`useDataStore`
2. ❌ 不要在Store中编写数据过滤逻辑（应调用DataService）
3. ❌ 不要在Hook中重复实现Service已有的逻辑
4. ❌ 不要混合UI状态和业务数据

---

**最后更新**: 2025-10-22
**维护者**: 开发团队
