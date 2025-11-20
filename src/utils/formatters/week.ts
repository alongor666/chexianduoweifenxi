/**
 * 周次格式化工具
 */

/**
 * 格式化周次范围
 * @param week 周次
 * @param year 年份
 * @returns 格式化后的字符串
 *
 * @example
 * formatWeekRange(1, 2025) // "2025年第1周"
 * formatWeekRange(52, 2024) // "2024年第52周"
 */
export function formatWeekRange(week: number, year: number): string {
  return `${year}年第${week}周`
}

/**
 * 格式化周次（简短版）
 * @param week 周次
 * @param year 年份（可选）
 * @returns 格式化后的字符串
 *
 * @example
 * formatWeek(1) // "第1周"
 * formatWeek(1, 2025) // "2025W1"
 */
export function formatWeek(week: number, year?: number): string {
  if (year) {
    return `${year}W${week}`
  }
  return `第${week}周`
}
