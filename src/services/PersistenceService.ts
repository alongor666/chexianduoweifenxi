/**
 * 数据持久化服务
 * 统一管理应用数据的持久化操作，替代散落在各处的 localStorage 调用
 *
 * @architecture
 * - 使用适配器模式，方便未来切换存储方案
 * - 提供类型安全的数据存取
 * - 支持数据版本管理和迁移
 *
 * @migration
 * 替代原有的 3 处持久化实现：
 * 1. src/lib/storage/data-persistence.ts
 * 2. src/store/use-app-store.ts (行 637-690)
 * 3. src/hooks/use-persist-data.ts
 */

import type { InsuranceRecord } from '@/types/insurance'
import type { IPersistenceAdapter } from './interfaces/IPersistenceAdapter'
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import type { BatchUploadResult } from '@/hooks/use-file-upload'
import { logger } from '@/lib/logger'

const log = logger.create('PersistenceService')

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
  RAW_DATA: 'raw_data',
  STORAGE_INFO: 'storage_info',
  UPLOAD_HISTORY: 'upload_history',
  PREMIUM_TARGETS: 'premium_targets',
  FILTER_STATE: 'filter_state',
  UI_STATE: 'ui_state',
} as const

/**
 * 数据存储信息
 */
export interface DataStorageInfo {
  lastUpdated: string
  totalRecords: number
  dataHash: string
  version: string // 数据版本号，用于未来迁移
}

/**
 * 上传历史记录
 */
export interface UploadHistoryRecord {
  id: string
  timestamp: string
  files: {
    name: string
    size: number
    hash: string
    recordCount: number
    validRecords: number
    invalidRecords: number
  }[]
  totalRecords: number
  validRecords: number
  invalidRecords: number
  status: 'success' | 'partial' | 'failed'
  error?: string
}

/**
 * 持久化服务类
 */
export class PersistenceService {
  private adapter: IPersistenceAdapter
  private readonly version = '1.0.0' // 当前数据版本

  constructor(adapter?: IPersistenceAdapter) {
    // 默认使用 LocalStorage，但可以注入其他适配器（如 IndexedDB）
    this.adapter = adapter || new LocalStorageAdapter('insuralytics')
  }

  // ==================== 原始数据管理 ====================

  /**
   * 保存原始数据
   */
  async saveRawData(data: InsuranceRecord[]): Promise<void> {
    try {
      const dataHash = this.calculateDataHash(data)
      const storageInfo: DataStorageInfo = {
        lastUpdated: new Date().toISOString(),
        totalRecords: data.length,
        dataHash,
        version: this.version,
      }

      await this.adapter.save(STORAGE_KEYS.RAW_DATA, data)
      await this.adapter.save(STORAGE_KEYS.STORAGE_INFO, storageInfo)

      log.info('数据已保存', { recordCount: data.length, dataHash })
    } catch (error) {
      log.error('保存数据失败', error)
      throw error
    }
  }

  /**
   * 加载原始数据
   */
  async loadRawData(): Promise<InsuranceRecord[] | null> {
    try {
      const data = await this.adapter.load<InsuranceRecord[]>(STORAGE_KEYS.RAW_DATA)

      if (data) {
        log.info('加载数据成功', { recordCount: data.length })
      }

      return data
    } catch (error) {
      log.error('加载数据失败', error)
      return null
    }
  }

  /**
   * 获取存储信息
   */
  async getStorageInfo(): Promise<DataStorageInfo | null> {
    return await this.adapter.load<DataStorageInfo>(STORAGE_KEYS.STORAGE_INFO)
  }

  // ==================== 上传历史管理 ====================

