'use client'

import {
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/use-app-store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useKPI } from '@/hooks/use-kpi'
import {
  exportToCSV,
  exportKPISummary,
  exportFilteredData,
} from '@/lib/export/csv-exporter'
import { exportChartAsImage } from '@/lib/export/chart-exporter'
import { useState } from 'react'
import { logger } from '@/lib/logger'

const log = logger.create('DataExport')

/**
 * 数据导出组件
 * 支持导出明细数据和KPI汇总
 */
export function DataExport() {
  const [open, setOpen] = useState(false)
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)
  const filteredData = useFilteredData()
  const kpiData = useKPI()

  // 检查是否有数据
  const hasData = rawData.length > 0
  const hasFilteredData = filteredData.length > 0

  /**
   * 导出全部原始数据
   */
  const handleExportAll = () => {
    exportToCSV(rawData, {
      filename: `保险数据_全部_${new Date().toISOString().split('T')[0]}`,
    })
    setOpen(false)
  }

  /**
   * 导出过滤后的明细数据
   */
  const handleExportFiltered = () => {
    const exportFilterState = {
      policyYear: filters.years,
      weekNumber: filters.weeks,
      thirdLevelOrganization: filters.organizations
    }
    exportFilteredData(filteredData, exportFilterState)
    setOpen(false)
  }

  /**
   * 导出KPI汇总
   */
  const handleExportKPI = () => {
    if (kpiData) {
      const exportFilterState = {
        policyYear: filters.years,
        weekNumber: filters.weeks,
        thirdLevelOrganization: filters.organizations
      }
      // 将 KPIResult 转换为 KPISummarySnapshot
      const kpiSummary = {
        maturedMarginRate: kpiData.contribution_margin_ratio,
        premiumAchievementRate: kpiData.premium_progress,
        maturedClaimRate: kpiData.loss_ratio,
        expenseRate: kpiData.expense_ratio,
        maturityRate: kpiData.maturity_ratio,
        maturedClaimFrequency: kpiData.matured_claim_ratio,
        variableCostRate: kpiData.variable_cost_ratio,
        autonomyCoefficient: kpiData.autonomy_coefficient,
        signedPremium: kpiData.signed_premium,
        maturedPremium: kpiData.matured_premium
      }
      exportKPISummary(kpiSummary, exportFilterState)
    }
    setOpen(false)
  }

  /**
   * 导出图表为图片
   */
  const handleExportChartImage = async (chartId: string, chartName: string) => {
    try {
      const element = document.getElementById(chartId)
      if (!element) {
        alert(`未找到图表元素: ${chartId}`)
        return
      }

      await exportChartAsImage(element, {
        filename: `${chartName}_${new Date().toISOString().split('T')[0]}`,
        backgroundColor: '#ffffff',
        scale: 2,
        format: 'png',
      })

      // 不关闭对话框，方便用户导出多个图表
    } catch (error) {
      log.error('图表导出失败', error)
      alert('图表导出失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!hasData}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出数据
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            导出数据
          </DialogTitle>
          <DialogDescription>
            选择要导出的数据类型。支持导出为CSV格式,可用Excel打开。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* 导出全部原始数据 */}
          <div
            onClick={handleExportAll}
            className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all group"
          >
            <div className="mt-1">
              <FileSpreadsheet className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                导出全部原始数据
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                导出所有已上传的原始数据 ({rawData.length.toLocaleString()}{' '}
                条记录)
              </p>
            </div>
          </div>

          {/* 导出过滤后的数据 */}
          <div
            onClick={hasFilteredData ? handleExportFiltered : undefined}
            className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${
              hasFilteredData
                ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer group'
                : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="mt-1">
              <FileSpreadsheet className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                导出当前筛选数据
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {hasFilteredData
                  ? `导出应用筛选条件后的数据 (${filteredData.length.toLocaleString()} 条记录)`
                  : '当前无筛选数据可导出'}
              </p>
              {hasFilteredData && (
                <div className="mt-2 text-xs text-slate-500">
                  当前筛选条件:
                  {filters.years?.length
                    ? ` 年度(${filters.years.join(',')})`
                    : ''}
                  {filters.weeks?.length
                    ? ` 周次(${filters.weeks.join(',')})`
                    : ''}
                  {filters.organizations?.length
                    ? ` 机构(${filters.organizations.length}个)`
                    : ''}
                </div>
              )}
            </div>
          </div>

          {/* 导出KPI汇总 */}
          <div
            onClick={handleExportKPI}
            className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all group"
          >
            <div className="mt-1">
              <FileText className="w-5 h-5 text-slate-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 group-hover:text-green-600 transition-colors">
                导出KPI汇总报告
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                导出当前筛选条件下的核心KPI指标汇总
              </p>
              <div className="mt-2 text-xs text-slate-500">
                包含: 满期边际贡献率、赔付率、费用率等8个核心指标
              </div>
            </div>
          </div>

          {/* 导出图表图片 */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-1">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-800">导出图表图片</h4>
                <p className="text-sm text-slate-600 mt-1">
                  将图表导出为高清PNG图片，适合用于PPT和报告
                </p>
              </div>
            </div>

            <div className="space-y-2 pl-8">
              <button
                onClick={() =>
                  handleExportChartImage('trend-chart', '趋势分析图')
                }
                className="w-full text-left px-3 py-2 text-sm rounded border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                导出趋势分析图表
              </button>
              <button
                onClick={() =>
                  handleExportChartImage('organization-chart', '机构结构分析图')
                }
                className="w-full text-left px-3 py-2 text-sm rounded border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                导出机构结构分析图
              </button>
              <button
                onClick={() =>
                  handleExportChartImage('product-chart', '产品结构分析图')
                }
                className="w-full text-left px-3 py-2 text-sm rounded border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                导出产品结构分析图
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t mt-4">
          <p className="text-xs text-slate-500 flex items-start gap-2">
            <span className="text-blue-600 font-medium">💡</span>
            <span>
              导出的CSV文件采用UTF-8编码,可直接用Excel打开。
              如遇乱码问题,请使用Excel的&ldquo;数据&rdquo;-&ldquo;导入文本&rdquo;功能并选择UTF-8编码。
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
