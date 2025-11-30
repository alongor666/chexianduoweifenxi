import type * as echarts from 'echarts'
import type { ChartDataPoint } from './types'
import { createAxes } from './chart-config/axes'
import { createDataZoom } from './chart-config/data-zoom'
import { transformChartData } from './chart-config/data-transform'
import { createSeries } from './chart-config/series'
import { createTooltip } from './chart-config/tooltip'

export interface CreateWeeklyTrendChartOptionParams {
  displayData: ChartDataPoint[]
  trendLine: number[]
  dataViewType: 'current' | 'increment'
}

export function createWeeklyTrendChartOption(
  params: CreateWeeklyTrendChartOptionParams
): echarts.EChartsOption {
  const { displayData, trendLine } = params

  const chartData = transformChartData(displayData)
  const axes = createAxes(chartData.weeks)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    tooltip: createTooltip(displayData),
    legend: {
      data: ['签单保费', '赔付率', '阈值线 70%', '趋势线'],
      top: '2%',
      textStyle: {
        fontSize: 12,
      },
    },
    xAxis: axes.xAxis,
    yAxis: axes.yAxis,
    dataZoom: createDataZoom(displayData.length),
    series: createSeries({ ...chartData, trendLine }),
  }

  return option
}
