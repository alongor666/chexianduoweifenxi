'use client'

import { RotateCcw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/store/domains/filterStore'
import { ProductFilter } from './product-filter'
import { CustomerFilter } from './customer-filter'
import { ChannelFilter } from './channel-filter'
import { FilterPresets } from '@/components/features/filter-presets'
import {
  FilterFeedback,
  FilterStats,
} from '@/components/filters/filter-feedback'

export function FilterPanel() {
  const filters = useFilterStore(state => state.filters)
  const resetFilters = useFilterStore(state => state.resetFilters)

  // 重置筛选器
  const handleResetFilters = () => {
    resetFilters()
  }

  // 检查是否有任何活动的业务维度筛选器（不包括全局筛选器）
  const hasActiveFilters =
    filters.insuranceTypes.length > 0 ||
    filters.businessTypes.length > 0 ||
    filters.coverageTypes.length > 0 ||
    filters.customerCategories.length > 0 ||
    filters.vehicleGrades.length > 0 ||
    filters.renewalStatuses.length > 0 ||
    filters.terminalSources.length > 0 ||
    filters.isNewEnergy !== null

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl">
      {/* 筛选器反馈和统计 */}
      <FilterFeedback />
      <FilterStats />

      {/* 标题栏 */}
      <div className="mb-8 flex items-center justify-between border-b-2 border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Filter className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">业务维度筛选</h2>
            {hasActiveFilters && (
              <p className="text-sm text-slate-500 mt-0.5">已应用筛选条件</p>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleResetFilters}
            className="gap-2 rounded-xl border-2 font-semibold"
          >
            <RotateCcw className="h-4 w-4" /> 重置全部
          </Button>
        )}
      </div>

      {/* 筛选预设快捷操作 */}
      <div className="mb-6">
        <FilterPresets />
      </div>

      {/* 筛选器组：三列栅格布局，充分利用页面宽度 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProductFilter />
        <CustomerFilter />
        <ChannelFilter />
      </div>
    </div>
  )
}
