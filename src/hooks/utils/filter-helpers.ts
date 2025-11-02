import type { FilterState } from '@/types/insurance'

/**
 * 根据当前筛选器构造上一周期的筛选条件
 * 默认将周序号整体回退一周，过滤掉小于1的周次
 */
export function buildPreviousFilters(filters: FilterState): FilterState | null {
  if (!filters.weeks || filters.weeks.length === 0) {
    return null
  }

  const previousWeeks = Array.from(new Set(filters.weeks))
    .map(week => week - 1)
    .filter(week => week >= 1)

  if (previousWeeks.length === 0) {
    return null
  }

  const previousTrendWeeks = filters.trendModeWeeks?.length
    ? filters.trendModeWeeks.map(week => week - 1).filter(week => week >= 1)
    : filters.trendModeWeeks

  return {
    ...filters,
    weeks: previousWeeks,
    singleModeWeek:
      filters.singleModeWeek && filters.singleModeWeek > 1
        ? filters.singleModeWeek - 1
        : filters.singleModeWeek,
    trendModeWeeks: previousTrendWeeks,
  }
}
