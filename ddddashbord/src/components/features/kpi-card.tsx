'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KPICardProps {
  /**
   * KPI 名称
   */
  title: string

  /**
   * KPI 值
   */
  value: number | null | undefined

  /**
   * 单位（如 %、万元等）
   */
  unit?: string

  /**
   * 描述信息
   */
  description?: string

  /**
   * 值的颜色（可选，如果不提供则使用默认颜色）
   */
  valueColor?: string

  /**
   * 背景颜色（可选）
   */
  bgColor?: string

  /**
   * 对比值（用于显示变化）
   */
  compareValue?: number | null

  /**
   * 对比值单位
   */
  compareUnit?: string

  /**
   * 格式化函数（如果不提供，使用默认格式化）
   */
  formatter?: (value: number | null | undefined) => string

  /**
   * 是否为大卡片（占据更多空间）
   */
  large?: boolean

  /**
   * 自定义图标
   */
  icon?: React.ReactNode

  /**
   * 点击事件
   */
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  unit = '',
  description,
  valueColor,
  bgColor,
  compareValue,
  compareUnit = '%',
  formatter,
  large = false,
  icon,
  onClick,
}: KPICardProps) {
  // 格式化主值
  const formattedValue = formatter
    ? formatter(value)
    : value !== null && value !== undefined && !isNaN(value)
      ? value.toLocaleString('zh-CN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : '-'

  // 格式化对比值
  const hasCompareValue =
    compareValue !== null && compareValue !== undefined && !isNaN(compareValue)

  const compareDirection =
    hasCompareValue && compareValue > 0
      ? 'up'
      : hasCompareValue && compareValue < 0
        ? 'down'
        : 'flat'

  const compareColorClass =
    compareDirection === 'up'
      ? 'text-green-600'
      : compareDirection === 'down'
        ? 'text-red-600'
        : 'text-slate-500'

  const formattedCompareValue = hasCompareValue
    ? `${compareValue > 0 ? '+' : ''}${compareValue.toFixed(2)}${compareUnit}`
    : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm transition-all duration-300',
        'hover:border-blue-300 hover:bg-white/90 hover:shadow-lg hover:shadow-blue-100/50',
        onClick && 'cursor-pointer',
        large ? 'col-span-2' : 'col-span-1',
        bgColor
      )}
      onClick={onClick}
    >
      {/* 装饰性渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative p-6">
        {/* 标题行 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>
          {icon && (
            <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              {icon}
            </div>
          )}
        </div>

        {/* 数值显示 */}
        <div className="mb-2 flex items-baseline gap-2">
          <span
            className={cn(
              'text-3xl font-bold tabular-nums',
              valueColor || 'text-slate-800'
            )}
          >
            {formattedValue}
          </span>
          {unit && (
            <span className="text-base font-medium text-slate-500">{unit}</span>
          )}
        </div>

        {/* 对比值显示 */}
        {formattedCompareValue && (
          <div className="flex items-center gap-1.5">
            {compareDirection === 'up' && (
              <TrendingUp className="h-4 w-4 text-green-600" />
            )}
            {compareDirection === 'down' && (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            {compareDirection === 'flat' && (
              <Minus className="h-4 w-4 text-slate-500" />
            )}
            <span className={cn('text-sm font-semibold', compareColorClass)}>
              {formattedCompareValue}
            </span>
            <span className="text-xs text-slate-500">vs 上期</span>
          </div>
        )}
      </div>

      {/* 底部装饰条（可选） */}
      {valueColor && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-1 transition-all duration-300',
            valueColor.replace('text-', 'bg-'),
            'opacity-0 group-hover:opacity-100'
          )}
        />
      )}
    </div>
  )
}

/**
 * KPI 卡片骨架屏
 */
export function KPICardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl border border-slate-200 bg-white/80 p-6',
        large ? 'col-span-2' : 'col-span-1'
      )}
    >
      <div className="mb-4 h-4 w-24 rounded bg-slate-200" />
      <div className="mb-2 h-8 w-32 rounded bg-slate-200" />
      <div className="h-3 w-20 rounded bg-slate-200" />
    </div>
  )
}
