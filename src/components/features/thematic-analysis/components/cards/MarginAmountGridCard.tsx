/**
 * 边际贡献额网格卡片
 * 显示满期边贡额和单均边贡额的当前值和环比变化
 */

'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import { formatSignedValue } from '../../utils'

interface MarginAmountGridCardProps {
  label: string
  value: number | null
  previous?: number | null
  unit: string
  decimals?: number
  compact?: boolean
}

export function MarginAmountGridCard({
  label,
  value,
  previous,
  unit,
  decimals = 0,
  compact = false,
}: MarginAmountGridCardProps) {
  // 计算环比变化
  const hasComparison =
    value !== null && previous !== null && previous !== undefined
  const change = hasComparison ? value - previous : null
  const changePercent =
    hasComparison && previous !== 0
      ? (change! / Math.abs(previous)) * 100
      : null

  const direction =
    change === null ? 'flat' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  // 边贡额是"越高越好"，所以上升=好，下降=坏
  const isBetter = direction === 'up'
  const isWorsened = direction === 'down'

  const changeColor = isBetter
    ? 'text-emerald-600'
    : isWorsened
      ? 'text-rose-500'
      : 'text-slate-500'

  const directionIcon =
    direction === 'up' ? (
      <ArrowUp className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : direction === 'down' ? (
      <ArrowDown className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : null

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* 业务类型标签 */}
      <p className="text-xs text-slate-500 mb-1">{label}</p>

      {/* 当前值 */}
      <p
        className={cn(
          compact ? 'text-xl' : 'text-2xl',
          'font-bold text-slate-800'
        )}
      >
        {value !== null ? `${formatNumber(value, decimals)}${unit}` : '-'}
      </p>

      {/* 环比变化 */}
      {hasComparison && change !== null ? (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            changeColor
          )}
        >
          {directionIcon}
          <span>{formatSignedValue(change, decimals)}</span>
          {changePercent !== null && (
            <span className="text-xs">
              ({formatSignedValue(changePercent, 1)}%)
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-slate-400">-</div>
      )}

      {/* 上期值 */}
      <div className="mt-2 text-xs text-slate-500">
        上期：
        {previous !== null && previous !== undefined
          ? `${formatNumber(previous, decimals)}${unit}`
          : '—'}
      </div>
    </div>
  )
}
