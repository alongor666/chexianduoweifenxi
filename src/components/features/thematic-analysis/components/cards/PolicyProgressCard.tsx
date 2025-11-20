/**
 * 保单件数进度卡片
 * 显示各维度的保单件数进度和时间达成率
 */

'use client'

import { DualProgress } from '@/components/ui/dual-progress'
import { cn } from '@/lib/utils'
import { getDynamicColorByPremiumProgress } from '@/utils/color-scale'
import { formatNumber } from '@/utils/formatters'
import type { PremiumDimensionItem } from '@/hooks/use-premium-dimension-analysis'

interface PolicyProgressCardProps {
  item: PremiumDimensionItem
  timeProgress: number
  compact?: boolean
}

export function PolicyProgressCard({
  item,
  timeProgress,
  compact = false,
}: PolicyProgressCardProps) {
  const policyTarget = item.policyTarget !== null ? item.policyTarget : null

  const achievementRate =
    policyTarget && policyTarget > 0
      ? (item.policyCount / policyTarget) * 100
      : null

  const timeAchievementRate =
    achievementRate !== null && timeProgress > 0
      ? (achievementRate / timeProgress) * 100
      : null

  const colorScale = getDynamicColorByPremiumProgress(timeAchievementRate)

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
        {policyTarget !== null
          ? `${formatNumber(item.policyCount, 0)} / ${formatNumber(policyTarget, 1)} 件`
          : `${formatNumber(item.policyCount, 0)} 件 · 缺少目标`}
      </div>
    </div>
  )
}
