/**
 * DataService 单元测试
 * 演示服务层的测试策略
 *
 * @architecture 测试纯函数，无需Mock
 */

import { describe, test, expect } from 'vitest'
import { DataService } from '../DataService'
import type { InsuranceRecord, FilterState } from '@/types/insurance'

// 测试数据工厂
function createMockRecord(
  overrides?: Partial<InsuranceRecord>
): InsuranceRecord {
  return {
    snapshot_date: '2025-03-15',
    week_number: 11,
    policy_start_year: 2025,
    third_level_organization: '测试机构',
    customer_category_3: '非营业个人客车',
    insurance_type: '车险',
    business_type_category: '非营业客车新车',
    coverage_type: '全险',
    vehicle_insurance_grade: 'A',
    terminal_source: '直销',
    is_new_energy_vehicle: false,
    renewal_status: '续保',
    signed_premium_yuan: 5000,
    policy_count: 1,
    ...overrides,
  } as InsuranceRecord
}

describe('DataService', () => {
  describe('filter', () => {
    test('应正确筛选年份', () => {
      const mockData = [
        createMockRecord({ policy_start_year: 2024 }),
        createMockRecord({ policy_start_year: 2025 }),
        createMockRecord({ policy_start_year: 2025 }),
      ]

      const filters: FilterState = {
        years: [2025],
      } as FilterState

      const result = DataService.filter(mockData, filters)

      expect(result).toHaveLength(2)
      expect(result.every(r => r.policy_start_year === 2025)).toBe(true)
    })

    test('应正确筛选周次', () => {
      const mockData = [
        createMockRecord({ week_number: 10 }),
        createMockRecord({ week_number: 11 }),
        createMockRecord({ week_number: 12 }),
      ]

      const filters: FilterState = {
        weeks: [11, 12],
      } as FilterState

      const result = DataService.filter(mockData, filters)

      expect(result).toHaveLength(2)
      expect(result.some(r => r.week_number === 10)).toBe(false)
    })

    test('应正确筛选多个条件（AND逻辑）', () => {
      const mockData = [
        createMockRecord({
          policy_start_year: 2025,
          week_number: 11,
          insurance_type: '车险',
        }),
        createMockRecord({
          policy_start_year: 2025,
          week_number: 11,
          insurance_type: '寿险',
        }),
        createMockRecord({
          policy_start_year: 2025,
          week_number: 12,
          insurance_type: '车险',
        }),
      ]

      const filters: FilterState = {
        years: [2025],
        weeks: [11],
        insuranceTypes: ['车险'],
      } as FilterState

      const result = DataService.filter(mockData, filters)

      expect(result).toHaveLength(1)
      expect(result[0].insurance_type).toBe('车险')
      expect(result[0].week_number).toBe(11)
    })

    test('应支持排除特定筛选键', () => {
      const mockData = [
        createMockRecord({ policy_start_year: 2024, insurance_type: '车险' }),
        createMockRecord({ policy_start_year: 2025, insurance_type: '寿险' }),
      ]

      const filters: FilterState = {
        years: [2025],
        insuranceTypes: ['车险'],
      } as FilterState

      // 排除年份筛选，只应用险种筛选
      const result = DataService.filter(mockData, filters, ['years'])

      expect(result).toHaveLength(1)
      expect(result[0].insurance_type).toBe('车险')
      expect(result[0].policy_start_year).toBe(2024) // 年份筛选被排除
    })
  })

  describe('deduplicate', () => {
    test('应正确去除重复记录', () => {
      const record1 = createMockRecord({
        snapshot_date: '2025-03-15',
        week_number: 11,
        policy_start_year: 2025,
        third_level_organization: '机构A',
        customer_category_3: '非营业个人客车',
        insurance_type: '车险',
        business_type_category: '非营业客车新车',
      })

      // 完全相同的记录
      const record2 = { ...record1 }

      // 不同的记录（组织不同）
      const record3 = createMockRecord({
        ...record1,
        third_level_organization: '机构B',
      })

      const mockData = [record1, record2, record3]
      const result = DataService.deduplicate(mockData)

      expect(result).toHaveLength(2)
    })
  })

  describe('merge', () => {
    test('应合并多个数据集并去重', () => {
      const dataset1 = [
        createMockRecord({ week_number: 10 }),
        createMockRecord({ week_number: 11 }),
      ]

      const dataset2 = [
        createMockRecord({ week_number: 11 }), // 重复
        createMockRecord({ week_number: 12 }),
      ]

      const result = DataService.merge(dataset1, dataset2)

      expect(result).toHaveLength(3) // 10, 11, 12 (11去重)
    })
  })

  describe('groupBy', () => {
    test('应正确按维度分组', () => {
      const mockData = [
        createMockRecord({ insurance_type: '车险', signed_premium_yuan: 5000 }),
        createMockRecord({ insurance_type: '车险', signed_premium_yuan: 3000 }),
        createMockRecord({
          insurance_type: '寿险',
          signed_premium_yuan: 10000,
        }),
      ]

      const result = DataService.groupBy(mockData, 'insurance_type')

      expect(result.size).toBe(2)
      expect(result.get('车险')).toHaveLength(2)
      expect(result.get('寿险')).toHaveLength(1)
    })
  })

  describe('getStatistics', () => {
    test('应正确计算统计信息', () => {
      const mockData = [
        createMockRecord({
          signed_premium_yuan: 5000,
          policy_count: 1,
          week_number: 10,
        }),
        createMockRecord({
          signed_premium_yuan: 3000,
          policy_count: 2,
          week_number: 11,
        }),
        createMockRecord({
          signed_premium_yuan: 2000,
          policy_count: 1,
          week_number: 10,
        }),
      ]

      const result = DataService.getStatistics(mockData)

      expect(result.totalRecords).toBe(3)
      expect(result.totalPremium).toBe(10000)
      expect(result.totalPolicyCount).toBe(4)
      expect(result.uniqueWeeks).toEqual([10, 11])
    })

    test('应正确处理空数据', () => {
      const result = DataService.getStatistics([])

      expect(result.totalRecords).toBe(0)
      expect(result.totalPremium).toBe(0)
      expect(result.uniqueWeeks).toEqual([])
      expect(result.dateRange).toBeNull()
    })
  })

  describe('normalize', () => {
    test('应规范化中文文本', () => {
      const mockData = [
        createMockRecord({
          customer_category_3: '非营业个人客车 ', // 有空格
          business_type_category: ' 非营业客车新车', // 有空格
        }),
      ]

      const result = DataService.normalize(mockData)

      expect(result[0].customer_category_3).toBe('非营业个人客车')
      expect(result[0].business_type_category).toBe('非营业客车新车')
    })
  })

  describe('getByWeek', () => {
    test('应获取指定周次的数据', () => {
      const mockData = [
        createMockRecord({ week_number: 10 }),
        createMockRecord({ week_number: 11 }),
        createMockRecord({ week_number: 12 }),
      ]

      const result = DataService.getByWeek(mockData, 11)

      expect(result).toHaveLength(1)
      expect(result[0].week_number).toBe(11)
    })

    test('应支持额外的筛选条件', () => {
      const mockData = [
        createMockRecord({ week_number: 11, insurance_type: '车险' }),
        createMockRecord({ week_number: 11, insurance_type: '寿险' }),
      ]

      const result = DataService.getByWeek(mockData, 11, {
        insuranceTypes: ['车险'],
      })

      expect(result).toHaveLength(1)
      expect(result[0].insurance_type).toBe('车险')
    })
  })

  describe('getByWeekRange', () => {
    test('应获取周次范围的数据', () => {
      const mockData = [
        createMockRecord({ week_number: 9 }),
        createMockRecord({ week_number: 10 }),
        createMockRecord({ week_number: 11 }),
        createMockRecord({ week_number: 12 }),
        createMockRecord({ week_number: 13 }),
      ]

      const result = DataService.getByWeekRange(mockData, [10, 12])

      expect(result).toHaveLength(3)
      expect(
        result.every(r => r.week_number >= 10 && r.week_number <= 12)
      ).toBe(true)
    })
  })
})
