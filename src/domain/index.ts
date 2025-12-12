/**
 * Domain 层公开接口
 *
 * 这是 Domain 层的入口文件，明确声明对外暴露的内容。
 */

// 实体
export { InsuranceRecord } from './entities/InsuranceRecord'
export type { RawInsuranceData } from './entities/InsuranceRecord'

// 业务规则 - KPI 计算（增强版）
export {
  calculateKPIs,
  calculateIncrementKPIs,
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
  getEmptyKPIResult,
  WORKING_WEEKS_PER_YEAR,
} from './rules/kpi-calculator'
export type { KPIResult, KPICalculationOptions } from './rules/kpi-calculator'

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
  normalizeInsuranceData,
} from './rules/data-normalization'

// 公共算子
export {
  // 评分算子
  calculateScore,
  calculateScoresBatch,
  calculateScoreStatistics,
  createScoringConfig,
  type ScoreResult,
  type ScoreLevel,
  type ScoreThreshold,
  type ScoringConfig,
  DEFAULT_LEVEL_COLORS,
  DEFAULT_LEVEL_LABELS,
  // 数据规范化算子
  normalize,
  normalizeText,
  normalizeNumber as normalizeNumberAdvanced,
  normalizeBoolean as normalizeBooleanAdvanced,
  normalizeDate,
  normalizeBatch,
  normalizeObject,
  type NormalizationResult,
  type ValidationRule,
  type NormalizationConfig,
  type TextNormalizationConfig,
  type NumberNormalizationConfig,
  type DateNormalizationConfig,
} from './shared'

// 领域服务
export {
  calculateRadarScore,
  calculateRadarScores,
  getRadarScoreStatistics,
  getRecommendation,
  RADAR_DIMENSIONS,
  type RadarScoreResult,
  type RadarDimension,
} from './services/radar-scoring-service'

// CSV 解析服务
export {
  parseCSV,
  parseCSVBatch,
  convertToInsuranceRecords,
  REQUIRED_FIELDS,
  type CSVParseConfig,
  type CSVParseResult,
  type CSVParseError,
  type CSVParseStatistics,
  type FieldValidationRule,
} from './services/csv-parser-service'

// 重新导出应用层（为了向后兼容）
export * as Application from '../application'
