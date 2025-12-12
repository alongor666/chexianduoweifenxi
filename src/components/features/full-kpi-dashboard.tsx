/**
 * 完整版KPI看板 - 4x4网格布局
 * 集成：多层下钻分析
 */
'use client'

import {
  formatPercent,
  formatCurrency,
  getContributionMarginColor,
} from '@/utils/format'
import type { KPIResult } from '@/types/insurance'
import { KPICardWithDrilldown } from './kpi-card-with-drilldown'
import {
  calculateKPIs,
  InsuranceRecord as DomainInsuranceRecord,
} from '@/domain'
import { getComparisonMetrics } from '@/utils/comparison'

export interface FullKPIDashboardProps {
  /**
   * KPI 计算结果
   */
  kpiData: KPIResult | null

  /**
   * 对比数据（通常是上周数据）
   */
  compareData?: KPIResult | null

  /**
   * 对比周号
   */
  compareWeekNumber?: number

  /**
   * 是否正在加载
   */
  isLoading?: boolean
}

// KPI配置定义
interface KPIConfig {
  key: keyof KPIResult
  title: string
  unit: string
  formatter: (val: number | null | undefined) => string
  getColor: (val: number | null) => string
}

export function FullKPIDashboard({
  kpiData,
  compareData,
  isLoading = false,
}: FullKPIDashboardProps) {
  // 第一行：比率指标
  const row1KPIs: KPIConfig[] = [
    {
      key: 'contribution_margin_ratio',
      title: '满期边际贡献率',
      unit: '',
      formatter: formatPercent,
      getColor: val => getContributionMarginColor(val),
    },
    {
      key: 'premium_time_progress_achievement_rate',
      title: '保费时间进度达成率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val >= 100
          ? 'text-green-600'
          : val !== null && val >= 80
            ? 'text-blue-600'
            : 'text-orange-600',
    },
    {
      key: 'loss_ratio',
      title: '满期赔付率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 70
          ? 'text-red-600'
          : val !== null && val > 60
            ? 'text-orange-600'
            : 'text-green-600',
    },
    {
      key: 'expense_ratio',
      title: '费用率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 25
          ? 'text-red-600'
          : val !== null && val > 20
            ? 'text-orange-600'
            : 'text-green-600',
    },
  ]

  // 第二行：金额指标
  const row2KPIs: KPIConfig[] = [
    {
      key: 'contribution_margin_amount',
      title: '满期边际贡献额',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: val =>
        val !== null && val >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      key: 'signed_premium',
      title: '签单保费',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
    },
    {
      key: 'reported_claim_payment',
      title: '已报告赔款',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
    },
    {
      key: 'expense_amount',
      title: '费用额',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
    },
  ]

  // 第三行：比率/数量指标
  const row3KPIs: KPIConfig[] = [
    {
      key: 'variable_cost_ratio',
      title: '变动成本率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 90
          ? 'text-red-600'
          : val !== null && val > 85
            ? 'text-orange-600'
            : 'text-green-600',
    },
    {
      key: 'maturity_ratio',
      title: '满期率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val >= 80
          ? 'text-green-600'
          : val !== null && val >= 60
            ? 'text-blue-600'
            : 'text-orange-600',
    },
    {
      key: 'matured_claim_ratio',
      title: '满期出险率',
      unit: '',
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 60
          ? 'text-red-600'
          : val !== null && val > 50
            ? 'text-orange-600'
            : 'text-green-600',
    },
    {
      key: 'policy_count',
      title: '保单件数',
      unit: '件',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
    },
  ]

  // 第四行：单均指标
  const row4KPIs: KPIConfig[] = [
    {
      key: 'claim_case_count',
      title: '赔案件数',
      unit: '件',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
    },
    {
      key: 'average_premium',
      title: '单均保费',
      unit: '元',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
    },
    {
      key: 'average_claim',
      title: '案均赔款',
      unit: '元',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
    },
    {
      key: 'average_expense',
      title: '单均费用',
      unit: '元',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
    },
  ]

  // 渲染单个KPI卡片（使用KPICardWithDrilldown）
  const renderKPICard = (config: KPIConfig) => {
    const value = kpiData?.[config.key] as number | null
    // const compareValue = compareData?.[config.key] as number | null // 旧逻辑：直接传递上期值

    // 新逻辑：计算环比变化
    const comparison = getComparisonMetrics(config.key, kpiData, compareData)

    // 判断是否为率值指标（率值指标通常显示绝对变化的百分点，金额指标显示百分比变化）
    const isRatioMetric = [
      'loss_ratio',
      'expense_ratio',
      'maturity_ratio',
      'contribution_margin_ratio',
      'variable_cost_ratio',
      'matured_claim_ratio',
      'premium_time_progress_achievement_rate',
      'autonomy_coefficient',
    ].includes(config.key as string)

    let displayCompareValue: number | null = null
    let displayCompareUnit = '%'

    if (comparison.absoluteChange !== null) {
      if (isRatioMetric) {
        // 率值指标：显示绝对变化（pp = percentage points）
        displayCompareValue = comparison.absoluteChange
        displayCompareUnit = 'pp'
      } else {
        // 金额/数量指标：显示百分比变化
        displayCompareValue = comparison.percentChange
        displayCompareUnit = '%'
      }
    }

    return (
      <KPICardWithDrilldown
        key={config.key as string}
        title={config.title}
        value={value}
        compareValue={displayCompareValue}
        compareUnit={displayCompareUnit}
        unit={config.unit}
        valueColor={config.getColor(value)}
        formatter={config.formatter}
        kpiKey={config.key as string}
        enableDrillDown={true}
        calculateValue={data => {
          const records = data.map(d => DomainInsuranceRecord.fromRawData(d))
          const result = calculateKPIs(records)
          return result[config.key] as number | null
        }}
      />
    )
  }

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 h-3 w-28 rounded bg-slate-200" />
                <div className="mb-2 h-8 w-24 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // 如果没有数据，显示空状态
  if (!kpiData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-600">暂无数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 第一行：比率指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row1KPIs.map(config => renderKPICard(config))}
      </div>

      {/* 第二行：金额指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row2KPIs.map(config => renderKPICard(config))}
      </div>

      {/* 第三行：比率/数量指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row3KPIs.map(config => renderKPICard(config))}
      </div>

      {/* 第四行：单均指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row4KPIs.map(config => renderKPICard(config))}
      </div>
    </div>
  )
}
