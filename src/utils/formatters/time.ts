/**
 * 时间格式化工具
 */

/**
 * 格式化时间长度（毫秒）
 * @param ms 毫秒数
 * @returns 格式化后的字符串
 *
 * @example
 * formatTime(500) // "500ms"
 * formatTime(1500) // "1.5s"
 * formatTime(65000) // "1m 5s"
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * 格式化日期时间
 * @param date 日期对象或日期字符串
 * @param format 格式（可选）
 * @returns 格式化后的字符串
 *
 * @example
 * formatDateTime(new Date()) // "2025-01-19 14:30:00"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期（不含时间）
 * @param date 日期对象或日期字符串
 * @returns 格式化后的字符串
 *
 * @example
 * formatDate(new Date()) // "2025-01-19"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
