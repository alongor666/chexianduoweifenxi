/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P0-01: CSV数据导入与验证](../../开发文档/01_features/FEAT-P0-01_data-import.md)
 * @doc See [FEAT-P1-05: 批量导入优化 (并行处理)](../../开发文档/01_features/FEAT-P1-05_parallel-file-import.md)
 *
 * 文件上传钩子 - 优化版
 * 支持批量上传、错误恢复、进度跟踪和性能优化
 */

import { useState, useCallback } from 'react'
import {
  parseCSVFile,
  type CSVParseResult,
  type ProgressCallback,
} from '@/lib/parsers/csv-parser'
import { useAppStore } from '@/store/use-app-store'
import {
  extractWeeksFromRecords,
  analyzeWeekConflicts,
  filterRecordsByNewWeeks,
  formatWeekRange,
  type WeekInfo,
} from '@/lib/storage/data-persistence'
import { logger } from '@/lib/logger'

const log = logger.create('FileUpload')

/**
 * 上传状态
 */
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'validating'
  | 'success'
  | 'error'

/**
 * 周次导入结果
 */
export interface WeekImportResult {
  weekNumber: number
  year: number
  status: 'success' | 'skipped' | 'failed'
  recordCount: number
  error?: string
  skipReason?: string
}

/**
 * 文件上传结果
 */
export interface FileUploadResult {
  file: File
  success: boolean
  result?: CSVParseResult
  error?: string
  uploadTime: number
  weekInfo?: {
    detectedWeeks: WeekInfo[]
    newWeeks: WeekInfo[]
    conflictWeeks: WeekInfo[]
    weekResults: WeekImportResult[]
  }
}

/**
 * 批量上传结果
 */
export interface BatchUploadResult {
  totalFiles: number
  successCount: number
  failureCount: number
  results: FileUploadResult[]
  totalTime: number
  totalRecords: number
  validRecords: number
  invalidRecords: number
  weekAnalysis?: {
    totalWeeks: number
    newWeeks: number
    skippedWeeks: number
    weekResults: WeekImportResult[]
  }
}

/**
 * 上传进度信息 - 增强版
 */
export interface UploadProgress {
  currentFile: number
  totalFiles: number
  fileName: string
  fileProgress: number
  overallProgress: number
  currentPhase: 'parsing' | 'validating' | 'transforming'
  estimatedTimeRemaining?: number
  processingSpeed?: number
  processedRows: number
  totalRows?: number
  memoryUsage?: number
  errorCount?: number
}

/**
 * 文件验证选项
 */
export interface FileValidationOptions {
  maxFileSize: number // 最大文件大小（字节）
  allowedExtensions: string[] // 允许的文件扩展名
  maxFiles: number // 最大文件数量
  validateFileName: boolean // 是否验证文件名格式
}

/**
 * 默认验证选项
 */
const DEFAULT_VALIDATION_OPTIONS: FileValidationOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.csv'],
  maxFiles: 10,
  validateFileName: false, // 文件名不再是强制要求
}

/**
 * 显示通知的辅助函数
 */
const showNotification = (
  type: 'success' | 'warning' | 'error',
  message: string
) => {
  const logFn = type === 'error' ? log.error : type === 'warning' ? log.warn : log.info
  logFn(message)
  // 这里可以集成实际的通知系统
}

/**
 * 文件上传钩子
 */
