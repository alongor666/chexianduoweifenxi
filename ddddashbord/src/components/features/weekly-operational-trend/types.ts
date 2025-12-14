export interface ChartDataPoint {
  week: string // 周次标签
  weekNumber: number // 周次数字
  year: number // 年份
  signedPremium: number // 签单保费（万元）
  lossRatio: number | null // 赔付率（%）
  isRisk: boolean // 是否为风险点
}

export interface NarrativeSummary {
  overview: string
  lossTrend: string
  businessLines: string[]
  organizationLines: string[]
  insight: string | null
  actionLines: string[]
  followUp: string
}

export interface DimensionHighlight {
  key: string
  label: string
  lossRatio: number | null
  lossRatioChange: number | null
  claimPaymentWan: number
  claimPaymentChangeWan: number | null
  topCoverage: string | null
  topPartner: string | null
}

export interface DimensionAccumulator {
  label: string
  currentMatured: number
  currentClaim: number
  previousMatured: number
  previousClaim: number
  coverageClaims: Map<string, number>
  partnerClaims: Map<string, number>
}

export interface TotalsAggregation {
  signedPremiumYuan: number
  maturedPremiumYuan: number
  claimPaymentYuan: number
  claimCaseCount: number
}
