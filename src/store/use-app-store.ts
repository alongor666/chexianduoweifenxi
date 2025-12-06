/**
 * 应用全局状态管理
 * 使用 Zustand 实现
 */

import { create } from 'zustand'
import { useMemo } from 'react'
import { devtools } from 'zustand/middleware'
import type {
  InsuranceRecord,
  FilterState,
  HierarchicalFilterState,
  KPIResult,
  PremiumTargets,
  DimensionTargetMap,
  TargetVersionSnapshot,
} from '@/types/insurance'
import { TARGET_DIMENSIONS } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { getBusinessTypeCode } from '@/constants/dimensions'
import {
  saveDataToStorage,
  loadDataFromStorage,
  clearStoredData,
  getDataStats,
  checkFileExists,
  addUploadHistory,
  getUploadHistory,
} from '@/lib/storage/data-persistence'
// 导入新架构的 Store 以实现数据同步
import { useDataStore } from '@/store/domains/dataStore'

const PREMIUM_TARGET_STORAGE_KEY = 'insurDashPremiumTargets'

function createEmptyDimensionTargets(): DimensionTargetMap {
  return TARGET_DIMENSIONS.reduce((acc, key) => {
    acc[key] = {
      entries: {},
      updatedAt: null,
      versions: [],
    }
    return acc
  }, {} as DimensionTargetMap)
}

const defaultPremiumTargets: PremiumTargets = {
  year: new Date().getFullYear(),
  overall: 0,
  byBusinessType: {},
  dimensions: createEmptyDimensionTargets(),
  updatedAt: null,
}

function normalizeTargetValue(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return 0
  return Math.round(numeric)
}

function normalizeTargetEntries(
  entries?: Record<string, number>
): Record<string, number> {
  if (!entries || typeof entries !== 'object') return {}
  const normalized: Record<string, number> = {}
  Object.entries(entries).forEach(([rawKey, rawValue]) => {
    const key = normalizeChineseText(rawKey)
    if (!key) return
    normalized[key] = normalizeTargetValue(rawValue)
  })
  return normalized
}

