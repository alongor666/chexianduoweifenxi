# 统一可视化引擎架构文档（ECharts）

## 📋 文档概述

本文档描述了项目可视化引擎的统一改造方案，将所有图表组件从 Recharts 迁移到 ECharts，建立统一的架构体系。

**创建日期**: 2025-12-07
**负责人**: AI 协作开发
**状态**: 进行中

---

## 🎯 改造目标

### 核心目标

1. **统一可视化引擎**：所有图表组件使用 ECharts (v6.0.0)
2. **建立标准化体系**：统一视觉规范、配置协议、交互模式
3. **提升可维护性**：减少代码重复，降低学习成本
4. **增强功能性**：支持联动、下钻、复杂图型和大数据渲染

### 技术理由

ECharts 相比 Recharts 的优势：

1. ✅ **多维视觉编码**：支持更复杂的数据映射和视觉通道
2. ✅ **联动与下钻**：内置强大的交互事件系统
3. ✅ **复杂图型**：支持热力图、雷达图、关系图等高级图表
4. ✅ **大数据渲染**：LTTB 降采样、Canvas 渲染、脏矩形优化
5. ✅ **生态成熟**：文档完善，社区活跃，企业级应用验证

---

## 🏗️ 架构设计

### 整体结构

```
src/
├── components/charts/          # 图表组件目录
│   ├── BaseEChart.tsx          # 基础 ECharts 组件（核心）
│   ├── Sparkline.tsx           # 微型趋势图组件
│   ├── DistributionPieChart.tsx    # 饼图组件（待迁移）
│   ├── DimensionBarChart.tsx       # 柱状图组件（待迁移）
│   ├── CustomerSegmentationBubble.tsx  # 气泡图组件（待迁移）
│   └── index.ts                # 统一导出
│
├── lib/charts/                 # 图表配置库
│   ├── theme.ts                # 统一主题配置
│   ├── builders.ts             # 配置构建函数
│   ├── interactions.ts         # 联动与下钻机制
│   ├── templates/              # 标准图表模板
│   │   ├── trend.ts            # 趋势类图模板
│   │   ├── scatter.ts          # 散点/气泡图模板
│   │   └── heatmap.ts          # 热力图模板
│   └── index.ts                # 统一导出
│
└── components/ui/sparkline.tsx  # 旧组件（向后兼容）
```

### 核心组件

#### 1. BaseEChart - 基础组件

统一的 ECharts 封装组件，提供：

- ✅ 自动初始化和销毁 ECharts 实例
- ✅ 响应式尺寸调整（ResizeObserver）
- ✅ 统一的配置合并
- ✅ 统一的事件处理（onClick, onDblClick, onMouseOver 等）
- ✅ 加载状态管理
- ✅ 空状态渲染
- ✅ 性能优化（脏矩形、LTTB 降采样）

**使用示例**：

```tsx
import { BaseEChart } from '@/components/charts/BaseEChart'

;<BaseEChart
  option={chartOption}
  height={400}
  loading={isLoading}
  onClick={(params, chart) => handleClick(params)}
/>
```

#### 2. 主题系统（theme.ts）

**颜色编码规则**：

```typescript
CHART_COLORS = {
  primary: ['#3b82f6', '#f97316', '#10b981', ...],  // 主色板
  risk: {
    safe: '#10b981',      // 安全 - 绿色
    warning: '#f59e0b',   // 预警 - 黄色
    danger: '#ef4444',    // 危险 - 红色
  },
  metrics: {
    premium: '#3b82f6',       // 保费 - 蓝色
    lossRatio: '#f97316',     // 赔付率 - 橙色
    contribution: '#10b981',  // 边际贡献 - 绿色
  },
}
```

**阈值线规则**：

```typescript
THRESHOLD_LINES = {
  lossRatio: { value: 70, color: '#ef4444', lineStyle: 'dashed' },
  contribution: { value: 15, color: '#10b981', lineStyle: 'dashed' },
}
```

**风险区间规则**：

