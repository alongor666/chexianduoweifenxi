/**
 * 保险记录查询 Hook
 * 提供数据获取和缓存管理
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getRecords, getAllRecords } from '@/lib/api'
import type { InsuranceRecord, FilterState } from '@/types/insurance'
import { useAppStore } from '@/store/use-app-store'

interface UseInsuranceRecordsOptions {
  autoFetch?: boolean
  filters?: Partial<FilterState>
  useLocalData?: boolean
}

interface UseInsuranceRecordsResult {
  records: InsuranceRecord[]
  total: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 保险记录查询 Hook
 *
 * 支持两种模式：
 * 1. 本地模式（默认）：从 Store 获取数据
 * 2. 远程模式：从 API 获取数据
 */
export function useInsuranceRecords(
  options: UseInsuranceRecordsOptions = {}
): UseInsuranceRecordsResult {
  const { autoFetch = true, filters, useLocalData = true } = options

  // 本地数据来源
  const rawData = useAppStore(state => state.rawData)
  const storeFilters = useAppStore(state => state.filters)

  // 远程数据状态
  const [remoteRecords, setRemoteRecords] = useState<InsuranceRecord[]>([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 避免重复请求
  const fetchingRef = useRef(false)

  // 从远程获取数据
  const fetchFromAPI = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    setIsLoading(true)
    setError(null)

    try {
      const response = await getAllRecords(filters || storeFilters)

      if (response.success) {
        setRemoteRecords(response.data.records)
        setRemoteTotal(response.data.total)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records')
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [filters, storeFilters])

  // 自动获取（仅远程模式）
  useEffect(() => {
    if (autoFetch && !useLocalData) {
      fetchFromAPI()
    }
  }, [autoFetch, useLocalData, fetchFromAPI])

  // 本地模式：直接返回 Store 数据
  if (useLocalData) {
    return {
      records: rawData,
      total: rawData.length,
      isLoading: false,
      error: null,
      refetch: async () => {
        // 本地模式无需重新获取
      },
    }
  }

  // 远程模式
  return {
    records: remoteRecords,
    total: remoteTotal,
    isLoading,
    error,
    refetch: fetchFromAPI,
  }
}

/**
 * 分页查询 Hook
 */
export function usePaginatedRecords(options: {
  page: number
  pageSize: number
  filters?: Partial<FilterState>
}) {
  const { page, pageSize, filters } = options
  const [records, setRecords] = useState<InsuranceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getRecords({ filters, page, pageSize })

      if (response.success) {
        setRecords(response.data.records)
        setTotal(response.data.total)
      } else {
        setError((response as { success: false; error: { message: string } }).error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    total,
    totalPages: Math.ceil(total / pageSize),
    isLoading,
    error,
    refetch: fetchRecords,
  }
}
