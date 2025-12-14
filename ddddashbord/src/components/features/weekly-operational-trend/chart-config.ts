import * as echarts from 'echarts'
import { formatNumber } from '@/utils/format'
// import { LOSS_RISK_THRESHOLD } from './utils'
import type { ChartDataPoint } from './types'
import { getTooltipFormatter, getChartSeries } from './chart-helpers'

interface GetChartOptionParams {
  displayData: ChartDataPoint[]
  trendLineData: number[]
  onPointClick: (point: ChartDataPoint) => void
}

export const getChartOption = ({
  displayData,
  trendLineData,
}: GetChartOptionParams): echarts.EChartsOption => {
  // 优化X轴标签：只显示周序号，不显示年份；只显示每月第1周和最近1周
  const weeks = displayData.map((d, index) => {
    const isFirstWeekOfMonth = d.weekNumber % 4 === 1 || d.weekNumber === 1
    const isLastWeek = index === displayData.length - 1

    // 只在每月第1周和最近1周显示标签
    if (isFirstWeekOfMonth || isLastWeek) {
      return `第${d.weekNumber}周`
    }
    return '' // 其他周不显示标签
  })

  const signedPremiums = displayData.map(d => d.signedPremium)
  const lossRatios = displayData.map(d => d.lossRatio)

  // 分离风险点和正常点
  const normalPoints = displayData
    .map((d, i) =>
      !d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null
    )
    .filter((v): v is [number, number] => v !== null)

  const riskPoints = displayData
    .map((d, i) => (d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
    .filter((v): v is [number, number] => v !== null)

  return {
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
      formatter: getTooltipFormatter(displayData),
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
        start:
          displayData.length > 26
            ? ((displayData.length - 26) / displayData.length) * 100
            : 0,
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
        start:
          displayData.length > 26
            ? ((displayData.length - 26) / displayData.length) * 100
            : 0,
        end: 100,
      },
    ],
    series: getChartSeries(
      weeks,
      signedPremiums,
      normalPoints,
      riskPoints,
      lossRatios,
      trendLineData
    ),
  }
}
