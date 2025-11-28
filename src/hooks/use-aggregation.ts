/**
 * 结构分布与占比聚合 Hook
 * 支持当周值和周增量两种模式
 */

'use client'

import { useMemo } from 'react'
import { useAppStore, useFilteredData } from '@/store/use-app-store'
import type { InsuranceRecord } from '@/types/insurance'
import { getBusinessTypeCode, getBusinessTypeShortLabelByCode } from '@/constants/dimensions'

export interface StructurePoint {
  key: string
  label: string
  signed_premium_10k: number
  matured_premium_10k: number
  policy_count: number
}

export interface PiePoint {
  key: string
  label: string
  value: number // 使用满期保费（万元）
}

function aggregateBy<T extends string>(
  rows: InsuranceRecord[],
  keySelector: (r: InsuranceRecord) => T
): Map<T, { signed: number; matured: number; count: number }> {
  const map = new Map<T, { signed: number; matured: number; count: number }>()
  for (const r of rows) {
    const k = keySelector(r)
    if (!map.has(k)) map.set(k, { signed: 0, matured: 0, count: 0 })
    const entry = map.get(k)!
    entry.signed += r.signed_premium_yuan
    entry.matured += r.matured_premium_yuan
    entry.count += r.policy_count
  }
  return map
}

/**
 * 计算两个聚合结果的增量
 */
function calculateIncrement<T extends string>(
  current: Map<T, { signed: number; matured: number; count: number }>,
  previous: Map<T, { signed: number; matured: number; count: number }>
): Map<T, { signed: number; matured: number; count: number }> {
  const result = new Map<
    T,
    { signed: number; matured: number; count: number }
  >()

  current.forEach((currVal, key) => {
    const prevVal = previous.get(key) || { signed: 0, matured: 0, count: 0 }
    result.set(key, {
      signed: currVal.signed - prevVal.signed,
      matured: currVal.matured - prevVal.matured,
      count: currVal.count - prevVal.count,
    })
  })

  return result
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

      return true
    })
  }, [rawData, filters])
}

export function useOrganizationStructure(topN = 12): StructurePoint[] {
  const filtered = useFilteredData()
  const previousWeekData = usePreviousWeekData()
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filtered.length === 0) return []

    const currentGrouped = aggregateBy(
      filtered,
      r => (r.third_level_organization || '未知') as string
    )

    let finalGrouped = currentGrouped
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      const previousGrouped = aggregateBy(
        previousWeekData,
        r => (r.third_level_organization || '未知') as string
      )
      finalGrouped = calculateIncrement(currentGrouped, previousGrouped)
    }

    const list: StructurePoint[] = Array.from(finalGrouped.entries()).map(
      ([k, v]) => ({
        key: k,
        label: k,
        signed_premium_10k: v.signed / 10000,
        matured_premium_10k: v.matured / 10000,
        policy_count: v.count,
      })
    )
    list.sort((a, b) => b.matured_premium_10k - a.matured_premium_10k)
    return list.slice(0, topN)
  }, [filtered, previousWeekData, dataViewType, topN])
}

export function useProductStructure(topN = 12): StructurePoint[] {
  const filtered = useFilteredData()
  const previousWeekData = usePreviousWeekData()
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filtered.length === 0) return []

    const currentGrouped = aggregateBy(
      filtered,
      r => (getBusinessTypeCode(r.business_type_category || '') || 'OTHER') as string
    )

    let finalGrouped = currentGrouped
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      const previousGrouped = aggregateBy(
        previousWeekData,
        r => (getBusinessTypeCode(r.business_type_category || '') || 'OTHER') as string
      )
      finalGrouped = calculateIncrement(currentGrouped, previousGrouped)
    }

    const list: StructurePoint[] = Array.from(finalGrouped.entries()).map(
      ([k, v]) => ({
        key: k,
        label: getBusinessTypeShortLabelByCode(k as any),
        signed_premium_10k: v.signed / 10000,
        matured_premium_10k: v.matured / 10000,
        policy_count: v.count,
      })
    )
    list.sort((a, b) => b.matured_premium_10k - a.matured_premium_10k)
    return list.slice(0, topN)
  }, [filtered, previousWeekData, dataViewType, topN])
}

export function useCustomerDistribution(topN = 10): PiePoint[] {
  const filtered = useFilteredData()
  const previousWeekData = usePreviousWeekData()
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filtered.length === 0) return []

    const currentGrouped = aggregateBy(
      filtered,
      r => (r.customer_category_3 || '未知') as string
    )

    let finalGrouped = currentGrouped
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      const previousGrouped = aggregateBy(
        previousWeekData,
        r => (r.customer_category_3 || '未知') as string
      )
      finalGrouped = calculateIncrement(currentGrouped, previousGrouped)
    }

    let list: PiePoint[] = Array.from(finalGrouped.entries()).map(([k, v]) => ({
      key: k,
      label: k,
      value: v.matured / 10000,
    }))
    list.sort((a, b) => b.value - a.value)
    if (list.length > topN) {
      const head = list.slice(0, topN - 1)
      const tailValue = list
        .slice(topN - 1)
        .reduce((sum, p) => sum + p.value, 0)
      list = [...head, { key: '其他', label: '其他', value: tailValue }]
    }
    return list
  }, [filtered, previousWeekData, dataViewType, topN])
}

export function useChannelDistribution(topN = 10): PiePoint[] {
  const filtered = useFilteredData()
  const previousWeekData = usePreviousWeekData()
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filtered.length === 0) return []

    const currentGrouped = aggregateBy(
      filtered,
      r => (r.terminal_source || '未知') as string
    )

    let finalGrouped = currentGrouped
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      const previousGrouped = aggregateBy(
        previousWeekData,
        r => (r.terminal_source || '未知') as string
      )
      finalGrouped = calculateIncrement(currentGrouped, previousGrouped)
    }

    let list: PiePoint[] = Array.from(finalGrouped.entries()).map(([k, v]) => ({
      key: k,
      label: k,
      value: v.matured / 10000,
    }))
    list.sort((a, b) => b.value - a.value)
    if (list.length > topN) {
      const head = list.slice(0, topN - 1)
      const tailValue = list
        .slice(topN - 1)
        .reduce((sum, p) => sum + p.value, 0)
      list = [...head, { key: '其他', label: '其他', value: tailValue }]
    }
    return list
  }, [filtered, previousWeekData, dataViewType, topN])
}
