/**
 * 统一的格式化工具包
 *
 * 提供所有格式化功能的统一导出入口
 * 消除代码重复，建立规范的格式化函数组织结构
 *
 * @example
 * import { formatFileSize, formatCurrency, formatPercent } from '@/utils/formatters'
 *
 * const size = formatFileSize(1024 * 1024) // "1.00 MB"
 * const money = formatCurrency(12345) // "12,345 万元"
 * const rate = formatPercent(12.34) // "12.34%"
 */

// 文件大小格式化
export { formatFileSize } from './file-size'

// 时间格式化
export { formatTime, formatDateTime, formatDate } from './time'

// 数值格式化
export { formatNumber, formatInteger, formatDecimal } from './number'

// 货币格式化
export {
  formatCurrency,
  formatYuan,
  formatWanYuan,
  type CurrencyUnit,
} from './currency'

// 百分比格式化
export { formatPercent, formatPercentFromDecimal } from './percent'

// 变化值格式化
export { formatChange, type ChangeDirection, type FormattedChange } from './change'

// 周次格式化
export { formatWeekRange, formatWeek } from './week'
