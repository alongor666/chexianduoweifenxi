/**
 * 周度经营趋势分析 - 类型定义
 *
 * 定义周度趋势分析相关的所有类型接口，包括图表数据、统计指标和分析结果等。
 */

/**
 * 图表数据点类型
 *
 * 代表周度趋势图表中的单个数据点。
 */
export interface ChartDataPoint {
  /** 周次标签（如 "2024年第1周"） */
  week: string
  /** 周次数字 */
  weekNumber: number
  /** 年份 */
  year: number
  /** 签单保费（万元） */
  signedPremium: number
  /** 赔付率（%），可能为 null 表示无法计算 */
  lossRatio: number | null
  /** 是否为风险点（赔付率超过阈值） */
  isRisk: boolean
}

/**
 * 经营摘要叙述结构
 *
 * 包含完整的分析报告各个部分的文本内容。
 */
export interface NarrativeSummary {
  /** 经营概览 */
  overview: string
  /** 赔付趋势 */
  lossTrend: string
  /** 业务类型异常明细 */
  businessLines: string[]
  /** 机构集中区域明细 */
  organizationLines: string[]
  /** 风险洞察（可选） */
  insight: string | null
  /** 管理建议 */
  actionLines: string[]
  /** 后续跟踪 */
  followUp: string
}

/**
 * 维度高亮信息
 *
 * 用于展示按业务类型或机构维度的风险高亮数据。
 */
export interface DimensionHighlight {
  /** 维度键值（用于去重和排序） */
  key: string
  /** 维度标签（展示名称） */
  label: string
  /** 当前赔付率（%） */
  lossRatio: number | null
  /** 赔付率环比变化（百分点） */
  lossRatioChange: number | null
  /** 当前赔款金额（万元） */
  claimPaymentWan: number
  /** 赔款金额环比变化（万元） */
  claimPaymentChangeWan: number | null
  /** 主要险别（赔款最高的险别） */
  topCoverage: string | null
  /** 主要合作方（赔款最高的机构或业务类型） */
  topPartner: string | null
}

/**
 * 总计聚合数据
 *
 * 用于汇总某个时间范围内的核心业务指标。
 */
export interface TotalsAggregation {
  /** 签单保费总额（元） */
  signedPremiumYuan: number
  /** 满期保费总额（元） */
  maturedPremiumYuan: number
  /** 赔款支付总额（元） */
  claimPaymentYuan: number
  /** 赔案件数 */
  claimCaseCount: number
}

/**
 * 维度累加器
 *
 * 用于在构建维度高亮数据时累积各项指标。
 */
export interface DimensionAccumulator {
  /** 维度标签 */
  label: string
  /** 当前周期满期保费（元） */
  currentMatured: number
  /** 当前周期赔款金额（元） */
  currentClaim: number
  /** 上一周期满期保费（元） */
  previousMatured: number
  /** 上一周期赔款金额（元） */
  previousClaim: number
  /** 险别 → 赔款金额的映射 */
  coverageClaims: Map<string, number>
  /** 合作方 → 赔款金额的映射 */
  partnerClaims: Map<string, number>
}
