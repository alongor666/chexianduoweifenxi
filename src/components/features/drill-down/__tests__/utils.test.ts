import { describe, it, expect } from 'vitest'
import { filterDrillDownData } from '../utils'
import type { InsuranceRecord, FilterState } from '@/types/insurance'
import type { DrillDownStep } from '@/types/drill-down'

// Mock 数据
const mockRecords: InsuranceRecord[] = [
  {
    policy_start_year: 2024,
    week_number: 1,
    third_level_organization: '机构A',
    business_type_category: '类型X',
    coverage_type: '险别1',
    terminal_source: '渠道1',
    is_new_energy_vehicle: true,
    renewal_status: '新保',
    is_transferred_vehicle: false,
    insurance_type: '商业险',
    vehicle_insurance_grade: 'A',
    customer_category_3: '个人',
    signed_premium_yuan: 1000,
    matured_premium_yuan: 500,
    reported_claim_payment_yuan: 100,
    claim_case_count: 1,
  } as InsuranceRecord,
  {
    policy_start_year: 2024,
    week_number: 2,
    third_level_organization: '机构B',
    business_type_category: '类型Y',
    coverage_type: '险别2',
    terminal_source: '渠道2',
    is_new_energy_vehicle: false,
    renewal_status: '续保',
    is_transferred_vehicle: true,
    insurance_type: '交强险',
    vehicle_insurance_grade: 'B',
    customer_category_3: '企业',
    signed_premium_yuan: 2000,
    matured_premium_yuan: 1000,
    reported_claim_payment_yuan: 200,
    claim_case_count: 2,
  } as InsuranceRecord,
]

// 默认空筛选器
const defaultFilters: FilterState = {
  years: [],
  weeks: [],
  organizations: [],
  insuranceTypes: [],
  businessTypes: [],
  coverageTypes: [],
  customerCategories: [],
  vehicleGrades: [],
  renewalStatuses: [],
  isNewEnergy: null,
  terminalSources: [],
  trendModeWeeks: [],
  singleModeWeek: null,
  dataViewType: 'current',
  viewMode: 'trend',
}

describe('filterDrillDownData', () => {
  it('应该在没有 initialData 时应用全局筛选器', () => {
    const filters: FilterState = {
      ...defaultFilters,
      organizations: ['机构A'],
    }

    const result = filterDrillDownData({
      rawData: mockRecords,
      initialData: undefined,
      filters,
      drillDownSteps: [],
    })

    expect(result).toHaveLength(1)
    expect(result[0].third_level_organization).toBe('机构A')
  })

  it('应该在有 initialData 时忽略全局筛选器', () => {
    // 全局筛选器设为“机构B”，但 initialData 包含所有数据
    // 如果忽略全局筛选器，应该返回所有数据
    const filters: FilterState = {
      ...defaultFilters,
      organizations: ['机构B'],
    }

    // 假设 initialData 是所有数据（模拟父组件已经根据上下文传入了数据）
    const initialData = mockRecords

    const result = filterDrillDownData({
      rawData: mockRecords, // 这个应该被忽略
      initialData,
      filters, // 这个应该被忽略
      drillDownSteps: [],
    })

    expect(result).toHaveLength(2)
  })

  it('应该始终应用下钻筛选器（无论有无 initialData）', () => {
    // 场景 1：无 initialData
    const steps: DrillDownStep[] = [
      {
        dimensionKey: 'is_new_energy_vehicle',
        dimensionLabel: '新能源',
        value: true,
        displayLabel: '是',
      },
    ]

    const result1 = filterDrillDownData({
      rawData: mockRecords,
      initialData: undefined,
      filters: defaultFilters,
      drillDownSteps: steps,
    })

    expect(result1).toHaveLength(1)
    expect(result1[0].is_new_energy_vehicle).toBe(true)

    // 场景 2：有 initialData
    const result2 = filterDrillDownData({
      rawData: [], // 应该忽略
      initialData: mockRecords,
      filters: defaultFilters,
      drillDownSteps: steps,
    })

    expect(result2).toHaveLength(1)
    expect(result2[0].is_new_energy_vehicle).toBe(true)
  })

  it('应该支持多级下钻', () => {
    const steps: DrillDownStep[] = [
      {
        dimensionKey: 'third_level_organization',
        dimensionLabel: '机构',
        value: '机构A',
        displayLabel: '机构A',
      },
      {
        dimensionKey: 'coverage_type',
        dimensionLabel: '险别',
        value: '险别1',
        displayLabel: '险别1',
      },
    ]

    const result = filterDrillDownData({
      rawData: mockRecords,
      initialData: undefined,
      filters: defaultFilters,
      drillDownSteps: steps,
    })

    expect(result).toHaveLength(1)
    expect(result[0].third_level_organization).toBe('机构A')
    expect(result[0].coverage_type).toBe('险别1')
  })

  it('应该支持单周模式筛选 (viewMode="single")', () => {
    const filters: FilterState = {
      ...defaultFilters,
      viewMode: 'single',
      singleModeWeek: 2,
    }

    const result = filterDrillDownData({
      rawData: mockRecords,
      initialData: undefined,
      filters,
      drillDownSteps: [],
    })

    expect(result).toHaveLength(1)
    expect(result[0].week_number).toBe(2)
  })
})
