/**
 * 散点/气泡图表模板
 *
 * 用于风险分析、客户分群等多维数据可视化
 *
 * 支持：
 * - X/Y 轴数值映射
 * - 气泡大小映射
 * - 颜色分类
 * - 参考线
 * - 象限划分
 */

import type { EChartsOption } from 'echarts'
import {
  buildGrid,
  buildTooltip,
  buildLegend,
  buildXAxis,
  buildYAxis,
} from '../builders'
import { CHART_COLORS } from '../theme'
import { formatNumber, formatPercent } from '@/utils/format'

export interface ScatterDataPoint {
  /** 数据点名称 */
  name: string
  /** X 轴值 */
  x: number
  /** Y 轴值 */
  y: number
  /** 气泡大小值（可选） */
  size?: number
  /** 分类标签 */
  category?: string
  /** 颜色（可选） */
  color?: string
  /** 原始数据（用于 tooltip） */
  [key: string]: unknown
}

export interface ScatterChartConfig {
  /** 数据点数组 */
  data: ScatterDataPoint[]

  /** X 轴配置 */
  xAxis: {
    name: string
    unit: string
    formatter?: (value: number) => string
  }

  /** Y 轴配置 */
  yAxis: {
    name: string
    unit: string
    formatter?: (value: number) => string
  }

  /** 气泡大小配置 */
  bubble?: {
    name: string
    minSize?: number
    maxSize?: number
  }

  /** 参考线配置 */
  referenceLines?: {
    xValue?: number
    yValue?: number
    xLabel?: string
    yLabel?: string
  }

  /** 象限划分 */
  quadrants?: {
    enabled: boolean
    xValue: number
    yValue: number
    labels?: {
      topLeft?: string
      topRight?: string
      bottomLeft?: string
      bottomRight?: string
    }
  }

  /** 颜色映射（按分类） */
  colorMap?: Record<string, string>

  /** 自定义 tooltip 格式化函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipFormatter?: (params: any) => string

  /** 是否按分类分组 */
  groupByCategory?: boolean
}

/**
 * 构建散点/气泡图配置
 */
