/**
 * 数据加载服务测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoaderService } from '../data-loader-service';
import type { InsuranceRecord } from '@/types/insurance';

// Mock DataService
vi.mock('../../services/DataService', () => ({
  DataService: {
    fetchAllData: vi.fn(),
  },
}));

describe('DataLoaderService', () => {
  let dataLoaderService: DataLoaderService;
  const mockData: InsuranceRecord[] = Array.from({ length: 100 }, (_, i) => ({
    id: `id-${i}`,
    snapshot_date: '2024-01-01',
    policy_number: `POL-${i}`,
    policyholder: `客户${i}`,
    total_premium: 1000 + i,
    week_number: 1,
  }));

  beforeEach(() => {
    dataLoaderService = new DataLoaderService();
    vi.clearAllMocks();
  });

  describe('loadAllData', () => {
    it('should load data successfully', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData).mockResolvedValue(mockData);

      const result = await dataLoaderService.loadAllData();

      expect(result).toEqual(mockData);
      expect(DataService.fetchAllData).toHaveBeenCalledTimes(1);
    });

    it('should use cache when enabled', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData).mockResolvedValue(mockData);

      // First load
      await dataLoaderService.loadAllData({ enableCache: true });
      // Second load should use cache
      await dataLoaderService.loadAllData({ enableCache: true });

      expect(DataService.fetchAllData).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockData);

      const result = await dataLoaderService.loadAllData({
        retryAttempts: 2,
        retryDelay: 10,
      });

      expect(result).toEqual(mockData);
      expect(DataService.fetchAllData).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback for batch processing', async () => {
      const { DataService } = await import('../../services/DataService');
      const largeData = Array.from({ length: 25000 }, (_, i) => ({
        ...mockData[0],
        id: `id-${i}`,
      }));
      vi.mocked(DataService.fetchAllData).mockResolvedValue(largeData);

      const onProgress = vi.fn();
      await dataLoaderService.loadAllData({
        batchSize: 10000,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('loadFilteredData', () => {
    it('should filter data correctly', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData).mockResolvedValue(mockData);

      const filterFn = (record: InsuranceRecord) => record.total_premium > 1005;
      const result = await dataLoaderService.loadFilteredData(filterFn);

      expect(result.length).toBeLessThan(mockData.length);
      expect(result.every(r => r.total_premium > 1005)).toBe(true);
    });
  });

  describe('streamData', () => {
    it('should stream data in batches', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData).mockResolvedValue(mockData);

      const batches: InsuranceRecord[][] = [];
      for await (const batch of dataLoaderService.streamData({ batchSize: 30 })) {
        batches.push(batch);
      }

      expect(batches.length).toBe(4); // 100 / 30 = 3.33, so 4 batches
      expect(batches[0].length).toBe(30);
      expect(batches[3].length).toBe(10);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      dataLoaderService.clearCache();
      const stats = dataLoaderService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache stats', async () => {
      const { DataService } = await import('../../services/DataService');
      vi.mocked(DataService.fetchAllData).mockResolvedValue(mockData);

      await dataLoaderService.loadAllData({ enableCache: true });

      // 添加一个小延迟确保时间戳更新
      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = dataLoaderService.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries[0].key).toBe('all_data');
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });
});