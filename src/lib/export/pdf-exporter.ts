/**
 * PDF 报告导出功能 (P2功能)
 *
 * 功能描述：
 * - 生成完整的分析报告（KPI + 图表 + 洞察）
 * - 支持自定义报告模板
 * - 使用 jsPDF + html2canvas 实现高质量导出
 *
 * PRD位置：2.2.6 数据导出与分享模块 - 分析报告导出（P2）
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { KPIResult, FilterState } from '@/types/insurance'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters'

export interface PDFReportConfig {
  title: string // 报告标题
  subtitle?: string // 副标题
  author?: string // 作者
  includeKPI?: boolean // 是否包含KPI概览
  includeCharts?: boolean // 是否包含图表
  includeInsights?: boolean // 是否包含智能洞察
  chartElements?: string[] // 要导出的图表元素ID列表
}

export interface PDFExportOptions {
  config: PDFReportConfig
  kpis?: KPIResult
  filters?: FilterState
  insights?: string[] // 智能洞察文本列表
}

/**
 * 导出 PDF 报告
 */
export async function exportPDFReport(
  options: PDFExportOptions
): Promise<void> {
  const { config, kpis, filters, insights } = options

  // 创建 PDF 文档 (A4 尺寸)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // ===== 封面 =====
  // 标题
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text(config.title, pageWidth / 2, yPosition + 30, { align: 'center' })

  // 副标题
  if (config.subtitle) {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text(config.subtitle, pageWidth / 2, yPosition + 45, {
      align: 'center',
    })
  }

  // 生成日期
  const reportDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  pdf.setFontSize(10)
  pdf.text(`生成日期：${reportDate}`, pageWidth / 2, yPosition + 60, {
    align: 'center',
  })

  // 作者
  if (config.author) {
    pdf.text(`报告人：${config.author}`, pageWidth / 2, yPosition + 70, {
      align: 'center',
    })
  }

  // 添加装饰线
  pdf.setDrawColor(59, 130, 246) // 蓝色
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition + 80, pageWidth - margin, yPosition + 80)

  // ===== 新页面：筛选条件 =====
  if (filters) {
    pdf.addPage()
    yPosition = margin

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('筛选条件', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    // 分析模式
    const viewModeText =
      filters.viewMode === 'single' ? '单周分析' : '周趋势分析'
    pdf.text(`分析模式：${viewModeText}`, margin, yPosition)
    yPosition += 6

    // 时间范围
    if (filters.years.length > 0 || filters.weeks.length > 0) {
      const yearsText =
        filters.years.length > 0 ? `${filters.years.join(', ')}年` : '全部'
      const weeksText =
        filters.weeks.length > 0 ? `第${filters.weeks.join(', ')}周` : '全部'
      pdf.text(`时间范围：${yearsText}，${weeksText}`, margin, yPosition)
      yPosition += 6
    }

    // 机构
    if (filters.organizations.length > 0) {
      pdf.text(`机构：${filters.organizations.join('、')}`, margin, yPosition)
      yPosition += 6
    }

    // 产品
    if (filters.insuranceTypes.length > 0) {
      pdf.text(
        `保险类型：${filters.insuranceTypes.join('、')}`,
        margin,
        yPosition
      )
      yPosition += 6
    }

    yPosition += 10
  }

  // ===== KPI 概览 =====
  if (config.includeKPI && kpis) {
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('核心指标概览', margin, yPosition)
    yPosition += 10

    // 绘制 KPI 表格
    const kpiData = [
      ['签单保费', formatCurrency(kpis.signed_premium)],
      ['满期保费', formatCurrency(kpis.matured_premium)],
      ['保单件数', `${formatNumber(kpis.policy_count)} 件`],
      [
        '满期赔付率',
        kpis.loss_ratio !== null ? formatPercent(kpis.loss_ratio) : 'N/A',
      ],
      [
        '费用率',
        kpis.expense_ratio !== null ? formatPercent(kpis.expense_ratio) : 'N/A',
      ],
      [
        '满期边际贡献率',
        kpis.contribution_margin_ratio !== null
          ? formatPercent(kpis.contribution_margin_ratio)
          : 'N/A',
      ],
      [
        '单均保费',
        kpis.average_premium !== null
          ? `${formatNumber(kpis.average_premium)} 元`
          : 'N/A',
      ],
      [
        '满期出险率',
        kpis.matured_claim_ratio !== null
          ? formatPercent(kpis.matured_claim_ratio)
          : 'N/A',
      ],
    ]

    const cellWidth = (pageWidth - 2 * margin) / 2
    const cellHeight = 8

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    kpiData.forEach((row, index) => {
      const rowY = yPosition + index * cellHeight

      // 绘制边框
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(margin, rowY, cellWidth, cellHeight)
      pdf.rect(margin + cellWidth, rowY, cellWidth, cellHeight)

      // 指标名称（左侧）
      pdf.setFont('helvetica', 'bold')
      pdf.text(row[0], margin + 3, rowY + 5.5)

      // 指标值（右侧）
      pdf.setFont('helvetica', 'normal')
      pdf.text(row[1], margin + cellWidth + 3, rowY + 5.5)
    })

    yPosition += kpiData.length * cellHeight + 10
  }

  // ===== 图表 =====
  if (
    config.includeCharts &&
    config.chartElements &&
    config.chartElements.length > 0
  ) {
    for (const elementId of config.chartElements) {
      const element = document.getElementById(elementId)
      if (!element) {
        console.warn(`Chart element not found: ${elementId}`)
        continue
      }

      // 检查是否需要新页面
      if (yPosition > pageHeight - 120) {
        pdf.addPage()
        yPosition = margin
      }

      try {
        // 使用 html2canvas 将图表转为图片
        const canvas = await html2canvas(element, {
          scale: 2, // 提高分辨率
          backgroundColor: '#ffffff',
          logging: false,
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 2 * margin
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // 添加图表标题（如果有）
        const title = element.getAttribute('data-chart-title')
        if (title) {
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text(title, margin, yPosition)
          yPosition += 8
        }

        // 插入图片
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 10
      } catch (error) {
        console.error(`Failed to export chart ${elementId}:`, error)
      }
    }
  }

  // ===== 智能洞察 =====
  if (config.includeInsights && insights && insights.length > 0) {
    pdf.addPage()
    yPosition = margin

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('智能洞察', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    insights.forEach((insight, index) => {
      // 检查是否需要换页
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = margin
      }

      // 使用项目符号
      pdf.text(`${index + 1}. ${insight}`, margin, yPosition, {
        maxWidth: pageWidth - 2 * margin,
      })
      yPosition += 8
    })
  }

  // ===== 页脚：页码 =====
  const totalPages = pdf.internal.pages.length - 1 // 减去第一个空白页
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `第 ${i} 页 / 共 ${totalPages} 页`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // ===== 保存文件 =====
  const fileName = `${config.title}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

/**
 * 导出简化版 PDF（仅 KPI）
 */
export async function exportSimplePDFReport(
  kpis: KPIResult,
  filters?: FilterState
): Promise<void> {
  const config: PDFReportConfig = {
    title: '车险业务分析报告',
    subtitle: '核心指标概览',
    includeKPI: true,
    includeCharts: false,
    includeInsights: false,
  }

  await exportPDFReport({ config, kpis, filters })
}

/**
 * 导出完整 PDF 报告（KPI + 图表 + 洞察）
 */
export async function exportFullPDFReport(
  kpis: KPIResult,
  chartElements: string[],
  insights: string[],
  filters?: FilterState
): Promise<void> {
  const config: PDFReportConfig = {
    title: '车险业务分析报告',
    subtitle: '完整分析报告',
    includeKPI: true,
    includeCharts: true,
    includeInsights: true,
    chartElements,
  }

  await exportPDFReport({ config, kpis, filters, insights })
}
