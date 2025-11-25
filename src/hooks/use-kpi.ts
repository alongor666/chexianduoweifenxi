/**
 * KPI 计算 Hook
 * 基于筛选后的数据计算 KPI 指标
 * 支持当周值和周增量两种模式
 *
 * @deprecated 建议使用 useKPICalculation()，此Hook仅为保持向后兼容
 */

import { useMemo } from 'react'
import { useDataStore } from '@/store/domains/dataStore'
import { useFilterStore } from '@/store/domains/filterStore'
import { useTargetStore } from '@/store/domains/targetStore'
import { useFilteredData } from './use-filtered-data'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import type { KPIResult, InsuranceRecord, FilterState } from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'
import { safeMax } from '@/lib/utils/array-utils'
import { DataService } from '@/services/DataService'

/**
 * 使用 KPI 计算
 * @returns KPI 计算结果
 */
export function useKPI(): KPIResult | null {
  const filteredData = useFilteredData()
  const rawData = useDataStore(state => state.rawData)
  // 使用细粒度选择器避免对象引用问题
  const businessTypes = useFilterStore(state => state.filters.businessTypes)
  const organizations = useFilterStore(state => state.filters.organizations)
  const customerCategories = useFilterStore(state => state.filters.customerCategories)
  const insuranceTypes = useFilterStore(state => state.filters.insuranceTypes)
  const years = useFilterStore(state => state.filters.years)
  const coverageTypes = useFilterStore(state => state.filters.coverageTypes)
  const vehicleGrades = useFilterStore(state => state.filters.vehicleGrades)
  const terminalSources = useFilterStore(state => state.filters.terminalSources)
  const isNewEnergy = useFilterStore(state => state.filters.isNewEnergy)
  const renewalStatuses = useFilterStore(state => state.filters.renewalStatuses)
  const viewMode = useFilterStore(state => state.filters.viewMode)
  const singleModeWeek = useFilterStore(state => state.filters.singleModeWeek)
  const dataViewType = useFilterStore(state => state.filters.dataViewType)
  const premiumTargets = useTargetStore(state => state.premiumTargets)

  const currentTargetYuan = useMemo(() => {
    if (!premiumTargets) return null

    // 优先级：业务类型 > 三级机构 > 客户分类 > 保险类型 > 总体目标

    // 1. 业务类型目标
    if (businessTypes.length > 0) {
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
    if (organizations.length > 0) {
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
    if (customerCategories.length > 0) {
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
    if (insuranceTypes.length > 0) {
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
  }, [businessTypes, organizations, customerCategories, insuranceTypes, premiumTargets])

  const kpiResult = useMemo(() => {
    if (filteredData.length === 0) {
      return null
    }

    // 重建 filters 对象供内部使用
    const filters = {
      viewMode,
      singleModeWeek,
      years,
      organizations,
      insuranceTypes,
      businessTypes,
      coverageTypes,
      customerCategories,
      vehicleGrades,
      terminalSources,
      isNewEnergy,
      renewalStatuses,
    }

    // 获取当前选择的周次和年份
    const currentWeek =
      viewMode === 'single' ? singleModeWeek : null
    const currentYear =
      years.length > 0
        ? safeMax(years)
        : new Date().getFullYear()

    // 当周值模式：直接计算
    if (dataViewType === 'current') {
      return kpiEngine.calculate(filteredData, {
        annualTargetYuan: currentTargetYuan ?? undefined,
        mode: 'current',
        currentWeekNumber: currentWeek ?? undefined,
        year: currentYear,
      })
    }

    // 周增量模式：需要计算当前周和前一周的差值
    if (!currentWeek) {
      // 如果没有选择具体周次，返回当周值
      return kpiEngine.calculate(filteredData, {
        annualTargetYuan: currentTargetYuan ?? undefined,
        mode: 'current',
        year: currentYear,
      })
    }

    // 获取当前周的数据（已经是筛选后的数据）
    const currentWeekData = filteredData

    // 获取前一周的数据 - 使用 DataService.filter() 统一过滤逻辑
    const previousWeek = currentWeek - 1
    const previousWeekFilters: FilterState = {
      ...filters,
      weeks: [previousWeek],
      dataViewType: 'current',
      trendModeWeeks: [],
    }
    const previousWeekData = DataService.filter(rawData, previousWeekFilters)

    // 计算周增量（使用increment模式）
    return kpiEngine.calculateIncrement(currentWeekData, previousWeekData, {
      mode: 'increment',
      annualTargetYuan: currentTargetYuan ?? undefined,
      currentWeekNumber: currentWeek,
      year: currentYear,
    })
  }, [
    filteredData,
    rawData,
    viewMode,
    singleModeWeek,
    years,
    organizations,
    insuranceTypes,
    businessTypes,
    coverageTypes,
    customerCategories,
    vehicleGrades,
    terminalSources,
    isNewEnergy,
    renewalStatuses,
    dataViewType,
    currentTargetYuan,
  ])

  return kpiResult
}
