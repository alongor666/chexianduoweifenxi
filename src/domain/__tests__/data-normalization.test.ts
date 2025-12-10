/**
 * Domain 层测试 - 数据规范化规则
 *
 * 测试策略：
 * - 测试各种异常输入（null、undefined、空字符串）
 * - 测试中文文本的各种边界情况
 * - 测试数据类型转换的正确性
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeChineseText,
  normalizeNumber,
  normalizeBoolean,
  normalizeDateString,
  validateWeekNumber,
  validateYear,
  normalizeInsuranceRecord,
  normalizeInsuranceRecordsBatch,
} from '../rules/data-normalization'
import type { RawInsuranceData } from '../entities/InsuranceRecord'

// ============= 文本规范化测试 =============

describe('normalizeChineseText', () => {
  it('应该移除零宽字符', () => {
    const text = '成都\u200B'
    const result = normalizeChineseText(text)
    expect(result).toBe('成都')
  })

  it('应该移除首尾空格', () => {
    const text = '  武侯  '
    const result = normalizeChineseText(text)
    expect(result).toBe('武侯')
  })

  it('应该将全角空格替换为半角空格', () => {
    const text = '武侯　区'
    const result = normalizeChineseText(text)
    expect(result).toBe('武侯 区')
  })

  it('应该将多个连续空格替换为单个空格', () => {
    const text = '成都   武侯'
    const result = normalizeChineseText(text)
    expect(result).toBe('成都 武侯')
  })

  it('应该处理空字符串', () => {
    expect(normalizeChineseText('')).toBe('')
  })

  it('应该处理null和undefined', () => {
    expect(normalizeChineseText(null as any)).toBe('')
    expect(normalizeChineseText(undefined as any)).toBe('')
  })

  it('应该处理复杂的混合情况', () => {
    const text = '  成都\u200B　武侯   区  '
    const result = normalizeChineseText(text)
    expect(result).toBe('成都 武侯 区')
  })
})

// ============= 数字规范化测试 =============

describe('normalizeNumber', () => {
  it('应该保持有效数字不变', () => {
    expect(normalizeNumber(123.45)).toBe(123.45)
    expect(normalizeNumber(0)).toBe(0)
    expect(normalizeNumber(-100)).toBe(-100)
  })

  it('应该将字符串转换为数字', () => {
    expect(normalizeNumber('123.45')).toBe(123.45)
    expect(normalizeNumber('  100  ')).toBe(100)
  })

  it('应该处理无效输入', () => {
    expect(normalizeNumber('abc', 0)).toBe(0)
    expect(normalizeNumber(null, 0)).toBe(0)
    expect(normalizeNumber(undefined, 0)).toBe(0)
    expect(normalizeNumber('', 0)).toBe(0)
  })

  it('应该使用自定义默认值', () => {
    expect(normalizeNumber('abc', 99)).toBe(99)
    expect(normalizeNumber(null, -1)).toBe(-1)
  })

  it('应该处理特殊数值', () => {
    expect(normalizeNumber(Infinity, 0)).toBe(0)
    expect(normalizeNumber(NaN, 0)).toBe(0)
  })
})

// ============= 布尔规范化测试 =============

describe('normalizeBoolean', () => {
  it('应该保持布尔值不变', () => {
    expect(normalizeBoolean(true)).toBe(true)
    expect(normalizeBoolean(false)).toBe(false)
  })

  it('应该将数字转换为布尔值', () => {
    expect(normalizeBoolean(1)).toBe(true)
    expect(normalizeBoolean(0)).toBe(false)
    expect(normalizeBoolean(100)).toBe(true)
    expect(normalizeBoolean(-1)).toBe(true)
  })

  it('应该将字符串转换为布尔值', () => {
    expect(normalizeBoolean('true')).toBe(true)
    expect(normalizeBoolean('TRUE')).toBe(true)
    expect(normalizeBoolean('是')).toBe(true)
    expect(normalizeBoolean('yes')).toBe(true)
    expect(normalizeBoolean('1')).toBe(true)

    expect(normalizeBoolean('false')).toBe(false)
    expect(normalizeBoolean('FALSE')).toBe(false)
    expect(normalizeBoolean('否')).toBe(false)
    expect(normalizeBoolean('no')).toBe(false)
    expect(normalizeBoolean('0')).toBe(false)
  })

  it('应该处理无效输入', () => {
    expect(normalizeBoolean('abc', false)).toBe(false)
    expect(normalizeBoolean(null, false)).toBe(false)
    expect(normalizeBoolean(undefined, true)).toBe(true)
  })
})

// ============= 日期规范化测试 =============

describe('normalizeDateString', () => {
  it('应该保持标准格式不变', () => {
    const date = '2025-01-14'
    expect(normalizeDateString(date)).toBe('2025-01-14')
  })

  it('应该转换斜杠格式', () => {
    expect(normalizeDateString('2025/01/14')).toBe('2025-01-14')
  })

  it('应该转换点号格式', () => {
    expect(normalizeDateString('2025.01.14')).toBe('2025-01-14')
  })

  it('应该处理无效输入', () => {
    expect(normalizeDateString('abc', '')).toBe('')
    expect(normalizeDateString(null as any, '')).toBe('')
    expect(normalizeDateString(123 as any, '')).toBe('')
  })
})

// ============= 验证函数测试 =============

describe('validateWeekNumber', () => {
  it('应该接受有效的周序号', () => {
    expect(validateWeekNumber(1)).toBe(1)
    expect(validateWeekNumber(52)).toBe(52)
    expect(validateWeekNumber(105)).toBe(105)
  })

  it('应该拒绝无效的周序号', () => {
    expect(() => validateWeekNumber(0)).toThrow()
    expect(() => validateWeekNumber(106)).toThrow()
    expect(() => validateWeekNumber(-1)).toThrow()
  })
})

describe('validateYear', () => {
  it('应该接受有效的年份', () => {
    expect(validateYear(2025)).toBe(2025)
    expect(validateYear(2000)).toBe(2000)
    expect(validateYear(2100)).toBe(2100)
  })

  it('应该拒绝无效的年份', () => {
    expect(() => validateYear(1999)).toThrow()
    expect(() => validateYear(2101)).toThrow()
  })
})

// ============= 保险记录规范化测试 =============

describe('normalizeInsuranceRecord', () => {
  const createValidRawData = (): RawInsuranceData => ({
    snapshot_date: '2025-01-14',
    policy_start_year: 2025,
    week_number: 45,
    chengdu_branch: '成都',
    third_level_organization: '武侯',
    customer_category_3: '个人客户',
    insurance_type: '商业险',
    business_type_category: '私家车',
    coverage_type: '主全',
    renewal_status: '新保',
    is_new_energy_vehicle: false,
    is_transferred_vehicle: false,
    terminal_source: '电销',
    signed_premium_yuan: 1000,
    matured_premium_yuan: 800,
    policy_count: 10,
    claim_case_count: 2,
    reported_claim_payment_yuan: 400,
    expense_amount_yuan: 300,
    commercial_premium_before_discount_yuan: 1200,
    marginal_contribution_amount_yuan: 100,
  })

  it('应该正确规范化有效数据', () => {
    const raw = createValidRawData()
    const record = normalizeInsuranceRecord(raw)

    expect(record.policyStartYear).toBe(2025)
    expect(record.weekNumber).toBe(45)
    expect(record.thirdLevelOrganization).toBe('武侯')
    expect(record.signedPremiumYuan).toBe(1000)
  })

  it('应该清理中文文本字段', () => {
    const raw = createValidRawData()
    raw.third_level_organization = '  武侯\u200B  '
    raw.customer_category_3 = '个人　客户'
    raw.terminal_source = '  电销  '

    const record = normalizeInsuranceRecord(raw)

    expect(record.thirdLevelOrganization).toBe('武侯')
    expect(record.customerCategory).toBe('个人 客户')
    expect(record.terminalSource).toBe('电销')
  })

  it('应该转换布尔值', () => {
    const raw = createValidRawData()
    raw.is_new_energy_vehicle = 'true' as any
    raw.is_transferred_vehicle = 1 as any

    const record = normalizeInsuranceRecord(raw)

    expect(record.isNewEnergyVehicle).toBe(true)
    expect(record.isTransferredVehicle).toBe(true)
  })

  it('应该处理可选字段', () => {
    const raw = createValidRawData()
    raw.vehicle_insurance_grade = 'A'
    raw.premium_plan_yuan = 1500

    const record = normalizeInsuranceRecord(raw)

    expect(record.vehicleInsuranceGrade).toBe('A')
    expect(record.premiumPlanYuan).toBe(1500)
  })

  it('应该拒绝无效的周序号', () => {
    const raw = createValidRawData()
    raw.week_number = 0

    expect(() => normalizeInsuranceRecord(raw)).toThrow(
      '周序号必须在 1-105 之间'
    )
  })

  it('应该拒绝无效的年份', () => {
    const raw = createValidRawData()
    raw.policy_start_year = 1999

    expect(() => normalizeInsuranceRecord(raw)).toThrow(
      '年份必须在 2000-2100 之间'
    )
  })
})

// ============= 批量规范化测试 =============

describe('normalizeInsuranceRecordsBatch', () => {
  const createValidRawData = (weekNumber: number): RawInsuranceData => ({
    snapshot_date: '2025-01-14',
    policy_start_year: 2025,
    week_number: weekNumber,
    chengdu_branch: '成都',
    third_level_organization: '武侯',
    customer_category_3: '个人客户',
    insurance_type: '商业险',
    business_type_category: '私家车',
    coverage_type: '主全',
    renewal_status: '新保',
    is_new_energy_vehicle: false,
    is_transferred_vehicle: false,
    terminal_source: '电销',
    signed_premium_yuan: 1000,
    matured_premium_yuan: 800,
    policy_count: 10,
    claim_case_count: 2,
    reported_claim_payment_yuan: 400,
    expense_amount_yuan: 300,
    commercial_premium_before_discount_yuan: 1200,
    marginal_contribution_amount_yuan: 100,
  })

  it('应该成功处理所有有效记录', () => {
    const rawRecords = [
      createValidRawData(45),
      createValidRawData(46),
      createValidRawData(47),
    ]

    const result = normalizeInsuranceRecordsBatch(rawRecords)

    expect(result.success).toHaveLength(3)
    expect(result.failed).toHaveLength(0)
  })

  it('应该分离有效和无效记录', () => {
    const rawRecords = [
      createValidRawData(45), // 有效
      createValidRawData(0), // 无效：周序号为0
      createValidRawData(46), // 有效
    ]

    const result = normalizeInsuranceRecordsBatch(rawRecords)

    expect(result.success).toHaveLength(2)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].index).toBe(1)
    expect(result.failed[0].error.message).toContain('周序号必须在 1-105 之间')
  })

  it('应该处理空数组', () => {
    const result = normalizeInsuranceRecordsBatch([])

    expect(result.success).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })
})
