import type { ChartDataPoint, TotalsAggregation } from './types'

/**
 * 计算线性趋势线数据
 */
export function calculateTrendLine(data: ChartDataPoint[]): number[] {
  const lossRatios = data
    .map(d => d.lossRatio)
    .filter((v): v is number => v !== null)

  if (lossRatios.length < 2) return []

  // 最小二乘法计算线性回归
  const n = lossRatios.length
  const sumX = lossRatios.reduce((sum, _, i) => sum + i, 0)
  const sumY = lossRatios.reduce((sum, v) => sum + v, 0)
  const sumXY = lossRatios.reduce((sum, v, i) => sum + v * i, 0)
  const sumX2 = lossRatios.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return data.map((_, i) => slope * i + intercept)
}

export function aggregateTotals(records: any[]): TotalsAggregation {
  return records.reduce<TotalsAggregation>(
    (acc, record) => {
      acc.signedPremiumYuan += record.signed_premium_yuan
      acc.maturedPremiumYuan += record.matured_premium_yuan
      acc.claimPaymentYuan += record.reported_claim_payment_yuan
      acc.claimCaseCount += record.claim_case_count
      return acc
    },
    {
      signedPremiumYuan: 0,
      maturedPremiumYuan: 0,
      claimPaymentYuan: 0,
      claimCaseCount: 0,
    }
  )
}

export function computeLossRatio(totals: TotalsAggregation): number | null {
  if (totals.maturedPremiumYuan <= 0) return null
  return (totals.claimPaymentYuan / totals.maturedPremiumYuan) * 100
}

export function pickTopLabel(claims: Map<string, number>): string | null {
  let topLabel: string | null = null
  let topValue = Number.NEGATIVE_INFINITY
  claims.forEach((value, label) => {
    if (value > topValue) {
      topValue = value
      topLabel = label
    }
  })
  return topLabel
}
