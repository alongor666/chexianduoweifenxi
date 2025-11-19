/**
 * 主题分析模块
 * 将分析维度从"单一KPI"提升到"业务主题健康度诊断"
 *
 * 三大主题：
 * - 保费分析：关注保费进度、件数、单均保费
 * - 赔付分析：关注赔付率、赔款、案均赔款、赔案件数
 * - 边际贡献分析：关注边贡率、成本率、边贡额
 */

'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DualProgress } from '@/components/ui/dual-progress'
import { Progress } from '@/components/ui/progress'
import { ArrowUp, ArrowDown, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getDynamicColorByPremiumProgress,
  getDynamicColorByLossRatio,
  getDynamicColorByContributionMargin,
  getDynamicColorByVariableCostRatio,
  type ColorScale,
} from '@/utils/color-scale'
import {
  getComparisonMetrics,
  formatComparisonChange,
  getComparisonColor,
  type ComparisonMetrics,
} from '@/utils/comparison'
import { formatPercent, formatNumber } from '@/utils/formatters'
import type { KPIResult } from '@/types/insurance'
import {
  usePremiumDimensionAnalysis,
  type PremiumDimensionKey,
  type PremiumDimensionItem,
} from '@/hooks/use-premium-dimension-analysis'
import {
  useLossDimensionAnalysis,
  type LossDimensionKey,
  type LossDimensionItem,
} from '@/hooks/use-loss-dimension-analysis'
import { useMarginalContributionAnalysis } from '@/hooks/use-marginal-contribution-analysis'

// ============= 接口定义 =============

export interface ThematicAnalysisProps {
  /**
   * 当前周期的 KPI 数据
   */
  currentKpis: KPIResult | null

  /**
   * 对比周期的 KPI 数据（用于环比计算）
   */
  compareKpis?: KPIResult | null

  /**
   * 时间进度百分比（0-100）
   */
  timeProgress: number

  /**
   * 年度保费目标（万元）
   */
  annualPremiumTarget?: number

  /**
   * 紧凑模式（用于顶部横向布局）
   */
  compact?: boolean

  /**
   * 自定义类名
   */
  className?: string
}

// ============= 子组件：进度分析卡 =============

interface TimeProgressAnalysisCardProps {
  title: string
  description: string
  objectiveKpi: number | null // 核心目标KPI：时间进度达成率（驱动色彩和主数值）
  achievedValue: number | null // 已达成绝对值
  targetValue: number | null // 目标绝对值
  achievementRate: number | null // 年度达成率
  timeProgress: number // 时间进度百分比
  unit?: string
  compact?: boolean
}

