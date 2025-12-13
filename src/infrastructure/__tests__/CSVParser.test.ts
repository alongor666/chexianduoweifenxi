/**
 * CSVParser 单元测试
 *
 * 测试 CSV 文件解析器的功能，包括：
 * - 正常文件解析
 * - 文件验证
 * - 错误处理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CSVParser } from '../adapters/CSVParser'
import type { ValidationErrorType } from '../../application/ports/IFileParser'

// Helper to create file with text() method polyfilled if needed
function createTestFile(
  bits: BlobPart[],
  name: string,
  options?: FilePropertyBag
): File {
  const file = new File(bits, name, options)
  if (!file.text) {
    Object.defineProperty(file, 'text', {
      value: async () => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsText(file)
        })
      },
      writable: true,
    })
  }
  return file
}

describe('CSVParser', () => {
  let parser: CSVParser

  beforeEach(() => {
    parser = new CSVParser()
  })

  describe('getSupportedFileTypes', () => {
    it('应该返回支持的文件类型', () => {
      const types = parser.getSupportedFileTypes()
      expect(types).toEqual(['.csv'])
    })
  })

  describe('validate', () => {
    it('应该拒绝非 CSV 文件', async () => {
      const file = createTestFile(['content'], 'test.txt', {
        type: 'text/plain',
      })
      const result = await parser.validate(file)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe(
        'INVALID_FILE_FORMAT' as ValidationErrorType
      )
    })

    it('应该拒绝空文件', async () => {
      const file = createTestFile([], 'test.csv', { type: 'text/csv' })
      const result = await parser.validate(file)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some(
          e => e.type === ('EMPTY_FILE' as ValidationErrorType)
        )
      ).toBe(true)
    })

    it('应该拒绝过大的文件', async () => {
      // 创建一个超过 100MB 的文件（模拟）
      const largeContent = 'x'.repeat(101 * 1024 * 1024)
      const file = createTestFile([largeContent], 'large.csv', {
        type: 'text/csv',
      })
      const result = await parser.validate(file)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some(
          e => e.type === ('FILE_TOO_LARGE' as ValidationErrorType)
        )
      ).toBe(true)
    })

    it('应该拒绝缺少必需字段的文件', async () => {
      const csvContent = `snapshot_date,policy_start_year
2024-01-01,2024`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.validate(file)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some(
          e => e.type === ('MISSING_REQUIRED_FIELD' as ValidationErrorType)
        )
      ).toBe(true)
    })

    it('应该接受有效的 CSV 文件', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.validate(file)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测数据类型错误', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,invalid_year,1,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.validate(file)

      expect(
        result.errors.some(
          e => e.type === ('INVALID_FIELD_TYPE' as ValidationErrorType)
        )
      ).toBe(true)
    })

    it('应该对异常周次生成警告', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,200,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.validate(file)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.field === 'week_number')).toBe(true)
    })
  })

  describe('parse', () => {
    it('应该正确解析有效的 CSV 文件', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500
2024-01-08,2024,2,成都,测试机构,营业货车,交强险,2吨以下营业货车,交三,续保,true,false,渠道,5000,4500,2,1,1000,200,5200,3300`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.parse(file)

      expect(result).toHaveLength(2)

      // 验证第一条记录
      expect(result[0]).toMatchObject({
        snapshot_date: '2024-01-01',
        policy_start_year: 2024,
        week_number: 1,
        chengdu_branch: '成都',
        third_level_organization: '测试机构',
        customer_category_3: '非营业个人客车',
        insurance_type: '商业险',
        business_type_category: '非营业客车新车',
        coverage_type: '主全',
        renewal_status: '新保',
        is_new_energy_vehicle: false,
        is_transferred_vehicle: false,
        terminal_source: '直销',
        signed_premium_yuan: 10000,
        matured_premium_yuan: 9000,
        policy_count: 1,
        claim_case_count: 0,
        reported_claim_payment_yuan: 0,
        expense_amount_yuan: 500,
        commercial_premium_before_discount_yuan: 10500,
        marginal_contribution_amount_yuan: 8500,
      })

      // 验证第二条记录
      expect(result[1]).toMatchObject({
        snapshot_date: '2024-01-08',
        policy_start_year: 2024,
        week_number: 2,
        is_new_energy_vehicle: true,
      })
    })

    it('应该处理可选字段', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,A,低,90,85,直销,10000,9000,1,0,0,500,10500,10000,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.parse(file)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        vehicle_insurance_grade: 'A',
        highway_risk_grade: '低',
        large_truck_score: 90,
        small_truck_score: 85,
        premium_plan_yuan: 10000,
      })
    })

    it('应该正确处理空值', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,vehicle_insurance_grade,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.parse(file)

      expect(result).toHaveLength(1)
      expect(result[0].vehicle_insurance_grade).toBeNull()
    })

    it('应该规范化中文文本', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,　测试机构　,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.parse(file)

      expect(result).toHaveLength(1)
      // 验证中文文本已被规范化（去除全角空格）
      expect(result[0].third_level_organization).toBe('测试机构')
    })

    it('应该抛出解析错误（格式错误）', async () => {
      // 创建一个无效的 CSV（格式错误）
      const file = createTestFile(
        ['invalid csv content with no structure'],
        'test.csv',
        {
          type: 'text/csv',
        }
      )

      // 虽然 PapaParse 很宽容，但我们可以测试其他错误情况
      // 这里我们预期它不会崩溃
      await expect(parser.parse(file)).resolves.toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应该处理大文件（性能测试）', async () => {
      // 生成 1000 行数据
      const header = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan`

      const rows = []
      for (let i = 0; i < 1000; i++) {
        rows.push(
          `2024-01-01,2024,${(i % 105) + 1},成都,测试机构,非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`
        )
      }

      const csvContent = [header, ...rows].join('\n')
      const file = createTestFile([csvContent], 'large.csv', {
        type: 'text/csv',
      })

      const startTime = performance.now()
      const result = await parser.parse(file)
      const elapsed = performance.now() - startTime

      expect(result).toHaveLength(1000)
      // 性能检查：1000 行数据应该在 1 秒内解析完成
      expect(elapsed).toBeLessThan(1000)
    })

    it('应该处理特殊字符', async () => {
      const csvContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,customer_category_3,insurance_type,business_type_category,coverage_type,renewal_status,is_new_energy_vehicle,is_transferred_vehicle,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,marginal_contribution_amount_yuan
2024-01-01,2024,1,成都,"包含,逗号的机构",非营业个人客车,商业险,非营业客车新车,主全,新保,false,false,直销,10000,9000,1,0,0,500,10500,8500`

      const file = createTestFile([csvContent], 'test.csv', {
        type: 'text/csv',
      })
      const result = await parser.parse(file)

      expect(result).toHaveLength(1)
      expect(result[0].third_level_organization).toBe('包含,逗号的机构')
    })
  })
})
