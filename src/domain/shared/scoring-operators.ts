/**
 * Domain 层 - 评分算子抽象
 *
 * 核心功能：
 * - 提供通用的阈值评分算法
 * - 支持线性和非线性评分映射
 * - 统一的等级分类和颜色方案
 * - 支持正向和反向指标评分
 */

/**
 * 评分等级枚举
 */
export type ScoreLevel = 'excellent' | 'good' | 'medium' | 'warning' | 'danger'

/**
 * 评分结果接口
 */
export interface ScoreResult {
  /** 标准化评分（0-100） */
  score: number
  /** 原始数值 */
  rawValue: number
  /** 评级等级 */
  level: ScoreLevel
  /** 等级标签 */
  label: string
  /** 色彩方案 */
  color: string
}

/**
 * 评分阈值配置
 */
export interface ScoreThreshold {
  /** 最小值（包含） */
  min: number
  /** 最大值（不包含） */
  max: number
  /** 最小分数 */
  minScore: number
  /** 最大分数 */
  maxScore: number
  /** 等级 */
  level: ScoreLevel
  /** 等级标签 */
  label: string
  /** 色彩 */
  color: string
}

/**
 * 评分配置
 */
export interface ScoringConfig {
  /** 阈值配置列表（按优先级排序） */
  thresholds: ScoreThreshold[]
  /** 指标方向：true为正向（越大越好），false为反向（越小越好） */
  isPositive: boolean
  /** 默认值（当输入为null/undefined时使用） */
  defaultValue?: number
  /** 分数精度（小数位数） */
  precision?: number
}

/**
 * 默认等级颜色方案
 */
export const DEFAULT_LEVEL_COLORS = {
  excellent: '#2E7D32', // 深绿色
  good: '#4CAF50', // 绿色
  medium: '#1976D2', // 蓝色
  warning: '#FBC02D', // 黄色
  danger: '#D32F2F', // 红色
}

/**
 * 默认等级标签
 */
export const DEFAULT_LEVEL_LABELS = {
  excellent: '优秀',
  good: '良好',
  medium: '中等',
  warning: '预警',
  danger: '高危',
}

/**
 * 通用评分算子
 *
 * 根据配置的阈值将原始数值转换为标准化评分。
 *
 * @param value - 原始数值
 * @param config - 评分配置
 * @returns 评分结果，如果输入无效则返回null
 */
export function calculateScore(
  value: number | null | undefined,
  config: ScoringConfig
): ScoreResult | null {
  // 处理无效输入
  if (value === null || value === undefined || isNaN(value)) {
    return null
  }

  // 查找匹配的阈值
  const threshold = config.thresholds.find(
    t => value >= t.min && (t.max === Infinity ? true : value < t.max)
  )

  if (!threshold) {
    return null
  }

  // 计算线性插值分数
  let score: number
  const range = threshold.max - threshold.min
  const scoreRange = threshold.maxScore - threshold.minScore

  if (range === 0) {
    // 避免除零错误
    score = threshold.minScore
  } else {
    // 线性插值
    const progress = (value - threshold.min) / range
    score = threshold.minScore + progress * scoreRange
  }

  // 反向指标需要反转分数
  if (!config.isPositive) {
    score = threshold.maxScore - (score - threshold.minScore)
  }

  // 限制分数范围
  score = Math.max(0, Math.min(100, score))

  // 处理精度
  const precision = config.precision ?? 1
  score = Math.round(score * Math.pow(10, precision)) / Math.pow(10, precision)

  return {
    score,
    rawValue: value,
    level: threshold.level,
    label: threshold.label,
    color: threshold.color,
  }
}

/**
 * 创建评分配置的辅助函数
 *
 * @param thresholds - 阈值配置
 * @param isPositive - 是否为正向指标
 * @param defaultValue - 默认值
 * @param precision - 精度
 * @returns 完整的评分配置
 */
export function createScoringConfig(
  thresholds: Omit<ScoreThreshold, 'color'>[],
  isPositive: boolean = true,
  defaultValue?: number,
  precision: number = 1
): ScoringConfig {
  return {
    thresholds: thresholds.map(t => ({
      ...t,
      color: DEFAULT_LEVEL_COLORS[t.level],
    })),
    isPositive,
    defaultValue,
    precision,
  }
}

/**
 * 批量评分算子
 *
 * 对多个数值进行批量评分。
 *
 * @param values - 数值数组
 * @param config - 评分配置
 * @returns 评分结果数组
 */
export function calculateScoresBatch(
  values: (number | null | undefined)[],
  config: ScoringConfig
): (ScoreResult | null)[] {
  return values.map(value => calculateScore(value, config))
}

/**
 * 评分统计算子
 *
 * 计算评分结果的统计信息。
 *
 * @param scores - 评分结果数组
 * @returns 统计信息
 */
export function calculateScoreStatistics(scores: (ScoreResult | null)[]): {
  count: number
  average: number | null
  min: number | null
  max: number | null
  levelDistribution: Record<ScoreLevel, number>
} {
  const validScores = scores.filter((s): s is ScoreResult => s !== null)

  if (validScores.length === 0) {
    return {
      count: 0,
      average: null,
      min: null,
      max: null,
      levelDistribution: {
        excellent: 0,
        good: 0,
        medium: 0,
        warning: 0,
        danger: 0,
      },
    }
  }

  const scoreValues = validScores.map(s => s.score)
  const levelDistribution = validScores.reduce(
    (acc, score) => {
      acc[score.level]++
      return acc
    },
    {
      excellent: 0,
      good: 0,
      medium: 0,
      warning: 0,
      danger: 0,
    } as Record<ScoreLevel, number>
  )

  return {
    count: validScores.length,
    average:
      scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length,
    min: Math.min(...scoreValues),
    max: Math.max(...scoreValues),
    levelDistribution,
  }
}
