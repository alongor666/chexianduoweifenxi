/**
 * API 客户端
 * 统一的请求封装，支持本地模式和远程模式
 */

import type { ApiResponse } from './types'

/**
 * API 配置
 */
interface ApiClientConfig {
  baseUrl: string
  timeout: number
  headers?: Record<string, string>
}

/**
 * 默认配置
 */
const defaultConfig: ApiClientConfig = {
  baseUrl: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

/**
 * 请求选项
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, unknown>
  timeout?: number
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }

    if (typeof value === 'object') {
      searchParams.set(key, JSON.stringify(value))
    } else {
      searchParams.set(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * API 客户端类
 */
class ApiClient {
  private config: ApiClientConfig

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 发送请求
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      query,
      timeout = this.config.timeout,
    } = options

    // 构建 URL
    const queryString = query ? buildQueryString(query) : ''
    const url = `${this.config.baseUrl}${endpoint}${queryString}`

    // 构建请求头
    const requestHeaders = {
      ...this.config.headers,
      ...headers,
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    // 创建超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    fetchOptions.signal = controller.signal

    try {
      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      }
    }
  }

  /**
   * GET 请求
   */
  async get<T>(
    endpoint: string,
    query?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', query })
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

/**
 * 默认 API 客户端实例
 */
export const apiClient = new ApiClient()

/**
 * 创建自定义配置的 API 客户端
 */
export function createApiClient(config: Partial<ApiClientConfig>): ApiClient {
  return new ApiClient(config)
}

export { ApiClient }
export type { ApiClientConfig, RequestOptions }
