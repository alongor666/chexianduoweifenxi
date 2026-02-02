/**
 * API 类型定义
 * 统一的请求响应格式
 */

import type {
  InsuranceRecord,
  FilterState,
  KPIResult,
} from '@/types/insurance'

// ============= 通用响应格式 =============

/**
 * API 成功响应
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    timestamp: string
    processingTime?: number
  }
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * API 响应联合类型
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============= Records API =============

/**
 * 查询记录请求参数
 */
export interface GetRecordsQuery {
  filters?: Partial<FilterState>
  page?: number
  pageSize?: number
  sortBy?: keyof InsuranceRecord
  sortOrder?: 'asc' | 'desc'
}

/**
 * 查询记录响应
 */
export interface GetRecordsResponse {
  records: InsuranceRecord[]
  total: number
}

/**
 * 创建记录请求
 */
export interface CreateRecordsRequest {
  records: Partial<InsuranceRecord>[]
  options?: {
    overwrite?: boolean
    incremental?: boolean
    skipValidation?: boolean
  }
}

/**
 * 创建记录响应
 */
export interface CreateRecordsResponse {
  processedCount: number
  successCount: number
  failedCount: number
  errors?: Array<{
    index: number
    message: string
  }>
}

// ============= KPI API =============

/**
 * KPI 计算请求
 */
export interface CalculateKPIRequest {
  filters: Partial<FilterState>
  options?: {
    annualTargetYuan?: number
    mode?: 'current' | 'increment'
    currentWeekNumber?: number
    year?: number
    includeComparison?: boolean
  }
}

/**
 * KPI 计算响应
 */
export interface CalculateKPIResponse {
  kpi: KPIResult
  comparison?: {
    previousKpi: KPIResult | null
    previousWeekNumber: number | null
  }
  recordCount: number
}

/**
 * KPI 趋势请求参数
 */
export interface GetKPITrendsQuery {
  weeks: number[]
  filters?: Partial<FilterState>
  kpiKey?: keyof KPIResult
}

/**
 * KPI 趋势响应
 */
export interface GetKPITrendsResponse {
  trends: Array<{
    weekNumber: number
    kpi: KPIResult
  }>
}

// ============= Filters API =============

/**
 * 筛选选项请求参数
 */
export interface GetFilterOptionsQuery {
  context?: Partial<FilterState>
  dimensions?: Array<keyof InsuranceRecord>
}

/**
 * 筛选选项响应
 */
export interface GetFilterOptionsResponse {
  options: {
    years: number[]
    weeks: number[]
    organizations: string[]
    insuranceTypes: string[]
    businessTypes: string[]
    coverageTypes: string[]
    customerCategories: string[]
    vehicleGrades: string[]
    terminalSources: string[]
    renewalStatuses: string[]
  }
}

// ============= Export API =============

/**
 * 导出请求
 */
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf'
  filters?: Partial<FilterState>
  columns?: Array<keyof InsuranceRecord>
  includeKPI?: boolean
}

// ============= 辅助函数 =============

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Omit<ApiSuccessResponse<T>['meta'], 'timestamp'>
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}

/**
 * 常用错误码
 */
export const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
} as const