```typescript
RISK_ZONES = {
  lossRatio: {
    safe: { max: 60, color: 'rgba(16, 185, 129, 0.05)' },
    warning: { min: 60, max: 70, color: 'rgba(245, 158, 11, 0.1)' },
    danger: { min: 70, color: 'rgba(239, 68, 68, 0.15)' },
  },
}
```

**统一样式**：

- Grid（网格）：`CHART_GRID.default`
- Tooltip（提示框）：`CHART_TOOLTIP`
- Legend（图例）：`CHART_LEGEND`
- XAxis/YAxis（坐标轴）：`CHART_AXIS.xAxis` / `CHART_AXIS.yAxis`
- DataZoom（缩放）：`CHART_DATAZOOM.slider` / `CHART_DATAZOOM.inside`

#### 3. 配置构建函数（builders.ts）

提供快捷函数简化配置：

```typescript
// 构建标准网格
buildGrid('default' | 'compact' | 'vertical')

// 构建双 Y 轴
buildDualYAxis(leftConfig, rightConfig)

// 构建阈值线
buildThresholdLine('lossRatio' | 'contribution', customValue?)

// 构建风险区域
buildRiskArea(thresholdValue, options?)

// 构建系列
buildLineSeries(config)
buildBarSeries(config)
buildScatterSeries(config)
buildPieSeries(config)
buildRadarSeries(config)
buildHeatmapSeries(config)
```

---

## 📊 标准图表模板

### 1. 趋势类图模板（trend.ts）

**适用场景**：周度经营趋势、时间序列分析

**标准要素**：

- ✅ 维度：时间（周序号/月份/年度）
- ✅ 指标：核心经营指标（多轴支持）
- ✅ 要素：阈值线、拐点、高风险区间、异常点提示
- ✅ 交互：点击 → 下钻

**使用示例**：

```typescript
import { buildTrendChart } from '@/lib/charts/templates/trend'

const option = buildTrendChart({
  data: [
    { label: '第1周', primaryValue: 1000, secondaryValue: 65, isRisk: false },
    { label: '第2周', primaryValue: 1200, secondaryValue: 72, isRisk: true },
  ],
  primary: {
    name: '签单保费',
    unit: '万元',
    showArea: true,
  },
  secondary: {
    name: '赔付率',
    unit: '%',
    threshold: 70,
    showTrendLine: true,
  },
  showDataZoom: true,
})
```

### 2. 风险散点/气泡矩阵模板（scatter.ts）

**适用场景**：客户分群、风险分析、多维数据对比

**标准要素**：

- ✅ X 轴：数值维度（如：单均保费）
- ✅ Y 轴：风险指标（如：赔付率）
- ✅ Size：业务规模（如：保单件数）
- ✅ Color：风险等级/分类
- ✅ 交互：点击 → 联动趋势图

**使用示例**：

```typescript
import { buildScatterChart } from '@/lib/charts/templates/scatter'

const option = buildScatterChart({
  data: [
    { name: '个人客户', x: 3500, y: 55, size: 10000, category: '高价值' },
    { name: '企业客户', x: 2800, y: 75, size: 8000, category: '高风险' },
  ],
  xAxis: { name: '单均保费', unit: '元' },
  yAxis: { name: '赔付率', unit: '%' },
  bubble: { name: '保单件数', minSize: 10, maxSize: 80 },
  referenceLines: { xValue: 3000, yValue: 65 },
  quadrants: {
    enabled: true,
    xValue: 3000,
    yValue: 65,
    labels: {
      topRight: '💎 高价值',
      topLeft: '⚠️ 高风险',
    },
  },
})
```

### 3. 热力矩阵模板（heatmap.ts）

**适用场景**：机构×车型风险矩阵、时间×指标趋势热力图

**标准要素**：

- ✅ 维度：机构 × 车型（或其他组合）
- ✅ 值：风险/成本类指标
- ✅ 交互：单元格点击 → 下钻

**使用示例**：

