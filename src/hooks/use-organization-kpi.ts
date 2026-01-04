/**
 * 机构 KPI Hook
 * 用于获取特定机构的 KPI 数据
 */

import { useMemo } from 'react'
import { getBusinessTypeCode } from '@/constants/dimensions'
import { useAppStore } from '@/store/use-app-store'
import {
  calculateKPIs,
  InsuranceRecord as DomainInsuranceRecord,
} from '@/domain'
import type { KPIResult, InsuranceRecord } from '@/types/insurance'
import { safeMax } from '@/lib/utils/array-utils'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

/**
 * 获取指定机构的KPI数据
 * @param organizationName 机构名称
 * @returns KPI计算结果
 */
export function useOrganizationKPI(organizationName: string): KPIResult | null {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)
  const premiumTargets = useAppStore(state => state.premiumTargets)

  const kpiResult = useMemo(() => {
    // 筛选该机构的数据，同时应用其他筛选条件（除了机构筛选）
    const orgData = rawData.filter((record: InsuranceRecord) => {
      //机构筛选 - 仅该机构（使用规范化确保匹配）
      if (normalizeChineseText(record.third_level_organization) !== normalizeChineseText(organizationName)) {
        return false
      }

      // 应用年份筛选
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
      }

      // 应用周次筛选（单周模式）
      if (
        filters.viewMode === 'single' &&
        filters.singleModeWeek !== null &&
        record.week_number !== filters.singleModeWeek
      ) {
        return false
      }

      // 趋势模式不需要额外的周次筛选，直接使用所有数据

      // 应用保险类型筛选
      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(normalizeChineseText(record.insurance_type))
      ) {
        return false
      }

      // 应用业务类型筛选（代码端统一使用英文代码）
      if (filters.businessTypes.length > 0) {
        const btCode = getBusinessTypeCode(record.business_type_category)
        if (!filters.businessTypes.includes(btCode)) {
          return false
        }
      }

      // 应用承保类型筛选
      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(normalizeChineseText(record.coverage_type))
      ) {
        return false
      }

      // 应用客户分类筛选
      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(normalizeChineseText(record.customer_category_3))
      ) {
        return false
      }

      // 应用车级筛选
      if (
        filters.vehicleGrades.length > 0 &&
        record.vehicle_insurance_grade &&
        !filters.vehicleGrades.includes(normalizeChineseText(record.vehicle_insurance_grade))
      ) {
        return false
      }

      // 应用终端来源筛选
      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(normalizeChineseText(record.terminal_source))
      ) {
        return false
      }

      // 应用新能源筛选
      if (
        filters.isNewEnergy !== null &&
        record.is_new_energy_vehicle !== filters.isNewEnergy
      ) {
        return false
      }

      // 应用续保状态筛选
      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(normalizeChineseText(record.renewal_status))
      ) {
        return false
      }

      return true
    })

    // 如果没有数据，返回null
    if (orgData.length === 0) {
      return null
    }

    // 获取该机构的目标值
    const orgTarget =
      premiumTargets?.dimensions.thirdLevelOrganization.entries[
        organizationName
      ]

    // 计算当前年份
    const currentYear =
      filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear()

    // 获取当前周次
    const currentWeek =
      filters.viewMode === 'single' ? filters.singleModeWeek : null

    // 计算KPI
    const domainRecords = orgData.map(r => DomainInsuranceRecord.fromRawData(r))
    return calculateKPIs(domainRecords, {
      annualTargetYuan: orgTarget ?? undefined,
      mode: 'current',
      currentWeekNumber: currentWeek ?? undefined,
      year: currentYear,
    })
  }, [
    rawData,
    organizationName,
    filters.years,
    filters.viewMode,
    filters.singleModeWeek,
    filters.insuranceTypes,
    filters.businessTypes,
    filters.coverageTypes,
    filters.customerCategories,
    filters.vehicleGrades,
    filters.terminalSources,
    filters.isNewEnergy,
    filters.renewalStatuses,
    premiumTargets,
  ])

  return kpiResult
}

/**
 * 批量获取多个机构的KPI数据
 * @param organizationNames 机构名称列表
 * @returns 机构名称到KPI的映射
 */
