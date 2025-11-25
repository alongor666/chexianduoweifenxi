/**
 * 筛选条件预设管理 Hook
 * 支持保存、加载、删除常用的筛选条件组合
 */

import { useState, useEffect, useCallback } from 'react'
import type { FilterState } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('FilterPresets')

export interface FilterPreset {
  /**
   * 预设唯一ID
   */
  id: string

  /**
   * 预设名称
   */
  name: string

  /**
   * 预设描述
   */
  description?: string

  /**
   * 筛选条件
   */
  filters: FilterState

  /**
   * 创建时间
   */
  createdAt: string

  /**
   * 最后使用时间
   */
  lastUsedAt?: string

  /**
   * 使用次数
   */
  useCount: number
}

const STORAGE_KEY = 'insurance-analytics-filter-presets'

/**
 * 筛选预设管理 Hook
 */
export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 从 localStorage 加载预设
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPresets(parsed)
      }
    } catch (error) {
      log.error('加载筛选预设失败', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存预设到 localStorage
  const saveToStorage = useCallback((newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets))
    } catch (error) {
      log.error('保存筛选预设失败', error)
    }
  }, [])

  /**
   * 创建新预设
   */
  const createPreset = useCallback(
    (name: string, filters: FilterState, description?: string) => {
      const newPreset: FilterPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name,
        description,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
        useCount: 0,
      }

      const newPresets = [...presets, newPreset]
      setPresets(newPresets)
      saveToStorage(newPresets)

      return newPreset
    },
    [presets, saveToStorage]
  )

  /**
   * 更新预设
   */
  const updatePreset = useCallback(
    (
      id: string,
      updates: Partial<Pick<FilterPreset, 'name' | 'description' | 'filters'>>
    ) => {
      const newPresets = presets.map(preset =>
        preset.id === id ? { ...preset, ...updates } : preset
      )
      setPresets(newPresets)
      saveToStorage(newPresets)
    },
    [presets, saveToStorage]
  )

  /**
   * 删除预设
   */
  const deletePreset = useCallback(
    (id: string) => {
      const newPresets = presets.filter(preset => preset.id !== id)
      setPresets(newPresets)
      saveToStorage(newPresets)
    },
    [presets, saveToStorage]
  )

  /**
   * 应用预设（加载筛选条件）
   */
  const applyPreset = useCallback(
    (id: string) => {
      const preset = presets.find(p => p.id === id)
      if (!preset) {
        return null
      }

      // 更新使用统计
      const newPresets = presets.map(p =>
        p.id === id
          ? {
              ...p,
              lastUsedAt: new Date().toISOString(),
              useCount: p.useCount + 1,
            }
          : p
      )
      setPresets(newPresets)
      saveToStorage(newPresets)

      return preset.filters
    },
    [presets, saveToStorage]
  )

  /**
   * 获取单个预设
   */
  const getPreset = useCallback(
    (id: string) => {
      return presets.find(p => p.id === id)
    },
    [presets]
  )

  /**
   * 获取最常用的预设
   */
  const getMostUsedPresets = useCallback(
    (limit = 5) => {
      return [...presets]
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, limit)
    },
    [presets]
  )

  /**
   * 获取最近使用的预设
   */
  const getRecentPresets = useCallback(
    (limit = 5) => {
      return [...presets]
        .filter(p => p.lastUsedAt)
        .sort(
          (a, b) =>
            new Date(b.lastUsedAt!).getTime() -
            new Date(a.lastUsedAt!).getTime()
        )
        .slice(0, limit)
    },
    [presets]
  )

  /**
   * 清空所有预设
   */
  const clearAllPresets = useCallback(() => {
    setPresets([])
    saveToStorage([])
  }, [saveToStorage])

  /**
   * 导出预设（JSON格式）
   */
  const exportPresets = useCallback(() => {
    const dataStr = JSON.stringify(presets, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `filter-presets-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [presets])

  /**
   * 导入预设
   */
  const importPresets = useCallback(
    (presetsData: FilterPreset[], merge = true) => {
      const newPresets = merge ? [...presets, ...presetsData] : presetsData
      setPresets(newPresets)
      saveToStorage(newPresets)
    },
    [presets, saveToStorage]
  )

  return {
    // 状态
    presets,
    isLoading,

    // 基础操作
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    getPreset,

    // 便捷查询
    getMostUsedPresets,
    getRecentPresets,

    // 批量操作
    clearAllPresets,
    exportPresets,
    importPresets,
  }
}
