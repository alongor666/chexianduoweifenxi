/**
 * Application 层 - 数据上传用例
 *
 * 封装数据上传的完整业务流程，包括：
 * - 文件解析与验证
 * - 数据转换与规范化
 * - 业务规则校验
 * - 存储与状态管理
 * - 错误处理与回滚
 */

import { parseCSV, convertToInsuranceRecords } from '../domain'
import type { CSVParseConfig } from '../domain'
import { InsuranceRecord } from '../domain/entities/InsuranceRecord'
import type { RawInsuranceData } from '../domain'
import { useAppStore } from '@/store/use-app-store'

/**
 * 上传配置
 */
export interface UploadConfig {
  /** 是否覆盖已存在的数据 */
  overwrite?: boolean
  /** 是否启用增量模式 */
  incremental?: boolean
  /** 最大错误行数 */
  maxErrorRows?: number
  /** 是否跳过验证 */
  skipValidation?: boolean
  /** 并行上传的并发度（UI层使用，默认值为2，最大3） */
  concurrency?: number
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 是否成功 */
  success: boolean
  /** 处理的记录数 */
  processedRecords: number
  /** 成功的记录数 */
  successRecords: number
  /** 失败的记录数 */
  failedRecords: number
  /** 跳过的记录数 */
  skippedRecords: number
  /** 错误列表 */
  errors: UploadError[]
  /** 警告列表 */
  warnings: string[]
  /** 处理时间（毫秒） */
  processingTime: number
  /** 上传的文件信息 */
  fileInfo: {
    name: string
    size: number
    type: string
  }
}

/**
 * 上传错误
 */
export interface UploadError {
  /** 错误类型 */
  type: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'BUSINESS_ERROR' | 'STORAGE_ERROR'
  /** 错误消息 */
  message: string
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info'
  /** 行号 */
  row?: number
  /** 字段名 */
  field?: string
  /** 原始数据 */
  rawData?: unknown
}

/**
 * 进度信息
 */
export interface UploadProgress {
  /** 当前阶段 */
  phase: 'parsing' | 'validating' | 'transforming' | 'storing' | 'completed'
  /** 进度百分比 */
  percentage: number
  /** 当前处理的行数 */
  processedRows: number
  /** 总行数 */
  totalRows: number
  /** 估计剩余时间（秒） */
  estimatedTimeRemaining?: number
  /** 当前处理的项目 */
  currentItem?: string
}

/**
 * 进度回调函数
 */
export type ProgressCallback = (progress: UploadProgress) => void

/**
 * 数据上传用例类
 *
 * 封装完整的数据上传业务流程
 */
export class UploadDataUseCase {
  private store = useAppStore.getState()

  /**
   * 执行数据上传
   *
   * @param file - 上传的文件
   * @param config - 上传配置
   * @param onProgress - 进度回调
   * @returns 上传结果
   */
  async execute(
    file: File,
    config: UploadConfig = {},
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    const startTime = Date.now()

    const result: UploadResult = {
      success: false,
      processedRecords: 0,
      successRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      errors: [],
      warnings: [],
      processingTime: 0,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    }

    try {
      // 阶段1: 解析CSV文件
      onProgress?.({
        phase: 'parsing',
        percentage: 10,
        processedRows: 0,
        totalRows: 0,
        currentItem: file.name,
      })

      const content = await file.text()
      const parseConfig: CSVParseConfig = {
        header: true,
        skipEmptyLines: true,
        maxErrorRows: config.maxErrorRows || 100,
      }

      const parseResult = parseCSV(content, parseConfig)

      if (!parseResult.success && parseResult.data.length === 0) {
        result.errors.push({
          type: 'PARSE_ERROR',
          message: 'CSV解析失败，没有有效数据',
          severity: 'error',
        })
        return result
      }

      result.processedRecords = parseResult.statistics.totalRows
      result.failedRecords = parseResult.statistics.errorRows
      result.warnings.push(...parseResult.warnings)

      // 转换解析错误
      result.errors.push(
        ...parseResult.errors.map(
          (error): UploadError => ({
            type: error.type as 'PARSE_ERROR' | 'VALIDATION_ERROR',
            message: error.message,
            row: error.row,
            field: error.field,
            rawData: error.rawValue,
            severity: 'error',
          })
        )
      )

      onProgress?.({
        phase: 'validating',
        percentage: 30,
        processedRows: parseResult.statistics.successRows,
        totalRows: parseResult.statistics.totalRows,
        currentItem: '验证数据格式',
      })

      // 阶段2: 转换为InsuranceRecord实体
      const conversionResult = convertToInsuranceRecords(parseResult)

      if (conversionResult.errors.length > 0) {
        result.errors.push(
          ...conversionResult.errors.map(
            (error): UploadError => ({
              type: 'VALIDATION_ERROR',
              message: error.message,
              rawData: error.rawValue,
              severity: 'error',
            })
          )
        )
      }

      const validRecords = conversionResult.records
      result.successRecords = validRecords.length

      onProgress?.({
        phase: 'transforming',
        percentage: 60,
        processedRows: validRecords.length,
        totalRows: parseResult.statistics.totalRows,
        currentItem: '转换数据格式',
      })

      // 阶段3: 业务规则验证（如果未跳过）
      if (!config.skipValidation) {
        onProgress?.({
          phase: 'validating',
          percentage: 80,
          processedRows: validRecords.length,
          totalRows: parseResult.statistics.totalRows,
          currentItem: '验证业务规则',
        })

        const businessValidationResult =
          await this.validateBusinessRules(validRecords)

        if (businessValidationResult.errors.length > 0) {
          result.errors.push(...businessValidationResult.errors)
        }

        result.warnings.push(...businessValidationResult.warnings)
      }

      // 阶段4: 存储数据
      onProgress?.({
        phase: 'storing',
        percentage: 90,
        processedRows: validRecords.length,
        totalRows: parseResult.statistics.totalRows,
        currentItem: '保存数据',
      })

      const storageResult = await this.storeData(validRecords, config)

      if (storageResult.errors.length > 0) {
        result.errors.push(...storageResult.errors)
      }

      result.warnings.push(...storageResult.warnings)

      // 完成处理
      result.processingTime = Date.now() - startTime
      result.success = result.errors.length === 0 || result.successRecords > 0

      onProgress?.({
        phase: 'completed',
        percentage: 100,
        processedRows: result.successRecords,
        totalRows: parseResult.statistics.totalRows,
        currentItem: '完成',
      })
    } catch (error) {
      result.processingTime = Date.now() - startTime
      result.errors.push({
        type: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
      })
      result.success = false
    }

    return result
  }

