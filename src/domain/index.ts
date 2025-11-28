/**
 * Domain 层公开接口
 *
 * 这是 Domain 层的入口文件，明确声明对外暴露的内容。
 */

// 实体
export { InsuranceRecord } from './entities/InsuranceRecord'
export type { RawInsuranceData } from './entities/InsuranceRecord'

// 业务规则 - KPI 计算
export {
  calculateKPIs,
  calculateLossRatio,
  calculateExpenseRatio,
  calculateMaturityRatio,
  calculateContributionMarginRatio,
  calculateVariableCostRatio,
  calculateMaturedClaimRatio,
  calculateAutonomyCoefficient,
  calculatePremiumProgress,
  calculateAveragePremium,
  calculateAverageClaim,
  calculateAverageExpense,
  calculateAverageContribution,
  aggregateInsuranceRecords,
} from './rules/kpi-calculator'
export type { KPIResult } from './rules/kpi-calculator'

// 业务规则 - 数据规范化
export {
  normalizeChineseText,
  normalizeNumber,
  normalizeBoolean,
  normalizeDateString,
  validateWeekNumber,
  validateYear,
  normalizeInsuranceRecord,
  normalizeInsuranceRecordsBatch,
} from './rules/data-normalization'
