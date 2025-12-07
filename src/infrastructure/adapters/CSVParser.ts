/**
 * CSV 文件解析器实现
 *
 * 实现 IFileParser 接口，提供 CSV 文件解析和验证功能。
 *
 * @layer Infrastructure
 * @implements IFileParser
 * @depends Application/Ports, Domain/Entities
 */

import Papa from 'papaparse'
import type {
  IFileParser,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
  ValidationWarningType,
} from '../../application/ports/IFileParser'
import type { RawInsuranceData } from '../../domain'
import { normalizeChineseText } from '../../domain/rules/data-normalization'

/**
 * CSV 解析器实现
 *
 * 使用 PapaParse 库解析 CSV 文件，并进行数据验证。
 */
export class CSVParser implements IFileParser {
  // 支持的文件类型
  private readonly supportedTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel']

  // 最大文件大小（100MB）
  private readonly maxFileSize = 100 * 1024 * 1024

  // 必需字段列表
  private readonly requiredFields = [
    'snapshot_date',
    'policy_start_year',
    'week_number',
    'chengdu_branch',
    'third_level_organization',
    'customer_category_3',
    'insurance_type',
    'business_type_category',
    'coverage_type',
    'renewal_status',
    'is_new_energy_vehicle',
    'is_transferred_vehicle',
    'terminal_source',
    'signed_premium_yuan',
    'matured_premium_yuan',
    'policy_count',
    'claim_case_count',
    'reported_claim_payment_yuan',
    'expense_amount_yuan',
    'commercial_premium_before_discount_yuan',
    'marginal_contribution_amount_yuan',
  ]

