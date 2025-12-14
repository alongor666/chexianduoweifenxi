/**
 * 趋势图表工具函数
 *
 * 包含趋势分析中使用的计算和格式化工具函数
 */

/**
 * 计算相对变化率
 *
 * @param current - 当前值
 * @param base - 基准值
 * @returns 相对变化率（小数形式），如果无法计算则返回 null
 *
 * @example
 * calcRelativeChange(110, 100) // 返回 0.1 (即 10%)
 * calcRelativeChange(90, 100)  // 返回 -0.1 (即 -10%)
 */
export function calcRelativeChange(
  current: number | null,
  base: number | null
): number | null {
  if (
    current === null ||
    base === null ||
    Number.isNaN(current) ||
    Number.isNaN(base) ||
    base === 0
  ) {
    return null
  }
  return (current - base) / base
}

/**
 * 计算绝对差值
 *
 * @param current - 当前值
 * @param base - 基准值
 * @returns 绝对差值，如果无法计算则返回 null
 *
 * @example
 * calcDifference(65.5, 60.0) // 返回 5.5
 * calcDifference(55.0, 60.0) // 返回 -5.0
 */
export function calcDifference(
  current: number | null,
  base: number | null
): number | null {
  if (
    current === null ||
    base === null ||
    Number.isNaN(current) ||
    Number.isNaN(base)
  ) {
    return null
  }
  return current - base
}

/**
 * 格式化差值显示
 *
 * @param change - 变化值
 * @param mode - 格式化模式
 *   - 'relative': 相对变化率（百分比）
 *   - 'absolutePercent': 绝对百分点差值
 * @param digits - 保留小数位数，默认为 1
 * @returns 格式化后的字符串
 *
 * @example
 * formatDelta(0.15, 'relative', 1)        // 返回 "+15.0%"
 * formatDelta(-0.08, 'relative', 1)       // 返回 "-8.0%"
 * formatDelta(5.5, 'absolutePercent', 1)  // 返回 "+5.5pp"
 * formatDelta(null, 'relative', 1)        // 返回 "—"
 */
export function formatDelta(
  change: number | null,
  mode: 'relative' | 'absolutePercent',
  digits = 1
): string {
  if (change === null || Number.isNaN(change)) return '—'
  const sign = change > 0 ? '+' : change < 0 ? '-' : ''

  if (mode === 'relative') {
    return `${sign}${Math.abs(change * 100).toFixed(digits)}%`
  }

  return `${sign}${Math.abs(change).toFixed(digits)}pp`
}

/**
 * 获取差值对应的样式类名
 *
 * @param change - 变化值
 * @param inverse - 是否反转颜色逻辑（默认 false）
 *   - false: 正值为绿色（好），负值为红色（坏）
 *   - true: 正值为红色（坏），负值为绿色（好）
 * @returns Tailwind CSS 类名
 *
 * @example
 * getDeltaClass(0.15, false)  // 返回 'text-emerald-600' (增长是好事)
 * getDeltaClass(5.5, true)    // 返回 'text-rose-500' (赔付率上升是坏事)
 * getDeltaClass(null, false)  // 返回 'text-slate-500'
 */
export function getDeltaClass(change: number | null, inverse = false): string {
  if (change === null || Number.isNaN(change) || change === 0) {
    return 'text-slate-500'
  }
  const isPositive = change > 0
  const isGood = inverse ? !isPositive : isPositive
  return isGood ? 'text-emerald-600' : 'text-rose-500'
}
