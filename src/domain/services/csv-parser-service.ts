/**
 * Domain 层 - CSV 解析服务
 *
 * 统一的 CSV 解析与校验逻辑，替代分散在 utils 和 lib/parsers 中的实现
 * 使用 Domain 层的抽象算子进行数据规范化
 */

import Papa from 'papaparse'
import { InsuranceRecord, RawInsuranceData } from '../entities/InsuranceRecord'
import {
  normalizeText,
  normalizeNumber,
  normalizeBoolean,
  normalizeDate,
  // normalizeBatch,
  // type NormalizationResult,
} from '../shared/normalization-operators'
import { normalizeInsuranceRecord } from '../rules/data-normalization'

/**
 * CSV 解析配置
 */
export interface CSVParseConfig {
  /** 是否有表头 */
  header?: boolean
  /** 分隔符 */
  delimiter?: string
  /** 编码 */
  encoding?: string
  /** 跳过空行 */
  skipEmptyLines?: boolean
  /** 最大错误行数 */
  maxErrorRows?: number
}

/**
 * 字段验证规则
 */
export interface FieldValidationRule {
  /** 字段名 */
  field: string
  /** 是否必填 */
  required?: boolean
  /** 数据类型 */
  type?: 'string' | 'number' | 'boolean' | 'date'
  /** 自定义验证函数 */
  validator?: (value: any) => boolean | string
}

/**
 * 解析结果
 */
export interface CSVParseResult {
  /** 是否成功 */
  success: boolean
  /** 解析的数据 */
  data: RawInsuranceData[]
  /** 错误信息 */
  errors: CSVParseError[]
  /** 警告信息 */
  warnings: string[]
  /** 统计信息 */
  statistics: CSVParseStatistics
}

/**
 * 解析错误
 */
export interface CSVParseError {
  /** 错误类型 */
  type: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'TRANSFORM_ERROR'
  /** 行号 */
  row?: number
  /** 字段名 */
  field?: string
  /** 错误消息 */
  message: string
  /** 原始值 */
  rawValue?: any
}

/**
 * 解析统计
 */
export interface CSVParseStatistics {
  /** 总行数 */
  totalRows: number
  /** 成功行数 */
  successRows: number
  /** 错误行数 */
  errorRows: number
  /** 空行数 */
  emptyRows: number
  /** 解析耗时（毫秒） */
  parseTime: number
}

/**
 * 必需字段列表（26个）
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
 * 默认解析配置
 */
const DEFAULT_CONFIG: CSVParseConfig = {
  header: true,
  delimiter: '',
  skipEmptyLines: true,
  maxErrorRows: 100,
}

/**
 * 字段验证规则
 */
const FIELD_VALIDATION_RULES: FieldValidationRule[] = [
  { field: 'snapshot_date', required: true, type: 'date' },
  { field: 'policy_start_year', required: true, type: 'number' },
  { field: 'week_number', required: true, type: 'number' },
  { field: 'chengdu_branch', required: true, type: 'string' },
  { field: 'third_level_organization', required: true, type: 'string' },
  { field: 'business_type_category', required: true, type: 'string' },
  { field: 'customer_category_3', required: true, type: 'string' },
  { field: 'insurance_type', required: true, type: 'string' },
  { field: 'coverage_type', required: true, type: 'string' },
  { field: 'renewal_status', required: true, type: 'string' },
  { field: 'terminal_source', required: true, type: 'string' },
  // 数值字段
  { field: 'signed_premium_yuan', required: true, type: 'number' },
  { field: 'matured_premium_yuan', required: true, type: 'number' },
  { field: 'policy_count', required: true, type: 'number' },
  { field: 'claim_case_count', required: true, type: 'number' },
  { field: 'reported_claim_payment_yuan', required: true, type: 'number' },
  { field: 'expense_amount_yuan', required: true, type: 'number' },
  {
    field: 'commercial_premium_before_discount_yuan',
    required: true,
    type: 'number',
  },
  {
    field: 'marginal_contribution_amount_yuan',
    required: true,
    type: 'number',
  },
  // 布尔字段
  { field: 'is_new_energy_vehicle', required: true, type: 'boolean' },
  { field: 'is_transferred_vehicle', required: true, type: 'boolean' },
  // 可选字段
  { field: 'premium_plan_yuan', required: false, type: 'number' },
  { field: 'vehicle_insurance_grade', required: false, type: 'string' },
  { field: 'highway_risk_grade', required: false, type: 'string' },
  { field: 'large_truck_score', required: false, type: 'string' },
  { field: 'small_truck_score', required: false, type: 'string' },
]

