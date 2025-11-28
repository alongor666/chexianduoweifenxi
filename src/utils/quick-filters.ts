/**
 * 快捷筛选工具函数
 * 用于根据保费、赔付率等动态生成机构筛选
 */

import type { KPIResult } from '@/types/insurance'
import type { QuickFilter } from './organization-config'
import { STATIC_QUICK_FILTERS } from './organization-config'

/**
 * 保费分档阈值（元）
 */
const PREMIUM_TIERS = {
  high: 50_000_000, // 5000万
  medium: 20_000_000, // 2000万
} as const

/**
 * 赔付率分档阈值
 */
const LOSS_RATIO_TIERS = {
  high: 0.7, // 70%
  low: 0.5, // 50%
} as const

/**
 * 动态快捷筛选类型
 */
export type DynamicFilterType =
  | 'high_premium'
  | 'medium_premium'
  | 'low_premium'
  | 'high_loss_ratio'
  | 'low_loss_ratio'

/**
 * 根据机构KPI数据生成动态快捷筛选
 * @param orgKPIs 机构名称到KPI的映射
 * @returns 动态快捷筛选列表
 */
export function generateDynamicQuickFilters(
  orgKPIs: Map<string, KPIResult | null>
): QuickFilter[] {
  const filters: QuickFilter[] = []

  // 保费分档
  const highPremiumOrgs: string[] = []
  const mediumPremiumOrgs: string[] = []
  const lowPremiumOrgs: string[] = []

  // 赔付率分档
  const highLossRatioOrgs: string[] = []
  const lowLossRatioOrgs: string[] = []

  // 遍历所有机构的KPI
  orgKPIs.forEach((kpi, orgName) => {
    if (!kpi) return

    // 保费分档
    const premium = kpi.totalPremium || 0
    if (premium > PREMIUM_TIERS.high) {
      highPremiumOrgs.push(orgName)
    } else if (premium > PREMIUM_TIERS.medium) {
      mediumPremiumOrgs.push(orgName)
    } else {
      lowPremiumOrgs.push(orgName)
    }

    // 赔付率分档
    const lossRatio = kpi.lossRatio
    if (lossRatio !== null && lossRatio !== undefined) {
      if (lossRatio > LOSS_RATIO_TIERS.high) {
        highLossRatioOrgs.push(orgName)
      } else if (lossRatio < LOSS_RATIO_TIERS.low) {
        lowLossRatioOrgs.push(orgName)
      }
    }
  })

  // 高保费机构
  if (highPremiumOrgs.length > 0) {
    filters.push({
      id: 'high_premium',
      label: '高保费',
      icon: '💰',
      description: `保费 > 5000万 (${highPremiumOrgs.length}个机构)`,
      organizations: highPremiumOrgs,
    })
  }

  // 中保费机构
  if (mediumPremiumOrgs.length > 0) {
    filters.push({
      id: 'medium_premium',
      label: '中保费',
      icon: '💵',
      description: `2000万 < 保费 ≤ 5000万 (${mediumPremiumOrgs.length}个机构)`,
      organizations: mediumPremiumOrgs,
    })
  }

  // 低保费机构
  if (lowPremiumOrgs.length > 0) {
    filters.push({
      id: 'low_premium',
      label: '低保费',
      icon: '💴',
      description: `保费 ≤ 2000万 (${lowPremiumOrgs.length}个机构)`,
      organizations: lowPremiumOrgs,
    })
  }

  // 高赔付率机构
  if (highLossRatioOrgs.length > 0) {
    filters.push({
      id: 'high_loss_ratio',
      label: '高赔付',
      icon: '⚠️',
      description: `赔付率 > 70% (${highLossRatioOrgs.length}个机构)`,
      organizations: highLossRatioOrgs,
    })
  }

  // 低赔付率机构
  if (lowLossRatioOrgs.length > 0) {
    filters.push({
      id: 'low_loss_ratio',
      label: '低赔付',
      icon: '✅',
      description: `赔付率 < 50% (${lowLossRatioOrgs.length}个机构)`,
      organizations: lowLossRatioOrgs,
    })
  }

  return filters
}

/**
 * 获取所有快捷筛选（静态 + 动态）
 * @param orgKPIs 机构KPI数据
 * @returns 完整的快捷筛选列表
 */
export function getAllQuickFilters(
  orgKPIs: Map<string, KPIResult | null>
): QuickFilter[] {
  const dynamicFilters = generateDynamicQuickFilters(orgKPIs)
  return [...STATIC_QUICK_FILTERS, ...dynamicFilters]
}

/**
 * 应用快捷筛选
 * @param filterId 快捷筛选ID
 * @param allFilters 所有快捷筛选
 * @param maxCount 最多选择数量
 * @returns 选中的机构列表
 */
export function applyQuickFilter(
  filterId: string,
  allFilters: QuickFilter[],
  maxCount: number = 7
): string[] {
  const filter = allFilters.find(f => f.id === filterId)
  if (!filter) return []

  // 如果机构数量超过限制，取前N个
  const orgs = Array.from(filter.organizations)
  return orgs.slice(0, maxCount)
}

/**
 * 格式化保费显示
 * @param yuan 金额（元）
 * @returns 格式化后的字符串
 */
export function formatPremiumDisplay(yuan: number): string {
  if (yuan >= 100_000_000) {
    return `${(yuan / 100_000_000).toFixed(2)}亿`
  }
  if (yuan >= 10_000) {
    return `${(yuan / 10_000).toFixed(0)}万`
  }
  return `${yuan.toFixed(0)}元`
}

/**
 * 格式化赔付率显示
 * @param ratio 赔付率（小数）
 * @returns 格式化后的字符串
 */
export function formatLossRatioDisplay(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}
