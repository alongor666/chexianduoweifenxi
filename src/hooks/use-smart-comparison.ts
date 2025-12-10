/**
 * 智能环比 Hook
 * 自动找到上一个有数据的周期进行对比
 * 如果上一周期数据缺失，则继续往前跳跃查找
 */

import { useMemo } from 'react'
import { getBusinessTypeCode } from '@/constants/dimensions'
import { useAppStore } from '@/store/use-app-store'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import type { InsuranceRecord, FilterState } from '@/types/insurance'

/**
 * 应用筛选条件（除了周次）
 */
function applyFiltersExceptWeek(
  data: InsuranceRecord[],
  filters: FilterState
): InsuranceRecord[] {
  return data.filter(record => {
    // 年度筛选
    if (
      filters.years.length > 0 &&
      !filters.years.includes(record.policy_start_year)
    ) {
      return false
    }

    // 机构筛选
    if (
      filters.organizations.length > 0 &&
      !filters.organizations.includes(record.third_level_organization)
    ) {
      return false
    }

    // 险种筛选
    if (
      filters.insuranceTypes.length > 0 &&
      !filters.insuranceTypes.includes(record.insurance_type)
    ) {
      return false
    }

    // 业务类型筛选
    if (
      filters.businessTypes.length > 0 &&
      !filters.businessTypes.includes(record.business_type_category)
    ) {
      return false
    }

    // 险别筛选
    if (
      filters.coverageTypes.length > 0 &&
      !filters.coverageTypes.includes(record.coverage_type)
    ) {
      return false
    }

    // 客户分类筛选
    if (
      filters.customerCategories.length > 0 &&
      !filters.customerCategories.includes(record.customer_category_3)
    ) {
      return false
    }

    // 车险评级筛选
    if (
      filters.vehicleGrades.length > 0 &&
      record.vehicle_insurance_grade &&
      !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
    ) {
      return false
    }

    // 终端来源筛选
    if (
      filters.terminalSources.length > 0 &&
      !filters.terminalSources.includes(record.terminal_source)
    ) {
      return false
    }

    // 新能源车筛选
    if (
      filters.isNewEnergy !== null &&
      record.is_new_energy_vehicle !== filters.isNewEnergy
    ) {
      return false
    }

    // 续保状态筛选
    if (
      filters.renewalStatuses.length > 0 &&
      !filters.renewalStatuses.includes(record.renewal_status)
    ) {
      return false
    }

    return true
  })
}

/**
 * 查找上一个有数据的周期（增强版：支持缺失周次跳跃）
 * @param rawData 原始数据
 * @param currentWeek 当前周次
 * @param filters 筛选条件
 * @param maxJumpBack 最多往前跳跃几周（默认5周）
 * @returns 上一周期的数据和周次，如果找不到则返回null
 */
function findPreviousWeekWithData(
  rawData: InsuranceRecord[],
  currentWeek: number,
  filters: FilterState,
  maxJumpBack = 5
): InsuranceRecord[] | null {
  // 应用除周次之外的筛选条件
  const baseFilteredData = applyFiltersExceptWeek(rawData, filters)

  // 获取所有可用的周次（去重并排序）
  const availableWeeks = Array.from(
    new Set(baseFilteredData.map(r => r.week_number))
  ).sort((a, b) => a - b)

  if (availableWeeks.length === 0) {
    return null
  }

  // 找到小于 currentWeek 的最大周次（即最近的前一周）
  const previousWeeks = availableWeeks.filter(week => week < currentWeek)

  if (previousWeeks.length === 0) {
    return null
  }

  // 取最近的前一周（最大的那个）
  const previousWeek = previousWeeks[previousWeeks.length - 1]

  // 检查是否在允许的跳跃范围内
  const jumpDistance = currentWeek - previousWeek
  if (jumpDistance > maxJumpBack) {
    console.warn(
      `[useSmartComparison] 前一周 ${previousWeek} 距离当前周 ${currentWeek} 超过最大跳跃范围 ${maxJumpBack}，跳过环比`
    )
    return null
  }

  const weekData = baseFilteredData.filter(
    record => record.week_number === previousWeek
  )

  if (weekData.length > 0) {
    console.log(
      `[useSmartComparison] 找到前一周数据：第 ${previousWeek} 周（${weekData.length} 条记录），当前周：第 ${currentWeek} 周`
    )
    return weekData
  }

  return null
}

/**
 * 使用智能环比数据的Hook
 * @returns { currentKpi, compareKpi, previousWeekFound }
 */
