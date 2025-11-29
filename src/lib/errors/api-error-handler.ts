/**
 * API 错误处理工具
 * 统一处理 API 请求错误
 */

import { handleError, createAppError, ErrorType, ErrorSeverity } from './error-handler';
import { logger } from '@/lib/utils/logger';

export interface APIError extends Error {
  status?: number;
  statusText?: string;
  response?: any;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
  success: boolean;
  message?: string;
}

/**
 * 处理 API 响应
 */
export function handleAPIResponse<T>(response: Response): Promise<APIResponse<T>> {
  return response
    .json()
    .then((data) => {
      if (!response.ok) {
        const error: APIError = new Error(data.message || response.statusText);
        error.status = response.status;
        error.statusText = response.statusText;
        error.response = data;

        // 根据状态码分类错误
        const errorType = getErrorTypeFromStatus(response.status);
        const appError = createAppError(
          errorType,
          `API Error: ${error.message}`,
          getErrorSeverityFromStatus(response.status),
          {
            status: response.status,
            url: response.url,
            response: data,
          }
        );

        handleError(appError, `API: ${response.url}`);

        return {
          success: false,
          error,
          message: data.message || response.statusText,
        };
      }

      return {
        success: true,
        data,
      };
    })
    .catch((error) => {
      logger.error('Failed to parse API response:', error);

      const apiError: APIError = new Error('Failed to parse response');
      apiError.status = response.status;
      apiError.statusText = response.statusText;

      const appError = createAppError(
        ErrorType.NETWORK,
        'API Response Parse Error',
        ErrorSeverity.MEDIUM,
        {
          status: response.status,
          url: response.url,
          originalError: error,
        }
      );

      handleError(appError, `API Parse: ${response.url}`);

      return {
        success: false,
        error: apiError,
        message: '服务器响应格式错误',
      };
    });
}

/**
 * 包装 fetch 请求，添加错误处理
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  try {
    logger.debug(`Fetching: ${url}`, options);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return handleAPIResponse<T>(response);
  } catch (error) {
    logger.error('Network error:', error);

    const apiError: APIError = error as Error;
    const appError = createAppError(
      ErrorType.NETWORK,
      'Network request failed',
      ErrorSeverity.HIGH,
      {
        url,
        options,
        originalError: error,
      }
    );

    handleError(appError, `Network: ${url}`);

    return {
      success: false,
      error: apiError,
      message: '网络请求失败，请检查网络连接',
    };
  }
}

/**
 * 带重试的 fetch 请求
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<APIResponse<T>> {
  let lastError: APIResponse<T>;

  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetchWithErrorHandling<T>(url, options);

    if (response.success || !shouldRetry(response)) {
      return response;
    }

    lastError = response;

    if (i < maxRetries) {
      logger.warn(`Retrying request (${i + 1}/${maxRetries}): ${url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
    }
  }

  return lastError!;
}

/**
 * 判断是否应该重试
 */
function shouldRetry<T>(response: APIResponse<T>): boolean {
  if (response.success) return false;

  const status = response.error?.status;
  if (!status) return true; // 网络错误，可以重试

  // 5xx 服务器错误可以重试
  if (status >= 500 && status < 600) return true;

  // 429 限流可以重试
  if (status === 429) return true;

  // 408 请求超时可以重试
  if (status === 408) return true;

  return false;
}

/**
 * 根据状态码获取错误类型
 */
function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401 || status === 403) return ErrorType.PERMISSION;
  if (status >= 400 && status < 500) return ErrorType.VALIDATION;
  if (status >= 500) return ErrorType.NETWORK;
  return ErrorType.UNKNOWN;
}

/**
 * 根据状态码获取错误严重程度
 */
function getErrorSeverityFromStatus(status: number): ErrorSeverity {
  if (status === 500 || status === 502 || status === 503) return ErrorSeverity.CRITICAL;
  if (status >= 400 && status < 500) return ErrorSeverity.MEDIUM;
  if (status >= 500) return ErrorSeverity.HIGH;
  return ErrorSeverity.LOW;
}

/**
 * 创建错误消息映射
 */
export const ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '没有权限访问',
  404: '请求的资源不存在',
  408: '请求超时',
  409: '数据冲突',
  422: '数据验证失败',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时',
};

/**
 * 获取友好的错误消息
 */
export function getErrorMessage(status: number, defaultMessage?: string): string {
  return ERROR_MESSAGES[status] || defaultMessage || '未知错误';
}