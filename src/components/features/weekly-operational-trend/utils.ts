/**
 * 周度经营趋势分析 - 工具函数
 *
 * 提供数据处理、统计计算、格式化等基础工具函数。
 */

import type { FilterState, InsuranceRecord } from '@/types/insurance'
import { formatNumber } from '@/utils/formatters'
import type {
  ChartDataPoint,
  DimensionHighlight,
  TotalsAggregation,
  DimensionAccumulator,
} from './types'

/**
 * 计算线性趋势线数据
 *
 * 使用最小二乘法对赔付率数据进行线性回归，生成趋势线。
 *
 * @param data - 图表数据点数组
 * @returns 趋势线数据数组（与输入数据点一一对应）
 */
export function calculateTrendLine(data: ChartDataPoint[]): number[] {
  const lossRatios = data
    .map((d) => d.lossRatio)
    .filter((v): v is number => v !== null)

  if (lossRatios.length < 2) return []

  // 最小二乘法计算线性回归
  const n = lossRatios.length
  const sumX = lossRatios.reduce((sum, _, i) => sum + i, 0)
  const sumY = lossRatios.reduce((sum, v) => sum + v, 0)
  const sumXY = lossRatios.reduce((sum, v, i) => sum + v * i, 0)
  const sumX2 = lossRatios.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return data.map((_, i) => slope * i + intercept)
}

/**
 * 格式化百分点变化
 *
 * 将数值格式化为带正负号的百分点字符串（如 "+2.5pp" 或 "-1.2pp"）。
 *
 * @param value - 变化值（百分点）
 * @param decimals - 小数位数，默认 1
 * @returns 格式化后的字符串，如果值为 null 或 NaN 则返回 null
 */
