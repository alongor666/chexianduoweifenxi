/**
 * 数据处理相关工具函数
 */

import { InsuranceRecord, FilterState } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

export function normalizeInsuranceData(
  data: InsuranceRecord[]
): InsuranceRecord[] {
  return data.map(r => ({
    ...r,
    customer_category_3: normalizeChineseText(r.customer_category_3),
    business_type_category: normalizeChineseText(r.business_type_category),
    third_level_organization: normalizeChineseText(r.third_level_organization),
    terminal_source: normalizeChineseText(r.terminal_source),
  }))
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
