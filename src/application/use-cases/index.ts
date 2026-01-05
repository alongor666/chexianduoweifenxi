/**
 * Application Use Cases 公开接口
 *
 * 导出所有用例类和相关类型定义。
 *
 * @layer Application
 */

// 计算 KPI 用例
export { CalculateKPIUseCase, KPICalculationError } from './calculate-kpi'
export type {
  KPICalculationResult,
  GroupedKPIResult,
  GroupByDimension,
  KPIErrorCode,
} from './calculate-kpi'

// 导出报告用例
export { ExportReportUseCase, ExportError } from './export-report'
export type { ExportResult, ExportErrorCode } from './export-report'
