/**
 * 数据管理领域 Store
 * 专注于保险数据的存储和基本操作
 *
 * @responsibility 单一职责：只管理原始数据和加载状态
 * @migration 从 use-app-store.ts 拆分出数据管理部分
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { InsuranceRecord } from '@/types/insurance'
import { DataService } from '@/services/DataService'
import { persistenceService } from '@/services/PersistenceService'

interface DataStore {
  // ==================== 状态 ====================
  /**
   * 原始数据（已规范化）
   */
  rawData: InsuranceRecord[]

  /**
   * 加载状态
   */
  isLoading: boolean

  /**
   * 错误信息
   */
  error: Error | null

  /**
   * 上传进度（0-100）
   */
  uploadProgress: number

  // ==================== 操作方法 ====================

  /**
   * 设置数据（覆盖模式）
   * @param data 新数据
   * @param autoSave 是否自动保存到本地存储（默认：true）
   */
  setData: (data: InsuranceRecord[], autoSave?: boolean) => Promise<void>

  /**
   * 追加数据（合并模式，自动去重）
   * @param data 要追加的数据
   * @param autoSave 是否自动保存到本地存储（默认：true）
   */
  appendData: (data: InsuranceRecord[], autoSave?: boolean) => Promise<void>

  /**
   * 清空所有数据
   * @param clearStorage 是否同时清空本地存储（默认：true）
   */
  clearData: (clearStorage?: boolean) => Promise<void>

  /**
   * 从本地存储加载数据
   */
  loadFromStorage: () => Promise<void>

  /**
   * 保存到本地存储
   */
  saveToStorage: () => Promise<void>

  /**
   * 设置加载状态
   */
  setLoading: (loading: boolean) => void

  /**
   * 设置错误信息
   */
  setError: (error: Error | null) => void

  /**
   * 设置上传进度
   */
  setUploadProgress: (progress: number) => void

  // ==================== 计算属性（选择器）====================

  /**
   * 获取数据统计信息
   */
  getStats: () => {
    totalRecords: number
    totalPremium: number
    totalPolicyCount: number
    uniqueWeeks: number[]
    uniqueOrganizations: string[]
    dateRange: { min: string; max: string } | null
  }

  /**
   * 检查是否有数据
   */
  hasData: () => boolean
}

/**
 * 创建数据 Store
 */
export const useDataStore = create<DataStore>()(
  devtools(
    (set, get) => ({
      // ==================== 初始状态 ====================
      rawData: [],
      isLoading: false,
      error: null,
      uploadProgress: 0,

      // ==================== 操作方法 ====================

      setData: async (data, autoSave = true) => {
        try {
          // 规范化数据
          const normalizedData = DataService.normalize(data)

          set(
            {
              rawData: normalizedData,
              error: null,
            },
            false,
            'setData'
          )

          // 自动保存到本地存储
          if (autoSave) {
            await get().saveToStorage()
          }

          console.log(`[DataStore] 数据已设置，共 ${normalizedData.length} 条记录`)
        } catch (error) {
          const err = error instanceof Error ? error : new Error('设置数据失败')
          set({ error: err }, false, 'setData:error')
          throw err
        }
      },

      appendData: async (data, autoSave = true) => {
        try {
          const currentData = get().rawData
          const normalizedNewData = DataService.normalize(data)

          // 合并并去重
          const mergedData = DataService.merge(currentData, normalizedNewData)

          set(
            {
              rawData: mergedData,
              error: null,
            },
            false,
            'appendData'
          )

          // 自动保存到本地存储
          if (autoSave) {
            await get().saveToStorage()
          }

          console.log(
            `[DataStore] 数据已追加，原有 ${currentData.length} 条，新增 ${normalizedNewData.length} 条，去重后共 ${mergedData.length} 条`
          )
        } catch (error) {
          const err = error instanceof Error ? error : new Error('追加数据失败')
          set({ error: err }, false, 'appendData:error')
          throw err
        }
      },

      clearData: async (clearStorage = true) => {
        set(
          {
            rawData: [],
            error: null,
          },
          false,
          'clearData'
        )

        if (clearStorage) {
          await persistenceService.clearAll()
        }

        console.log('[DataStore] 数据已清空')
      },

      loadFromStorage: async () => {
        try {
          set({ isLoading: true }, false, 'loadFromStorage:start')

          const data = await persistenceService.loadRawData()

          if (data && data.length > 0) {
            // 不自动保存，因为数据本来就是从存储加载的
            await get().setData(data, false)
            console.log('[DataStore] 从本地存储加载数据成功')
          } else {
            console.log('[DataStore] 本地存储中没有数据')
          }
        } catch (error) {
          const err =
            error instanceof Error ? error : new Error('从本地存储加载数据失败')
          set({ error: err }, false, 'loadFromStorage:error')
          console.error('[DataStore] 加载数据失败:', error)
        } finally {
          set({ isLoading: false }, false, 'loadFromStorage:end')
        }
      },

      saveToStorage: async () => {
        try {
          const { rawData } = get()
          await persistenceService.saveRawData(rawData)
          console.log('[DataStore] 数据已保存到本地存储')
        } catch (error) {
          console.error('[DataStore] 保存数据到本地存储失败:', error)
          throw error
        }
      },

      setLoading: loading => {
        set({ isLoading: loading }, false, 'setLoading')
      },

      setError: error => {
        set({ error, isLoading: false }, false, 'setError')
      },

      setUploadProgress: progress => {
        set({ uploadProgress: progress }, false, 'setUploadProgress')
      },

      // ==================== 计算属性 ====================

      getStats: () => {
        const { rawData } = get()
        return DataService.getStatistics(rawData)
      },

      hasData: () => {
        return get().rawData.length > 0
      },
    }),
    {
      name: 'data-store',
    }
  )
)
