/**
 * 年度保费计划加载工具
 *
 * 用途：将 year-plans.json 转换为系统可用的 PremiumTargets 格式
 *
 * 注意：此文件已被 YearPlanRepository 替代，但为了向后兼容仍保留。
 * 新代码应使用 @/domain/repositories/YearPlanRepository 代替。
 */

import { PremiumTargets } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { createEmptyDimensionTargets } from '@/store/utils/target-utils'
import yearPlansRaw from '@/data/reference/year-plans.json'

/**
 * 年度计划原始数据结构（旧格式）
 */
interface OldYearPlansData {
  年度保费计划: Record<string, number>
}

/**
 * 年度计划原始数据结构（新格式）
 */
interface NewYearPlansData {
  year_plans_2025: Array<{
    policy_start_year: number
    second_level_organization: string
    third_level_organization: string
    premium_plan_yuan: number
  }>
}

/**
 * 从 year-plans.json 加载年度保费计划并转换为 PremiumTargets 格式
 *
 * @param targetYear - 目标年份，默认为当前年份
 * @returns 转换后的 PremiumTargets 对象
 */
export function loadYearPlans(targetYear?: number): PremiumTargets {
  const year = targetYear ?? new Date().getFullYear()
  const data = yearPlansRaw as NewYearPlansData
  const yearKey = `year_plans_${year}` as keyof NewYearPlansData
  const plans = data[yearKey] || []

  // 初始化维度目标
  const dimensions = createEmptyDimensionTargets()

  // 将机构目标填充到三级机构维度
  const thirdLevelEntries: Record<string, number> = {}
  let overall = 0

  plans.forEach((plan) => {
    const normalizedName = normalizeChineseText(plan.third_level_organization)
    if (normalizedName) {
      thirdLevelEntries[normalizedName] = Math.round(plan.premium_plan_yuan)
      overall += plan.premium_plan_yuan
    }
  })

  dimensions.thirdLevelOrganization = {
    entries: thirdLevelEntries,
    updatedAt: new Date().toISOString(),
    versions: [],
  }

  const premiumTargets: PremiumTargets = {
    year,
    overall: Math.round(overall),
    byBusinessType: {}, // 业务类型目标需要手动配置
    dimensions,
    updatedAt: new Date().toISOString(),
  }

  return premiumTargets
}

/**
 * 获取原始年度计划数据（用于展示或验证）
 * @param year 年份，默认为当前年份
 */
export function getRawYearPlans(year?: number): Record<string, number> {
  const targetYear = year ?? new Date().getFullYear()
  const data = yearPlansRaw as NewYearPlansData
  const yearKey = `year_plans_${targetYear}` as keyof NewYearPlansData
  const plans = data[yearKey] || []

  const result: Record<string, number> = {}
  plans.forEach((plan) => {
    result[plan.third_level_organization] = plan.premium_plan_yuan
  })
  return result
}
