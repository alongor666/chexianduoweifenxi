/**
 * 统一排序工具函数
 *
 * 提供从最差到最好的统一排序逻辑
 * 支持不同数据类型和排序策略
 */

import type { InsuranceRecord } from '@/types/insurance'
import {
  getMetricThresholds,
  sortByThresholdLevel,
  // sortByValue,
  getThresholdLevel,
} from '@/config/thresholds'

// 排序方向枚举
export type SortDirection = 'asc' | 'desc'

// 排序策略枚举
export type SortStrategy = 'value' | 'threshold' | 'alphabetical'

// 排序配置接口
export interface SortConfig {
  key: string
  strategy: SortStrategy
  direction?: SortDirection // 默认根据指标特性自动判断
  nullsFirst?: boolean // null值是否排在前面，默认false
}

// 通用数据点类型
export interface DataPoint {
  key: string
  label: string
  [key: string]: number | string | null
}

/**
 * 获取指标的默认排序方向
 * 根据指标特性决定是升序还是降序
 */
function getDefaultSortDirection(metricKey: string): SortDirection {
  const config = getMetricThresholds(metricKey)
  if (!config) return 'desc'

  // 越高越好的指标用降序，越低越好的指标用升序
  return config.isHigherBetter ? 'desc' : 'asc'
}

/**
 * 处理null值的比较
 */
function compareNullValues(
  a: any,
  b: any,
  nullsFirst: boolean = false
): number | null {
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0
    return nullsFirst ? -1 : 1
  }
  if (b === null || b === undefined) {
    return nullsFirst ? 1 : -1
  }
  return null
}

/**
 * 按数值排序
 */
export function sortByNumericValue<T>(
  items: T[],
  getValue: (item: T) => number | null,
  metricKey: string,
  direction?: SortDirection,
  nullsFirst: boolean = false
): T[] {
  const sortDirection = direction || getDefaultSortDirection(metricKey)

  return [...items].sort((a, b) => {
    // 处理null值
    const nullComparison = compareNullValues(
      getValue(a),
      getValue(b),
      nullsFirst
    )
    if (nullComparison !== null) return nullComparison

    const valueA = getValue(a) as number
    const valueB = getValue(b) as number

    // 根据方向排序
    if (sortDirection === 'desc') {
      return valueB - valueA
    } else {
      return valueA - valueB
    }
  })
}

/**
 * 按阈值等级排序（从最差到最好）
 */
export function sortByThreshold<T>(
  items: T[],
  getValue: (item: T) => number | null,
  metricKey: string,
  _nullsFirst: boolean = false
): T[] {
  return sortByThresholdLevel(items, getValue, metricKey)
}

/**
 * 按字母顺序排序
 */