```typescript
import { buildHeatmapChart } from '@/lib/charts/templates/heatmap'

const option = buildHeatmapChart({
  data: [
    { x: '天府', y: '非营客-新', value: 68.5 },
    { x: '高新', y: '非营客-新', value: 72.3 },
  ],
  xAxis: { name: '机构', categories: ['天府', '高新', '宜宾'] },
  yAxis: { name: '车型', categories: ['非营客-新', '非营客-旧'] },
  value: { name: '赔付率', unit: '%' },
  colorScheme: 'risk',
  showLabel: true,
})
```

---

## 🔗 联动与下钻机制

### 架构设计

```typescript
// 全局事件管理器
import { globalChartEventManager } from '@/lib/charts/interactions'

// 注册图表
globalChartEventManager.registerChart('chart-1', chartInstance)

// 注册下钻处理器
globalChartEventManager.onDrillDown('chart-1', data => {
  console.log('下钻到:', data.targetDimension)
  // 更新筛选条件
  updateFilters(drillDownToFilters(data, currentFilters))
})

// 触发联动
globalChartEventManager.triggerLinkage({
  type: 'highlight',
  sourceChartId: 'chart-1',
  targetChartIds: ['chart-2', 'chart-3'],
  data: { seriesName: '业务类型', dataIndex: 0 },
})
```

### 标准下钻路径

1. **机构 → 车型 → 业务单元**
2. **风险点 → 趋势 → 成本构成**
3. **业务类型 → 机构 → 险别**
4. **周次 → 机构/车型 → 明细**

### 联动机制

- **主图 → 子图联动**：点击主图数据点，子图高亮对应数据
- **子图 → 维度切换**：子图选择不同维度，主图自动更新
- **选区（brush）→ 批量下钻**：框选多个数据点，批量应用筛选

---

## 🚀 迁移路径

### Phase 1: 基础设施（✅ 已完成）

- [X] 建立统一 ECharts 基础组件体系
- [X] 创建主题配置系统（theme.ts）
- [X] 创建配置构建函数（builders.ts）
- [X] 创建标准图表模板（trend/scatter/heatmap）
- [X] 创建联动与下钻机制（interactions.ts）

### n p

---

## 📐 统一约束

### 强制约束

1. ✅ **所有新增图表必须使用 ECharts**
2. ✅ **所有图表必须使用 BaseEChart 组件**
3. ✅ **所有图表必须遵循统一主题配置**
4. ✅ **所有联动必须走统一事件模型**
5. ✅ **所有维度切换必须走统一配置协议**

### 推荐实践

1. ✅ **优先使用标准模板**（trend/scatter/heatmap）
2. ✅ **复用配置构建函数**（builders.ts）
3. ✅ **统一颜色编码**（CHART_COLORS）
4. ✅ **统一阈值线**（buildThresholdLine）
5. ✅ **统一 Tooltip 格式**（CHART_TOOLTIP）

---

## 🎨 设计原则

### 视觉一致性

- **颜色**：所有图表使用统一色板（CHART_COLORS）
- **字体**：统一字号、字重、颜色（CHART_FONTS）
- **间距**：统一网格间距（CHART_GRID）
- **动画**：统一动画时长和缓动函数（CHART_ANIMATION）

### 基础样式统一规范（0.1）

- 去掉全部网格线：统一关闭 `splitLine`/`splitArea`
- 所有文字使用粗体：轴标签、图例、Tooltip 文本加粗
- 预警线清晰可见：使用统一 `markLine`（红色虚线/绿色目标线）
- X 轴文字不可倾斜：`rotate=0`；启用 `hideOverlap` 避免遮挡
- X 轴文字自动缩小适应间距：通过 `hideOverlap` 与截断策略
- X 轴文字不允许交叉：截断与隐藏重叠策略结合
- 气泡图坐标轴名称可见：保证 `nameLocation='middle'` 与 `containLabel=true`
- 固定值标签：柱/折/热力图格内统一开启 `label.show=true`
- 页面主体框架采用 16:9：主内容容器 `aspect-[16/9]`，滚动适配

### 排序规范（0.2）

- 所有图表统一从“最差 → 最好”
- 异常程度越高越靠前（逆向指标按高→低，正向指标按低→高）
- 图表排序与标题说明保持一致

### 标题规范（0.3）

