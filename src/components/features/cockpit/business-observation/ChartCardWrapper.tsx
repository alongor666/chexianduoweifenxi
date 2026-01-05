'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * 图表卡片包装器 - 通用组件
 *
 * 为图表组件提供统一的卡片样式和标题布局
 *
 * @example
 * ```tsx
 * <ChartCardWrapper title="业务健康度热力图">
 *   <BusinessTypeHeatmap />
 * </ChartCardWrapper>
 * ```
 */
interface ChartCardWrapperProps {
  /** 卡片标题 */
  title: string
  /** 子组件内容 */
  children: React.ReactNode
  /** 自定义样式类名 */
  className?: string
}

export function ChartCardWrapper({
  title,
  children,
  className,
}: ChartCardWrapperProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 bg-white/70 backdrop-blur-sm',
        className
      )}
    >
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        {title}
      </h4>
      {children}
    </div>
  )
}
