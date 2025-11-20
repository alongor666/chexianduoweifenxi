/**
 * 单均保费卡片
 * 显示各维度的平均保费及环比变化
 */

'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import type { PremiumDimensionItem } from '@/hooks/use-premium-dimension-analysis'

interface AveragePremiumCardProps {
  item: PremiumDimensionItem
  previous?: PremiumDimensionItem
  compact?: boolean
}

export function AveragePremiumCard({
  item,
  previous,
  compact = false,
}: AveragePremiumCardProps) {
  const currentValue = item.averagePremium
  const previousValue = previous?.averagePremium ?? null

  const changeValue =
    currentValue !== null && previousValue !== null
      ? currentValue - previousValue
      : null

  const changePercent =
    changeValue !== null && previousValue !== null && previousValue !== 0
      ? (changeValue / Math.abs(previousValue)) * 100
      : null

  const direction =
    changeValue === null
      ? 'flat'
      : changeValue > 0
        ? 'up'
        : changeValue < 0
          ? 'down'
          : 'flat'

  const changeColor =
    direction === 'up'
      ? 'text-emerald-600'
      : direction === 'down'
        ? 'text-rose-500'
        : 'text-slate-500'

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
        {currentValue !== null ? `${formatNumber(currentValue, 0)} 元` : '-'}
      </p>

      {changeValue !== null ? (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            changeColor
          )}
        >
          {direction === 'up' && <ArrowUp className="h-4 w-4" />}
          {direction === 'down' && <ArrowDown className="h-4 w-4" />}
          <span>
            {`${changeValue > 0 ? '+' : ''}${formatNumber(Math.round(changeValue), 0)}`}
          </span>
          {changePercent !== null && (
            <span className="text-xs">
              ({`${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`})
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-slate-400">缺少上期对比</div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        上期：
        {previousValue !== null ? `${formatNumber(previousValue, 0)} 元` : '—'}
      </div>
    </div>
  )
}
