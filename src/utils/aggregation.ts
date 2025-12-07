import {
  getBusinessTypeCode,
  getBusinessTypeShortLabelByCode,
} from '@/constants/dimensions'
import type { InsuranceRecord } from '@/types/insurance'

/**
 * 维度类型
 */
export type Dimension = 'business_type' | 'organization' | 'coverage_type'

/**
 * 从记录中获取维度的键值
 *
 * @param record 保险记录
 * @param dimension 维度类型
 * @returns 维度键值
 */
export function getDimensionKey(
  record: InsuranceRecord,
  dimension: Dimension
): string {
  switch (dimension) {
    case 'business_type':
      return getBusinessTypeCode(record.business_type_category || '')
    case 'organization':
      return record.third_level_organization || '未知'
    case 'coverage_type':
      return record.coverage_type || '未知'
  }
}

/**
 * 从维度键值获取显示标签
 *
 * @param key 维度键值
 * @param dimension 维度类型
 * @returns 显示标签
 */
export function getDimensionLabel(key: string, dimension: Dimension): string {
  if (dimension === 'business_type') {
    return getBusinessTypeShortLabelByCode(key as any)
  }
  return key
}

/**
 * 通用聚合函数生成器
 *
 * @param aggregator 聚合器函数，接收累加器和记录，返回更新后的累加器
 * @param transformer 转换器函数，将累加器转换为最终数据点
 * @returns 聚合函数
 */
export function createAggregator<T, R>(
  aggregator: (acc: T, record: InsuranceRecord) => T,
  transformer: (key: string, label: string, acc: T) => R
) {
  return (data: InsuranceRecord[], dimension: Dimension): R[] => {
    const map = new Map<string, T>()

    for (const record of data) {
      const key = getDimensionKey(record, dimension)

      if (!map.has(key)) {
        map.set(key, {} as T)
      }

      const acc = map.get(key)!
      map.set(key, aggregator(acc, record))
    }

    return Array.from(map.entries()).map(([key, acc]) => {
      const label = getDimensionLabel(key, dimension)
      return transformer(key, label, acc)
    })
  }
}
