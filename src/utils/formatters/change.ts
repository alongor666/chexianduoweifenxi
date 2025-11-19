/**
 * 变化值格式化工具
 */

import { formatNumber } from './number'

/**
 * 变化方向
 */
export type ChangeDirection = 'up' | 'down' | 'flat'

/**
 * 变化值格式化结果
 */
export interface FormattedChange {
  /** 格式化后的文本 */
  text: string
  /** 颜色类名 */
  color: string
  /** 变化方向 */
  direction: ChangeDirection
}

/**
 * 格式化变化值（带正负号和颜色）
 * @param value 变化值
 * @param isPercentage 是否为百分比
 * @returns 格式化结果对象
 *
 * @example
 * formatChange(100) // { text: "+100", color: "text-green-600", direction: "up" }
 * formatChange(-50) // { text: "-50", color: "text-red-600", direction: "down" }
 * formatChange(0) // { text: "0", color: "text-slate-500", direction: "flat" }
 * formatChange(12.5, true) // { text: "+12.50%", color: "text-green-600", direction: "up" }
 */
export function formatChange(
  value: number | null | undefined,
  isPercentage = false
): FormattedChange {
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