- 每个标签页必须配置标题，左对齐，主色一致（蓝色系）
- 标题遵循排序逻辑，必要时在副标题说明排序依据与指标口径

### 交互一致性

- **Tooltip**：统一样式、统一格式化逻辑
- **高亮**：统一 hover 效果
- **点击**：统一下钻逻辑
- **缩放**：统一 DataZoom 配置

### 性能优化

- **LTTB 降采样**：大数据集自动降采样
- **脏矩形优化**：只重绘变化部分
- **Canvas 渲染**：默认使用 Canvas（性能优先）
- **按需加载**：微型图表禁用动画和自动 resize

---

## 📚 使用指南

### 快速开始

```tsx
// 1. 导入基础组件
import { BaseEChart } from '@/components/charts/BaseEChart'

// 2. 导入配置函数
import { buildTrendChart } from '@/lib/charts/templates/trend'

// 3. 构建配置
const option = buildTrendChart({
  data: myData,
  primary: { name: '签单保费', unit: '万元' },
  secondary: { name: '赔付率', unit: '%', threshold: 70 },
})

// 4. 渲染图表
<BaseEChart option={option} height={400} />
```

### 自定义配置

```tsx
import { BaseEChart } from '@/components/charts/BaseEChart'
import { buildGrid, buildTooltip, buildLineSeries } from '@/lib/charts'
import { CHART_COLORS } from '@/lib/charts/theme'

const customOption = {
  grid: buildGrid('compact'),
  tooltip: buildTooltip(),
  xAxis: { type: 'category', data: ['周一', '周二'] },
  yAxis: { type: 'value' },
  series: [
    buildLineSeries({
      name: '销量',
      data: [100, 200],
      color: CHART_COLORS.primary[0],
    }),
  ],
}

<BaseEChart option={customOption} height={300} />
```

### 联动和下钻

```tsx
import { BaseEChart } from '@/components/charts/BaseEChart'
import { buildClickHandler, drillDownToFilters } from '@/lib/charts'

const handleDrillDown = data => {
  const newFilters = drillDownToFilters(data, currentFilters)
  updateFilters(newFilters)
}

;<BaseEChart
  option={option}
  onClick={buildClickHandler(
    'my-chart',
    'organization->vehicle',
    handleDrillDown
  )}
/>
```

---

## ✅ 验收标准

### 功能验收

- [ ] 所有旧图表功能正常（无回归）
- [ ] 新迁移图表与旧版视觉一致
- [ ] 联动和下钻功能正常
- [ ] 性能无明显下降（大数据集测试）

### 代码质量

- [ ] 所有组件使用 TypeScript 类型安全
- [ ] 所有配置符合 EChartsOption 类型
- [ ] 所有组件有清晰的注释和文档
- [ ] 无 ESLint 警告和错误

### 用户体验

- [ ] 图表渲染流畅，无卡顿
- [ ] Tooltip 信息清晰完整
- [ ] 交互响应及时
- [ ] 移动端适配良好

---

## 📝 迁移记录

### 2025-12-07

**完成内容**：

1. ✅ 创建基础架构

   - BaseEChart 组件
   - 主题配置系统（theme.ts）
   - 配置构建函数（builders.ts）
   - 联动与下钻机制（interactions.ts）
2. ✅ 创建标准模板

   - 趋势类图模板（trend.ts）
   - 散点/气泡图模板（scatter.ts）
   - 热力图模板（heatmap.ts）
3. ✅ 迁移首个组件

   - Sparkline 组件（微型趋势图）
   - 向后兼容旧接口

**下一步**：

- 迁移 DistributionPieChart
- 本地验证功能
- 性能测试

---

## 🔍 参考资料

- [ECharts 官方文档](https://echarts.apache.org/zh/index.html)
- [ECharts 配置项手册](https://echarts.apache.org/zh/option.html)
- [ECharts 示例](https://echarts.apache.org/examples/zh/index.html)
- [weekly-operational-trend.tsx](../../src/components/features/weekly-operational-trend.tsx) - 现有 ECharts 参考实现

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-07
