/**
 * 百分比格式化工具
 */

/**
 * 格式化百分比
 * @param value 数值（0-100）
 * @param decimals 小数位数（默认2）
 * @returns 格式化后的字符串（带%符号）
 *
 * @example
 * formatPercent(12.34) // "12.34%"
 * formatPercent(12.34567, 1) // "12.3%"
 * formatPercent(null) // "-"
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
 * 格式化百分比（从小数转换）
 * @param value 小数值（0-1）
 * @param decimals 小数位数（默认2）
 * @returns 格式化后的字符串（带%符号）
 *
 * @example
 * formatPercentFromDecimal(0.1234) // "12.34%"
 * formatPercentFromDecimal(0.1234567, 1) // "12.3%"
 * formatPercentFromDecimal(null) // "-"
 */
export function formatPercentFromDecimal(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  return formatPercent(value * 100, decimals)
}
