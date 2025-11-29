/**
 * 全局错误处理系统
 * 提供统一的错误分类、处理和报告机制
 */

import { logger } from '@/lib/utils/logger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  FILE_PARSE = 'FILE_PARSE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
  userId?: string;
  stack?: string;
}

export interface ErrorHandler {
  handle(error: AppError | Error | unknown, context?: string): void;
  report(error: AppError): void;
  recover(error: AppError): any | null;
}

class GlobalErrorHandler implements ErrorHandler {
  private errorHandlers: Map<ErrorType, (error: AppError) => any> = new Map();
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  constructor() {
    // 注册默认错误处理器
    this.setupDefaultHandlers();

    // 设置全局错误监听
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  }

  /**
   * 处理错误
   */
  handle(error: AppError | Error | unknown, context?: string): void {
    const appError = this.normalizeError(error, context);

    // 记录错误
    logger.error('Error occurred:', {
      type: appError.type,
      severity: appError.severity,
      message: appError.message,
      context: appError.context,
      details: appError.details,
    });

    // 添加到队列
    this.addToQueue(appError);

    // 执行特定类型的处理器
    const handler = this.errorHandlers.get(appError.type);
    if (handler) {
      try {
        handler(appError);
      } catch (handlerError) {
        logger.error('Error handler failed:', handlerError);
      }
    }

    // 根据严重程度决定是否立即报告
    if (appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL) {
      this.report(appError);
    }
  }

  /**
   * 报告错误
   */
  report(error: AppError): void {
    // 这里可以集成错误报告服务，如 Sentry
    logger.warn('Error reported:', error);

    // 示例：发送到外部服务
    // this.sendToErrorReporting(error);
  }

  /**
   * 尝试恢复
   */
  recover(error: AppError): any | null {
    switch (error.type) {
      case ErrorType.NETWORK:
        // 网络错误恢复策略
        return this.recoverFromNetworkError(error);

      case ErrorType.FILE_PARSE:
        // 文件解析错误恢复策略
        return this.recoverFromParseError(error);

      default:
        return null;
    }
  }

  /**
   * 注册自定义错误处理器
   */
  registerHandler(type: ErrorType, handler: (error: AppError) => any): void {
    this.errorHandlers.set(type, handler);
  }

  /**
   * 获取错误队列
   */
  getErrorQueue(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * 清空错误队列
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: AppError | Error | unknown, context?: string): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        type: this.inferErrorType(error),
        severity: this.inferErrorSeverity(error),
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        context,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: String(error),
      timestamp: new Date(),
      context,
    };
  }

  /**
   * 判断是否为 AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * 推断错误类型
   */
  private inferErrorType(error: Error): ErrorType {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (error.message.includes('Validation') || error.message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (error.message.includes('Parse') || error.message.includes('CSV')) {
      return ErrorType.FILE_PARSE;
    }
    if (error.message.includes('Permission') || error.message.includes('unauthorized')) {
      return ErrorType.PERMISSION;
    }
    return ErrorType.UNKNOWN;
  }

  /**
   * 推断错误严重程度
   */
  private inferErrorSeverity(error: Error): ErrorSeverity {
    // 根据错误类型或消息推断严重程度
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (error.message.includes('warning') || error.message.includes('deprecated')) {
      return ErrorSeverity.LOW;
    }
    return ErrorSeverity.MEDIUM;
  }

  /**
   * 添加到队列
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * 设置默认处理器
   */
  private setupDefaultHandlers(): void {
    // 网络错误处理器
    this.registerHandler(ErrorType.NETWORK, (error) => {
      logger.info('Handling network error:', error.message);
      // 可以显示用户友好的网络错误提示
    });

    // 验证错误处理器
    this.registerHandler(ErrorType.VALIDATION, (error) => {
      logger.info('Handling validation error:', error.message);
      // 可以显示表单验证错误
    });

    // 文件解析错误处理器
    this.registerHandler(ErrorType.FILE_PARSE, (error) => {
      logger.info('Handling parse error:', error.message);
      // 可以提示用户文件格式问题
    });
  }

  /**
   * 处理全局错误
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.handle(event.error, 'Global Error Handler');
  }

  /**
   * 处理 Promise 拒绝
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    this.handle(event.reason, 'Unhandled Promise Rejection');
  }

  /**
   * 网络错误恢复
   */
  private recoverFromNetworkError(error: AppError): any {
    // 实现重试逻辑或返回默认数据
    return null;
  }

  /**
   * 解析错误恢复
   */
  private recoverFromParseError(error: AppError): any {
    // 返回部分解析的数据或提示用户
    return null;
  }
}

// 创建全局实例
export const globalErrorHandler = new GlobalErrorHandler();

/**
 * 便捷函数：创建应用错误
 */
export function createAppError(
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: any
): AppError {
  return {
    type,
    severity,
    message,
    details,
    timestamp: new Date(),
  };
}

/**
 * 便捷函数：处理错误
 */
export function handleError(error: unknown, context?: string): void {
  globalErrorHandler.handle(error, context);
}