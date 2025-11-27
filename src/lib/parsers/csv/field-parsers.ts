/**
 * CSV 字段解析器
 * 提供各种类型字段的解析和验证
 */

import { logger } from '@/lib/logger'
import { fuzzyMatch, ENUM_MAPPINGS } from '../fuzzy-matcher'

const log = logger.create('FieldParsers')

/**
 * 解析数字字段
 */
export function parseNumber(
  value: unknown,
  fieldName: string,
  errors: string[],
  options: { min?: number; max?: number; integer?: boolean } = {}
): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  // 处理字符串格式的数字，去除空格
  let processedValue = value
  if (typeof value === 'string') {
    processedValue = value.trim()
    if (processedValue === '') {
      return 0
    }
  }

  const num = Number(processedValue)
  if (isNaN(num)) {
    errors.push(`${fieldName}: 无效的数字格式 "${value}"`)
    return 0
  }

  if (options.integer && !Number.isInteger(num)) {
    errors.push(`${fieldName}: 必须是整数，当前值 "${value}"`)
    return Math.round(num)
  }

  if (options.min !== undefined && num < options.min) {
    errors.push(`${fieldName}: 值 ${num} 小于最小值 ${options.min}`)
    return options.min
  }

  if (options.max !== undefined && num > options.max) {
    errors.push(`${fieldName}: 值 ${num} 大于最大值 ${options.max}`)
    return options.max
  }

  return num
}

/**
 * 解析枚举值 - 支持值映射转换、模糊匹配和空值处理
 */
export function parseEnum<T extends string>(
  value: unknown,
  validValues: T[],
  defaultValue: T,
  enumKey?: string
): T {
  const str = String(value || '').trim()

  // 如果是空值，直接返回默认值
  if (!str) {
    return defaultValue
  }

  // 1. 精确匹配
  if (validValues.includes(str as T)) {
    return str as T
  }

  // 2. 检查预定义的映射规则
  if (enumKey) {
    const mapping = ENUM_MAPPINGS[enumKey]
    if (mapping && mapping[str]) {
      const mapped = mapping[str]
      if (validValues.includes(mapped as T)) {
        return mapped as T
      }
    }
  }

  // 3. 模糊匹配（相似度阈值60%）
  const fuzzyResult = fuzzyMatch(str, validValues, 0.6)
  if (fuzzyResult) {
    log.debug('智能纠错', {
      original: str,
      corrected: fuzzyResult.value,
      similarity: (fuzzyResult.score * 100).toFixed(1) + '%',
    })
    return fuzzyResult.value
  }

  // 4. 都失败了，返回默认值
  log.warn('枚举解析警告：无法匹配，使用默认值', { value: str, defaultValue })
  return defaultValue
}

/**
 * 解析可选枚举值 - 允许空值，支持模糊匹配
 */
export function parseOptionalEnum<T extends string>(
  value: unknown,
  validValues: T[],
  enumKey?: string
): T | undefined {
  const str = String(value || '').trim()

  // 如果是空值，返回 undefined
  if (!str) {
    return undefined
  }

  // 1. 精确匹配
  if (validValues.includes(str as T)) {
    return str as T
  }

  // 2. 检查预定义的映射规则
  if (enumKey) {
    const mapping = ENUM_MAPPINGS[enumKey]
    if (mapping && mapping[str]) {
      const mapped = mapping[str]
      if (validValues.includes(mapped as T)) {
        return mapped as T
      }
    }
  }

  // 3. 模糊匹配（相似度阈值60%）
  const fuzzyResult = fuzzyMatch(str, validValues, 0.6)
  if (fuzzyResult) {
    log.debug('智能纠错', {
      original: str,
      corrected: fuzzyResult.value,
      similarity: (fuzzyResult.score * 100).toFixed(1) + '%',
    })
    return fuzzyResult.value
  }

  // 4. 都失败了，返回 undefined
  log.warn('可选枚举解析警告：无法匹配，返回 undefined', { value: str })
  return undefined
}

/**
 * 解析布尔值 - 支持多种格式
 */
export function parseBoolean(
  value: unknown,
  fieldName: string,
  warnings: string[]
): boolean {
  if (typeof value === 'boolean') return value
  const raw = String(value || '').trim()

  // 严格规范：首字母大写 True/False
  if (raw === 'True') return true
  if (raw === 'False') return false

  const normalized = raw.toLowerCase()
  const truthy = ['true', '1', 'yes', 'y', '是']
  const falsy = ['false', '0', 'no', 'n', '否']

  if (truthy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 True 处理`)
    return true
  }
  if (falsy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 False 处理`)
    return false
  }

  warnings.push(`${fieldName}: 无效布尔值 "${raw}"，已默认 False`)
  return false
}
