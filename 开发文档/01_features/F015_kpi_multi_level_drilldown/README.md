# F015: KPI多层下钻功能

## 功能概述

在KPI卡片中实现多层下钻功能，支持用户按多个维度逐层深入分析数据，每次下钻可选择不同维度，已下钻的维度不会重复出现。

## 功能特性

### 1. 多维度下钻支持

支持以下8个维度的下钻分析：

- **三级机构**（`third_level_organization`）：按机构进行下钻
- **业务类型**（`business_type_category`）：按业务类型进行下钻
- **险别组合**（`coverage_type`）：按险别组合进行下钻
- **终端来源**（`terminal_source`）：按终端来源进行下钻
- **能源类型**（`is_new_energy_vehicle`）：按新能源/非新能源进行下钻
- **新转续维度**（`renewal_status`）：按续保状态进行下钻
- **是否过户车**（`is_transferred_vehicle`）：按是否过户进行下钻
- **车险种类**（`insurance_type`）：按商业险/交强险进行下钻

### 2. 下钻路径管理

- **多层级下钻**：支持无限层级的下钻（理论上最多8层）
- **维度不重复**：每个维度只能使用一次，已下钻的维度不再出现在选择列表中
- **路径独立**：每个KPI卡片的下钻路径相互独立，互不影响

### 3. 可视化导航

- **面包屑导航**：清晰展示当前的下钻路径
- **快速回退**：点击面包屑可快速返回到任意上层
- **一键清除**：支持一键清除所有下钻条件

### 4. 智能数据展示

- **实时统计**：显示当前层级的数据量
- **自动排序**：维度值按数据量降序排列
- **数据计数**：每个维度值旁显示对应的记录数

## 技术实现

### 核心组件

#### 1. 类型定义（`src/types/drill-down.ts`）

```typescript
// 下钻维度键
export type DrillDownDimensionKey =
  | 'third_level_organization'
  | 'business_type_category'
  | 'coverage_type'
  | 'terminal_source'
  | 'is_new_energy_vehicle'
  | 'renewal_status'
  | 'is_transferred_vehicle'
  | 'insurance_type'

// 下钻步骤
export interface DrillDownStep {
  dimensionKey: DrillDownDimensionKey
  dimensionLabel: string
  value: string | boolean
  displayLabel: string
}

// KPI下钻路径
export interface KPIDrillDownPath {
  kpiKey: string
  steps: DrillDownStep[]
}
```

#### 2. 状态管理（`src/store/drill-down-store.ts`）

使用Zustand管理下钻状态：

```typescript
interface DrillDownStoreState {
  paths: Record<string, KPIDrillDownPath>
  addDrillDownStep: (kpiKey: string, step: DrillDownStep) => void
  removeDrillDownStepsFrom: (kpiKey: string, stepIndex: number) => void
  clearDrillDownPath: (kpiKey: string) => void
  getUsedDimensions: (kpiKey: string) => DrillDownDimensionKey[]
  getAvailableDimensions: (kpiKey: string) => DrillDownDimension[]
}
```

#### 3. UI组件

**面包屑导航** (`src/components/features/drill-down/drill-down-breadcrumb.tsx`)
- 展示下钻路径
- 支持点击返回上层
- 一键清除功能

**维度选择器** (`src/components/features/drill-down/dimension-selector.tsx`)
- 两步选择流程：先选维度，再选值
- 智能排除已使用的维度
- 按数据量排序显示维度值

**下钻控制器** (`src/components/features/drill-down/drill-down-control.tsx`)
- 整合面包屑和维度选择器
- 处理数据筛选逻辑
- 显示实时数据统计

**带下钻的KPI卡片** (`src/components/features/kpi-card-with-drilldown.tsx`)
- 封装原有KPI卡片
- 添加下钻按钮和徽章
- 对话框展示下钻界面

### 数据筛选逻辑

下钻功能通过在全局筛选器基础上叠加下钻路径实现：

```typescript
filteredData = rawData.filter(record => {
  // 1. 应用全局筛选器条件
  if (!passGlobalFilters(record)) return false

  // 2. 应用下钻路径条件
  for (const step of drillDownSteps) {
    const recordValue = getRecordValue(record, step.dimensionKey)
    if (recordValue !== step.value) return false
  }

  return true
})
```

## 使用方式

### 1. 进入下钻模式

点击任意KPI卡片右上角的「下钻」按钮，或直接点击卡片主体区域。

### 2. 选择下钻维度

1. 在弹出的对话框中，从「选择维度」下拉列表选择要下钻的维度
2. 系统会显示该维度的所有可选值及对应的记录数
3. 点击任意值完成一次下钻

### 3. 继续下钻或返回

- **继续下钻**：重复步骤2，选择其他未使用的维度继续深入分析
- **返回上层**：点击面包屑中的任意层级，或点击清除按钮

### 4. 退出下钻

关闭对话框即可退出下钻模式，下钻路径会保存在本地存储中。

## 存储机制

- 使用Zustand的`persist`中间件实现状态持久化
- 存储键：`drill-down-storage`
- 版本：v1
- 下钻路径会自动保存到LocalStorage，刷新页面后仍然保留

## 注意事项

1. **与全局筛选器的关系**
   - 下钻条件会叠加在全局筛选器之上
   - 修改全局筛选器不会清除下钻路径
   - 建议在设置好全局筛选器后再使用下钻功能

2. **性能考虑**
   - 下钻过程中实时筛选数据，数据量较大时可能有轻微延迟
   - 建议先使用全局筛选器缩小数据范围

3. **布尔值显示**
   - 布尔类型的维度值会自动转换为中文显示（是/否）
   - 存储时保持原始布尔值

## 后续优化方向

1. **KPI实时计算**：根据下钻路径实时重新计算KPI值
2. **下钻历史**：记录下钻历史，支持快速切换
3. **下钻预设**：保存常用的下钻路径组合
4. **可视化增强**：在图表中也支持下钻功能
5. **导出功能**：支持导出当前下钻层级的数据

## 相关文件

### 类型定义
- `src/types/drill-down.ts` - 下钻功能类型定义

### 状态管理
- `src/store/drill-down-store.ts` - 下钻状态管理

### UI组件
- `src/components/features/drill-down/drill-down-breadcrumb.tsx` - 面包屑导航
- `src/components/features/drill-down/dimension-selector.tsx` - 维度选择器
- `src/components/features/drill-down/drill-down-control.tsx` - 下钻控制器
- `src/components/features/drill-down/index.ts` - 组件导出

### 集成组件
- `src/components/features/kpi-card-with-drilldown.tsx` - 带下钻的KPI卡片
- `src/components/features/kpi-dashboard.tsx` - KPI看板（已集成下钻功能）

## 更新日志

### v1.0.0 (2025-12-07)
- ✅ 实现多层下钻核心功能
- ✅ 支持8个维度的下钻分析
- ✅ 面包屑导航可视化
- ✅ 维度智能选择器
- ✅ 状态持久化
- ✅ 集成到8个核心KPI卡片
