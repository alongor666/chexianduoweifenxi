/**
 * 数据服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataService } from '../services/data-service'
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
    return this.mockData.filter((r) => r.weekNumber === weekNumber)
  }

  async findByYear(year: number): Promise<InsuranceRecord[]> {
    return this.mockData.filter((r) => r.policyStartYear === year)
  }

  async findByFilters(filters: any): Promise<InsuranceRecord[]> {
    return this.mockData
  }

  async clear(): Promise<void> {
    this.mockData = []
  }

  async getStats(): Promise<any> {
    const years = [...new Set(this.mockData.map((r) => r.policyStartYear))]
    const weeks = this.mockData.map((r) => r.weekNumber)
    return {
      totalRecords: this.mockData.length,
      availableYears: years,
      weekRange: {
        min: weeks.length > 0 ? Math.min(...weeks) : 0,
        max: weeks.length > 0 ? Math.max(...weeks) : 0,
      },
      lastUpdated: new Date(),
    }
  }
}

// Test helpers are imported from test-helpers.ts

describe('DataService', () => {
  let service: DataService
  let mockRepository: MockDataRepository

  beforeEach(() => {
    mockRepository = new MockDataRepository()
    service = new DataService(mockRepository)
  })

  describe('getAllData', () => {
    it('应该返回所有数据', async () => {
      const records = [
        createTestInsuranceRecord(),
        createTestInsuranceRecord({ weekNumber: 2 }),
      ]
      mockRepository.setMockData(records)

      const result = await service.getAllData()

      expect(result).toEqual(records)
      expect(result.length).toBe(2)
    })

    it('当没有数据时应该返回空数组', async () => {
      const result = await service.getAllData()

      expect(result).toEqual([])
    })
  })

  describe('getFilteredData', () => {
    it('应该根据筛选条件获取数据', async () => {
      const records = [createTestInsuranceRecord()]
      mockRepository.setMockData(records)

      const result = await service.getFilteredData({ years: [2024] })

      expect(result).toBeDefined()
    })
  })

  describe('getDataByWeek', () => {
    it('应该根据周次获取数据', async () => {
      const records = [
        createTestInsuranceRecord({ weekNumber: 1 }),
        createTestInsuranceRecord({ weekNumber: 2 }),
      ]
      mockRepository.setMockData(records)

      const result = await service.getDataByWeek(1)

      expect(result.length).toBe(1)
      expect(result[0].weekNumber).toBe(1)
    })
  })

  describe('getDataByYear', () => {
    it('应该根据年份获取数据', async () => {
      const records = [
        createTestInsuranceRecord({ policyStartYear: 2024 }),
        createTestInsuranceRecord({ policyStartYear: 2023 }),
      ]
      mockRepository.setMockData(records)

      const result = await service.getDataByYear(2024)

      expect(result.length).toBe(1)
      expect(result[0].policyStartYear).toBe(2024)
    })
  })

  describe('getStats', () => {
    it('应该返回数据统计信息', async () => {
      const records = [
        createTestInsuranceRecord({ policyStartYear: 2024, weekNumber: 1 }),
        createTestInsuranceRecord({ policyStartYear: 2023, weekNumber: 52 }),
      ]
      mockRepository.setMockData(records)

      const stats = await service.getStats()

      expect(stats.totalRecords).toBe(2)
      expect(stats.availableYears).toContain(2024)
      expect(stats.availableYears).toContain(2023)
      expect(stats.weekRange.min).toBe(1)
      expect(stats.weekRange.max).toBe(52)
    })
  })

  describe('clearAllData', () => {
    it('应该清空所有数据', async () => {
      mockRepository.setMockData([createTestInsuranceRecord()])
      const clearSpy = vi.spyOn(mockRepository, 'clear')

      await service.clearAllData()

      expect(clearSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('hasData', () => {
    it('当有数据时应该返回 true', async () => {
      mockRepository.setMockData([createTestInsuranceRecord()])

      const result = await service.hasData()

      expect(result).toBe(true)
    })

    it('当没有数据时应该返回 false', async () => {
      const result = await service.hasData()

      expect(result).toBe(false)
    })
  })

  describe('getAvailableYears', () => {
    it('应该返回可用的年份列表', async () => {
      const records = [
        createTestInsuranceRecord({ policyStartYear: 2024 }),
        createTestInsuranceRecord({ policyStartYear: 2023 }),
      ]
      mockRepository.setMockData(records)

      const years = await service.getAvailableYears()

      expect(years).toContain(2024)
      expect(years).toContain(2023)
    })
  })

  describe('getWeekRange', () => {
    it('应该返回周次范围', async () => {
      const records = [
        createTestInsuranceRecord({ weekNumber: 1 }),
        createTestInsuranceRecord({ weekNumber: 52 }),
      ]
      mockRepository.setMockData(records)

      const range = await service.getWeekRange()

      expect(range.min).toBe(1)
      expect(range.max).toBe(52)
    })
  })
})
