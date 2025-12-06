/**
 * 导出报告用例（Export Report Use Case）
 *
 * 负责数据和报告的导出功能。
 *
 * @layer Application
 * @depends Domain (InsuranceRecord, KPIResult)
 * @depends Ports (IDataRepository, IExporter)
 */

import type { IDataRepository, DataFilters } from '../ports/IDataRepository'
import type { IExporter, ExportOptions } from '../ports/IExporter'
import { ExportFormat } from '../ports/IExporter'
import type { InsuranceRecord, KPIResult } from '../../domain'
import { calculateKPIs } from '../../domain'

/**
 * 导出报告用例
 *
 * 编排数据获取、KPI 计算和文件导出的流程。
 */
export class ExportReportUseCase {
  constructor(
    private readonly repository: IDataRepository,
    private readonly exporter: IExporter
  ) {}

  /**
   * 导出数据
   *
   * @param format - 导出格式
   * @param filters - 数据筛选条件
   * @param options - 导出选项
   * @returns Promise<ExportResult> - 导出结果
   */
  async exportData(
    format: ExportFormat,
    filters?: DataFilters,
    options?: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 步骤 1: 获取数据
      const records = await this.getRecords(filters)

      if (records.length === 0) {
        throw new ExportError('NO_DATA', '没有可导出的数据')
      }

      // 步骤 2: 根据格式导出
      const blob = await this.exportByFormat(format, records, options)

      // 步骤 3: 生成文件名
      const fileName = this.generateFileName(format, options?.fileName)

      return {
        success: true,
        blob,
        fileName,
        recordCount: records.length,
        format,
      }
    } catch (error) {
      if (error instanceof ExportError) {
        throw error
      }
      throw new ExportError('EXPORT_FAILED', '导出失败', error)
    }
  }

  /**
   * 导出 KPI 报告
   *
   * @param format - 导出格式
   * @param filters - 数据筛选条件
   * @param options - 导出选项
   * @returns Promise<ExportResult> - 导出结果
   */
  async exportKPIReport(
    format: ExportFormat,
    filters?: DataFilters,
    options?: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 步骤 1: 获取数据
      const records = await this.getRecords(filters)

      if (records.length === 0) {
        throw new ExportError('NO_DATA', '没有可导出的数据')
      }

      // 步骤 2: 计算 KPI
      const kpis = calculateKPIs(records)

      // 步骤 3: 导出报告
      const blob = await this.exporter.exportKPIReport(kpis, format, options)

      // 步骤 4: 生成文件名
      const fileName = this.generateFileName(
        format,
        options?.fileName || 'kpi-report'
      )

      return {
        success: true,
        blob,
        fileName,
        recordCount: records.length,
        format,
        kpis,
      }
    } catch (error) {
      if (error instanceof ExportError) {
        throw error
      }
      throw new ExportError('KPI_EXPORT_FAILED', 'KPI 报告导出失败', error)
    }
  }

  /**
   * 导出数据和 KPI（综合报告）
   *
   * @param format - 导出格式（仅支持 PDF）
   * @param filters - 数据筛选条件
   * @param options - 导出选项
   * @returns Promise<ExportResult> - 导出结果
   */
  async exportComprehensiveReport(
    filters?: DataFilters,
    options?: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 步骤 1: 获取数据
      const records = await this.getRecords(filters)

      if (records.length === 0) {
        throw new ExportError('NO_DATA', '没有可导出的数据')
      }

      // 步骤 2: 计算 KPI
      const kpis = calculateKPIs(records)

      // 步骤 3: 导出综合报告（PDF）
      const blob = await this.exporter.exportToPDF(records, kpis, options)

      // 步骤 4: 生成文件名
      const fileName = this.generateFileName(
        ExportFormat.PDF,
        options?.fileName || 'comprehensive-report'
      )

      return {
        success: true,
        blob,
        fileName,
        recordCount: records.length,
        format: ExportFormat.PDF,
        kpis,
      }
    } catch (error) {
      if (error instanceof ExportError) {
        throw error
      }
      throw new ExportError(
        'COMPREHENSIVE_EXPORT_FAILED',
        '综合报告导出失败',
        error
      )
    }
  }

  /**
   * 获取数据记录
   */
  private async getRecords(filters?: DataFilters): Promise<InsuranceRecord[]> {
    if (!filters) {
      return await this.repository.findAll()
    }
    return await this.repository.findByFilters(filters)
  }

  /**
   * 根据格式导出
   */
  private async exportByFormat(
    format: ExportFormat,
    records: InsuranceRecord[],
    options?: ExportOptions
  ): Promise<Blob> {
    switch (format) {
      case ExportFormat.CSV:
        return await this.exporter.exportToCSV(records, options)
      case ExportFormat.PDF:
        return await this.exporter.exportToPDF(records, undefined, options)
      default:
        throw new ExportError('UNSUPPORTED_FORMAT', `不支持的导出格式: ${format}`)
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(
    format: ExportFormat,
    baseName?: string
  ): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const name = baseName || 'insurance-data'
    const extension = format.toLowerCase()
    return `${name}-${timestamp}.${extension}`
  }
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean

  /** 导出的文件 Blob */
  blob: Blob

  /** 文件名 */
  fileName: string

  /** 导出的记录数量 */
  recordCount: number

  /** 导出格式 */
  format: ExportFormat

  /** KPI 数据（如果包含） */
  kpis?: KPIResult
}

/**
 * 导出错误
 */
export class ExportError extends Error {
  constructor(
    public readonly code: ExportErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

/**
 * 导出错误代码
 */
export type ExportErrorCode =
  | 'NO_DATA'
  | 'EXPORT_FAILED'
  | 'KPI_EXPORT_FAILED'
  | 'COMPREHENSIVE_EXPORT_FAILED'
  | 'UNSUPPORTED_FORMAT'
