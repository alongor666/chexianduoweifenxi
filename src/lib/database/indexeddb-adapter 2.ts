/**
 * IndexedDB 适配器（向后兼容）
 * 保留原有的 IndexedDB + CSV 解析方案
 *
 * @deprecated 建议迁移到 DuckDB 以获得更好的性能
 */

import type { DatabaseAdapter } from './adapter'
import { DatabaseAdapterError } from './adapter'
import type { InsuranceRecord, FilterState } from '@/types/insurance'
import Papa from 'papaparse'
import { DataService } from '@/services/DataService'

export class IndexedDBAdapter implements DatabaseAdapter {
  readonly name = 'IndexedDB'
  private rawData: InsuranceRecord[] = []
  private _initialized = false

  get initialized(): boolean {
    return this._initialized
  }

  /**
   * 初始化（解析 CSV 文件）
   */
  async initialize(file: File): Promise<void> {
    try {
      console.log('[IndexedDB] 开始解析 CSV 文件...')
      const startTime = performance.now()

      const text = await file.text()

      return new Promise((resolve, reject) => {
        Papa.parse<InsuranceRecord>(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: results => {
            if (results.errors.length > 0) {
              console.warn('[IndexedDB] CSV 解析警告:', results.errors)
            }

            this.rawData = results.data
            this._initialized = true

            const elapsed = performance.now() - startTime
            console.log(
              `[IndexedDB] CSV 解析完成: ${this.rawData.length} 条记录，耗时 ${elapsed.toFixed(0)}ms`
            )

            resolve()
          },
          error: error => {
            reject(
              new DatabaseAdapterError(
                `CSV 解析失败: ${error.message}`,
                this.name,
                error
              )
            )
          },
        })
      })
    } catch (error) {
      throw new DatabaseAdapterError(
        '初始化失败',
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 获取所有数据
   */
  async getAllData(): Promise<InsuranceRecord[]> {
    this.ensureInitialized()
    return [...this.rawData]
  }

  /**
   * 获取筛选后的数据
   */
  async getFilteredData(filters: FilterState): Promise<InsuranceRecord[]> {
    this.ensureInitialized()
    return DataService.filter(this.rawData, filters)
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    this.ensureInitialized()
    return DataService.getStatistics(this.rawData)
  }

  /**
   * 清空数据
   */
  async clear(): Promise<void> {
    this.rawData = []
    this._initialized = false
  }

  /**
   * 关闭连接（无操作）
   */
  async close(): Promise<void> {
    this.rawData = []
    this._initialized = false
  }

  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new DatabaseAdapterError('数据库未初始化', this.name)
    }
  }
}
