/**
 * 趋势类图表模板
 *
 * 标准化的趋势图配置，包含：
 * - 时间序列数据
 * - 双Y轴设计
 * - 阈值线
 * - 风险区间标注
 * - 趋势线
 */

import type { EChartsOption } from 'echarts'
import {
  buildGrid,
  buildTooltip,
  buildLegend,
  buildXAxis,
  buildYAxis,
  buildDualYAxis,
  buildDataZoom,
  buildLineSeries,
  buildScatterSeries,
  buildRiskArea,
} from '../builders'
import { CHART_COLORS, getGradientColor } from '../theme'
import { formatNumber, formatPercent } from '@/utils/format'

export interface TrendDataPoint {
  /** X轴标签（如：周次） */
  label: string
  /** 主指标值（如：签单保费） */
  primaryValue: number
  /** 次指标值（如：赔付率） */
  secondaryValue?: number | null
  /** 是否为风险点 */
  isRisk?: boolean
  /** 原始数据（用于 tooltip） */
  [key: string]: unknown
}

export interface TrendChartConfig {
  /** 数据点数组 */
  data: TrendDataPoint[]

  /** 主指标配置 */
  primary: {
    name: string
    unit: string
    color?: string
    showArea?: boolean
  }

  /** 次指标配置 */
  secondary?: {
    name: string
    unit: string
    color?: string
    threshold?: number
    showTrendLine?: boolean
  }

  /** 是否显示 DataZoom */
  showDataZoom?: boolean

  /** DataZoom 默认显示范围 */
  dataZoomRange?: {
    start: number
    end: number
  }

  /** 自定义 tooltip 格式化函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipFormatter?: (params: any) => string

  /** 点击事件处理（外部处理，这里只是配置） */
  enableClick?: boolean
}

/**
 * 构建趋势图配置
 */
