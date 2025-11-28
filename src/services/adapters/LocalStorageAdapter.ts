/**
 * LocalStorage 持久化适配器
 * 实现 IPersistenceAdapter 接口，提供基于浏览器 LocalStorage 的数据持久化
 *
 * @features
 * - 自动 JSON 序列化/反序列化
 * - 存储容量检测和错误处理
 * - 数据完整性校验
 */

import {
  IPersistenceAdapter,
  PersistenceError,
} from '../interfaces/IPersistenceAdapter'

export class LocalStorageAdapter implements IPersistenceAdapter {
  private readonly prefix: string

  constructor(prefix = 'insuralytics') {
    this.prefix = prefix
  }

  /**
   * 生成完整的存储键名
   */
  private getFullKey(key: string): string {
    return `${this.prefix}_${key}`
  }

  /**
   * 保存数据到 LocalStorage
   */
  async save<T>(key: string, data: T): Promise<void> {
    const fullKey = this.getFullKey(key)

    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(fullKey, serialized)

      console.log(`[LocalStorage] 已保存数据: ${key} (${this.formatSize(serialized.length)})`)
    } catch (error) {
      if (error instanceof Error) {
        // 检查是否是存储空间不足
        if (error.name === 'QuotaExceededError') {
          throw new PersistenceError(
            `存储空间不足，无法保存数据: ${key}`,
            'QUOTA_EXCEEDED',
            error
          )
        }

        // 序列化错误（可能包含循环引用或不可序列化的对象）
        if (error.message.includes('circular') || error.message.includes('serialize')) {
          throw new PersistenceError(
            `数据序列化失败: ${key}`,
            'SERIALIZATION_ERROR',
            error
          )
        }
      }

      throw new PersistenceError(
        `保存数据失败: ${key}`,
        'UNKNOWN',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 从 LocalStorage 加载数据
   */
  async load<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key)

    try {
      const serialized = localStorage.getItem(fullKey)
      if (serialized === null) {
        return null
      }

      const data = JSON.parse(serialized) as T
      console.log(`[LocalStorage] 已加载数据: ${key}`)
      return data
    } catch (error) {
      console.error(`[LocalStorage] 加载数据失败: ${key}`, error)
      // 数据损坏时返回 null 而不是抛出异常，让调用方决定如何处理
      return null
    }
  }

  /**
   * 删除指定数据
   */
  async remove(key: string): Promise<void> {
    const fullKey = this.getFullKey(key)
    localStorage.removeItem(fullKey)
    console.log(`[LocalStorage] 已删除数据: ${key}`)
  }

  /**
   * 清空所有带前缀的数据
   */
  async clear(): Promise<void> {
    const keysToRemove: string[] = []

    // 遍历所有键，找出带前缀的键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}_`)) {
        keysToRemove.push(key)
      }
    }

    // 删除所有找到的键
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`[LocalStorage] 已清空所有数据 (共 ${keysToRemove.length} 项)`)
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    return localStorage.getItem(fullKey) !== null
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<{
    totalKeys: number
    totalSize: number
    availableSpace?: number
  }> {
    let totalSize = 0
    let totalKeys = 0

    // 计算所有带前缀的键的大小
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}_`)) {
        totalKeys++
        const value = localStorage.getItem(key)
        if (value) {
          // 估算大小：键名 + 值的 UTF-16 编码长度（每字符2字节）
          totalSize += (key.length + value.length) * 2
        }
      }
    }

    // 尝试估算可用空间（LocalStorage 通常限制为 5-10MB）
    let availableSpace: number | undefined
    try {
      // 通过尝试存储来估算剩余空间
      const testKey = `${this.prefix}_test_capacity`
      const testData = 'x'.repeat(1024 * 1024) // 1MB 测试数据
      localStorage.setItem(testKey, testData)
      localStorage.removeItem(testKey)
      availableSpace = 1024 * 1024 // 至少有 1MB 可用
    } catch {
      availableSpace = 0 // 空间不足
    }

    return {
      totalKeys,
      totalSize,
      availableSpace,
    }
  }

  /**
   * 格式化字节大小为人类可读格式
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}
