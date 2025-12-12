/**
 * 数据处理相关工具函数
 */

import { InsuranceRecord, FilterState } from '@/types/insurance'
import { normalizeInsuranceData as normalizeDataFromDomain } from '@/domain/rules/data-normalization'
import { InsuranceRecord as DomainInsuranceRecord } from '@/domain'

/**
 * 规范化保险数据（委托给Domain层）
 * @param data 原始数据
 * @returns 规范化后的数据
 */
export function normalizeInsuranceData(
  data: InsuranceRecord[]
): InsuranceRecord[] {
  // 1. 转换为 domain 类
  const domainRecords = data.map(r => DomainInsuranceRecord.fromRawData(r))
  // 2. 规范化
  const normalized = normalizeDataFromDomain(domainRecords)
  // 3. 转回 interface（类型断言处理兼容性）
  return normalized.map(r => r.toRawData()) as InsuranceRecord[]
}

export function getInitialFilters(
  normalizedData: InsuranceRecord[],
  currentFilters: FilterState
): FilterState {
  const weekNumbers = Array.from(
    new Set(normalizedData.map(r => r.week_number))
  ).sort((a, b) => b - a)

  const latestWeek = weekNumbers.length > 0 ? weekNumbers[0] : null

  return {
    ...currentFilters,
    years: Array.from(
      new Set(normalizedData.map(r => r.policy_start_year))
    ).sort((a, b) => b - a),
    weeks: latestWeek ? [latestWeek] : [],
    singleModeWeek: latestWeek,
    trendModeWeeks: latestWeek ? [latestWeek] : [],
  }
}
