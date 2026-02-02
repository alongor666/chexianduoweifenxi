/**
 * 筛选选项 Hook
 * 提供筛选选项获取和级联筛选支持
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { getFilterOptions, getCascadingFilterOptions } from '@/lib/api'
import type { FilterState, InsuranceRecord } from '@/types/insurance'
import { useAppStore } from '@/store/use-app-store'

interface FilterOptions {
  years: number[]
  weeks: number[]
  organizations: string[]
  insuranceTypes: string[]
  businessTypes: string[]
  coverageTypes: string[]
  customerCategories: string[]
  vehicleGrades: string[]
  terminalSources: string[]
  renewalStatuses: string[]
}

interface UseFilterOptionsResult {
  options: FilterOptions
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 从本地数据提取筛选选项
 */
function extractOptionsFromData(records: InsuranceRecord[]): FilterOptions {
  const options: FilterOptions = {
    years: [],
    weeks: [],
    organizations: [],
    insuranceTypes: [],
    businessTypes: [],
    coverageTypes: [],
    customerCategories: [],
    vehicleGrades: [],
    terminalSources: [],
    renewalStatuses: [],
  }

  const sets = {
    years: new Set<number>(),
    weeks: new Set<number>(),
    organizations: new Set<string>(),
    insuranceTypes: new Set<string>(),
    businessTypes: new Set<string>(),
    coverageTypes: new Set<string>(),
    customerCategories: new Set<string>(),
    vehicleGrades: new Set<string>(),
    terminalSources: new Set<string>(),
    renewalStatuses: new Set<string>(),
  }

  for (const record of records) {
    if (record.policy_start_year) sets.years.add(record.policy_start_year)
    if (record.week_number) sets.weeks.add(record.week_number)
    if (record.third_level_organization) sets.organizations.add(record.third_level_organization)
    if (record.insurance_type) sets.insuranceTypes.add(record.insurance_type)
    if (record.business_type_category) sets.businessTypes.add(record.business_type_category)
    if (record.coverage_type) sets.coverageTypes.add(record.coverage_type)
    if (record.customer_category_3) sets.customerCategories.add(record.customer_category_3)
    if (record.vehicle_insurance_grade) sets.vehicleGrades.add(record.vehicle_insurance_grade)
    if (record.terminal_source) sets.terminalSources.add(record.terminal_source)
    if (record.renewal_status) sets.renewalStatuses.add(record.renewal_status)
  }

  options.years = Array.from(sets.years).sort((a, b) => b - a)
  options.weeks = Array.from(sets.weeks).sort((a, b) => a - b)
  options.organizations = Array.from(sets.organizations).sort()
  options.insuranceTypes = Array.from(sets.insuranceTypes).sort()
  options.businessTypes = Array.from(sets.businessTypes).sort()
  options.coverageTypes = Array.from(sets.coverageTypes).sort()
  options.customerCategories = Array.from(sets.customerCategories).sort()
  options.vehicleGrades = Array.from(sets.vehicleGrades).sort()
  options.terminalSources = Array.from(sets.terminalSources).sort()
  options.renewalStatuses = Array.from(sets.renewalStatuses).sort()

  return options
}

/**
 * 筛选选项 Hook
 */
export function useFilterOptions(options?: {
  useLocalData?: boolean
}): UseFilterOptionsResult {
  const { useLocalData = true } = options || {}

  const rawData = useAppStore(state => state.rawData)

  const [remoteOptions, setRemoteOptions] = useState<FilterOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 本地计算选项
  const localOptions = useMemo(() => {
    if (!useLocalData || rawData.length === 0) {
      return {
        years: [],
        weeks: [],
        organizations: [],
        insuranceTypes: [],
        businessTypes: [],
        coverageTypes: [],
        customerCategories: [],
        vehicleGrades: [],
        terminalSources: [],
        renewalStatuses: [],
      }
    }

    return extractOptionsFromData(rawData)
  }, [useLocalData, rawData])

  // 从远程获取选项
  const fetchFromAPI = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getFilterOptions()

      if (response.success) {
        setRemoteOptions(response.data.options)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options')
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (useLocalData) {
    return {
      options: localOptions,
      isLoading: false,
      error: null,
      refetch: async () => {},
    }
  }

  return {
    options: remoteOptions || {
      years: [],
      weeks: [],
      organizations: [],
      insuranceTypes: [],
      businessTypes: [],
      coverageTypes: [],
      customerCategories: [],
      vehicleGrades: [],
      terminalSources: [],
      renewalStatuses: [],
    },
    isLoading,
    error,
    refetch: fetchFromAPI,
  }
}

/**
 * 级联筛选选项 Hook
 * 根据当前筛选上下文动态计算可用选项
 */
export function useCascadingFilterOptions(options?: {
  context?: Partial<FilterState>
  useLocalData?: boolean
}) {
  const { context, useLocalData = true } = options || {}

  const rawData = useAppStore(state => state.rawData)

  const [remoteOptions, setRemoteOptions] = useState<FilterOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 本地计算级联选项
  const localOptions = useMemo(() => {
    if (!useLocalData || rawData.length === 0) {
      return {
        years: [],
        weeks: [],
        organizations: [],
        insuranceTypes: [],
        businessTypes: [],
        coverageTypes: [],
        customerCategories: [],
        vehicleGrades: [],
        terminalSources: [],
        renewalStatuses: [],
      }
    }

    // 如果有上下文，先过滤数据
    let filteredData = rawData
    if (context && Object.keys(context).length > 0) {
      filteredData = rawData.filter(record => {
        if (context.years?.length && !context.years.includes(record.policy_start_year)) {
          return false
        }
        if (context.weeks?.length && !context.weeks.includes(record.week_number)) {
          return false
        }
        if (context.organizations?.length && !context.organizations.includes(record.third_level_organization)) {
          return false
        }
        if (context.insuranceTypes?.length && !context.insuranceTypes.includes(record.insurance_type)) {
          return false
        }
        if (context.businessTypes?.length && !context.businessTypes.includes(record.business_type_category)) {
          return false
        }
        return true
      })
    }

    return extractOptionsFromData(filteredData)
  }, [useLocalData, rawData, context])

  // 从远程获取级联选项
  const fetchFromAPI = useCallback(async () => {
    if (!context) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getCascadingFilterOptions(context)

      if (response.success) {
        setRemoteOptions(response.data.options)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cascading options')
    } finally {
      setIsLoading(false)
    }
  }, [context])

  // 上下文变化时重新获取（仅远程模式）
  useEffect(() => {
    if (!useLocalData && context) {
      fetchFromAPI()
    }
  }, [useLocalData, context, fetchFromAPI])

  if (useLocalData) {
    return {
      options: localOptions,
      isLoading: false,
      error: null,
      refetch: async () => {},
    }
  }

  return {
    options: remoteOptions || {
      years: [],
      weeks: [],
      organizations: [],
      insuranceTypes: [],
      businessTypes: [],
      coverageTypes: [],
      customerCategories: [],
      vehicleGrades: [],
      terminalSources: [],
      renewalStatuses: [],
    },
    isLoading,
    error,
    refetch: fetchFromAPI,
  }
}