export function formatDeltaPercentPoint(
  value: number | null,
  decimals = 1
): string | null {
  if (value === null || Number.isNaN(value)) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}pp`
}

/**
 * 格式化金额变化（万元）
 *
 * 将金额变化值转换为易读的中文描述（如 "增加 123.5 万元"）。
 *
 * @param value - 变化值（万元）
 * @param decimals - 小数位数，默认 1
 * @returns 格式化后的字符串，如果值为 null 或 NaN 则返回 null
 */
export function formatDeltaAmountWan(value: number | null, decimals = 1): string | null {
  if (value === null || Number.isNaN(value)) return null
  const direction = value >= 0 ? '增加' : '减少'
  return `${direction} ${formatNumber(Math.abs(value), decimals)} 万元`
}

/**
 * 创建特定周的筛选条件
 *
 * 基于基础筛选条件，叠加指定年份和周次的筛选。
 *
 * @param baseFilters - 基础筛选条件
 * @param year - 目标年份
 * @param week - 目标周次
 * @returns 新的筛选条件对象
 */
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

/**
 * 描述筛选条件
 *
 * 将筛选条件对象转换为人类可读的中文字符串。
 *
 * @param filters - 筛选条件对象
 * @returns 筛选条件描述字符串
 */
export function describeFilters(filters: FilterState): string {
  const parts: string[] = []
  if (filters.years?.length) {
    parts.push(`年度=${filters.years.map(String).join('、')}`)
  }
  if (filters.organizations?.length) {
    parts.push(`机构=${filters.organizations.join('、')}`)
  }
  if (filters.businessTypes?.length) {
    parts.push(`业务类型=${filters.businessTypes.join('、')}`)
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

/**
 * 聚合总计数据
 *
 * 对保险记录数组进行汇总，计算各项核心指标的总和。
 *
 * @param records - 保险记录数组
 * @returns 总计聚合数据
 */
export function aggregateTotals(records: InsuranceRecord[]): TotalsAggregation {
  return records.reduce<TotalsAggregation>(
    (acc, record) => {
      acc.signedPremiumYuan += record.signed_premium_yuan
      acc.maturedPremiumYuan += record.matured_premium_yuan
      acc.claimPaymentYuan += record.reported_claim_payment_yuan
      acc.claimCaseCount += record.claim_case_count
      return acc
    },
    {
      signedPremiumYuan: 0,
      maturedPremiumYuan: 0,
      claimPaymentYuan: 0,
      claimCaseCount: 0,
    }
  )
}

/**
 * 计算赔付率
 *
 * 根据总计数据计算赔付率（赔款 / 满期保费 × 100）。
 *
 * @param totals - 总计聚合数据
 * @returns 赔付率（%），如果满期保费为0则返回 null
 */
export function computeLossRatio(totals: TotalsAggregation): number | null {
  if (totals.maturedPremiumYuan <= 0) return null
  return (totals.claimPaymentYuan / totals.maturedPremiumYuan) * 100
}

/**
 * 格式化筛选值列表
 *
 * 将字符串数组格式化为中文列表字符串，超过最大长度时添加"等"。
 *
 * @param values - 字符串数组
 * @param maxLength - 最大显示数量，默认 3
 * @returns 格式化后的列表字符串
 */
export function formatFilterList(values: string[], maxLength = 3): string {
  const unique = Array.from(new Set(values.filter(Boolean)))
  if (unique.length === 0) return '—'
  const sliced = unique.slice(0, maxLength)
  const suffix = unique.length > maxLength ? '等' : ''
  return `${sliced.join('、')}${suffix}`
}

/**
 * 清理文本
 *
 * 对输入文本进行清理，移除空白字符，如果为空则返回后备值。
 *
 * @param value - 输入文本
 * @param fallback - 后备值
 * @returns 清理后的文本或后备值
 */
export function sanitizeText(value: string | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/**
 * 选取最高值的标签
 *
 * 从 Map 中找出值最大的键。
 *
 * @param claims - 标签 → 数值的映射
 * @returns 值最大的标签，如果 Map 为空则返回 null
 */
export function pickTopLabel(claims: Map<string, number>): string | null {
  let topLabel: string | null = null
  let topValue = Number.NEGATIVE_INFINITY
  claims.forEach((value, label) => {
    if (value > topValue) {
      topValue = value
      topLabel = label
    }
  })
  return topLabel
}

/**
 * 构建维度高亮数据
 *
 * 分析当前和上一周期的保险记录，按业务类型或机构维度生成风险高亮信息。
 *
 * @param dimension - 分析维度（'business' 或 'organization'）
 * @param currentRecords - 当前周期的保险记录
 * @param previousRecords - 上一周期的保险记录
 * @returns 维度高亮数据数组（按风险程度降序排列）
 */
export function buildDimensionHighlights(
  dimension: 'business' | 'organization',
  currentRecords: InsuranceRecord[],
  previousRecords: InsuranceRecord[]
): DimensionHighlight[] {
  const map = new Map<string, DimensionAccumulator>()

  const ensureAccumulator = (key: string, label: string): DimensionAccumulator => {
    if (!map.has(key)) {
      map.set(key, {
        label,
        currentMatured: 0,
        currentClaim: 0,
        previousMatured: 0,
        previousClaim: 0,
        coverageClaims: new Map(),
        partnerClaims: new Map(),
      })
    }
    return map.get(key)!
  }

  const getKeyAndLabel = (record: InsuranceRecord): { key: string; label: string } => {
    if (dimension === 'business') {
      const label = sanitizeText(record.business_type_category, '未标记业务')
      return { key: label, label }
    }
    const label = sanitizeText(record.third_level_organization, '未标记机构')
    return { key: label, label }
  }

  const getPartnerLabel = (record: InsuranceRecord): string => {
    if (dimension === 'business') {
      return sanitizeText(record.third_level_organization, '未标记机构')
    }
    return sanitizeText(record.business_type_category, '未标记业务')
  }

  currentRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.currentMatured += record.matured_premium_yuan
    accumulator.currentClaim += record.reported_claim_payment_yuan

    const coverageLabel = sanitizeText(record.coverage_type, '未标记险别')
    accumulator.coverageClaims.set(
      coverageLabel,
      (accumulator.coverageClaims.get(coverageLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )

    const partnerLabel = getPartnerLabel(record)
    accumulator.partnerClaims.set(
      partnerLabel,
      (accumulator.partnerClaims.get(partnerLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )
  })

  previousRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.previousMatured += record.matured_premium_yuan
    accumulator.previousClaim += record.reported_claim_payment_yuan
  })

  const highlights: DimensionHighlight[] = []

  map.forEach((accumulator, key) => {
    const currentMatured = accumulator.currentMatured
    const currentClaim = accumulator.currentClaim
    const previousMatured = accumulator.previousMatured
    const previousClaim = accumulator.previousClaim

    if (currentMatured <= 0 && currentClaim <= 0 && previousMatured <= 0 && previousClaim <= 0) {
      return
    }

    let lossRatio: number | null = null
    if (currentMatured > 0 && currentClaim >= 0) {
      lossRatio = (currentClaim / currentMatured) * 100
    }

    let previousLossRatio: number | null = null
    if (previousMatured > 0 && previousClaim >= 0) {
      previousLossRatio = (previousClaim / previousMatured) * 100
    }

    const lossRatioChange =
      lossRatio !== null && previousLossRatio !== null
        ? lossRatio - previousLossRatio
        : null

    const claimPaymentWan = currentClaim / 10000
    const claimPaymentChangeWan =
      currentClaim - previousClaim !== 0
        ? (currentClaim - previousClaim) / 10000
        : null

    const topCoverage = pickTopLabel(accumulator.coverageClaims)
    const topPartner = pickTopLabel(accumulator.partnerClaims)

    highlights.push({
      key,
      label: accumulator.label,
      lossRatio,
      lossRatioChange,
      claimPaymentWan,
      claimPaymentChangeWan,
      topCoverage,
      topPartner,
    })
  })

  const valueOf = (value: number | null | undefined): number =>
    value === null || value === undefined ? Number.NEGATIVE_INFINITY : value

  highlights.sort((a, b) => {
    const changeDiff = valueOf(b.lossRatioChange) - valueOf(a.lossRatioChange)
    if (changeDiff !== 0 && Number.isFinite(changeDiff)) {
      return changeDiff
    }

    const ratioDiff = valueOf(b.lossRatio) - valueOf(a.lossRatio)
    if (ratioDiff !== 0 && Number.isFinite(ratioDiff)) {
      return ratioDiff
    }

    return b.claimPaymentWan - a.claimPaymentWan
  })

  return highlights
}

/**
 * 格式化周次列表
 *
 * 将周次数字数组格式化为中文描述（如 "第1周、第2周、第3周"）。
 *
 * @param weeks - 周次数字数组
 * @returns 格式化后的周次列表字符串
 */
export function formatWeekList(weeks: number[]): string {
  if (weeks.length === 0) return ''
  return weeks.map((week) => `第${week}周`).join('、')
}
