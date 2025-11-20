/**
 * 时间进度分析卡片
 * 显示核心目标KPI、已达成值、目标值、达成率等，支持紧凑模式和完整模式
 */

'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DualProgress } from '@/components/ui/dual-progress'
import { cn } from '@/lib/utils'
import {
  getDynamicColorByPremiumProgress,
} from '@/utils/color-scale'
import { formatNumber } from '@/utils/formatters'

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

export function TimeProgressAnalysisCard({
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
