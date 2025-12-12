/**
 * Domain 层测试 - CSV 解析服务
 *
 * 测试CSV解析的各种场景和边界条件
 */

import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  parseCSVBatch,
  convertToInsuranceRecords,
  REQUIRED_FIELDS,
  type CSVParseResult,
  type CSVParseConfig,
} from '../services/csv-parser-service'

describe('CSV 解析服务', () => {
  const validCSVContent = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,business_type_category,customer_category_3,insurance_type,coverage_type,is_new_energy_vehicle,is_transferred_vehicle,renewal_status,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan
2025-01-14,2025,45,成都,武侯,个人客户,车险,交强险,false,false,新保,A级,低风险,80,85,直销,10000,8000,10,2,1600,1200,11000,9000,800
2025-01-14,2025,45,成都,高新,企业客户,车险,商业险,true,true,续保,B级,中风险,75,80,代理,20000,18000,20,3,2700,2000,22000,18000,2000`

  const invalidCSVContent = `snapshot_date,policy_start_year,week_number,chengdu_branch
2025-01-14,2025,45,成都
2025-01-14,invalid,45,武侯
2025-01-14,2025,invalid_week,高新`

  describe('parseCSV', () => {
    it('应该正确解析有效的CSV内容', () => {
      const result = parseCSV(validCSVContent)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.statistics.totalRows).toBe(2)
      expect(result.statistics.successRows).toBe(2)
      expect(result.statistics.errorRows).toBe(0)
    })

    it('应该处理无效的CSV内容', () => {
      const result = parseCSV(invalidCSVContent)

      expect(result.success).toBe(false) // 因为有错误
      expect(result.data).toHaveLength(1) // 只有第一行有效
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.statistics.errorRows).toBeGreaterThan(0)
    })

    it('应该验证必填字段', () => {
      const incompleteCSV = `snapshot_date,policy_start_year
2025-01-14,2025`

      const result = parseCSV(incompleteCSV)

      expect(result.errors.some(e => e.message.includes('缺少必填字段'))).toBe(
        true
      )
    })

    it('应该处理空行', () => {
      const csvWithEmptyLines = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,business_type_category,customer_category_3,insurance_type,coverage_type,is_new_energy_vehicle,is_transferred_vehicle,renewal_status,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan
2025-01-14,2025,45,成都,武侯,个人客户,车险,交强险,false,false,新保,A级,低风险,80,85,直销,10000,8000,10,2,1600,1200,11000,9000,800

2025-01-14,2025,45,成都,高新,企业客户,车险,商业险,true,true,续保,B级,中风险,75,80,代理,20000,18000,20,3,2700,2000,22000,18000,2000`

      const result = parseCSV(csvWithEmptyLines)

      expect(result.statistics.emptyRows).toBe(1)
      expect(result.statistics.successRows).toBe(2)
    })

    it('应该规范化数据类型', () => {
      const result = parseCSV(validCSVContent)

      expect(result.data[0]).toMatchObject({
        snapshot_date: '2025-01-14',
        policy_start_year: 2025,
        week_number: 45,
        chengdu_branch: '成都',
        third_level_organization: '武侯',
        signed_premium_yuan: 10000,
        is_new_energy_vehicle: false,
        is_transferred_vehicle: false,
      })
    })

    it('应该处理自定义配置', () => {
      const config: CSVParseConfig = {
        maxErrorRows: 1,
        skipEmptyLines: false,
      }

      const result = parseCSV(invalidCSVContent, config)

      expect(result.statistics.errorRows).toBeLessThanOrEqual(1)
    })
  })

  describe('parseCSVBatch', () => {
    it('应该批量解析多个CSV内容', () => {
      const csvContents = [validCSVContent, validCSVContent]
      const results = parseCSVBatch(csvContents)

      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
      })
    })

    it('应该处理混合的有效和无效CSV', () => {
      const csvContents = [validCSVContent, invalidCSVContent]
      const results = parseCSVBatch(csvContents)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })

  describe('convertToInsuranceRecords', () => {
    it('应该将解析结果转换为InsuranceRecord实体', () => {
      const parseResult: CSVParseResult = {
        success: true,
        data: [
          {
            snapshot_date: '2025-01-14',
            policy_start_year: 2025,
            week_number: 45,
            chengdu_branch: '成都',
            third_level_organization: '武侯',
            business_type_category: '个人客户',
            customer_category_3: '车险',
            insurance_type: '交强险',
            coverage_type: '交强险',
            is_new_energy_vehicle: false,
            is_transferred_vehicle: false,
            renewal_status: '新保',
            vehicle_insurance_grade: 'A级',
            highway_risk_grade: '低风险',
            large_truck_score: '80',
            small_truck_score: '85',
            terminal_source: '直销',
            signed_premium_yuan: 10000,
            matured_premium_yuan: 8000,
            policy_count: 10,
            claim_case_count: 2,
            reported_claim_payment_yuan: 1600,
            expense_amount_yuan: 1200,
            commercial_premium_before_discount_yuan: 11000,
            premium_plan_yuan: 9000,
            marginal_contribution_amount_yuan: 800,
          },
        ],
        errors: [],
        warnings: [],
        statistics: {
          totalRows: 1,
          successRows: 1,
          errorRows: 0,
          emptyRows: 0,
          parseTime: 100,
        },
      }

      const result = convertToInsuranceRecords(parseResult)

      expect(result.records).toHaveLength(1)
      expect(result.errors).toHaveLength(0)

      const record = result.records[0]
      expect(record.snapshot_date).toBe('2025-01-14')
      expect(record.policy_start_year).toBe(2025)
      expect(record.week_number).toBe(45)
      expect(record.chengdu_branch).toBe('成都')
      expect(record.third_level_organization).toBe('武侯')
      expect(record.signed_premium_yuan).toBe(10000)
      expect(record.is_new_energy_vehicle).toBe(false)
    })

    it('应该处理转换错误', () => {
      const parseResult: CSVParseResult = {
        success: true,
        data: [
          {
            // 缺少必填字段
            snapshot_date: '2025-01-14',
            policy_start_year: 2025,
            // week_number 缺失
            chengdu_branch: '成都',
            // 其他必填字段也缺失...
          } as any,
        ],
        errors: [],
        warnings: [],
        statistics: {
          totalRows: 1,
          successRows: 1,
          errorRows: 0,
          emptyRows: 0,
          parseTime: 100,
        },
      }

      const result = convertToInsuranceRecords(parseResult)

      expect(result.records).toHaveLength(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('REQUIRED_FIELDS', () => {
    it('应该包含所有必需的字段', () => {
      expect(REQUIRED_FIELDS).toContain('snapshot_date')
      expect(REQUIRED_FIELDS).toContain('policy_start_year')
      expect(REQUIRED_FIELDS).toContain('week_number')
      expect(REQUIRED_FIELDS).toContain('chengdu_branch')
      expect(REQUIRED_FIELDS).toContain('third_level_organization')
      expect(REQUIRED_FIELDS).toContain('business_type_category')
      expect(REQUIRED_FIELDS).toContain('customer_category_3')
      expect(REQUIRED_FIELDS).toContain('insurance_type')
      expect(REQUIRED_FIELDS).toContain('coverage_type')
      expect(REQUIRED_FIELDS).toContain('renewal_status')
      expect(REQUIRED_FIELDS).toContain('terminal_source')
      expect(REQUIRED_FIELDS).toContain('signed_premium_yuan')
      expect(REQUIRED_FIELDS).toContain('matured_premium_yuan')
      expect(REQUIRED_FIELDS).toContain('policy_count')
      expect(REQUIRED_FIELDS).toContain('claim_case_count')
      expect(REQUIRED_FIELDS).toContain('reported_claim_payment_yuan')
      expect(REQUIRED_FIELDS).toContain('expense_amount_yuan')
      expect(REQUIRED_FIELDS).toContain(
        'commercial_premium_before_discount_yuan'
      )
      expect(REQUIRED_FIELDS).toContain('marginal_contribution_amount_yuan')
      expect(REQUIRED_FIELDS).toContain('week_number')
      expect(REQUIRED_FIELDS).toContain('is_new_energy_vehicle')
      expect(REQUIRED_FIELDS).toContain('is_transferred_vehicle')
    })

    it('应该有正确的字段数量', () => {
      expect(REQUIRED_FIELDS).toHaveLength(26)
    })
  })

  describe('边界条件测试', () => {
    it('应该处理空字符串', () => {
      const result = parseCSV('')

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.message.includes('缺少表头'))).toBe(true)
    })

    it('应该处理只有表头的CSV', () => {
      const headerOnlyCSV = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,business_type_category,customer_category_3,insurance_type,coverage_type,is_new_energy_vehicle,is_transferred_vehicle,renewal_status,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan`

      const result = parseCSV(headerOnlyCSV)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.statistics.totalRows).toBe(0)
    })

    it('应该处理超大数值', () => {
      const largeNumberCSV = `snapshot_date,policy_start_year,week_number,chengdu_branch,third_level_organization,business_type_category,customer_category_3,insurance_type,coverage_type,is_new_energy_vehicle,is_transferred_vehicle,renewal_status,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan
2025-01-14,2025,45,成都,武侯,个人客户,车险,交强险,false,false,新保,A级,低风险,80,85,直销,999999999999,8000,10,2,1600,1200,11000,9000,800`

      const result = parseCSV(largeNumberCSV)

      expect(result.success).toBe(true)
      expect(result.data[0].signed_premium_yuan).toBe(999999999999)
    })
  })
})
