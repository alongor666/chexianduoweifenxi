/**
 * 边际贡献率网格卡片
 * 显示各业务类型的边贡率和变动成本率，带风险色彩和环比预警
 */

'use client'

import { TrendingDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ColorScale } from '@/utils/color-scale'
import { formatPercent } from '@/utils/formatters'

interface MarginRatioGridCardProps {
  label: string
  ratio: number | null
  previous?: number | null
  colorFn: (value: number | null | undefined) => ColorScale
  isHigherBetter: boolean // true: 值越高越好；false: 值越低越好
  compact?: boolean
}

export function MarginRatioGridCard({
  label,
  ratio,
  previous,
  colorFn,
  isHigherBetter,
  compact = false,
}: MarginRatioGridCardProps) {
  const colorScale = colorFn(ratio)

  // 计算环比变化
  const hasComparison =
    ratio !== null && previous !== null && previous !== undefined
  const change = hasComparison ? ratio - previous : null
  const isWorsened = hasComparison
    ? isHigherBetter
      ? change! < 0
      : change! > 0
    : false

  // 计算进度条值（限制在0-120之间）
  const progressValue = ratio !== null ? Math.min(Math.max(ratio, 0), 120) : 0

  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* 环比恶化警示图标 */}
      {isWorsened && (
        <div className="absolute right-3 top-3 text-rose-500">
          <TrendingDown className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
      )}

      {/* 业务类型标签 */}
      <p className="text-xs text-slate-500 mb-1">{label}</p>

      {/* 比率值 */}
      <p
        className={cn(
          compact ? 'text-xl' : 'text-2xl',
          'font-bold',
          colorScale.text
        )}
      >
        {ratio !== null ? formatPercent(ratio, 1) : '-'}
      </p>

      {/* 进度条 */}
      <Progress
        value={progressValue}
        className={cn('mt-3', compact ? 'h-2' : 'h-2.5')}
        indicatorClassName={colorScale.progress}
      />
    </div>
  )
}
