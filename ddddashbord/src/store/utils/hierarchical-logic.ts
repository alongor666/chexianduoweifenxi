import { AppState, defaultFilters } from '../types'
import type { FilterState } from '@/types/insurance'

/**
 * 更新全局筛选
 */
export const updateGlobalFiltersLogic = (
  state: AppState,
  filters: Partial<FilterState>
): Partial<AppState> => {
  const newGlobal = { ...state.hierarchicalFilters.global, ...filters }
  const activeTab = state.hierarchicalFilters.activeTab
  const tabFilters = state.hierarchicalFilters.tabs[activeTab] || {}

  // 合并生成当前生效的 filters (向后兼容)
  const mergedFilters = {
    ...defaultFilters,
    ...newGlobal,
    ...tabFilters,
  }

  return {
    hierarchicalFilters: {
      ...state.hierarchicalFilters,
      global: newGlobal,
    },
    filters: mergedFilters,
    // 筛选条件变更时清空 KPI 缓存
    computedKPIs: new Map(),
  }
}

/**
 * 更新 Tab 级筛选
 */
export const updateTabFiltersLogic = (
  state: AppState,
  tab: keyof AppState['hierarchicalFilters']['tabs'],
  filters: Partial<FilterState>
): Partial<AppState> => {
  const newTabFilters = {
    ...(state.hierarchicalFilters.tabs[tab] || {}),
    ...filters,
  }

  const newTabs = {
    ...state.hierarchicalFilters.tabs,
    [tab]: newTabFilters,
  }

  // 如果更新的是当前激活的 tab，则同步更新生效的 filters
  let mergedFilters = state.filters
  if (tab === state.hierarchicalFilters.activeTab) {
    mergedFilters = {
      ...defaultFilters,
      ...state.hierarchicalFilters.global,
      ...newTabFilters,
    }
  }

  return {
    hierarchicalFilters: {
      ...state.hierarchicalFilters,
      tabs: newTabs,
    },
    filters: mergedFilters,
    computedKPIs: new Map(),
  }
}

/**
 * 设置激活 Tab
 */
export const setActiveTabLogic = (
  state: AppState,
  tab: AppState['hierarchicalFilters']['activeTab']
): Partial<AppState> => {
  const tabFilters = state.hierarchicalFilters.tabs[tab] || {}
  const mergedFilters = {
    ...defaultFilters,
    ...state.hierarchicalFilters.global,
    ...tabFilters,
  }

  return {
    hierarchicalFilters: {
      ...state.hierarchicalFilters,
      activeTab: tab,
    },
    filters: mergedFilters,
    computedKPIs: new Map(),
  }
}

/**
 * 重置全局筛选
 */
export const resetGlobalFiltersLogic = (state: AppState): Partial<AppState> => {
  // 重置全局，保留当前 Tab
  const activeTab = state.hierarchicalFilters.activeTab
  const tabFilters = state.hierarchicalFilters.tabs[activeTab] || {}

  const mergedFilters = {
    ...defaultFilters,
    ...tabFilters,
  }

  return {
    hierarchicalFilters: {
      ...state.hierarchicalFilters,
      global: {},
    },
    filters: mergedFilters,
    computedKPIs: new Map(),
  }
}

/**
 * 重置 Tab 筛选
 */
export const resetTabFiltersLogic = (
  state: AppState,
  tab?: keyof AppState['hierarchicalFilters']['tabs']
): Partial<AppState> => {
  const targetTab = tab || state.hierarchicalFilters.activeTab
  const newTabs = {
    ...state.hierarchicalFilters.tabs,
    [targetTab]: {},
  }

  let mergedFilters = state.filters
  if (targetTab === state.hierarchicalFilters.activeTab) {
    mergedFilters = {
      ...defaultFilters,
      ...state.hierarchicalFilters.global,
    }
  }

  return {
    hierarchicalFilters: {
      ...state.hierarchicalFilters,
      tabs: newTabs,
    },
    filters: mergedFilters,
    computedKPIs: new Map(),
  }
}
