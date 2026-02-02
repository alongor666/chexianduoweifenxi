/**
 * 保险记录 API 客户端
 */

import { apiClient } from './client'
import type {
  ApiResponse,
  GetRecordsResponse,
  CreateRecordsRequest,
  CreateRecordsResponse,
} from './types'
import type { FilterState, InsuranceRecord } from '@/types/insurance'

/**
 * 查询保险记录
 */
export async function getRecords(options?: {
  filters?: Partial<FilterState>
  page?: number
  pageSize?: number
  sortBy?: keyof InsuranceRecord
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<GetRecordsResponse>> {
  return apiClient.get<GetRecordsResponse>('/records', options)
}

/**
 * 创建/导入保险记录
 */
export async function createRecords(
  request: CreateRecordsRequest
): Promise<ApiResponse<CreateRecordsResponse>> {
  return apiClient.post<CreateRecordsResponse>('/records', request)
}

/**
 * 获取所有记录（不分页）
 */
export async function getAllRecords(
  filters?: Partial<FilterState>
): Promise<ApiResponse<GetRecordsResponse>> {
  return apiClient.get<GetRecordsResponse>('/records', {
    filters,
    pageSize: 100000, // 大数值以获取所有
  })
}
