/**
 * 周度经营趋势分析 - 模块导出
 *
 * 统一导出所有类型定义、工具函数和常量。
 */

// 导出主组件
export { WeeklyOperationalTrend } from './component'

// 导出常量
export { LOSS_RISK_THRESHOLD } from './constants'

// 导出类型
export type {
  ChartDataPoint,
  NarrativeSummary,
  DimensionHighlight,
  TotalsAggregation,
  DimensionAccumulator,
} from './types'

// 导出工具函数
export {
  calculateTrendLine,
  formatDeltaPercentPoint,
  formatDeltaAmountWan,
  createWeekScopedFilters,
  describeFilters,
  aggregateTotals,
  computeLossRatio,
  formatFilterList,
  sanitizeText,
  pickTopLabel,
  buildDimensionHighlights,
  formatWeekList,
} from './utils'

// 导出经营摘要生成器
export { generateOperationalSummary } from './summary-utils'
