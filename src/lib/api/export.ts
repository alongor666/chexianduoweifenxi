/**
 * 数据导出 API 客户端
 */

import type { ExportRequest } from './types'
import type { FilterState, InsuranceRecord } from '@/types/insurance'

/**
 * 导出数据
 * 返回 Blob 用于下载
 */
export async function exportData(
  request: ExportRequest
): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
  try {
    const response = await fetch('/api/v1/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || 'Export failed',
      }
    }

    const blob = await response.blob()
    return { success: true, blob }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * 导出 CSV（便捷方法）
 */
export async function exportToCSV(
  filters?: Partial<FilterState>,
  columns?: Array<keyof InsuranceRecord>
): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
  return exportData({
    format: 'csv',
    filters,
    columns,
  })
}

/**
 * 触发下载
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出并下载 CSV
 */
export async function exportAndDownloadCSV(
  filters?: Partial<FilterState>,
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  const result = await exportToCSV(filters)

  if (!result.success) {
    return { success: false, error: (result as { success: false; error: string }).error }
  }

  const defaultFilename = `insurance_data_${new Date().toISOString().split('T')[0]}.csv`
  downloadBlob(result.blob, filename || defaultFilename)

  return { success: true }
}
