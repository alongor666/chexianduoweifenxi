'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useFilterStore } from '@/store/domains/filterStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import { normalizeChineseText } from '@/lib/utils'

export function OrganizationFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const { rawData } = useInsuranceData()

  // 更新筛选器
  const handleUpdateFilters = (newFilters: any) => {
    updateFilters(newFilters)
  }

  // 联动：根据其他筛选条件提取唯一的机构（规范化去重）
  const recordsForOrganizations = DataService.filter(rawData, filters, [
    'organizations',
  ])
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
    handleUpdateFilters({ organizations: orgs.map(normalizeChineseText) })
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
