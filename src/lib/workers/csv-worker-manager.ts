/**
 * CSV Worker Manager
 * 管理Web Worker实例，提供取消和进度跟踪功能
 */

export interface WorkerProgress {
  percentage: number;
  loaded: number;
  total: number;
  currentFile?: string;
}

export interface WorkerResult {
  success: boolean;
  records?: any[];
  stats?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  errors?: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
  error?: string;
}

export class CSVWorkerManager {
  private worker: Worker | null = null;
  private abortController: AbortController | null = null;
  private resolvePromise: ((value: WorkerResult) => void) | null = null;
  private rejectPromise: ((reason: any) => void) | null = null;

  /**
   * 解析CSV内容
   */
  async parseCSV(
    content: string,
    fileName: string,
    options?: {
      onProgress?: (progress: WorkerProgress) => void;
      preview?: boolean;
      previewRows?: number;
    }
  ): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      // 取消之前的任务
      this.cancel();

      // 创建新的AbortController
      this.abortController = new AbortController();
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // 创建Worker实例
      this.worker = new Worker(
        new URL('@/workers/csv-parse.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // 监听Worker消息
      this.worker.onmessage = (event: MessageEvent) => {
        const { type, data, error } = event.data;

        switch (type) {
          case 'progress':
            if (options?.onProgress) {
              options.onProgress({
                percentage: data.progress || 0,
                loaded: 0,
                total: content.length,
                currentFile: fileName,
              });
            }
            break;

          case 'success':
            this.cleanup();
            resolve({
              success: true,
              records: data.records,
              stats: data.stats,
              errors: data.errors,
            });
            break;

          case 'error':
            this.cleanup();
            resolve({
              success: false,
              error: error || 'Unknown error',
            });
            break;
        }
      };

      // 监听Worker错误
      this.worker.onerror = (error) => {
        this.cleanup();
        resolve({
          success: false,
          error: `Worker error: ${error.message}`,
        });
      };

      // 监听取消信号
      this.abortController.signal.addEventListener('abort', () => {
        this.cleanup();
        resolve({
          success: false,
          error: 'Operation cancelled',
        });
      });

      // 发送解析任务
      this.worker.postMessage({
        type: 'parse',
        data: {
          content,
          fileName,
          options: {
            preview: options?.preview,
            previewRows: options?.previewRows,
          },
        },
      });
    });
  }

  /**
   * 取消当前任务
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanup();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.abortController = null;
    this.resolvePromise = null;
    this.rejectPromise = null;
  }

  /**
   * 检查是否有正在运行的任务
   */
  get isRunning(): boolean {
    return this.worker !== null;
  }
}

// 单例模式
export const csvWorkerManager = new CSVWorkerManager();