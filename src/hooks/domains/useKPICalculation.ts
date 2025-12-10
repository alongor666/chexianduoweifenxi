/**
 * KPI计算聚合Hook
 * 提供统一的KPI计算接口
 *
 * @architecture 应用层Hook
 * - 聚合数据和目标状态
 * - 调用KPIService计算
 * - 支持多种计算模式
 *
 * @usage
 * ```tsx
 * function KPIDashboard() {
 *   const { currentKpi, compareKpi, loading } = useKPICalculation()
 *   return <div>保费: {currentKpi?.signedPremium}</div>
 * }
 * ```
 */

import { useMemo } from 'react'
import { useDataStore } from '@/store/domains/dataStore'
import { useFilterStore } from '@/store/domains/filterStore'
import { useAppStore } from '@/store/use-app-store' // 临时：目标数据还在旧Store
import { useDrillDownStore } from '@/store/drill-down-store'
import { KPIService } from '@/services/KPIService'
import { DataService } from '@/services/DataService'
import { filterDrillDownData } from '@/components/features/drill-down/utils'
import type { KPIResult } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { safeMax } from '@/lib/utils/array-utils'

/**
 * 内部辅助Hook：获取经过全局筛选和下钻筛选的数据
 */
function useFullyFilteredData() {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const drillDownSteps = useDrillDownStore(state => state.steps)

  return useMemo(() => {
    // 1. 应用全局筛选
    const baseFiltered = DataService.filter(rawData, filters)

    // 2. 应用下钻筛选
    if (drillDownSteps.length === 0) return baseFiltered

    return filterDrillDownData({
      rawData: baseFiltered,
      initialData: baseFiltered,
      filters,
      drillDownSteps,
    })
  }, [rawData, filters, drillDownSteps])
}

/**
 * 基础KPI计算Hook
 */
