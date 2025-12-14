/**
 * 图表配置构建函数
 *
 * 提供常用的配置构建辅助函数，简化图表配置的创建
 */

import type { EChartsOption } from 'echarts'
import {
  CHART_GRID,
  CHART_TOOLTIP,
  CHART_LEGEND,
  CHART_AXIS,
  CHART_DATAZOOM,
  CHART_COLORS,
  THRESHOLD_LINES,
} from './theme'

/**
 * 构建标准网格配置
 */
export function buildGrid(
  type: 'default' | 'compact' | 'vertical' = 'default'
): EChartsOption['grid'] {
  return CHART_GRID[type]
}

/**
 * 构建标准 Tooltip 配置
 */
export function buildTooltip(
  config?: Partial<EChartsOption['tooltip']>
): EChartsOption['tooltip'] {
  return {
    ...CHART_TOOLTIP,
    ...config,
  }
}

/**
 * 构建标准 Legend 配置
 */
export function buildLegend(
  config?: Partial<EChartsOption['legend']>
): EChartsOption['legend'] {
  return {
    ...CHART_LEGEND,
    ...config,
  }
}

/**
 * 构建标准 X 轴配置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildXAxis(config?: Partial<EChartsOption['xAxis']>): any {
  return {
    type: 'category',
    ...CHART_AXIS.xAxis,
    ...config,
  }
}

/**
 * 构建标准 Y 轴配置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildYAxis(config?: Partial<EChartsOption['yAxis']>): any {
  return {
    type: 'value',
    ...CHART_AXIS.yAxis,
    ...config,
  }
}

/**
 * 构建双 Y 轴配置（用于趋势图）
 */
