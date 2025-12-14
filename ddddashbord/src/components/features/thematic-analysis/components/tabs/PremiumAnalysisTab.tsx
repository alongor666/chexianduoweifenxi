/**
 * 保费分析标签页
 *
 * 支持多维度分析（客户类别、业务类型、三级机构、险种类型、能源类型、过户车状态、新续转状态）
 * 包含三个分析板块：
 * - 保费进度分析：时间进度达成率
 * - 保单件数进度分析：件数增长速度对比
 * - 单均保费分析：平均保费水平及环比变化
 */

'use client'

import React, { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  usePremiumDimensionAnalysis,
  type PremiumDimensionKey,
} from '@/hooks/use-premium-dimension-analysis'
import {
  PREMIUM_DIMENSION_OPTIONS,
  DEFAULT_PREMIUM_DIMENSION,
} from '../../constants'
import {
  PremiumProgressCard,
  PolicyProgressCard,
  AveragePremiumCard,
} from '../cards'
import { AnalysisSection } from '../AnalysisSection'
import type { TabContentProps } from '../../types'

export function PremiumAnalysisTab({
  timeProgress,
  compact = false,
}: TabContentProps) {
  const [dimension, setDimension] = useState<PremiumDimensionKey>(
    DEFAULT_PREMIUM_DIMENSION
  )
  const { items, previousMap } = usePremiumDimensionAnalysis(dimension)

  const gridCols = compact
    ? 'grid-cols-2 md:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  const hasData = items.length > 0

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex flex-col gap-3',
          compact
            ? 'sm:flex-row sm:items-center sm:justify-between'
            : 'md:flex-row md:items-center md:justify-between'
        )}
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800">分析维度</h2>
          <p className="text-xs text-slate-500">
            单选一个维度，联动观察保费进度、件数进度与单均保费
          </p>
        </div>
        <Select
          value={dimension}
          onValueChange={value => setDimension(value as PremiumDimensionKey)}
        >
          <SelectTrigger
            className={cn('w-full', compact ? 'sm:w-48' : 'sm:w-60')}
          >
            <SelectValue placeholder="选择分析维度" />
          </SelectTrigger>
          <SelectContent>
            {PREMIUM_DIMENSION_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasData ? (
        <>
          <AnalysisSection
            title="保费进度分析"
            description="衡量各类业务保费收入与时间进度的快慢"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {items.map(item => (
                <PremiumProgressCard
                  key={`premium-${item.key}`}
                  item={item}
                  timeProgress={timeProgress}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="保单件数进度分析"
            description="对比件数增长速度与时间推移的差距"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {items.map(item => (
                <PolicyProgressCard
                  key={`policy-${item.key}`}
                  item={item}
                  timeProgress={timeProgress}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="单均保费分析"
            description="查看平均保费水平及相对上期的变化幅度"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {items.map(item => (
                <AveragePremiumCard
                  key={`avg-${item.key}`}
                  item={item}
                  previous={previousMap.get(item.key)}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          当前筛选下暂无可用数据，请调整筛选条件后重试
        </div>
      )}
    </div>
  )
}
