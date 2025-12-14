/**
 * Domain 层测试 - 评分算子
 *
 * 测试评分算子的各种场景和边界条件
 */

import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  createScoringConfig,
  calculateScoresBatch,
  calculateScoreStatistics,
  type ScoreResult,
  type _ScoringConfig,
} from '../shared/scoring-operators'

describe('评分算子', () => {
  describe('calculateScore', () => {
    it('应该正确计算正向指标评分', () => {
      const config = createScoringConfig(
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
            max: 100,
            minScore: 70,
            maxScore: 94,
            level: 'good',
            label: '良好',
          },
        ],
        true
      )

      const result = calculateScore(25, config)

      expect(result).not.toBeNull()
      expect(result!.score).toBeCloseTo(97.5, 1) // 25在第一个区间，应该得到95-100之间的分数
      expect(result!.level).toBe('excellent')
      expect(result!.label).toBe('优秀')
      expect(result!.rawValue).toBe(25)
    })

    it('应该正确计算反向指标评分', () => {
      const config = createScoringConfig(
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
            max: 100,
            minScore: 70,
            maxScore: 94,
            level: 'good',
            label: '良好',
          },
        ],
        false
      )

      const result = calculateScore(25, config)

      expect(result).not.toBeNull()
      expect(result!.score).toBeCloseTo(97.5, 1) // 反向指标，25在第一个区间，应该得到95-100之间的分数
      expect(result!.level).toBe('excellent')
      expect(result!.label).toBe('优秀')
      expect(result!.rawValue).toBe(25)
    })

    it('应该处理边界值', () => {
      const config = createScoringConfig(
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
            max: Infinity,
            minScore: 70,
            maxScore: 94,
            level: 'good',
            label: '良好',
          },
        ],
        true
      )

      // 测试下边界
      const lowerResult = calculateScore(0, config)
      expect(lowerResult).not.toBeNull()
      expect(lowerResult!.score).toBe(95)
      expect(lowerResult!.level).toBe('excellent')

      // 测试上边界（100在第二个区间）
      const upperResult = calculateScore(100, config)
      expect(upperResult).not.toBeNull()
      expect(upperResult!.score).toBe(70) // 100在[50, Infinity)区间，应该得到70分
      expect(upperResult!.level).toBe('good')
    })

    it('应该处理无效输入', () => {
      const config = createScoringConfig(
        [
          {
            min: 0,
            max: 50,
            minScore: 95,
            maxScore: 100,
            level: 'excellent',
            label: '优秀',
          },
        ],
        true
      )

      expect(calculateScore(null, config)).toBeNull()
      expect(calculateScore(undefined, config)).toBeNull()
      expect(calculateScore(NaN, config)).toBeNull()
    })

    it('应该处理超出范围的值', () => {
      const config = createScoringConfig(
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
            max: 100,
            minScore: 70,
            maxScore: 94,
            level: 'good',
            label: '良好',
          },
        ],
        true
      )

      // 测试超出上限的值
      const highResult = calculateScore(150, config)
      expect(highResult).toBeNull()

      // 测试超出下限的值
      const lowResult = calculateScore(-10, config)
      expect(lowResult).toBeNull()
    })
  })

  describe('createScoringConfig', () => {
    it('应该创建正确的评分配置', () => {
      const thresholds = [
        {
          min: 0,
          max: 50,
          minScore: 95,
          maxScore: 100,
          level: 'excellent',
          label: '优秀',
        },
      ]

      const config = createScoringConfig(thresholds, true, 0, 1)

      expect(config.thresholds).toHaveLength(1)
      expect(config.thresholds[0].color).toBe('#2E7D32')
      expect(config.isPositive).toBe(true)
      expect(config.defaultValue).toBe(0)
      expect(config.precision).toBe(1)
    })
  })

  describe('calculateScoresBatch', () => {
    it('应该批量计算评分', () => {
      const config = createScoringConfig(
        [
          {
            min: 0,
            max: 100,
            minScore: 0,
            maxScore: 100,
            level: 'good',
            label: '良好',
          },
        ],
        true
      )

      const values = [10, 50, 90, null, undefined]
      const results = calculateScoresBatch(values, config)

      expect(results).toHaveLength(5)
      expect(results[0]?.score).toBe(10)
      expect(results[1]?.score).toBe(50)
      expect(results[2]?.score).toBe(90)
      expect(results[3]).toBeNull()
      expect(results[4]).toBeNull()
    })
  })

  describe('calculateScoreStatistics', () => {
    it('应该计算正确的统计信息', () => {
      const scores: ScoreResult[] = [
        {
          score: 95,
          rawValue: 10,
          level: 'excellent',
          label: '优秀',
          color: '#2E7D32',
        },
        {
          score: 85,
          rawValue: 20,
          level: 'medium',
          label: '中等',
          color: '#1976D2',
        },
        {
          score: 75,
          rawValue: 30,
          level: 'medium',
          label: '中等',
          color: '#1976D2',
        },
        {
          score: 45,
          rawValue: 40,
          level: 'warning',
          label: '预警',
          color: '#FBC02D',
        },
        {
          score: 25,
          rawValue: 50,
          level: 'danger',
          label: '高危',
          color: '#D32F2F',
        },
      ]

      const stats = calculateScoreStatistics(scores)

      expect(stats.count).toBe(5)
      expect(stats.average).toBeCloseTo(65, 1)
      expect(stats.min).toBe(25)
      expect(stats.max).toBe(95)
      expect(stats.levelDistribution.excellent).toBe(1)
      expect(stats.levelDistribution.good).toBe(0)
      expect(stats.levelDistribution.medium).toBe(2)
      expect(stats.levelDistribution.warning).toBe(1)
      expect(stats.levelDistribution.danger).toBe(1)
    })

    it('应该处理空数组', () => {
      const stats = calculateScoreStatistics([])

      expect(stats.count).toBe(0)
      expect(stats.average).toBeNull()
      expect(stats.min).toBeNull()
      expect(stats.max).toBeNull()
      expect(stats.levelDistribution.excellent).toBe(0)
      expect(stats.levelDistribution.good).toBe(0)
      expect(stats.levelDistribution.medium).toBe(0)
      expect(stats.levelDistribution.warning).toBe(0)
      expect(stats.levelDistribution.danger).toBe(0)
    })

    it('应该过滤null值', () => {
      const scores: (ScoreResult | null)[] = [
        {
          score: 95,
          rawValue: 10,
          level: 'excellent',
          label: '优秀',
          color: '#2E7D32',
        },
        null,
        {
          score: 85,
          rawValue: 20,
          level: 'medium',
          label: '中等',
          color: '#1976D2',
        },
        null,
      ]

      const stats = calculateScoreStatistics(scores)

      expect(stats.count).toBe(2)
      expect(stats.average).toBeCloseTo(90, 1)
      expect(stats.min).toBe(85)
      expect(stats.max).toBe(95)
    })
  })
})
