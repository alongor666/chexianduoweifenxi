import type { ChartDataPoint } from '../types'

export interface ChartSeriesData {
  weeks: string[]
  signedPremiums: number[]
  lossRatios: (number | null)[]
  normalPoints: [number, number][]
  riskPoints: [number, number][]
}

/**
 * 将展示数据转换为图表需要的序列
 */
export function transformChartData(displayData: ChartDataPoint[]): ChartSeriesData {
  const weeks = displayData.map((d, index) => {
    const isFirstWeekOfMonth = d.weekNumber % 4 === 1 || d.weekNumber === 1
    const isLastWeek = index === displayData.length - 1

    if (isFirstWeekOfMonth || isLastWeek) {
      return `第${d.weekNumber}周`
    }
    return ''
  })

  const signedPremiums = displayData.map((d) => d.signedPremium)
  const lossRatios = displayData.map((d) => d.lossRatio)

  const normalPoints = displayData
    .map((d, i) => (!d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
    .filter((v): v is [number, number] => v !== null)

  const riskPoints = displayData
    .map((d, i) => (d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
    .filter((v): v is [number, number] => v !== null)

  return {
    weeks,
    signedPremiums,
    lossRatios,
    normalPoints,
    riskPoints,
  }
}
