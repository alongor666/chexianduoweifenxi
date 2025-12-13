/**
 * @owner 飞书
 * @status 重构完成
 * @doc See [FEAT-P0-01: CSV数据导入与验证](../../开发文档/01_features/FEAT-P0-01_data-import.md)
 * @doc See [FEAT-P1-05: 批量导入优化 (并行处理)](../../开发文档/01_features/FEAT-P1-05_parallel-file-import.md)
 *
 * 文件上传钩子 - 精简版
 * 只负责UI状态管理和用户反馈，业务逻辑已移至应用层
 */

import { useState, useCallback } from 'react'
import {
  UploadDataUseCase,
  type UploadConfig,
  type UploadResult,
  type UploadProgress,
} from '@/application'
import { useAppStore } from '@/store/use-app-store'

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
 * 文件上传结果
 */
export interface FileUploadResult {
  file: File
  success: boolean
  result?: UploadResult
  error?: string
  uploadTime: number
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
}

/**
 * 上传进度信息 - UI层
 */
export interface UIUploadProgress {
  currentFile: number
  totalFiles: number
  fileName: string
  fileProgress: number
  overallProgress: number
  currentPhase:
    | 'parsing'
    | 'validating'
    | 'transforming'
    | 'storing'
    | 'completed'
  estimatedTimeRemaining?: number
  processedRows: number
  totalRows?: number
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
  console.log(`[${type.toUpperCase()}] ${message}`)
  // 这里可以集成实际的通知系统
}

/**
 * 将应用层进度转换为UI层进度
 */
function convertToUIProgress(
  appProgress: UploadProgress,
  currentFile: number,
  totalFiles: number
): UIUploadProgress {
  return {
    currentFile,
    totalFiles,
    fileName: appProgress.currentItem || '',
    fileProgress: appProgress.percentage,
    overallProgress: Math.round(
      ((currentFile - 1) * 100 + appProgress.percentage) / totalFiles
    ),
    currentPhase: appProgress.phase,
    estimatedTimeRemaining: appProgress.estimatedTimeRemaining,
    processedRows: appProgress.processedRows,
    totalRows: appProgress.totalRows,
  }
}

/**
 * 文件上传钩子
 */
