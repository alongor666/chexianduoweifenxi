/**
 * API Hooks 统一导出
 *
 * 业务逻辑 Hooks 层，提供：
 * - 数据查询
 * - KPI 计算
 * - 筛选选项
 * - 数据上传
 *
 * 支持本地模式和远程模式两种数据源
 */

// 保险记录
export { useInsuranceRecords, usePaginatedRecords } from './useInsuranceRecords'

// KPI 数据
export { useKPIData, useKPITrends } from './useKPIData'

// 筛选选项
export { useFilterOptions, useCascadingFilterOptions } from './useFilterOptions'

// 数据上传
export { useDataUpload } from './useDataUpload'
