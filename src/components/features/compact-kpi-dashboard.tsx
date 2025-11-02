'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPercent,
  formatCurrency,
  getContributionMarginColor,
} from '@/utils/format'
import type { KPIResult } from '@/types/insurance'

export interface CompactKPIDashboardProps {
  /**
   * KPI 计算结果
   */
  kpiData: KPIResult | null

  /**
   * 是否正在加载
   */
  isLoading?: boolean

  /**
   * 对比数据（用于显示环比变化）
   */
  compareData?: KPIResult | null
}

// KPI配置定义
interface KPIConfig {
  key: keyof KPIResult
  title: string
  unit: string
  formatter: (val: number | null | undefined) => string
  getColor: (val: number | null) => string
  decimals?: number // 用于计算增量的小数位数
}

export function CompactKPIDashboard({
  kpiData,
  isLoading = false,
  compareData,
}: CompactKPIDashboardProps) {
  // 第一行：比率指标
  const row1KPIs: KPIConfig[] = [
    {
      key: 'contribution_margin_ratio',
      title: '满期边际贡献率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val => getContributionMarginColor(val),
      decimals: 2,
    },
    {
      key: 'premium_progress',
      title: '保费时间进度达成率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val >= 100
          ? 'text-green-600'
          : val !== null && val >= 80
            ? 'text-blue-600'
            : 'text-orange-600',
      decimals: 2,
    },
    {
      key: 'loss_ratio',
      title: '满期赔付率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 70
          ? 'text-red-600'
          : val !== null && val > 60
            ? 'text-orange-600'
            : 'text-green-600',
      decimals: 2,
    },
    {
      key: 'expense_ratio',
      title: '费用率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 25
          ? 'text-red-600'
          : val !== null && val > 20
            ? 'text-orange-600'
            : 'text-green-600',
      decimals: 2,
    },
  ]

  // 第二行：金额指标
  const row2KPIs: KPIConfig[] = [
    {
      key: 'contribution_margin_amount',
      title: '满期边际贡献额',
      unit: '', // formatCurrency已包含"万元"
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: val =>
        val !== null && val >= 0 ? 'text-green-600' : 'text-red-600',
      decimals: 0,
    },
    {
      key: 'signed_premium',
      title: '签单保费',
      unit: '', // formatCurrency已包含"万元"
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
    {
      key: 'reported_claim_payment',
      title: '已报告赔款',
      unit: '', // formatCurrency已包含"万元"
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
    {
      key: 'expense_amount',
      title: '费用额',
      unit: '', // formatCurrency已包含"万元"
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
  ]

  // 第三行：比率/数量指标
  const row3KPIs: KPIConfig[] = [
    {
      key: 'variable_cost_ratio',
      title: '变动成本率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 90
          ? 'text-red-600'
          : val !== null && val > 85
            ? 'text-orange-600'
            : 'text-green-600',
      decimals: 2,
    },
    {
      key: 'maturity_ratio',
      title: '满期率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val >= 80
          ? 'text-green-600'
          : val !== null && val >= 60
            ? 'text-blue-600'
            : 'text-orange-600',
      decimals: 2,
    },
    {
      key: 'matured_claim_ratio',
      title: '满期出险率',
      unit: '', // formatPercent已包含%
      formatter: formatPercent,
      getColor: val =>
        val !== null && val > 60
          ? 'text-red-600'
          : val !== null && val > 50
            ? 'text-orange-600'
            : 'text-green-600',
      decimals: 2,
    },
    {
      key: 'policy_count',
      title: '保单件数(件)',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
  ]

  // 第四行：单均指标
  const row4KPIs: KPIConfig[] = [
    {
      key: 'claim_case_count',
      title: '赔案件数(件)',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
    {
      key: 'average_premium',
      title: '单均保费(元)',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
    {
      key: 'average_claim',
      title: '案均赔款(元)',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
    {
      key: 'average_expense',
      title: '单均费用(元)',
      unit: '',
      formatter: val =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString('zh-CN')
          : '-',
      getColor: () => 'text-slate-700',
      decimals: 0,
    },
  ]

  // 计算环比增量和变化幅度
  const getChangeInfo = (
    current: number | null,
    previous: number | null,
    decimals: number = 2
  ): {
    delta: string
    percent: string
    direction: 'up' | 'down' | 'flat'
    color: string
  } => {
    if (
      current === null ||
      previous === null ||
      current === undefined ||
      previous === undefined ||
      isNaN(current) ||
      isNaN(previous)
    ) {
      return {
        delta: '-',
        percent: '-',
        direction: 'flat',
        color: 'text-slate-400',
      }
    }

    const delta = current - previous
    const percent = previous !== 0 ? (delta / previous) * 100 : 0

    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
    const color =
      direction === 'up'
        ? 'text-green-600'
        : direction === 'down'
          ? 'text-red-600'
          : 'text-slate-500'

    const deltaStr =
      delta >= 0 ? `+${delta.toFixed(decimals)}` : delta.toFixed(decimals)
    const percentStr =
      percent >= 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`

    return { delta: deltaStr, percent: percentStr, direction, color }
  }

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="animate-pulse rounded-md border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
                <div className="mb-1 h-6 w-20 rounded bg-slate-200" />
                <div className="h-2 w-16 rounded bg-slate-200" />
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
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-600">暂无数据</p>
        </div>
      </div>
    )
  }

  // 渲染单个KPI单元格
  const renderKPICell = (config: KPIConfig) => {
    const value = kpiData[config.key] as number | null
    const formattedValue = config.formatter(value)
    const compareValue = compareData
      ? (compareData[config.key] as number | null)
      : null
    const changeInfo = getChangeInfo(value, compareValue, config.decimals)

    return (
      <div
        key={config.key as string}
        className={cn(
          'rounded-md border border-slate-200 bg-white p-3 transition-all',
          'hover:border-blue-300 hover:shadow-sm'
        )}
      >
        {/* 标题 */}
        <div className="mb-2 text-xs font-medium text-slate-600">
          {config.title}
        </div>

        {/* 当前值 */}
        <div className="mb-1 flex items-baseline gap-1">
          <span
            className={cn(
              'text-xl font-bold tabular-nums',
              config.getColor(value)
            )}
          >
            {formattedValue}
          </span>
          {config.unit && (
            <span className="text-xs text-slate-500">{config.unit}</span>
          )}
        </div>

        {/* 环比信息 */}
        {compareData && (
          <div className="flex items-center gap-2 text-xs">
            {/* 环比增量 */}
            <div className="flex items-center gap-0.5">
              {changeInfo.direction === 'up' && (
                <TrendingUp className="h-3 w-3" />
              )}
              {changeInfo.direction === 'down' && (
                <TrendingDown className="h-3 w-3" />
              )}
              {changeInfo.direction === 'flat' && <Minus className="h-3 w-3" />}
              <span className={cn('font-medium', changeInfo.color)}>
                {changeInfo.delta}
              </span>
            </div>

            {/* 变化幅度 */}
            <div className={cn('font-medium', changeInfo.color)}>
              {changeInfo.percent}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 第一行：比率指标 */}
      <div className="grid grid-cols-4 gap-3">
        {row1KPIs.map(config => renderKPICell(config))}
      </div>

      {/* 第二行：金额指标 */}
      <div className="grid grid-cols-4 gap-3">
        {row2KPIs.map(config => renderKPICell(config))}
      </div>

      {/* 第三行：比率/数量指标 */}
      <div className="grid grid-cols-4 gap-3">
        {row3KPIs.map(config => renderKPICell(config))}
      </div>

      {/* 第四行：单均指标 */}
      <div className="grid grid-cols-4 gap-3">
        {row4KPIs.map(config => renderKPICell(config))}
      </div>
    </div>
  )
}