export function useMultipleOrganizationKPIs(
  organizationNames: string[]
): Map<string, KPIResult | null> {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)
  const premiumTargets = useAppStore(state => state.premiumTargets)

  const kpiMap = useMemo(() => {
    const resultMap = new Map<string, KPIResult | null>()

    // 计算当前年份
    const currentYear =
      filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear()

    // 获取当前周次
    const currentWeek =
      filters.viewMode === 'single' ? filters.singleModeWeek : null

    // 为每个机构计算KPI
    organizationNames.forEach(orgName => {
      // 筛选该机构的数据
      const orgData = rawData.filter((record: InsuranceRecord) => {
        // 机构筛选（使用规范化确保匹配）
        if (normalizeChineseText(record.third_level_organization) !== normalizeChineseText(orgName)) {
          return false
        }

        // 应用其他筛选条件（同上）
        if (
          filters.years.length > 0 &&
          !filters.years.includes(record.policy_start_year)
        ) {
          return false
        }

        if (
          filters.viewMode === 'single' &&
          filters.singleModeWeek !== null &&
          record.week_number !== filters.singleModeWeek
        ) {
          return false
        }

        // 趋势模式不需要额外的周次筛选，直接使用所有数据

        if (
          filters.insuranceTypes.length > 0 &&
          !filters.insuranceTypes.includes(normalizeChineseText(record.insurance_type))
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
          !filters.coverageTypes.includes(normalizeChineseText(record.coverage_type))
        ) {
          return false
        }

        if (
          filters.customerCategories.length > 0 &&
          !filters.customerCategories.includes(normalizeChineseText(record.customer_category_3))
        ) {
          return false
        }

        if (
          filters.vehicleGrades.length > 0 &&
          record.vehicle_insurance_grade &&
          !filters.vehicleGrades.includes(normalizeChineseText(record.vehicle_insurance_grade))
        ) {
          return false
        }

        if (
          filters.terminalSources.length > 0 &&
          !filters.terminalSources.includes(normalizeChineseText(record.terminal_source))
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
          !filters.renewalStatuses.includes(normalizeChineseText(record.renewal_status))
        ) {
          return false
        }

        return true
      })

      // 如果没有数据，设置为null
      if (orgData.length === 0) {
        resultMap.set(orgName, null)
        return
      }

      // 获取该机构的目标值
      const orgTarget =
        premiumTargets?.dimensions.thirdLevelOrganization.entries[orgName]

      // 计算KPI
      const domainRecords = orgData.map(r =>
        DomainInsuranceRecord.fromRawData(r)
      )
      const orgKPI = calculateKPIs(domainRecords, {
        annualTargetYuan: orgTarget ?? undefined,
        mode: 'current',
        currentWeekNumber: currentWeek ?? undefined,
        year: currentYear,
      })

      resultMap.set(orgName, orgKPI)
    })

    return resultMap
  }, [
    rawData,
    organizationNames,
    filters.years,
    filters.viewMode,
    filters.singleModeWeek,
    filters.insuranceTypes,
    filters.businessTypes,
    filters.coverageTypes,
    filters.customerCategories,
    filters.vehicleGrades,
    filters.terminalSources,
    filters.isNewEnergy,
    filters.renewalStatuses,
    premiumTargets,
  ])

  return kpiMap
}

/**
 * 使用新的年度计划数据获取机构KPI
 * @param organizationName 机构名称
 * @param level 机构级别：'second' | 'third'
 * @returns KPI计算结果
 */
export function useOrganizationKPIWithYearPlans(
  organizationName: string,
  level: 'second' | 'third' = 'third'
): KPIResult | null {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)
  
  // 注意：简化实现，暂时使用现有的premiumTargets
  // 实际使用时需要集成YearPlanRepository
  return useOrganizationKPI(organizationName)
}

/**
 * 批量获取多个机构的KPI数据（使用年度计划）
 * @param organizationNames 机构名称列表
 * @param level 机构级别
 * @returns 机构名称到KPI的映射
 */
export function useMultipleOrganizationKPIsWithYearPlans(
  organizationNames: string[],
  level: 'second' | 'third' = 'third'
): Map<string, KPIResult | null> {
  // 注意：简化实现，暂时使用现有的实现
  // 实际使用时需要集成YearPlanRepository
  return useMultipleOrganizationKPIs(organizationNames)
}
