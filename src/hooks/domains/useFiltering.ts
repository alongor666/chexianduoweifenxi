/**
 * 筛选操作聚合Hook
 * 提供统一的筛选操作接口
 *
 * @architecture 应用层Hook
 * - 封装FilterStore的操作
 * - 提供便捷的筛选方法
 * - 支持筛选状态的保存和恢复
 *
 * @usage
 * ```tsx
 * function FilterPanel() {
 *   const { filters, updateFilters, resetFilters, activeCount } = useFiltering()
 *   return <button onClick={resetFilters}>重置 ({activeCount})</button>
 * }
 * ```
 */

import { useCallback } from 'react'
import { useFilterStore } from '@/store/domains/filterStore'
import { safeMax } from '@/lib/utils/array-utils'
import type { FilterState } from '@/types/insurance'

/**
 * 筛选操作Hook
 */
export function useFiltering() {
  const filters = useFilterStore(state => state.filters)
  const filterUpdateFilters = useFilterStore(state => state.updateFilters)
  const filterResetFilters = useFilterStore(state => state.resetFilters)
  const filterSetViewMode = useFilterStore(state => state.setViewMode)
  const filterSetDataViewType = useFilterStore(state => state.setDataViewType)
  const getActiveFilterCount = useFilterStore(
    state => state.getActiveFilterCount
  )
  const isFilterActive = useFilterStore(state => state.isFilterActive)

  const updateFilters = useCallback(
    (nextFilters: Partial<FilterState>) => {
      filterUpdateFilters(nextFilters)
    },
    [filterUpdateFilters]
  )

  const resetFilters = useCallback(() => {
    filterResetFilters()
  }, [filterResetFilters])

  const setViewMode = useCallback(
    (mode: 'single' | 'trend') => {
      filterSetViewMode(mode)
      appSetViewMode(mode)
    },
    [filterSetViewMode, appSetViewMode]
  )

  const setDataViewType = useCallback(
    (type: FilterState['dataViewType']) => {
      filterSetDataViewType(type)
      appUpdateFilters({ dataViewType: type })
    },
    [filterSetDataViewType, appUpdateFilters]
  )

  // 便捷方法：设置年份筛选
  const setYears = useCallback(
    (years: number[]) => {
      updateFilters({ years })
    },
    [updateFilters]
  )

  // 便捷方法：设置周次筛选
  const setWeeks = useCallback(
    (weeks: number[]) => {
      updateFilters({ weeks })
    },
    [updateFilters]
  )

  // 便捷方法：设置单周模式周次
  const setSingleModeWeek = useCallback(
    (week: number | null) => {
      updateFilters({
        singleModeWeek: week,
        weeks: week !== null ? [week] : [],
      })
    },
    [updateFilters]
  )

  // 便捷方法：设置组织机构筛选
  const setOrganizations = useCallback(
    (organizations: string[]) => {
      updateFilters({ organizations })
    },
    [updateFilters]
  )

  // 便捷方法：设置业务类型筛选
  const setBusinessTypes = useCallback(
    (businessTypes: string[]) => {
      updateFilters({ businessTypes })
    },
    [updateFilters]
  )

  // 便捷方法：切换视图模式并自动调整周次
  const switchViewMode = useCallback(
    (mode: 'single' | 'trend') => {
      setViewMode(mode)

      if (mode === 'single') {
        // 切换到单周模式：选择最新周次
        const selectedWeek =
          filters.singleModeWeek ??
          (filters.weeks && filters.weeks.length > 0
            ? filters.weeks[filters.weeks.length - 1]
            : null)

        updateFilters({
          singleModeWeek: selectedWeek,
          weeks: selectedWeek !== null ? [selectedWeek] : [],
        })
      } else {
        // 切换到趋势模式：使用已选周次或默认周次
        const trendWeeks =
          filters.trendModeWeeks && filters.trendModeWeeks.length > 0
            ? [...filters.trendModeWeeks]
            : filters.weeks && filters.weeks.length > 0
              ? [...filters.weeks]
              : []

        updateFilters({
          trendModeWeeks: trendWeeks,
          weeks: trendWeeks,
        })
      }
    },
    [filters, setViewMode, updateFilters]
  )

  return {
    // 筛选状态
    filters,

    // 基础操作
    updateFilters,
    resetFilters,

    // 视图模式
    setViewMode,
    switchViewMode,
    setDataViewType,

    // 便捷方法
    setYears,
    setWeeks,
    setSingleModeWeek,
    setOrganizations,
    setBusinessTypes,

    // 状态查询
    activeFilterCount: getActiveFilterCount(),
    isFilterActive,

    // 便捷属性
    viewMode: filters.viewMode,
    dataViewType: filters.dataViewType,
    currentWeek: filters.singleModeWeek,
    // 当前选定年份（用于兼容性）
    selectedYear:
      filters.years && filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear(),
  }
}

/**
 * 筛选预设Hook
 * 提供常用的筛选预设
 */
export function useFilterPresets() {
  const filterUpdateFilters = useFilterStore(state => state.updateFilters)
  const filterResetFilters = useFilterStore(state => state.resetFilters)
  const appUpdateFilters = useAppStore(state => state.updateFilters)
  const appResetFilters = useAppStore(state => state.resetFilters)

  const updateFilters = useCallback(
    (nextFilters: Partial<FilterState>) => {
      filterUpdateFilters(nextFilters)
      appUpdateFilters(nextFilters)
    },
    [filterUpdateFilters, appUpdateFilters]
  )

  const resetFilters = useCallback(() => {
    filterResetFilters()
  }, [filterResetFilters])

  // 预设1：查看最近一周
  const viewLatestWeek = useCallback(() => {
    // 需要配合数据获取可用周次，这里简化处理
    updateFilters({
      viewMode: 'single',
      // singleModeWeek 需要从数据中获取
    })
  }, [updateFilters])

  // 预设2：查看最近4周趋势
  const viewLast4Weeks = useCallback(() => {
    updateFilters({
      viewMode: 'trend',
      // trendModeWeeks 需要从数据中获取
    })
  }, [updateFilters])

  // 预设3：查看当年所有数据
  const viewCurrentYear = useCallback(() => {
    const currentYear = new Date().getFullYear()
    updateFilters({
      years: [currentYear],
    })
  }, [updateFilters])

  // 预设4：清空所有筛选
  const clearAll = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  return {
    viewLatestWeek,
    viewLast4Weeks,
    viewCurrentYear,
    clearAll,
  }
}
