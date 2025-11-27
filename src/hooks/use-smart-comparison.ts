/**
 * 智能环比 Hook
 * 自动找到上一个有数据的周期进行对比
 * 如果上一周期数据缺失，则继续往前跳跃查找
 */

import { useMemo } from 'react'
import { useDataStore, useFilterStore } from '@/store/domains'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import type { InsuranceRecord, FilterState } from '@/types/insurance'
import { DataService } from '@/services/DataService'
import { logger } from '@/lib/logger'

const log = logger.create('SmartComparison')

/**
 * 应用筛选条件（除了周次）
 * @deprecated 使用 DataService.filter() 替代
 */
function applyFiltersExceptWeek(
  data: InsuranceRecord[],
  filters: FilterState
): InsuranceRecord[] {
  // 统一使用 DataService.filter()，排除 weeks 字段
  return DataService.filter(data, filters, ['weeks'])
}

/**
 * 查找上一个有数据的周期（增强版：支持缺失周次跳跃）
 * @param rawData 原始数据
 * @param currentWeek 当前周次
 * @param filters 筛选条件
 * @param maxJumpBack 最多往前跳跃几周（默认5周）
 * @returns 上一周期的数据和周次，如果找不到则返回null
 */
function findPreviousWeekWithData(
  rawData: InsuranceRecord[],
  currentWeek: number,
  filters: FilterState,
  maxJumpBack = 5
): InsuranceRecord[] | null {
  // 应用除周次之外的筛选条件
  const baseFilteredData = applyFiltersExceptWeek(rawData, filters)

  // 获取所有可用的周次（去重并排序）
  const availableWeeks = Array.from(
    new Set(baseFilteredData.map(r => r.week_number))
  ).sort((a, b) => a - b)

  if (availableWeeks.length === 0) {
    return null
  }

  // 找到小于 currentWeek 的最大周次（即最近的前一周）
  const previousWeeks = availableWeeks.filter(week => week < currentWeek)

  if (previousWeeks.length === 0) {
    return null
  }

  // 取最近的前一周（最大的那个）
  const previousWeek = previousWeeks[previousWeeks.length - 1]

  // 检查是否在允许的跳跃范围内
  const jumpDistance = currentWeek - previousWeek
  if (jumpDistance > maxJumpBack) {
    log.warn('前一周距离当前周超过最大跳跃范围，跳过环比', {
      previousWeek,
      currentWeek,
      maxJumpBack,
      jumpDistance,
    })
    return null
  }

  const weekData = baseFilteredData.filter(
    record => record.week_number === previousWeek
  )

  if (weekData.length > 0) {
    log.debug('找到前一周数据', {
      previousWeek,
      recordCount: weekData.length,
      currentWeek,
    })
    return weekData
  }

  return null
}

/**
 * 使用智能环比数据的Hook
 * @returns { currentKpi, compareKpi, previousWeekFound }
 */
export function useSmartComparison(
  options: {
    /**
     * 年度目标（可选）
     */
    annualTargetYuan?: number | null
    /**
     * 最大往前跳跃周数
     */
    maxJumpBack?: number
  } = {}
) {
  const { annualTargetYuan = null, maxJumpBack = 5 } = options

  // 从新的领域Store获取数据
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)

  // 解构常用字段
  const { viewMode, singleModeWeek, dataViewType, years } = filters

  // 使用 DataService.filter() 统一过滤逻辑
  const filteredData = useMemo(() => {
    return DataService.filter(rawData, filters)
  }, [rawData, filters])

  const comparison = useMemo(() => {
    // 性能监控：记录计算开始时间
    const startTime = performance.now()

    if (filteredData.length === 0) {
      return {
        currentKpi: null,
        compareKpi: null,
        previousWeekNumber: null,
      }
    }

    // 获取当前选择的周次（优化：避免对大数组使用展开运算符）
    const currentWeek =
      viewMode === 'single' && singleModeWeek
        ? singleModeWeek
        : filteredData.length > 0
          ? filteredData.reduce((max, r) => Math.max(max, r.week_number), 0)
          : 1 // 默认为第1周

    log.debug('开始计算环比数据', {
      currentWeek,
      dataCount: filteredData.length,
    })

    // 获取当前年份
    const currentYear =
      years.length > 0
        ? Math.max(...years)
        : new Date().getFullYear()

    // 计算当前KPI（传递完整的计算参数）
    const currentKpi = kpiEngine.calculate(filteredData, {
      annualTargetYuan,
      mode: dataViewType || 'current',
      currentWeekNumber: currentWeek,
      year: currentYear,
    })

    // 查找上一个有数据的周期
    const previousWeekData = findPreviousWeekWithData(
      rawData,
      currentWeek,
      filters,
      maxJumpBack
    )

    if (!previousWeekData || previousWeekData.length === 0) {
      const elapsed = performance.now() - startTime
      log.debug('计算完成（无环比数据）', { elapsed: elapsed.toFixed(2) + 'ms' })
      return {
        currentKpi,
        compareKpi: null,
        previousWeekNumber: null,
      }
    }

    // 获取上一周期的周次（优化：避免对大数组使用展开运算符）
    const previousWeekNumber =
      previousWeekData.length > 0
        ? previousWeekData.reduce((max, r) => Math.max(max, r.week_number), 0)
        : 1 // 默认为第1周

    // 计算上一周期的KPI（同样传递完整的计算参数）
    const compareKpi = kpiEngine.calculate(previousWeekData, {
      annualTargetYuan,
      mode: dataViewType || 'current',
      currentWeekNumber: previousWeekNumber,
      year: currentYear,
    })

    const elapsed = performance.now() - startTime
    log.debug('计算完成', {
      currentWeek,
      compareWeek: previousWeekNumber,
      elapsed: elapsed.toFixed(2) + 'ms',
    })

    return {
      currentKpi,
      compareKpi,
      previousWeekNumber,
    }
  }, [filteredData, rawData, filters, annualTargetYuan, maxJumpBack])

  return comparison
}
