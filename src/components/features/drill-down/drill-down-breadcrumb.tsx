/**
 * 下钻面包屑导航组件
 * 显示当前的下钻路径，支持点击返回到上层
 */

'use client'

import { ChevronRight, Home, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DrillDownStep } from '@/types/drill-down'
import { formatBooleanValue } from '@/types/drill-down'
import { cn } from '@/lib/utils'

export interface DrillDownBreadcrumbProps {
  /**
   * 下钻步骤列表
   */
  steps: DrillDownStep[]

  /**
   * 点击某个步骤时的回调（返回到该层级）
   * @param stepIndex 步骤索引，0表示根级别
   */
  onNavigate: (stepIndex: number) => void

  /**
   * 是否紧凑模式
   */
  compact?: boolean

  /**
   * 自定义类名
   */
  className?: string
}

export function DrillDownBreadcrumb({
  steps,
  onNavigate,
  compact = false,
  className,
}: DrillDownBreadcrumbProps) {
  // 如果没有下钻步骤，不显示面包屑
  if (steps.length === 0) {
    return null
  }

  /**
   * 格式化显示值
   */
  const formatDisplayValue = (value: string | boolean): string => {
    if (typeof value === 'boolean') {
      return formatBooleanValue(value)
    }
    return String(value)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2',
        compact ? 'text-xs' : 'text-sm',
        className
      )}
    >
      {/* 根级别按钮 */}
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        className={cn(
          'h-auto gap-1.5 px-2 py-1 hover:bg-blue-50 hover:text-blue-700',
          compact ? 'text-xs' : 'text-sm'
        )}
        onClick={() => onNavigate(0)}
        title="返回根级别"
      >
        <Home className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
        <span className="font-medium">全部</span>
      </Button>

      {/* 下钻路径 */}
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight
            className={cn(
              'shrink-0 text-slate-400',
              compact ? 'h-3 w-3' : 'h-4 w-4'
            )}
          />
          <Button
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className={cn(
              'h-auto gap-2 px-2 py-1',
              index === steps.length - 1
                ? 'bg-blue-50 text-blue-700 font-semibold cursor-default'
                : 'hover:bg-blue-50 hover:text-blue-700',
              compact ? 'text-xs' : 'text-sm'
            )}
            onClick={() => {
              // 如果不是最后一个步骤，允许点击返回
              if (index < steps.length - 1) {
                onNavigate(index + 1)
              }
            }}
            disabled={index === steps.length - 1}
            title={
              index === steps.length - 1
                ? '当前层级'
                : `返回到 ${step.dimensionLabel}`
            }
          >
            <span className="text-slate-500">{step.dimensionLabel}:</span>
            <span className="font-medium">
              {formatDisplayValue(step.value)}
            </span>
          </Button>
        </div>
      ))}

      {/* 清除按钮 */}
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        className={cn(
          'ml-auto h-auto p-1 text-slate-400 hover:bg-red-50 hover:text-red-600',
          compact ? 'h-5 w-5' : 'h-6 w-6'
        )}
        onClick={() => onNavigate(0)}
        title="清除所有下钻"
      >
        <X className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </Button>
    </div>
  )
}
