/**
 * 结构分布与占比聚合 Hook
 * 支持当周值和周增量两种模式
 */

'use client'

import { useMemo } from 'react'
import { useDataStore, useFilterStore } from '@/store/domains'
import { DataService } from '@/services/DataService'
import type { InsuranceRecord, FilterState } from '@/types/insurance'

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
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)

  return useMemo(() => {
    const currentWeek =
      filters.viewMode === 'single' ? filters.singleModeWeek : null

    if (!currentWeek) return []

    const previousWeek = currentWeek - 1

    // 使用 DataService.filter() 统一过滤逻辑
    const previousWeekFilters: FilterState = {
      ...filters,
      weeks: [previousWeek],
    }

    return DataService.filter(rawData, previousWeekFilters)
  }, [rawData, filters])
}

export function useOrganizationStructure(topN = 12): StructurePoint[] {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const filtered = useMemo(() => DataService.filter(rawData, filters), [rawData, filters])
  const previousWeekData = usePreviousWeekData()
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
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const filtered = useMemo(() => DataService.filter(rawData, filters), [rawData, filters])
  const previousWeekData = usePreviousWeekData()
  const dataViewType = filters.dataViewType

  return useMemo(() => {
    if (filtered.length === 0) return []

    const currentGrouped = aggregateBy(
      filtered,
      r => (r.business_type_category || '未知') as string
    )

    let finalGrouped = currentGrouped
    if (dataViewType === 'increment' && previousWeekData.length > 0) {
      const previousGrouped = aggregateBy(
        previousWeekData,
        r => (r.business_type_category || '未知') as string
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

export function useCustomerDistribution(topN = 10): PiePoint[] {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const filtered = useMemo(() => DataService.filter(rawData, filters), [rawData, filters])
  const previousWeekData = usePreviousWeekData()
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
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const filtered = useMemo(() => DataService.filter(rawData, filters), [rawData, filters])
  const previousWeekData = usePreviousWeekData()
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
