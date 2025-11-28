/**
 * Application 层公开接口
 *
 * 这是 Application 层的入口文件，明确声明对外暴露的内容。
 *
 * @layer Application
 */

// ==================== Ports（端口接口） ====================
export type {
  IDataRepository,
  DataFilters,
  DataStats,
} from './ports/IDataRepository'

export type {
  IFileParser,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './ports/IFileParser'
export { ValidationErrorType, ValidationWarningType } from './ports/IFileParser'

export type {
  IExporter,
  ExportOptions,
  ColumnConfig,
  PageSettings,
} from './ports/IExporter'
export { ExportFormat } from './ports/IExporter'

// ==================== Use Cases（用例） ====================
export { UploadDataUseCase, UploadError } from './use-cases/upload-data'
export type { UploadResult, UploadErrorCode } from './use-cases/upload-data'

export {
  CalculateKPIUseCase,
  KPICalculationError,
} from './use-cases/calculate-kpi'
export type {
  KPICalculationResult,
  GroupedKPIResult,
  GroupByDimension,
  KPIErrorCode,
} from './use-cases/calculate-kpi'

export { ExportReportUseCase, ExportError } from './use-cases/export-report'
export type { ExportResult, ExportErrorCode } from './use-cases/export-report'

// ==================== Services（服务） ====================
export { DataService } from './services/data-service'