/**
 * 验证表头
 *
 * @param fields - 解析出的字段列表
 * @returns 验证错误列表
 */
function validateHeader(fields: string[]): CSVParseError[] {
  const errors: CSVParseError[] = []

  if (!fields || fields.length === 0) {
    errors.push({
      type: 'PARSE_ERROR',
      message: 'CSV文件缺少表头，无法识别字段',
    })
    return errors
  }

  // 检查必需字段
  for (const requiredField of REQUIRED_FIELDS) {
    if (!fields.includes(requiredField)) {
      errors.push({
        type: 'VALIDATION_ERROR',
        field: requiredField,
        message: `缺少必填字段：${requiredField}`,
      })
    }
  }

  return errors
}

/**
 * 验证行数据
 *
 * @param row - 行数据
 * @param rowIndex - 行索引
 * @returns 验证错误列表
 */
function validateRow(
  row: Record<string, any>,
  rowIndex: number
): CSVParseError[] {
  const errors: CSVParseError[] = []

  for (const rule of FIELD_VALIDATION_RULES) {
    const value = row[rule.field]

    // 检查必填字段
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push({
        type: 'VALIDATION_ERROR',
        row: rowIndex + 1,
        field: rule.field,
        message: `必填字段为空：${rule.field}`,
        rawValue: value,
      })
      continue
    }

    // 如果字段为空且非必填，跳过类型检查
    if (value === undefined || value === null || value === '') {
      continue
    }

    // 类型检查
    if (rule.type) {
      let isValid = true

      switch (rule.type) {
        case 'string':
          isValid = typeof value === 'string'
          break
        case 'number':
          isValid = typeof value === 'number' || !isNaN(Number(value))
          break
        case 'boolean':
          isValid =
            typeof value === 'boolean' ||
            ['true', 'false', '是', '否', '1', '0'].includes(
              String(value).toLowerCase()
            )
          break
        case 'date':
          isValid = !isNaN(Date.parse(value))
          break
      }

      if (!isValid) {
        errors.push({
          type: 'VALIDATION_ERROR',
          row: rowIndex + 1,
          field: rule.field,
          message: `字段类型错误：${rule.field} 期望 ${rule.type} 类型`,
          rawValue: value,
        })
      }
    }

    // 自定义验证
    if (rule.validator) {
      const result = rule.validator(value)
      if (result !== true) {
        errors.push({
          type: 'VALIDATION_ERROR',
          row: rowIndex + 1,
          field: rule.field,
          message:
            typeof result === 'string' ? result : `字段验证失败：${rule.field}`,
          rawValue: value,
        })
      }
    }
  }

  return errors
}

/**
 * 转换行数据为 RawInsuranceData 格式
 *
 * @param row - 原始行数据
 * @param rowIndex - 行索引
 * @returns 转换结果或错误
 */
function transformRow(
  row: Record<string, any>,
  rowIndex: number
): { data?: RawInsuranceData; error?: CSVParseError } {
  try {
    // 使用 Domain 层的规范化算子
    const normalizedFields = {
      snapshot_date: normalizeDate(row.snapshot_date, { defaultValue: '' })
        .value,
      policy_start_year: normalizeNumber(row.policy_start_year).value,
      week_number: normalizeNumber(row.week_number).value,
      chengdu_branch: normalizeText(row.chengdu_branch).value,
      third_level_organization: normalizeText(row.third_level_organization)
        .value,
      business_type_category: normalizeText(row.business_type_category).value,
      customer_category_3: normalizeText(row.customer_category_3).value,
      insurance_type: normalizeText(row.insurance_type).value,
      coverage_type: normalizeText(row.coverage_type).value,
      renewal_status: normalizeText(row.renewal_status).value,
      terminal_source: normalizeText(row.terminal_source).value,
      signed_premium_yuan: normalizeNumber(row.signed_premium_yuan).value,
      matured_premium_yuan: normalizeNumber(row.matured_premium_yuan).value,
      policy_count: normalizeNumber(row.policy_count).value,
      claim_case_count: normalizeNumber(row.claim_case_count).value,
      reported_claim_payment_yuan: normalizeNumber(
        row.reported_claim_payment_yuan
      ).value,
      expense_amount_yuan: normalizeNumber(row.expense_amount_yuan).value,
      commercial_premium_before_discount_yuan: normalizeNumber(
        row.commercial_premium_before_discount_yuan
      ).value,
      marginal_contribution_amount_yuan: normalizeNumber(
        row.marginal_contribution_amount_yuan
      ).value,
      is_new_energy_vehicle: normalizeBoolean(row.is_new_energy_vehicle).value,
      is_transferred_vehicle: normalizeBoolean(row.is_transferred_vehicle)
        .value,
      // 可选字段
      premium_plan_yuan: row.premium_plan_yuan
        ? normalizeNumber(row.premium_plan_yuan).value
        : null,
      vehicle_insurance_grade: row.vehicle_insurance_grade
        ? normalizeText(row.vehicle_insurance_grade).value
        : null,
      highway_risk_grade: row.highway_risk_grade
        ? normalizeText(row.highway_risk_grade).value
        : null,
      large_truck_score: row.large_truck_score
        ? normalizeText(row.large_truck_score).value
        : null,
      small_truck_score: row.small_truck_score
        ? normalizeText(row.small_truck_score).value
        : null,
    }

    return { data: normalizedFields as RawInsuranceData }
  } catch (error) {
    return {
      error: {
        type: 'TRANSFORM_ERROR',
        row: rowIndex + 1,
        message: error instanceof Error ? error.message : String(error),
        rawValue: row,
      },
    }
  }
}

