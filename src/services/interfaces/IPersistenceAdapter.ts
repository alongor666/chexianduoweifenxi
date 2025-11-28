/**
 * 持久化适配器接口
 * 定义数据持久化的标准操作，方便未来切换存储方案（LocalStorage → IndexedDB → 云端）
 *
 * @design 接口隔离原则：每个存储方案实现此接口即可无缝替换
 */

export interface IPersistenceAdapter {
  /**
   * 保存数据
   * @param key 存储键名
   * @param data 要存储的数据（会自动序列化）
   * @throws {PersistenceError} 存储失败时抛出
   */
  save<T>(key: string, data: T): Promise<void>

  /**
   * 加载数据
   * @param key 存储键名
   * @returns 存储的数据（自动反序列化），不存在时返回 null
   */
  load<T>(key: string): Promise<T | null>

  /**
   * 删除数据
   * @param key 存储键名
   */
  remove(key: string): Promise<void>

  /**
   * 清空所有数据
   */
  clear(): Promise<void>

  /**
   * 检查键是否存在
   * @param key 存储键名
   */
  has(key: string): Promise<boolean>

  /**
   * 获取存储统计信息
   */
  getStats(): Promise<{
    totalKeys: number
    totalSize: number // 字节数
    availableSpace?: number
  }>
}

/**
 * 持久化错误类
 */
export class PersistenceError extends Error {
  constructor(
    message: string,
    public code:
      | 'QUOTA_EXCEEDED'
      | 'SERIALIZATION_ERROR'
      | 'STORAGE_UNAVAILABLE'
      | 'UNKNOWN',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PersistenceError'
  }
}
