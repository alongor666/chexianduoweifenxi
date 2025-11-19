/**
 * 货币格式化工具
 */

import { formatNumber } from './number'

/**
 * 货币单位类型
 */
export type CurrencyUnit = '元' | '万元' | '亿元'

/**
 * 格式化金额
 * @param value 金额（万元）
 * @param decimals 小数位数（默认0）
 * @param unit 单位（默认"万元"）
 * @returns 格式化后的字符串（带单位）
 *
 * @example
 * formatCurrency(1234) // "1,234 万元"
 * formatCurrency(1234.5, 2) // "1,234.50 万元"
 * formatCurrency(1234, 0, '元') // "1,234 元"
 * formatCurrency(null) // "-"
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals = 0,
  unit: CurrencyUnit = '万元'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  return `${formatNumber(value, decimals)} ${unit}`
}

/**
 * 格式化金额（元）
 * @param value 金额（元）
 * @param decimals 小数位数（默认2）
 * @returns 格式化后的字符串
 *
 * @example
 * formatYuan(12345.67) // "12,345.67 元"
 */
export function formatYuan(
  value: number | null | undefined,
  decimals = 2
): string {
  return formatCurrency(value, decimals, '元')
}

/**
 * 格式化金额（万元）
 * @param value 金额（万元）
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串
 *
 * @example
 * formatWanYuan(1234.5) // "1,234 万元"
 */
export function formatWanYuan(
  value: number | null | undefined,
  decimals = 0
): string {
  return formatCurrency(value, decimals, '万元')
}
