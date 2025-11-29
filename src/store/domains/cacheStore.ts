/**
 * 缓存管理领域 Store
 * 专注于KPI计算结果的缓存管理
 *
 * @responsibility 单一职责：只管理计算结果缓存
 * @migration 从 use-app-store.ts 拆分出缓存管理部分
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { KPIResult } from "@/types/insurance";

interface CacheStore {
  // ==================== 状态 ====================
  /**
   * KPI计算结果缓存
   * Key: 由筛选条件和计算参数生成的唯一标识
   * Value: KPI计算结果
   */
  kpiCache: Map<string, KPIResult>;

  /**
   * 缓存命中次数统计
   */
  cacheHits: number;

  /**
   * 缓存未命中次数统计
   */
  cacheMisses: number;

  // ==================== 操作方法 ====================

  /**
   * 设置KPI缓存
   * @param key 缓存键
   * @param result KPI计算结果
   */
  setKPICache: (key: string, result: KPIResult) => void;

  /**
   * 获取KPI缓存
   * @param key 缓存键
   * @returns KPI计算结果（如果存在）
   */
  getKPICache: (key: string) => KPIResult | undefined;

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  hasKPICache: (key: string) => boolean;

  /**
   * 删除特定缓存
   * @param key 缓存键
   */
  deleteKPICache: (key: string) => void;

  /**
   * 清空所有KPI缓存
   */
  clearKPICache: () => void;

  /**
   * 清空所有缓存（包括统计数据）
   */
  clearAll: () => void;

  // ==================== 计算属性 ====================

  /**
   * 获取缓存大小
   */
  getCacheSize: () => number;

  /**
   * 获取缓存命中率
   */
  getCacheHitRate: () => number;

  /**
   * 获取缓存统计信息
   */
  getCacheStats: () => {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    totalRequests: number;
  };

  /**
   * 记录缓存命中
   */
  recordCacheHit: () => void;

  /**
   * 记录缓存未命中
   */
  recordCacheMiss: () => void;
}

/**
 * 创建缓存 Store
 */
export const useCacheStore = create<CacheStore>()(
  devtools(
    (set, get) => ({
      // ==================== 初始状态 ====================
      kpiCache: new Map(),
      cacheHits: 0,
      cacheMisses: 0,

      // ==================== 操作方法 ====================

      setKPICache: (key, result) => {
        set(
          (state) => {
            const newCache = new Map(state.kpiCache);
            newCache.set(key, result);
            return {
              kpiCache: newCache,
            };
          },
          false,
          "setKPICache",
        );
        console.log(`[CacheStore] 缓存已设置: ${key}`);
      },

      getKPICache: (key) => {
        const { kpiCache } = get();
        const result = kpiCache.get(key);

        if (result) {
          get().recordCacheHit();
          console.log(`[CacheStore] 缓存命中: ${key}`);
        } else {
          get().recordCacheMiss();
          console.log(`[CacheStore] 缓存未命中: ${key}`);
        }

        return result;
      },

      hasKPICache: (key) => {
        return get().kpiCache.has(key);
      },

      deleteKPICache: (key) => {
        set(
          (state) => {
            const newCache = new Map(state.kpiCache);
            newCache.delete(key);
            return {
              kpiCache: newCache,
            };
          },
          false,
          "deleteKPICache",
        );
        console.log(`[CacheStore] 缓存已删除: ${key}`);
      },

      clearKPICache: () => {
        set(
          {
            kpiCache: new Map(),
          },
          false,
          "clearKPICache",
        );
        console.log("[CacheStore] KPI缓存已清空");
      },

      clearAll: () => {
        set(
          {
            kpiCache: new Map(),
            cacheHits: 0,
            cacheMisses: 0,
          },
          false,
          "clearAll",
        );
        console.log("[CacheStore] 所有缓存和统计数据已清空");
      },

      // ==================== 计算属性 ====================

      getCacheSize: () => {
        return get().kpiCache.size;
      },

      getCacheHitRate: () => {
        const { cacheHits, cacheMisses } = get();
        const total = cacheHits + cacheMisses;
        if (total === 0) return 0;
        return (cacheHits / total) * 100;
      },

      getCacheStats: () => {
        const { kpiCache, cacheHits, cacheMisses } = get();
        const total = cacheHits + cacheMisses;
        const hitRate = total === 0 ? 0 : (cacheHits / total) * 100;

        return {
          size: kpiCache.size,
          hits: cacheHits,
          misses: cacheMisses,
          hitRate,
          totalRequests: total,
        };
      },

      recordCacheHit: () => {
        set(
          (state) => ({
            cacheHits: state.cacheHits + 1,
          }),
          false,
          "recordCacheHit",
        );
      },

      recordCacheMiss: () => {
        set(
          (state) => ({
            cacheMisses: state.cacheMisses + 1,
          }),
          false,
          "recordCacheMiss",
        );
      },
    }),
    {
      name: "cache-store",
    },
  ),
);
