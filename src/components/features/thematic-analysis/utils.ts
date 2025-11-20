/**
 * 主题分析模块 - 工具函数
 */

import type { ComparisonMetrics } from '@/utils/comparison'
import { formatNumber } from '@/utils/formatters'

/**
 * 为指标构建对比数据
 * @param current 当前值
 * @param previous 对比值
 * @param isHigherBetter 是否越高越好
 * @returns 对比指标
 */
export function buildComparisonForMetric(
  current: number | null,
  previous: number | null,
  isHigherBetter: boolean
): ComparisonMetrics {
  if (current === null || previous === null) {
    return {
      current,
      previous,
      absoluteChange: null,
      percentChange: null,
      isBetter: false,
      isWorsened: false,
      direction: 'flat',
    }
  }

  const absoluteChange = current - previous
  const percentChange =
    previous !== 0 ? (absoluteChange / Math.abs(previous)) * 100 : null
  let direction: 'up' | 'down' | 'flat' = 'flat'

  if (absoluteChange > 0) direction = 'up'
  else if (absoluteChange < 0) direction = 'down'

  let isBetter = false
  if (direction === 'up' && isHigherBetter) isBetter = true
  if (direction === 'down' && !isHigherBetter) isBetter = true

  let isWorsened = false
  if (direction === 'up' && !isHigherBetter) isWorsened = true
  if (direction === 'down' && isHigherBetter) isWorsened = true

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    direction,
    isBetter,
    isWorsened,
  }
}

/**
 * 格式化带符号的数值
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatSignedValue(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) {
    return '-'
  }
  const abs = Math.abs(value)
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${formatNumber(abs, decimals)}`
}

/**
 * 将进度值限制在 0-120 范围内
 * @param value 原始进度值
 * @returns 限制后的进度值
 */
export function clampProgress(value: number | null): number {
  if (value === null || Number.isNaN(value)) return 0
  const clamped = Math.min(Math.max(value, 0), 120)
  return clamped
}
