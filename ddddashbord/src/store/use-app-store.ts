/**
 * 应用全局状态管理
 * 使用 Zustand 实现
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as Persistence from '@/lib/storage/data-persistence'
// 导入新架构的 Store 以实现数据同步

import { AppState, defaultFilters } from './types'
import {
  loadPremiumTargetsFromStorage,
  processAndSavePremiumTargets,
} from './utils/target-utils'
import { getFiltersForViewMode } from './utils/filter-utils'
import { normalizeInsuranceData } from './utils/data-utils'
import type { BatchUploadResult } from '@/hooks/use-file-upload'

import { setRawDataLogic, appendRawDataLogic } from './utils/data-operations'
import {
  updateGlobalFiltersLogic,
  updateTabFiltersLogic,
  setActiveTabLogic,
  resetGlobalFiltersLogic,
  resetTabFiltersLogic,
} from './utils/hierarchical-logic'

// 重新导出以便兼容
export { filterRecordsWithExclusions } from './utils/filter-utils'
export { useDataStats } from './hooks'
export type { AppState }

/**
 * 创建应用状态 Store
 */
export const useAppStore = create<AppState>()(
  // @ts-expect-error Zustand devtools middleware 类型推断问题
  devtools(
    set => ({
      // ============= 数据状态 =============
      rawData: [],
      isLoading: false,
      error: null,
      uploadProgress: 0,
      // ============= 筛选状态 =============
      filters: defaultFilters,
      hierarchicalFilters: {
        global: {},
        tabs: {},
        activeTab: 'kpi',
      },
      computedKPIs: new Map(),
      viewMode: 'single',
      expandedPanels: new Set(),
      selectedOrganizations: [],
      premiumTargets: loadPremiumTargetsFromStorage(),

      // ============= 数据操作 =============
      setRawData: data =>
        set(state => setRawDataLogic(state, data), false, 'setRawData'),

      appendRawData: data =>
        set(state => appendRawDataLogic(state, data), false, 'appendRawData'),

      clearData: () =>
        set(
          {
            rawData: [],
            computedKPIs: new Map(),
            error: null,
          },
          false,
          'clearData'
        ),

      setLoading: loading => set({ isLoading: loading }, false, 'setLoading'),
      setError: error => set({ error }, false, 'setError'),
      setUploadProgress: progress =>
        set({ uploadProgress: progress }, false, 'setUploadProgress'),

      // ============= 筛选操作 =============
      updateFilters: filters =>
        set(
          state => ({
            filters: { ...state.filters, ...filters },
            // 筛选条件变更时清空 KPI 缓存
            computedKPIs: new Map(),
          }),
          false,
          'updateFilters'
        ),

      resetFilters: () =>
        set(
          {
            filters: defaultFilters,
            computedKPIs: new Map(),
          },
          false,
          'resetFilters'
        ),

      // ============= 分层筛选操作 =============
      updateGlobalFilters: filters =>
        set(
          state => updateGlobalFiltersLogic(state, filters),
          false,
          'updateGlobalFilters'
        ),

      updateTabFilters: (tab, filters) =>
        set(
          state => updateTabFiltersLogic(state, tab, filters),
          false,
          'updateTabFilters'
        ),

      setActiveTab: tab =>
        set(state => setActiveTabLogic(state, tab), false, 'setActiveTab'),

      getMergedFilters: () => {
        const state = useAppStore.getState()
        const activeTab = state.hierarchicalFilters.activeTab
        const tabFilters = state.hierarchicalFilters.tabs[activeTab] || {}
        return {
          ...defaultFilters,
          ...state.hierarchicalFilters.global,
          ...tabFilters,
        }
      },

      resetGlobalFilters: () =>
        set(
          state => resetGlobalFiltersLogic(state),
          false,
          'resetGlobalFilters'
        ),

      resetTabFilters: tab =>
        set(
          state => resetTabFiltersLogic(state, tab),
          false,
          'resetTabFilters'
        ),

      setViewMode: mode =>
        set(
          state => ({
            filters: {
              ...state.filters,
              ...getFiltersForViewMode(state.filters, mode),
            },
          }),
          false,
          'setViewMode'
        ),

      // ============= 目标管理 =============
      setPremiumTargets: targets =>
        set(
          () => ({
            premiumTargets: processAndSavePremiumTargets(targets),
          }),
          false,
          'setPremiumTargets'
        ),

      loadPremiumTargets: () =>
        set(
          () => ({
            premiumTargets: loadPremiumTargetsFromStorage(),
          }),
          false,
          'loadPremiumTargets'
        ),

      // ============= 缓存操作 =============
      setKPICache: (key, result) =>
        set(
          state => {
            const newCache = new Map(state.computedKPIs)
            newCache.set(key, result)
            return {
              computedKPIs: newCache,
            }
          },
          false,
          'setKPICache'
        ),

      clearKPICache: () =>
        set(
          {
            computedKPIs: new Map(),
          },
          false,
          'clearKPICache'
        ),

      getKPICache: key => {
        const state = useAppStore.getState()
        return state.computedKPIs.get(key)
      },

      // ============= UI 操作 =============
      togglePanel: (panelId: string) =>
        set(
          state => {
            const newPanels = new Set(state.expandedPanels)
            if (newPanels.has(panelId)) {
              newPanels.delete(panelId)
            } else {
              newPanels.add(panelId)
            }
            return {
              expandedPanels: newPanels,
            }
          },
          false,
          'togglePanel'
        ),

      setSelectedOrganizations: (orgs: string[]) =>
        set(
          {
            selectedOrganizations: orgs,
          },
          false,
          'setSelectedOrganizations'
        ),

      // 数据持久化操作
      saveDataToPersistentStorage: async () => {
        const state = useAppStore.getState()
        await Persistence.saveDataToStorage(state.rawData)
      },

      loadDataFromPersistentStorage: () => {
        const data = Persistence.loadDataFromStorage()
        if (data) {
          set(
            {
              rawData: normalizeInsuranceData(data),
              error: null,
            },
            false,
            'loadDataFromPersistentStorage'
          )
        }
      },

      clearPersistentData: () => {
        Persistence.clearStoredData()
        set(
          {
            rawData: [],
            computedKPIs: new Map(),
            error: null,
          },
          false,
          'clearPersistentData'
        )
      },

      getStorageStats: () => Persistence.getDataStats(),

      checkFileForDuplicates: async (file: File) => {
        return await Persistence.checkFileExists(file)
      },

      addToUploadHistory: async (
        batchResult: BatchUploadResult,
        files: File[]
      ) => {
        await Persistence.addUploadHistory(batchResult, files)
      },

      getUploadHistoryRecords: () => Persistence.getUploadHistory(),
    }),
    {
      name: 'insurance-analytics-store',
    }
  )
)