function normalizeVersionSnapshots(
  versions: TargetVersionSnapshot[] | undefined
): TargetVersionSnapshot[] {
  if (!Array.isArray(versions)) return []
  const sanitized = versions
    .map(version => {
      if (!version) return null
      const id =
        version.id ||
        `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return {
        id,
        label: version.label || id,
        createdAt: version.createdAt || new Date().toISOString(),
        overall: normalizeTargetValue(version.overall),
        entries: normalizeTargetEntries(version.entries),
        ...(version.note !== undefined && { note: version.note }),
      } as TargetVersionSnapshot
    })
    .filter((snapshot): snapshot is TargetVersionSnapshot => snapshot !== null)
  return sanitized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function upgradePremiumTargets(raw?: Partial<PremiumTargets>): PremiumTargets {
  if (!raw) {
    return { ...defaultPremiumTargets, year: new Date().getFullYear() }
  }

  const year = raw.year || new Date().getFullYear()
  const overall = normalizeTargetValue(raw.overall)
  const baseUpdatedAt = raw.updatedAt ?? null

  const normalizedDimensions: DimensionTargetMap = createEmptyDimensionTargets()

  const legacyBusinessEntries = normalizeTargetEntries(raw.byBusinessType)
  TARGET_DIMENSIONS.forEach(dimensionKey => {
    const rawDimension = raw.dimensions?.[dimensionKey]
    const entries = (() => {
      if (dimensionKey === 'businessType') {
        if (Object.keys(legacyBusinessEntries).length > 0) {
          return legacyBusinessEntries
        }
      }
      return normalizeTargetEntries(rawDimension?.entries)
    })()

    normalizedDimensions[dimensionKey] = {
      entries,
      updatedAt:
        rawDimension?.updatedAt ??
        (dimensionKey === 'businessType'
          ? baseUpdatedAt
          : (rawDimension?.updatedAt ?? null)),
      versions: normalizeVersionSnapshots(rawDimension?.versions),
    }
  })

  return {
    year,
    overall,
    byBusinessType: normalizedDimensions.businessType.entries,
    dimensions: normalizedDimensions,
    updatedAt: baseUpdatedAt,
  }
}

function loadPremiumTargetsFromStorage(): PremiumTargets {
  if (typeof window === 'undefined') {
    return defaultPremiumTargets
  }

  try {
    const stored = window.localStorage.getItem(PREMIUM_TARGET_STORAGE_KEY)
    if (!stored) {
      return defaultPremiumTargets
    }
    const parsed = JSON.parse(stored) as Partial<PremiumTargets>
    return upgradePremiumTargets(parsed)
  } catch (error) {
    console.warn('[useAppStore] 读取保费目标数据失败，已回退默认值', error)
    return defaultPremiumTargets
  }
}

/**
 * 应用状态接口
 */
interface AppState {
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
  checkFileForDuplicates: (file: File) => Promise<{ exists: boolean; uploadRecord?: any; fileInfo?: any }>
  addToUploadHistory: (batchResult: any, files: File[]) => Promise<void>
  getUploadHistoryRecords: () => any[]

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
 * 创建应用状态 Store
 */
export const useAppStore = create<AppState>()(
  // @ts-ignore Zustand devtools middleware 类型推断问题
  devtools(
    set => ({
      // ============= 数据状态 =============
      rawData: [],
      isLoading: false,
      error: null,
      uploadProgress: 0,
      filters: defaultFilters,
      computedKPIs: new Map(),
      viewMode: 'single',
      expandedPanels: new Set(),
      selectedOrganizations: [],
      premiumTargets: loadPremiumTargetsFromStorage(),

      // ============= 数据操作 =============
      setRawData: data =>
        set(
          state => {
            // 进入 Store 前做一遍中文文本规范化，避免后续对比出现乱码
            const normalizedData = data.map(r => ({
              ...r,
              customer_category_3: normalizeChineseText(r.customer_category_3),
              business_type_category: normalizeChineseText(
                r.business_type_category
              ),
              third_level_organization: normalizeChineseText(
                r.third_level_organization
              ),
              terminal_source: normalizeChineseText(r.terminal_source),
            }))

            // 同步数据到新架构的 DataStore（使用 setData 方法，不自动保存避免重复）
            useDataStore.getState().setData(normalizedData, false).catch(err => {
              console.error('[AppStore] 同步数据到 DataStore 失败:', err)
            })

            // 自动初始化筛选条件：设置最新周次为默认选中周次
            const weekNumbers = Array.from(
              new Set(normalizedData.map(r => r.week_number))
            ).sort((a, b) => b - a) // 降序排列

            const latestWeek = weekNumbers.length > 0 ? weekNumbers[0] : null

            console.log(
              `[AppStore] 数据已加载，可用周次: [${weekNumbers.join(', ')}]，自动选中最新周次: ${latestWeek}`
            )

            return {
              rawData: normalizedData,
              error: null,
              // 自动初始化筛选器：选中最新周次
              filters: {
                ...state.filters,
                singleModeWeek: latestWeek,
                weeks: latestWeek ? [latestWeek] : [],
              },
            }
          },
          false,
          'setRawData'
        ),

      appendRawData: data =>
        set(
          state => {
            // 规范化新数据
            const normalizedNewData = data.map(r => ({
              ...r,
              customer_category_3: normalizeChineseText(r.customer_category_3),
              business_type_category: normalizeChineseText(
                r.business_type_category
              ),
              third_level_organization: normalizeChineseText(
                r.third_level_organization
              ),
              terminal_source: normalizeChineseText(r.terminal_source),
            }))

            // 创建已有数据的唯一键集合（使用多个字段组合作为唯一标识）
            // 使用：快照日期+周次+年份+机构+客户类型+险种+业务类型
            const existingKeys = new Set(
              state.rawData.map(
                r =>
                  `${r.snapshot_date}_${r.week_number}_${r.policy_start_year}_${r.third_level_organization}_${r.customer_category_3}_${r.insurance_type}_${r.business_type_category}`
              )
            )

            // 过滤出新数据（去重）
            const uniqueNewData = normalizedNewData.filter(
              r =>
                !existingKeys.has(
                  `${r.snapshot_date}_${r.week_number}_${r.policy_start_year}_${r.third_level_organization}_${r.customer_category_3}_${r.insurance_type}_${r.business_type_category}`
                )
            )

            console.log(
              `[AppendData] 原有数据: ${state.rawData.length} 条, 新数据: ${data.length} 条, 去重后: ${uniqueNewData.length} 条`
            )

            const mergedData = [...state.rawData, ...uniqueNewData]

            // 同步数据到新架构的 DataStore（追加模式，不自动保存避免重复）
            useDataStore.getState().appendData(uniqueNewData, false).catch(err => {
              console.error('[AppStore] 同步追加数据到 DataStore 失败:', err)
            })

            // 更新周次筛选：如果有新周次，自动选中最新周次
            const weekNumbers = Array.from(
              new Set(mergedData.map(r => r.week_number))
            ).sort((a, b) => b - a) // 降序排列

            const latestWeek = weekNumbers.length > 0 ? weekNumbers[0] : null

            // 检查是否有新周次加入
            const oldWeekNumbers = Array.from(
              new Set(state.rawData.map(r => r.week_number))
            )
            const hasNewWeeks = weekNumbers.length > oldWeekNumbers.length

            if (hasNewWeeks) {
              console.log(
                `[AppendData] 检测到新周次，可用周次: [${weekNumbers.join(', ')}]，自动选中最新周次: ${latestWeek}`
              )
            }

            return {
              rawData: mergedData,
              error: null,
              // 如果有新周次，自动更新筛选器
              filters: hasNewWeeks
                ? {
                    ...state.filters,
                    singleModeWeek: latestWeek,
                    weeks: latestWeek ? [latestWeek] : [],
                  }
                : state.filters,
            }
          },
          false,
          'appendRawData'
        ),

      clearData: () => {
        // 同步清除新架构的 DataStore
        useDataStore.getState().clearData()

        set(
          {
            rawData: [],
            computedKPIs: new Map(),
            error: null,
          },
          false,
          'clearData'
        )
      },

      setLoading: loading =>
        set(
          {
            isLoading: loading,
          },
          false,
          'setLoading'
        ),

      setError: error =>
        set(
          {
            error,
            isLoading: false,
          },
          false,
          'setError'
        ),

      setUploadProgress: progress =>
        set(
          {
            uploadProgress: progress,
          },
          false,
          'setUploadProgress'
        ),

      // ============= 筛选操作 =============
      updateFilters: newFilters =>
        set(
          state => ({
            filters: {
              ...state.filters,
              // 将输入的筛选值也做一次规范化，保证比较一致性
              ...newFilters,
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
            // 筛选条件变化时清除缓存
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

      setViewMode: mode =>
        set(
          state => ({
            viewMode: mode,
            filters: (() => {
              const currentFilters = state.filters
              if (mode === 'single') {
                const selectedWeek =
                  currentFilters.singleModeWeek ??
                  (currentFilters.weeks.length > 0
                    ? currentFilters.weeks[currentFilters.weeks.length - 1]
                    : null)
                return {
                  ...currentFilters,
                  viewMode: mode,
                  singleModeWeek: selectedWeek,
                  weeks: selectedWeek != null ? [selectedWeek] : [],
                }
              }

              const trendWeeks =
                currentFilters.trendModeWeeks.length > 0
                  ? [...currentFilters.trendModeWeeks]
                  : [...currentFilters.weeks]
              return {
                ...currentFilters,
                viewMode: mode,
                trendModeWeeks: trendWeeks,
                weeks: trendWeeks,
              }
            })(),
          }),
          false,
          'setViewMode'
        ),

      // ============= 目标管理 =============
      setPremiumTargets: targets =>
        set(
          () => {
            const timestamp = targets.updatedAt ?? new Date().toISOString()
            const year = targets.year || new Date().getFullYear()
            const overall = normalizeTargetValue(targets.overall)

            const normalizedDimensions: DimensionTargetMap =
              createEmptyDimensionTargets()
            TARGET_DIMENSIONS.forEach(dimensionKey => {
              const incomingDimension = targets.dimensions?.[dimensionKey]
              const fallbackEntries =
                dimensionKey === 'businessType'
                  ? targets.byBusinessType
                  : undefined

              const entries = normalizeTargetEntries(
                incomingDimension?.entries ?? fallbackEntries
              )

              const hasMeaningfulPayload =
                incomingDimension?.entries !== undefined ||
                (dimensionKey === 'businessType' &&
                  Object.keys(entries).length > 0)

              normalizedDimensions[dimensionKey] = {
                entries,
                updatedAt:
                  incomingDimension?.updatedAt ??
                  (hasMeaningfulPayload ? timestamp : null),
                versions: normalizeVersionSnapshots(
                  incomingDimension?.versions
                ),
              }
            })

            const nextTargets: PremiumTargets = {
              year,
              overall,
              byBusinessType: normalizedDimensions.businessType.entries,
              dimensions: normalizedDimensions,
              updatedAt: timestamp,
            }

            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                PREMIUM_TARGET_STORAGE_KEY,
                JSON.stringify(nextTargets)
              )
            }

            return {
              premiumTargets: nextTargets,
            }
          },
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
        await saveDataToStorage(state.rawData)
      },

      loadDataFromPersistentStorage: () => {
        const data = loadDataFromStorage()
        if (data) {
          set(
            {
              rawData: data.map(r => ({
                ...r,
                customer_category_3: normalizeChineseText(r.customer_category_3),
                business_type_category: normalizeChineseText(
                  r.business_type_category
                ),
                third_level_organization: normalizeChineseText(
                  r.third_level_organization
                ),
                terminal_source: normalizeChineseText(r.terminal_source),
              })),
              error: null,
            },
            false,
            'loadDataFromPersistentStorage'
          )
        }
      },

      clearPersistentData: () => {
        clearStoredData()
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

      getStorageStats: () => getDataStats(),

      checkFileForDuplicates: async (file: File) => {
        return await checkFileExists(file)
      },

      addToUploadHistory: async (batchResult: any, files: File[]) => {
        await addUploadHistory(batchResult, files)
      },

      getUploadHistoryRecords: () => getUploadHistory(),
    }),
    {
      name: 'insurance-analytics-store',
    }
  )
)

/**
 * 选择器：获取过滤后的数据
 */
export const useFilteredData = () => {
  const rawData = useAppStore(state => state.rawData)
  // 使用细粒度选择器避免对象引用问题
  const years = useAppStore(state => state.filters.years)
  const weeks = useAppStore(state => state.filters.weeks)
  const organizations = useAppStore(state => state.filters.organizations)
  const insuranceTypes = useAppStore(state => state.filters.insuranceTypes)
  const businessTypes = useAppStore(state => state.filters.businessTypes)
  const coverageTypes = useAppStore(state => state.filters.coverageTypes)
  const customerCategories = useAppStore(state => state.filters.customerCategories)
  const vehicleGrades = useAppStore(state => state.filters.vehicleGrades)
  const terminalSources = useAppStore(state => state.filters.terminalSources)
  const isNewEnergy = useAppStore(state => state.filters.isNewEnergy)
  const renewalStatuses = useAppStore(state => state.filters.renewalStatuses)

  // 应用筛选逻辑（memo 化，避免不必要重算）
  return useMemo(
    () =>
      rawData.filter(record => {
        const filters = {
          years,
          weeks,
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
        // 时间筛选
        if (
          filters.years.length > 0 &&
          !filters.years.includes(record.policy_start_year)
        ) {
          return false
        }

        if (
          filters.weeks.length > 0 &&
          !filters.weeks.includes(record.week_number)
        ) {
          return false
        }

        // 空间筛选
        if (
          filters.organizations.length > 0 &&
          !filters.organizations.includes(
            normalizeChineseText(record.third_level_organization)
          )
        ) {
          return false
        }

        // 产品筛选
        if (
          filters.insuranceTypes.length > 0 &&
          !filters.insuranceTypes.includes(record.insurance_type)
        ) {
          return false
        }

        if (filters.businessTypes.length > 0) {
          const code = getBusinessTypeCode(record.business_type_category)
          if (!filters.businessTypes.includes(code)) {
            return false
          }
        }

        if (
          filters.coverageTypes.length > 0 &&
          !filters.coverageTypes.includes(record.coverage_type)
        ) {
          return false
        }

        // 客户筛选
        if (
          filters.customerCategories.length > 0 &&
          !filters.customerCategories.includes(
            normalizeChineseText(record.customer_category_3)
          )
        ) {
          return false
        }

        if (filters.vehicleGrades.length > 0) {
          // 如果记录有车险评级，则检查是否在过滤器范围内
          // 如果记录没有车险评级（空值），则不过滤（允许显示）
          if (
            record.vehicle_insurance_grade &&
            !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
          ) {
            return false
          }
        }

        // 渠道筛选
        if (
          filters.terminalSources.length > 0 &&
          !filters.terminalSources.includes(
            normalizeChineseText(record.terminal_source)
          )
        ) {
          return false
        }

        if (filters.isNewEnergy !== null) {
          if (record.is_new_energy_vehicle !== filters.isNewEnergy) {
            return false
          }
        }

        if (
          filters.renewalStatuses.length > 0 &&
          !filters.renewalStatuses.includes(record.renewal_status)
        ) {
          return false
        }

        return true
      }),
    [
      rawData,
      years,
      weeks,
      organizations,
      insuranceTypes,
      businessTypes,
      coverageTypes,
      customerCategories,
      vehicleGrades,
      terminalSources,
      isNewEnergy,
      renewalStatuses,
    ]
  )
}

/**
 * 通用筛选函数：根据当前筛选条件过滤数据，支持排除某些筛选键（用于筛选器联动选项计算）
 */
export function filterRecordsWithExclusions(
  rawData: InsuranceRecord[],
  filters: FilterState,
  excludeKeys: Array<keyof FilterState> = []
) {
  const excluded = new Set<keyof FilterState>(excludeKeys)

  return rawData.filter(record => {
    // 时间筛选
    if (!excluded.has('years')) {
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
      }
    }

    if (!excluded.has('weeks')) {
      if (
        filters.weeks.length > 0 &&
        !filters.weeks.includes(record.week_number)
      ) {
        return false
      }
    }

    // 空间筛选
    if (!excluded.has('organizations')) {
      if (
        filters.organizations.length > 0 &&
        !filters.organizations.includes(
          normalizeChineseText(record.third_level_organization)
        )
      ) {
        return false
      }
    }

    // 产品筛选
    if (!excluded.has('insuranceTypes')) {
      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(record.insurance_type)
      ) {
        return false
      }
    }

    if (!excluded.has('businessTypes')) {
      if (filters.businessTypes.length > 0) {
        const code = getBusinessTypeCode(record.business_type_category)
        if (!filters.businessTypes.includes(code)) {
          return false
        }
      }
    }

    if (!excluded.has('coverageTypes')) {
      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(record.coverage_type)
      ) {
        return false
      }
    }

    // 客户筛选
    if (!excluded.has('customerCategories')) {
      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(
          normalizeChineseText(record.customer_category_3)
        )
      ) {
        return false
      }
    }

    if (!excluded.has('vehicleGrades')) {
      if (filters.vehicleGrades.length > 0) {
        // 如果记录有车险评级，则检查是否在过滤器范围内
        // 如果记录没有车险评级（空值），则不过滤（允许显示）
        if (
          record.vehicle_insurance_grade &&
          !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
        ) {
          return false
        }
      }
    }

    // 渠道筛选
    if (!excluded.has('terminalSources')) {
      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(
          normalizeChineseText(record.terminal_source)
        )
      ) {
        return false
      }
    }

    if (!excluded.has('isNewEnergy')) {
      if (filters.isNewEnergy !== null) {
        if (record.is_new_energy_vehicle !== filters.isNewEnergy) {
          return false
        }
      }
    }

    if (!excluded.has('renewalStatuses')) {
      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(record.renewal_status)
      ) {
        return false
      }
    }

    return true
  })
}

/**
 * 选择器：获取数据统计信息
 */
export const useDataStats = () => {
  const rawData = useAppStore(state => state.rawData)
  const filteredData = useFilteredData()

  return {
    totalRecords: rawData.length,
    filteredRecords: filteredData.length,
    filterPercentage:
      rawData.length > 0
        ? ((filteredData.length / rawData.length) * 100).toFixed(1)
        : '0',
  }
}