export function buildDualYAxis(
  leftConfig?: {
    name?: string
    formatter?: (value: number) => string
  },
  rightConfig?: {
    name?: string
    formatter?: (value: number) => string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  return [
    buildYAxis({
      position: 'left',
      name: leftConfig?.name,
      axisLabel: {
        formatter: leftConfig?.formatter,
      },
    }),
    buildYAxis({
      position: 'right',
      name: rightConfig?.name,
      axisLabel: {
        formatter: rightConfig?.formatter,
      },
      splitLine: {
        show: false,
      },
    }),
  ]
}

/**
 * 构建 DataZoom 配置
 */
export function buildDataZoom(config?: {
  start?: number
  end?: number
  showSlider?: boolean
  showInside?: boolean
}): EChartsOption['dataZoom'] {
  const {
    start = 0,
    end = 100,
    showSlider = true,
    showInside = true,
  } = config || {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataZoom: any[] = []

  if (showSlider) {
    dataZoom.push({
      ...CHART_DATAZOOM.slider,
      start,
      end,
    })
  }

  if (showInside) {
    dataZoom.push({
      ...CHART_DATAZOOM.inside,
      start,
      end,
    })
  }

  return dataZoom
}

/**
 * 构建阈值线（markLine）
 */
export function buildThresholdLine(
  type: 'lossRatio' | 'contribution',
  customValue?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const config = THRESHOLD_LINES[type]

  return {
    symbol: 'none',
    label: {
      show: true,
      position: 'end',
      formatter: config.label,
      fontSize: 11,
      color: config.color,
    },
    lineStyle: {
      ...config.lineStyle,
      color: config.color,
    },
    data: [
      {
        yAxis: customValue ?? config.value,
      },
    ],
  }
}

/**
 * 构建风险区域（markArea）
 */
export function buildRiskArea(
  thresholdValue: number,
  options?: {
    color?: string
    label?: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return {
    silent: true,
    itemStyle: {
      color: options?.color || 'rgba(254, 226, 226, 0.3)',
    },
    label: options?.label
      ? {
          show: true,
          position: 'insideTop',
          formatter: options.label,
          fontSize: 11,
          color: CHART_COLORS.risk.danger,
        }
      : undefined,
    data: [
      [
        {
          yAxis: thresholdValue,
        },
        {
          yAxis: 'max',
        },
      ],
    ],
  }
}

/**
 * 构建折线图系列配置
 */
export function buildLineSeries(config: {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  color?: string
  yAxisIndex?: number
  smooth?: boolean
  showSymbol?: boolean
  areaStyle?: boolean
  lineWidth?: number
  symbolSize?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const {
    name,
    data,
    color,
    yAxisIndex = 0,
    smooth = true,
    showSymbol = true,
    areaStyle = false,
    lineWidth = 3,
    symbolSize = 6,
  } = config

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any = {
    name,
    type: 'line',
    data,
    yAxisIndex,
    smooth,
    symbol: showSymbol ? 'circle' : 'none',
    symbolSize,
    lineStyle: {
      width: lineWidth,
    },
    emphasis: {
      focus: 'series',
    },
  }

  if (color) {
    series.lineStyle.color = color
    series.itemStyle = { color }
  }

  if (areaStyle) {
    series.areaStyle = {
      opacity: 0.3,
    }
  }

  return series
}

/**
 * 构建柱状图系列配置
 */
export function buildBarSeries(config: {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  color?: string
  yAxisIndex?: number
  barWidth?: string | number
  barGap?: string
  stack?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const { name, data, color, yAxisIndex = 0, barWidth, barGap, stack } = config

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any = {
    name,
    type: 'bar',
    data,
    yAxisIndex,
    emphasis: {
      focus: 'series',
    },
  }

  if (color) {
    series.itemStyle = { color }
  }

  if (barWidth !== undefined) {
    series.barWidth = barWidth
  }

  if (barGap !== undefined) {
    series.barGap = barGap
  }

  if (stack) {
    series.stack = stack
  }

  return series
}

/**
 * 构建散点图系列配置
 */
export function buildScatterSeries(config: {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  color?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  symbolSize?: number | ((value: any) => number)
  yAxisIndex?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const { name, data, color, symbolSize = 8, yAxisIndex = 0 } = config

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any = {
    name,
    type: 'scatter',
    data,
    yAxisIndex,
    symbolSize,
    emphasis: {
      scale: 1.5,
    },
  }

  if (color) {
    series.itemStyle = { color }
  }

  return series
}

/**
 * 构建饼图系列配置
 */
export function buildPieSeries(config: {
  name: string
  data: Array<{ name: string; value: number }>
  radius?: string | [string, string]
  center?: [string, string]
  showLabel?: boolean
  labelPosition?: 'outside' | 'inside' | 'center'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const {
    name,
    data,
    radius = '70%',
    center = ['50%', '50%'],
    showLabel = true,
    labelPosition = 'outside',
  } = config

  return {
    name,
    type: 'pie',
    data,
    radius,
    center,
    label: {
      show: showLabel,
      position: labelPosition,
      fontSize: 12,
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  }
}

/**
 * 构建雷达图配置
 */
export function buildRadarSeries(config: {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  color?: string
  areaOpacity?: number
  lineWidth?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const { name, data, color, areaOpacity = 0.08, lineWidth = 2.5 } = config

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any = {
    name,
    type: 'radar',
    data,
    lineStyle: {
      width: lineWidth,
    },
    areaStyle: {
      opacity: areaOpacity,
    },
  }

  if (color) {
    series.lineStyle.color = color
    series.itemStyle = { color }
    series.areaStyle.color = color
  }

  return series
}

/**
 * 构建热力图系列配置
 */
export function buildHeatmapSeries(config: {
  name: string
  data: Array<[number, number, number]>
  min?: number
  max?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const { name, data, min, max } = config

  return {
    name,
    type: 'heatmap',
    data,
    label: {
      show: true,
      fontSize: 11,
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
    visualMap:
      min !== undefined && max !== undefined
        ? {
            min,
            max,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
          }
        : undefined,
  }
}
