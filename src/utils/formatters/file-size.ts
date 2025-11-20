/**
 * 文件大小格式化工具
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数（默认2位）
 * @returns 格式化后的字符串（如 "1.5 MB"）
 *
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536, 1) // "1.5 KB"
 * formatFileSize(0) // "0 B"
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  const size = bytes / Math.pow(k, i)

  return `${size.toFixed(dm)} ${sizes[i]}`
}
