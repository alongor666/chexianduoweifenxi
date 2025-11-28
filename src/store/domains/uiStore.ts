/**
 * UI状态管理领域 Store
 * 专注于UI相关状态的管理
 *
 * @responsibility 单一职责：只管理UI展示状态
 * @migration 从 use-app-store.ts 拆分出UI状态管理部分
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIStore {
  // ==================== 状态 ====================
  /**
   * 视图模式：单周模式 vs 趋势模式
   */
  viewMode: 'single' | 'trend'

  /**
   * 展开的面板集合
   */
  expandedPanels: Set<string>

  /**
   * 选中的机构列表（用于对比展示）
   */
  selectedOrganizations: string[]

  /**
   * 侧边栏是否展开
   */
  sidebarExpanded: boolean

  /**
   * 筛选面板是否展开
   */
  filterPanelExpanded: boolean

  /**
   * 表格显示配置
   */
  tableConfig: {
    pageSize: number
    currentPage: number
    sortBy: string | null
    sortOrder: 'asc' | 'desc'
  }

  /**
   * 图表显示配置
   */
  chartConfig: {
    showLegend: boolean
    showDataLabels: boolean
    animationEnabled: boolean
  }

  // ==================== 操作方法 ====================

  /**
   * 设置视图模式
   */
  setViewMode: (mode: 'single' | 'trend') => void

  /**
   * 切换面板展开/收起状态
   * @param panelId 面板ID
   */
  togglePanel: (panelId: string) => void

  /**
   * 展开指定面板
   * @param panelId 面板ID
   */
  expandPanel: (panelId: string) => void

  /**
   * 收起指定面板
   * @param panelId 面板ID
   */
  collapsePanel: (panelId: string) => void

  /**
   * 展开所有面板
   */
  expandAllPanels: (panelIds: string[]) => void

  /**
   * 收起所有面板
   */
  collapseAllPanels: () => void

  /**
   * 设置选中的机构列表
   * @param orgs 机构名称列表
   */
  setSelectedOrganizations: (orgs: string[]) => void

  /**
   * 添加选中机构
   * @param org 机构名称
   */
  addSelectedOrganization: (org: string) => void

  /**
   * 移除选中机构
   * @param org 机构名称
   */
  removeSelectedOrganization: (org: string) => void

  /**
   * 清空选中机构
   */
  clearSelectedOrganizations: () => void

  /**
   * 切换侧边栏展开状态
   */
  toggleSidebar: () => void

  /**
   * 设置侧边栏展开状态
   */
  setSidebarExpanded: (expanded: boolean) => void

  /**
   * 切换筛选面板展开状态
   */
  toggleFilterPanel: () => void

  /**
   * 设置筛选面板展开状态
   */
  setFilterPanelExpanded: (expanded: boolean) => void

  /**
   * 更新表格配置
   */
  updateTableConfig: (config: Partial<UIStore['tableConfig']>) => void

  /**
   * 更新图表配置
   */
  updateChartConfig: (config: Partial<UIStore['chartConfig']>) => void

  /**
   * 重置所有UI状态
   */
  resetUI: () => void

  // ==================== 计算属性 ====================

  /**
   * 检查面板是否展开
   * @param panelId 面板ID
   */
  isPanelExpanded: (panelId: string) => boolean

  /**
   * 获取展开面板的数量
   */
  getExpandedPanelCount: () => number

  /**
   * 检查机构是否被选中
   * @param org 机构名称
   */
  isOrganizationSelected: (org: string) => boolean
}

/**
 * 默认UI状态
 */
const defaultUIState = {
  viewMode: 'single' as const,
  expandedPanels: new Set<string>(),
  selectedOrganizations: [],
  sidebarExpanded: true,
  filterPanelExpanded: true,
  tableConfig: {
    pageSize: 20,
    currentPage: 1,
    sortBy: null,
    sortOrder: 'asc' as const,
  },
  chartConfig: {
    showLegend: true,
    showDataLabels: false,
    animationEnabled: true,
  },
}

