'use client'

import { Calendar, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import { cn } from '@/lib/utils'
import { useFiltering } from '@/hooks/domains/useFiltering'

interface CompactTimeFilterProps {
  mode: 'single-only' | 'flexible'
}

/**
 * 紧凑版时间筛选器（用于全局筛选区）
 * 支持年度和周序号的弹出式选择
 */
export function CompactTimeFilter({ mode }: CompactTimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { filters, updateFilters, switchViewMode } = useFiltering()
  const { rawData } = useInsuranceData()

  // 切换单选/多选模式
  const handleToggleMultiSelect = () => {
    if (mode !== 'flexible') return
    const nextMode = filters.viewMode === 'single' ? 'trend' : 'single'
    switchViewMode(nextMode)
  }

  const isFlexibleMode = mode === 'flexible'
  const isSingleMode = !isFlexibleMode || filters.viewMode === 'single'
  const selectedWeeks = isSingleMode
    ? filters.singleModeWeek != null
      ? [filters.singleModeWeek]
      : []
    : filters.trendModeWeeks

  // 单选模式页面强制保持单周模式
  useEffect(() => {
    if (!isFlexibleMode && filters.viewMode !== 'single') {
      switchViewMode('single')
    }
  }, [isFlexibleMode, filters.viewMode, switchViewMode])

  // 联动：根据其他筛选条件，分别计算年度与周的可选项
  const recordsForYears = DataService.filter(rawData, filters, ['years'])
  const recordsForWeeks = DataService.filter(rawData, filters, ['weeks'])

  const availableYears = Array.from(
    new Set(recordsForYears.map(record => record.policy_start_year))
  ).sort((a, b) => b - a)

  const availableWeeks = Array.from(
    new Set(recordsForWeeks.map(record => record.week_number))
  ).sort((a, b) => a - b)

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleYearToggle = (year: number) => {
    const newYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year]
    updateFilters({ years: newYears })
  }

  const handleWeekToggle = (week: number) => {
    if (isSingleMode) {
      const nextWeek = filters.singleModeWeek === week ? null : week
      updateFilters({
        singleModeWeek: nextWeek,
        weeks: nextWeek != null ? [nextWeek] : [],
      })
      return
    }

    const isSelected = filters.trendModeWeeks.includes(week)
    const newWeeks = isSelected
      ? filters.trendModeWeeks.filter(w => w !== week)
      : [...filters.trendModeWeeks, week].sort((a, b) => a - b)
    updateFilters({ trendModeWeeks: newWeeks, weeks: newWeeks })
  }

  const handleSelectAllYears = () => {
    if (availableYears.length === 0) return
    updateFilters({ years: [...availableYears] })
  }

  const handleInvertYears = () => {
    if (availableYears.length === 0) return
    const inverted = availableYears.filter(
      year => !filters.years.includes(year)
    )
    updateFilters({ years: inverted })
  }

  const handleClearYears = () => {
    if (filters.years.length === 0) return
    updateFilters({ years: [] })
  }

  const handleSelectAllWeeks = () => {
    if (availableWeeks.length === 0) return
    if (isSingleMode) return
    updateFilters({
      trendModeWeeks: [...availableWeeks],
      weeks: [...availableWeeks],
    })
  }

  const handleInvertWeeks = () => {
    if (availableWeeks.length === 0) return
    if (isSingleMode) return
    const inverted = availableWeeks.filter(
      week => !filters.trendModeWeeks.includes(week)
    )
    updateFilters({ trendModeWeeks: inverted, weeks: inverted })
  }

  const handleClearWeeks = () => {
    if (selectedWeeks.length === 0) return
    if (isSingleMode) {
      updateFilters({ singleModeWeek: null, weeks: [] })
    } else {
      updateFilters({ trendModeWeeks: [], weeks: [] })
    }
  }

  const handleReset = () => {
    updateFilters({
      years: [],
      weeks: [],
      singleModeWeek: null,
      trendModeWeeks: [],
    })
  }

  const hasSelection = filters.years.length > 0 || selectedWeeks.length > 0
  const showYearBulkActions = availableYears.length > 3
  const showWeekBulkActions =
    isFlexibleMode && !isSingleMode && availableWeeks.length > 3

  // 生成标签文本
  const getLabel = () => {
    if (!hasSelection) return '时间'

    const parts: string[] = []
    if (filters.years.length > 0) {
      if (filters.years.length === 1) {
        parts.push(`${filters.years[0]}年`)
      } else {
        parts.push(`${filters.years.length}个年度`)
      }
    }
    if (selectedWeeks.length > 0) {
      if (selectedWeeks.length === 1) {
        parts.push(`W${selectedWeeks[0]}`)
      } else {
        parts.push(`${selectedWeeks.length}周`)
      }
    }
    return parts.join(' · ')
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border',
          hasSelection
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <Calendar className="w-4 h-4" />
        <span className="whitespace-nowrap">{getLabel()}</span>
        {hasSelection && (
          <div className="flex items-center gap-1">
            <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">
              {(filters.years.length || 0) + (selectedWeeks.length || 0)}
            </span>
          </div>
        )}
      </button>

      {/* 弹出面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <h3 className="font-medium text-slate-900">时间筛选</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasSelection && (
                <button
                  onClick={handleReset}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                >
                  清空
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
            {/* 周序号选择模式切换 */}
            {isFlexibleMode && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                <span className="text-xs font-medium text-slate-700">
                  周序号选择模式
                </span>
                <button
                  onClick={handleToggleMultiSelect}
                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isSingleMode ? (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>单选模式</span>
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>多选模式</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 年度选择 */}
            <div>
              <label className="text-xs text-slate-600 mb-2 block">
                保单年度
              </label>
              {showYearBulkActions && (
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllYears}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    全选
                  </button>
                  <button
                    onClick={handleInvertYears}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    反选
                  </button>
                  <button
                    onClick={handleClearYears}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    清空
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearToggle(year)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md border transition-colors',
                      filters.years.includes(year)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {year}年
                  </button>
                ))}
              </div>
            </div>

            {/* 周序号选择 */}
            <div>
              <label className="text-xs text-slate-600 mb-2 block">
                周序号{' '}
                <span className="text-slate-400">
                  ({availableWeeks.length}周可选)
                </span>
                {isFlexibleMode && !isSingleMode && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    多选模式
                  </span>
                )}
              </label>
              {showWeekBulkActions && (
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllWeeks}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    全选
                  </button>
                  <button
                    onClick={handleInvertWeeks}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    反选
                  </button>
                  <button
                    onClick={handleClearWeeks}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    清空
                  </button>
                </div>
              )}
              <div className="grid grid-cols-7 gap-1.5">
                {availableWeeks.map(week => (
                  <button
                    key={week}
                    onClick={() => handleWeekToggle(week)}
                    className={cn(
                      'px-2 py-1.5 text-xs rounded border transition-colors',
                      selectedWeeks.includes(week)
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {`W${week}`}
                  </button>
                ))}
              </div>
              {isSingleMode && (
                <p className="text-xs text-slate-500 mt-2">
                  单选模式：点击周序号进行选择，再次点击取消选择
                </p>
              )}
            </div>
          </div>

          {/* 底部统计 */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            {hasSelection ? (
              <span>
                已选择{' '}
                {filters.years.length > 0 && (
                  <span className="font-medium text-slate-700">
                    {filters.years.length}个年度
                  </span>
                )}
                {filters.years.length > 0 && selectedWeeks.length > 0 && (
                  <span> 和 </span>
                )}
                {selectedWeeks.length > 0 && (
                  <span className="font-medium text-slate-700">
                    {selectedWeeks.length}周
                    {!isSingleMode && selectedWeeks.length > 1 && ' (多选)'}
                  </span>
                )}
              </span>
            ) : (
              <span>未选择任何时间条件</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
