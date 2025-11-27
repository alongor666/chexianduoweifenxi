'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import type { FilterState } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('FilterInteractionManager')

const areArraysEqual = (a: ReadonlyArray<number>, b: ReadonlyArray<number>) =>
  a.length === b.length && a.every((value, index) => value === b[index])

/**
 * 筛选器交互管理器
 * 负责处理筛选器之间的级联响应、状态保持和智能默认值
 */
export function FilterInteractionManager() {
  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)
  const rawData = useAppStore(state => state.rawData)

  /**
   * 智能默认值设置
   * 当数据加载时，自动设置合理的默认筛选条件
   */
  const setSmartDefaults = useCallback(() => {
    if (!rawData || rawData.length === 0) return

    // 获取数据中的年份范围
    const years = Array.from(
      new Set(rawData.map(record => record.policy_start_year))
    ).sort()
    const currentYear = new Date().getFullYear()

    // 默认选择当前年份或最新年份
    const defaultYear = years.includes(currentYear)
      ? currentYear
      : years[years.length - 1]

    // 获取该年份的周范围
    const weeksInYear = rawData
      .filter(record => record.policy_start_year === defaultYear)
      .map(record => record.week_number)
    const maxWeek = weeksInYear.reduce((max, week) => Math.max(max, week), 0)

    const defaultSingleWeek = maxWeek > 0 ? maxWeek : null
    const defaultTrendWeeks =
      maxWeek > 0
        ? Array.from({ length: 4 }, (_, i) => maxWeek - i)
            .filter(w => w > 0)
            .sort((a, b) => a - b)
        : []
    const defaultWeeks =
      filters.viewMode === 'single'
        ? defaultSingleWeek != null
          ? [defaultSingleWeek]
          : []
        : defaultTrendWeeks

    // 只在首次加载或筛选条件为空时设置默认值
    const updates: Partial<FilterState> = {}
    if (filters.years.length === 0) {
      updates.years = [defaultYear]
    }
    if (filters.singleModeWeek == null && defaultSingleWeek != null) {
      updates.singleModeWeek = defaultSingleWeek
    }
    if (filters.trendModeWeeks.length === 0 && defaultTrendWeeks.length > 0) {
      updates.trendModeWeeks = defaultTrendWeeks
    }
    if (filters.weeks.length === 0) {
      updates.weeks = defaultWeeks
    }

    if (Object.keys(updates).length > 0) {
      updateFilters(updates)
    }
  }, [
    rawData,
    filters.viewMode,
    filters.years.length,
    filters.weeks.length,
    filters.singleModeWeek,
    filters.trendModeWeeks.length,
    updateFilters,
  ])

  /**
   * 视图模式切换时的级联响应
   * 单周模式 ↔ 多周模式切换时，智能调整周选择
   */
  const handleViewModeChange = useCallback(() => {
    if (!rawData || rawData.length === 0) return

    if (filters.viewMode === 'single') {
      let nextSingleWeek = filters.singleModeWeek

      if (nextSingleWeek == null) {
        const currentWeeks = filters.weeks
        if (currentWeeks.length > 0) {
          nextSingleWeek = currentWeeks.reduce(
            (max, week) => Math.max(max, week),
            0
          )
        } else if (filters.trendModeWeeks.length > 0) {
          nextSingleWeek =
            filters.trendModeWeeks[filters.trendModeWeeks.length - 1]
        } else {
          const relevantWeeks = rawData
            .filter(record =>
              filters.years.length > 0
                ? filters.years.includes(record.policy_start_year)
                : true
            )
            .map(record => record.week_number)
          if (relevantWeeks.length > 0) {
            nextSingleWeek = relevantWeeks.reduce(
              (max, week) => Math.max(max, week),
              0
            )
          }
        }
      }

      const updates: Partial<FilterState> = {}

      if (filters.singleModeWeek !== nextSingleWeek) {
        updates.singleModeWeek = nextSingleWeek ?? null
      }

      const targetWeeks =
        nextSingleWeek != null && nextSingleWeek > 0 ? [nextSingleWeek] : []

      if (!areArraysEqual(filters.weeks, targetWeeks)) {
        updates.weeks = targetWeeks
      }

      if (Object.keys(updates).length > 0) {
        updateFilters(updates)
      }
    } else if (filters.viewMode === 'trend') {
      const relevantWeeksSet = new Set<number>()
      rawData.forEach(record => {
        if (
          filters.years.length === 0 ||
          filters.years.includes(record.policy_start_year)
        ) {
          relevantWeeksSet.add(record.week_number)
        }
      })
      const sortedWeeks = Array.from(relevantWeeksSet).sort((a, b) => a - b)

      if (sortedWeeks.length === 0) {
        return
      }

      let nextTrendWeeks = filters.trendModeWeeks
        .filter(week => sortedWeeks.includes(week))
        .sort((a, b) => a - b)

      if (nextTrendWeeks.length === 0) {
        nextTrendWeeks = [...sortedWeeks]
      }

      const updates: Partial<FilterState> = {}

      if (!areArraysEqual(filters.trendModeWeeks, nextTrendWeeks)) {
        updates.trendModeWeeks = [...nextTrendWeeks]
      }

      if (!areArraysEqual(filters.weeks, nextTrendWeeks)) {
        updates.weeks = [...nextTrendWeeks]
      }

      if (Object.keys(updates).length > 0) {
        updateFilters(updates)
      }
    }
  }, [
    rawData,
    filters.viewMode,
    filters.years,
    filters.weeks,
    filters.singleModeWeek,
    filters.trendModeWeeks,
    updateFilters,
  ])

  /**
   * 年份变化时的级联响应
   * 当年份改变时，自动调整周范围到该年份的有效范围
   */
  const handleYearChange = useCallback(() => {
    if (!rawData || rawData.length === 0 || filters.years.length === 0) return

    // 获取选中年份的所有有效周
    const availableWeeks = new Set<number>()
    rawData.forEach(record => {
      if (filters.years.includes(record.policy_start_year)) {
        availableWeeks.add(record.week_number)
      }
    })

    const validWeeks = Array.from(availableWeeks).sort((a, b) => a - b)
    const latestWeek =
      validWeeks.length > 0 ? validWeeks[validWeeks.length - 1] : null

    const nextSingleWeek =
      filters.singleModeWeek != null &&
      validWeeks.includes(filters.singleModeWeek)
        ? filters.singleModeWeek
        : latestWeek

    let nextTrendWeeks = filters.trendModeWeeks.filter(week =>
      validWeeks.includes(week)
    )

    if (nextTrendWeeks.length === 0 && validWeeks.length > 0) {
      nextTrendWeeks = validWeeks.slice(-12)
    }

    const targetWeeks =
      filters.viewMode === 'single'
        ? nextSingleWeek != null
          ? [nextSingleWeek]
          : []
        : nextTrendWeeks

    const updates: Partial<FilterState> = {}

    if (filters.singleModeWeek !== nextSingleWeek) {
      updates.singleModeWeek = nextSingleWeek ?? null
    }

    if (!areArraysEqual(filters.trendModeWeeks, nextTrendWeeks)) {
      updates.trendModeWeeks = nextTrendWeeks
    }

    if (!areArraysEqual(filters.weeks, targetWeeks)) {
      updates.weeks = targetWeeks
    }

    if (Object.keys(updates).length > 0) {
      updateFilters(updates)
    }
  }, [
    rawData,
    filters.years,
    filters.viewMode,
    filters.singleModeWeek,
    filters.trendModeWeeks,
    filters.weeks,
    updateFilters,
  ])

  /**
   * 数据视图类型变化时的提示
   * 当切换"当周值"和"周增量"时，提供用户友好的提示
   */
  const handleDataViewTypeChange = useCallback(() => {
    // 这里可以添加用户提示逻辑
    // 例如：当切换到"周增量"模式时，提示用户需要选择多周数据
    if (filters.dataViewType === 'increment' && filters.weeks.length < 2) {
      log.info('周增量分析建议', { message: '建议选择多个周期以获得更好的分析效果', weekCount: filters.weeks.length })
    }
  }, [filters.dataViewType, filters.weeks.length])

  /**
   * 组织筛选的级联响应
   * 当选择特定组织时，自动筛选相关的业务数据
   */
  const handleOrganizationChange = useCallback(() => {
    // 这里可以添加组织级联逻辑
    // 例如：某些业务类型只在特定组织中存在
  }, [])

  // 监听数据加载，设置智能默认值
  useEffect(() => {
    setSmartDefaults()
  }, [setSmartDefaults])

  // 监听视图模式变化
  useEffect(() => {
    handleViewModeChange()
  }, [handleViewModeChange])

  // 监听年份变化
  useEffect(() => {
    handleYearChange()
  }, [handleYearChange])

  // 监听数据视图类型变化
  useEffect(() => {
    handleDataViewTypeChange()
  }, [handleDataViewTypeChange])

  // 监听组织变化
  useEffect(() => {
    handleOrganizationChange()
  }, [handleOrganizationChange])

  // 这个组件不渲染任何UI，只负责逻辑处理
  return null
}

