'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useFilterStore } from '@/store/domains/filterStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import { normalizeChineseText } from '@/lib/utils'
import {
  CANONICAL_INSURANCE_TYPES,
  CANONICAL_COVERAGE_TYPES,
  CANONICAL_BUSINESS_TYPES,
} from '@/constants/dimensions'

export function ProductFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const { rawData } = useInsuranceData()

  // 联动：根据其他筛选条件提取唯一的保险类型
  const recordsForInsuranceType = DataService.filter(
    rawData,
    filters,
    ['insuranceTypes']
  )
  const presentInsuranceTypes = new Set<string>(
    recordsForInsuranceType
      .map(record => String(record.insurance_type))
      .filter((v): v is string => Boolean(v))
  )
  const availableInsuranceTypes = CANONICAL_INSURANCE_TYPES.filter(type =>
    presentInsuranceTypes.has(type)
  )
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(type => ({ label: type, value: type }))

  // 联动：根据其他筛选条件提取唯一的业务类型（仅显示CANONICAL集合中存在且数据中实际出现的值）
  const recordsForBusinessType = DataService.filter(rawData, filters, [
    'businessTypes',
  ])
  const presentBusinessTypes = new Set<string>(
    recordsForBusinessType
      .map(record => normalizeChineseText(record.business_type_category))
      .filter((v): v is string => Boolean(v))
  )
  const availableBusinessTypes = CANONICAL_BUSINESS_TYPES.filter(type =>
    presentBusinessTypes.has(type)
  )
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(type => ({ label: type, value: type }))

  // 联动：根据其他筛选条件提取唯一的险别组合
  const recordsForCoverageType = DataService.filter(rawData, filters, [
    'coverageTypes',
  ])
  const presentCoverageTypes = new Set<string>(
    recordsForCoverageType
      .map(record => String(record.coverage_type))
      .filter((v): v is string => Boolean(v))
  )
  const availableCoverageTypes = CANONICAL_COVERAGE_TYPES.filter(type =>
    presentCoverageTypes.has(type)
  )
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(type => ({ label: type, value: type }))

  const handleInsuranceTypeChange = (types: string[]) => {
    updateFilters({ insuranceTypes: types })
  }

  const handleBusinessTypeChange = (types: string[]) => {
    updateFilters({ businessTypes: types })
  }

  const handleCoverageTypeChange = (types: string[]) => {
    updateFilters({ coverageTypes: types })
  }

  const handleReset = () => {
    updateFilters({ insuranceTypes: [], businessTypes: [], coverageTypes: [] })
  }

  const hasFilters =
    filters.insuranceTypes.length > 0 ||
    filters.businessTypes.length > 0 ||
    filters.coverageTypes.length > 0

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <FilterContainer
        title="产品维度"
        onReset={hasFilters ? handleReset : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              保险类型
            </label>
            <MultiSelectFilter
              id="product-filter-insurance-type"
              options={availableInsuranceTypes}
              selectedValues={filters.insuranceTypes}
              onChange={handleInsuranceTypeChange}
              placeholder="选择险种"
              searchPlaceholder="搜索险种..."
              emptyText="未找到险种"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              业务类型
            </label>
            <MultiSelectFilter
              id="product-filter-business-type"
              options={availableBusinessTypes}
              selectedValues={filters.businessTypes}
              onChange={handleBusinessTypeChange}
              placeholder="选择业务类型"
              searchPlaceholder="搜索业务类型..."
              emptyText="未找到业务类型"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              险别组合
            </label>
            <MultiSelectFilter
              id="product-filter-coverage-type"
              options={availableCoverageTypes}
              selectedValues={filters.coverageTypes}
              onChange={handleCoverageTypeChange}
              placeholder="选择险别组合"
              searchPlaceholder="搜索险别组合..."
              emptyText="未找到险别组合"
            />
          </div>
        </div>
      </FilterContainer>
    </div>
  )
}
