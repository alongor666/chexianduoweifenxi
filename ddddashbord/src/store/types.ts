/**
 * Store 类型定义
 */

import type {
  InsuranceRecord,
  FilterState,
  HierarchicalFilterState,
  KPIResult,
  PremiumTargets,
} from '@/types/insurance'
import {
  getDataStats,
  UploadHistoryRecord,
} from '@/lib/storage/data-persistence'
import type { BatchUploadResult } from '@/hooks/use-file-upload'

/**
 * 应用状态接口
 */
export interface AppState {
  // ============= 数据状态 =============
  rawData: InsuranceRecord[]
  isLoading: boolean
  error: Error | null
  uploadProgress: number

  // ============= 筛选状态 =============
  filters: FilterState // 向后兼容的扁平筛选状态
  hierarchicalFilters: HierarchicalFilterState // 新增：分层筛选状态

  // ============= 计算缓存 =============
  computedKPIs: Map<string, KPIResult>

  // ============= UI 状态 =============
  viewMode: 'single' | 'trend'
  expandedPanels: Set<string>
  selectedOrganizations: string[]

  // ============= 目标管理 =============
  premiumTargets: PremiumTargets

  // ============= 操作方法 =============

  // 数据操作
  setRawData: (data: InsuranceRecord[]) => void
  appendRawData: (data: InsuranceRecord[]) => void // 新增：追加数据（支持多次上传）
  clearData: () => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  setUploadProgress: (progress: number) => void

  // 数据持久化操作
  saveDataToPersistentStorage: () => Promise<void>
  loadDataFromPersistentStorage: () => void
  clearPersistentData: () => void
  getStorageStats: () => ReturnType<typeof getDataStats>
  checkFileForDuplicates: (file: File) => Promise<{
    exists: boolean
    uploadRecord?: UploadHistoryRecord
    fileInfo?: UploadHistoryRecord['files'][0]
  }>
  addToUploadHistory: (
    batchResult: BatchUploadResult,
    files: File[]
  ) => Promise<void>
  getUploadHistoryRecords: () => UploadHistoryRecord[]

  // 筛选操作（向后兼容）
  updateFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  setViewMode: (mode: 'single' | 'trend') => void

  // 新增：分层筛选操作
  updateGlobalFilters: (filters: Partial<FilterState>) => void
  updateTabFilters: (
    tab: HierarchicalFilterState['activeTab'],
    filters: Partial<FilterState>
  ) => void
  setActiveTab: (tab: HierarchicalFilterState['activeTab']) => void
  getMergedFilters: () => FilterState // 合并全局和当前Tab筛选
  resetGlobalFilters: () => void
  resetTabFilters: (tab?: HierarchicalFilterState['activeTab']) => void

  // 目标管理
  setPremiumTargets: (targets: PremiumTargets) => void
  loadPremiumTargets: () => void

  // 缓存操作
  setKPICache: (key: string, result: KPIResult) => void
  clearKPICache: () => void
  getKPICache: (key: string) => KPIResult | undefined

  // UI 状态操作
  togglePanel: (panelId: string) => void
  setSelectedOrganizations: (orgs: string[]) => void
}

/**
 * 默认筛选器状态
 */
export const defaultFilters: FilterState = {
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
