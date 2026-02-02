/**
 * KPI 数据 Hook
 * 提供 KPI 计算和趋势数据获取
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { calculateKPI, getKPITrends, calculateKPIWithComparison } from '@/lib/api'
import { KPIService } from '@/services/KPIService'
import { DataService } from '@/services/DataService'
import type { KPIResult, FilterState, InsuranceRecord } from '@/types/insurance'
import { useAppStore } from '@/store/use-app-store'
import { safeMax } from '@/lib/utils/array-utils'

interface UseKPIDataOptions {
  filters?: Partial<FilterState>
  weekNumber?: number
  annualTargetYuan?: number
  mode?: 'current' | 'increment'
  useLocalCalculation?: boolean
  includeComparison?: boolean
}

interface UseKPIDataResult {
  kpi: KPIResult | null
  comparison: {
    previousKpi: KPIResult | null
    previousWeekNumber: number | null
  } | null
  recordCount: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * KPI 数据 Hook
 *
 * 支持两种模式：
 * 1. 本地计算（默认）：使用 KPIService 在客户端计算
 * 2. 远程计算：调用 API 在服务端计算
 */
export function useKPIData(
  options: UseKPIDataOptions = {}
): UseKPIDataResult {
  const {
    filters: propFilters,
    weekNumber,
    annualTargetYuan,
    mode = 'current',
    useLocalCalculation = true,
    includeComparison = false,
  } = options

  // Store 数据
  const rawData = useAppStore(state => state.rawData)
  const storeFilters = useAppStore(state => state.filters)
  const premiumTargets = useAppStore(state => state.premiumTargets)

  // 合并筛选条件
  const filters = propFilters || storeFilters

  // 远程计算状态
  const [remoteKPI, setRemoteKPI] = useState<KPIResult | null>(null)
  const [remoteComparison, setRemoteComparison] = useState<UseKPIDataResult['comparison']>(null)
  const [remoteRecordCount, setRemoteRecordCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 计算年度目标
  const targetYuan = annualTargetYuan || premiumTargets?.overall

  // 本地计算 KPI
  const localResult = useMemo(() => {
    if (!useLocalCalculation || rawData.length === 0) {
      return { kpi: null, comparison: null, recordCount: 0 }
    }

    // 应用筛选
    const filteredData = DataService.filter(rawData, filters as FilterState)

    if (filteredData.length === 0) {
      return { kpi: null, comparison: null, recordCount: 0 }
    }

    // 确定当前周次
    const currentWeek = weekNumber || filters.singleModeWeek || safeMax(
      filteredData.map(r => r.week_number).filter((w): w is number => w !== undefined)
    )

    // 计算 KPI
    const kpi = KPIService.calculate(filteredData, {
      annualTargetYuan: targetYuan,
      mode,
      currentWeekNumber: currentWeek || undefined,
      year: filters.years?.[0] || new Date().getFullYear(),
    })

    // 计算对比数据
    let comparison: UseKPIDataResult['comparison'] = null
    if (includeComparison && currentWeek) {
      const compResult = KPIService.calculateSmartComparison(
        rawData,
        currentWeek,
        filters as FilterState,
        targetYuan
      )
      comparison = {
        previousKpi: compResult.compareKpi,
        previousWeekNumber: compResult.previousWeekNumber,
      }
    }

    return { kpi, comparison, recordCount: filteredData.length }
  }, [
    useLocalCalculation,
    rawData,
    filters,
    weekNumber,
    targetYuan,
    mode,
    includeComparison,
  ])

  // 从远程获取 KPI
  const fetchFromAPI = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = includeComparison && weekNumber
        ? await calculateKPIWithComparison(filters, weekNumber, targetYuan)
        : await calculateKPI({
            filters,
            options: {
              annualTargetYuan: targetYuan,
              mode,
              currentWeekNumber: weekNumber,
            },
          })

      if (response.success) {
        setRemoteKPI(response.data.kpi)
        setRemoteComparison(response.data.comparison || null)
        setRemoteRecordCount(response.data.recordCount)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate KPI')
    } finally {
      setIsLoading(false)
    }
  }, [filters, weekNumber, targetYuan, mode, includeComparison])

  // 返回结果
  if (useLocalCalculation) {
    return {
      kpi: localResult.kpi,
      comparison: localResult.comparison,
      recordCount: localResult.recordCount,
      isLoading: false,
      error: null,
      refetch: async () => {}, // 本地计算无需重新获取
    }
  }

  return {
    kpi: remoteKPI,
    comparison: remoteComparison,
    recordCount: remoteRecordCount,
    isLoading,
    error,
    refetch: fetchFromAPI,
  }
}

/**
 * KPI 趋势数据 Hook
 */
export function useKPITrends(options: {
  weeks: number[]
  filters?: Partial<FilterState>
  useLocalCalculation?: boolean
}) {
  const { weeks, filters: propFilters, useLocalCalculation = true } = options

  const rawData = useAppStore(state => state.rawData)
  const storeFilters = useAppStore(state => state.filters)
  const filters = propFilters || storeFilters

  const [remoteTrends, setRemoteTrends] = useState<Array<{ weekNumber: number; kpi: KPIResult }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 本地计算趋势
  const localTrends = useMemo(() => {
    if (!useLocalCalculation || rawData.length === 0 || weeks.length === 0) {
      return []
    }

    const trendMap = KPIService.calculateTrend(rawData, filters as FilterState, {
      weekRange: weeks,
    })

    const trends: Array<{ weekNumber: number; kpi: KPIResult }> = []
    for (const [weekNumber, kpi] of trendMap.entries()) {
      trends.push({ weekNumber, kpi })
    }

    return trends.sort((a, b) => a.weekNumber - b.weekNumber)
  }, [useLocalCalculation, rawData, filters, weeks])

  // 从远程获取趋势
  const fetchFromAPI = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getKPITrends({ weeks, filters })

      if (response.success) {
        setRemoteTrends(response.data.trends)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI trends')
    } finally {
      setIsLoading(false)
    }
  }, [weeks, filters])

  if (useLocalCalculation) {
    return {
      trends: localTrends,
      isLoading: false,
      error: null,
      refetch: async () => {},
    }
  }

  return {
    trends: remoteTrends,
    isLoading,
    error,
    refetch: fetchFromAPI,
  }
}
