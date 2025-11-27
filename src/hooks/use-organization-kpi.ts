/**
 * 机构 KPI Hook
 * 用于获取特定机构的 KPI 数据
 */

import { useMemo } from 'react'
import { useDataStore, useFilterStore, useTargetStore } from '@/store/domains'
import { DataService } from '@/services/DataService'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import type { KPIResult, InsuranceRecord, FilterState } from '@/types/insurance'
import { safeMax } from '@/lib/utils/array-utils'

/**
 * 获取指定机构的KPI数据
 * @param organizationName 机构名称
 * @returns KPI计算结果
 */
export function useOrganizationKPI(
  organizationName: string
): KPIResult | null {
  const rawData = useDataStore((state) => state.rawData)
  const filters = useFilterStore((state) => state.filters)
  const premiumTargets = useTargetStore((state) => state.premiumTargets)

  const kpiResult = useMemo(() => {
    // 使用 DataService.filter() 统一过滤逻辑，仅筛选该机构
    const orgFilters: FilterState = {
      ...filters,
      organizations: [organizationName],
    }
    const orgData = DataService.filter(rawData, orgFilters)

    // 如果没有数据，返回null
    if (orgData.length === 0) {
      return null
    }

    // 获取该机构的目标值
    const orgTarget = premiumTargets?.dimensions.thirdLevelOrganization.entries[
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
    return kpiEngine.calculate(orgData, {
      annualTargetYuan: orgTarget ?? undefined,
      mode: 'current',
      currentWeekNumber: currentWeek ?? undefined,
      year: currentYear,
    })
  }, [rawData, organizationName, filters, premiumTargets])

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
  const rawData = useDataStore((state) => state.rawData)
  const filters = useFilterStore((state) => state.filters)
  const premiumTargets = useTargetStore((state) => state.premiumTargets)

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
    organizationNames.forEach((orgName) => {
      // 使用 DataService.filter() 统一过滤逻辑，仅筛选该机构
      const orgFilters: FilterState = {
        ...filters,
        organizations: [orgName],
      }
      const orgData = DataService.filter(rawData, orgFilters)

      // 如果没有数据，设置为null
      if (orgData.length === 0) {
        resultMap.set(orgName, null)
        return
      }

      // 获取该机构的目标值
      const orgTarget = premiumTargets?.dimensions.thirdLevelOrganization
        .entries[orgName]

      // 计算KPI
      const kpi = kpiEngine.calculate(orgData, {
        annualTargetYuan: orgTarget ?? undefined,
        mode: 'current',
        currentWeekNumber: currentWeek ?? undefined,
        year: currentYear,
      })

      resultMap.set(orgName, kpi)
    })

    return resultMap
  }, [rawData, organizationNames, filters, premiumTargets])

  return kpiMap
}
