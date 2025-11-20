/**
 * 赔付趋势卡片
 * 显示赔款、赔案件数、案均赔款等指标的当前值和环比变化
 */

'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getComparisonColor, type ComparisonMetrics } from '@/utils/comparison'
import { formatNumber } from '@/utils/formatters'
import type { LossDimensionItem } from '@/hooks/use-loss-dimension-analysis'

type LossTrendMetricKey =
  | 'reportedClaimPayment'
  | 'claimCaseCount'
  | 'averageClaim'

interface LossTrendCardProps {
  item: LossDimensionItem
  metric: LossTrendMetricKey
  unit: string
  decimals?: number
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

function formatSignedValue(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) {
    return '-'
  }
  const abs = Math.abs(value)
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${formatNumber(abs, decimals)}`
}

export function LossTrendCard({
  item,
  metric,
  unit,
  decimals = 1,
  compact = false,
}: LossTrendCardProps) {
  const currentValue = item.current[metric]
  const previousValue = item.previous?.[metric] ?? null
  const comparison = buildComparisonForMetric(
    currentValue,
    previousValue,
    false
  )
  const colorClass = getComparisonColor(comparison)

  const directionIcon =
    comparison.direction === 'up' ? (
      <ArrowUp className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : comparison.direction === 'down' ? (
      <ArrowDown className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : null

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <p className="text-xs text-slate-500">{item.label}</p>
      <p
        className={cn(
          compact ? 'text-xl' : 'text-2xl',
          'font-bold text-slate-800'
        )}
      >
        {currentValue !== null && currentValue !== undefined
          ? `${formatNumber(currentValue, decimals)}${unit}`
          : '-'}
      </p>

      {comparison.absoluteChange !== null ? (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            colorClass
          )}
        >
          {directionIcon}
          <span>
            {formatSignedValue(comparison.absoluteChange, decimals)}
            {unit}
          </span>
          {comparison.percentChange !== null && (
            <span className="text-xs">
              ({formatSignedValue(comparison.percentChange, 1)}%)
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-slate-400">缺少上期对比</div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        上期：
        {previousValue !== null && previousValue !== undefined
          ? `${formatNumber(previousValue, decimals)}${unit}`
          : '—'}
      </div>
    </div>
  )
}