/**
 * CSV 解析服务
 *
 * @param content - CSV 文件内容
 * @param config - 解析配置
 * @returns 解析结果
 */
export function parseCSV(
  content: string,
  config: Partial<CSVParseConfig> = {}
): CSVParseResult {
  const startTime = Date.now()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const result: CSVParseResult = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    statistics: {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      emptyRows: 0,
      parseTime: 0,
    },
  }

  try {
    // 使用 PapaParse 解析 CSV
    const parseResult = Papa.parse<Record<string, any>>(content, {
      header: finalConfig.header,
      delimiter: finalConfig.delimiter,
      skipEmptyLines: finalConfig.skipEmptyLines,
    })

    if (parseResult.errors.length > 0) {
      result.errors.push(
        ...parseResult.errors.map(error => ({
          type: 'PARSE_ERROR' as const,
          row: error.row,
          message: error.message,
        }))
      )
    }

    // 解析后验证表头
    const headers = parseResult.meta.fields || []
    const headerErrors = validateHeader(headers)
    result.errors.push(...headerErrors)

    const rows = parseResult.data || []
    result.statistics.totalRows = rows.length

    // 处理每一行
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // 跳过完全空白的行
      if (
        Object.values(row).every(
          value => value === null || value === undefined || value === ''
        )
      ) {
        result.statistics.emptyRows++
        continue
      }

      // 验证行数据
      const validationErrors = validateRow(row, i)
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors)
        result.statistics.errorRows++

        // 如果错误行数超过限制，停止处理
        if (result.statistics.errorRows >= (finalConfig.maxErrorRows || 100)) {
          result.warnings.push(
            `错误行数超过限制(${finalConfig.maxErrorRows})，停止处理后续行`
          )
          break
        }
        continue
      }

      // 转换行数据
      const transformResult = transformRow(row, i)
      if (transformResult.error) {
        result.errors.push(transformResult.error)
        result.statistics.errorRows++
        continue
      }

      if (transformResult.data) {
        result.data.push(transformResult.data)
        result.statistics.successRows++
      }
    }

    result.statistics.parseTime = Date.now() - startTime
    result.success =
      result.errors.length === 0 || result.statistics.successRows > 0
  } catch (error) {
    result.errors.push({
      type: 'PARSE_ERROR',
      message: error instanceof Error ? error.message : String(error),
    })
    result.success = false
  }

  return result
}

/**
 * 批量解析 CSV 文件
 *
 * @param contents - 多个 CSV 文件内容
 * @param config - 解析配置
 * @returns 批量解析结果
 */
export function parseCSVBatch(
  contents: string[],
  config: Partial<CSVParseConfig> = {}
): CSVParseResult[] {
  return contents.map(content => parseCSV(content, config))
}

/**
 * 将解析结果转换为 InsuranceRecord 实体
 *
 * @param parseResult - CSV 解析结果
 * @returns 转换后的 InsuranceRecord 数组和错误信息
 */
export function convertToInsuranceRecords(parseResult: CSVParseResult): {
  records: InsuranceRecord[]
  errors: CSVParseError[]
} {
  const records: InsuranceRecord[] = []
  const errors: CSVParseError[] = []

  for (const rawData of parseResult.data) {
    try {
      const record = normalizeInsuranceRecord(rawData)
      records.push(record)
    } catch (error) {
      errors.push({
        type: 'TRANSFORM_ERROR',
        message: error instanceof Error ? error.message : String(error),
        rawValue: rawData,
      })
    }
  }

  return { records, errors }
}
