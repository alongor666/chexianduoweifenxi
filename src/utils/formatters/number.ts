/**
 * 数值格式化工具
 */

/**
 * 格式化数字为千分位格式
 * @param value 数值
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.5678, 2) // "1,234.57"
 * formatNumber(null) // "-"
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
 * 格式化整数
 * @param value 数值
 * @returns 格式化后的字符串（千分位）
 *
 * @example
 * formatInteger(1234567) // "1,234,567"
 */
export function formatInteger(value: number | null | undefined): string {
  return formatNumber(value, 0)
}

/**
 * 格式化小数
 * @param value 数值
 * @param decimals 小数位数（默认3位）
 * @returns 格式化后的字符串
 *
 * @example
 * formatDecimal(1234.5678) // "1,234.568"
 * formatDecimal(1234.5678, 2) // "1,234.57"
 */
export function formatDecimal(
  value: number | null | undefined,
  decimals = 3
): string {
  return formatNumber(value, decimals)
}