export function useKPICalculation() {
  const isLoading = useDataStore(state => state.isLoading)
  const filters = useFilterStore(state => state.filters)

  // 使用统一的过滤数据逻辑
  const filteredData = useFullyFilteredData()

  // 临时：从旧Store获取目标数据，待后续迁移到TargetStore
  const premiumTargets = useAppStore(state => state.premiumTargets)

  // 计算当前目标值（根据筛选条件智能匹配）
  const currentTargetYuan = useMemo(() => {
    if (!premiumTargets) return null

    const { businessTypes, organizations, customerCategories, insuranceTypes } =
      filters

    // 优先级：业务类型 > 三级机构 > 客户分类 > 保险类型 > 总体目标

    // 1. 业务类型目标
    if (businessTypes && businessTypes.length > 0) {
      const sum = businessTypes.reduce((acc, type) => {
        const normalized = normalizeChineseText(type)
        return (
          acc +
          (premiumTargets.dimensions.businessType.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 2. 三级机构目标
    if (organizations && organizations.length > 0) {
      const sum = organizations.reduce((acc, org) => {
        const normalized = normalizeChineseText(org)
        return (
          acc +
          (premiumTargets.dimensions.thirdLevelOrganization.entries[
            normalized
          ] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 3. 客户分类目标
    if (customerCategories && customerCategories.length > 0) {
      const sum = customerCategories.reduce((acc, category) => {
        const normalized = normalizeChineseText(category)
        return (
          acc +
          (premiumTargets.dimensions.customerCategory.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 4. 保险类型目标
    if (insuranceTypes && insuranceTypes.length > 0) {
      const sum = insuranceTypes.reduce((acc, type) => {
        const normalized = normalizeChineseText(type)
        return (
          acc +
          (premiumTargets.dimensions.insuranceType.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 5. 总体目标
    return premiumTargets.overall > 0 ? premiumTargets.overall : null
  }, [premiumTargets, filters])

  // 计算KPI
  const currentKpi = useMemo(() => {
    if (filteredData.length === 0) return null

    const currentWeek =
      filters.viewMode === 'single' ? filters.singleModeWeek : null
    const currentYear =
      filters.years && filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear()

    return KPIService.calculate(filteredData, {
      annualTargetYuan: currentTargetYuan ?? undefined,
      mode: filters.dataViewType || 'current',
      currentWeekNumber: currentWeek ?? undefined,
      year: currentYear,
    })
  }, [filteredData, currentTargetYuan, filters])

  return {
    currentKpi,
    premiumTargets, // 导出目标数据供组件使用
    isLoading,
    hasData: filteredData.length > 0,
  }
}

/**
 * 智能环比计算Hook
 * 自动计算当前周和上周的KPI，并提供对比
 */
export function useSmartKPIComparison() {
  const rawData = useDataStore(state => state.rawData) // 需要原始数据来计算上周（因为过滤后的数据可能只包含本周？）
  // Wait, if filteredData contains only this week (due to single mode), we can't calculate prev week from it easily if we filtered by week.
  // But useSmartKPIComparison takes rawData and filters, and does its own thing.
  // We need to inject drill-down steps into it.

  const filters = useFilterStore(state => state.filters)
  const drillDownSteps = useDrillDownStore(state => state.steps)
  const premiumTargets = useAppStore(state => state.premiumTargets)

  const currentWeek = filters.singleModeWeek
  const annualTarget = premiumTargets?.overall

  const comparison = useMemo(() => {
    if (!currentWeek || rawData.length === 0) {
      return {
        currentKpi: null,
        compareKpi: null,
        previousWeekNumber: null,
      }
    }

    // 我们需要传入 drillDownSteps 给 KPIService.calculateSmartComparison
    // 但目前该 Service 方法可能不支持。
    // 替代方案：我们先应用下钻筛选（不包括时间筛选），然后再传给 Service。

    // 1. 应用下钻筛选
    let sourceData = rawData
    if (drillDownSteps.length > 0) {
      // 注意：filterDrillDownData 默认会应用 filters。我们需要避免它过滤掉上周数据。
      // 如果我们传递 initialData=rawData，它会跳过全局 filters，只应用 drillDownSteps。
      sourceData = filterDrillDownData({
        rawData,
        initialData: rawData,
        filters,
        drillDownSteps,
      })
    }

    // 2. 传给 Service (它会处理全局筛选器，包括时间)
    return KPIService.calculateSmartComparison(
      sourceData,
      currentWeek,
      filters,
      annualTarget
    )
  }, [rawData, currentWeek, filters, annualTarget, drillDownSteps])

  // 计算增长率
  const growthRate = useMemo(() => {
    if (!comparison.currentKpi || !comparison.compareKpi) return null

    return KPIService.calculateGrowthRate(
      comparison.currentKpi,
      comparison.compareKpi
    )
  }, [comparison])

  return {
    ...comparison,
    growthRate,
  }
}

/**
 * 趋势KPI计算Hook
 * 计算多个周次的KPI趋势
 */
export function useKPITrend(weekRange: number[]) {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const drillDownSteps = useDrillDownStore(state => state.steps)

  const trendData = useMemo(() => {
    if (rawData.length === 0 || weekRange.length === 0) {
      return new Map<number, KPIResult>()
    }

    // 1. 应用下钻筛选 (保留所有周次)
    let sourceData = rawData
    if (drillDownSteps.length > 0) {
      sourceData = filterDrillDownData({
        rawData,
        initialData: rawData, // 只应用下钻，不应用全局 filters (全局 filters 由 calculateTrend 处理)
        filters,
        drillDownSteps,
      })
    }

    return KPIService.calculateTrend(sourceData, filters, { weekRange })
  }, [rawData, filters, weekRange, drillDownSteps])

  return {
    trendData,
    weekRange,
    hasData: trendData.size > 0,
  }
}

/**
 * 按维度分组的KPI计算Hook
 */
export function useKPIByDimension<
  K extends keyof import('@/types/insurance').InsuranceRecord,
>(dimension: K) {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const drillDownSteps = useDrillDownStore(state => state.steps)

  const kpiByDimension = useMemo(() => {
    if (rawData.length === 0) {
      return new Map()
    }

    // 1. 应用下钻筛选
    let sourceData = rawData
    if (drillDownSteps.length > 0) {
      sourceData = filterDrillDownData({
        rawData,
        initialData: rawData,
        filters,
        drillDownSteps,
      })
    }

    return KPIService.calculateByDimension(sourceData, dimension, filters)
  }, [rawData, dimension, filters, drillDownSteps])

  return {
    kpiByDimension,
    dimensionValues: Array.from(kpiByDimension.keys()),
  }
}
