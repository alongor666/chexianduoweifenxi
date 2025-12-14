/**
 * Domain 层 - 公共算子模块
 *
 * 提供可复用的领域算子，包括评分和数据规范化功能。
 */

// 评分算子
export {
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
} from './scoring-operators'

// 数据规范化算子
export {
  normalize,
  normalizeText,
  normalizeNumber,
  normalizeBoolean,
  normalizeDate,
  normalizeBatch,
  normalizeObject,
  type NormalizationResult,
  type ValidationRule,
  type NormalizationConfig,
  type TextNormalizationConfig,
  type NumberNormalizationConfig,
  type DateNormalizationConfig,
} from './normalization-operators'