function TimeProgressAnalysisCard({
  title,
  description,
  objectiveKpi,
  achievedValue,
  targetValue,
  achievementRate,
  timeProgress,
  unit = '万元',
  compact = false,
}: TimeProgressAnalysisCardProps) {
  // 使用传入的 objectiveKpi（时间进度达成率）作为核心驱动指标
  // 这符合设计文档中的"数据契约"规范
  const timeProgressAchievementRate = objectiveKpi

  // 获取动态色彩（五级预警）
  const colorScale = getDynamicColorByPremiumProgress(
    timeProgressAchievementRate
  )

  if (compact) {
    return (
      <div className="rounded-lg border bg-white p-3">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-600">{title}</p>
            <p className={cn('text-xl font-bold', colorScale.text)}>
              {timeProgressAchievementRate !== null
                ? `${timeProgressAchievementRate.toFixed(1)}%`
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
          height="h-2"
        />

        <div className="mt-1.5 text-xs text-slate-500">
          {achievedValue !== null && targetValue !== null
            ? `${formatNumber(achievedValue, 0)} / ${formatNumber(targetValue, 0)} ${unit}`
            : '-'}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 核心指标：时间进度达成率 */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-600">时间进度达成率</p>
            <p className={cn('text-3xl font-bold', colorScale.text)}>
              {timeProgressAchievementRate !== null
                ? `${timeProgressAchievementRate.toFixed(1)}%`
                : '-'}
            </p>
          </div>
          <span
            className={cn(
              'rounded px-2 py-1 text-sm font-medium',
              colorScale.bg,
              colorScale.text
            )}
          >
            {colorScale.label}
          </span>
        </div>

        {/* 双轨进度条 */}
        <DualProgress
          achievedProgress={achievementRate ?? 0}
          timeProgress={timeProgress}
          progressColor={colorScale.progress}
        />

        {/* 绝对值展示 */}
        <div className="grid grid-cols-3 gap-4 pt-2 text-sm">
          <div>
            <p className="text-slate-600">已达成</p>
            <p className="font-semibold">
              {achievedValue !== null
                ? `${formatNumber(achievedValue, 0)} ${unit}`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-600">年度目标</p>
            <p className="font-semibold">
              {targetValue !== null
                ? `${formatNumber(targetValue, 0)} ${unit}`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-600">达成率</p>
            <p className="font-semibold">
              {achievementRate !== null
                ? `${achievementRate.toFixed(1)}%`
                : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============= 子组件：比率概览卡 =============

interface RatioOverviewCardProps {
  title: string
  description: string
  ratio: number | null
  kpiId: keyof KPIResult
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  colorFn: (value: number | null | undefined) => ColorScale
  compact?: boolean
}

function RatioOverviewCard({
  title,
  description,
  ratio,
  kpiId,
  currentKpis,
  compareKpis,
  colorFn,
  compact = false,
}: RatioOverviewCardProps) {
  // 获取动态色彩
  const colorScale = colorFn(ratio)

  // 计算环比变化
  const comparison = compareKpis
    ? getComparisonMetrics(kpiId, currentKpis, compareKpis)
    : null

  // 判断是否恶化
  const isWorsened = comparison?.isWorsened ?? false

  if (compact) {
    return (
      <div className="relative rounded-lg border bg-white p-3">
        {/* 恶化警示图标 */}
        {isWorsened && (
          <div className="absolute right-2 top-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        )}

        <div className="mb-2">
          <p className="text-xs text-slate-600">{title}</p>
          <p className={cn('text-xl font-bold', colorScale.text)}>
            {ratio !== null ? formatPercent(ratio, 2) : '-'}
          </p>
        </div>

        <Progress
          value={ratio ?? 0}
          className="h-2"
          indicatorClassName={colorScale.progress}
        />

        {comparison && (
          <div className={cn('mt-1.5 text-xs', getComparisonColor(comparison))}>
            环比 {formatComparisonChange(comparison, true)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {title}
          {isWorsened && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span>恶化</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 核心比率 */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className={cn('text-3xl font-bold', colorScale.text)}>
              {ratio !== null ? formatPercent(ratio, 2) : '-'}
            </p>
          </div>
          <span
            className={cn(
              'rounded px-2 py-1 text-sm font-medium',
              colorScale.bg,
              colorScale.text
            )}
          >
            {colorScale.label}
          </span>
        </div>

        {/* 单轨进度条 */}
        <Progress
          value={Math.min(ratio ?? 0, 100)}
          className="h-3"
          indicatorClassName={colorScale.progress}
        />

        {/* 环比变化 */}
        {comparison && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">环比变化</span>
            <div
              className={cn(
                'flex items-center gap-1 font-semibold',
                getComparisonColor(comparison)
              )}
            >
              {comparison.direction === 'up' && <ArrowUp className="h-4 w-4" />}
              {comparison.direction === 'down' && (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{formatComparisonChange(comparison, true)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============= 子组件：趋势分析卡 =============

interface TrendAnalysisCardProps {
  title: string
  description: string
  kpiId: keyof KPIResult
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  unit?: string
  isPercentage?: boolean
  compact?: boolean
}

function TrendAnalysisCard({
  title,
  description,
  kpiId,
  currentKpis,
  compareKpis,
  unit = '',
  isPercentage = false,
  compact = false,
}: TrendAnalysisCardProps) {
  const currentValue = currentKpis?.[kpiId] as number | null

  // 计算环比变化
  const comparison = compareKpis
    ? getComparisonMetrics(kpiId, currentKpis, compareKpis)
    : null

  if (compact) {
    return (
      <div className="rounded-lg border bg-white p-3">
        <p className="text-xs text-slate-600">{title}</p>
        <p className="text-xl font-bold text-slate-800">
          {currentValue !== null
            ? isPercentage
              ? formatPercent(currentValue, 2)
              : `${formatNumber(currentValue, 0)}${unit}`
            : '-'}
        </p>

        {comparison && (
          <div
            className={cn(
              'mt-1.5 flex items-center gap-1 text-xs',
              getComparisonColor(comparison)
            )}
          >
            {comparison.direction === 'up' && <ArrowUp className="h-3 w-3" />}
            {comparison.direction === 'down' && (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>环比 {formatComparisonChange(comparison, isPercentage)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前值 */}
        <div>
          <p className="text-sm text-slate-600">当前值</p>
          <p className="text-3xl font-bold text-slate-800">
            {currentValue !== null
              ? isPercentage
                ? formatPercent(currentValue, 2)
                : `${formatNumber(currentValue, 0)}${unit}`
              : '-'}
          </p>
        </div>

        {/* 环比变化 */}
        {comparison && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">环比变化</p>
            <div
              className={cn(
                'flex items-center gap-2 text-lg font-bold',
                getComparisonColor(comparison)
              )}
            >
              {comparison.direction === 'up' && <ArrowUp className="h-5 w-5" />}
              {comparison.direction === 'down' && (
                <ArrowDown className="h-5 w-5" />
              )}
              <span>{formatComparisonChange(comparison, false)}</span>
              <span className="text-sm">
                ({formatComparisonChange(comparison, true)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============= 主题容器组件 =============

const PREMIUM_DIMENSION_OPTIONS: Array<{
  value: PremiumDimensionKey
  label: string
}> = [
  { value: 'customer_category_3', label: '客户类别' },
  { value: 'business_type_category', label: '业务类型' },
  { value: 'third_level_organization', label: '三级机构' },
  { value: 'insurance_type', label: '险种类型' },
  { value: 'is_new_energy_vehicle', label: '能源类型' },
  { value: 'is_transferred_vehicle', label: '过户车状态' },
  { value: 'renewal_status', label: '新续转状态' },
]

const DEFAULT_PREMIUM_DIMENSION: PremiumDimensionKey = 'customer_category_3'

const LOSS_DIMENSION_OPTIONS: Array<{
  value: LossDimensionKey
  label: string
}> = [
  { value: 'customer_category_3', label: '客户类别' },
  { value: 'business_type_category', label: '业务类型' },
  { value: 'third_level_organization', label: '三级机构' },
  { value: 'insurance_type', label: '险种类型' },
  { value: 'is_new_energy_vehicle', label: '能源类型' },
  { value: 'is_transferred_vehicle', label: '过户车状态' },
  { value: 'renewal_status', label: '新转续状态' },
]

const DEFAULT_LOSS_DIMENSION: LossDimensionKey = 'customer_category_3'

interface AnalysisSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function AnalysisSection({
  title,
  description,
  children,
}: AnalysisSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function buildComparisonForMetric(
  current: number | null,
  previous: number | null,
  isHigherBetter: boolean
): ComparisonMetrics {
  if (current === null || previous === null) {
    return {
      current,
      previous,
      absoluteChange: null,
      percentChange: null,
      isBetter: false,
      isWorsened: false,
      direction: 'flat',
    }
  }

  const absoluteChange = current - previous
  const percentChange =
    previous !== 0 ? (absoluteChange / Math.abs(previous)) * 100 : null
  let direction: 'up' | 'down' | 'flat' = 'flat'

  if (absoluteChange > 0) direction = 'up'
  else if (absoluteChange < 0) direction = 'down'

  let isBetter = false
  if (direction === 'up' && isHigherBetter) isBetter = true
  if (direction === 'down' && !isHigherBetter) isBetter = true

  let isWorsened = false
  if (direction === 'up' && !isHigherBetter) isWorsened = true
  if (direction === 'down' && isHigherBetter) isWorsened = true

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    direction,
    isBetter,
    isWorsened,
  }
}

function formatSignedValue(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) {
    return '-'
  }
  const abs = Math.abs(value)
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${formatNumber(abs, decimals)}`
}

function clampProgress(value: number | null): number {
  if (value === null || Number.isNaN(value)) return 0
  const clamped = Math.min(Math.max(value, 0), 120)
  return clamped
}

interface PremiumProgressCardProps {
  item: PremiumDimensionItem
  timeProgress: number
  compact?: boolean
}

function PremiumProgressCard({
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

interface PolicyProgressCardProps {
  item: PremiumDimensionItem
  timeProgress: number
  compact?: boolean
}

function PolicyProgressCard({
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

interface AveragePremiumCardProps {
  item: PremiumDimensionItem
  previous?: PremiumDimensionItem
  compact?: boolean
}

function AveragePremiumCard({
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

interface LossRatioRiskCardProps {
  item: LossDimensionItem
  compact?: boolean
}

function LossRatioRiskCard({ item, compact = false }: LossRatioRiskCardProps) {
  const lossRatio = item.current.lossRatio
  const colorScale = getDynamicColorByLossRatio(lossRatio)
  const comparison = buildComparisonForMetric(
    lossRatio,
    item.previous?.lossRatio ?? null,
    false
  )

  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {comparison.isWorsened && (
        <div className="absolute right-3 top-3 text-rose-500">
          <TrendingDown className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{item.label}</p>
          <p
            className={cn(
              compact ? 'text-xl' : 'text-2xl',
              'font-bold',
              colorScale.text
            )}
          >
            {lossRatio !== null ? formatPercent(lossRatio, 1) : '-'}
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

      <Progress
        value={clampProgress(lossRatio)}
        className={cn('mt-3 h-2', compact ? 'mt-2' : 'mt-3')}
        indicatorClassName={colorScale.progress}
      />

      <div className="mt-2 text-xs text-slate-500">
        上期：
        {item.previous?.lossRatio !== null &&
        item.previous?.lossRatio !== undefined
          ? formatPercent(item.previous?.lossRatio, 1)
          : '—'}
      </div>
    </div>
  )
}

type LossTrendMetricKey =
  | 'reportedClaimPayment'
  | 'claimCaseCount'
  | 'averageClaim'

interface LossTrendCardProps {
  item: LossDimensionItem
  metric: LossTrendMetricKey
  unit: string
  decimals?: number
  compact?: boolean
}

function LossTrendCard({
  item,
  metric,
  unit,
  decimals = 1,
  compact = false,
}: LossTrendCardProps) {
  const currentValue = item.current[metric]
  const previousValue = item.previous?.[metric] ?? null
  const comparison = buildComparisonForMetric(
    currentValue,
    previousValue,
    false
  )
  const colorClass = getComparisonColor(comparison)

  const directionIcon =
    comparison.direction === 'up' ? (
      <ArrowUp className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : comparison.direction === 'down' ? (
      <ArrowDown className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    ) : null

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
        {currentValue !== null && currentValue !== undefined
          ? `${formatNumber(currentValue, decimals)}${unit}`
          : '-'}
      </p>

      {comparison.absoluteChange !== null ? (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            colorClass
          )}
        >
          {directionIcon}
          <span>
            {formatSignedValue(comparison.absoluteChange, decimals)}
            {unit}
          </span>
          {comparison.percentChange !== null && (
            <span className="text-xs">
              ({formatSignedValue(comparison.percentChange, 1)}%)
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-slate-400">缺少上期对比</div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        上期：
        {previousValue !== null && previousValue !== undefined
          ? `${formatNumber(previousValue, decimals)}${unit}`
          : '—'}
      </div>
    </div>
  )
}

// ============= 边贡分析专用组件 =============

/**
 * 边贡分析专用卡片组件
 * 显示各业务类型的边贡率和变动成本率，带风险色彩和环比预警
 */
interface MarginRatioGridCardProps {
  label: string
  ratio: number | null
  previous?: number | null
  colorFn: (value: number | null | undefined) => ColorScale
  isHigherBetter: boolean // true: 值越高越好；false: 值越低越好
  compact?: boolean
}

function MarginRatioGridCard({
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

/**
 * 边贡额趋势卡片（满期边贡额和单均边贡额）
 */
interface MarginAmountGridCardProps {
  label: string
  value: number | null
  previous?: number | null
  unit: string
  decimals?: number
  compact?: boolean
}

function MarginAmountGridCard({
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

// ============= Tab组件Props =============

interface TabContentProps {
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  timeProgress: number
  annualPremiumTarget?: number
  compact?: boolean
}

function PremiumAnalysisTab({
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

function LossAnalysisTab({ compact = false }: TabContentProps) {
  const [dimension, setDimension] = useState<LossDimensionKey>(
    DEFAULT_LOSS_DIMENSION
  )
  const items = useLossDimensionAnalysis(dimension)
  const hasData = items.length > 0

  const gridCols = compact
    ? 'grid-cols-2 md:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  const sortByLossRatio = [...items]
    .sort((a, b) => {
      const aValue = a.current.lossRatio ?? -Infinity
      const bValue = b.current.lossRatio ?? -Infinity
      return bValue - aValue
    })
    .slice(0, 12)

  const getAbsoluteChange = (
    item: LossDimensionItem,
    metric: LossTrendMetricKey
  ) => {
    const current = item.current[metric]
    const previous = item.previous?.[metric] ?? null
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined
    ) {
      return -Infinity
    }
    return Math.abs(current - previous)
  }

  const sortByReportedClaim = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'reportedClaimPayment') -
        getAbsoluteChange(a, 'reportedClaimPayment')
    )
    .slice(0, 12)

  const sortByClaimCount = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'claimCaseCount') -
        getAbsoluteChange(a, 'claimCaseCount')
    )
    .slice(0, 12)

  const sortByAverageClaim = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'averageClaim') -
        getAbsoluteChange(a, 'averageClaim')
    )
    .slice(0, 12)

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
            从结果指标到驱动因，逐层定位赔付风险的根源
          </p>
        </div>
        <Select
          value={dimension}
          onValueChange={value => setDimension(value as LossDimensionKey)}
        >
          <SelectTrigger
            className={cn('w-full', compact ? 'sm:w-48' : 'sm:w-60')}
          >
            <SelectValue placeholder="选择分析维度" />
          </SelectTrigger>
          <SelectContent>
            {LOSS_DIMENSION_OPTIONS.map(option => (
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
            title="满期赔付率概览"
            description="按业务板块呈现赔付风险等级，并高亮环比恶化的业务"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByLossRatio.map(item => (
                <LossRatioRiskCard
                  key={`loss-ratio-${item.key}`}
                  item={item}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="已报告赔款分析"
            description="识别赔款额增长最快的业务线，以判断赔付额上升的主因"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByReportedClaim.map(item => (
                <LossTrendCard
                  key={`reported-${item.key}`}
                  item={item}
                  metric="reportedClaimPayment"
                  unit=" 万元"
                  decimals={2}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="赔案件数分析"
            description="衡量出险频率的变化，判断风险是否因为事故更频繁"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByClaimCount.map(item => (
                <LossTrendCard
                  key={`claim-count-${item.key}`}
                  item={item}
                  metric="claimCaseCount"
                  unit=" 件"
                  decimals={0}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="案均赔款分析"
            description="观察单次赔款的严重度变化，识别赔付额被拉高的根因"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByAverageClaim.map(item => (
                <LossTrendCard
                  key={`avg-claim-${item.key}`}
                  item={item}
                  metric="averageClaim"
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

function ContributionAnalysisTab({ compact = false }: TabContentProps) {
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

// 内部组件的引用集合，便于调试和防止被摇树优化移除
export const ThematicAnalysisInternals = {
  TimeProgressAnalysisCard,
  RatioOverviewCard,
  TrendAnalysisCard,
}

// ============= 主组件 =============

export function ThematicAnalysis({
  currentKpis,
  compareKpis,
  timeProgress,
  annualPremiumTarget,
  compact = false,
  className,
}: ThematicAnalysisProps) {
  return (
    <div className={cn('w-full', className)}>
      <Tabs defaultValue="premium" className="w-full">
        <TabsList
          className={cn('grid w-full', compact ? 'grid-cols-3' : 'grid-cols-3')}
        >
          <TabsTrigger value="premium">保费分析</TabsTrigger>
          <TabsTrigger value="loss">赔付分析</TabsTrigger>
          <TabsTrigger value="contribution">边贡分析</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-4">
          <PremiumAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            annualPremiumTarget={annualPremiumTarget}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="loss" className="mt-4">
          <LossAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="contribution" className="mt-4">
          <ContributionAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