/**
 * 筛选器状态持久化Hook
 * 将筛选器状态保存到localStorage，页面刷新后恢复
 */
export function useFilterPersistence() {
  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)

  // 保存筛选器状态到localStorage
  useEffect(() => {
    const filterState = {
      viewMode: filters.viewMode,
      dataViewType: filters.dataViewType,
      years: filters.years,
      weeks: filters.weeks,
      singleModeWeek: filters.singleModeWeek,
      trendModeWeeks: filters.trendModeWeeks,
      organizations: filters.organizations,
      insuranceTypes: filters.insuranceTypes,
      businessTypes: filters.businessTypes,
      coverageTypes: filters.coverageTypes,
      customerCategories: filters.customerCategories,
      vehicleGrades: filters.vehicleGrades,
      terminalSources: filters.terminalSources,
      isNewEnergy: filters.isNewEnergy,
      renewalStatuses: filters.renewalStatuses,
    }

    localStorage.setItem(
      'insurance-analytics-filters',
      JSON.stringify(filterState)
    )
  }, [filters])

  // 从localStorage恢复筛选器状态
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('insurance-analytics-filters')
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters) as Partial<FilterState>
        updateFilters(parsedFilters)
      }
    } catch (error) {
      log.warn('从 localStorage 恢复筛选器状态失败', error)
    }
  }, [updateFilters])
}