export function buildScatterChart(config: ScatterChartConfig): EChartsOption {
  const {
    data,
    xAxis,
    yAxis,
    bubble,
    referenceLines,
    quadrants,
    colorMap,
    tooltipFormatter,
    groupByCategory = true,
  } = config

  // 按分类分组数据
  const groupedData = groupByCategory
    ? groupDataByCategory(data)
    : { 默认: data }

  // 构建系列
  const series: any[] = []

  Object.entries(groupedData).forEach(([category, points], index) => {
    const color =
      colorMap?.[category] ||
      CHART_COLORS.primary[index % CHART_COLORS.primary.length]

    series.push({
      name: category,
      type: 'scatter',
      symbolSize: bubble
        ? (dataItem: any) => {
            const sizeValue = dataItem[2] || 0
            const minSize = bubble.minSize || 10
            const maxSize = bubble.maxSize || 80
            const allSizes = data.map(d => d.size || 0)
            const minData = Math.min(...allSizes)
            const maxData = Math.max(...allSizes)
            const range = maxData - minData || 1
            return (
              minSize + ((sizeValue - minData) / range) * (maxSize - minSize)
            )
          }
        : 12,
      data: points.map(p => {
        const item: any = [p.x, p.y]
        if (bubble && p.size !== undefined) {
          item.push(p.size)
        }
        item.name = p.name
        item.raw = p
        return item
      }),
      itemStyle: {
        color,
        opacity: 0.8,
      },
      emphasis: {
        focus: 'series',
        scale: 1.2,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    })
  })

  // 构建完整配置
  const option: EChartsOption = {
    grid: buildGrid('default'),
    tooltip: buildTooltip({
      trigger: 'item',
      formatter:
        tooltipFormatter ||
        ((params: any) => {
          const point = params.data.raw as ScatterDataPoint

          let html = `<div style="min-width: 220px;">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${point.name}</div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${xAxis.name}：</span>
            <span style="font-weight: 600;">${xAxis.formatter?.(point.x) || formatNumber(point.x)} ${xAxis.unit}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${yAxis.name}：</span>
            <span style="font-weight: 600;">${yAxis.formatter?.(point.y) || formatPercent(point.y / 100)}</span>
          </div>`

          if (bubble && point.size !== undefined) {
            html += `<div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${bubble.name}：</span>
            <span style="font-weight: 600;">${formatNumber(point.size)}</span>
          </div>`
          }

          if (point.category) {
            html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px;">${point.category}</span>
          </div>`
          }

          html += `</div>`
          return html
        }),
    }),
    legend: buildLegend({
      data: Object.keys(groupedData),
    }),
    xAxis: buildXAxis({
      type: 'value',
      name: `${xAxis.name}（${xAxis.unit}）`,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter:
          xAxis.formatter || ((value: number) => formatNumber(value, 0)),
      },
    }),
    yAxis: buildYAxis({
      type: 'value',
      name: `${yAxis.name}（${yAxis.unit}）`,
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter:
          yAxis.formatter || ((value: number) => `${value.toFixed(0)}%`),
      },
    }),
    series,
  }

  // 添加参考线
  if (referenceLines) {
    const markLines: any[] = []

    if (referenceLines.xValue !== undefined) {
      markLines.push({
        xAxis: referenceLines.xValue,
        label: {
          formatter: referenceLines.xLabel || `平均${xAxis.name}`,
          position: 'end',
        },
      })
    }

    if (referenceLines.yValue !== undefined) {
      markLines.push({
        yAxis: referenceLines.yValue,
        label: {
          formatter: referenceLines.yLabel || `平均${yAxis.name}`,
          position: 'end',
        },
      })
    }

    if (markLines.length > 0 && series.length > 0) {
      series[0].markLine = {
        symbol: 'none',
        lineStyle: {
          type: 'dashed',
          color: CHART_COLORS.neutral[400],
        },
        label: {
          color: CHART_COLORS.neutral[600],
          fontSize: 11,
        },
        data: markLines,
      }
    }
  }

  // 添加象限标注
  if (quadrants?.enabled && series.length > 0) {
    const { xValue, yValue, labels } = quadrants

    series[0].markArea = {
      silent: true,
      itemStyle: {
        color: 'transparent',
      },
      label: {
        show: true,
        fontSize: 11,
        color: CHART_COLORS.neutral[400],
        fontWeight: 'bold',
      },
      data: [
        // 右上象限
        labels?.topRight
          ? [
              {
                name: labels.topRight,
                xAxis: xValue,
                yAxis: 'max',
              },
              {
                xAxis: 'max',
                yAxis: yValue,
              },
            ]
          : [],
        // 左上象限
        labels?.topLeft
          ? [
              {
                name: labels.topLeft,
                xAxis: 'min',
                yAxis: 'max',
              },
              {
                xAxis: xValue,
                yAxis: yValue,
              },
            ]
          : [],
        // 左下象限
        labels?.bottomLeft
          ? [
              {
                name: labels.bottomLeft,
                xAxis: 'min',
                yAxis: yValue,
              },
              {
                xAxis: xValue,
                yAxis: 'min',
              },
            ]
          : [],
        // 右下象限
        labels?.bottomRight
          ? [
              {
                name: labels.bottomRight,
                xAxis: xValue,
                yAxis: 'min',
              },
              {
                xAxis: 'max',
                yAxis: yValue,
              },
            ]
          : [],
      ].filter(d => d.length > 0),
    }
  }

  return option
}

/**
 * 按分类分组数据
 */
function groupDataByCategory(
  data: ScatterDataPoint[]
): Record<string, ScatterDataPoint[]> {
  const groups: Record<string, ScatterDataPoint[]> = {}

  data.forEach(point => {
    const category = point.category || '默认'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(point)
  })

  return groups
}