  /**
   * 解析 CSV 文件
   */
  async parse(file: File): Promise<RawInsuranceData[]> {
    try {
      console.log(`[CSVParser] 开始解析文件: ${file.name}`)
      const startTime = performance.now()

      // 1. 读取文件内容
      const text = await file.text()

      // 2. 使用 PapaParse 解析
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true, // 自动转换数字类型
          complete: resolve,
          error: reject,
        })
      })

      // 3. 检查解析错误
      if (parseResult.errors.length > 0) {
        console.warn('[CSVParser] 解析警告:', parseResult.errors)
      }

      // 4. 转换为 RawInsuranceData 格式
      const rawData = parseResult.data.map((row, index) =>
        this.mapToRawData(row, index)
      )

      const elapsed = performance.now() - startTime
      console.log(
        `[CSVParser] 解析完成: ${rawData.length} 条记录，耗时 ${elapsed.toFixed(0)}ms`
      )

      return rawData
    } catch (error) {
      throw new Error(
        `CSV 解析失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 验证文件格式和内容
   */
  async validate(file: File): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 1. 验证文件类型
      if (!this.isValidFileType(file)) {
        errors.push({
          type: 'INVALID_FILE_FORMAT' as ValidationErrorType,
          message: `不支持的文件类型: ${file.type || '未知'}。请上传 CSV 文件。`,
        })
        return { isValid: false, errors, warnings }
      }

      // 2. 验证文件大小
      if (file.size === 0) {
        errors.push({
          type: 'EMPTY_FILE' as ValidationErrorType,
          message: '文件为空',
        })
        return { isValid: false, errors, warnings }
      }

      if (file.size > this.maxFileSize) {
        errors.push({
          type: 'FILE_TOO_LARGE' as ValidationErrorType,
          message: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大支持 ${
            this.maxFileSize / 1024 / 1024
          }MB`,
        })
        return { isValid: false, errors, warnings }
      }

      // 3. 解析并验证内容
      const text = await file.text()
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          preview: 100, // 只预览前100行以加速验证
          complete: resolve,
        })
      })

      // 4. 验证表头
      const headers = parseResult.meta.fields || []
      const missingFields = this.requiredFields.filter(field => !headers.includes(field))

      if (missingFields.length > 0) {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD' as ValidationErrorType,
          message: `缺少必需字段: ${missingFields.join(', ')}`,
        })
      }

      // 5. 验证数据行
      if (parseResult.data.length === 0) {
        errors.push({
          type: 'EMPTY_FILE' as ValidationErrorType,
          message: '文件中没有有效数据',
        })
      } else {
        // 验证前几行数据
        parseResult.data.slice(0, 10).forEach((row, index) => {
          this.validateRow(row, index, errors, warnings)
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalRows: parseResult.data.length,
        validRows: parseResult.data.length - errors.filter(e => e.row !== undefined).length,
      }
    } catch (error) {
      errors.push({
        type: 'INVALID_FILE_FORMAT' as ValidationErrorType,
        message: `文件验证失败: ${error instanceof Error ? error.message : String(error)}`,
      })

      return { isValid: false, errors, warnings }
    }
  }

  /**
   * 获取支持的文件类型
   */
  getSupportedFileTypes(): string[] {
    return ['.csv']
  }

  // ============= 私有辅助方法 =============

  /**
   * 验证文件类型
   */
  private isValidFileType(file: File): boolean {
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    return (
      fileName.endsWith('.csv') ||
      this.supportedTypes.some(type => fileType.includes(type))
    )
  }

  /**
   * 验证单行数据
   */
  private validateRow(
    row: any,
    rowIndex: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // 验证必需字段存在
    for (const field of this.requiredFields) {
      if (row[field] === undefined || row[field] === null || row[field] === '') {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD' as ValidationErrorType,
          message: `第 ${rowIndex + 2} 行缺少必需字段`,
          row: rowIndex + 2,
          field,
        })
      }
    }

    // 验证数字字段
    const numericFields = [
      'policy_start_year',
      'week_number',
      'signed_premium_yuan',
      'matured_premium_yuan',
      'policy_count',
      'claim_case_count',
      'reported_claim_payment_yuan',
      'expense_amount_yuan',
      'commercial_premium_before_discount_yuan',
      'marginal_contribution_amount_yuan',
    ]

    for (const field of numericFields) {
      const value = row[field]
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value)
        if (isNaN(num)) {
          errors.push({
            type: 'INVALID_FIELD_TYPE' as ValidationErrorType,
            message: `第 ${rowIndex + 2} 行字段 ${field} 必须是数字`,
            row: rowIndex + 2,
            field,
            value,
          })
        }
      }
    }

    // 验证周次范围
    if (row.week_number !== undefined && row.week_number !== null) {
      const weekNum = Number(row.week_number)
      if (!isNaN(weekNum) && (weekNum < 1 || weekNum > 105)) {
        warnings.push({
          type: 'SUSPICIOUS_DATA' as ValidationWarningType,
          message: `第 ${rowIndex + 2} 行周次超出正常范围 (1-105)`,
          row: rowIndex + 2,
          field: 'week_number',
        })
      }
    }

    // 验证年份范围
    if (row.policy_start_year !== undefined && row.policy_start_year !== null) {
      const year = Number(row.policy_start_year)
      if (!isNaN(year) && (year < 2000 || year > 2100)) {
        warnings.push({
          type: 'SUSPICIOUS_DATA' as ValidationWarningType,
          message: `第 ${rowIndex + 2} 行年份异常`,
          row: rowIndex + 2,
          field: 'policy_start_year',
        })
      }
    }
  }

  /**
   * 解析布尔值
   * 兼容 'True', 'False', 'true', 'false', 1, 0 等格式
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      return normalized === 'true' || normalized === 'yes' || normalized === '1'
    }
    if (typeof value === 'number') {
      return value === 1
    }
    return Boolean(value)
  }

  /**
   * 将 CSV 行映射为 RawInsuranceData
   */
  private mapToRawData(row: any, index: number): RawInsuranceData {
    try {
      return {
        snapshot_date: String(row.snapshot_date || ''),
        policy_start_year: Number(row.policy_start_year || 0),
        week_number: Number(row.week_number || 0),
        chengdu_branch: row.chengdu_branch || '成都',
        third_level_organization: normalizeChineseText(
          String(row.third_level_organization || '')
        ),
        customer_category_3: normalizeChineseText(String(row.customer_category_3 || '')),
        insurance_type: row.insurance_type || '商业险',
        business_type_category: normalizeChineseText(
          String(row.business_type_category || '')
        ),
        coverage_type: row.coverage_type || '主全',
        renewal_status: row.renewal_status || '新保',
        is_new_energy_vehicle: this.parseBoolean(row.is_new_energy_vehicle),
        is_transferred_vehicle: this.parseBoolean(row.is_transferred_vehicle),
        vehicle_insurance_grade: row.vehicle_insurance_grade || null,
        highway_risk_grade: row.highway_risk_grade || null,
        large_truck_score: row.large_truck_score || null,
        small_truck_score: row.small_truck_score || null,
        terminal_source: normalizeChineseText(String(row.terminal_source || '')),
        signed_premium_yuan: Number(row.signed_premium_yuan || 0),
        matured_premium_yuan: Number(row.matured_premium_yuan || 0),
        policy_count: Number(row.policy_count || 0),
        claim_case_count: Number(row.claim_case_count || 0),
        reported_claim_payment_yuan: Number(row.reported_claim_payment_yuan || 0),
        expense_amount_yuan: Number(row.expense_amount_yuan || 0),
        commercial_premium_before_discount_yuan: Number(
          row.commercial_premium_before_discount_yuan || 0
        ),
        premium_plan_yuan: row.premium_plan_yuan ? Number(row.premium_plan_yuan) : null,
        marginal_contribution_amount_yuan: Number(
          row.marginal_contribution_amount_yuan || 0
        ),
      }
    } catch (error) {
      throw new Error(
        `第 ${index + 2} 行数据映射失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
