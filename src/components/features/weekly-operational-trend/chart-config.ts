/**
 * 周度经营趋势分析 - ECharts 配置
 *
 * 提供纯函数式的 ECharts option 配置生成器，支持双 Y 轴图表（签单保费 + 赔付率）。
 *
 * 核心特性：
 * - 签单保费曲线（蓝色，左 Y 轴）
 * - 赔付率散点和连线（橙色，右 Y 轴）
 * - 风险点高亮（赔付率 ≥70%）
 * - 阈值线和趋势线
 * - 智能 Tooltip 和数据缩放
 */

import type * as echarts from 'echarts'
import * as echartsCore from 'echarts'
import type { ChartDataPoint } from './types'
import { LOSS_RISK_THRESHOLD } from './constants'
import { formatNumber, formatPercent } from '@/utils/formatters'

/**
 * 创建周度趋势图表配置参数
 */
export interface CreateWeeklyTrendChartOptionParams {
  /** 图表数据点数组 */
  displayData: ChartDataPoint[]
  /** 趋势线数据（对应每个数据点的趋势值） */
  trendLine: number[]
  /** 数据查看类型（用于未来扩展，当前版本未使用） */
  dataViewType: 'current' | 'increment'
}

/**
 * 创建周度经营趋势图表的 ECharts Option 配置
 *
 * @param params - 配置参数
 * @returns ECharts Option 配置对象
 *
 * @example
 * ```typescript
 * const option = createWeeklyTrendChartOption({
 *   displayData: chartDataPoints,
 *   trendLine: trendLineData,
 *   dataViewType: 'current'
 * })
 * chart.setOption(option)
 * ```
 */
export function createWeeklyTrendChartOption(
  params: CreateWeeklyTrendChartOptionParams
): echarts.EChartsOption {
  const { displayData, trendLine } = params

  // 准备数据：优化 X 轴标签（只显示周序号，不显示年份；只显示每月第1周和最近1周）
  const weeks = displayData.map((d, index) => {
    const isFirstWeekOfMonth = d.weekNumber % 4 === 1 || d.weekNumber === 1
    const isLastWeek = index === displayData.length - 1

    // 只在每月第1周和最近1周显示标签
    if (isFirstWeekOfMonth || isLastWeek) {
      return `第${d.weekNumber}周`
    }
    return '' // 其他周不显示标签
  })

  const signedPremiums = displayData.map((d) => d.signedPremium)
  const lossRatios = displayData.map((d) => d.lossRatio)

  // 分离风险点和正常点
  const normalPoints = displayData
    .map((d, i) => (!d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
    .filter((v): v is [number, number] => v !== null)

  const riskPoints = displayData
    .map((d, i) => (d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
    .filter((v): v is [number, number] => v !== null)

  // ECharts 配置
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#334155',
        fontSize: 12,
      },
      padding: 12,
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''

        const dataIndex = params[0].dataIndex
        const point = displayData[dataIndex]

        if (!point) return ''

        const thresholdDiff =
          point.lossRatio !== null
            ? point.lossRatio - LOSS_RISK_THRESHOLD
            : null

        let html = `<div style="min-width: 260px;">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${point.week}</div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">签单保费：</span>
            <span style="font-weight: 600;">${formatNumber(point.signedPremium, 1)} 万元</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="color: #64748b;">赔付率（累计）：</span>
            <span style="font-weight: 600; color: ${point.isRisk ? '#ef4444' : '#334155'};">
              ${point.lossRatio !== null ? formatPercent(point.lossRatio, 2) : '—'}
            </span>
          </div>
          <div style="margin-bottom: 8px; font-size: 10px; color: #94a3b8;">
            💡 赔付率 = 年初至今累计赔款 / 累计保费
          </div>`

        if (thresholdDiff !== null) {
          html += `<div style="margin-bottom: 8px;">
            <span style="color: #64748b;">与阈值差值：</span>
            <span style="font-weight: 600; color: ${thresholdDiff >= 0 ? '#ef4444' : '#10b981'};">
            ${thresholdDiff >= 0 ? '+' : ''}${thresholdDiff.toFixed(1)}pp
            </span>
          </div>`
        }

        html += `</div>`

        return html
      },
    },
    legend: {
      data: ['签单保费', '赔付率', '阈值线 70%', '趋势线'],
      top: '2%',
      textStyle: {
        fontSize: 12,
      },
    },
    xAxis: [
      {
        type: 'category',
        data: weeks,
        axisPointer: {
          type: 'shadow',
        },
        axisLabel: {
          fontSize: 11,
          rotate: 45,
          color: '#64748b',
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '签单保费（万元）',
        position: 'left',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => formatNumber(value, 0),
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
          },
        },
      },
      {
        type: 'value',
        name: '赔付率（%）',
        position: 'right',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => `${value.toFixed(0)}%`,
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          show: false,
        },
        // 右轴只显示关键刻度：70%、均值、最大值
        min: (value: any) => Math.floor(value.min / 10) * 10,
        max: (value: any) => Math.ceil(value.max / 10) * 10,
      },
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: 0,
        start: displayData.length > 26 ? ((displayData.length - 26) / displayData.length) * 100 : 0,
        end: 100,
        height: 20,
        bottom: '5%',
        handleSize: '80%',
        textStyle: {
          fontSize: 10,
        },
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        start: displayData.length > 26 ? ((displayData.length - 26) / displayData.length) * 100 : 0,
        end: 100,
      },
    ],
    series: [
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
          color: new echartsCore.graphic.LinearGradient(0, 0, 0, 1, [
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
        data: trendLine,
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
    ],
  }

  return option
}
