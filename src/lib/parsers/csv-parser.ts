/**
 * CSV 文件解析器 - 模块化重构版
 * 使用 Papa Parse 实现流式解析，支持大文件，优化内存使用和错误处理
 */

import Papa from 'papaparse'
import type { InsuranceRecord } from '@/types/insurance'
import { validateRecords } from '../validations/insurance-schema'
import { logger } from '@/lib/logger'
import { normalizeFileEncoding } from './csv/encoding-detector'
import { transformCSVRow } from './csv/row-transformer'
import {
  validateCSVFile,
  validateCSVHeaders,
  extractFieldsFromParseResult,
  REQUIRED_FIELDS,
} from './csv/csv-validator'
import { exportToCSV } from './csv/csv-exporter'

const log = logger.create('CSVParser')

/**
 * CSV 解析结果
 */
export interface CSVParseResult {
  success: boolean
  data: InsuranceRecord[]
  errors: Array<{
    row: number
    field?: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
    parseTime: number
    fileSize: number
    processingSpeed: number // 行/秒
    encoding: string
  }
}

/**
 * 解析进度回调 - 增强版
 */
export type ProgressCallback = (progress: {
  percentage: number
  processedRows: number
  currentPhase: 'parsing' | 'validating' | 'transforming'
  estimatedTimeRemaining?: number
  totalRows?: number // 总行数估算
  errorCount?: number // 错误计数
}) => void


/**
 * 解析 CSV 文件 - 优化版
 * @param file CSV 文件对象
 * @param onProgress 进度回调函数
 * @returns 解析结果
 */
