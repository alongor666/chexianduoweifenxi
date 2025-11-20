import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import type { InsuranceRecord, FilterState } from '@/types/insurance'
import { DataService } from '@/services/DataService'

/**
 * 根据筛选条件过滤记录
 *
 * @deprecated 建议直接使用 DataService.filter()，此函数仅为保持向后兼容
 * @param records 原始记录
 * @param filters 筛选条件
 * @returns 过滤后的记录
 */
export function applyFilters(
  records: InsuranceRecord[],
  filters: FilterState
): InsuranceRecord[] {
  // 统一使用 DataService.filter() 实现
  return DataService.filter(records, filters)
}

/**
 * 获取过滤后的数据
 * 根据当前的筛选条件过滤原始数据
 */
export function useFilteredData(): InsuranceRecord[] {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)

  return useMemo(() => DataService.filter(rawData, filters), [rawData, filters])
}
