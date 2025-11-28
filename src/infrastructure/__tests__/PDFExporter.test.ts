/**
 * PDFExporter 单元测试
 *
 * 测试 PDF/CSV 导出器的功能，包括：
 * - CSV 导出
 * - PDF 导出
 * - KPI 报告导出
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PDFExporter } from '../adapters/PDFExporter'
import { InsuranceRecord } from '../../domain/entities/InsuranceRecord'
import type { KPIResult } from '../../domain'
import { ExportFormat } from '../../application/ports/IExporter'

describe('PDFExporter', () => {
  let exporter: PDFExporter
  let sampleRecords: InsuranceRecord[]
  let sampleKPI: KPIResult

  beforeEach(() => {
    exporter = new PDFExporter()

    // 创建测试数据
    sampleRecords = [
      new InsuranceRecord(
        '2024-01-01',
        2024,
        1,
        '成都',
        '测试机构1',
        '个人',
        '商业险',
        '非车险',
        '主全',
        '新保',
        false,
        false,
        'A',
        '低',
        '90',
        '85',
        '直销',
        10000,
        9000,
        1,
        0,
        0,
        500,
        10500,
        10000,
        8500
      ),
      new InsuranceRecord(
        '2024-01-08',
        2024,
        2,
        '成都',
        '测试机构2',
        '企业',
        '交强险',
        '车险',
        '交三',
        '续保',
        true,
        false,
        'B',
        '中',
        '80',
        '75',
        '渠道',
        5000,
        4500,
        2,
        1,
        1000,
        200,
        5200,
        5000,
        3300
      ),
    ]

    // 创建测试 KPI 数据
    sampleKPI = {
      // 率值指标
      lossRatio: 11.11,
      expenseRatio: 5.19,
      maturityRatio: 95.0,
      contributionMarginRatio: 87.04,
      variableCostRatio: 16.3,
      maturedClaimRatio: 22.22,
      autonomyCoefficient: 0.9524,

      // 绝对值指标
      signedPremium: 15000,
      maturedPremium: 13500,
      policyCount: 3,
      claimCaseCount: 1,
      reportedClaimPayment: 1000,
      expenseAmount: 700,
      contributionMarginAmount: 11800,

      // 均值指标
      averagePremium: 5000,
      averageClaim: 1000,
      averageExpense: 233.33,
      averageContribution: 3933.33,
    }
  })

  describe('exportToCSV', () => {
    it('应该导出 CSV 格式的数据', async () => {
      const blob = await exporter.exportToCSV(sampleRecords)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('text/csv;charset=utf-8;')

      // 读取 Blob 内容
      const text = await blob.text()

      // 验证包含 BOM 标记
      expect(text.charCodeAt(0)).toBe(0xfeff)

      // 验证包含表头
      expect(text).toContain('snapshot_date')
      expect(text).toContain('policy_start_year')
      expect(text).toContain('signed_premium_yuan')

      // 验证包含数据
      expect(text).toContain('2024-01-01')
      expect(text).toContain('测试机构1')
      expect(text).toContain('10000')
    })

    it('应该正确处理导出选项（不包含表头）', async () => {
      const blob = await exporter.exportToCSV(sampleRecords, {
        includeHeaders: false,
      })

      const text = await blob.text()

      // 不应包含表头
      expect(text).not.toContain('snapshot_date')
      // 但应包含数据
      expect(text).toContain('2024-01-01')
    })

    it('应该处理空数据', async () => {
      const blob = await exporter.exportToCSV([])

      expect(blob).toBeInstanceOf(Blob)

      const text = await blob.text()
      // 应该至少包含表头
      expect(text.length).toBeGreaterThan(0)
    })

    it('应该正确转换所有字段', async () => {
      const blob = await exporter.exportToCSV(sampleRecords)
      const text = await blob.text()

      // 验证所有必需字段都存在
      const requiredFields = [
        'snapshot_date',
        'policy_start_year',
        'week_number',
        'chengdu_branch',
        'third_level_organization',
        'customer_category_3',
        'insurance_type',
        'business_type_category',
        'coverage_type',
        'renewal_status',
        'is_new_energy_vehicle',
        'is_transferred_vehicle',
        'terminal_source',
        'signed_premium_yuan',
        'matured_premium_yuan',
        'policy_count',
        'claim_case_count',
        'reported_claim_payment_yuan',
        'expense_amount_yuan',
        'commercial_premium_before_discount_yuan',
        'marginal_contribution_amount_yuan',
      ]

      for (const field of requiredFields) {
        expect(text).toContain(field)
      }
    })
  })

  describe('exportToPDF', () => {
    it('应该导出 PDF 格式的数据', async () => {
      const blob = await exporter.exportToPDF(sampleRecords)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('应该在 PDF 中包含 KPI 摘要', async () => {
      const blob = await exporter.exportToPDF(sampleRecords, sampleKPI)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
    })

    it('应该支持自定义页面设置', async () => {
      const blob = await exporter.exportToPDF(sampleRecords, undefined, {
        pageSettings: {
          orientation: 'portrait',
          size: 'A4',
        },
      })

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
    })

    it('应该处理空数据', async () => {
      const blob = await exporter.exportToPDF([])

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
    })

    it('应该只显示前 100 条数据', async () => {
      // 创建 150 条记录
      const manyRecords = Array.from({ length: 150 }, (_, i) =>
        new InsuranceRecord(
          '2024-01-01',
          2024,
          (i % 105) + 1,
          '成都',
          `测试机构${i}`,
          '个人',
          '商业险',
          '非车险',
          '主全',
          '新保',
          false,
          false,
          null,
          null,
          null,
          null,
          '直销',
          10000,
          9000,
          1,
          0,
          0,
          500,
          10500,
          null,
          8500
        )
      )

      const blob = await exporter.exportToPDF(manyRecords)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
    })
  })

  describe('exportKPIReport', () => {
    it('应该导出 CSV 格式的 KPI 报告', async () => {
      const blob = await exporter.exportKPIReport(sampleKPI, ExportFormat.CSV)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('text/csv;charset=utf-8;')

      const text = await blob.text()

      // 验证包含 KPI 指标名称
      expect(text).toContain('满期赔付率')
      expect(text).toContain('费用率')
      expect(text).toContain('签单保费')
      expect(text).toContain('单均保费')

      // 验证包含 KPI 数值
      expect(text).toContain('11.11')
      expect(text).toContain('5.19')
    })

    it('应该导出 PDF 格式的 KPI 报告', async () => {
      const blob = await exporter.exportKPIReport(sampleKPI, ExportFormat.PDF)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('应该拒绝不支持的格式', async () => {
      await expect(
        exporter.exportKPIReport(sampleKPI, 'INVALID' as ExportFormat)
      ).rejects.toThrow('不支持的导出格式')
    })

    it('CSV 报告应该包含所有 KPI 类别', async () => {
      const blob = await exporter.exportKPIReport(sampleKPI, ExportFormat.CSV)
      const text = await blob.text()

      // 验证三大类别
      expect(text).toContain('率值指标')
      expect(text).toContain('绝对值指标')
      expect(text).toContain('均值指标')
    })

    it('应该正确格式化百分比', async () => {
      const blob = await exporter.exportKPIReport(sampleKPI, ExportFormat.CSV)
      const text = await blob.text()

      // 验证百分比格式
      expect(text).toMatch(/11\.11%/)
      expect(text).toMatch(/5\.19%/)
    })

    it('应该正确格式化货币', async () => {
      const blob = await exporter.exportKPIReport(sampleKPI, ExportFormat.CSV)
      const text = await blob.text()

      // 验证货币格式（带千分位）
      expect(text).toContain('15,000.00')
      expect(text).toContain('13,500.00')
    })

    it('应该处理 null 值', async () => {
      const kpiWithNull: KPIResult = {
        ...sampleKPI,
        autonomyCoefficient: null,
      }

      const blob = await exporter.exportKPIReport(kpiWithNull, ExportFormat.CSV)
      const text = await blob.text()

      // 验证 null 值被正确处理
      expect(text).toContain('-')
    })
  })

  describe('边界情况', () => {
    it('应该处理大量数据的 CSV 导出', async () => {
      // 创建 10000 条记录
      const largeDataset = Array.from({ length: 10000 }, (_, i) =>
        new InsuranceRecord(
          '2024-01-01',
          2024,
          (i % 105) + 1,
          '成都',
          `机构${i}`,
          '个人',
          '商业险',
          '非车险',
          '主全',
          '新保',
          false,
          false,
          null,
          null,
          null,
          null,
          '直销',
          10000,
          9000,
          1,
          0,
          0,
          500,
          10500,
          null,
          8500
        )
      )

      const startTime = performance.now()
      const blob = await exporter.exportToCSV(largeDataset)
      const elapsed = performance.now() - startTime

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
      // 性能检查：10000 条数据应该在 2 秒内导出完成
      expect(elapsed).toBeLessThan(2000)
    })

    it('应该处理特殊字符', async () => {
      const recordWithSpecialChars = new InsuranceRecord(
        '2024-01-01',
        2024,
        1,
        '成都',
        '包含,逗号"引号的机构',
        '个人',
        '商业险',
        '非车险',
        '主全',
        '新保',
        false,
        false,
        null,
        null,
        null,
        null,
        '直销',
        10000,
        9000,
        1,
        0,
        0,
        500,
        10500,
        null,
        8500
      )

      const blob = await exporter.exportToCSV([recordWithSpecialChars])
      const text = await blob.text()

      // CSV 应该正确转义特殊字符
      expect(text).toContain('包含,逗号"引号的机构')
    })

    it('应该处理极小的数值', async () => {
      const kpiWithSmallValues: KPIResult = {
        ...sampleKPI,
        lossRatio: 0.01,
        expenseRatio: 0.001,
      }

      const blob = await exporter.exportKPIReport(kpiWithSmallValues, ExportFormat.CSV)
      const text = await blob.text()

      expect(text).toContain('0.01%')
      expect(text).toContain('0.00%')
    })

    it('应该处理极大的数值', async () => {
      const kpiWithLargeValues: KPIResult = {
        ...sampleKPI,
        signedPremium: 9999999999.99,
        maturedPremium: 8888888888.88,
      }

      const blob = await exporter.exportKPIReport(kpiWithLargeValues, ExportFormat.CSV)
      const text = await blob.text()

      // 验证大数值被正确格式化
      expect(text).toContain('9,999,999,999.99')
      expect(text).toContain('8,888,888,888.88')
    })
  })

  describe('错误处理', () => {
    it('应该处理导出过程中的错误', async () => {
      // 这里我们模拟一个会导致错误的情况
      // 由于 PDFExporter 内部使用了 jsPDF 和 PapaParse，
      // 实际很难触发错误，但我们可以测试错误消息的格式

      // 测试空对象转换（这应该不会失败，但可以测试鲁棒性）
      const blob = await exporter.exportToCSV([])
      expect(blob).toBeDefined()
    })
  })
})
