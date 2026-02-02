/**
 * KPI API 客户端
 */

import { apiClient } from './client'
import type {
  ApiResponse,
  CalculateKPIRequest,
  CalculateKPIResponse,
  GetKPITrendsResponse,
} from './types'
import type { FilterState } from '@/types/insurance'

/**
 * 计算 KPI
 */
export async function calculateKPI(
  request: CalculateKPIRequest
): Promise<ApiResponse<CalculateKPIResponse>> {
  return apiClient.post<CalculateKPIResponse>('/kpi/calculate', request)
}

/**
 * 获取 KPI 趋势数据
 */
export async function getKPITrends(options: {
  weeks: number[]
  filters?: Partial<FilterState>
}): Promise<ApiResponse<GetKPITrendsResponse>> {
  return apiClient.get<GetKPITrendsResponse>('/kpi/trends', options)
}

/**
 * 计算带对比的 KPI（便捷方法）
 */
export async function calculateKPIWithComparison(
  filters: Partial<FilterState>,
  currentWeekNumber: number,
  annualTargetYuan?: number
): Promise<ApiResponse<CalculateKPIResponse>> {
  return calculateKPI({
    filters,
    options: {
      currentWeekNumber,
      annualTargetYuan,
      includeComparison: true,
    },
  })
}

/**
 * 批量获取多周 KPI（便捷方法）
 */
export async function getMultiWeekKPI(
  weeks: number[],
  filters?: Partial<FilterState>
): Promise<ApiResponse<GetKPITrendsResponse>> {
  return getKPITrends({ weeks, filters })
}
