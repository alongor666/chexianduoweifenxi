/**
 * 数据导出器接口（Data Exporter Port）
 *
 * 定义数据导出的抽象接口。
 * 具体实现可以是：CSV Exporter、PDF Exporter、Excel Exporter 等。
 *
 * @layer Application
 * @depends Domain (InsuranceRecord, KPIResult)
 */

import type { InsuranceRecord, KPIResult } from '../../domain'

/**
 * 数据导出器接口
 *
 * 负责将业务数据导出为不同格式的文件。
 */
export interface IExporter {
  /**
   * 导出为 CSV 格式
   * @param data - 保险记录数组
   * @param options - 导出选项
   * @returns Promise<Blob> - CSV 文件的 Blob 对象
   */
  exportToCSV(data: InsuranceRecord[], options?: ExportOptions): Promise<Blob>

  /**
   * 导出为 PDF 格式
   * @param data - 保险记录数组
   * @param kpis - KPI 计算结果（可选）
   * @param options - 导出选项
   * @returns Promise<Blob> - PDF 文件的 Blob 对象
   */
  exportToPDF(
    data: InsuranceRecord[],
    kpis?: KPIResult,
    options?: ExportOptions
  ): Promise<Blob>

  /**
   * 导出 KPI 报告
   * @param kpis - KPI 计算结果
   * @param format - 导出格式
   * @param options - 导出选项
   * @returns Promise<Blob> - 报告文件的 Blob 对象
   */
  exportKPIReport(
    kpis: KPIResult,
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<Blob>
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 文件名（不含扩展名） */
  fileName?: string

  /** 是否包含表头 */
  includeHeaders?: boolean

  /** 日期格式 */
  dateFormat?: string

  /** 数字格式 */
  numberFormat?: {
    decimals?: number
    thousandsSeparator?: string
    decimalSeparator?: string
  }

  /** 列配置 */
  columns?: ColumnConfig[]

  /** 页面设置（PDF 专用） */
  pageSettings?: PageSettings
}

/**
 * 列配置
 */
export interface ColumnConfig {
  /** 字段键名 */
  key: string

  /** 列标题 */
  header: string

  /** 列宽度（仅适用于某些格式） */
  width?: number

  /** 是否显示 */
  visible?: boolean

  /** 格式化函数 */
  formatter?: (value: unknown) => string
}

/**
 * 页面设置（PDF 专用）
 */
export interface PageSettings {
  /** 页面尺寸 */
  size?: 'A4' | 'A3' | 'Letter'

  /** 页面方向 */
  orientation?: 'portrait' | 'landscape'

  /** 页边距 */
  margins?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

/**
 * 导出格式
 */
export enum ExportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
}
