/**
 * Domain 层测试 - 雷达评分服务
 *
 * 测试雷达评分的各种场景和业务逻辑
 */

import { describe, it, expect } from 'vitest'
import {
  calculateRadarScore,
  calculateRadarScores,
  getRadarScoreStatistics,
  getRecommendation,
  RADAR_DIMENSIONS,
  type RadarScoreResult,
} from '../services/radar-scoring-service'
import type { KPIResult } from '../../types/insurance'

describe('雷达评分服务', () => {
  describe('calculateRadarScore', () => {
    it('应该正确计算边贡率评分', () => {
      const dimension = RADAR_DIMENSIONS.find(
        d => d.key === 'contribution_margin_ratio'
      )!

      // 测试优秀值
      const excellentResult = calculateRadarScore(15, dimension)
      expect(excellentResult).not.toBeNull()
      expect(excellentResult!.score).toBeGreaterThanOrEqual(95)
      expect(excellentResult!.level).toBe('excellent')
      expect(excellentResult!.dimension).toBe('contribution_margin_ratio')

      // 测试危险值
      const dangerResult = calculateRadarScore(-3, dimension) // 使用-3，在[-5, 0]区间内
      expect(dangerResult).not.toBeNull()
      if (dangerResult) {
        expect(dangerResult.score).toBeLessThanOrEqual(19)
        expect(dangerResult.level).toBe('danger')
      }
    })

    it('应该正确计算赔付率评分', () => {
      const dimension = RADAR_DIMENSIONS.find(d => d.key === 'loss_ratio')!

      // 测试优秀值（赔付率低）
      const excellentResult = calculateRadarScore(30, dimension)
      expect(excellentResult).not.toBeNull()
      expect(excellentResult!.score).toBeGreaterThanOrEqual(95)
      expect(excellentResult!.level).toBe('excellent')

      // 测试危险值（赔付率高）
      const dangerResult = calculateRadarScore(90, dimension)
      expect(dangerResult).not.toBeNull()
      expect(dangerResult!.score).toBeLessThanOrEqual(39)
      expect(dangerResult!.level).toBe('danger')
    })

    it('应该处理null值', () => {
      const dimension = RADAR_DIMENSIONS[0]
      const result = calculateRadarScore(null, dimension)
      expect(result).toBeNull()
    })

    it('应该处理undefined值', () => {
      const dimension = RADAR_DIMENSIONS[0]
      const result = calculateRadarScore(undefined, dimension)
      expect(result).toBeNull()
    })
  })

  describe('calculateRadarScores', () => {
    it('应该计算所有维度的评分', () => {
      const kpiData: KPIResult = {
        contribution_margin_ratio: 10,
        premium_time_progress_achievement_rate: 95,
        loss_ratio: 60,
        matured_claim_ratio: 25,
        expense_ratio: 15,
        // 其他字段...
        signed_premium_yuan: 1000000,
        matured_premium_yuan: 800000,
        policy_count: 100,
        claim_case_count: 20,
        reported_claim_payment_yuan: 480000,
        expense_amount_yuan: 120000,
        commercial_premium_before_discount_yuan: 1100000,
        marginal_contribution_amount_yuan: 80000,
        premium_progress: 80,
        maturity_ratio: 80,
        variable_cost_ratio: 20,
        matured_claim_ratio_with_zero: 25,
        autonomy_coefficient: 0.6,
        average_premium: 10000,
        average_claim: 24000,
      }

      const scores = calculateRadarScores(kpiData)

      expect(scores.size).toBe(RADAR_DIMENSIONS.length)

      // 检查每个维度都有评分
      RADAR_DIMENSIONS.forEach(dimension => {
        expect(scores.has(dimension.key)).toBe(true)
        const score = scores.get(dimension.key)
        expect(score).not.toBeNull()
        expect(score!.dimension).toBe(dimension.key)
      })
    })

    it('应该处理null KPI数据', () => {
      const scores = calculateRadarScores(null)
      expect(scores.size).toBe(RADAR_DIMENSIONS.length)

      scores.forEach(score => {
        expect(score).toBeNull()
      })
    })

    it('应该处理undefined KPI数据', () => {
      const scores = calculateRadarScores(undefined)
      expect(scores.size).toBe(RADAR_DIMENSIONS.length)

      scores.forEach(score => {
        expect(score).toBeNull()
      })
    })

    it('应该处理部分缺失的KPI数据', () => {
      const partialKpiData: Partial<KPIResult> = {
        contribution_margin_ratio: 10,
        loss_ratio: 60,
        // 其他字段缺失
      }

      const scores = calculateRadarScores(partialKpiData as KPIResult)

      expect(scores.size).toBe(RADAR_DIMENSIONS.length)

      // 有值的维度应该有评分
      expect(scores.get('contribution_margin_ratio')).not.toBeNull()
      expect(scores.get('loss_ratio')).not.toBeNull()

      // 缺失的维度应该返回null
      expect(scores.get('premium_time_progress_achievement_rate')).toBeNull()
    })
  })

  describe('getRadarScoreStatistics', () => {
    it('应该计算正确的统计信息', () => {
      const scores = new Map<string, RadarScoreResult | null>()

      scores.set('contribution_margin_ratio', {
        score: 95,
        rawValue: 15,
        level: 'excellent',
        label: '优秀',
        color: '#2E7D32',
        dimension: 'contribution_margin_ratio',
      })

      scores.set('loss_ratio', {
        score: 70,
        rawValue: 65,
        level: 'medium',
        label: '中等',
        color: '#1976D2',
        dimension: 'loss_ratio',
      })

      scores.set('expense_ratio', null) // 无效评分

      const stats = getRadarScoreStatistics(scores)

      expect(stats.totalDimensions).toBe(RADAR_DIMENSIONS.length)
      expect(stats.scoredDimensions).toBe(2)
      expect(stats.averageScore).toBeCloseTo(82.5, 1)
      expect(stats.levelDistribution.excellent).toBe(1)
      expect(stats.levelDistribution.medium).toBe(1)
      expect(stats.levelDistribution.good || 0).toBe(0)
      expect(stats.dimensionScores.contribution_margin_ratio).toBe(95)
      expect(stats.dimensionScores.loss_ratio).toBe(70)
      expect(stats.dimensionScores.expense_ratio).toBeNull()
    })

    it('应该处理空评分映射', () => {
      const emptyScores = new Map<string, RadarScoreResult | null>()
      const stats = getRadarScoreStatistics(emptyScores)

      expect(stats.totalDimensions).toBe(RADAR_DIMENSIONS.length)
      expect(stats.scoredDimensions).toBe(0)
      expect(stats.averageScore).toBeNull()
      expect(stats.levelDistribution.excellent || 0).toBe(0)
    })
  })

  describe('getRecommendation', () => {
    it('应该为不同等级提供正确的建议', () => {
      const excellentScore: RadarScoreResult = {
        score: 95,
        rawValue: 15,
        level: 'excellent',
        label: '优秀',
        color: '#2E7D32',
        dimension: 'contribution_margin_ratio',
      }

      const goodScore: RadarScoreResult = {
        score: 85,
        rawValue: 10,
        level: 'good',
        label: '良好',
        color: '#4CAF50',
        dimension: 'contribution_margin_ratio',
      }

      const mediumScore: RadarScoreResult = {
        score: 70,
        rawValue: 6,
        level: 'medium',
        label: '中等',
        color: '#1976D2',
        dimension: 'contribution_margin_ratio',
      }

      const warningScore: RadarScoreResult = {
        score: 50,
        rawValue: 4,
        level: 'warning',
        label: '一般',
        color: '#FBC02D',
        dimension: 'contribution_margin_ratio',
      }

      const dangerScore: RadarScoreResult = {
        score: 10,
        rawValue: -10,
        level: 'danger',
        label: '严重',
        color: '#D32F2F',
        dimension: 'contribution_margin_ratio',
      }

      expect(getRecommendation(excellentScore)).toBe(
        '表现优秀，请继续保持当前策略'
      )
      expect(getRecommendation(goodScore)).toBe('表现良好，可进一步优化提升')
      expect(getRecommendation(mediumScore)).toBe(
        '表现中等，建议关注并制定改进计划'
      )
      expect(getRecommendation(warningScore)).toBe(
        '需要重点关注，建议立即采取改进措施'
      )
      expect(getRecommendation(dangerScore)).toBe(
        '表现不佳，需要紧急干预和调整策略'
      )
    })
  })

  describe('RADAR_DIMENSIONS', () => {
    it('应该包含所有必需的维度', () => {
      const expectedKeys = [
        'contribution_margin_ratio',
        'premium_time_progress_achievement_rate',
        'loss_ratio',
        'matured_claim_ratio',
        'expense_ratio',
      ]

      expectedKeys.forEach(key => {
        const dimension = RADAR_DIMENSIONS.find(d => d.key === key)
        expect(dimension).toBeDefined()
        expect(dimension!.key).toBe(key)
        expect(dimension!.label).toBeTruthy()
        expect(dimension!.shortLabel).toBeTruthy()
        expect(dimension!.description).toBeTruthy()
        expect(dimension!.unit).toBeTruthy()
        expect(dimension!.scoringConfig).toBeDefined()
      })
    })

    it('应该有正确的评分配置', () => {
      RADAR_DIMENSIONS.forEach(dimension => {
        const config = dimension.scoringConfig
        expect(config.thresholds).toBeDefined()
        expect(config.thresholds.length).toBeGreaterThan(0)
        expect(typeof config.isPositive).toBe('boolean')
      })
    })
  })
})
