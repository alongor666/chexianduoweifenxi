/**
 * LocalStorage 工具类
 * 提供类型安全的本地存储功能,支持数据过期和大小限制
 */

import { logger } from '@/lib/logger'

const log = logger.create('LocalStorage')
const STORAGE_PREFIX = 'insurance_analytics_'
const MAX_STORAGE_SIZE = 500 * 1024 * 1024 // 提升到500MB支持大数据量存储

interface StorageItem<T> {
  value: T
  timestamp: number
  expiry?: number // 过期时间(毫秒)
}

/**
 * 存储键枚举
 */
export const StorageKeys = {
  RAW_DATA: `${STORAGE_PREFIX}raw_data`,
  FILTERS: `${STORAGE_PREFIX}filters`,
  USER_PREFERENCES: `${STORAGE_PREFIX}user_preferences`,
  LAST_UPLOAD_TIME: `${STORAGE_PREFIX}last_upload_time`,
} as const

/**
 * 检查 localStorage 是否可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 获取当前存储使用大小(估算)
 */
function getStorageSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key)
      total += (key.length + (value?.length || 0)) * 2 // UTF-16 字符占2字节
    }
  }
  return total
}

/**
 * 清理过期数据
 */
function clearExpiredData(): void {
  const now = Date.now()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          const item: StorageItem<unknown> = JSON.parse(value)
          if (item.expiry && now > item.timestamp + item.expiry) {
            keysToRemove.push(key)
          }
        }
      } catch {
        // 数据格式错误,也删除
        keysToRemove.push(key)
      }
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))

  if (keysToRemove.length > 0) {
    log.debug('清理过期项', { count: keysToRemove.length })
  }
}

/**
 * 设置存储项
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  expiryMs?: number
): { success: boolean; error?: string } {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'LocalStorage 不可用' }
  }

  try {
    // 清理过期数据
    clearExpiredData()

    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: expiryMs,
    }

    const serialized = JSON.stringify(item)
    const estimatedSize = serialized.length * 2

    // 检查大小限制
    const currentSize = getStorageSize()
    if (currentSize + estimatedSize > MAX_STORAGE_SIZE) {
      return { success: false, error: '存储空间不足,请清理部分数据' }
    }

    localStorage.setItem(key, serialized)
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      return { success: false, error: '存储配额已满' }
    }
    return { success: false, error: '存储失败' }
  }
}

/**
 * 获取存储项
 */
export function getStorageItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const value = localStorage.getItem(key)
    if (!value) return null

    const item: StorageItem<T> = JSON.parse(value)

    // 检查是否过期
    if (item.expiry && Date.now() > item.timestamp + item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch (e) {
    log.error('读取失败', { key, error: e })
    return null
  }
}

/**
 * 删除存储项
 */
export function removeStorageItem(key: string): void {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(key)
  }
}

/**
 * 清空所有应用存储
 */
export function clearAllStorage(): void {
  if (!isLocalStorageAvailable()) return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
  log.info('已清空存储项', { count: keysToRemove.length })
}

/**
 * 获取存储统计信息
 */
export function getStorageStats() {
  if (!isLocalStorageAvailable()) {
    return {
      available: false,
      size: 0,
      maxSize: MAX_STORAGE_SIZE,
      itemCount: 0,
      usage: 0,
    }
  }

  const size = getStorageSize()
  let itemCount = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      itemCount++
    }
  }

  return {
    available: true,
    size,
    maxSize: MAX_STORAGE_SIZE,
    itemCount,
    usage: (size / MAX_STORAGE_SIZE) * 100,
  }
}

/**
 * 压缩大数据
 * 对于大型数组,可以考虑只存储摘要或采样数据
 */
/**
 * 智能数据压缩函数 - 支持大数据量优化
 * 根据数据量自动选择压缩策略
 */
export function compressLargeData<T>(data: T[], maxItems: number = 50000): T[] {
  if (data.length <= maxItems) {
    return data
  }

  // 对于超大数据集，使用分层采样策略
  if (data.length > 100000) {
    // 保留前10%、中间10%、后10%的数据，其余均匀采样
    const tenPercent = Math.floor(data.length * 0.1)
    const frontPart = data.slice(0, tenPercent)
    const middleStart = Math.floor(data.length * 0.45)
    const middlePart = data.slice(middleStart, middleStart + tenPercent)
    const backPart = data.slice(-tenPercent)

    // 剩余空间用于均匀采样
    const remainingSlots =
      maxItems - frontPart.length - middlePart.length - backPart.length
    const samplingData = data
      .slice(tenPercent, middleStart)
      .concat(data.slice(middleStart + tenPercent, -tenPercent))

    const step = Math.ceil(samplingData.length / remainingSlots)
    const sampledData: T[] = []
    for (
      let i = 0;
      i < samplingData.length && sampledData.length < remainingSlots;
      i += step
    ) {
      sampledData.push(samplingData[i])
    }

    const compressed = [
      ...frontPart,
      ...sampledData,
      ...middlePart,
      ...backPart,
    ]
    log.warn('大数据集分层压缩', {
      original: data.length,
      compressed: compressed.length
    })
    return compressed
  }

  // 标准均匀采样
  const step = Math.ceil(data.length / maxItems)
  const compressed: T[] = []
  for (let i = 0; i < data.length; i += step) {
    compressed.push(data[i])
  }

  log.warn('数据已压缩', {
    original: data.length,
    compressed: compressed.length,
    samplingRate: step
  })
  return compressed
}

/**
 * 数据持久化 Hook 辅助
 * 在 Zustand store 中使用
 */
export const createPersistMiddleware = <T>(
  storageKey: string,
  expiryMs?: number
) => {
  return {
    getStorage: () => getStorageItem<T>(storageKey),
    setStorage: (value: T) => setStorageItem(storageKey, value, expiryMs),
    removeStorage: () => removeStorageItem(storageKey),
  }
}
