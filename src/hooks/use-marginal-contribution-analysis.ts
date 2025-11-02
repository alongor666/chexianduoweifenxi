/**
 * 边际贡献分析 Hook
 * 按业务类型维度计算满期边贡率、变动成本率、满期边贡额、单均边贡额
 * 支持当周值和周增量模式
 */

'use client'

import { useMemo } from 'react'
import { useAppStore, useFilteredData } from '@/store/use-app-store'
import type { InsuranceRecord } from '@/types/insurance'
import { kpiEngine } from '@/lib/calculations/kpi-engine'

/**
 * 边贡分析数据项
 */
export interface MarginalContributionItem {
  key: string // 业务类型唯一键
  label: string // 业务类型名称

  // 满期边贡率（%）
  contributionMarginRatio: number | null
  // 变动成本率（%）
  variableCostRatio: number | null
  // 满期边贡额（万元）
  contributionMarginAmount: number
  // 单均边贡额（元）
  averageContribution: number | null

  // 上期数据（用于环比）
  previous?: {
    contributionMarginRatio: number | null
    variableCostRatio: number | null
    contributionMarginAmount: number
    averageContribution: number | null
  }
}

/**
 * 获取前一周的数据（应用相同的筛选条件，但周次为前一周）
 */
function usePreviousWeekData(): InsuranceRecord[] {
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)

  return useMemo(() => {
    const currentWeek =
      filters.viewMode === 'single' ? filters.singleModeWeek : null

    if (!currentWeek) return []

    const previousWeek = currentWeek - 1

    return rawData.filter((record: InsuranceRecord) => {
      // 前一周的数据
      if (record.week_number !== previousWeek) {
        return false
      }

      // 应用其他筛选条件
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
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
      if (
        filters.businessTypes.length > 0 &&
        !filters.businessTypes.includes(record.business_type_category)
      ) {
        return false
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

      return true
    })
  }, [rawData, filters])
}

/**
 * 按业务类型维度进行边际贡献分析
 */
export function useMarginalContributionAnalysis(): MarginalContributionItem[] {
  const filteredData = useFilteredData()
  const previousWeekData = usePreviousWeekData()
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filteredData.length === 0) {
      return []
    }

    // 按业务类型分组当前周数据
    const currentGrouped = new Map<string, InsuranceRecord[]>()
    filteredData.forEach(record => {
      const key = record.business_type_category || '未知'
      if (!currentGrouped.has(key)) {
        currentGrouped.set(key, [])
      }
      currentGrouped.get(key)!.push(record)
    })

    // 按业务类型分组前一周数据
    const previousGrouped = new Map<string, InsuranceRecord[]>()
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      previousWeekData.forEach(record => {
        const key = record.business_type_category || '未知'
        if (!previousGrouped.has(key)) {
          previousGrouped.set(key, [])
        }
        previousGrouped.get(key)!.push(record)
      })
    }

    // 计算每个业务类型的KPI
    const items: MarginalContributionItem[] = []

    currentGrouped.forEach((records, key) => {
      const previousRecords = previousGrouped.get(key) || []

      // 计算当前周KPI
      let currentKPI
      if (dataViewType === 'increment' && previousRecords.length > 0) {
        currentKPI = kpiEngine.calculateIncrement(records, previousRecords)
      } else {
        currentKPI = kpiEngine.calculate(records)
      }

      // 计算上期KPI（用于环比）
      let previousKPI = null
      if (previousRecords.length > 0) {
        previousKPI = kpiEngine.calculate(previousRecords)
      }

      items.push({
        key,
        label: key,
        contributionMarginRatio: currentKPI.contribution_margin_ratio,
        variableCostRatio: currentKPI.variable_cost_ratio,
        contributionMarginAmount: currentKPI.contribution_margin_amount,
        averageContribution: currentKPI.average_contribution,
        previous: previousKPI
          ? {
              contributionMarginRatio: previousKPI.contribution_margin_ratio,
              variableCostRatio: previousKPI.variable_cost_ratio,
              contributionMarginAmount: previousKPI.contribution_margin_amount,
              averageContribution: previousKPI.average_contribution,
            }
          : undefined,
      })
    })

    // 按满期边贡率降序排序（最高的在前面）
    items.sort((a, b) => {
      const aValue = a.contributionMarginRatio ?? -Infinity
      const bValue = b.contributionMarginRatio ?? -Infinity
      return bValue - aValue
    })

    // 返回前16个业务类型（2环比恶化 + 其他14个）
    return items.slice(0, 16)
  }, [filteredData, previousWeekData, dataViewType])
}
