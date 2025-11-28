/**
 * 数值格式化工具函数
 */

/**
 * 格式化数字为千分位格式
 * @param value 数值
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * 格式化百分比
 * @param value 数值（0-100）
 * @param decimals 小数位数（默认2）
 * @returns 格式化后的字符串（带%符号）
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * 格式化金额（万元）
 * @param value 金额（万元）
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串（带"万元"单位）
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  return `${formatNumber(value, decimals)} 万元`
}

/**
 * 格式化整数
 * @param value 数值
 * @returns 格式化后的字符串（千分位）
 */
export function formatInteger(value: number | null | undefined): string {
  return formatNumber(value, 0)
}

/**
 * 格式化小数
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatDecimal(
  value: number | null | undefined,
  decimals = 3
): string {
  return formatNumber(value, decimals)
}

/**
 * 格式化变化值（带正负号和颜色）
 * @param value 变化值
 * @param isPercentage 是否为百分比
 * @returns { text: string, color: string, direction: 'up' | 'down' | 'flat' }
 */
export function formatChange(
  value: number | null | undefined,
  isPercentage = false
): {
  text: string
  color: string
  direction: 'up' | 'down' | 'flat'
} {
  if (value === null || value === undefined || isNaN(value)) {
    return { text: '-', color: 'text-slate-500', direction: 'flat' }
  }

  const absValue = Math.abs(value)
  const integerValue = Math.round(absValue)
  const formattedValue = isPercentage
    ? `${absValue.toFixed(2)}%`
    : formatNumber(integerValue, 0)

  if (value > 0) {
    return {
      text: `+${formattedValue}`,
      color: 'text-green-600',
      direction: 'up',
    }
  } else if (value < 0) {
    return {
      text: `-${formattedValue}`,
      color: 'text-red-600',
      direction: 'down',
    }
  } else {
    return {
      text: formattedValue,
      color: 'text-slate-500',
      direction: 'flat',
    }
  }
}

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