export function useFileUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [batchResult, setBatchResult] = useState<BatchUploadResult | null>(null)
  const [validationOptions, setValidationOptions] =
    useState<FileValidationOptions>(DEFAULT_VALIDATION_OPTIONS)

  const { setRawData, appendRawData, setError, setLoading } = useAppStore()
  const rawData = useAppStore(state => state.rawData)

  /**
   * 验证单个文件
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // 检查文件大小
      if (file.size > validationOptions.maxFileSize) {
        return {
          valid: false,
          error: `文件大小超过限制 (${Math.round(validationOptions.maxFileSize / 1024 / 1024)}MB)`,
        }
      }

      // 检查文件扩展名
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!validationOptions.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `不支持的文件格式，仅支持: ${validationOptions.allowedExtensions.join(', ')}`,
        }
      }

      // 可选的文件名验证（不再强制）
      if (validationOptions.validateFileName) {
        const namePattern = /^保险数据_\d{4}年\d{1,2}月.*\.csv$/i
        if (!namePattern.test(file.name)) {
          // 仅显示警告，不阻止上传
          log.warn('文件名建议格式: 保险数据_YYYY年M月_描述.csv', { fileName: file.name })
        }
      }

      return { valid: true }
    },
    [validationOptions]
  )

  /**
   * 验证文件列表
   */
  const validateFiles = useCallback(
    (files: File[]): { valid: boolean; errors: string[] } => {
      const errors: string[] = []

      // 检查文件数量
      if (files.length > validationOptions.maxFiles) {
        errors.push(`文件数量超过限制 (最多${validationOptions.maxFiles}个)`)
      }

      // 检查重复文件名
      const fileNames = files.map(f => f.name)
      const duplicates = fileNames.filter(
        (name, index) => fileNames.indexOf(name) !== index
      )
      if (duplicates.length > 0) {
        errors.push(
          `发现重复文件: ${Array.from(new Set(duplicates)).join(', ')}`
        )
      }

      // 验证每个文件
      files.forEach((file, index) => {
        const validation = validateFile(file)
        if (!validation.valid) {
          errors.push(`文件 ${index + 1} (${file.name}): ${validation.error}`)
        }
      })

      return {
        valid: errors.length === 0,
        errors,
      }
    },
    [validateFile, validationOptions]
  )

  /**
   * 上传单个文件
   */
  const uploadSingleFile = useCallback(
    async (
      file: File,
      fileIndex: number,
      totalFiles: number
    ): Promise<FileUploadResult> => {
      const startTime = performance.now()

      try {
        // 创建进度回调 - 增强版
        const onProgress: ProgressCallback = progressInfo => {
          const overallProgress =
            (fileIndex / totalFiles) * 100 +
            (progressInfo.percentage / 100) * (100 / totalFiles)

          // 估算内存使用量
          const estimatedMemoryUsage = progressInfo.processedRows
            ? Math.round((progressInfo.processedRows * 26 * 50) / (1024 * 1024)) // 假设每行26个字段，每字段平均50字符
            : undefined

          setProgress({
            currentFile: fileIndex + 1,
            totalFiles,
            fileName: file.name,
            fileProgress: progressInfo.percentage,
            overallProgress: Math.min(overallProgress, 99),
            currentPhase:
              progressInfo.currentPhase === 'parsing'
                ? 'parsing'
                : progressInfo.currentPhase === 'validating'
                  ? 'validating'
                  : 'transforming',
            estimatedTimeRemaining: progressInfo.estimatedTimeRemaining,
            processingSpeed:
              progressInfo.processedRows > 0
                ? Math.round(
                    progressInfo.processedRows /
                      ((performance.now() - startTime) / 1000)
                  )
                : undefined,
            processedRows: progressInfo.processedRows,
            totalRows: progressInfo.totalRows,
            memoryUsage: estimatedMemoryUsage,
            errorCount: progressInfo.errorCount || 0,
          })
        }

        // 解析文件
        const result = await parseCSVFile(file, onProgress)
        const uploadTime = performance.now() - startTime

        return {
          file,
          success: result.success,
          result,
          uploadTime: Math.round(uploadTime),
        }
      } catch (error) {
        const uploadTime = performance.now() - startTime
        const errorMessage = error instanceof Error ? error.message : '未知错误'

        return {
          file,
          success: false,
          error: errorMessage,
          uploadTime: Math.round(uploadTime),
        }
      }
    },
    []
  )

  /**
   * 批量上传文件 - 支持并行处理
   */
  const uploadFiles = useCallback(
    async (files: File[], parallel = true): Promise<BatchUploadResult> => {
      log.info('开始上传文件', {
        fileCount: files.length,
        mode: parallel ? '并行' : '顺序',
        fileNames: files.map(f => f.name),
      })
      const batchStartTime = performance.now()

      try {
        setStatus('uploading')
        setError(null)
        setLoading(true)
        setBatchResult(null)
        let currentRawData = rawData

        // 验证文件
        log.debug('开始文件验证')
        const validation = validateFiles(files)
        if (!validation.valid) {
          log.error('文件验证失败', { errors: validation.errors })
          throw new Error(`文件验证失败:\n${validation.errors.join('\n')}`)
        }
        log.debug('文件验证通过')

        let results: FileUploadResult[] = []
        let totalRecords = 0
        let validRecords = 0
        let invalidRecords = 0

        // 并行处理模式
        if (parallel && files.length > 1) {
          log.debug('使用并行处理模式')
          setStatus('parsing')

          // 使用Promise.all并行处理所有文件
          const uploadPromises = files.map((file, index) =>
            uploadSingleFile(file, index, files.length)
          )

          results = await Promise.all(uploadPromises)
          log.debug('所有文件并行处理完成')
        } else {
          // 顺序处理模式（向后兼容）
          log.debug('使用顺序处理模式')
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            log.debug('处理文件', {
              current: i + 1,
              total: files.length,
              fileName: file.name,
            })

            setStatus('parsing')
            const result = await uploadSingleFile(file, i, files.length)
            results.push(result)
          }
        }

        // 收集所有周次导入结果
        const allWeekResults: WeekImportResult[] = []

        // 统计结果并处理周次去重
        for (const result of results) {
          log.debug('文件处理完成', {
            fileName: result.file.name,
            success: result.success,
            error: result.error,
            uploadTime: result.uploadTime,
          })

          // 如果有成功的文件，进行周次分析和去重
          if (result.success && result.result) {
            // 1. 检测文件中包含的周次
            const detectedWeeks = extractWeeksFromRecords(result.result.data)
            log.debug('检测到周次', {
              fileName: result.file.name,
              weekCount: detectedWeeks.length,
              weeks: detectedWeeks.map(w => `${w.year}年第${w.weekNumber}周`).join(', '),
            })

            // 2. 分析周次冲突
            const { newWeeks, conflictWeeks } = analyzeWeekConflicts(detectedWeeks, currentRawData)
            log.debug('周次分析', {
              newWeekCount: newWeeks.length,
              conflictWeekCount: conflictWeeks.length,
            })

            if (newWeeks.length > 0) {
              log.debug('新周次', {
                weeks: newWeeks.map(w => `${w.year}年第${w.weekNumber}周`).join(', '),
              })
            }

            if (conflictWeeks.length > 0) {
              log.debug('冲突周次(将跳过)', {
                weeks: conflictWeeks.map(w => `${w.year}年第${w.weekNumber}周`).join(', '),
              })
            }

            // 3. 过滤数据，只保留新周次的记录
            const filteredData = filterRecordsByNewWeeks(result.result.data, newWeeks)
            log.debug('过滤后保留记录', {
              filteredCount: filteredData.length,
              originalCount: result.result.data.length,
            })

            // 4. 生成周次导入结果
            const weekResults: WeekImportResult[] = []

            // 成功导入的新周次
            newWeeks.forEach(week => {
              weekResults.push({
                weekNumber: week.weekNumber,
                year: week.year,
                status: 'success',
                recordCount: week.recordCount,
              })
            })

            // 跳过的冲突周次
            conflictWeeks.forEach(week => {
              weekResults.push({
                weekNumber: week.weekNumber,
                year: week.year,
                status: 'skipped',
                recordCount: week.recordCount,
                skipReason: '该周次数据已存在',
              })
            })

            // 保存周次信息到结果中
            result.weekInfo = {
              detectedWeeks,
              newWeeks,
              conflictWeeks,
              weekResults,
            }

            allWeekResults.push(...weekResults)

            // 5. 添加过滤后的数据到存储
            if (filteredData.length > 0) {
              log.info('添加有效记录到存储', { count: filteredData.length })

              if (currentRawData.length === 0) {
                // 首次上传，直接设置
                setRawData(filteredData)
              } else {
                // 后续上传，追加数据
                appendRawData(filteredData)
              }

              // 同步更新本地快照，保证同批次后续文件基于最新数据进行冲突检测
              currentRawData = [...currentRawData, ...filteredData]

              // 统计实际导入的记录数
              validRecords += filteredData.length
            } else {
              log.warn('所有周次都已存在，跳过导入', { fileName: result.file.name })
            }

            // 统计总记录数（包括被跳过的）
            totalRecords += result.result.stats.totalRows
            invalidRecords += result.result.stats.invalidRows
          } else {
            // 失败的文件
            if (result.result) {
              totalRecords += result.result.stats.totalRows
              invalidRecords += result.result.stats.invalidRows
            }

            log.warn('没有有效数据可添加', { fileName: result.file.name })
          }
        }

        const totalTime = performance.now() - batchStartTime
        const successCount = results.filter(r => r.success).length
        const failureCount = results.length - successCount

        // 计算周次分析汇总
        const successfulWeeks = allWeekResults.filter(w => w.status === 'success')
        const skippedWeeks = allWeekResults.filter(w => w.status === 'skipped')

        const batchResult: BatchUploadResult = {
          totalFiles: files.length,
          successCount,
          failureCount,
          results,
          totalTime: Math.round(totalTime),
          totalRecords,
          validRecords,
          invalidRecords,
          weekAnalysis: allWeekResults.length > 0 ? {
            totalWeeks: allWeekResults.length,
            newWeeks: successfulWeeks.length,
            skippedWeeks: skippedWeeks.length,
            weekResults: allWeekResults,
          } : undefined,
        }

        setBatchResult(batchResult)

        // 更新最终进度
        setProgress({
          currentFile: files.length,
          totalFiles: files.length,
          fileName: '完成',
          fileProgress: 100,
          overallProgress: 100,
          currentPhase: 'transforming',
          processedRows: totalRecords,
          totalRows: totalRecords,
          errorCount: invalidRecords,
        })

        log.info('批量上传完成统计', {
          totalFiles: files.length,
          successCount,
          failureCount,
          totalRecords,
          validRecords,
          invalidRecords,
          totalTime: Math.round(totalTime) + 'ms',
          weekAnalysis: batchResult.weekAnalysis ? {
            totalWeeks: batchResult.weekAnalysis.totalWeeks,
            newWeeks: batchResult.weekAnalysis.newWeeks,
            skippedWeeks: batchResult.weekAnalysis.skippedWeeks,
          } : '无周次信息',
        })

        // 显示结果通知
        if (successCount === files.length) {
          setStatus('success')
          if (invalidRecords > 0) {
            showNotification(
              'warning',
              `成功上传 ${successCount} 个文件，但存在 ${invalidRecords} 条无效记录`
            )
          } else {
            showNotification(
              'success',
              `成功上传 ${successCount} 个文件，共 ${validRecords} 条有效记录`
            )
          }
        } else if (successCount > 0) {
          setStatus('success')
          showNotification(
            'warning',
            `部分成功：${successCount}/${files.length} 个文件上传成功，${invalidRecords} 条无效记录`
          )
        } else {
          setStatus('error')
          log.error('所有文件上传失败')
          showNotification('error', '所有文件上传失败')
        }

        return batchResult
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '批量上传失败'
        log.error('批量上传过程中发生错误', error)
        setError(new Error(errorMessage))
        setStatus('error')
        showNotification('error', errorMessage)

        throw error
      } finally {
        setLoading(false)
        log.debug('上传流程结束')
        // 3秒后清除进度信息
        setTimeout(() => {
          setProgress(null)
        }, 3000)
      }
    },
    [uploadSingleFile, validateFiles, setRawData, appendRawData, rawData, setError, setLoading]
  )

  /**
   * 重置上传状态
   */
  const resetUpload = useCallback(() => {
    setStatus('idle')
    setProgress(null)
    setBatchResult(null)
    setError(null)
  }, [setError])

  /**
   * 更新验证选项
   */
  const updateValidationOptions = useCallback(
    (options: Partial<FileValidationOptions>) => {
      setValidationOptions(prev => ({ ...prev, ...options }))
    },
    []
  )

  return {
    // 状态
    status,
    progress,
    batchResult,
    validationOptions,

    // 方法
    uploadFiles,
    validateFile,
    validateFiles,
    resetUpload,
    updateValidationOptions,

    // 计算属性
    isUploading:
      status === 'uploading' || status === 'parsing' || status === 'validating',
    isSuccess: status === 'success',
    isError: status === 'error',
    hasResults: batchResult !== null,
  }
}
