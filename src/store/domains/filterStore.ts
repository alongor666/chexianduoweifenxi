/**
 * 筛选状态领域 Store
 * 专注于筛选条件的管理
 *
 * @responsibility 单一职责：只管理筛选状态和筛选逻辑
 * @migration 从 use-app-store.ts 拆分出筛选管理部分
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { FilterState } from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'

interface FilterStore {
  // ==================== 状态 ====================
  /**
   * 当前筛选条件
   */
  filters: FilterState

  // ==================== 操作方法 ====================

  /**
   * 更新筛选条件（部分更新）
   */
  updateFilters: (filters: Partial<FilterState>) => void

  /**
   * 重置筛选条件
   */
  resetFilters: () => void

  /**
   * 设置视图模式
   */
  setViewMode: (mode: 'single' | 'trend') => void

  /**
   * 设置数据视图类型
   */
  setDataViewType: (type: 'current' | 'increment') => void

  // ==================== 计算属性 ====================

  /**
   * 获取激活的筛选器数量
   */
  getActiveFilterCount: () => number

  /**
   * 检查特定筛选器是否激活
   */
  isFilterActive: (key: keyof FilterState) => boolean
}

/**
 * 默认筛选器状态
 */
const defaultFilters: FilterState = {
  viewMode: 'single',
  dataViewType: 'current',
  years: [],
  weeks: [],
  singleModeWeek: null,
  trendModeWeeks: [],
  organizations: [],
  insuranceTypes: [],
  businessTypes: [],
  coverageTypes: [],
  customerCategories: [],
  vehicleGrades: [],
  terminalSources: [],
  isNewEnergy: null,
  renewalStatuses: [],
}

/**
 * 创建筛选 Store
 */
export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ==================== 初始状态 ====================
        filters: defaultFilters,

        // ==================== 操作方法 ====================

        updateFilters: newFilters => {
          set(
            state => ({
              filters: {
                ...state.filters,
                ...newFilters,
                // 规范化中文文本
                organizations: (
                  newFilters.organizations ?? state.filters.organizations
                ).map(normalizeChineseText),
                insuranceTypes: (
                  newFilters.insuranceTypes ?? state.filters.insuranceTypes
                ).map(normalizeChineseText),
                businessTypes: (
                  newFilters.businessTypes ?? state.filters.businessTypes
                ).map(normalizeChineseText),
                coverageTypes: (
                  newFilters.coverageTypes ?? state.filters.coverageTypes
                ).map(normalizeChineseText),
                customerCategories: (
                  newFilters.customerCategories ??
                  state.filters.customerCategories
                ).map(normalizeChineseText),
                vehicleGrades: (
                  newFilters.vehicleGrades ?? state.filters.vehicleGrades
                ).map(normalizeChineseText),
                renewalStatuses: (
                  newFilters.renewalStatuses ?? state.filters.renewalStatuses
                ).map(normalizeChineseText),
                terminalSources: (
                  newFilters.terminalSources ?? state.filters.terminalSources
                ).map(normalizeChineseText),
              },
            }),
            false,
            'updateFilters'
          )
        },

        resetFilters: () => {
          set({ filters: defaultFilters }, false, 'resetFilters')
        },

        setViewMode: mode => {
          set(
            state => ({
              filters: {
                ...state.filters,
                viewMode: mode,
              },
            }),
            false,
            'setViewMode'
          )
        },

        setDataViewType: type => {
          set(
            state => ({
              filters: {
                ...state.filters,
                dataViewType: type,
              },
            }),
            false,
            'setDataViewType'
          )
        },

        // ==================== 计算属性 ====================

        getActiveFilterCount: () => {
          const { filters } = get()
          let count = 0

          if (filters.years && filters.years.length > 0) count++
          if (filters.weeks && filters.weeks.length > 0) count++
          if (filters.organizations && filters.organizations.length > 0) count++
          if (filters.insuranceTypes && filters.insuranceTypes.length > 0) count++
          if (filters.businessTypes && filters.businessTypes.length > 0) count++
          if (filters.coverageTypes && filters.coverageTypes.length > 0) count++
          if (
            filters.customerCategories &&
            filters.customerCategories.length > 0
          )
            count++
          if (filters.vehicleGrades && filters.vehicleGrades.length > 0) count++
          if (filters.terminalSources && filters.terminalSources.length > 0)
            count++
          if (filters.isNewEnergy !== null) count++
          if (filters.renewalStatuses && filters.renewalStatuses.length > 0)
            count++

          return count
        },

        isFilterActive: key => {
          const { filters } = get()
          const value = filters[key]

          if (Array.isArray(value)) {
            return value.length > 0
          }

          if (key === 'isNewEnergy') {
            return value !== null
          }

          return false
        },
      }),
      {
        name: 'filter-store',
        // 只持久化筛选条件
        partialize: state => ({ filters: state.filters }),
      }
    ),
    {
      name: 'filter-store',
    }
  )
)
