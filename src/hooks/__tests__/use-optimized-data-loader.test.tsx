/**
 * 优化的数据加载 Hook 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOptimizedDataLoader } from '../use-optimized-data-loader';
import { dataLoaderService } from '../../services/data-loader-service';
import type { InsuranceRecord } from '@/types/insurance';

// Mock dataLoaderService
vi.mock('../../services/data-loader-service', () => ({
  dataLoaderService: {
    loadAllData: vi.fn(),
    clearCache: vi.fn(),
    loadFilteredData: vi.fn(),
    preloadData: vi.fn(),
  },
}));

const mockData: InsuranceRecord[] = [
  {
    id: '1',
    snapshot_date: '2024-01-01',
    policy_number: 'POL001',
    policyholder: '客户1',
    total_premium: 1000,
    week_number: 1,
  } as InsuranceRecord,
];

describe('useOptimizedDataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load data on mount when autoLoad is true', async () => {
    vi.mocked(dataLoaderService.loadAllData).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useOptimizedDataLoader({ autoLoad: true })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    expect(dataLoaderService.loadAllData).toHaveBeenCalledTimes(1);
  });

  it('should not load data on mount when autoLoad is false', () => {
    renderHook(() => useOptimizedDataLoader({ autoLoad: false }));

    expect(dataLoaderService.loadAllData).not.toHaveBeenCalled();
  });

  it('should handle loading errors', async () => {
    const error = new Error('Failed to load');
    vi.mocked(dataLoaderService.loadAllData).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useOptimizedDataLoader({ autoLoad: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
      expect(result.current.data).toEqual([]);
    });
  });

  it('should reload data and clear cache', async () => {
    vi.mocked(dataLoaderService.loadAllData).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useOptimizedDataLoader({ autoLoad: false })
    );

    await result.current.reload();

    expect(dataLoaderService.clearCache).toHaveBeenCalledTimes(1);
    expect(dataLoaderService.loadAllData).toHaveBeenCalledTimes(1);
  });

  it('should clear cache and reset data', () => {
    const { result } = renderHook(() =>
      useOptimizedDataLoader({
        autoLoad: false,
      })
    );

    result.current.clearCache();

    expect(dataLoaderService.clearCache).toHaveBeenCalledTimes(1);
  });

  it('should load more data with filter', async () => {
    vi.mocked(dataLoaderService.loadFilteredData).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useOptimizedDataLoader({ autoLoad: false })
    );

    const filterFn = (record: InsuranceRecord) => record.total_premium > 500;
    await result.current.loadMore(filterFn);

    expect(dataLoaderService.loadFilteredData).toHaveBeenCalledWith(
      filterFn,
      expect.any(Object)
    );
  });

  it('should track progress', async () => {
    let progressCallback: ((loaded: number, total: number) => void) | undefined;
    vi.mocked(dataLoaderService.loadAllData).mockImplementation(
      (options) => {
        progressCallback = options?.onProgress;
        return new Promise((resolve) => {
          // Simulate progress
          setTimeout(() => {
            progressCallback?.(50, 100);
            progressCallback?.(100, 100);
            resolve(mockData);
          }, 0);
        });
      }
    );

    const { result } = renderHook(() =>
      useOptimizedDataLoader({ autoLoad: true })
    );

    await waitFor(() => {
      expect(result.current.progress.percentage).toBe(100);
    });
  });

  it('should preload data when enabled', () => {
    renderHook(() => useOptimizedDataLoader({ preload: true }));

    expect(dataLoaderService.preloadData).toHaveBeenCalled();
  });
});