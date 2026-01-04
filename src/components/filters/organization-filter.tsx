'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useAppStore } from '@/store/use-app-store'
import { useFilterStore } from '@/store/domains/filterStore'
import { filterRecordsWithExclusions } from '@/store/use-app-store'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

export function OrganizationFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const updateAppFilters = useAppStore(state => state.updateFilters)
  const rawData = useAppStore(state => state.rawData)

  // 同步更新两个store的筛选器
  const handleUpdateFilters = (newFilters: any) => {
    updateFilters(newFilters)
    updateAppFilters(newFilters)
  }

  // 联动：根据其他筛选条件提取唯一的机构（规范化去重）
  const recordsForOrganizations = filterRecordsWithExclusions(
    rawData,
    filters,
    ['organizations']
  )
  const availableOrganizations = Array.from(
    new Set(
      recordsForOrganizations.map(record =>
        normalizeChineseText(record.third_level_organization)
      )
    )
  )
    .filter(org => org) // 过滤掉空值
    .sort()
    .map(org => ({ label: org, value: org }))

  const handleOrganizationChange = (orgs: string[]) => {
    // 直接传递原始数组，FilterStore 会负责规范化
    handleUpdateFilters({ organizations: orgs })
  }

  const handleReset = () => {
    handleUpdateFilters({ organizations: [] })
  }

  const hasFilters = filters.organizations.length > 0

  return (
    <FilterContainer
      title="空间维度"
      onReset={hasFilters ? handleReset : undefined}
    >
      <div>
        <label className="mb-1.5 block text-xs text-slate-600">三级机构</label>
        <MultiSelectFilter
          options={availableOrganizations}
          selectedValues={filters.organizations}
          onChange={handleOrganizationChange}
          placeholder="选择机构"
          searchPlaceholder="搜索机构..."
          emptyText="未找到机构"
        />
      </div>
    </FilterContainer>
  )
}
