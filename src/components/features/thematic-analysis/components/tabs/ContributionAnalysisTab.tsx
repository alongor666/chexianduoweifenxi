/**
 * 边际贡献分析标签页
 *
 * 按业务类型分析，固定维度（无需维度选择器）
 * 包含四个分析板块：
 * - 满期边贡率：盈利能力最终体现
 * - 变动成本率：业务直接成本
 * - 满期边贡额：利润额环比变化
 * - 单均边贡额：单位利润质量
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useMarginalContributionAnalysis } from '@/hooks/use-marginal-contribution-analysis'
import {
  getDynamicColorByContributionMargin,
  getDynamicColorByVariableCostRatio,
} from '@/utils/color-scale'
import { MarginRatioGridCard, MarginAmountGridCard } from '../cards'
import { AnalysisSection } from '../AnalysisSection'
import type { TabContentProps } from '../../types'

export function ContributionAnalysisTab({ compact = false }: TabContentProps) {
  const items = useMarginalContributionAnalysis()
  const hasData = items.length > 0

  const gridCols = compact
    ? 'grid-cols-2 md:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  // 按满期边贡率降序排序（已在hook中完成）
  const sortedByMarginRatio = items

  // 按变动成本率升序排序（成本越低越好，所以升序）
  const sortedByCostRatio = [...items].sort((a, b) => {
    const aValue = a.variableCostRatio ?? Infinity
    const bValue = b.variableCostRatio ?? Infinity
    return aValue - bValue
  })

  // 按满期边贡额绝对变化排序（取前12个）
  const sortedByMarginAmount = [...items]
    .sort((a, b) => {
      const aChange = a.previous
        ? Math.abs(
            a.contributionMarginAmount - a.previous.contributionMarginAmount
          )
        : -Infinity
      const bChange = b.previous
        ? Math.abs(
            b.contributionMarginAmount - b.previous.contributionMarginAmount
          )
        : -Infinity
      return bChange - aChange
    })
    .slice(0, 16)

  // 按单均边贡额绝对变化排序（取前12个）
  const sortedByAvgContribution = [...items]
    .sort((a, b) => {
      const aCurrent = a.averageContribution ?? 0
      const bCurrent = b.averageContribution ?? 0
      const aPrevious = a.previous?.averageContribution ?? 0
      const bPrevious = b.previous?.averageContribution ?? 0
      const aChange = Math.abs(aCurrent - aPrevious)
      const bChange = Math.abs(bCurrent - bPrevious)
      return bChange - aChange
    })
    .slice(0, 16)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800">边贡分析</h2>
        <p className="text-xs text-slate-500">
          从利润率到利润额，再到单位利润质量的完整盈利能力诊断
        </p>
      </div>

      {hasData ? (
        <>
          {/* 满期边贡率分析 */}
          <AnalysisSection
            title="满期边贡率"
            description="业务盈利能力的最终体现，越高越好"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortedByMarginRatio.map(item => (
                <MarginRatioGridCard
                  key={`margin-ratio-${item.key}`}
                  label={item.label}
                  ratio={item.contributionMarginRatio}
                  previous={item.previous?.contributionMarginRatio}
                  colorFn={getDynamicColorByContributionMargin}
                  isHigherBetter={true}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          {/* 变动成本率分析 */}
          <AnalysisSection
            title="变动成本率"
            description="业务的直接成本，越低越好"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortedByCostRatio.map(item => (
                <MarginRatioGridCard
                  key={`cost-ratio-${item.key}`}
                  label={item.label}
                  ratio={item.variableCostRatio}
                  previous={item.previous?.variableCostRatio}
                  colorFn={getDynamicColorByVariableCostRatio}
                  isHigherBetter={false}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          {/* 满期边贡额分析 */}
          <AnalysisSection
            title="满期边贡额"
            description="对比各业务线满期边贡额的环比变化"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortedByMarginAmount.map(item => (
                <MarginAmountGridCard
                  key={`margin-amount-${item.key}`}
                  label={item.label}
                  value={item.contributionMarginAmount}
                  previous={item.previous?.contributionMarginAmount}
                  unit=" 万元"
                  decimals={2}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          {/* 单均边贡额分析 */}
          <AnalysisSection
            title="单均边贡额"
            description="对比各业务线单均边贡额的环比变化"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortedByAvgContribution.map(item => (
                <MarginAmountGridCard
                  key={`avg-contribution-${item.key}`}
                  label={item.label}
                  value={item.averageContribution}
                  previous={item.previous?.averageContribution}
                  unit=" 元"
                  decimals={0}
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