  /**
   * 验证业务规则
   *
   * @param records - 保险记录数组
   * @returns 验证结果
   */
  private async validateBusinessRules(
    records: InsuranceRecord[]
  ): Promise<{ errors: UploadError[]; warnings: string[] }> {
    const errors: UploadError[] = []
    const warnings: string[] = []

    // 检查重复记录
    const duplicates = this.findDuplicateRecords(records)
    if (duplicates.length > 0) {
      warnings.push(`发现 ${duplicates.length} 条可能重复的记录`)
    }

    // 检查周次范围
    const invalidWeeks = records.filter(
      r => r.weekNumber < 1 || r.weekNumber > 105
    )
    if (invalidWeeks.length > 0) {
      errors.push({
        type: 'BUSINESS_ERROR',
        message: `发现 ${invalidWeeks.length} 条记录的周次超出有效范围(1-105)`,
        severity: 'error',
      })
    }

    // 检查年份范围
    const invalidYears = records.filter(
      r => r.policyStartYear < 2000 || r.policyStartYear > 2100
    )
    if (invalidYears.length > 0) {
      errors.push({
        type: 'BUSINESS_ERROR',
        message: `发现 ${invalidYears.length} 条记录的年份超出有效范围(2000-2100)`,
        severity: 'error',
      })
    }

    // 检查负数金额
    const negativeAmounts = records.filter(
      r =>
        r.signedPremiumYuan < 0 ||
        r.maturedPremiumYuan < 0 ||
        // r.reportedClaimPaymentYuan < 0 || // 允许为负数
        r.expenseAmountYuan < 0
    )
    if (negativeAmounts.length > 0) {
      warnings.push(`发现 ${negativeAmounts.length} 条记录包含负数金额`)
    }

    return { errors, warnings }
  }

  /**
   * 查找重复记录
   *
   * @param records - 保险记录数组
   * @returns 重复记录列表
   */
  private findDuplicateRecords(records: InsuranceRecord[]): InsuranceRecord[] {
    const seen = new Set<string>()
    const duplicates: InsuranceRecord[] = []

    for (const record of records) {
      const key = `${record.snapshotDate}_${record.thirdLevelOrganization}_${record.businessTypeCategory}_${record.weekNumber}`

      if (seen.has(key)) {
        duplicates.push(record)
      } else {
        seen.add(key)
      }
    }

    return duplicates
  }

