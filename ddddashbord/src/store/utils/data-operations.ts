import { AppState } from '../types'
import { normalizeInsuranceData, getInitialFilters } from './data-utils'
import { useDataStore } from '@/store/domains/dataStore'
import { InsuranceRecord } from '@/types/insurance'

/**
 * 设置原始数据逻辑
 */
export const setRawDataLogic = (
  state: AppState,
  data: InsuranceRecord[]
): Partial<AppState> => {
  const normalizedData = normalizeInsuranceData(data)

  // 同步数据到新架构的 DataStore（使用 setData 方法，不自动保存避免重复）
  useDataStore
    .getState()
    .setData(normalizedData, false)
    .catch(err => {
      console.error('[AppStore] 同步数据到 DataStore 失败:', err)
    })

  const newFilters = getInitialFilters(normalizedData, state.filters)

  return {
    rawData: normalizedData,
    filters: newFilters,
    // 数据更新时清空 KPI 缓存
    computedKPIs: new Map(),
    error: null,
  }
}

/**
 * 追加原始数据逻辑
 */
export const appendRawDataLogic = (
  state: AppState,
  data: InsuranceRecord[]
): Partial<AppState> => {
  const normalizedNewData = normalizeInsuranceData(data)
  const mergedData = [...state.rawData, ...normalizedNewData]

  // 同步到 DataStore
  useDataStore
    .getState()
    .setData(mergedData, false)
    .catch(err => {
      console.error('[AppStore] 同步追加数据到 DataStore 失败:', err)
    })

  return {
    rawData: mergedData,
    // 数据更新时清空 KPI 缓存
    computedKPIs: new Map(),
    error: null,
  }
}