export async function parseCSVFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<CSVParseResult> {
  log.info('开始解析文件', { fileName: file.name, fileSize: file.size })
  const startTime = performance.now()
  let processedRows = 0

  const { file: sourceFile, encoding } = await normalizeFileEncoding(file)
  const encodingLabel = encoding !== 'utf-8' ? `${encoding}→utf-8` : 'utf-8'

  if (encoding !== 'utf-8') {
    log.info('已自动将文件编码转换为 UTF-8', { fileName: file.name, from: encoding })
  } else {
    log.info('使用 UTF-8 编码解析', { fileName: file.name })
  }

  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = []
    const transformErrors: Array<{ row: number; errors: string[] }> = []
    let headersChecked = false

    // 更新进度的辅助函数
    const updateProgress = (
      phase: 'parsing' | 'validating' | 'transforming',
      percentage: number
    ) => {
      if (onProgress) {
        const elapsed = performance.now() - startTime
        const estimatedTotal = elapsed / (percentage / 100)
        const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed)

        // 估算总行数（基于文件大小和已处理行数）
        const estimatedTotalRows =
          processedRows > 0 && percentage > 0
            ? Math.round(processedRows / (percentage / 100))
            : undefined

        // 计算当前错误数量
        const currentErrorCount = transformErrors.length

        onProgress({
          percentage: Math.min(percentage, 99),
          processedRows,
          currentPhase: phase,
          estimatedTimeRemaining:
            estimatedTimeRemaining > 1000 ? estimatedTimeRemaining : undefined,
          totalRows: estimatedTotalRows,
          errorCount: currentErrorCount,
        })
      }
    }

    log.debug('开始 Papa Parse 解析 - 优化大文件处理')
    Papa.parse<Record<string, string>>(sourceFile, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: true,
      // 优化大文件处理：增大块大小以提高性能
      chunkSize: sourceFile.size > 50 * 1024 * 1024 ? 1024 * 256 : 1024 * 64, // 大文件使用更大的块
      chunk: (results, parser) => {
        try {
          log.debug('处理批次数据', { rowCount: results.data?.length || 0 })

          // 检查表头字段（仅检查一次）
          if (!headersChecked) {
            headersChecked = true

            // 提取字段列表
            const presentFields = extractFieldsFromParseResult(
              results.meta,
              results.data?.[0]
            )

            // 验证表头
            const headerValidation = validateCSVHeaders(presentFields)
            if (!headerValidation.valid) {
              parser.abort()
              reject(new Error(headerValidation.error || 'CSV 表头验证失败'))
              return
            }
          }

          // 检查数据是否存在且为数组
          if (!results.data || !Array.isArray(results.data)) {
            log.warn('CSV 解析批次数据为空或格式错误', results)
            return
          }

          const batchData = results.data
          log.debug('开始处理数据行', { rowCount: batchData.length })

          // 优化大数据量处理：批量处理数据行
          const BATCH_SIZE = 1000 // 每批处理1000行
          for (let i = 0; i < batchData.length; i += BATCH_SIZE) {
            const batch = batchData.slice(i, i + BATCH_SIZE)

            batch.forEach(row => {
              if (
                row &&
                typeof row === 'object' &&
                Object.keys(row).length > 0
              ) {
                const globalIndex = rows.length
                const { data, errors } = transformCSVRow(row, globalIndex)

                rows.push(data as Record<string, unknown>)
                processedRows++

                if (errors.length > 0) {
                  transformErrors.push({
                    row: globalIndex + 1,
                    errors,
                  })

                  // 记录前几个错误的详细信息
                  if (transformErrors.length <= 5) {
                    log.warn('数据转换错误', {
                      rowIndex: globalIndex + 1,
                      errors,
                      rawData: row,
                    })
                  }
                }
              }
            })

            // 每处理一批数据后更新进度
            const progress = Math.min(
              (processedRows / (sourceFile.size / 1000)) * 50,
              50
            )
            updateProgress('parsing', progress)

            // 给浏览器一个喘息的机会，避免阻塞UI
            if (i % (BATCH_SIZE * 10) === 0) {
              setTimeout(() => {}, 0)
            }
          }

          if (typeof results.meta?.cursor === 'number') {
            const progress = (results.meta.cursor / sourceFile.size) * 80
            updateProgress('parsing', progress)
          }

          log.debug('批次处理完成', { processedRows })
        } catch (error) {
          log.error('CSV 解析批次处理错误', error)
          parser.abort()
          reject(
            new Error(
              `CSV 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
          )
        }
      },
      complete: async () => {
        try {
          log.debug('Papa Parse 完成', { totalRows: rows.length })

          if (!rows || rows.length === 0) {
            log.error('CSV 文件为空或没有有效数据')
            reject(new Error('CSV 文件为空或没有有效数据'))
            return
          }

          updateProgress('validating', 85)
          log.debug('开始 Zod 验证')
          const validationResult = validateRecords(rows)
          log.debug('Zod 验证完成', {
            validRecords: validationResult.validRecords,
            invalidRecords: validationResult.invalidRecords.length,
          })

          updateProgress('transforming', 95)
          updateProgress('transforming', 100)

          const parseTime = performance.now() - startTime
          const processingSpeed = Math.round((processedRows / parseTime) * 1000)

          const allErrors = [
            ...transformErrors.map(err => ({
              row: err.row,
              message: err.errors.join('; '),
              severity: 'warning' as const,
            })),
            ...validationResult.invalidRecords.map(invalid => ({
              row: invalid.index + 1,
              message: invalid.errors.join('; '),
              severity: 'error' as const,
            })),
          ]

          log.info('解析完成', {
            success: validationResult.validRecords > 0,
            totalErrors: allErrors.length,
          })

          resolve({
            success: validationResult.validRecords > 0,
            data: validationResult.validData as InsuranceRecord[],
            errors: allErrors,
            stats: {
              totalRows: processedRows,
              validRows: validationResult.validRecords,
              invalidRows:
                validationResult.invalidRecords.length + transformErrors.length,
              parseTime: Math.round(parseTime),
              fileSize: sourceFile.size,
              processingSpeed,
              encoding: encodingLabel,
            },
          })
        } catch (error) {
          log.error('数据验证失败', error)
          reject(
            new Error(
              `数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
          )
        }
      },
      error: error => {
        log.error('Papa Parse 错误', error)
        reject(new Error(`CSV 解析失败: ${error.message || '未知错误'}`))
      },
    })
  })
}

// 重新导出验证和导出函数，保持向后兼容
export { validateCSVFile, exportToCSV }
