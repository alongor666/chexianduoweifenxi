/**
 * Domain 层 - 雷达评分服务
 *
 * 使用抽象算子实现的雷达评分逻辑，替代原有的 utils 实现。
 */

import { type KPIResult } from '@/types/insurance'
import {
  calculateScore,
  createScoringConfig,
  type ScoreResult,
  type ScoringConfig,
} from '../shared/scoring-operators'

/**
 * 雷达评分结果（继承自通用评分结果）
 */
export interface RadarScoreResult extends ScoreResult {
  /** 维度标识 */
  dimension: string
}

/**
 * 雷达维度配置
 */
export interface RadarDimension {
  /** 维度标识 */
  key: keyof KPIResult
  /** 显示标签 */
  label: string
  /** 简短标签 */
  shortLabel: string
  /** 描述信息 */
  description: string
  /** 单位 */
  unit: string
  /** 评分配置 */
  scoringConfig: ScoringConfig
}

/**
 * 满期边际贡献率评分配置（越大越好）
 */
const contributionMarginConfig: ScoringConfig = createScoringConfig(
  [
    {
      min: 12,
      max: Infinity,
      minScore: 95,
      maxScore: 100,
      level: 'excellent',
      label: '优秀',
    },
    {
      min: 8,
      max: 12,
      minScore: 86,
      maxScore: 94,
      level: 'good',
      label: '良好',
    },
    {
      min: 6,
      max: 8,
      minScore: 70,
      maxScore: 85,
      level: 'medium',
      label: '中等',
    },
    {
      min: 4,
      max: 6,
      minScore: 40,
      maxScore: 69,
      level: 'warning',
      label: '一般',
    },
    {
      min: 0,
      max: 4,
      minScore: 20,
      maxScore: 39,
      level: 'warning',
      label: '较差',
    },
    {
      min: -5,
      max: 0,
      minScore: 0,
      maxScore: 19,
      level: 'danger',
      label: '严重',
    },
    {
      min: -Infinity,
      max: -5,
      minScore: 0,
      maxScore: 0,
      level: 'danger',
      label: '严重',
    },
  ],
  true
) // 正向指标

/**
 * 时间进度达成率评分配置（越接近100%越好，超前也是好的）
 */
const timeProgressConfig: ScoringConfig = createScoringConfig(
  [
    {
      min: 110,
      max: Infinity,
      minScore: 95,
      maxScore: 100,
      level: 'excellent',
      label: '卓越',
    },
    {
      min: 100,
      max: 110,
      minScore: 86,
      maxScore: 94,
      level: 'good',
      label: '健康',
    },
    {
      min: 90,
      max: 100,
      minScore: 70,
      maxScore: 85,
      level: 'medium',
      label: '预警',
    },
    {
      min: 80,
      max: 90,
      minScore: 40,
      maxScore: 69,
      level: 'warning',
      label: '危险',
    },
    {
      min: 50,
      max: 80,
      minScore: 0,
      maxScore: 39,
      level: 'danger',
      label: '高危',
    },
    {
      min: -Infinity,
      max: 50,
      minScore: 0,
      maxScore: 0,
      level: 'danger',
      label: '高危',
    },
  ],
  true
) // 正向指标

/**
 * 满期赔付率评分配置（越小越好）
 */
const lossRatioConfig: ScoringConfig = createScoringConfig(
  [
    {
      min: 0,
      max: 50,
      minScore: 95,
      maxScore: 100,
      level: 'excellent',
      label: '优秀',
    },
    {
      min: 50,
      max: 60,
      minScore: 86,
      maxScore: 94,
      level: 'good',
      label: '良好',
    },
    {
      min: 60,
      max: 70,
      minScore: 70,
      maxScore: 85,
      level: 'medium',
      label: '中等',
    },
    {
      min: 70,
      max: 80,
      minScore: 40,
      maxScore: 69,
      level: 'warning',
      label: '预警',
    },
    {
      min: 80,
      max: 120,
      minScore: 0,
      maxScore: 39,
      level: 'danger',
      label: '高危',
    },
    {
      min: 120,
      max: Infinity,
      minScore: 0,
      maxScore: 0,
      level: 'danger',
      label: '高危',
    },
  ],
  false
) // 反向指标

/**
 * 费用率评分配置（越小越好）
 */
const expenseRatioConfig: ScoringConfig = createScoringConfig(
  [
    {
      min: 0,
      max: 7.5,
      minScore: 95,
      maxScore: 100,
      level: 'excellent',
      label: '优秀',
    },
    {
      min: 7.5,
      max: 12.5,
      minScore: 86,
      maxScore: 94,
      level: 'good',
      label: '良好',
    },
    {
      min: 12.5,
      max: 17.5,
      minScore: 70,
      maxScore: 85,
      level: 'medium',
      label: '中等',
    },
    {
      min: 17.5,
      max: 22.5,
      minScore: 40,
      maxScore: 69,
      level: 'warning',
      label: '一般',
    },
    {
      min: 22.5,
      max: 35,
      minScore: 0,
      maxScore: 39,
      level: 'danger',
      label: '较差',
    },
    {
      min: 35,
      max: Infinity,
      minScore: 0,
      maxScore: 0,
      level: 'danger',
      label: '较差',
    },
  ],
  false
) // 反向指标

