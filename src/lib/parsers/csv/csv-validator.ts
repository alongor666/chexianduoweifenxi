/**
 * CSV 文件验证器
 * 提供文件格式验证、字段验证和数据完整性检查
 */

import { logger } from '@/lib/logger'

const log = logger.create('CSVValidator')

/**
 * CSV 必需字段列表（26个）
 * 按实际CSV文件字段顺序排列
 */
export const REQUIRED_FIELDS = [
  'snapshot_date',
  'policy_start_year',
  'business_type_category',
  'chengdu_branch',
  'third_level_organization',
  'customer_category_3',
  'insurance_type',
  'is_new_energy_vehicle',
  'coverage_type',
  'is_transferred_vehicle',
  'renewal_status',
  'vehicle_insurance_grade',
  'highway_risk_grade',
  'large_truck_score',
  'small_truck_score',
  'terminal_source',
  'signed_premium_yuan',
  'matured_premium_yuan',
  'policy_count',
  'claim_case_count',
  'reported_claim_payment_yuan',
  'expense_amount_yuan',
  'commercial_premium_before_discount_yuan',
  'premium_plan_yuan',
  'marginal_contribution_amount_yuan',
  'week_number',
] as const

/**
 * 文件验证结果
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * 头部验证结果
 */
export interface HeaderValidationResult {
  valid: boolean
  presentFields: string[]
  missingFields: string[]
  extraFields: string[]
  error?: string
}

/**
 * 验证 CSV 文件格式
 * 检查文件扩展名、大小和文件名格式
 */
export function validateCSVFile(file: File): FileValidationResult {
  const warnings: string[] = []

  // 1. 检查文件类型
  if (!file.name.endsWith('.csv')) {
    return {
      valid: false,
      error: '文件格式错误，请上传 CSV 文件',
    }
  }

  // 2. 检查文件大小（限制 50MB）
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件过大，最大支持 ${maxSize / 1024 / 1024}MB`,
    }
  }

  // 3. 检查文件名格式（可选）
  const weeklyPattern = /^\d{4}保单第\d{1,3}周变动成本明细表\.csv$/
  const summaryPattern = /^\d{2}年保单\d{1,3}-\d{1,3}周变动成本汇总表\.csv$/

  if (!weeklyPattern.test(file.name) && !summaryPattern.test(file.name)) {
    const warning = `文件名格式不标准：${file.name}，建议格式：YYYY保单第N周变动成本明细表.csv 或 YY年保单N-M周变动成本汇总表.csv`
    warnings.push(warning)
    log.warn('文件名格式不标准，但继续处理', { fileName: file.name })
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * 验证 CSV 头部字段
 * 检查必需字段是否存在，并标记额外字段
 */
export function validateCSVHeaders(
  presentFields: string[]
): HeaderValidationResult {
  log.debug('开始验证CSV头部', {
    fieldCount: presentFields.length,
    fields: presentFields,
  })

  log.debug('必需字段', {
    requiredCount: REQUIRED_FIELDS.length,
    fields: REQUIRED_FIELDS,
  })

  // 检查缺失的必需字段
  const missingFields = REQUIRED_FIELDS.filter(
    field => !presentFields.includes(field)
  )

  // 检查额外字段
  const extraFields = presentFields.filter(
    field => !REQUIRED_FIELDS.includes(field as typeof REQUIRED_FIELDS[number])
  )

  // 如果有缺失字段，验证失败
  if (missingFields.length > 0) {
    log.error('缺失必需字段', {
      missingCount: missingFields.length,
      missingFields,
    })

    return {
      valid: false,
      presentFields,
      missingFields,
      extraFields,
      error: `CSV 表头缺失必需字段 (${missingFields.length}个): ${missingFields.join(', ')}\n\n请确保CSV文件包含所有必需字段。\n参考文档: CSV导入规范.md`,
    }
  }

  // 如果有额外字段，记录警告但继续处理
  if (extraFields.length > 0) {
    log.warn('发现额外字段', {
      extraCount: extraFields.length,
      extraFields,
    })
  }

  log.debug('表头验证通过 ✓')

  return {
    valid: true,
    presentFields,
    missingFields: [],
    extraFields,
  }
}

/**
 * 从解析结果的元数据或首行提取字段列表
 */
export function extractFieldsFromParseResult(
  meta?: { fields?: string[] },
  firstRow?: Record<string, unknown>
): string[] {
  // 优先使用 meta.fields
  if (meta?.fields && meta.fields.length > 0) {
    return meta.fields
  }

  // 否则从第一行数据提取
  if (firstRow) {
    return Object.keys(firstRow)
  }

  return []
}

/**
 * 验证数据行的完整性
 * 检查关键字段是否为空
 */
export function validateRowCompleteness(
  row: Record<string, unknown>,
  rowIndex: number
): string[] {
  const errors: string[] = []

  // 定义必须非空的关键字段
  const criticalFields = [
    'snapshot_date',
    'policy_start_year',
    'week_number',
    'insurance_type',
  ]

  for (const field of criticalFields) {
    const value = row[field]
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      errors.push(`行 ${rowIndex + 1}: 关键字段 "${field}" 不能为空`)
    }
  }

  return errors
}
