/**
 * 趋势分析卡片
 * 显示KPI指标的当前值和环比变化趋势
 */

'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getComparisonMetrics,
  formatComparisonChange,
  getComparisonColor,
} from '@/utils/comparison'
import { formatPercent, formatNumber } from '@/utils/formatters'
import type { KPIResult } from '@/types/insurance'

interface TrendAnalysisCardProps {
  title: string
  description: string
  kpiId: keyof KPIResult
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  unit?: string
  isPercentage?: boolean
  compact?: boolean
}

export function TrendAnalysisCard({
  title,
  description,
  kpiId,
  currentKpis,
  compareKpis,
  unit = '',
  isPercentage = false,
  compact = false,
}: TrendAnalysisCardProps) {
  const currentValue = currentKpis?.[kpiId] as number | null

  // 计算环比变化
  const comparison = compareKpis
    ? getComparisonMetrics(kpiId, currentKpis, compareKpis)
    : null

  if (compact) {
    return (
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-slate-600">{title}</p>
        <p className="text-xl font-bold text-slate-800">
          {currentValue !== null
            ? isPercentage
              ? formatPercent(currentValue, 2)
              : `${formatNumber(currentValue, 0)}${unit}`
            : '-'}
        </p>

        {comparison && (
          <div
            className={cn(
              'mt-1.5 flex items-center gap-1 text-xs',
              getComparisonColor(comparison)
            )}
          >
            {comparison.direction === 'up' && <ArrowUp className="h-3 w-3" />}
            {comparison.direction === 'down' && (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>环比 {formatComparisonChange(comparison, isPercentage)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前值 */}
        <div>
          <p className="text-sm text-slate-600">当前值</p>
          <p className="text-3xl font-bold text-slate-800">
            {currentValue !== null
              ? isPercentage
                ? formatPercent(currentValue, 2)
                : `${formatNumber(currentValue, 0)}${unit}`
              : '-'}
          </p>
        </div>

        {/* 环比变化 */}
        {comparison && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">环比变化</p>
            <div
              className={cn(
                'flex items-center gap-2 text-lg font-bold',
                getComparisonColor(comparison)
              )}
            >
              {comparison.direction === 'up' && <ArrowUp className="h-5 w-5" />}
              {comparison.direction === 'down' && (
                <ArrowDown className="h-5 w-5" />
              )}
              <span>{formatComparisonChange(comparison, false)}</span>
              <span className="text-sm">
                ({formatComparisonChange(comparison, true)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
