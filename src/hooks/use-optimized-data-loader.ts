/**
 * 优化的数据加载 Hook
 * 提供智能缓存、重试和进度跟踪
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataLoaderService, type DataLoaderOptions } from '@/services/data-loader-service';
import type { InsuranceRecord } from '@/types/insurance';

export interface UseOptimizedDataLoaderOptions extends DataLoaderOptions {
  autoLoad?: boolean;
  preload?: boolean;
  refreshInterval?: number;
}

export interface UseOptimizedDataLoaderReturn {
  data: InsuranceRecord[];
  loading: boolean;
  error: Error | null;
  progress: { loaded: number; total: number; percentage: number };
  reload: () => Promise<void>;
  clearCache: () => void;
  loadMore: (filterFn?: (record: InsuranceRecord) => boolean) => Promise<void>;
}

export function useOptimizedDataLoader(
  options: UseOptimizedDataLoaderOptions = {}
): UseOptimizedDataLoaderReturn {
  const {
    autoLoad = true,
    preload = false,
    refreshInterval,
    onProgress,
    ...loaderOptions
  } = options;

  // 状态管理
  const [data, setData] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  // Refs for cleanup
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // 加载数据函数
  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const result = await dataLoaderService.loadAllData({
        ...loaderOptions,
        onProgress: (loaded, total) => {
          if (mountedRef.current) {
            const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
            setProgress({ loaded, total, percentage });
            onProgress?.(loaded, total);
          }
        },
      });

      if (mountedRef.current) {
        setData(result);
        setProgress({ loaded: result.length, total: result.length, percentage: 100 });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loaderOptions, onProgress]);

  // 重新加载函数
  const reload = useCallback(async () => {
    dataLoaderService.clearCache();
    await loadData();
  }, [loadData]);

  // 清除缓存函数
  const clearCache = useCallback(() => {
    dataLoaderService.clearCache();
    setData([]);
  }, []);

  // 加载更多数据
  const loadMore = useCallback(async (
    filterFn?: (record: InsuranceRecord) => boolean
  ) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await dataLoaderService.loadFilteredData(
        filterFn || (() => true),
        loaderOptions
      );

      if (mountedRef.current) {
        setData(prev => [...prev, ...newData]);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loaderOptions]);

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }

    // 预加载
    if (preload) {
      dataLoaderService.preloadData(loaderOptions);
    }

    // 设置刷新间隔
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        loadData();
      }, refreshInterval);
    }

    // 清理函数
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoLoad, preload, refreshInterval, loadData, loaderOptions]);

  return {
    data,
    loading,
    error,
    progress,
    reload,
    clearCache,
    loadMore,
  };
}