  /**
   * 存储数据
   *
   * @param records - 保险记录数组
   * @param config - 上传配置
   * @returns 存储结果
   */
  private async storeData(
    records: InsuranceRecord[],
    config: UploadConfig
  ): Promise<{ errors: UploadError[]; warnings: string[] }> {
    const errors: UploadError[] = []
    const warnings: string[] = []

    try {
      // 步骤 1: 从 store 获取原始数据并转换为领域实体
      const existingRawData = this.store.rawData || []
      const existingDomainRecords = existingRawData.map(raw =>
        InsuranceRecord.fromRawData(raw as RawInsuranceData)
      )

      // 步骤 2: 使用领域实体执行业务逻辑
      if (!config.overwrite) {
        const conflicts = this.checkDataConflicts(
          records,
          existingDomainRecords
        )
        if (conflicts.length > 0) {
          warnings.push(`发现 ${conflicts.length} 条数据可能与现有数据冲突`)
        }
      }

      // 合并数据
      let finalDomainData: InsuranceRecord[]

      if (config.incremental) {
        // 增量模式：只添加新数据
        const newRecords = this.filterNewRecords(records, existingDomainRecords)
        finalDomainData = [...existingDomainRecords, ...newRecords]
        warnings.push(
          `增量模式：添加 ${newRecords.length} 条新记录，跳过 ${
            records.length - newRecords.length
          } 条已存在记录`
        )
      } else if (config.overwrite) {
        // 覆盖模式：替换相同机构/业务类型的数据
        finalDomainData = this.mergeWithOverwrite(
          records,
          existingDomainRecords
        )
        warnings.push(`覆盖模式：已更新相关数据`)
      } else {
        // 默认模式：简单追加
        finalDomainData = [...existingDomainRecords, ...records]
      }

      // 步骤 3: 转换为 store 期望的格式并更新
      const storeData = finalDomainData.map(record => record.toRawData())
      this.store.setRawData(storeData as any)
    } catch (error) {
      errors.push({
        type: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
      })
    }

    return { errors, warnings }
  }

  /**
   * 检查数据冲突
   *
   * @param newRecords - 新记录
   * @param existingData - 现有数据
   * @returns 冲突记录列表
   */
  private checkDataConflicts(
    newRecords: InsuranceRecord[],
    existingData: InsuranceRecord[]
  ): InsuranceRecord[] {
    const existingKeys = new Set(
      existingData.map(
        r =>
          `${r.snapshotDate}_${r.thirdLevelOrganization}_${r.businessTypeCategory}_${r.weekNumber}`
      )
    )

    return newRecords.filter(record => {
      const key = `${record.snapshotDate}_${record.thirdLevelOrganization}_${record.businessTypeCategory}_${record.weekNumber}`
      return existingKeys.has(key)
    })
  }

  /**
   * 过滤新记录
   *
   * @param newRecords - 新记录
   * @param existingData - 现有数据
   * @returns 新记录列表
   */
  private filterNewRecords(
    newRecords: InsuranceRecord[],
    existingData: InsuranceRecord[]
  ): InsuranceRecord[] {
    const existingKeys = new Set(
      existingData.map(
        r =>
          `${r.snapshotDate}_${r.thirdLevelOrganization}_${r.businessTypeCategory}_${r.weekNumber}`
      )
    )

    return newRecords.filter(record => {
      const key = `${record.snapshotDate}_${record.thirdLevelOrganization}_${record.businessTypeCategory}_${record.weekNumber}`
      return !existingKeys.has(key)
    })
  }

  /**
   * 合并数据（覆盖模式）
   *
   * @param newRecords - 新记录
   * @param existingData - 现有数据
   * @returns 合并后的数据
   */
  private mergeWithOverwrite(
    newRecords: InsuranceRecord[],
    existingData: InsuranceRecord[]
  ): InsuranceRecord[] {
    const existingMap = new Map(
      existingData.map(r => [
        `${r.snapshotDate}_${r.thirdLevelOrganization}_${r.businessTypeCategory}_${r.weekNumber}`,
        r,
      ])
    )

    // 添加新记录，覆盖已存在的
    for (const record of newRecords) {
      const key = `${record.snapshotDate}_${record.thirdLevelOrganization}_${record.businessTypeCategory}_${record.weekNumber}`
      existingMap.set(key, record)
    }

    return Array.from(existingMap.values())
  }

  /**
   * 获取上传统计信息
   *
   * @param results - 多个上传结果
   * @returns 统计信息
   */
  static getUploadStatistics(results: UploadResult[]): {
    totalFiles: number
    successfulFiles: number
    totalRecords: number
    successfulRecords: number
    failedRecords: number
    averageProcessingTime: number
  } {
    const successfulFiles = results.filter(r => r.success).length
    const totalRecords = results.reduce((sum, r) => sum + r.processedRecords, 0)
    const successfulRecords = results.reduce(
      (sum, r) => sum + r.successRecords,
      0
    )
    const failedRecords = results.reduce((sum, r) => sum + r.failedRecords, 0)
    const averageProcessingTime =
      results.reduce((sum, r) => sum + r.processingTime, 0) / results.length

    return {
      totalFiles: results.length,
      successfulFiles,
      totalRecords,
      successfulRecords,
      failedRecords,
      averageProcessingTime,
    }
  }
}