export function useFileUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState<UIUploadProgress | null>(null)
  const [batchResult, setBatchResult] = useState<BatchUploadResult | null>(null)
  const [validationOptions, setValidationOptions] =
    useState<FileValidationOptions>(DEFAULT_VALIDATION_OPTIONS)

  const { setRawData: _setRawData, setError, setLoading } = useAppStore()

  /**
   * 验证文件
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // 检查文件大小
      if (file.size > validationOptions.maxFileSize) {
        return `文件大小超过限制 (${Math.round(validationOptions.maxFileSize / 1024 / 1024)}MB)`
      }

      // 检查文件扩展名
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!validationOptions.allowedExtensions.includes(fileExtension)) {
        return `不支持的文件类型，仅支持: ${validationOptions.allowedExtensions.join(', ')}`
      }

      // 检查文件名格式（如果启用）
      if (validationOptions.validateFileName) {
        const fileNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        if (!fileNamePattern.test(fileNameWithoutExt)) {
          return '文件名包含非法字符，仅支持中文、英文、数字、下划线和连字符'
        }
      }

      return null
    },
    [validationOptions]
  )

  /**
   * 上传单个文件
   */
  const uploadFile = useCallback(
    async (
      file: File,
      config: UploadConfig = {},
      position?: {
        currentFile: number
        totalFiles: number
      }
    ): Promise<FileUploadResult> => {
      const startTime = Date.now()
      const currentFileIndex = position?.currentFile ?? 1
      const totalFiles = position?.totalFiles ?? 1

      try {
        setStatus('uploading')
        setLoading(true)

        // 验证文件
        const validationError = validateFile(file)
        if (validationError) {
          setStatus('error')
          setError(new Error(validationError))
          showNotification('error', validationError)

          return {
            file,
            success: false,
            error: validationError,
            uploadTime: Date.now() - startTime,
          }
        }

        // 使用应用层用例处理上传
        const uploadUseCase = new UploadDataUseCase()
        const result = await uploadUseCase.execute(
          file,
          config,
          appProgress => {
            // 转换进度信息并更新UI状态
            const uiProgress = convertToUIProgress(
              appProgress,
              currentFileIndex,
              totalFiles
            )
            setProgress(uiProgress)

            // 更新状态
            switch (appProgress.phase) {
              case 'parsing':
                setStatus('parsing')
                break
              case 'validating':
                setStatus('validating')
                break
              case 'storing':
                setStatus('uploading')
                break
            }
          }
        )

        if (result.success) {
          setStatus('success')
          showNotification(
            'success',
            `成功上传 ${result.successRecords} 条记录`
          )

          // 如果有警告，显示警告信息
          if (result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              showNotification('warning', warning)
            })
          }
        } else {
          setStatus('error')
          setError(new Error(result.errors.map(e => e.message).join('; ')))
          showNotification('error', '上传失败，请检查文件格式')
        }

        return {
          file,
          success: result.success,
          result,
          uploadTime: Date.now() - startTime,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        setStatus('error')
        setError(new Error(errorMessage))
        showNotification('error', `上传过程中发生错误: ${errorMessage}`)

        return {
          file,
          success: false,
          error: errorMessage,
          uploadTime: Date.now() - startTime,
        }
      } finally {
        setLoading(false)
        setProgress(null)
      }
    },
    [validateFile, setError, setLoading]
  )

  /**
   * 批量上传文件
   */
  const uploadFiles = useCallback(
    async (
      files: File[],
      config: UploadConfig = {}
    ): Promise<BatchUploadResult> => {
      const startTime = Date.now()
      const results: FileUploadResult[] = []
      let successCount = 0
      let failureCount = 0
      let totalRecords = 0
      let validRecords = 0
      let invalidRecords = 0
      let completedFiles = 0

      try {
        setStatus('uploading')
        setLoading(true)

        // 验证文件数量
        if (files.length > validationOptions.maxFiles) {
          const errorMessage = `文件数量超过限制，最多允许 ${validationOptions.maxFiles} 个文件`
          setStatus('error')
          setError(new Error(errorMessage))
          showNotification('error', errorMessage)

          return {
            totalFiles: files.length,
            successCount: 0,
            failureCount: files.length,
            results: [],
            totalTime: 0,
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
          }
        }

        const concurrency = Math.max(1, Math.min(3, config.concurrency ?? 2))
        const queue = files.map((file, index) => ({ file, index }))

        const processNext = async (): Promise<void> => {
          const item = queue.shift()
          if (!item) return

          const { file, index } = item

          setProgress({
            currentFile: index + 1,
            totalFiles: files.length,
            fileName: file.name,
            fileProgress: 0,
            overallProgress: Math.round((completedFiles / files.length) * 100),
            currentPhase: 'parsing',
            processedRows: 0,
          })

          const result = await uploadFile(file, config, {
            currentFile: index + 1,
            totalFiles: files.length,
          })

          results[index] = result

          if (result.success) {
            successCount++
            totalRecords += result.result?.processedRecords || 0
            validRecords += result.result?.successRecords || 0
            invalidRecords += result.result?.failedRecords || 0
          } else {
            failureCount++
          }

          completedFiles++

          setProgress({
            currentFile: index + 1,
            totalFiles: files.length,
            fileName: file.name,
            fileProgress: 100,
            overallProgress: Math.round((completedFiles / files.length) * 100),
            currentPhase: 'completed',
            processedRows: result.result?.processedRecords || 0,
            totalRows: result.result?.processedRecords,
            errorCount: result.result?.failedRecords,
          })

          await processNext()
        }

        const workers = Array.from(
          { length: Math.min(concurrency, files.length) },
          () => processNext()
        )

        await Promise.all(workers)

        const batchResult: BatchUploadResult = {
          totalFiles: files.length,
          successCount,
          failureCount,
          results,
          totalTime: Date.now() - startTime,
          totalRecords,
          validRecords,
          invalidRecords,
        }

        setBatchResult(batchResult)
        setStatus('success')

        // 显示批量上传结果
        if (failureCount === 0) {
          showNotification(
            'success',
            `所有文件上传成功，共处理 ${validRecords} 条记录`
          )
        } else {
          showNotification(
            'warning',
            `上传完成：${successCount} 个文件成功，${failureCount} 个文件失败，共处理 ${validRecords} 条有效记录`
          )
        }

        return batchResult
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        setStatus('error')
        setError(new Error(errorMessage))
        showNotification('error', `批量上传过程中发生错误: ${errorMessage}`)

        return {
          totalFiles: files.length,
          successCount,
          failureCount,
          results,
          totalTime: Date.now() - startTime,
          totalRecords,
          validRecords,
          invalidRecords,
        }
      } finally {
        setLoading(false)
        setProgress(null)
      }
    },
    [validationOptions.maxFiles, uploadFile, setError, setLoading]
  )

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(null)
    setBatchResult(null)
    setError(null)
  }, [setError])

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null)
    if (status === 'error') {
      setStatus('idle')
    }
  }, [status, setError])

  return {
    // 状态
    status,
    progress,
    batchResult,
    validationOptions,

    // 操作
    uploadFile,
    uploadFiles,
    validateFile,
    reset,
    clearError,

    // 配置
    setValidationOptions,

    // 计算属性
    isUploading:
      status === 'uploading' || status === 'parsing' || status === 'validating',
    hasError: status === 'error',
    hasSuccess: status === 'success',
    isIdle: status === 'idle',
  }
}
