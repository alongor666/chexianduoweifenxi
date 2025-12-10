/**
 * Application Ports 公开接口
 *
 * 导出所有端口接口和相关类型定义。
 *
 * @layer Application
 */

// 数据仓储接口
export type { IDataRepository, DataFilters, DataStats } from './IDataRepository'

// 文件解析器接口
export type {
  IFileParser,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './IFileParser'
export { ValidationErrorType, ValidationWarningType } from './IFileParser'

// 数据导出器接口
export type {
  IExporter,
  ExportOptions,
  ColumnConfig,
  PageSettings,
} from './IExporter'
export { ExportFormat } from './IExporter'
