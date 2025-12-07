import { DrillDownDimensionKey, DrillDownStep } from '@/types/drill-down'
import { InsuranceRecord, FilterState } from '@/types/insurance'
import { getBusinessTypeCode } from '@/constants/dimensions'

/**
 * 从记录中获取指定维度的值
 */
export function getRecordValue(
  record: InsuranceRecord,
  dimensionKey: DrillDownDimensionKey
): string | boolean {
  switch (dimensionKey) {
    case 'third_level_organization':
      return record.third_level_organization
    case 'business_type_category':
      return record.business_type_category
    case 'coverage_type':
      return record.coverage_type
    case 'terminal_source':
      return record.terminal_source
    case 'is_new_energy_vehicle':
      return record.is_new_energy_vehicle
    case 'renewal_status':
      return record.renewal_status
    case 'is_transferred_vehicle':
      return record.is_transferred_vehicle
    case 'insurance_type':
      return record.insurance_type
    default:
      return ''
  }
}

interface FilterDrillDownDataParams {
  rawData: InsuranceRecord[]
  initialData?: InsuranceRecord[]
  filters: FilterState
  drillDownSteps: DrillDownStep[]
}

/**
 * 过滤下钻数据
 * 核心逻辑：
 * 1. 如果提供 initialData，直接基于它进行下钻筛选（忽略全局筛选器）
 * 2. 如果未提供 initialData，使用 rawData 并应用全局筛选器
 * 3. 始终应用下钻路径筛选
 */
export function filterDrillDownData({
  rawData,
  initialData,
  filters,
  drillDownSteps,
}: FilterDrillDownDataParams): InsuranceRecord[] {
  // 1. 确定基准数据
  const sourceData = initialData || rawData

  return sourceData.filter((record: InsuranceRecord) => {
    // 2. 应用全局筛选器（仅当未提供 initialData 时）
    if (!initialData) {
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
      }

      if (filters.viewMode === 'single' && filters.singleModeWeek !== null) {
        if (record.week_number !== filters.singleModeWeek) {
          return false
        }
      }

      if (
        filters.organizations.length > 0 &&
        !filters.organizations.includes(record.third_level_organization)
      ) {
        return false
      }

      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(record.insurance_type)
      ) {
        return false
      }

      if (filters.businessTypes.length > 0) {
        const btCode = getBusinessTypeCode(record.business_type_category)
        if (!filters.businessTypes.includes(btCode)) {
          return false
        }
      }

      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(record.coverage_type)
      ) {
        return false
      }

      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(record.customer_category_3)
      ) {
        return false
      }

      if (
        filters.vehicleGrades.length > 0 &&
        record.vehicle_insurance_grade &&
        !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
      ) {
        return false
      }

      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(record.terminal_source)
      ) {
        return false
      }

      if (
        filters.isNewEnergy !== null &&
        record.is_new_energy_vehicle !== filters.isNewEnergy
      ) {
        return false
      }

      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(record.renewal_status)
      ) {
        return false
      }
    }

    // 3. 应用下钻筛选
    for (const step of drillDownSteps) {
      const recordValue = getRecordValue(record, step.dimensionKey)
      if (recordValue !== step.value) {
        return false
      }
    }

    return true
  })
}