  /**
   * 添加上传历史记录
   */
  async addUploadHistory(
    batchResult: BatchUploadResult,
    files: File[]
  ): Promise<void> {
    try {
      const history = await this.getUploadHistory()

      // 计算文件哈希
      const fileInfos = await Promise.all(
        files.map(async (file, index) => {
          const result = batchResult.results[index]
          const hash = await this.calculateFileHash(file)

          return {
            name: file.name,
            size: file.size,
            hash,
            recordCount: result?.result?.stats.totalRows || 0,
            validRecords: result?.result?.stats.validRows || 0,
            invalidRecords: result?.result?.stats.invalidRows || 0,
          }
        })
      )

      const record: UploadHistoryRecord = {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        files: fileInfos,
        totalRecords: batchResult.totalRecords,
        validRecords: batchResult.validRecords,
        invalidRecords: batchResult.invalidRecords,
        status:
          batchResult.failureCount === 0
            ? 'success'
            : batchResult.successCount > 0
              ? 'partial'
              : 'failed',
      }

      history.unshift(record) // 最新的记录在前面

      // 只保留最近50条记录
      if (history.length > 50) {
        history.splice(50)
      }

      await this.adapter.save(STORAGE_KEYS.UPLOAD_HISTORY, history)
      log.info('已添加上传历史记录', { recordId: record.id })
    } catch (error) {
      log.error('添加上传历史失败', error)
    }
  }

  /**
   * 获取上传历史
   */
  async getUploadHistory(): Promise<UploadHistoryRecord[]> {
    const history = await this.adapter.load<UploadHistoryRecord[]>(
      STORAGE_KEYS.UPLOAD_HISTORY
    )
    return history || []
  }

  /**
   * 检查文件是否已上传过
   */
  async checkFileExists(file: File): Promise<{
    exists: boolean
    uploadRecord?: UploadHistoryRecord
    fileInfo?: UploadHistoryRecord['files'][0]
  }> {
    try {
      const fileHash = await this.calculateFileHash(file)
      const history = await this.getUploadHistory()

      for (const record of history) {
        const fileInfo = record.files.find(
          f => f.hash === fileHash && f.name === file.name
        )
        if (fileInfo) {
          return {
            exists: true,
            uploadRecord: record,
            fileInfo,
          }
        }
      }

      return { exists: false }
    } catch (error) {
      log.error('检查文件是否存在失败', error)
      return { exists: false }
    }
  }

  // ==================== 通用数据管理 ====================

  /**
   * 保存保费目标
   */
  async savePremiumTargets(targets: any): Promise<void> {
    await this.adapter.save(STORAGE_KEYS.PREMIUM_TARGETS, targets)
  }

  /**
   * 加载保费目标
   */
  async loadPremiumTargets<T>(): Promise<T | null> {
    return await this.adapter.load<T>(STORAGE_KEYS.PREMIUM_TARGETS)
  }

  /**
   * 保存筛选状态
   */
  async saveFilterState(filters: any): Promise<void> {
    await this.adapter.save(STORAGE_KEYS.FILTER_STATE, filters)
  }

  /**
   * 加载筛选状态
   */
  async loadFilterState<T>(): Promise<T | null> {
    return await this.adapter.load<T>(STORAGE_KEYS.FILTER_STATE)
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await this.adapter.clear()
    log.info('已清空所有存储数据')
  }

  /**
   * 获取存储统计信息
   */
  async getStats() {
    const stats = await this.adapter.getStats()
    const info = await this.getStorageInfo()

    return {
      ...stats,
      hasData: info !== null && info.totalRecords > 0,
      totalRecords: info?.totalRecords || 0,
      lastUpdated: info?.lastUpdated || null,
      uploadCount: (await this.getUploadHistory()).length,
    }
  }

  // ==================== 私有工具方法 ====================

  /**
   * 计算数据哈希值（简单实现）
   */
  private calculateDataHash(data: InsuranceRecord[]): string {
    const content = JSON.stringify(
      data.map(r => ({
        week: r.week_number,
        year: r.policy_start_year,
        organization: r.third_level_organization,
        premium: r.signed_premium_yuan,
        policy_count: r.policy_count,
      }))
    )

    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 计算文件哈希值
   */
  private calculateFileHash(file: File): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        let hash = 0
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash
        }
        resolve(Math.abs(hash).toString(36))
      }
      reader.readAsText(file)
    })
  }
}

// ==================== 单例导出 ====================

/**
 * 默认持久化服务实例（单例模式）
 * 可以在整个应用中共享使用
 */
export const persistenceService = new PersistenceService()
