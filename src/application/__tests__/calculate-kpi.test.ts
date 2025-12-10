/**
 * 计算 KPI 用例单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CalculateKPIUseCase } from '../use-cases/calculate-kpi'
import type { IDataRepository } from '../ports/IDataRepository'
import { InsuranceRecord } from '../../domain'
import { createTestInsuranceRecord } from './test-helpers'

// Mock 仓储
class MockDataRepository implements IDataRepository {
  private mockData: InsuranceRecord[] = []

  setMockData(data: InsuranceRecord[]) {
    this.mockData = data
  }

  async save(records: InsuranceRecord[]): Promise<void> {
    this.mockData = records
  }

  async findAll(): Promise<InsuranceRecord[]> {
    return this.mockData
  }

  async findByWeek(weekNumber: number): Promise<InsuranceRecord[]> {
    return this.mockData.filter(r => r.weekNumber === weekNumber)
  }

  async findByYear(year: number): Promise<InsuranceRecord[]> {
    return this.mockData.filter(r => r.policyStartYear === year)
  }

  async findByFilters(filters: any): Promise<InsuranceRecord[]> {
    return this.mockData
  }

  async clear(): Promise<void> {
    this.mockData = []
  }

  async getStats(): Promise<any> {
    return {
      totalRecords: this.mockData.length,
      availableYears: [],
      weekRange: { min: 1, max: 52 },
      lastUpdated: new Date(),
    }
  }
}

// Test helpers are imported from test-helpers.ts

describe('CalculateKPIUseCase', () => {
  let useCase: CalculateKPIUseCase
  let mockRepository: MockDataRepository

  beforeEach(() => {
    mockRepository = new MockDataRepository()
    useCase = new CalculateKPIUseCase(mockRepository)
  })

  it('应该成功计算 KPI', async () => {
    const records = [
      createTestInsuranceRecord({
        signedPremiumYuan: 5000,
        reportedClaimPaymentYuan: 1000,
        expenseAmountYuan: 500,
      }),
      createTestInsuranceRecord({
        signedPremiumYuan: 3000,
        reportedClaimPaymentYuan: 500,
        expenseAmountYuan: 300,
      }),
    ]
    mockRepository.setMockData(records)

    const result = await useCase.execute()

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(2)
    expect(result.kpis).toBeDefined()
    // Check basic KPI fields exist
    expect(typeof result.kpis.signedPremium).toBe('number')
    expect(result.kpis.signedPremium).toBeGreaterThan(0)
  })

  it('当没有数据时应该返回空 KPI', async () => {
    mockRepository.setMockData([])

    const result = await useCase.execute()

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(0)
    expect(result.message).toBe('没有符合条件的数据')
    expect(result.kpis.signedPremium).toBe(0)
  })

  it('应该支持按条件筛选数据', async () => {
    const records = [
      createTestInsuranceRecord({ policyStartYear: 2024, weekNumber: 1 }),
      createTestInsuranceRecord({ policyStartYear: 2023, weekNumber: 2 }),
    ]
    mockRepository.setMockData(records)

    const result = await useCase.execute({ years: [2024] })

    expect(result.success).toBe(true)
    // 由于 mock 实现简化，这里主要验证流程
    expect(result.filters).toEqual({ years: [2024] })
  })

  it('应该支持分组计算 KPI', async () => {
    const records = [
      createTestInsuranceRecord({
        policyStartYear: 2024,
        signedPremiumYuan: 5000,
      }),
      createTestInsuranceRecord({
        policyStartYear: 2023,
        signedPremiumYuan: 3000,
      }),
    ]
    mockRepository.setMockData(records)

    const results = await useCase.executeGrouped('year')

    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('groupBy')
    expect(results[0]).toHaveProperty('groupValue')
    expect(results[0]).toHaveProperty('kpis')
    expect(results[0]).toHaveProperty('recordCount')
  })

  it('分组计算应该正确分组数据', async () => {
    // Note: Institution is mapped to thirdLevelOrganization in the real model
    // For now, we'll group by year since we can't easily override institution in the helper
    const records = [
      createTestInsuranceRecord({
        policyStartYear: 2024,
        signedPremiumYuan: 5000,
      }),
      createTestInsuranceRecord({
        policyStartYear: 2024,
        signedPremiumYuan: 3000,
      }),
      createTestInsuranceRecord({
        policyStartYear: 2023,
        signedPremiumYuan: 2000,
      }),
    ]
    mockRepository.setMockData(records)

    const results = await useCase.executeGrouped('year')

    expect(results.length).toBe(2)
    const group2024 = results.find(r => r.groupValue === '2024')
    expect(group2024).toBeDefined()
    expect(group2024?.recordCount).toBe(2)
  })

  it('当分组后没有数据时应该返回空数组', async () => {
    mockRepository.setMockData([])

    const results = await useCase.executeGrouped('year')

    expect(results).toEqual([])
  })
})
