/**
 * CSV 行转换器
 * 将原始 CSV 行数据转换为规范的 InsuranceRecord 格式
 */

import type {
  InsuranceRecord,
  VehicleInsuranceGrade,
  HighwayRiskGrade,
  TruckScore,
} from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'
import { parseNumber, parseEnum, parseOptionalEnum, parseBoolean } from './field-parsers'
import { logger } from '@/lib/logger'

const log = logger.create('RowTransformer')

/**
 * 行转换结果
 */
export interface RowTransformResult {
  data: Partial<InsuranceRecord>
  errors: string[]
}

/**
 * 转换 CSV 行数据为 InsuranceRecord 格式
 * @param row 原始 CSV 行数据
 * @param rowIndex 行索引（用于错误报告）
 * @returns 转换结果（包含数据和错误信息）
 */
export function transformCSVRow(
  row: Record<string, unknown>,
  rowIndex: number
): RowTransformResult {
  const errors: string[] = []

  try {
    log.debug('转换CSV行', { rowIndex: rowIndex + 1 })

    const data: Partial<InsuranceRecord> = {
      // ========== 时间维度 ==========
      snapshot_date: String(row.snapshot_date || '').trim(),
      policy_start_year: parseNumber(
        row.policy_start_year,
        'policy_start_year',
        errors
      ),
      week_number: parseNumber(row.week_number, 'week_number', errors),

      // ========== 组织维度 ==========
      chengdu_branch: parseEnum(
        row.chengdu_branch,
        ['成都', '中支'],
        '成都'
      ) as '成都' | '中支',
      third_level_organization: normalizeChineseText(
        String(row.third_level_organization || '').trim()
      ),

      // ========== 客户维度 ==========
      customer_category_3: normalizeChineseText(
        String(row.customer_category_3 || '').trim()
      ),

      // ========== 产品维度 ==========
      insurance_type: parseEnum(
        row.insurance_type,
        ['商业险', '交强险'],
        '商业险',
        'insurance_type'
      ) as '商业险' | '交强险',
      business_type_category: normalizeChineseText(
        String(row.business_type_category || '').trim()
      ),
      coverage_type: parseEnum(
        row.coverage_type,
        ['主全', '交三', '单交'],
        '主全',
        'coverage_type'
      ) as '主全' | '交三' | '单交',

      // ========== 业务属性 ==========
      renewal_status: parseEnum(
        row.renewal_status,
        ['新保', '续保', '转保'],
        '新保',
        'renewal_status'
      ) as '新保' | '续保' | '转保',
      is_new_energy_vehicle: parseBoolean(
        row.is_new_energy_vehicle,
        'is_new_energy_vehicle',
        errors
      ),
      is_transferred_vehicle: parseBoolean(
        row.is_transferred_vehicle,
        'is_transferred_vehicle',
        errors
      ),

      // ========== 评级维度（可选字段）==========
      vehicle_insurance_grade: parseOptionalEnum<VehicleInsuranceGrade>(
        row.vehicle_insurance_grade,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G']
      ),
      highway_risk_grade: parseOptionalEnum<HighwayRiskGrade>(
        row.highway_risk_grade,
        ['A', 'B', 'C', 'D', 'E', 'F', 'X']
      ),
      large_truck_score: parseOptionalEnum<TruckScore>(
        row.large_truck_score,
        ['A', 'B', 'C', 'D', 'E', 'X']
      ),
      small_truck_score: parseOptionalEnum<TruckScore>(
        row.small_truck_score,
        ['A', 'B', 'C', 'D', 'E', 'X']
      ),

      // ========== 渠道维度 ==========
      terminal_source: normalizeChineseText(
        String(row.terminal_source || '').trim()
      ),

      // ========== 业务指标（带范围验证）==========
      signed_premium_yuan: parseNumber(
        row.signed_premium_yuan,
        'signed_premium_yuan',
        errors,
        { min: 0, max: 10000000 }
      ),
      matured_premium_yuan: parseNumber(
        row.matured_premium_yuan,
        'matured_premium_yuan',
        errors,
        { min: 0, max: 10000000 }
      ),
      policy_count: parseNumber(
        row.policy_count,
        'policy_count',
        errors,
        { min: 0, integer: true }
      ),
      claim_case_count: parseNumber(
        row.claim_case_count,
        'claim_case_count',
        errors,
        { min: 0, integer: true }
      ),
      reported_claim_payment_yuan: parseNumber(
        row.reported_claim_payment_yuan,
        'reported_claim_payment_yuan',
        errors,
        { min: 0 }
      ),
      expense_amount_yuan: parseNumber(
        row.expense_amount_yuan,
        'expense_amount_yuan',
        errors,
        { min: 0 }
      ),
      commercial_premium_before_discount_yuan: parseNumber(
        row.commercial_premium_before_discount_yuan,
        'commercial_premium_before_discount_yuan',
        errors,
        { min: 0 }
      ),

      // ========== 可空字段 ==========
      premium_plan_yuan:
        row.premium_plan_yuan !== null &&
        row.premium_plan_yuan !== undefined &&
        row.premium_plan_yuan !== ''
          ? parseNumber(row.premium_plan_yuan, 'premium_plan_yuan', errors, {
              min: 0,
            })
          : null,

      marginal_contribution_amount_yuan: parseNumber(
        row.marginal_contribution_amount_yuan,
        'marginal_contribution_amount_yuan',
        errors
      ),
    }

    log.debug('CSV行转换完成', { rowIndex: rowIndex + 1, errorCount: errors.length })
    return { data, errors }
  } catch (error) {
    const errorMsg = `行 ${rowIndex + 1}: 数据转换失败 - ${
      error instanceof Error ? error.message : '未知错误'
    }`
    log.error(errorMsg, error)
    errors.push(errorMsg)
    return { data: {}, errors }
  }
}

/**
 * 批量转换 CSV 行
 * @param rows 原始 CSV 行数组
 * @returns 转换结果数组
 */
export function transformCSVRows(
  rows: Array<Record<string, unknown>>
): RowTransformResult[] {
  return rows.map((row, index) => transformCSVRow(row, index))
}