/**
 * 满期出险率评分配置（越小越好）
 */
const claimFrequencyConfig: ScoringConfig = createScoringConfig(
  [
    {
      min: 0,
      max: 15,
      minScore: 95,
      maxScore: 100,
      level: 'excellent',
      label: '优秀',
    },
    {
      min: 15,
      max: 25,
      minScore: 86,
      maxScore: 94,
      level: 'good',
      label: '良好',
    },
    {
      min: 25,
      max: 35,
      minScore: 70,
      maxScore: 85,
      level: 'medium',
      label: '中等',
    },
    {
      min: 35,
      max: 50,
      minScore: 40,
      maxScore: 69,
      level: 'warning',
      label: '预警',
    },
    {
      min: 50,
      max: 80,
      minScore: 0,
      maxScore: 39,
      level: 'danger',
      label: '高危',
    },
    {
      min: 80,
      max: Infinity,
      minScore: 0,
      maxScore: 0,
      level: 'danger',
      label: '高危',
    },
  ],
  false
) // 反向指标

/**
 * 雷达维度配置
 */
export const RADAR_DIMENSIONS: RadarDimension[] = [
  {
    key: 'contribution_margin_ratio',
    label: '满期边际贡献率',
    shortLabel: '边贡率',
    description: '反映业务盈利能力的核心指标',
    unit: '%',
    scoringConfig: contributionMarginConfig,
  },
  {
    key: 'premium_time_progress_achievement_rate',
    label: '时间进度达成率',
    shortLabel: '进度达成',
    description: '保费目标完成进度与时间进度的匹配度',
    unit: '%',
    scoringConfig: timeProgressConfig,
  },
  {
    key: 'loss_ratio',
    label: '满期赔付率',
    shortLabel: '赔付率',
    description: '赔款支出占保费收入的比例',
    unit: '%',
    scoringConfig: lossRatioConfig,
  },
  {
    key: 'matured_claim_ratio',
    label: '满期出险率',
    shortLabel: '出险率',
    description: '出险保单占总保单的比例',
    unit: '%',
    scoringConfig: claimFrequencyConfig,
  },
  {
    key: 'expense_ratio',
    label: '费用率',
    shortLabel: '费用率',
    description: '费用支出占保费收入的比例',
    unit: '%',
    scoringConfig: expenseRatioConfig,
  },
]

/**
 * 计算单个维度的雷达评分
 *
 * @param value - 原始数值
 * @param dimension - 维度配置
 * @returns 雷达评分结果
 */
export function calculateRadarScore(
  value: number | null | undefined,
  dimension: RadarDimension
): RadarScoreResult | null {
  const scoreResult = calculateScore(value, dimension.scoringConfig)

  if (!scoreResult) {
    return null
  }

  return {
    ...scoreResult,
    dimension: dimension.key,
  }
}

/**
 * 批量计算 KPI 数据的雷达评分
 *
 * @param kpiData - KPI 数据
 * @returns 维度标识到评分结果的映射
 */
export function calculateRadarScores(
  kpiData: KPIResult | null | undefined
): Map<string, RadarScoreResult | null> {
  const scores = new Map<string, RadarScoreResult | null>()

  RADAR_DIMENSIONS.forEach(dimension => {
    const rawValue = kpiData?.[dimension.key] as number | null | undefined
    const scoreResult = calculateRadarScore(rawValue, dimension)
    scores.set(dimension.key, scoreResult)
  })

  return scores
}

/**
 * 获取雷达评分统计信息
 *
 * @param scores - 雷达评分结果映射
 * @returns 统计信息
 */
export function getRadarScoreStatistics(
  scores: Map<string, RadarScoreResult | null>
): {
  totalDimensions: number
  scoredDimensions: number
  averageScore: number | null
  levelDistribution: Record<string, number>
  dimensionScores: Record<string, number | null>
} {
  const scoreValues = Array.from(scores.values()).filter(
    (s): s is RadarScoreResult => s !== null
  )

  const levelDistribution: Record<string, number> = {}
  const dimensionScores: Record<string, number | null> = {}

  scores.forEach((score, dimension) => {
    dimensionScores[dimension] = score?.score ?? null

    if (score) {
      levelDistribution[score.level] = (levelDistribution[score.level] || 0) + 1
    }
  })

  return {
    totalDimensions: RADAR_DIMENSIONS.length,
    scoredDimensions: scoreValues.length,
    averageScore:
      scoreValues.length > 0
        ? scoreValues.reduce((sum, s) => sum + s.score, 0) / scoreValues.length
        : null,
    levelDistribution,
    dimensionScores,
  }
}

/**
 * 根据评分获取推荐建议
 *
 * @param score - 评分结果
 * @returns 推荐建议
 */
export function getRecommendation(score: RadarScoreResult): string {
  const recommendations: Record<string, string> = {
    excellent: '表现优秀，请继续保持当前策略',
    good: '表现良好，可进一步优化提升',
    medium: '表现中等，建议关注并制定改进计划',
    warning: '需要重点关注，建议立即采取改进措施',
    danger: '表现不佳，需要紧急干预和调整策略',
  }

  return recommendations[score.level] || '暂无建议'
}
