/**
 * 保费进度卡片
 * 显示各维度的保费进度、时间达成率和目标对比
 */

'use client'

import { DualProgress } from '@/components/ui/dual-progress'
import { cn } from '@/lib/utils'
import { getDynamicColorByPremiumProgress } from '@/utils/color-scale'
import { formatNumber } from '@/utils/formatters'
import type { PremiumDimensionItem } from '@/hooks/use-premium-dimension-analysis'

interface PremiumProgressCardProps {
  item: PremiumDimensionItem
  timeProgress: number
  compact?: boolean
}

export function PremiumProgressCard({
  item,
  timeProgress,
  compact = false,
}: PremiumProgressCardProps) {
  const achievementRate =
    item.premiumPlanYuan > 0
      ? (item.signedPremiumYuan / item.premiumPlanYuan) * 100
      : null
  const timeAchievementRate =
    achievementRate !== null && timeProgress > 0
      ? (achievementRate / timeProgress) * 100
      : null
  const colorScale = getDynamicColorByPremiumProgress(timeAchievementRate)

  const actualWan = item.signedPremiumYuan / 10000
  const targetWan =
    item.premiumPlanYuan > 0 ? item.premiumPlanYuan / 10000 : null

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{item.label}</p>
          <p
            className={cn(
              compact ? 'text-xl' : 'text-2xl',
              'font-bold',
              colorScale.text
            )}
          >
            {timeAchievementRate !== null
              ? `${timeAchievementRate.toFixed(1)}%`
              : '-'}
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

      <DualProgress
        achievedProgress={achievementRate ?? 0}
        timeProgress={timeProgress}
        progressColor={colorScale.progress}
        showLabels={false}
        height={compact ? 'h-2' : 'h-2.5'}
      />

      <div className="mt-2 text-xs text-slate-500">
        {targetWan !== null
          ? `${formatNumber(actualWan, 1)} / ${formatNumber(targetWan, 1)} 万`
          : `${formatNumber(actualWan, 1)} 万`}
      </div>
    </div>
  )
}