export function buildTrendChart(config: TrendChartConfig): EChartsOption {
  const {
    data,
    primary,
    secondary,
    showDataZoom = true,
    dataZoomRange,
    tooltipFormatter,
  } = config

  // 提取数据
  const xAxisData = data.map(d => d.label)
  const primaryData = data.map(d => d.primaryValue)
  const secondaryData = secondary ? data.map(d => d.secondaryValue) : []

  // 分离风险点和正常点
  const normalPoints = secondary
    ? data
        .map((d, i) =>
          !d.isRisk && d.secondaryValue !== null ? [i, d.secondaryValue] : null
        )
        .filter((v): v is [number, number] => v !== null)
    : []

  const riskPoints = secondary
    ? data
        .map((d, i) =>
          d.isRisk && d.secondaryValue !== null ? [i, d.secondaryValue] : null
        )
        .filter((v): v is [number, number] => v !== null)
    : []

  // 计算趋势线（简单移动平均）
  const trendLineData = secondary?.showTrendLine
    ? calculateMovingAverage(
        secondaryData.filter(v => v !== null) as number[],
        3
      )
    : []

  // 构建系列
  const series: any[] = []

  // 主指标线
  series.push(
    buildLineSeries({
      name: primary.name,
      data: primaryData,
      color: primary.color || CHART_COLORS.metrics.premium,
      yAxisIndex: 0,
      smooth: true,
      areaStyle: primary.showArea ?? true,
      lineWidth: 3,
      symbolSize: 6,
    })
  )

  // 如果有面积填充，添加渐变
  if (primary.showArea) {
    const lastSeries = series[series.length - 1]
    lastSeries.areaStyle = {
      color: getGradientColor(
        primary.color || CHART_COLORS.metrics.premium,
        0.3
      ),
    }
  }

  // 次指标配置
  if (secondary) {
    // 次指标连线
    const secondaryLine = buildLineSeries({
      name: secondary.name,
      data: secondaryData,
      color: secondary.color || CHART_COLORS.metrics.lossRatio,
      yAxisIndex: 1,
      smooth: false,
      showSymbol: false,
      lineWidth: 2,
    })

    // 添加风险区域标注
    if (secondary.threshold) {
      secondaryLine.markArea = buildRiskArea(secondary.threshold)
    }

    series.push(secondaryLine)

    // 正常点
    series.push(
      buildScatterSeries({
        name: secondary.name,
        data: normalPoints,
        color: CHART_COLORS.neutral[400],
        symbolSize: 8,
        yAxisIndex: 1,
      })
    )

    // 风险点
    if (riskPoints.length > 0) {
      series.push({
        name: `${secondary.name}（风险）`,
        type: 'scatter',
        yAxisIndex: 1,
        data: riskPoints,
        symbolSize: 12,
        itemStyle: {
          color: CHART_COLORS.risk.danger,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 6,
          shadowColor: 'rgba(249, 115, 22, 0.5)',
        },
        emphasis: {
          scale: 1.8,
          itemStyle: {
            shadowBlur: 10,
          },
        },
        zlevel: 10,
      })
    }

    // 阈值线
    if (secondary.threshold) {
      series.push({
        name: `阈值线 ${secondary.threshold}${secondary.unit}`,
        type: 'line',
        yAxisIndex: 1,
        data: new Array(xAxisData.length).fill(secondary.threshold),
        lineStyle: {
          color: CHART_COLORS.threshold.standard,
          width: 2,
          type: 'dashed',
        },
        symbol: 'none',
        emphasis: {
          disabled: true,
        },
      })
    }

    // 趋势线
    if (secondary.showTrendLine && trendLineData.length > 0) {
      series.push({
        name: '趋势线',
        type: 'line',
        yAxisIndex: 1,
        data: trendLineData,
        lineStyle: {
          color: CHART_COLORS.metrics.trend,
          width: 2,
          type: 'dashed',
        },
        symbol: 'none',
        emphasis: {
          disabled: true,
        },
      })
    }
  }

  // 构建完整配置
  const option: EChartsOption = {
    grid: buildGrid('default'),
    tooltip: buildTooltip({
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
      formatter:
        tooltipFormatter ||
        ((params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''

          const dataIndex = params[0].dataIndex
          const point = data[dataIndex]

          if (!point) return ''

          let html = `<div style="min-width: 260px;">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${point.label}</div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${primary.name}：</span>
            <span style="font-weight: 600;">${formatNumber(point.primaryValue, 1)} ${primary.unit}</span>
          </div>`

          if (secondary && point.secondaryValue !== null) {
            const thresholdDiff = secondary.threshold
              ? point.secondaryValue - secondary.threshold
              : null

            html += `<div style="margin-bottom: 4px;">
            <span style="color: #64748b;">${secondary.name}：</span>
            <span style="font-weight: 600; color: ${point.isRisk ? '#ef4444' : '#334155'};">
              ${formatPercent(point.secondaryValue, 2)}
            </span>
          </div>`

            if (thresholdDiff !== null) {
              html += `<div style="margin-bottom: 8px;">
              <span style="color: #64748b;">与阈值差值：</span>
              <span style="font-weight: 600; color: ${thresholdDiff >= 0 ? '#ef4444' : '#10b981'};">
              ${thresholdDiff >= 0 ? '+' : ''}${thresholdDiff.toFixed(1)}pp
              </span>
            </div>`
            }
          }

          html += `</div>`
          return html
        }),
    }),
    legend: buildLegend(),
    xAxis: buildXAxis({
      data: xAxisData,
      axisPointer: {
        type: 'shadow',
      },
    }),
    yAxis: secondary
      ? buildDualYAxis(
          {
            name: `${primary.name}（${primary.unit}）`,
            formatter: (value: number) => formatNumber(value, 0),
          },
          {
            name: `${secondary.name}（${secondary.unit}）`,
            formatter: (value: number) => `${value.toFixed(0)}%`,
          }
        )
      : buildYAxis({
          name: `${primary.name}（${primary.unit}）`,
          axisLabel: {
            formatter: (value: number) => formatNumber(value, 0),
          },
        }),
    series,
  }

  // 添加 DataZoom
  if (showDataZoom) {
    const totalPoints = data.length
    const defaultRange = dataZoomRange || {
      start: totalPoints > 26 ? ((totalPoints - 26) / totalPoints) * 100 : 0,
      end: 100,
    }

    option.dataZoom = buildDataZoom({
      start: defaultRange.start,
      end: defaultRange.end,
      showSlider: true,
      showInside: true,
    })
  }

  return option
}

/**
 * 计算移动平均（用于趋势线）
 */
function calculateMovingAverage(
  data: number[],
  window: number
): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const sum = data
        .slice(i - window + 1, i + 1)
        .reduce((acc, val) => acc + val, 0)
      result.push(sum / window)
    }
  }

  return result
}
