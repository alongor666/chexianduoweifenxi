/**
 * 数据加载服务
 * 提供优化的数据加载策略，包括分批加载、懒加载和缓存
 */

import { DataService } from './DataService';
import type { InsuranceRecord } from '@/types/insurance';

export interface DataLoaderOptions {
  batchSize?: number;
  enableCache?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (loaded: number, total: number) => void;
}

interface CacheEntry {
  data: InsuranceRecord[];
  timestamp: number;
  hash: string;
}

export class DataLoaderService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 加载所有数据
   */
  async loadAllData(options: DataLoaderOptions = {}): Promise<InsuranceRecord[]> {
    const {
      batchSize = 10000,
      enableCache = true,
      retryAttempts = 3,
      retryDelay = 1000,
      onProgress,
    } = options;

    const cacheKey = 'all_data';

    // 检查缓存
    if (enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let attempt = 0;
    while (attempt < retryAttempts) {
      try {
        const data = await DataService.fetchAllData();

        // 如果数据量很大，使用分批处理
        if (data.length > batchSize) {
          return this.loadInBatches(data, batchSize, onProgress);
        }

        // 更新缓存
        if (enableCache) {
          this.setCache(cacheKey, data);
        }

        return data;
      } catch (error) {
        attempt++;
        if (attempt === retryAttempts) {
          throw error;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Failed to load data after retries');
  }

  /**
   * 分批加载数据
   */
  private async loadInBatches(
    data: InsuranceRecord[],
    batchSize: number,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<InsuranceRecord[]> {
    const result: InsuranceRecord[] = [];
    const total = data.length;

    for (let i = 0; i < total; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      result.push(...batch);

      // 让出控制权
      await new Promise(resolve => setTimeout(resolve, 0));

      // 报告进度
      onProgress?.(Math.min(i + batchSize, total), total);
    }

    return result;
  }

  /**
   * 懒加载筛选数据
   */
  async loadFilteredData(
    filterFn: (record: InsuranceRecord) => boolean,
    options: DataLoaderOptions = {}
  ): Promise<InsuranceRecord[]> {
    const allData = await this.loadAllData(options);
    return allData.filter(filterFn);
  }

  /**
   * 流式加载数据
   */
  async *streamData(
    options: DataLoaderOptions = {}
  ): AsyncGenerator<InsuranceRecord[], void, unknown> {
    const { batchSize = 1000 } = options;
    const allData = await this.loadAllData(options);

    for (let i = 0; i < allData.length; i += batchSize) {
      yield allData.slice(i, i + batchSize);
    }
  }

  /**
   * 预加载数据
   */
  async preloadData(options: DataLoaderOptions = {}): Promise<void> {
    // 在后台预加载数据
    this.loadAllData({
      ...options,
      onProgress: undefined, // 预加载不需要进度回调
    }).catch(error => {
      console.warn('Data preloading failed:', error);
    });
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string): InsuranceRecord[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: InsuranceRecord[]): void {
    const hash = this.calculateHash(data);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash,
    });
  }

  /**
   * 计算数据哈希
   */
  private calculateHash(data: InsuranceRecord[]): string {
    // 简单的哈希实现，实际项目中可以使用更强的哈希算法
    return `${data.length}_${Date.now()}`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// 单例实例
export const dataLoaderService = new DataLoaderService();