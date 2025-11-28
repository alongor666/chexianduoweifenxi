/**
 * 日期工具函数
 * 提供周次计算、时间进度计算等功能
 */

/**
 * 计算指定周次的结束日期
 * 规则：第1周从1月1日开始，到第一个周六结束
 *
 * @param year 年份
 * @param weekNumber 周序号（1开始）
 * @returns 该周结束日期（周六）
 *
 * @example
 * getWeekEndDate(2025, 42) => 2025-10-18（周六）
 * getWeekEndDate(2025, 41) => 2025-10-11（周六）
 * getWeekEndDate(2025, 1)  => 2025-01-04（周六）
 */
export function getWeekEndDate(year: number, weekNumber: number): Date {
  // 规则：第1周从1月1日开始，到第一个周六结束
  // 例如：2025年1月1日(周三) ~ 1月4日(周六) = 第1周

  // 使用UTC避免时区问题
  // 1. 创建1月1日（UTC时间）
  const jan1 = new Date(Date.UTC(year, 0, 1)) // 月份从0开始

  // 2. 找到第1周的周六（结束日）
  // 计算1月1日是星期几：0=周日, 1=周一, ..., 6=周六
  const jan1DayOfWeek = jan1.getUTCDay()

  // 从1月1日到本周周六还差几天
  const daysToSaturday = jan1DayOfWeek === 6 ? 0 : (6 - jan1DayOfWeek + 7) % 7

  // 第1周结束日
  const week1End = new Date(Date.UTC(year, 0, 1 + daysToSaturday))

  // 3. 第N周结束日 = 第1周结束日 + (N-1) × 7天
  const weekEnd = new Date(week1End)
  weekEnd.setUTCDate(week1End.getUTCDate() + (weekNumber - 1) * 7)

  return weekEnd
}

/**
 * 计算从年初到指定日期的天数
 * @param date 目标日期
 * @returns 已过天数
 */
export function getDaysFromYearStart(date: Date): number {
  const year = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const diffTime = date.getTime() - yearStart.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * 计算指定周次的时间进度（已过天数占365天的比例）
 * @param year 年份
 * @param weekNumber 周序号
 * @returns 时间进度（0-1之间的小数）
 */
export function getTimeProgressForWeek(
  year: number,
  weekNumber: number
): number {
  const weekEndDate = getWeekEndDate(year, weekNumber)
  const daysPassed = getDaysFromYearStart(weekEndDate)
  return daysPassed / 365
}

/**
 * 计算中国保险业的工作周数（扣除春节和国庆长假）
 * @returns 50周
 */
export const WORKING_WEEKS_PER_YEAR = 50
