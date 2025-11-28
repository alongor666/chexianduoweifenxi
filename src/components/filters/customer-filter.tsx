'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useFilterStore } from '@/store/domains/filterStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import type { VehicleInsuranceGrade } from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'
import {
  CANONICAL_RENEWAL_STATUSES,
  CANONICAL_CUSTOMER_CATEGORIES,
} from '@/constants/dimensions'

export function CustomerFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const { rawData } = useInsuranceData()

  // 联动：根据其他筛选条件提取唯一的客户分类（仅显示CANONICAL集合中存在且数据中实际出现的值）
  const recordsForCustomerCategory = DataService.filter(rawData, filters, [
    'customerCategories',
  ])
  const presentCustomerCategories = new Set<string>(
    recordsForCustomerCategory
      .map(record => normalizeChineseText(record.customer_category_3))
      .filter((v): v is string => Boolean(v))
  )
  const availableCustomerCategories = CANONICAL_CUSTOMER_CATEGORIES.filter(
    cat => presentCustomerCategories.has(cat)
  )
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(cat => ({ label: cat, value: cat }))

  // 联动：根据其他筛选条件提取唯一的车险评级
  const recordsForVehicleGrades = DataService.filter(rawData, filters, [
    'vehicleGrades',
  ])
  const availableVehicleGrades = recordsForVehicleGrades
    .map(record => record.vehicle_insurance_grade)
    .filter(
      (grade): grade is NonNullable<typeof grade> =>
        grade != null && grade !== 'X' && grade.trim() !== ''
    )
    .reduce((unique, grade) => {
      if (!unique.includes(grade)) {
        unique.push(grade)
      }
      return unique
    }, [] as NonNullable<VehicleInsuranceGrade>[])
    .sort()
    .map(grade => ({ label: grade, value: grade }))

  // 联动：根据其他筛选条件提取唯一的新续转状态
  const recordsForRenewalStatuses = DataService.filter(rawData, filters, [
    'renewalStatuses',
  ])
  const availableRenewalStatuses = (() => {
    const present = new Set<string>(
      recordsForRenewalStatuses
        .map(record => String(record.renewal_status))
        .filter((v): v is string => Boolean(v))
    )
    return CANONICAL_RENEWAL_STATUSES.filter(status => present.has(status))
      .sort((a, b) => a.localeCompare(b, 'zh-CN'))
      .map(status => ({ label: status, value: status }))
  })()

  const handleCustomerCategoryChange = (categories: string[]) => {
    updateFilters({ customerCategories: categories })
  }

  const handleVehicleGradeChange = (grades: string[]) => {
    updateFilters({ vehicleGrades: grades })
  }

  const handleRenewalStatusChange = (statuses: string[]) => {
    updateFilters({ renewalStatuses: statuses })
  }

  const handleReset = () => {
    updateFilters({
      customerCategories: [],
      vehicleGrades: [],
      renewalStatuses: [],
    })
  }

  const hasFilters =
    filters.customerCategories.length > 0 ||
    filters.vehicleGrades.length > 0 ||
    filters.renewalStatuses.length > 0

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <FilterContainer
        title="客户维度"
        onReset={hasFilters ? handleReset : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              客户分类
            </label>
            <MultiSelectFilter
              id="customer-filter-category"
              options={availableCustomerCategories}
              selectedValues={filters.customerCategories}
              onChange={handleCustomerCategoryChange}
              placeholder="选择客户分类"
              searchPlaceholder="搜索客户分类..."
              emptyText="未找到客户分类"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              车险评级
            </label>
            <MultiSelectFilter
              id="customer-filter-vehicle-grade"
              options={availableVehicleGrades}
              selectedValues={filters.vehicleGrades}
              onChange={handleVehicleGradeChange}
              placeholder="选择车险评级"
              searchPlaceholder="搜索车险评级..."
              emptyText="未找到车险评级"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              新续转状态
            </label>
            <MultiSelectFilter
              id="customer-filter-renewal-status"
              options={availableRenewalStatuses}
              selectedValues={filters.renewalStatuses}
              onChange={handleRenewalStatusChange}
              placeholder="选择新续转状态"
              searchPlaceholder="搜索状态..."
              emptyText="未找到状态"
            />
          </div>
        </div>
      </FilterContainer>
    </div>
  )
}
