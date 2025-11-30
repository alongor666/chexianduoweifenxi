import type * as echarts from 'echarts'
import * as echartsCore from 'echarts'
import { LOSS_RISK_THRESHOLD } from '../constants'
import type { ChartSeriesData } from './data-transform'

interface CreateSeriesParams extends ChartSeriesData {
  trendLine: number[]
}

export function createSeries(params: CreateSeriesParams): echarts.SeriesOption[] {
  const { weeks, signedPremiums, lossRatios, normalPoints, riskPoints, trendLine } = params

  return [
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
      sampling: 'lttb',
    },
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
  ]
}
