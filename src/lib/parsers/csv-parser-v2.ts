/**
 * CSV Parser V2 - 使用 Web Worker 优化版本
 * 在后台线程处理大型CSV文件，避免阻塞UI
 */

import type { InsuranceRecord } from '@/types/insurance';
import { csvWorkerManager, type WorkerProgress } from '@/lib/workers/csv-worker-manager';
import { normalizeFileEncoding } from './csv-parser';

export interface ParseResult {
  success: boolean;
  data: InsuranceRecord[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
}

export interface ProgressCallback {
  (progress: WorkerProgress): void;
}

/**
 * 解析CSV文件内容（使用Web Worker）
 */
export async function parseCSVContent(
  content: string,
  fileName: string = 'data.csv',
  options?: {
    onProgress?: ProgressCallback;
    preview?: boolean;
    previewRows?: number;
  }
): Promise<ParseResult> {
  const result = await csvWorkerManager.parseCSV(content, fileName, options);

  return {
    success: result.success,
    data: result.records || [],
    stats: result.stats || {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    },
    errors: result.errors || [],
  };
}

/**
 * 解析CSV文件（使用Web Worker）
 */
export async function parseCSVFile(
  file: File,
  onProgress?: ProgressCallback,
  options?: {
    preview?: boolean;
    previewRows?: number;
  }
): Promise<ParseResult> {
  console.log(
    `[CSV Parser V2] 开始解析文件: ${file.name}, 大小: ${file.size} bytes`
  );

  try {
    // 标准化文件编码
    const { file: normalizedFile, encoding } = await normalizeFileEncoding(file);
    console.log(`[CSV Parser V2] 检测到编码: ${encoding}`);

    // 读取文件内容
    const content = await normalizedFile.text();

    // 使用Web Worker解析
    return await parseCSVContent(content, file.name, {
      onProgress,
      preview: options?.preview,
      previewRows: options?.previewRows,
    });
  } catch (error) {
    console.error('[CSV Parser V2] 解析文件失败:', error);
    return {
      success: false,
      data: [],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
      },
      errors: [
        {
          row: 0,
          field: 'file',
          message: error instanceof Error ? error.message : 'Unknown error',
          value: null,
        },
      ],
    };
  }
}

/**
 * 预览CSV文件（仅解析前N行）
 */
export async function previewCSVFile(
  file: File,
  rows: number = 100
): Promise<ParseResult> {
  console.log(`[CSV Parser V2] 预览文件: ${file.name}, 前 ${rows} 行`);

  return parseCSVFile(file, undefined, {
    preview: true,
    previewRows: rows,
  });
}

/**
 * 取消当前解析任务
 */
export function cancelCurrentParse(): void {
  csvWorkerManager.cancel();
  console.log('[CSV Parser V2] 已取消解析任务');
}

/**
 * 检查是否有正在运行的解析任务
 */
export function isParseRunning(): boolean {
  return csvWorkerManager.isRunning;
}