export function useSmartComparison(
  options: {
    /**
     * 年度目标（可选）
     */
    annualTargetYuan?: number | null
    /**
     * 最大往前跳跃周数
     */
    maxJumpBack?: number
  } = {}
) {
  const { annualTargetYuan = null, maxJumpBack = 5 } = options

  // 使用细粒度选择器避免对象引用导致的无限重渲染问题
  const rawData = useAppStore(state => state.rawData)
  const viewMode = useAppStore(state => state.filters.viewMode)
  const dataViewType = useAppStore(state => state.filters.dataViewType)
  const singleModeWeek = useAppStore(state => state.filters.singleModeWeek)
  const trendModeWeeks = useAppStore(state => state.filters.trendModeWeeks)
  const years = useAppStore(state => state.filters.years)
  const weeks = useAppStore(state => state.filters.weeks)
  const organizations = useAppStore(state => state.filters.organizations)
  const insuranceTypes = useAppStore(state => state.filters.insuranceTypes)
  const businessTypes = useAppStore(state => state.filters.businessTypes)
  const coverageTypes = useAppStore(state => state.filters.coverageTypes)
  const customerCategories = useAppStore(
    state => state.filters.customerCategories
  )
  const vehicleGrades = useAppStore(state => state.filters.vehicleGrades)
  const terminalSources = useAppStore(state => state.filters.terminalSources)
  const isNewEnergy = useAppStore(state => state.filters.isNewEnergy)
  const renewalStatuses = useAppStore(state => state.filters.renewalStatuses)

  // 重建 filters 对象供内部函数使用
  const filters = useMemo(
    () => ({
      viewMode,
      dataViewType,
      singleModeWeek,
      trendModeWeeks,
      years,
      weeks,
      organizations,
      insuranceTypes,
      businessTypes,
      coverageTypes,
      customerCategories,
      vehicleGrades,
      terminalSources,
      isNewEnergy,
      renewalStatuses,
    }),
    [
      viewMode,
      dataViewType,
      singleModeWeek,
      trendModeWeeks,
      years,
      weeks,
      organizations,
      insuranceTypes,
      businessTypes,
      coverageTypes,
      customerCategories,
      vehicleGrades,
      terminalSources,
      isNewEnergy,
      renewalStatuses,
    ]
  )
  const filteredData = useMemo(() => {
    return rawData.filter(record => {
      if (years.length > 0 && !years.includes(record.policy_start_year)) {
        return false
      }
      if (weeks.length > 0 && !weeks.includes(record.week_number)) {
        return false
      }
      if (
        organizations.length > 0 &&
        !organizations.includes(record.third_level_organization)
      ) {
        return false
      }
      if (
        insuranceTypes.length > 0 &&
        !insuranceTypes.includes(record.insurance_type)
      ) {
        return false
      }
      if (businessTypes.length > 0) {
        // 代码端统一使用英文代码进行比对
        const btCode = getBusinessTypeCode(record.business_type_category)
        if (!businessTypes.includes(btCode)) {
          return false
        }
      }
      if (
        coverageTypes.length > 0 &&
        !coverageTypes.includes(record.coverage_type)
      ) {
        return false
      }
      if (
        customerCategories.length > 0 &&
        !customerCategories.includes(record.customer_category_3)
      ) {
        return false
      }
      if (
        vehicleGrades.length > 0 &&
        record.vehicle_insurance_grade &&
        !vehicleGrades.includes(record.vehicle_insurance_grade)
      ) {
        return false
      }
      if (
        terminalSources.length > 0 &&
        !terminalSources.includes(record.terminal_source)
      ) {
        return false
      }
      if (
        isNewEnergy !== null &&
        record.is_new_energy_vehicle !== isNewEnergy
      ) {
        return false
      }
      if (
        renewalStatuses.length > 0 &&
        !renewalStatuses.includes(record.renewal_status)
      ) {
        return false
      }
      return true
    })
  }, [
    rawData,
    years,
    weeks,
    organizations,
    insuranceTypes,
    businessTypes,
    coverageTypes,
    customerCategories,
    vehicleGrades,
    terminalSources,
    isNewEnergy,
    renewalStatuses,
  ])

  const comparison = useMemo(() => {
    // 性能监控：记录计算开始时间
    const startTime = performance.now()

    if (filteredData.length === 0) {
      return {
        currentKpi: null,
        compareKpi: null,
        previousWeekNumber: null,
      }
    }

    // 获取当前选择的周次（优化：避免对大数组使用展开运算符）
    const currentWeek =
      viewMode === 'single' && singleModeWeek
        ? singleModeWeek
        : filteredData.length > 0
          ? filteredData.reduce((max, r) => Math.max(max, r.week_number), 0)
          : 1 // 默认为第1周

    console.log(
      `[useSmartComparison] 开始计算环比数据，当前周: ${currentWeek}，数据量: ${filteredData.length} 条`
    )

    // 获取当前年份
    const currentYear =
      years.length > 0 ? Math.max(...years) : new Date().getFullYear()

    // 计算当前KPI（传递完整的计算参数）
    const currentKpi = kpiEngine.calculate(filteredData, {
      annualTargetYuan,
      mode: dataViewType || 'current',
      currentWeekNumber: currentWeek,
      year: currentYear,
    })

    // 查找上一个有数据的周期
    const previousWeekData = findPreviousWeekWithData(
      rawData,
      currentWeek,
      filters,
      maxJumpBack
    )

    if (!previousWeekData || previousWeekData.length === 0) {
      const elapsed = performance.now() - startTime
      console.log(
        `[useSmartComparison] 计算完成（无环比数据），耗时: ${elapsed.toFixed(2)}ms`
      )
      return {
        currentKpi,
        compareKpi: null,
        previousWeekNumber: null,
      }
    }

    // 获取上一周期的周次（优化：避免对大数组使用展开运算符）
    const previousWeekNumber =
      previousWeekData.length > 0
        ? previousWeekData.reduce((max, r) => Math.max(max, r.week_number), 0)
        : 1 // 默认为第1周

    // 计算上一周期的KPI（同样传递完整的计算参数）
    const compareKpi = kpiEngine.calculate(previousWeekData, {
      annualTargetYuan,
      mode: dataViewType || 'current',
      currentWeekNumber: previousWeekNumber,
      year: currentYear,
    })

    const elapsed = performance.now() - startTime
    console.log(
      `[useSmartComparison] 计算完成，当前周: ${currentWeek}，对比周: ${previousWeekNumber}，耗时: ${elapsed.toFixed(2)}ms`
    )

    return {
      currentKpi,
      compareKpi,
      previousWeekNumber,
    }
  }, [
    filteredData,
    rawData,
    filters,
    annualTargetYuan,
    maxJumpBack,
    viewMode,
    singleModeWeek,
    dataViewType,
    years,
  ])

  return comparison
}
