'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useAppStore } from '@/store/use-app-store'
import { filterRecordsWithExclusions } from '@/store/use-app-store'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import {
  CANONICAL_INSURANCE_TYPES,
  CANONICAL_COVERAGE_TYPES,
  CANONICAL_BUSINESS_TYPES,
  getBusinessTypeCode,
  CANONICAL_BUSINESS_CODES,
  getBusinessTypeShortLabelByCode,
} from '@/constants/dimensions'

export function ProductFilter() {
  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)
  const rawData = useAppStore(state => state.rawData)

  // 联动：根据其他筛选条件提取唯一的保险类型
  const recordsForInsuranceType = filterRecordsWithExclusions(
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
  const recordsForBusinessType = filterRecordsWithExclusions(rawData, filters, [
    'businessTypes',
  ])
  const presentBusinessCodes = new Set(
    recordsForBusinessType
      .map(record => getBusinessTypeCode(record.business_type_category))
  )
  const availableBusinessTypes = CANONICAL_BUSINESS_CODES.filter(code =>
    presentBusinessCodes.has(code)
  ).map(code => ({ label: getBusinessTypeShortLabelByCode(code), value: code }))

  // 联动：根据其他筛选条件提取唯一的险别组合
  const recordsForCoverageType = filterRecordsWithExclusions(rawData, filters, [
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
