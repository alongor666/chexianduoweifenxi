/**
 * Domain 层测试 - KPI 计算规则
 *
 * 测试策略：
 * - 每个函数都有独立的测试
 * - 测试边界条件（0、负数、null）
 * - 测试业务规则的正确性
 */

import { describe, it, expect } from 'vitest'
import {
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
  calculateKPIs,
  aggregateInsuranceRecords,
} from '../rules/kpi-calculator'
import { InsuranceRecord } from '../entities/InsuranceRecord'

// ============= 辅助函数 =============

/**
 * 创建测试用的保险记录
 */
function createTestRecord(
  overrides: Partial<{
    signedPremiumYuan: number
    maturedPremiumYuan: number
    policyCount: number
    claimCaseCount: number
    reportedClaimPaymentYuan: number
    expenseAmountYuan: number
    commercialPremiumBeforeDiscountYuan: number
    marginalContributionAmountYuan: number
  }> = {}
): InsuranceRecord {
  return new InsuranceRecord(
    '2025-01-14',
    2025,
    45,
    '成都',
    '武侯',
    '个人客户',
    '商业险',
    '私家车',
    '主全',
    '新保',
    false,
    false,
    null,
    null,
    null,
    null,
    '电销',
    overrides.signedPremiumYuan ?? 1000,
    overrides.maturedPremiumYuan ?? 800,
    overrides.policyCount ?? 10,
    overrides.claimCaseCount ?? 2,
    overrides.reportedClaimPaymentYuan ?? 400,
    overrides.expenseAmountYuan ?? 300,
    overrides.commercialPremiumBeforeDiscountYuan ?? 1200,
    null,
    overrides.marginalContributionAmountYuan ?? 100
  )
}

// ============= 率值指标测试 =============

describe('calculateLossRatio', () => {
  it('应该正确计算满期赔付率', () => {
    const result = calculateLossRatio(400, 800)
    expect(result).toBe(50) // (400/800) * 100 = 50%
  })

  it('当满期保费为0时应返回null', () => {
    const result = calculateLossRatio(400, 0)
    expect(result).toBeNull()
  })

  it('当赔款为0时应返回0', () => {
    const result = calculateLossRatio(0, 800)
    expect(result).toBe(0)
  })
})

describe('calculateExpenseRatio', () => {
  it('应该正确计算费用率', () => {
    const result = calculateExpenseRatio(300, 1000)
    expect(result).toBe(30) // (300/1000) * 100 = 30%
  })

  it('当签单保费为0时应返回null', () => {
    const result = calculateExpenseRatio(300, 0)
    expect(result).toBeNull()
  })
})

describe('calculateMaturityRatio', () => {
  it('应该正确计算满期率', () => {
    const result = calculateMaturityRatio(800, 1000)
    expect(result).toBe(80) // (800/1000) * 100 = 80%
  })

  it('当签单保费为0时应返回null', () => {
    const result = calculateMaturityRatio(800, 0)
    expect(result).toBeNull()
  })
})

describe('calculateContributionMarginRatio', () => {
  it('应该正确计算满期边际贡献率', () => {
    const result = calculateContributionMarginRatio(100, 800)
    expect(result).toBeCloseTo(12.5, 2) // (100/800) * 100 = 12.5%
  })

  it('当满期保费为0时应返回null', () => {
    const result = calculateContributionMarginRatio(100, 0)
    expect(result).toBeNull()
  })

  it('应该处理负的边际贡献', () => {
    const result = calculateContributionMarginRatio(-100, 800)
    expect(result).toBeCloseTo(-12.5, 2) // (-100/800) * 100 = -12.5%
  })
})

describe('calculateVariableCostRatio', () => {
  it('应该正确计算变动成本率', () => {
    const result = calculateVariableCostRatio(400, 300, 1000)
    expect(result).toBe(70) // (400+300)/1000 * 100 = 70%
  })

  it('当签单保费为0时应返回null', () => {
    const result = calculateVariableCostRatio(400, 300, 0)
    expect(result).toBeNull()
  })
})

describe('calculateMaturedClaimRatio', () => {
  it('应该正确计算满期出险率', () => {
    const result = calculateMaturedClaimRatio(2, 10)
    expect(result).toBe(20) // (2/10) * 100 = 20%
  })

  it('当保单件数为0时应返回null', () => {
    const result = calculateMaturedClaimRatio(2, 0)
    expect(result).toBeNull()
  })
})