export function sortByAlphabetical<T>(
  items: T[],
  getValue: (item: T) => string | null,
  direction: SortDirection = 'asc',
  nullsFirst: boolean = false
): T[] {
  return [...items].sort((a, b) => {
    // 处理null值
    const nullComparison = compareNullValues(
      getValue(a),
      getValue(b),
      nullsFirst
    )
    if (nullComparison !== null) return nullComparison

    const valueA = getValue(a) as string
    const valueB = getValue(b) as string

    const comparison = valueA.localeCompare(valueB, 'zh-CN')
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * 通用排序函数
 */
export function sortItems<T>(
  items: T[],
  config: SortConfig,
  getValue: (item: T) => any
): T[] {
  const { strategy, direction, nullsFirst = false } = config

  switch (strategy) {
    case 'value':
      return sortByNumericValue(
        items,
        getValue,
        config.key,
        direction,
        nullsFirst
      )

    case 'threshold':
      return sortByThreshold(items, getValue, config.key, nullsFirst)

    case 'alphabetical':
      return sortByAlphabetical(items, getValue, direction, nullsFirst)

    default:
      return items
  }
}

/**
 * 为保险记录创建排序函数
 */
export function sortInsuranceRecords(
  records: InsuranceRecord[],
  config: SortConfig
): InsuranceRecord[] {
  const getValue = (record: InsuranceRecord) => {
    const value = record[config.key as keyof InsuranceRecord]
    return typeof value === 'number' || value === null ? value : String(value)
  }

  return sortItems(records, config, getValue)
}

/**
 * 为聚合数据创建排序函数
 */
export function sortAggregatedData<T extends DataPoint>(
  data: T[],
  config: SortConfig
): T[] {
  const getValue = (item: T) => {
    const value = item[config.key]
    return typeof value === 'number' || value === null ? value : String(value)
  }

  return sortItems(data, config, getValue)
}

/**
 * 创建多级排序函数
 */
export function createMultiLevelSort<T>(...configs: SortConfig[]) {
  return (items: T[]): T[] => {
    return [...items].sort((a, b) => {
      for (const config of configs) {
        const getValue = (item: T) => {
          const value = (item as any)[config.key]
          return typeof value === 'number' || value === null
            ? value
            : String(value)
        }

        let comparison = 0

        switch (config.strategy) {
          case 'value':
            comparison = compareByValue(getValue(a), getValue(b), config)
            break
          case 'threshold':
            comparison = compareByThreshold(getValue(a), getValue(b), config)
            break
          case 'alphabetical':
            comparison = compareByAlphabetical(getValue(a), getValue(b), config)
            break
        }

        if (comparison !== 0) return comparison
      }
      return 0
    })
  }
}

/**
 * 按数值比较
 */
function compareByValue(a: any, b: any, config: SortConfig): number {
  const nullComparison = compareNullValues(a, b, config.nullsFirst)
  if (nullComparison !== null) return nullComparison

  const valueA = a as number
  const valueB = b as number
  const direction = config.direction || getDefaultSortDirection(config.key)

  if (direction === 'desc') {
    return valueB - valueA
  } else {
    return valueA - valueB
  }
}

/**
 * 按阈值等级比较
 */
function compareByThreshold(a: any, b: any, config: SortConfig): number {
  const nullComparison = compareNullValues(a, b, config.nullsFirst)
  if (nullComparison !== null) return nullComparison

  const levelA = getThresholdLevel(a as number, config.key)
  const levelB = getThresholdLevel(b as number, config.key)

  const priorityA =
    levelA === 'danger'
      ? 1
      : levelA === 'warning'
        ? 2
        : levelA === 'healthy'
          ? 3
          : levelA === 'outstanding'
            ? 4
            : 5

  const priorityB =
    levelB === 'danger'
      ? 1
      : levelB === 'warning'
        ? 2
        : levelB === 'healthy'
          ? 3
          : levelB === 'outstanding'
            ? 4
            : 5

  return priorityA - priorityB
}

/**
 * 按字母顺序比较
 */
function compareByAlphabetical(a: any, b: any, config: SortConfig): number {
  const nullComparison = compareNullValues(a, b, config.nullsFirst)
  if (nullComparison !== null) return nullComparison

  const valueA = a as string
  const valueB = b as string
  const direction = config.direction || 'asc'

  const comparison = valueA.localeCompare(valueB, 'zh-CN')
  return direction === 'desc' ? -comparison : comparison
}

/**
 * 预定义的常用排序配置
 */
export const SORT_CONFIGS = {
  // 按赔付率排序（从高到低，最差的在前）
  lossRatio: {
    key: 'loss_ratio',
    strategy: 'threshold' as SortStrategy,
    nullsFirst: false,
  },

  // 按费用率排序（从高到低，最差的在前）
  expenseRatio: {
    key: 'expense_ratio',
    strategy: 'threshold' as SortStrategy,
    nullsFirst: false,
  },

  // 按时间进度达成率排序（从低到高，最差的在前）
  timeProgress: {
    key: 'time_progress_ratio',
    strategy: 'threshold' as SortStrategy,
    nullsFirst: false,
  },

  // 按变动成本率排序（从高到低，最差的在前）
  variableCost: {
    key: 'variable_cost_ratio',
    strategy: 'threshold' as SortStrategy,
    nullsFirst: false,
  },

  // 按边际贡献率排序（从低到高，最差的在前）
  contributionMargin: {
    key: 'contribution_margin_ratio',
    strategy: 'threshold' as SortStrategy,
    nullsFirst: false,
  },

  // 按机构名称排序（字母顺序）
  organizationName: {
    key: 'organization',
    strategy: 'alphabetical' as SortStrategy,
    direction: 'asc' as SortDirection,
    nullsFirst: false,
  },

  // 按业务类型排序（字母顺序）
  businessType: {
    key: 'business_type',
    strategy: 'alphabetical' as SortStrategy,
    direction: 'asc' as SortDirection,
    nullsFirst: false,
  },
} as const

/**
 * 获取排序配置
 */
export function getSortConfig(metricKey: string): SortConfig | null {
  const configKey = metricKey as keyof typeof SORT_CONFIGS
  return SORT_CONFIGS[configKey] || null
}
