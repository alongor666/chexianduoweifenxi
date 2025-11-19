'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useAppStore } from '@/store/use-app-store'
import { filterRecordsWithExclusions } from '@/store/use-app-store'
import type {
  VehicleInsuranceGrade,
  HighwayRiskGrade,
  TruckScore,
} from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'
import {
  CANONICAL_RENEWAL_STATUSES,
  CANONICAL_CUSTOMER_CATEGORIES,
} from '@/constants/dimensions'
import { getRatingVisibility } from '@/utils/rating-visibility'

export function CustomerFilter() {
  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)
  const rawData = useAppStore(state => state.rawData)

  // 联动：根据其他筛选条件提取唯一的客户分类（仅显示CANONICAL集合中存在且数据中实际出现的值）
  const recordsForCustomerCategory = filterRecordsWithExclusions(
    rawData,
    filters,
    ['customerCategories']
  )
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

  // 获取评级筛选器可见性配置
  const ratingVisibility = getRatingVisibility(filters)

  // 联动：根据其他筛选条件提取唯一的车险评级（客车）
  const recordsForVehicleGrades = filterRecordsWithExclusions(
    rawData,
    filters,
    ['vehicleGrades']
  )
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

  // 联动：根据其他筛选条件提取唯一的高速风险等级（客车）
  const recordsForHighwayRiskGrades = filterRecordsWithExclusions(
    rawData,
    filters,
    ['highwayRiskGrades']
  )
  const availableHighwayRiskGrades = recordsForHighwayRiskGrades
    .map(record => record.highway_risk_grade)
    .filter(
      (grade): grade is NonNullable<typeof grade> =>
        grade != null && grade !== 'X' && grade.trim() !== ''
    )
    .reduce((unique, grade) => {
      if (!unique.includes(grade)) {
        unique.push(grade)
      }
      return unique
    }, [] as NonNullable<HighwayRiskGrade>[])
    .sort()
    .map(grade => ({ label: grade, value: grade }))

  // 联动：根据其他筛选条件提取唯一的小货车评分
  const recordsForSmallTruckScores = filterRecordsWithExclusions(
    rawData,
    filters,
    ['smallTruckScores']
  )
  const availableSmallTruckScores = recordsForSmallTruckScores
    .map(record => record.small_truck_score)
    .filter(
      (score): score is NonNullable<typeof score> =>
        score != null && score !== 'X' && score.trim() !== ''
    )
    .reduce((unique, score) => {
      if (!unique.includes(score)) {
        unique.push(score)
      }
      return unique
    }, [] as NonNullable<TruckScore>[])
    .sort()
    .map(score => ({ label: score, value: score }))

  // 联动：根据其他筛选条件提取唯一的大货车评分
  const recordsForLargeTruckScores = filterRecordsWithExclusions(
    rawData,
    filters,
    ['largeTruckScores']
  )
  const availableLargeTruckScores = recordsForLargeTruckScores
    .map(record => record.large_truck_score)
    .filter(
      (score): score is NonNullable<typeof score> =>
        score != null && score !== 'X' && score.trim() !== ''
    )
    .reduce((unique, score) => {
      if (!unique.includes(score)) {
        unique.push(score)
      }
      return unique
    }, [] as NonNullable<TruckScore>[])
    .sort()
    .map(score => ({ label: score, value: score }))

  // 联动：根据其他筛选条件提取唯一的新续转状态
  const recordsForRenewalStatuses = filterRecordsWithExclusions(
    rawData,
    filters,
    ['renewalStatuses']
  )
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

  const handleHighwayRiskGradeChange = (grades: string[]) => {
    updateFilters({ highwayRiskGrades: grades })
  }

  const handleSmallTruckScoreChange = (scores: string[]) => {
    updateFilters({ smallTruckScores: scores })
  }

  const handleLargeTruckScoreChange = (scores: string[]) => {
    updateFilters({ largeTruckScores: scores })
  }

  const handleRenewalStatusChange = (statuses: string[]) => {
    updateFilters({ renewalStatuses: statuses })
  }

  const handleReset = () => {
    updateFilters({
      customerCategories: [],
      vehicleGrades: [],
      highwayRiskGrades: [],
      smallTruckScores: [],
      largeTruckScores: [],
      renewalStatuses: [],
    })
  }

  const hasFilters =
    filters.customerCategories.length > 0 ||
    filters.vehicleGrades.length > 0 ||
    filters.highwayRiskGrades.length > 0 ||
    filters.smallTruckScores.length > 0 ||
    filters.largeTruckScores.length > 0 ||
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

          {/* 车险评级 - 仅客车可选 */}
          {ratingVisibility.showVehicleGrade && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                车险分等级
                <span className="ml-2 text-xs text-slate-500">（客车）</span>
              </label>
              <MultiSelectFilter
                id="customer-filter-vehicle-grade"
                options={availableVehicleGrades}
                selectedValues={filters.vehicleGrades}
                onChange={handleVehicleGradeChange}
                placeholder="选择车险分等级"
                searchPlaceholder="搜索车险分等级..."
                emptyText="未找到车险分等级"
              />
            </div>
          )}

          {/* 高速风险等级 - 仅客车可选 */}
          {ratingVisibility.showHighwayRisk && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                高速风险等级
                <span className="ml-2 text-xs text-slate-500">（客车）</span>
              </label>
              <MultiSelectFilter
                id="customer-filter-highway-risk"
                options={availableHighwayRiskGrades}
                selectedValues={filters.highwayRiskGrades}
                onChange={handleHighwayRiskGradeChange}
                placeholder="选择高速风险等级"
                searchPlaceholder="搜索高速风险等级..."
                emptyText="未找到高速风险等级"
              />
            </div>
          )}

          {/* 小货车评分 - 仅9吨以下货车可选 */}
          {ratingVisibility.showSmallTruck && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                小货车评分
                <span className="ml-2 text-xs text-slate-500">
                  （9吨以下货车）
                </span>
              </label>
              <MultiSelectFilter
                id="customer-filter-small-truck"
                options={availableSmallTruckScores}
                selectedValues={filters.smallTruckScores}
                onChange={handleSmallTruckScoreChange}
                placeholder="选择小货车评分"
                searchPlaceholder="搜索小货车评分..."
                emptyText="未找到小货车评分"
              />
            </div>
          )}

          {/* 大货车评分 - 仅9吨以上货车可选 */}
          {ratingVisibility.showLargeTruck && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                大货车评分
                <span className="ml-2 text-xs text-slate-500">
                  （9吨以上货车）
                </span>
              </label>
              <MultiSelectFilter
                id="customer-filter-large-truck"
                options={availableLargeTruckScores}
                selectedValues={filters.largeTruckScores}
                onChange={handleLargeTruckScoreChange}
                placeholder="选择大货车评分"
                searchPlaceholder="搜索大货车评分..."
                emptyText="未找到大货车评分"
              />
            </div>
          )}

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