describe('calculateAutonomyCoefficient', () => {
  it('应该正确计算商业险自主系数', () => {
    const result = calculateAutonomyCoefficient(1000, 1200)
    expect(result).toBeCloseTo(0.8333, 4) // 1000/1200 = 0.8333
  })

  it('当折前保费为0时应返回null', () => {
    const result = calculateAutonomyCoefficient(1000, 0)
    expect(result).toBeNull()
  })
})

describe('calculatePremiumProgress', () => {
  it('应该正确计算保费达成率', () => {
    const result = calculatePremiumProgress(800, 1000)
    expect(result).toBe(80) // (800/1000) * 100 = 80%
  })

  it('当目标为null时应返回null', () => {
    const result = calculatePremiumProgress(800, null)
    expect(result).toBeNull()
  })

  it('当目标为0时应返回null', () => {
    const result = calculatePremiumProgress(800, 0)
    expect(result).toBeNull()
  })
})

// ============= 均值指标测试 =============

describe('calculateAveragePremium', () => {
  it('应该正确计算单均保费', () => {
    const result = calculateAveragePremium(1000, 10)
    expect(result).toBe(100) // 1000/10 = 100
  })

  it('当保单件数为0时应返回null', () => {
    const result = calculateAveragePremium(1000, 0)
    expect(result).toBeNull()
  })
})

describe('calculateAverageClaim', () => {
  it('应该正确计算案均赔款', () => {
    const result = calculateAverageClaim(400, 2)
    expect(result).toBe(200) // 400/2 = 200
  })

  it('当赔案件数为0时应返回null', () => {
    const result = calculateAverageClaim(400, 0)
    expect(result).toBeNull()
  })
})

// ============= 聚合函数测试 =============

describe('aggregateInsuranceRecords', () => {
  it('应该正确聚合单条记录', () => {
    const records = [createTestRecord()]
    const result = aggregateInsuranceRecords(records)

    expect(result.signedPremiumYuan).toBe(1000)
    expect(result.maturedPremiumYuan).toBe(800)
    expect(result.policyCount).toBe(10)
  })

  it('应该正确聚合多条记录', () => {
    const records = [
      createTestRecord({ signedPremiumYuan: 1000, policyCount: 10 }),
      createTestRecord({ signedPremiumYuan: 2000, policyCount: 20 }),
    ]
    const result = aggregateInsuranceRecords(records)

    expect(result.signedPremiumYuan).toBe(3000)
    expect(result.policyCount).toBe(30)
  })

  it('应该处理空数组', () => {
    const result = aggregateInsuranceRecords([])

    expect(result.signedPremiumYuan).toBe(0)
    expect(result.policyCount).toBe(0)
  })
})

// ============= 综合计算测试 =============

describe('calculateKPIs', () => {
  it('应该正确计算所有KPI指标', () => {
    const records = [
      createTestRecord({
        signedPremiumYuan: 1000,
        maturedPremiumYuan: 800,
        policyCount: 10,
        claimCaseCount: 2,
        reportedClaimPaymentYuan: 400,
        expenseAmountYuan: 300,
        marginalContributionAmountYuan: 100,
      }),
    ]

    const result = calculateKPIs(records)

    // 率值指标
    expect(result.lossRatio).toBe(50) // 400/800 * 100
    expect(result.expenseRatio).toBe(30) // 300/1000 * 100
    expect(result.maturityRatio).toBe(80) // 800/1000 * 100
    expect(result.contributionMarginRatio).toBeCloseTo(12.5, 2) // 100/800 * 100
    expect(result.variableCostRatio).toBe(70) // (400+300)/1000 * 100
    expect(result.maturedClaimRatio).toBe(20) // 2/10 * 100

    // 绝对值指标
    expect(result.signedPremium).toBe(1000)
    expect(result.maturedPremium).toBe(800)
    expect(result.policyCount).toBe(10)

    // 均值指标
    expect(result.averagePremium).toBe(100) // 1000/10
    expect(result.averageClaim).toBe(200) // 400/2
  })

  it('应该正确计算带目标的KPI', () => {
    const records = [createTestRecord({ signedPremiumYuan: 800 })]
    const result = calculateKPIs(records, { premiumTarget: 1000 })

    expect(result.premiumProgress).toBe(80) // 800/1000 * 100
  })

  it('应该处理空记录数组', () => {
    const result = calculateKPIs([])

    expect(result.signedPremium).toBe(0)
    expect(result.policyCount).toBe(0)
    expect(result.lossRatio).toBeNull() // 除零
    expect(result.averagePremium).toBeNull() // 除零
  })
})
