/**
 * 环比计算工具
 * 用于计算KPI的环比变化、判断变化方向的好坏
 */

import type { KPIResult } from '@/types/insurance'

export interface ComparisonMetrics {
  current: number | null
  previous: number | null
  absoluteChange: number | null
  percentChange: number | null
  isBetter: boolean
  isWorsened: boolean
  direction: 'up' | 'down' | 'flat'
}

/**
 * 定义每个KPI指标的"好"的方向
 * true = 数值越高越好
 * false = 数值越低越好
 */
const KPI_BETTER_DIRECTION: Record<string, boolean> = {
  // 保费相关 - 越高越好
  premium_written: true,
  matured_premium: true,
  policy_count: true,
  avg_premium_per_policy: true,
  premium_achievement_rate: true,
  premium_time_progress_achievement_rate: true,

  // 边际贡献相关 - 越高越好
  contribution_margin_rate: true,
  contribution_margin_amount: true,
  avg_contribution_per_policy: true,

  // 赔付相关 - 越低越好
  loss_ratio: false,
  incurred_loss: false,
  reported_claim_payment: false,
  claim_case_count: false,
  avg_claim_per_case: false,
  average_claim: false,
  incurred_loss_rate: false,

  // 成本相关 - 越低越好
  expense_ratio: false,
  variable_cost_ratio: false,
  expense_amount: false,
  avg_expense_per_policy: false,

  // 其他比率 - 根据具体业务定义
  maturity_rate: true,
  new_energy_ratio: true,
  commercial_autonomy_coefficient: true,
}

/**
 * 获取环比计算结果
 * @param kpiId KPI指标ID
 * @param currentKpis 当前期的KPI数据
 * @param previousKpis 对比期的KPI数据
 * @returns ComparisonMetrics 环比指标对象
 */
export function getComparisonMetrics(
  kpiId: keyof KPIResult,
  currentKpis: KPIResult | null | undefined,
  previousKpis: KPIResult | null | undefined
): ComparisonMetrics {
  // 安全获取数值
  const current = currentKpis?.[kpiId] ?? null
  const previous = previousKpis?.[kpiId] ?? null

  // 如果任一数据缺失，返回空结果
  if (current === null || previous === null) {
    return {
      current,
      previous,
      absoluteChange: null,
      percentChange: null,
      isBetter: false,
      isWorsened: false,
      direction: 'flat',
    }
  }

  // 计算绝对变化和百分比变化
  const absoluteChange = current - previous
  const percentChange =
    previous !== 0 ? (absoluteChange / Math.abs(previous)) * 100 : null

  // 判断变化方向
  let direction: 'up' | 'down' | 'flat' = 'flat'
  if (absoluteChange > 0) direction = 'up'
  else if (absoluteChange < 0) direction = 'down'

  // 判断该指标的"好"方向（默认为越高越好）
  const isHigherBetter = KPI_BETTER_DIRECTION[kpiId] ?? true

  // 判断是否向好
  let isBetter = false
  if (direction === 'up' && isHigherBetter) isBetter = true
  if (direction === 'down' && !isHigherBetter) isBetter = true

  // 判断是否恶化
  let isWorsened = false
  if (direction === 'up' && !isHigherBetter) isWorsened = true
  if (direction === 'down' && isHigherBetter) isWorsened = true

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    isBetter,
    isWorsened,
    direction,
  }
}

/**
 * 批量计算多个业务线的环比指标
 * @param kpiId KPI指标ID
 * @param currentData 当前期的业务线数据数组
 * @param previousData 对比期的业务线数据数组
 * @param dimensionKey 业务维度key（如 'business_type'）
 * @returns 环比指标数组，按绝对变化值降序排序
 */
export function getBatchComparisonMetrics(
  kpiId: keyof KPIResult,
  currentData: Array<{ dimension: string; kpis: KPIResult }>,
  previousData: Array<{ dimension: string; kpis: KPIResult }>
): Array<{ dimension: string; comparison: ComparisonMetrics }> {
  const results: Array<{ dimension: string; comparison: ComparisonMetrics }> =
    []

  // 创建对比期数据的快速查找Map
  const previousMap = new Map<string, KPIResult>()
  previousData.forEach(item => {
    previousMap.set(item.dimension, item.kpis)
  })

  // 遍历当前期数据，计算环比
  currentData.forEach(currentItem => {
    const previousKpis = previousMap.get(currentItem.dimension)
    const comparison = getComparisonMetrics(
      kpiId,
      currentItem.kpis,
      previousKpis
    )

    results.push({
      dimension: currentItem.dimension,
      comparison,
    })
  })

  // 按绝对变化值排序（降序，绝对值最大的排前面）
  results.sort((a, b) => {
    const absA = Math.abs(a.comparison.absoluteChange ?? 0)
    const absB = Math.abs(b.comparison.absoluteChange ?? 0)
    return absB - absA
  })

  return results
}

/**
 * 格式化环比变化文本
 * @param comparison 环比指标对象
 * @param isPercentage 是否显示为百分比（true）还是绝对值（false）
 * @returns 格式化后的文本，如 "+12.5%" 或 "-3,500"
 */
export function formatComparisonChange(
  comparison: ComparisonMetrics,
  isPercentage = true
): string {
  if (comparison.absoluteChange === null) return '-'

  const value = isPercentage
    ? comparison.percentChange
    : comparison.absoluteChange

  if (value === null) return '-'

  const sign = value >= 0 ? '+' : ''
  const formattedValue = isPercentage
    ? `${value.toFixed(2)}%`
    : Math.round(value).toLocaleString('zh-CN')

  return `${sign}${formattedValue}`
}

/**
 * 获取环比变化的色彩类名
 * @param comparison 环比指标对象
 * @returns Tailwind 色彩类名
 */
export function getComparisonColor(comparison: ComparisonMetrics): string {
  if (comparison.absoluteChange === null) return 'text-slate-500'

  if (comparison.isBetter) return 'text-green-600'
  if (comparison.isWorsened) return 'text-red-600'
  return 'text-slate-600'
}
