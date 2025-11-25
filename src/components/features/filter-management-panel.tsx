/**
 * 筛选器管理面板 - 优化后的筛选器布局,在一行展示
 */

'use client'

import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { DataViewSelector } from '@/components/filters/data-view-selector'
import { CompactTimeFilter } from '@/components/filters/compact-time-filter'
import { CompactOrganizationFilter } from '@/components/filters/compact-organization-filter'
import { FilterPanel } from '@/components/filters/filter-panel'
import { useFilterStore } from '@/store/domains/filterStore'
import { Button } from '@/components/ui/button'

export function FilterManagementPanel() {
  const resetFilters = useFilterStore(state => state.resetFilters)

  // 重置筛选器
  const handleResetFilters = () => {
    resetFilters()
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-800">筛选器</h2>
            <p className="text-sm text-slate-600 mt-1">
              配置数据筛选条件和显示选项
            </p>
          </div>
        </div>

        <Button
          onClick={handleResetFilters}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重置所有筛选
        </Button>
      </div>

      {/* 快速筛选器 - 单行展示 */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">快速筛选</h3>
        <div className="flex items-center gap-6 flex-wrap">
          {/* 数据视图类型 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">数据类型:</span>
            <DataViewSelector />
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-slate-200" />

          {/* 周序号筛选 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">周序号:</span>
            <CompactTimeFilter mode="flexible" />
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-slate-200" />

          {/* 机构筛选 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">机构:</span>
            <CompactOrganizationFilter />
          </div>
        </div>
      </div>

      {/* 详细筛选面板 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">业务维度筛选</h3>
        <FilterPanel />
      </div>
    </div>
  )
}
