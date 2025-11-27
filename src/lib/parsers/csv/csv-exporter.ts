/**
 * CSV 导出器
 * 将数据导出为 CSV 格式文件
 */

import Papa from 'papaparse'
import type { InsuranceRecord } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('CSVExporter')

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 文件名（默认：导出数据.csv） */
  filename?: string
  /** 是否添加 UTF-8 BOM（默认：true，用于 Excel 正确识别编码） */
  includeBOM?: boolean
  /** 是否包含表头（默认：true） */
  includeHeader?: boolean
  /** 自定义字段顺序（默认：按数据对象的键顺序） */
  fieldOrder?: string[]
  /** 字段映射：用于自定义导出的列名 */
  fieldLabels?: Record<string, string>
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean
  filename: string
  recordCount: number
  fileSize: number
  error?: string
}

/**
 * 导出数据为 CSV 文件
 * @param data 要导出的数据
 * @param options 导出选项
 * @returns 导出结果
 */
export function exportToCSV(
  data: InsuranceRecord[],
  options: ExportOptions = {}
): ExportResult {
  try {
    const {
      filename = '导出数据.csv',
      includeBOM = true,
      includeHeader = true,
      fieldOrder,
      fieldLabels,
    } = options

    log.info('开始导出数据', {
      recordCount: data.length,
      filename,
      includeHeader,
    })

    if (data.length === 0) {
      throw new Error('没有数据可导出')
    }

    // 如果指定了字段顺序，重新组织数据
    let processedData = data
    if (fieldOrder && fieldOrder.length > 0) {
      processedData = data.map(record => {
        const ordered: Record<string, unknown> = {}
        fieldOrder.forEach(field => {
          ordered[field] = record[field as keyof InsuranceRecord]
        })
        return ordered as InsuranceRecord
      })
    }

    // 如果指定了字段映射，转换列名
    if (fieldLabels && Object.keys(fieldLabels).length > 0) {
      processedData = processedData.map(record => {
        const labeled: Record<string, unknown> = {}
        Object.entries(record).forEach(([key, value]) => {
          const newKey = fieldLabels[key] || key
          labeled[newKey] = value
        })
        return labeled as InsuranceRecord
      })
    }

    // 使用 Papa Parse 转换为 CSV 字符串
    const csv = Papa.unparse(processedData, {
      header: includeHeader,
      skipEmptyLines: true,
    })

    // 添加 UTF-8 BOM（Excel 需要 BOM 来正确识别 UTF-8 编码）
    const csvContent = includeBOM ? '\uFEFF' + csv : csv
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // 创建下载链接并触发下载
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    log.info('导出完成', {
      recordCount: data.length,
      filename,
      fileSize: blob.size,
    })

    return {
      success: true,
      filename,
      recordCount: data.length,
      fileSize: blob.size,
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : '导出失败：未知错误'
    log.error('导出失败', error)
    return {
      success: false,
      filename: options.filename || '导出数据.csv',
      recordCount: 0,
      fileSize: 0,
      error: errorMsg,
    }
  }
}

/**
 * 导出数据为 CSV 字符串（不触发下载）
 * @param data 要导出的数据
 * @param options 导出选项
 * @returns CSV 字符串
 */
export function exportToCSVString(
  data: InsuranceRecord[],
  options: Pick<ExportOptions, 'includeHeader' | 'includeBOM'> = {}
): string {
  const { includeHeader = true, includeBOM = true } = options

  log.debug('转换数据为CSV字符串', { recordCount: data.length })

  if (data.length === 0) {
    return ''
  }

  const csv = Papa.unparse(data, {
    header: includeHeader,
    skipEmptyLines: true,
  })

  return includeBOM ? '\uFEFF' + csv : csv
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}
