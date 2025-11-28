/**
 * 数值格式化工具函数
 *
 * @deprecated 此文件已弃用，请使用 @/utils/formatters 代替
 * 为保持向后兼容性，此文件重新导出所有格式化函数
 *
 * @see @/utils/formatters - 新的格式化工具包
 */

// 重新导出所有格式化函数以保持向后兼容
export { formatNumber, formatInteger, formatDecimal } from './formatters/number'

export {
  formatCurrency,
  formatYuan,
  formatWanYuan,
  type CurrencyUnit,
} from './formatters/currency'

export { formatPercent, formatPercentFromDecimal } from './formatters/percent'

export {
  formatChange,
  type ChangeDirection,
  type FormattedChange,
} from './formatters/change'

export { formatFileSize } from './formatters/file-size'

export { formatTime, formatDateTime, formatDate } from './formatters/time'

export { formatWeekRange, formatWeek } from './formatters/week'

/**
 * 根据满期边际贡献率获取颜色
 * @param ratio 满期边际贡献率（%）
 * @returns 颜色类名
 */
export function getContributionMarginColor(
  ratio: number | null | undefined
): string {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return 'text-slate-500'
  }

  if (ratio > 12) return 'text-green-700' // 优秀：深绿
  if (ratio >= 8) return 'text-green-600' // 良好：浅绿
  if (ratio >= 4) return 'text-yellow-600' // 一般：黄色
  if (ratio >= 0) return 'text-orange-600' // 较差：橙色
  return 'text-red-600' // 严重：红色
}

/**
 * 根据满期边际贡献率获取背景颜色
 * @param ratio 满期边际贡献率（%）
 * @returns 背景颜色类名
 */
export function getContributionMarginBgColor(
  ratio: number | null | undefined
): string {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return 'bg-slate-100'
  }

  if (ratio > 12) return 'bg-green-100' // 优秀
  if (ratio >= 8) return 'bg-green-50' // 良好
  if (ratio >= 4) return 'bg-yellow-50' // 一般
  if (ratio >= 0) return 'bg-orange-50' // 较差
  return 'bg-red-50' // 严重
}

/**
 * 获取 KPI 状态颜色（通用）
 * @param value 当前值
 * @param threshold 阈值
 * @param isHigherBetter 是否数值越高越好
 * @returns 颜色类名
 */
export function getKPIStatusColor(
  value: number | null | undefined,
  threshold: number,
  isHigherBetter = true
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'text-slate-500'
  }

  const isGood = isHigherBetter ? value >= threshold : value <= threshold

  return isGood ? 'text-green-600' : 'text-red-600'
}
