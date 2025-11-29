/**
 * CSV 批量处理器
 * 提供高性能的批量数据处理，避免阻塞UI
 */

import type { InsuranceRecord } from '@/types/insurance';

export interface BatchProcessorOptions {
  batchSize?: number;
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_BATCH_SIZE = 1000;
const YIELD_DELAY = 5; // 每5ms让出一次控制权

/**
 * 批量处理数据
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  options: BatchProcessorOptions = {}
): Promise<R[]> {
  const { batchSize = DEFAULT_BATCH_SIZE, onBatchComplete, onProgress } = options;
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    // 处理当前批次
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // 更新进度
    onProgress?.(end, items.length);
    onBatchComplete?.(i + 1, totalBatches);

    // 让出控制权，避免阻塞UI
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, YIELD_DELAY));
    }
  }

  return results;
}

/**
 * 处理数据数组并允许取消
 */
export async function processBatchWithCancel<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  signal: AbortSignal,
  options: BatchProcessorOptions = {}
): Promise<R[]> {
  const { batchSize = DEFAULT_BATCH_SIZE, onBatchComplete, onProgress } = options;
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    // 检查是否已取消
    if (signal.aborted) {
      throw new Error('Operation was cancelled');
    }

    const start = i * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    // 处理当前批次
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // 更新进度
    onProgress?.(end, items.length);
    onBatchComplete?.(i + 1, totalBatches);

    // 让出控制权
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, YIELD_DELAY));
    }
  }

  return results;
}

/**
 * 创建进度感知的处理器
 */
export function createProgressAwareProcessor<T, R>(
  processor: (item: T) => R | Promise<R>,
  onProgress?: (current: number, total: number) => void
) {
  let processed = 0;
  const total = 0; // 需要在调用时设置

  return {
    process: async (item: T, index: number): Promise<R> => {
      const result = await processor(item);
      processed++;
      onProgress?.(processed, total);
      return result;
    },
    setTotal: (newTotal: number) => {
      // 在实际实现中，需要存储total值
    }
  };
}