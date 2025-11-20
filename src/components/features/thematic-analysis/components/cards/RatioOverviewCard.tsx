/**
 * 比率概览卡片
 * 显示各种比率指标（如赔付率、边贡率等），支持动态色彩和环比对比
 */

'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowUp, ArrowDown, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColorScale } from '@/utils/color-scale'
import {
  getComparisonMetrics,
  formatComparisonChange,
  getComparisonColor,
} from '@/utils/comparison'
import { formatPercent } from '@/utils/formatters'
import type { KPIResult } from '@/types/insurance'

interface RatioOverviewCardProps {
  title: string
  description: string
  ratio: number | null
  kpiId: keyof KPIResult
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  colorFn: (value: number | null | undefined) => ColorScale
  compact?: boolean
}

export function RatioOverviewCard({
  title,
  description,
  ratio,
  kpiId,
  currentKpis,
  compareKpis,
  colorFn,
  compact = false,
}: RatioOverviewCardProps) {
  // 获取动态色彩
  const colorScale = colorFn(ratio)

  // 计算环比变化
  const comparison = compareKpis
    ? getComparisonMetrics(kpiId, currentKpis, compareKpis)
    : null

  // 判断是否恶化
  const isWorsened = comparison?.isWorsened ?? false

  if (compact) {
    return (
      <div className="relative rounded-lg border bg-white p-3">
        {/* 恶化警示图标 */}
        {isWorsened && (
          <div className="absolute right-2 top-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        )}

        <div className="mb-2">
          <p className="text-xs text-slate-600">{title}</p>
          <p className={cn('text-xl font-bold', colorScale.text)}>
            {ratio !== null ? formatPercent(ratio, 2) : '-'}
          </p>
        </div>

        <Progress
          value={ratio ?? 0}
          className="h-2"
          indicatorClassName={colorScale.progress}
        />

        {comparison && (
          <div className={cn('mt-1.5 text-xs', getComparisonColor(comparison))}>
            环比 {formatComparisonChange(comparison, true)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {title}
          {isWorsened && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span>恶化</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 核心比率 */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className={cn('text-3xl font-bold', colorScale.text)}>
              {ratio !== null ? formatPercent(ratio, 2) : '-'}
            </p>
          </div>
          <span
            className={cn(
              'rounded px-2 py-1 text-sm font-medium',
              colorScale.bg,
              colorScale.text
            )}
          >
            {colorScale.label}
          </span>
        </div>

        {/* 单轨进度条 */}
        <Progress
          value={Math.min(ratio ?? 0, 100)}
          className="h-3"
          indicatorClassName={colorScale.progress}
        />

        {/* 环比变化 */}
        {comparison && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">环比变化</span>
            <div
              className={cn(
                'flex items-center gap-1 font-semibold',
                getComparisonColor(comparison)
              )}
            >
              {comparison.direction === 'up' && <ArrowUp className="h-4 w-4" />}
              {comparison.direction === 'down' && (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{formatComparisonChange(comparison, true)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
