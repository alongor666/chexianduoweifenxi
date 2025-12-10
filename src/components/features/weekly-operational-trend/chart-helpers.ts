import * as echarts from 'echarts'
import { formatNumber, formatPercent } from '@/utils/format'
import { LOSS_RISK_THRESHOLD } from './utils'
import type { ChartDataPoint } from './types'

export const getTooltipFormatter = (displayData: ChartDataPoint[]) => {
  return (params: any) => {
    if (!Array.isArray(params) || params.length === 0) return ''

    const dataIndex = params[0].dataIndex
    const point = displayData[dataIndex]

    if (!point) return ''

    const thresholdDiff =
      point.lossRatio !== null ? point.lossRatio - LOSS_RISK_THRESHOLD : null

    let html = `<div style="min-width: 260px;">
    <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${
      point.week
    }</div>
    <div style="margin-bottom: 4px;">
      <span style="color: #64748b;">签单保费：</span>
      <span style="font-weight: 600;">${formatNumber(
        point.signedPremium,
        1
      )} 万元</span>
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #64748b;">赔付率（累计）：</span>
      <span style="font-weight: 600; color: ${
        point.isRisk ? '#ef4444' : '#334155'
      };">
        ${point.lossRatio !== null ? formatPercent(point.lossRatio, 2) : '—'}
      </span>
    </div>
    <div style="margin-bottom: 8px; font-size: 10px; color: #94a3b8;">
      💡 赔付率 = 年初至今累计赔款 / 累计保费
    </div>`

    if (thresholdDiff !== null) {
      html += `<div style="margin-bottom: 8px;">
      <span style="color: #64748b;">与阈值差值：</span>
      <span style="font-weight: 600; color: ${
        thresholdDiff >= 0 ? '#ef4444' : '#10b981'
      };">
      ${thresholdDiff >= 0 ? '+' : ''}${thresholdDiff.toFixed(1)}pp
      </span>
    </div>`
    }

    html += `</div>`

    return html
  }
}

export const getChartSeries = (
  weeks: string[],
  signedPremiums: number[],
  normalPoints: [number, number][],
  riskPoints: [number, number][],
  lossRatios: (number | null)[],
  trendLineData: number[]
): echarts.SeriesOption[] => {
  return [
    // 签单保费趋势线（蓝色）
    {
      name: '签单保费',
      type: 'line',
      yAxisIndex: 0,
      data: signedPremiums,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#3b82f6',
        width: 3,
      },
      itemStyle: {
        color: '#3b82f6',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
        ]),
      },
      emphasis: {
        focus: 'series',
      },
      // LTTB 降采样（大数据优化）
      sampling: 'lttb',
    },
    // 赔付率正常点（灰色）
    {
      name: '赔付率',
      type: 'scatter',
      yAxisIndex: 1,
      data: normalPoints,
      symbolSize: 8,
      itemStyle: {
        color: '#94a3b8',
      },
      emphasis: {
        scale: 1.5,
      },
    },
    // 赔付率风险点（橙色高亮）
    {
      name: '赔付率（风险）',
      type: 'scatter',
      yAxisIndex: 1,
      data: riskPoints,
      symbolSize: 12,
      itemStyle: {
        color: '#f97316',
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
    },
    // 赔付率连线（橙色）
    {
      name: '赔付率',
      type: 'line',
      yAxisIndex: 1,
      data: lossRatios,
      showSymbol: false,
      lineStyle: {
        color: '#f97316',
        width: 2,
        type: 'solid',
      },
      emphasis: {
        focus: 'series',
      },
      // 标记区域：赔付率≥70%的背景淡红色
      markArea: {
        silent: true,
        itemStyle: {
          color: 'rgba(254, 226, 226, 0.3)',
        },
        data: [
          [
            {
              yAxis: LOSS_RISK_THRESHOLD,
            },
            {
              yAxis: 'max',
            },
          ],
        ],
      },
    },
    // 阈值线 70%（红色虚线）
    {
      name: '阈值线 70%',
      type: 'line',
      yAxisIndex: 1,
      data: new Array(weeks.length).fill(LOSS_RISK_THRESHOLD),
      lineStyle: {
        color: '#ef4444',
        width: 2,
        type: 'dashed',
      },
      symbol: 'none',
      emphasis: {
        disabled: true,
      },
    },
    // 趋势线（紫色虚线）
    {
      name: '趋势线',
      type: 'line',
      yAxisIndex: 1,
      data: trendLineData,
      lineStyle: {
        color: '#8b5cf6',
        width: 2,
        type: 'dashed',
      },
      symbol: 'none',
      emphasis: {
        disabled: true,
      },
    },
  ]
}
