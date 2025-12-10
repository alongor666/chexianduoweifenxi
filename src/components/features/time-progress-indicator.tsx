'use client'

import { Calendar, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import { useMemo } from 'react'
import { getWeekEndDate, getDaysFromYearStart } from '@/lib/utils/date-utils'
import { safeMax } from '@/lib/utils/array-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface TimeProgressIndicatorProps {
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 是否使用紧凑模式（用于顶部工具栏）
   */
  compact?: boolean
}

/**
 * 格式化日期为 M月D日
 */
function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

/**
 * 格式化日期为完整格式
 */
function formatDateFull(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

/**
 * 获取进度条颜色
 */
function getProgressColor(percent: number): string {
  if (percent < 50) return 'bg-blue-500'
  if (percent <= 90) return 'bg-orange-500'
  return 'bg-red-500'
}

/**
 * 获取进度条背景色
 */
function getProgressBgColor(percent: number): string {
  if (percent < 50) return 'bg-blue-100'
  if (percent <= 90) return 'bg-orange-100'
  return 'bg-red-100'
}

/**
 * 时间进度指示器组件
 * 普通模式：📅 2025年第42周 | ⏳ 已过 26 天 / 剩余 5 天（79.5%）下方加进度条
 * 紧凑模式：已过 291 天 / 剩余 74 天 (79.7%) 加进度条
 */
export function TimeProgressIndicator({
  className,
  compact = false,
}: TimeProgressIndicatorProps) {
  const rawData = useAppStore(state => state.rawData)
  const viewMode = useAppStore(state => state.filters.viewMode)
  const singleModeWeek = useAppStore(state => state.filters.singleModeWeek)
  const filterYears = useAppStore(state => state.filters.years)

  // 计算当前的截止日期和时间进度
  const timeProgress = useMemo(() => {
    const filters = {
      viewMode,
      singleModeWeek,
      years: filterYears,
    }

    if (rawData.length === 0) {
      // 如果没有数据，使用当前日期
      const now = new Date()
      const daysPassed = getDaysFromYearStart(now)
      const daysRemaining = 365 - daysPassed
      const progressPercent = (daysPassed / 365) * 100

      return {
        year: now.getFullYear(),
        weekNumber: Math.ceil(daysPassed / 7),
        daysPassed,
        daysRemaining,
        progressPercent,
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now,
        totalDays: 365,
      }
    }

    // 获取当前选择的周次和年份
    let selectedYear: number
    let selectedWeek: number | null = null

    if (filters.viewMode === 'single' && filters.singleModeWeek) {
      selectedWeek = filters.singleModeWeek
    }

    // 从数据中获取最大周次作为当前周
    if (!selectedWeek) {
      const weeks = rawData.map(r => r.week_number)
      const maxWeek = weeks.length > 0 ? safeMax(weeks) : 1
      selectedWeek = maxWeek
    }

    // 获取年份
    if (filters.years.length > 0) {
      selectedYear = Math.max(...filters.years)
    } else {
      const years = rawData.map(r => r.policy_start_year)
      selectedYear =
        years.length > 0 ? safeMax(years) : new Date().getFullYear()
    }

    // 计算周期的开始和结束日期
    const yearStart = new Date(selectedYear, 0, 1)
    const weekEndDate = getWeekEndDate(selectedYear, selectedWeek)

    // 计算天数
    const daysPassed =
      Math.floor(
        (weekEndDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    const totalDays =
      new Date(selectedYear, 11, 31).getDate() === 31
        ? selectedYear % 4 === 0 &&
          (selectedYear % 100 !== 0 || selectedYear % 400 === 0)
          ? 366
          : 365
        : 365
    const daysRemaining = totalDays - daysPassed
    const progressPercent = (daysPassed / totalDays) * 100

    return {
      year: selectedYear,
      weekNumber: selectedWeek,
      daysPassed,
      daysRemaining,
      progressPercent,
      startDate: yearStart,
      endDate: weekEndDate,
      totalDays,
    }
  }, [rawData, viewMode, singleModeWeek, filterYears])

  const progressColor = getProgressColor(timeProgress.progressPercent)
  const progressBgColor = getProgressBgColor(timeProgress.progressPercent)

  // 紧凑模式渲染
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200',
          className
        )}
      >
        {/* 紧凑文本 */}
        <span className="text-xs text-slate-600 whitespace-nowrap">
          已过{' '}
          <span className="font-medium text-slate-700">
            {timeProgress.daysPassed}
          </span>{' '}
          天 / 剩余{' '}
          <span className="font-medium text-slate-700">
            {timeProgress.daysRemaining}
          </span>{' '}
          天
          <span className="ml-1 text-slate-500">
            ({timeProgress.progressPercent.toFixed(1)}%)
          </span>
        </span>

        {/* 紧凑进度条 */}
        <div className="relative w-16 flex-shrink-0">
          <div
            className={cn(
              'h-1 rounded-full transition-all duration-200',
              progressBgColor
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-200',
                progressColor
              )}
              style={{
                width: `${Math.min(timeProgress.progressPercent, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // 普通模式渲染（保持原有样式）
  return (
    <div className={cn('space-y-3', className)}>
      {/* 主信息行 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm">
        {/* 当前周次 */}
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium">
            {timeProgress.year}年第{timeProgress.weekNumber}周
          </span>
        </div>

        {/* 分隔符 - 仅桌面端显示 */}
        <div className="hidden sm:block text-slate-400">|</div>

        {/* 天数统计 - 移动端压缩显示 */}
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm">
            已过{' '}
            <span className="font-medium text-slate-700">
              {timeProgress.daysPassed}
            </span>{' '}
            天 / 剩余{' '}
            <span className="font-medium text-slate-700">
              {timeProgress.daysRemaining}
            </span>{' '}
            天
            <span className="ml-1 text-slate-500">
              ({timeProgress.progressPercent.toFixed(1)}%)
            </span>
          </span>
        </div>

        {/* Tooltip 信息 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors duration-200 flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2 text-sm">
              <div>
                <strong>周期起始日期：</strong>
                {formatDateFull(timeProgress.startDate)}
              </div>
              <div>
                <strong>周期结束日期：</strong>
                {formatDateFull(timeProgress.endDate)}
              </div>
              <div>
                <strong>总天数：</strong>
                {timeProgress.totalDays} 天
              </div>
              <div>
                <strong>已过天数：</strong>
                {timeProgress.daysPassed} 天
              </div>
              <div>
                <strong>剩余天数：</strong>
                {timeProgress.daysRemaining} 天
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 进度条 - 移动端高度调整 */}
      <div className="relative">
        <div
          className={cn(
            'h-1 sm:h-1 rounded-full transition-all duration-200',
            progressBgColor
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-200',
              progressColor
            )}
            style={{ width: `${Math.min(timeProgress.progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
