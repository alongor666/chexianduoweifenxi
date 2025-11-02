'use client'

import { DataViewSelector } from '@/components/filters/data-view-selector'
import { CompactTimeFilter } from '@/components/filters/compact-time-filter'
import { CompactOrganizationFilter } from '@/components/filters/compact-organization-filter'
import { TimeProgressIndicator } from '@/components/features/time-progress-indicator'
import { MoreFiltersDialog } from '@/components/features/more-filters-dialog'
import type { AnalysisTabValue } from '@/components/layout/analysis-tabs'

type WeekSelectionMode = 'single-only' | 'flexible'

interface TopToolbarProps {
  rawCount: number
  activeTab: AnalysisTabValue
}

function resolveWeekSelectionMode(tab: AnalysisTabValue): WeekSelectionMode {
  if (tab === 'trend' || tab === 'multichart') {
    return 'flexible'
  }
  return 'single-only'
}

export function TopToolbar({ rawCount, activeTab }: TopToolbarProps) {
  const weekSelectionMode = resolveWeekSelectionMode(activeTab)

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        {/* 主控制区域 - 响应式布局 */}
        {/* 桌面端：单行四列布局 */}
        {/* 移动端：两行布局 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* 第一组：周数选择器 + 数据视图选择器（桌面端左侧，移动端第一行） */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <CompactTimeFilter mode={weekSelectionMode} />
            <DataViewSelector />
          </div>

          {/* 第二组：机构选择器 + 时间进度 + 更多筛选（桌面端右侧，移动端第二行） */}
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
            <CompactOrganizationFilter />
            <TimeProgressIndicator compact />
            <MoreFiltersDialog />
          </div>
        </div>
      </div>
    </div>
  )
}
