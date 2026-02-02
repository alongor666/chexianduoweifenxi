/**
 * API 模块统一导出
 */

// 客户端
export { apiClient, createApiClient, ApiClient } from './client'
export type { ApiClientConfig, RequestOptions } from './client'

// 类型
export * from './types'

// 记录 API
export { getRecords, createRecords, getAllRecords } from './records'

// KPI API
export {
  calculateKPI,
  getKPITrends,
  calculateKPIWithComparison,
  getMultiWeekKPI,
} from './kpi'

// 筛选 API
export { getFilterOptions, getCascadingFilterOptions } from './filters'

// 导出 API
export {
  exportData,
  exportToCSV,
  downloadBlob,
  exportAndDownloadCSV,
} from './export'
