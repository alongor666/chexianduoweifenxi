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
import { buildComparisonForMetric, clampProgress } from '../../utils'

interface LossRatioRiskCardProps {
  item: LossDimensionItem
  compact?: boolean
}

export function LossRatioRiskCard({
  item,
  compact = false,
}: LossRatioRiskCardProps) {
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
