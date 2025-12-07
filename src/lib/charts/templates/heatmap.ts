/**
 * 热力矩阵图表模板
 *
 * 用于展示二维矩阵数据的热力分布
 *
 * 适用场景：
 * - 机构 × 车型 风险矩阵
 * - 时间 × 指标 趋势热力图
 * - 客户 × 产品 关联分析
 */

import type { EChartsOption } from 'echarts'
import {
  buildGrid,
  buildTooltip,
  buildXAxis,
  buildYAxis,
} from '../builders'
import { CHART_COLORS } from '../theme'
import { formatNumber, formatPercent } from '@/utils/format'

export interface HeatmapDataPoint {
  /** X 轴维度值 */
  x: string | number
  /** Y 轴维度值 */
  y: string | number
  /** 热力值 */
  value: number
  /** 原始数据（用于 tooltip） */
  [key: string]: any
}

export interface HeatmapChartConfig {
  /** 数据点数组 */
  data: HeatmapDataPoint[]

  /** X 轴配置 */
  xAxis: {
    name: string
    categories: (string | number)[]
  }

  /** Y 轴配置 */
  yAxis: {
    name: string
    categories: (string | number)[]
  }

  /** 值配置 */
  value: {
    name: string
    unit: string
    formatter?: (value: number) => string
    /** 最小值（用于颜色映射） */
    min?: number
    /** 最大值（用于颜色映射） */
    max?: number
  }

  /** 颜色方案 */
  colorScheme?: 'risk' | 'performance' | 'custom'

  /** 自定义颜色范围 */
  customColors?: string[]

  /** 是否显示数值标签 */
  showLabel?: boolean

  /** 自定义 tooltip 格式化函数 */
  tooltipFormatter?: (params: any) => string

  /** 单元格点击处理（外部处理，这里只是配置） */
  enableClick?: boolean
}

/**
 * 构建热力图配置
 */
export function buildHeatmapChart(config: HeatmapChartConfig): EChartsOption {
  const {
    data,
    xAxis,
    yAxis,
    value,
    colorScheme = 'risk',
    customColors,
    showLabel = true,
    tooltipFormatter,
  } = config

  // 创建 X/Y 轴索引映射
  const xIndexMap = new Map<string | number, number>()
  const yIndexMap = new Map<string | number, number>()

  xAxis.categories.forEach((cat, idx) => xIndexMap.set(cat, idx))
  yAxis.categories.forEach((cat, idx) => yIndexMap.set(cat, idx))

  // 转换数据为 ECharts 格式 [xIndex, yIndex, value]
  const heatmapData = data.map(point => {
    const xIndex = xIndexMap.get(point.x) ?? 0
    const yIndex = yIndexMap.get(point.y) ?? 0
    return [xIndex, yIndex, point.value, point] // 附加原始数据
  })

  // 计算值域范围
  const values = data.map(d => d.value)
  const minValue = value.min ?? Math.min(...values)
  const maxValue = value.max ?? Math.max(...values)

  // 选择颜色方案
  const inRange = getColorScheme(colorScheme, customColors)

  // 构建完整配置
  const option: EChartsOption = {
    grid: buildGrid('compact'),
    tooltip: buildTooltip({
      position: 'top',
      formatter: tooltipFormatter || ((params: any) => {
        const [xIndex, yIndex, val, raw] = params.data
        const xLabel = xAxis.categories[xIndex]
        const yLabel = yAxis.categories[yIndex]

        let html = `<div style="min-width: 200px;">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">
            ${yLabel} × ${xLabel}
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${value.name}：</span>
            <span style="font-weight: 600;">${value.formatter?.(val) || formatNumber(val, 1)} ${value.unit}</span>
          </div>`

        // 显示额外信息
        if (raw && typeof raw === 'object') {
          const additionalKeys = Object.keys(raw).filter(
            k => !['x', 'y', 'value'].includes(k)
          )

          if (additionalKeys.length > 0) {
            html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">`

            additionalKeys.slice(0, 3).forEach(key => {
              const val = raw[key]
              if (val !== undefined && val !== null) {
                html += `<div>${key}: ${formatValue(val)}</div>`
              }
            })

            html += `</div>`
          }
        }

        html += `</div>`
        return html
      }),
    }),
    xAxis: buildXAxis({
      type: 'category',
      data: xAxis.categories,
      name: xAxis.name,
      splitArea: {
        show: true,
      },
      axisLabel: {
        interval: 0,
        rotate: xAxis.categories.length > 10 ? 45 : 0,
        fontSize: 11,
      },
    }),
    yAxis: buildYAxis({
      type: 'category',
      data: yAxis.categories,
      name: yAxis.name,
      splitArea: {
        show: true,
      },
      axisLabel: {
        interval: 0,
        fontSize: 11,
      },
    }),
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange,
      text: [`${maxValue.toFixed(0)}${value.unit}`, `${minValue.toFixed(0)}${value.unit}`],
      textStyle: {
        color: CHART_COLORS.neutral[700],
        fontSize: 11,
      },
    },
    series: [
      {
        name: value.name,
        type: 'heatmap',
        data: heatmapData as any,
        label: {
          show: showLabel,
          fontSize: 11,
          formatter: (params: any) => {
            const val = params.data[2]
            return value.formatter?.(val) || formatNumber(val, 1)
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: '#fff',
            borderWidth: 2,
          },
        },
      } as any,
    ],
  }

  return option
}

/**
 * 获取颜色方案
 */
function getColorScheme(
  scheme: 'risk' | 'performance' | 'custom',
  customColors?: string[]
): { color: string[] } {
  if (scheme === 'custom' && customColors) {
    return { color: customColors }
  }

  if (scheme === 'risk') {
    // 风险色：绿 → 黄 → 橙 → 红
    return {
      color: [
        '#10b981', // 绿色 - 低风险
        '#84cc16', // 黄绿
        '#fbbf24', // 黄色 - 中风险
        '#f97316', // 橙色
        '#ef4444', // 红色 - 高风险
      ],
    }
  }

  // performance: 蓝色渐变（低 → 高）
  return {
    color: [
      '#dbeafe', // 浅蓝
      '#93c5fd', // 中蓝
      '#60a5fa', // 蓝色
      '#3b82f6', // 深蓝
      '#1e40af', // 深深蓝
    ],
  }
}

/**
 * 格式化值（用于 tooltip）
 */
function formatValue(val: any): string {
  if (typeof val === 'number') {
    return formatNumber(val, 2)
  }
  if (typeof val === 'string') {
    return val
  }
  return String(val)
}

/**
 * 构建风险热力图（快捷方法）
 */
export function buildRiskHeatmap(config: Omit<HeatmapChartConfig, 'colorScheme'>): EChartsOption {
  return buildHeatmapChart({
    ...config,
    colorScheme: 'risk',
  })
}

/**
 * 构建性能热力图（快捷方法）
 */
export function buildPerformanceHeatmap(config: Omit<HeatmapChartConfig, 'colorScheme'>): EChartsOption {
  return buildHeatmapChart({
    ...config,
    colorScheme: 'performance',
  })
}
