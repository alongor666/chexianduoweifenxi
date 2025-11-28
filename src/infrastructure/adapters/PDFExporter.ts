/**
 * PDF 导出器实现
 *
 * 实现 IExporter 接口，提供 PDF 和 CSV 格式的数据导出功能。
 *
 * @layer Infrastructure
 * @implements IExporter
 * @depends Application/Ports, Domain/Entities
 */

import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  IExporter,
  ExportOptions,
  ExportFormat,
} from '../../application/ports/IExporter'
import type { InsuranceRecord, KPIResult } from '../../domain'

/**
 * PDF/CSV 导出器实现
 *
 * 支持导出：
 * - CSV 格式的保险数据
 * - PDF 格式的数据报告
 * - PDF 格式的 KPI 报告
 */
export class PDFExporter implements IExporter {
  /**
   * 导出为 CSV 格式
   */
  async exportToCSV(
    data: InsuranceRecord[],
    options?: ExportOptions
  ): Promise<Blob> {
    try {
      console.log(`[PDFExporter] 开始导出 CSV: ${data.length} 条记录`)

      // 1. 转换为原始数据格式
      const rawData = data.map(record => record.toRawData())

      // 2. 使用 PapaParse 生成 CSV
      const csv = Papa.unparse(rawData, {
        header: options?.includeHeaders ?? true,
        skipEmptyLines: true,
      })

      // 3. 创建 Blob
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })

