# F015: KPI多层下钻功能

## 功能概述

在KPI卡片和趋势图中实现多层下钻功能，支持用户按多个维度逐层深入分析数据。下钻交互已从弹窗模式升级为**全局下钻导航条**，位于筛选器与内容区域之间，提供更清晰、直观的可视化分析体验。

## 功能特性

### 1. 多维度下钻支持

支持以下9个维度的下钻分析：

- **三级机构**（`third_level_organization`）：按机构进行下钻
- **业务类型**（`business_type_category`）：按业务类型进行下钻
- **险别组合**（`coverage_type`）：按险别组合进行下钻
- **终端来源**（`terminal_source`）：按终端来源进行下钻
- **能源类型**（`is_new_energy_vehicle`）：按新能源/非新能源进行下钻
- **新转续维度**（`renewal_status`）：按续保状态进行下钻
- **是否过户车**（`is_transferred_vehicle`）：按是否过户进行下钻
- **车险种类**（`insurance_type`）：按商业险/交强险进行下钻
- **周次**（`week_number`）：按周次进行下钻（趋势图分析）

### 2. 全局下钻导航条

新的下钻交互模式：

- **位置**：位于顶部筛选器与主要内容区之间。
- **展示**：从左至右逐级展示已选择的维度（面包屑），清晰呈现下钻路径。
- **交互**：
  - 点击KPI卡片或趋势图数据点激活下钻模式。
  - 在导航条中添加新的下钻维度。
  - 点击面包屑节点快速返回上层。
  - 点击左侧关闭按钮退出下钻模式。

### 3. 智能数据展示

- **实时统计**：导航条右侧实时显示当前筛选后的数据量。
- **自动排序**：维度选择器中，维度值按数据量降序排列。
- **关联联动**：下钻操作会实时更新页面下方的内容区域（KPI看板或趋势图）。

## 技术实现

### 核心组件

#### 1. 类型定义（`src/types/drill-down.ts`）

新增`week_number`维度支持。

#### 2. 状态管理（`src/store/drill-down-store.ts`）

新增 `activeKPI` 状态，用于控制全局下钻导航条的显示与内容：

```typescript
interface DrillDownStoreState {
  // ...原有路径状态
  activeKPI: string | null // 当前激活的KPI
  activeKPITitle: string | null // 当前激活的KPI标题
  setActiveKPI: (kpiKey: string | null, title?: string | null) => void
  resetAll: () => void
}
```

#### 3. UI组件

**下钻导航条** (`src/components/features/drill-down/drill-down-bar.tsx`)

- 核心交互组件，集成面包屑导航和维度添加功能。
- 根据 `activeKPI` 状态自动显示或隐藏。

**面包屑导航** (`src/components/features/drill-down/drill-down-breadcrumb.tsx`)

- 展示下钻路径，支持点击返回。

**维度选择器** (`src/components/features/drill-down/dimension-selector.tsx`)

- 提供维度选择和值过滤功能。

### 集成方式

#### 1. 仪表盘集成 (`src/components/dashboard-client.tsx`)

在 `TopToolbar` 和主要内容区之间集成 `DrillDownBar`：

```tsx
{
  hasData && (activeTab === 'kpi' || activeTab === 'trend') && (
    <div className="mb-6">
      <DrillDownBar />
    </div>
  )
}
```

#### 2. KPI卡片集成 (`src/components/features/kpi-card-with-drilldown.tsx`)

点击下钻按钮时，不再弹出对话框，而是调用 `setActiveKPI` 激活全局导航条：

```tsx
const handleStartDrillDown = () => {
  setActiveKPI(kpiKey, title)
}
```

#### 3. 趋势图集成 (`src/components/features/weekly-operational-trend.tsx`)

点击图表数据点时，自动添加周次下钻步骤并激活导航条：

```tsx
const handlePointClick = (point) => {
  clearDrillDownPath(TREND_KPI_KEY)
  addDrillDownStep(TREND_KPI_KEY, { ...week_step... })
  setActiveKPI(TREND_KPI_KEY, '趋势下钻分析')
}
```

## 使用方式

### 1. 进入下钻模式

- **KPI看板**：点击任意KPI卡片的「下钻」按钮。
- **趋势分析**：点击趋势图中的任意数据点（圆点）。

### 2. 进行下钻分析

- 页面顶部会出现下钻导航条。
- 点击导航条中的「+ 添加下钻维度」按钮，选择维度和值。
- 下方内容区域会实时更新为筛选后的数据。

### 3. 退出下钻

点击导航条左侧的关闭按钮 (X)，即可退出下钻模式，恢复默认视图。

## 更新日志

### v1.3.0 (2025-12-09)

- ♻️ **重构交互**：移除弹窗式下钻，采用全局下钻导航条。
- ✨ **体验优化**：下钻路径可视化更清晰，操作更便捷。
- 🔧 **趋势图集成**：趋势图点击交互适配新的下钻模式。
- 🗑️ **代码清理**：移除旧版 `DrillDownControl` 和相关 Dialog 组件。

### v1.2.0 (2025-12-07)

- ✅ 趋势分析组件集成多层下钻功能

### v1.0.0 (2025-12-07)

- ✅ 实现多层下钻核心功能
