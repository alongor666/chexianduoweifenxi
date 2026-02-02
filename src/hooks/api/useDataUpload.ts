/**
 * 数据上传 Hook
 * 提供数据上传和导入功能
 */

'use client'

import { useState, useCallback } from 'react'
import { createRecords, type CreateRecordsRequest } from '@/lib/api'
import type { InsuranceRecord } from '@/types/insurance'
import { useAppStore } from '@/store/use-app-store'

interface UploadProgress {
  stage: 'idle' | 'parsing' | 'validating' | 'uploading' | 'completed' | 'error'
  progress: number // 0-100
  message: string
}

interface UploadResult {
  success: boolean
  processedCount: number
  successCount: number
  failedCount: number
  errors?: Array<{ index: number; message: string }>
}

interface UseDataUploadResult {
  upload: (records: Partial<InsuranceRecord>[]) => Promise<UploadResult>
  uploadProgress: UploadProgress
  isUploading: boolean
  error: string | null
  reset: () => void
}

/**
 * 数据上传 Hook
 *
 * 支持两种模式：
 * 1. 本地模式（默认）：直接存入 Store
 * 2. 远程模式：调用 API 上传到服务端
 */
export function useDataUpload(options?: {
  useLocalStorage?: boolean
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string) => void
}): UseDataUploadResult {
  const { useLocalStorage = true, onSuccess, onError } = options || {}

  const setRawData = useAppStore(state => state.setRawData)
  const appendRawData = useAppStore(state => state.appendRawData)

  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  })
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setProgress({ stage: 'idle', progress: 0, message: '' })
    setError(null)
  }, [])

  const upload = useCallback(
    async (records: Partial<InsuranceRecord>[]): Promise<UploadResult> => {
      reset()

      if (records.length === 0) {
        const errorMsg = 'No records to upload'
        setError(errorMsg)
        onError?.(errorMsg)
        return {
          success: false,
          processedCount: 0,
          successCount: 0,
          failedCount: 0,
          errors: [{ index: -1, message: errorMsg }],
        }
      }

      // 解析阶段
      setProgress({
        stage: 'parsing',
        progress: 10,
        message: '正在解析数据...',
      })

      // 验证阶段
      setProgress({
        stage: 'validating',
        progress: 30,
        message: '正在验证数据...',
      })

      // 简单验证
      const validRecords: InsuranceRecord[] = []
      const errors: Array<{ index: number; message: string }> = []

      for (let i = 0; i < records.length; i++) {
        const record = records[i]

        // 检查必需字段
        if (
          typeof record.signed_premium_yuan !== 'number' ||
          typeof record.policy_count !== 'number' ||
          !record.policy_start_year ||
          !record.week_number
        ) {
          errors.push({
            index: i,
            message: 'Missing required fields',
          })
          continue
        }

        validRecords.push(record as InsuranceRecord)
      }

      setProgress({
        stage: 'uploading',
        progress: 60,
        message: `正在处理 ${validRecords.length} 条记录...`,
      })

      if (useLocalStorage) {
        // 本地模式：存入 Store
        try {
          appendRawData(validRecords)

          const result: UploadResult = {
            success: true,
            processedCount: records.length,
            successCount: validRecords.length,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
          }

          setProgress({
            stage: 'completed',
            progress: 100,
            message: `成功导入 ${validRecords.length} 条记录`,
          })

          onSuccess?.(result)
          return result
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to save data'
          setError(errorMsg)
          setProgress({
            stage: 'error',
            progress: 0,
            message: errorMsg,
          })
          onError?.(errorMsg)

          return {
            success: false,
            processedCount: records.length,
            successCount: 0,
            failedCount: records.length,
            errors: [{ index: -1, message: errorMsg }],
          }
        }
      } else {
        // 远程模式：调用 API
        try {
          const request: CreateRecordsRequest = {
            records,
          }

          const response = await createRecords(request)

          if (response.success) {
            const result: UploadResult = {
              success: true,
              processedCount: response.data.processedCount,
              successCount: response.data.successCount,
              failedCount: response.data.failedCount,
              errors: response.data.errors,
            }

            setProgress({
              stage: 'completed',
              progress: 100,
              message: `成功上传 ${result.successCount} 条记录`,
            })

            onSuccess?.(result)
            return result
          } else {
            const errorMsg = (response as { success: false; error: { message: string } }).error.message
            setError(errorMsg)
            setProgress({
              stage: 'error',
              progress: 0,
              message: errorMsg,
            })
            onError?.(errorMsg)

            return {
              success: false,
              processedCount: records.length,
              successCount: 0,
              failedCount: records.length,
              errors: [{ index: -1, message: errorMsg }],
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Upload failed'
          setError(errorMsg)
          setProgress({
            stage: 'error',
            progress: 0,
            message: errorMsg,
          })
          onError?.(errorMsg)

          return {
            success: false,
            processedCount: records.length,
            successCount: 0,
            failedCount: records.length,
            errors: [{ index: -1, message: errorMsg }],
          }
        }
      }
    },
    [useLocalStorage, appendRawData, onSuccess, onError, reset]
  )

  return {
    upload,
    uploadProgress: progress,
    isUploading: progress.stage !== 'idle' && progress.stage !== 'completed' && progress.stage !== 'error',
    error,
    reset,
  }
}
