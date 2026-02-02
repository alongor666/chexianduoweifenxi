/**
 * 筛选选项 API 客户端
 */

import { apiClient } from './client'
import type { ApiResponse, GetFilterOptionsResponse } from './types'
import type { FilterState } from '@/types/insurance'

/**
 * 获取筛选选项
 */
export async function getFilterOptions(options?: {
  context?: Partial<FilterState>
}): Promise<ApiResponse<GetFilterOptionsResponse>> {
  return apiClient.get<GetFilterOptionsResponse>('/filters/options', options)
}

/**
 * 获取基于上下文的动态筛选选项（级联筛选）
 */
export async function getCascadingFilterOptions(
  context: Partial<FilterState>
): Promise<ApiResponse<GetFilterOptionsResponse>> {
  return getFilterOptions({ context })
}
