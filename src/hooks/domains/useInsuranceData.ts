/**
 * 保险数据聚合Hook
 * 提供统一的数据访问接口，隐藏Store和Service的细节
 *
 * @architecture 应用层Hook
 * - 聚合多个领域Store的状态
 * - 调用Service层处理数据
 * - 为组件提供简洁的业务接口
 *
 * @usage
 * ```tsx
 * function Dashboard() {
 *   const { filteredData, stats, isLoading } = useInsuranceData()
 *   return <div>总记录: {stats.totalRecords}</div>
 * }
 * ```
 */

import { useMemo } from 'react'
import { useDataStore } from '@/store/domains/dataStore'
import { useFilterStore } from '@/store/domains/filterStore'
import { DataService } from '@/services/DataService'

/**
 * 保险数据Hook - 统一数据访问接口
 */
export function useInsuranceData() {
  // 从领域Store获取状态
  const rawData = useDataStore(state => state.rawData)
  const isLoading = useDataStore(state => state.isLoading)
  const error = useDataStore(state => state.error)
  const filters = useFilterStore(state => state.filters)

  // 使用Service处理数据（纯函数，可缓存）
  const filteredData = useMemo(
    () => DataService.filter(rawData, filters),
    [rawData, filters]
  )

  // 计算统计信息
  const stats = useMemo(
    () => DataService.getStatistics(filteredData),
    [filteredData]
  )

  // 原始数据统计
  const rawStats = useMemo(
    () => DataService.getStatistics(rawData),
    [rawData]
  )

  return {
    // 数据
    rawData,
    filteredData,

    // 统计信息
    stats,
    rawStats,

    // 状态
    isLoading,
    error,

    // 便捷属性
    hasData: rawData.length > 0,
    filterPercentage:
      rawData.length > 0
        ? ((filteredData.length / rawData.length) * 100).toFixed(1)
        : '0',
  }
}

/**
 * 按周次获取数据
 */
export function useInsuranceDataByWeek(weekNumber: number) {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)

  const weekData = useMemo(
    () => DataService.getByWeek(rawData, weekNumber, filters),
    [rawData, weekNumber, filters]
  )

  return {
    data: weekData,
    stats: DataService.getStatistics(weekData),
  }
}

/**
 * 按周次范围获取数据
 */
export function useInsuranceDataByWeekRange(
  startWeek: number,
  endWeek: number
) {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)

  const rangeData = useMemo(
    () => DataService.getByWeekRange(rawData, [startWeek, endWeek], filters),
    [rawData, startWeek, endWeek, filters]
  )

  return {
    data: rangeData,
    stats: DataService.getStatistics(rangeData),
  }
}

/**
 * 按维度分组的数据
 */
export function useInsuranceDataByDimension<K extends keyof import('@/types/insurance').InsuranceRecord>(
  dimension: K
) {
  const { filteredData } = useInsuranceData()

  const groups = useMemo(
    () => DataService.groupBy(filteredData, dimension),
    [filteredData, dimension]
  )

  return {
    groups,
    dimensionValues: Array.from(groups.keys()),
  }
}
