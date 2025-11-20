/**
 * 趋势图表模块统一导出
 *
 * 集中导出趋势图表相关的类型定义、常量和工具函数
 */

// 类型定义
export type {
  SeriesKey,
  BrushRange,
  PointAnalytics,
  CustomTooltipPayload,
  Insight,
} from './types'

// 常量
export { LOSS_RISK_THRESHOLD, LOSS_ROLLING_WINDOW } from './constants'

// 工具函数
export {
  calcRelativeChange,
  calcDifference,
  formatDelta,
  getDeltaClass,
} from './utils'
