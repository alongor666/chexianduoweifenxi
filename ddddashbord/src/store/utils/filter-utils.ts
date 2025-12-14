/**
 * 筛选相关工具函数
 */

import { InsuranceRecord, FilterState } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { getBusinessTypeCode } from '@/constants/dimensions'

/**
 * 通用筛选函数：根据当前筛选条件过滤数据，支持排除某些筛选键（用于筛选器联动选项计算）
 */
export function filterRecordsWithExclusions(
  rawData: InsuranceRecord[],
  filters: FilterState,
  excludeKeys: Array<keyof FilterState> = []
) {
  const excluded = new Set<keyof FilterState>(excludeKeys)

  return rawData.filter(record => {
    // 时间筛选
    if (!excluded.has('years')) {
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
      }
    }

    if (!excluded.has('weeks')) {
      if (
        filters.weeks.length > 0 &&
        !filters.weeks.includes(record.week_number)
      ) {
        return false
      }
    }

    // 空间筛选
    if (!excluded.has('organizations')) {
      if (
        filters.organizations.length > 0 &&
        !filters.organizations.includes(
          normalizeChineseText(record.third_level_organization)
        )
      ) {
        return false
      }
    }

    // 产品筛选
    if (!excluded.has('insuranceTypes')) {
      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(record.insurance_type)
      ) {
        return false
      }
    }

    if (!excluded.has('businessTypes')) {
      if (filters.businessTypes.length > 0) {
        const code = getBusinessTypeCode(record.business_type_category)
        if (!filters.businessTypes.includes(code)) {
          return false
        }
      }
    }

    if (!excluded.has('coverageTypes')) {
      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(record.coverage_type)
      ) {
        return false
      }
    }

    // 客户筛选
    if (!excluded.has('customerCategories')) {
      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(
          normalizeChineseText(record.customer_category_3)
        )
      ) {
        return false
      }
    }

    if (!excluded.has('vehicleGrades')) {
      if (filters.vehicleGrades.length > 0) {
        // 如果记录有车险评级，则检查是否在过滤器范围内
        // 如果记录没有车险评级（空值），则不过滤（允许显示）
        if (
          record.vehicle_insurance_grade &&
          !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
        ) {
          return false
        }
      }
    }

    // 渠道筛选
    if (!excluded.has('terminalSources')) {
      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(
          normalizeChineseText(record.terminal_source)
        )
      ) {
        return false
      }
    }

    if (!excluded.has('isNewEnergy')) {
      if (filters.isNewEnergy !== null) {
        if (record.is_new_energy_vehicle !== filters.isNewEnergy) {
          return false
        }
      }
    }

    if (!excluded.has('renewalStatuses')) {
      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(record.renewal_status)
      ) {
        return false
      }
    }

    return true
  })
}

export function getFiltersForViewMode(
  currentFilters: FilterState,
  mode: 'single' | 'trend'
): Partial<FilterState> {
  if (mode === 'single') {
    const selectedWeek =
      currentFilters.singleModeWeek ??
      (currentFilters.weeks.length > 0
        ? currentFilters.weeks[currentFilters.weeks.length - 1]
        : null)
    return {
      viewMode: mode,
      singleModeWeek: selectedWeek,
      weeks: selectedWeek != null ? [selectedWeek] : [],
    }
  }

  const trendWeeks =
    currentFilters.trendModeWeeks.length > 0
      ? [...currentFilters.trendModeWeeks]
      : [...currentFilters.weeks]
  return {
    viewMode: mode,
    trendModeWeeks: trendWeeks,
    weeks: trendWeeks,
  }
}
