# 周度经营趋势分析 - 技术实现文档

## 目录

- [核心架构](#核心架构)
- [ECharts配置详解](#echarts配置详解)
- [数据处理流程](#数据处理流程)
- [交互事件实现](#交互事件实现)
- [性能优化策略](#性能优化策略)
- [代码示例](#代码示例)

## 核心架构

### 组件层级

```
WeeklyOperationalTrend (主组件)
  ├─ 数据获取层 (useTrendData)
  ├─ 数据处理层 (useMemo)
  │   ├─ chartData (图表数据点)
  │   ├─ trendLineData (趋势线数据)
  │   ├─ operationalSummary (经营摘要)
  │   └─ stats (统计数据)
  ├─ 渲染层 (ECharts)
  │   ├─ DOM容器 (chartRef)
  │   ├─ 实例管理 (chartInstanceRef)
  │   └─ 响应式监听 (ResizeObserver)
  └─ 交互层
      ├─ 点击事件 (handlePointClick)
      └─ 状态管理 (selectedPoint)
```

### 技术栈

- **React**: 18.x - UI框架
- **ECharts**: 6.0.0 - 图表渲染引擎
- **TypeScript**: 5.x - 类型系统
- **Tailwind CSS**: 3.4.x - 样式框架

## ECharts配置详解

### 1. 网格配置 (Grid)

```typescript
grid: {
  left: '3%',        // 左边距（自动计算Y轴标签）
  right: '4%',       // 右边距（容纳右Y轴）
  bottom: '15%',     // 底部留空（容纳DataZoom）
  top: '15%',        // 顶部留空（容纳图例和标题）
  containLabel: true // 包含轴标签在内
}
```

### 2. X轴配置 (XAxis)

```typescript
xAxis: [
  {
    type: 'category', // 类目轴
    data: weeks, // 周次标签数组
    axisPointer: {
      type: 'shadow', // 悬浮时显示阴影指示器
    },
    axisLabel: {
      fontSize: 11,
      rotate: 45, // 标签旋转45度（避免重叠）
      color: '#64748b',
    },
  },
]
```

### 3. Y轴配置 (YAxis)

#### 左Y轴（签单保费）

```typescript
yAxis: [
  {
    type: 'value',
    name: '签单保费（万元）',
    position: 'left',
    axisLabel: {
      formatter: value => formatNumber(value, 0), // 格式化为整数
    },
    splitLine: {
      lineStyle: { color: '#f1f5f9' }, // 浅灰色网格线
    },
  },
]
```

#### 右Y轴（赔付率）

```typescript
yAxis: [
  {
    type: 'value',
    name: '赔付率（%）',
    position: 'right',
    axisLabel: {
      formatter: value => `${value.toFixed(0)}%`, // 格式化为百分比
    },
    splitLine: { show: false }, // 不显示网格线（避免与左轴冲突）
    min: value => Math.floor(value.min / 10) * 10, // 向下取整到10
    max: value => Math.ceil(value.max / 10) * 10, // 向上取整到10
  },
]
```

### 4. 系列配置 (Series)

#### 签单保费面积图

```typescript
{
  name: '签单保费',
  type: 'line',
  yAxisIndex: 0,              // 使用左Y轴
  data: signedPremiums,
  smooth: true,               // 平滑曲线
  symbol: 'circle',
  symbolSize: 6,
  lineStyle: {
    color: '#3b82f6',         // 蓝色
    width: 3
  },
  areaStyle: {
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },   // 顶部30%透明度
      { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }   // 底部5%透明度
    ])
  },
  sampling: 'lttb'            // LTTB降采样算法
}
```

#### 赔付率正常点

```typescript
{
  name: '赔付率',
  type: 'scatter',
  yAxisIndex: 1,              // 使用右Y轴
  data: normalPoints,         // [[index, value], ...]
  symbolSize: 8,
  itemStyle: {
    color: '#94a3b8'          // 灰色
  }
}
```

#### 赔付率风险点（高亮）

```typescript
{
  name: '赔付率（风险）',
  type: 'scatter',
  yAxisIndex: 1,
  data: riskPoints,
  symbolSize: 12,             // 更大的点
  itemStyle: {
    color: '#f97316',         // 橙色
    borderColor: '#fff',      // 白色边框
    borderWidth: 2,
    shadowBlur: 6,            // 阴影模糊
    shadowColor: 'rgba(249, 115, 22, 0.5)'
  },
  emphasis: {
    scale: 1.8,               // 悬浮时放大到1.8倍
    itemStyle: {
      shadowBlur: 10
    }
  },
  zlevel: 10                  // 最高层级（确保在最上层）
}
```

#### 阈值线（70%）

```typescript
{
  name: '阈值线 70%',
  type: 'line',
  yAxisIndex: 1,
  data: new Array(weeks.length).fill(70),  // 所有点都是70
  lineStyle: {
    color: '#ef4444',         // 红色
    width: 2,
    type: 'dashed'            // 虚线
  },
  symbol: 'none',
  emphasis: { disabled: true }  // 禁用悬浮效果
}
```

#### 趋势线

```typescript
{
  name: '趋势线',
  type: 'line',
  yAxisIndex: 1,
  data: trendLineData,        // 线性回归计算结果
  lineStyle: {
    color: '#8b5cf6',         // 紫色
    width: 2,
    type: 'dashed'
  },
  symbol: 'none'
}
```

### 5. DataZoom配置

```typescript
dataZoom: [
  // 滑块型缩放
  {
    type: 'slider',
    show: true,
    xAxisIndex: 0,
    start: chartData.length > 26
      ? ((chartData.length - 26) / chartData.length) * 100
      : 0,                    // 默认显示最近26周
    end: 100,
    height: 20,
    bottom: '5%',
    handleSize: '80%'
  },
  // 内置型缩放（鼠标滚轮）
  {
    type: 'inside',
    xAxisIndex: 0,
    start: /* 同上 */,
    end: 100
  }
]
```

### 6. Tooltip配置

```typescript
tooltip: {
  trigger: 'axis',
  axisPointer: {
    type: 'cross',            // 十字准星
    crossStyle: { color: '#999' }
  },
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  padding: 12,
  formatter: (params) => {
    // 自定义HTML格式
    // 返回完整的Tooltip内容
  }
}
```

## 数据处理流程

### 1. 原始数据获取

```typescript
const rawData = useTrendData()
// 返回格式：
// [{
//   label: '2025-W42',
//   week: 42,
//   year: 2025,
//   signed_premium_10k: 12345.67,
//   loss_ratio: 68.5,
//   ...
// }]
```

### 2. 数据转换

```typescript
const chartData = useMemo(() => {
  if (!rawData || rawData.length === 0) return []

  return rawData
    .map(d => ({
      week: d.label,
      weekNumber: d.week,
      year: d.year,
      signedPremium: d.signed_premium_10k,
      lossRatio: d.loss_ratio,
      isRisk: d.loss_ratio !== null && d.loss_ratio >= 70, // 风险标识
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.weekNumber - b.weekNumber
    })
}, [rawData])
```

### 3. 趋势线计算（线性回归）

```typescript
function calculateTrendLine(data: ChartDataPoint[]): number[] {
  const lossRatios = data
    .map(d => d.lossRatio)
    .filter((v): v is number => v !== null)

  if (lossRatios.length < 2) return []

  // 最小二乘法
  const n = lossRatios.length
  const sumX = lossRatios.reduce((sum, _, i) => sum + i, 0)
  const sumY = lossRatios.reduce((sum, v) => sum + v, 0)
  const sumXY = lossRatios.reduce((sum, v, i) => sum + v * i, 0)
  const sumX2 = lossRatios.reduce((sum, _, i) => sum + i * i, 0)

  // 计算斜率和截距
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // 生成趋势线数据
  return data.map((_, i) => slope * i + intercept)
}
```

### 4. 经营摘要生成

```typescript
function generateOperationalSummary(data: ChartDataPoint[]): string {
  if (data.length === 0) return ''

  const latestPoint = data[data.length - 1]
  // 修正：当前周值下，年度累计签单保费就是第42周的当前周值，而不是多周的合计值
  const latestPremium = latestPoint.signedPremium

  // 计算连续高风险周数
  let consecutiveRiskWeeks = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].isRisk) {
      consecutiveRiskWeeks++
    } else {
      break
    }
  }

  const totalRiskWeeks = data.filter(d => d.isRisk).length

  let summary = `截至${latestPoint.year}年第${latestPoint.weekNumber}周，`
  summary += `年度累计签单保费 ${formatNumber(latestPremium / 10000, 2)} 亿元`

  // 修正：赔付率不用均值，直接说多少周处于预警区
  if (consecutiveRiskWeeks > 0) {
    summary += `，连续 ${consecutiveRiskWeeks} 周处于预警区`
  } else if (totalRiskWeeks > 0) {
    summary += `，${totalRiskWeeks} 周处于预警区`
  } else {
    summary += `，经营状况良好`
  }

  return summary
}
```

## 交互事件实现

### 1. 点击事件注册

```typescript
useEffect(() => {
  // ... ECharts初始化代码

  // 注册点击事件
  chart.off('click') // 先清除旧事件
  chart.on('click', (params: any) => {
    if (params.componentType === 'series' && params.seriesType === 'scatter') {
      const dataIndex = params.dataIndex
      const point = chartData[dataIndex]
      if (point) {
        handlePointClick(point)
      }
    }
  })
}, [chartData])
```

### 2. 点击事件处理

```typescript
const handlePointClick = (point: ChartDataPoint) => {
  console.log('🔍 下钻分析：', point)
  setSelectedPoint(point)

  // TODO: 集成下钻逻辑
  // 示例：更新筛选器
  // updateFilters({
  //   years: [point.year],
  //   weeks: [point.weekNumber],
  // })

  // 示例：跳转详情页
  // router.push(`/detail-analysis?year=${point.year}&week=${point.weekNumber}`)

  alert(`点击了 ${point.week}\n将进入车型/机构剖面下钻分析`)
}
```

### 3. 响应式调整

```typescript
useEffect(() => {
  // ... ECharts初始化代码

  // 监听容器尺寸变化
  const resizeObserver = new ResizeObserver(() => {
    chart.resize()
  })

  if (chartRef.current) {
    resizeObserver.observe(chartRef.current)
  }

  return () => {
    resizeObserver.disconnect()
  }
}, [chartData])
```

## 性能优化策略

### 1. React优化

```typescript
// 组件级memo
export const WeeklyOperationalTrend = React.memo(
  function WeeklyOperationalTrend() {
    // ...
  }
)

// 计算密集型数据缓存
const chartData = useMemo(() => {
  // 数据处理逻辑
}, [rawData])

const trendLineData = useMemo(() => {
  return calculateTrendLine(chartData)
}, [chartData])

// ECharts实例持久化
const chartInstanceRef = useRef<echarts.ECharts | null>(null)
```

### 2. ECharts优化

```typescript
// LTTB降采样（大数据量时自动触发）
series: [
  {
    // ...
    sampling: 'lttb', // Largest-Triangle-Three-Buckets算法
  },
]

// 禁用动画（提升渲染性能）
series: [
  {
    // ...
    animation: false,
  },
]

// Canvas渲染（比SVG快）
echarts.init(chartRef.current, undefined, {
  renderer: 'canvas',
})
```

### 3. 事件优化

```typescript
// 防抖处理（如果需要）
const debouncedResize = useMemo(() => debounce(() => chart.resize(), 200), [])

// 事件清理
useEffect(() => {
  return () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose() // 销毁实例
      chartInstanceRef.current = null
    }
  }
}, [])
```

## 代码示例

### 完整的ECharts Option

```typescript
const option: echarts.EChartsOption = {
  backgroundColor: 'transparent',
  grid: {
    /* ... */
  },
  tooltip: {
    /* ... */
  },
  legend: {
    /* ... */
  },
  xAxis: [
    {
      /* ... */
    },
  ],
  yAxis: [
    {
      /* 左Y轴：签单保费 */
    },
    {
      /* 右Y轴：赔付率 */
    },
  ],
  dataZoom: [{ type: 'slider' /* ... */ }, { type: 'inside' /* ... */ }],
  series: [
    {
      /* 签单保费面积图 */
    },
    {
      /* 赔付率正常点 */
    },
    {
      /* 赔付率风险点 */
    },
    {
      /* 赔付率连线 */
    },
    {
      /* 阈值线70% */
    },
    {
      /* 趋势线 */
    },
  ],
}

chart.setOption(option, true) // true表示不合并，完全替换
```

### Tooltip HTML格式化示例

```typescript
formatter: (params: any) => {
  const dataIndex = params[0].dataIndex
  const point = chartData[dataIndex]

  let html = `
    <div style="min-width: 240px;">
      <div style="font-weight: 600; margin-bottom: 8px;">
        ${point.week}
      </div>
      <div style="margin-bottom: 4px;">
        <span style="color: #64748b;">签单保费：</span>
        <span style="font-weight: 600;">
          ${formatNumber(point.signedPremium, 1)} 万元
        </span>
      </div>
      <!-- 更多字段... -->
    </div>
  `

  return html
}
```

## 常见问题

### Q1: 图表不显示？

**A**: 检查以下几点：

1. 容器高度是否设置（`style={{ height: '480px' }}`）
2. 数据是否正确加载（`console.log(chartData)`）
3. ECharts是否成功初始化（`console.log(chartInstanceRef.current)`）

### Q2: 点击事件不触发？

**A**: 确保：

1. 事件绑定在正确的series上（`seriesType === 'scatter'`）
2. 点击的是scatter点而不是line线
3. 事件未被其他元素遮挡（检查`zlevel`）

### Q3: 趋势线不准确？

**A**: 检查：

1. 数据是否已排序
2. null值是否正确过滤
3. 线性回归算法是否正确实现

### Q4: 性能问题？

**A**: 优化方案：

1. 启用LTTB采样（`sampling: 'lttb'`）
2. 限制数据点数量（如只显示最近52周）
3. 使用Canvas渲染而非SVG
4. 禁用动画（`animation: false`）

### Q5: 报错 "Cannot read properties of undefined (reading 'coord')"？

**A**: 这是 `visualMap` 配置问题。解决方案：

1. 移除 `visualMap` 配置
2. 使用 `markArea` 代替实现背景风险区
3. 在赔付率连线series中添加：

```typescript
markArea: {
  silent: true,
  itemStyle: {
    color: 'rgba(254, 226, 226, 0.3)',
  },
  data: [
    [
      { yAxis: 70 },  // 起始Y值
      { yAxis: 'max' }  // 结束Y值（最大值）
    ],
  ],
}
```

## 参考资源

- [ECharts官方文档](https://echarts.apache.org/zh/index.html)
- [ECharts配置项手册](https://echarts.apache.org/zh/option.html)
- [React + ECharts最佳实践](https://echarts.apache.org/handbook/zh/how-to/cross-platform/react)
- [LTTB降采样算法](https://github.com/sveinn-steinarsson/flot-downsample)

---

_文档创建时间: 2025-10-26_
_最后更新: 2025-10-26_