      console.log(`[PDFExporter] CSV 导出完成`)
      return blob
    } catch (error) {
      throw new Error(
        `CSV 导出失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 导出为 PDF 格式
   */
  async exportToPDF(
    data: InsuranceRecord[],
    kpis?: KPIResult,
    options?: ExportOptions
  ): Promise<Blob> {
    try {
      console.log(`[PDFExporter] 开始导出 PDF: ${data.length} 条记录`)

      // 1. 创建 PDF 文档
      const doc = new jsPDF({
        orientation: options?.pageSettings?.orientation || 'landscape',
        unit: 'mm',
        format: options?.pageSettings?.size || 'A4',
      })

      // 2. 添加标题
      doc.setFontSize(16)
      doc.text('车险数据报告', 14, 15)

      // 3. 如果有 KPI 数据，先添加 KPI 摘要
      let startY = 25
      if (kpis) {
        startY = this.addKPISummary(doc, kpis, startY)
        startY += 10
      }

      // 4. 添加数据表格（前100条）
      const displayData = data.slice(0, 100)
      const tableData = displayData.map(record => [
        record.snapshotDate,
        record.thirdLevelOrganization,
        record.insuranceType,
        record.signedPremiumYuan.toFixed(2),
        record.policyCount.toString(),
      ])

      autoTable(doc, {
        startY,
        head: [['日期', '机构', '险种', '签单保费（元）', '件数']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      })

      // 5. 添加页脚
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `第 ${i} 页，共 ${pageCount} 页`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // 6. 转换为 Blob
      const blob = doc.output('blob')

      console.log(`[PDFExporter] PDF 导出完成`)
      return blob
    } catch (error) {
      throw new Error(
        `PDF 导出失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 导出 KPI 报告
   */
  async exportKPIReport(
    kpis: KPIResult,
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<Blob> {
    try {
      console.log(`[PDFExporter] 开始导出 KPI 报告: ${format}`)

      if (format === ExportFormat.CSV) {
        return this.exportKPIToCSV(kpis, options)
      } else if (format === ExportFormat.PDF) {
        return this.exportKPIToPDF(kpis, options)
      } else {
        throw new Error(`不支持的导出格式: ${format}`)
      }
    } catch (error) {
      throw new Error(
        `KPI 报告导出失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // ============= 私有辅助方法 =============

  /**
   * 在 PDF 中添加 KPI 摘要
   */
  private addKPISummary(doc: jsPDF, kpis: KPIResult, startY: number): number {
    doc.setFontSize(12)
    doc.text('核心指标摘要', 14, startY)

    const summaryData = [
      ['签单保费', this.formatCurrency(kpis.signedPremium)],
      ['满期保费', this.formatCurrency(kpis.maturedPremium)],
      ['保单件数', kpis.policyCount.toString()],
      ['满期赔付率', this.formatPercentage(kpis.lossRatio)],
      ['费用率', this.formatPercentage(kpis.expenseRatio)],
      ['满期边际贡献率', this.formatPercentage(kpis.contributionMarginRatio)],
    ]

    autoTable(doc, {
      startY: startY + 5,
      head: [['指标', '数值']],
      body: summaryData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [52, 152, 219] },
      theme: 'grid',
    })

    return (doc as any).lastAutoTable.finalY
  }

  /**
   * 导出 KPI 为 CSV
   */
  private exportKPIToCSV(kpis: KPIResult, options?: ExportOptions): Blob {
    const kpiData = [
      // 率值指标
      { 类别: '率值指标', 指标: '满期赔付率', 数值: this.formatPercentage(kpis.lossRatio) },
      { 类别: '率值指标', 指标: '费用率', 数值: this.formatPercentage(kpis.expenseRatio) },
      {
        类别: '率值指标',
        指标: '满期率',
        数值: this.formatPercentage(kpis.maturityRatio),
      },
      {
        类别: '率值指标',
        指标: '满期边际贡献率',
        数值: this.formatPercentage(kpis.contributionMarginRatio),
      },
      {
        类别: '率值指标',
        指标: '变动成本率',
        数值: this.formatPercentage(kpis.variableCostRatio),
      },
      {
        类别: '率值指标',
        指标: '满期出险率',
        数值: this.formatPercentage(kpis.maturedClaimRatio),
      },
      {
        类别: '率值指标',
        指标: '商业险自主系数',
        数值: kpis.autonomyCoefficient?.toFixed(4) || '-',
      },

      // 绝对值指标
      {
        类别: '绝对值指标',
        指标: '签单保费（元）',
        数值: this.formatCurrency(kpis.signedPremium),
      },
      {
        类别: '绝对值指标',
        指标: '满期保费（元）',
        数值: this.formatCurrency(kpis.maturedPremium),
      },
      { 类别: '绝对值指标', 指标: '保单件数', 数值: kpis.policyCount.toString() },
      { 类别: '绝对值指标', 指标: '赔案件数', 数值: kpis.claimCaseCount.toString() },
      {
        类别: '绝对值指标',
        指标: '已报告赔款（元）',
        数值: this.formatCurrency(kpis.reportedClaimPayment),
      },
      {
        类别: '绝对值指标',
        指标: '费用金额（元）',
        数值: this.formatCurrency(kpis.expenseAmount),
      },
      {
        类别: '绝对值指标',
        指标: '边际贡献额（元）',
        数值: this.formatCurrency(kpis.contributionMarginAmount),
      },

      // 均值指标
      {
        类别: '均值指标',
        指标: '单均保费（元）',
        数值: this.formatCurrency(kpis.averagePremium),
      },
      {
        类别: '均值指标',
        指标: '案均赔款（元）',
        数值: this.formatCurrency(kpis.averageClaim),
      },
      {
        类别: '均值指标',
        指标: '单均费用（元）',
        数值: this.formatCurrency(kpis.averageExpense),
      },
      {
        类别: '均值指标',
        指标: '单均边贡额（元）',
        数值: this.formatCurrency(kpis.averageContribution),
      },
    ]

    const csv = Papa.unparse(kpiData, {
      header: true,
      skipEmptyLines: true,
    })

    return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  }

  /**
   * 导出 KPI 为 PDF
   */
  private exportKPIToPDF(kpis: KPIResult, options?: ExportOptions): Blob {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4',
    })

    // 添加标题
    doc.setFontSize(18)
    doc.text('车险 KPI 分析报告', 14, 20)

    // 添加日期
    doc.setFontSize(10)
    doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, 14, 28)

    // 率值指标表格
    doc.setFontSize(14)
    doc.text('一、率值指标', 14, 40)

    const ratioData = [
      ['满期赔付率', this.formatPercentage(kpis.lossRatio)],
      ['费用率', this.formatPercentage(kpis.expenseRatio)],
      ['满期率', this.formatPercentage(kpis.maturityRatio)],
      ['满期边际贡献率', this.formatPercentage(kpis.contributionMarginRatio)],
      ['变动成本率', this.formatPercentage(kpis.variableCostRatio)],
      ['满期出险率', this.formatPercentage(kpis.maturedClaimRatio)],
      ['商业险自主系数', kpis.autonomyCoefficient?.toFixed(4) || '-'],
    ]

    autoTable(doc, {
      startY: 45,
      head: [['指标', '数值']],
      body: ratioData,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [52, 152, 219] },
      theme: 'grid',
    })

    // 绝对值指标表格
    let currentY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text('二、绝对值指标', 14, currentY)

    const absoluteData = [
      ['签单保费', this.formatCurrency(kpis.signedPremium) + ' 元'],
      ['满期保费', this.formatCurrency(kpis.maturedPremium) + ' 元'],
      ['保单件数', kpis.policyCount.toString() + ' 件'],
      ['赔案件数', kpis.claimCaseCount.toString() + ' 件'],
      ['已报告赔款', this.formatCurrency(kpis.reportedClaimPayment) + ' 元'],
      ['费用金额', this.formatCurrency(kpis.expenseAmount) + ' 元'],
      ['边际贡献额', this.formatCurrency(kpis.contributionMarginAmount) + ' 元'],
    ]

    autoTable(doc, {
      startY: currentY + 5,
      head: [['指标', '数值']],
      body: absoluteData,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [52, 152, 219] },
      theme: 'grid',
    })

    // 均值指标表格
    currentY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text('三、均值指标', 14, currentY)

    const averageData = [
      ['单均保费', this.formatCurrency(kpis.averagePremium) + ' 元/件'],
      ['案均赔款', this.formatCurrency(kpis.averageClaim) + ' 元/案'],
      ['单均费用', this.formatCurrency(kpis.averageExpense) + ' 元/件'],
      ['单均边贡额', this.formatCurrency(kpis.averageContribution) + ' 元/件'],
    ]

    autoTable(doc, {
      startY: currentY + 5,
      head: [['指标', '数值']],
      body: averageData,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [52, 152, 219] },
      theme: 'grid',
    })

    // 添加页脚
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `第 ${i} 页，共 ${pageCount} 页`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }

    return doc.output('blob')
  }

  /**
   * 格式化货币
   */
  private formatCurrency(value: number | null): string {
    if (value === null) {
      return '-'
    }
    return value.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  /**
   * 格式化百分比
   */
  private formatPercentage(value: number | null): string {
    if (value === null) {
      return '-'
    }
    return `${value.toFixed(2)}%`
  }
}
