import { getBusinessTypeShortLabelByCode } from '@/constants/dimensions'
import type { FilterState } from '@/types/insurance'

export function createWeekScopedFilters(
  baseFilters: FilterState,
  year: number,
  week: number
): FilterState {
  return {
    ...baseFilters,
    years: [year],
    weeks: [week],
    trendModeWeeks: week > 0 ? [week] : [],
    singleModeWeek: week > 0 ? week : null,
  }
}

export function describeFilters(filters: FilterState): string {
  const parts: string[] = []
  if (filters.years?.length) {
    parts.push(`年度=${filters.years.map(String).join('、')}`)
  }
  if (filters.organizations?.length) {
    parts.push(`机构=${filters.organizations.join('、')}`)
  }
  if (filters.businessTypes?.length) {
    // 业务类型为代码值，展示中文简称
    parts.push(
      `业务类型=${filters.businessTypes
        .map(code => getBusinessTypeShortLabelByCode(code as any))
        .join('、')}`
    )
  }
  if (filters.coverageTypes?.length) {
    parts.push(`险别=${filters.coverageTypes.join('、')}`)
  }
  if (filters.insuranceTypes?.length) {
    parts.push(`保险类别=${filters.insuranceTypes.join('、')}`)
  }
  if (filters.customerCategories?.length) {
    parts.push(`客户分类=${filters.customerCategories.join('、')}`)
  }
  if (filters.vehicleGrades?.length) {
    parts.push(`车险评级=${filters.vehicleGrades.join('、')}`)
  }
  if (filters.renewalStatuses?.length) {
    parts.push(`新续转=${filters.renewalStatuses.join('、')}`)
  }
  if (filters.isNewEnergy !== null && filters.isNewEnergy !== undefined) {
    parts.push(`新能源=${filters.isNewEnergy ? '是' : '否'}`)
  }
  if (filters.terminalSources?.length) {
    parts.push(`渠道=${filters.terminalSources.join('、')}`)
  }
  if (parts.length === 0) {
    return '筛选条件：全部业务'
  }
  return `筛选条件：${parts.join(' | ')}`
}
