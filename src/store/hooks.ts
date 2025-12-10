/**
 * Store 自定义 Hooks
 */

import { useMemo } from 'react'
import { useAppStore } from './use-app-store'
import { filterRecordsWithExclusions } from './utils/filter-utils'

/**
 * 选择器：获取数据统计信息
 */
export const useDataStats = () => {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)

  const filteredCount = useMemo(
    () => filterRecordsWithExclusions(rawData, filters).length,
    [rawData, filters]
  )

  return {
    totalRecords: rawData.length,
    filteredRecords: filteredCount,
    filterPercentage:
      rawData.length > 0
        ? ((filteredCount / rawData.length) * 100).toFixed(1)
        : '0',
  }
}
