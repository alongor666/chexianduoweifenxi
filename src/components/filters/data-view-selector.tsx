'use client'

import { useAppStore } from '@/store/use-app-store'
import { useFilterStore } from '@/store/domains/filterStore'
import { cn } from '@/lib/utils'

export type DataViewType = 'current' | 'increment'

/**
 * 数据视图类型选择器（紧凑版，用于顶部导航栏）
 * 支持年累计和周增量两种数据类型
 */
export function DataViewSelector() {
  const { filters, updateFilters } = useAppStore()
  const { setDataViewType } = useFilterStore()
  const value = filters.dataViewType

  const options = [
    {
      id: 'current' as const,
      label: '年累计',
    },
    {
      id: 'increment' as const,
      label: '周增量',
    },
  ]

  const handleDataViewTypeChange = (type: 'current' | 'increment') => {
    // 同时更新新旧两个Store的状态，确保数据同步
    updateFilters({ dataViewType: type })
    setDataViewType(type)

    console.log(`[DataViewSelector] 切换数据视图类型: ${type}`)
  }

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-1 shadow-sm border border-slate-200 transition-all duration-200">
      <button
        onClick={() => handleDataViewTypeChange('current')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          filters.dataViewType === 'current'
            ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        )}
      >
        年累计
      </button>

      <button
        onClick={() => handleDataViewTypeChange('increment')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          filters.dataViewType === 'increment'
            ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        )}
      >
        周增量
      </button>
    </div>
  )
}