/**
 * 创建UI Store
 */
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ==================== 初始状态 ====================
        ...defaultUIState,

        // ==================== 操作方法 ====================

        setViewMode: mode => {
          set({ viewMode: mode }, false, 'setViewMode')
        },

        togglePanel: panelId => {
          set(
            state => {
              const newPanels = new Set(state.expandedPanels)
              if (newPanels.has(panelId)) {
                newPanels.delete(panelId)
              } else {
                newPanels.add(panelId)
              }
              return { expandedPanels: newPanels }
            },
            false,
            'togglePanel'
          )
        },

        expandPanel: panelId => {
          set(
            state => {
              const newPanels = new Set(state.expandedPanels)
              newPanels.add(panelId)
              return { expandedPanels: newPanels }
            },
            false,
            'expandPanel'
          )
        },

        collapsePanel: panelId => {
          set(
            state => {
              const newPanels = new Set(state.expandedPanels)
              newPanels.delete(panelId)
              return { expandedPanels: newPanels }
            },
            false,
            'collapsePanel'
          )
        },

        expandAllPanels: panelIds => {
          set(
            {
              expandedPanels: new Set(panelIds),
            },
            false,
            'expandAllPanels'
          )
        },

        collapseAllPanels: () => {
          set(
            {
              expandedPanels: new Set(),
            },
            false,
            'collapseAllPanels'
          )
        },

        setSelectedOrganizations: orgs => {
          set(
            { selectedOrganizations: orgs },
            false,
            'setSelectedOrganizations'
          )
        },

        addSelectedOrganization: org => {
          set(
            state => ({
              selectedOrganizations: [...state.selectedOrganizations, org],
            }),
            false,
            'addSelectedOrganization'
          )
        },

        removeSelectedOrganization: org => {
          set(
            state => ({
              selectedOrganizations: state.selectedOrganizations.filter(
                o => o !== org
              ),
            }),
            false,
            'removeSelectedOrganization'
          )
        },

        clearSelectedOrganizations: () => {
          set(
            { selectedOrganizations: [] },
            false,
            'clearSelectedOrganizations'
          )
        },

        toggleSidebar: () => {
          set(
            state => ({ sidebarExpanded: !state.sidebarExpanded }),
            false,
            'toggleSidebar'
          )
        },

        setSidebarExpanded: expanded => {
          set({ sidebarExpanded: expanded }, false, 'setSidebarExpanded')
        },

        toggleFilterPanel: () => {
          set(
            state => ({ filterPanelExpanded: !state.filterPanelExpanded }),
            false,
            'toggleFilterPanel'
          )
        },

        setFilterPanelExpanded: expanded => {
          set(
            { filterPanelExpanded: expanded },
            false,
            'setFilterPanelExpanded'
          )
        },

        updateTableConfig: config => {
          set(
            state => ({
              tableConfig: {
                ...state.tableConfig,
                ...config,
              },
            }),
            false,
            'updateTableConfig'
          )
        },

        updateChartConfig: config => {
          set(
            state => ({
              chartConfig: {
                ...state.chartConfig,
                ...config,
              },
            }),
            false,
            'updateChartConfig'
          )
        },

        resetUI: () => {
          set(defaultUIState, false, 'resetUI')
        },

        // ==================== 计算属性 ====================

        isPanelExpanded: panelId => {
          return get().expandedPanels.has(panelId)
        },

        getExpandedPanelCount: () => {
          return get().expandedPanels.size
        },

        isOrganizationSelected: org => {
          return get().selectedOrganizations.includes(org)
        },
      }),
      {
        name: 'ui-store',
        // 自定义序列化，因为Set不能直接序列化
        partialize: state => ({
          viewMode: state.viewMode,
          expandedPanels: Array.from(state.expandedPanels),
          selectedOrganizations: state.selectedOrganizations,
          sidebarExpanded: state.sidebarExpanded,
          filterPanelExpanded: state.filterPanelExpanded,
          tableConfig: state.tableConfig,
          chartConfig: state.chartConfig,
        }),
        // 自定义反序列化
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          ...(persistedState as any),
          expandedPanels: new Set(
            (persistedState as any)?.expandedPanels || []
          ),
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
)
