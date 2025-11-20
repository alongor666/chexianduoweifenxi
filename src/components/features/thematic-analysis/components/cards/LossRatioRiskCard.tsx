/**
 * 赔付率风险卡片
 * 显示各维度的赔付率及风险等级，标记环比恶化情况
 */

'use client'

import { TrendingDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getDynamicColorByLossRatio } from '@/utils/color-scale'
import { formatPercent } from '@/utils/formatters'
import type { LossDimensionItem } from '@/hooks/use-loss-dimension-analysis'
import type { ComparisonMetrics } from '@/utils/comparison'

interface LossRatioRiskCardProps {
  item: LossDimensionItem
  compact?: boolean
}

function buildComparisonForMetric(
  current: number | null,
  previous: number | null,
  isHigherBetter: boolean
): ComparisonMetrics {
  if (current === null || previous === null) {
    return {
      current,
      previous,
      absoluteChange: null,
      percentChange: null,
      isBetter: false,
      isWorsened: false,
      direction: 'flat',
    }
  }

  const absoluteChange = current - previous
  const percentChange =
    previous !== 0 ? (absoluteChange / Math.abs(previous)) * 100 : null
  let direction: 'up' | 'down' | 'flat' = 'flat'

  if (absoluteChange > 0) direction = 'up'
  else if (absoluteChange < 0) direction = 'down'

  let isBetter = false
  if (direction === 'up' && isHigherBetter) isBetter = true
  if (direction === 'down' && !isHigherBetter) isBetter = true

  let isWorsened = false
  if (direction === 'up' && !isHigherBetter) isWorsened = true
  if (direction === 'down' && isHigherBetter) isWorsened = true

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    direction,
    isBetter,
    isWorsened,
  }
}

function clampProgress(value: number | null): number {
  if (value === null || Number.isNaN(value)) return 0
  const clamped = Math.min(Math.max(value, 0), 120)
  return clamped
}

export function LossRatioRiskCard({ item, compact = false }: LossRatioRiskCardProps) {
  const lossRatio = item.current.lossRatio
  const colorScale = getDynamicColorByLossRatio(lossRatio)
  const comparison = buildComparisonForMetric(
    lossRatio,
    item.previous?.lossRatio ?? null,
    false
  )

  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {comparison.isWorsened && (
        <div className="absolute right-3 top-3 text-rose-500">
          <TrendingDown className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{item.label}</p>
          <p
            className={cn(
              compact ? 'text-xl' : 'text-2xl',
              'font-bold',
              colorScale.text
            )}
          >
            {lossRatio !== null ? formatPercent(lossRatio, 1) : '-'}
          </p>
        </div>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium',
            colorScale.bg,
            colorScale.text
          )}
        >
          {colorScale.label}
        </span>
      </div>

      <Progress
        value={clampProgress(lossRatio)}
        className={cn('mt-3 h-2', compact ? 'mt-2' : 'mt-3')}
        indicatorClassName={colorScale.progress}
      />

      <div className="mt-2 text-xs text-slate-500">
        上期：
        {item.previous?.lossRatio !== null &&
        item.previous?.lossRatio !== undefined
          ? formatPercent(item.previous?.lossRatio, 1)
          : '—'}
      </div>
    </div>
  )
}
