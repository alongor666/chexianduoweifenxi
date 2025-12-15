/**
 * 年度保费计划加载工具
 *
 * 用途：将 year-plans.json 转换为系统可用的 PremiumTargets 格式
 */

import { PremiumTargets } from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { createEmptyDimensionTargets } from '@/store/utils/target-utils'
import yearPlansRaw from './year-plans.json'

/**
 * 年度计划原始数据结构
 */
interface YearPlansData {
  年度保费计划: Record<string, number>
}

/**
 * 从 year-plans.json 加载年度保费计划并转换为 PremiumTargets 格式
 *
 * @param targetYear - 目标年份，默认为当前年份
 * @returns 转换后的 PremiumTargets 对象
 */
export function loadYearPlans(targetYear?: number): PremiumTargets {
  const year = targetYear ?? new Date().getFullYear()
  const data = yearPlansRaw as YearPlansData
  const rawPlans = data.年度保费计划

  // 计算全公司总目标（所有机构目标之和）
  const overall = Object.values(rawPlans).reduce((sum, value) => sum + value, 0)

  // 初始化维度目标
  const dimensions = createEmptyDimensionTargets()

  // 将机构目标填充到三级机构维度
  const thirdLevelEntries: Record<string, number> = {}
  Object.entries(rawPlans).forEach(([orgName, target]) => {
    const normalizedName = normalizeChineseText(orgName)
    if (normalizedName) {
      thirdLevelEntries[normalizedName] = Math.round(target)
    }
  })

  dimensions.thirdLevelOrganization = {
    entries: thirdLevelEntries,
    updatedAt: new Date().toISOString(),
    versions: [],
  }

  const premiumTargets: PremiumTargets = {
    year,
    overall,
    byBusinessType: {}, // 业务类型目标需要手动配置
    dimensions,
    updatedAt: new Date().toISOString(),
  }

  return premiumTargets
}

/**
 * 获取原始年度计划数据（用于展示或验证）
 */
export function getRawYearPlans(): Record<string, number> {
  const data = yearPlansRaw as YearPlansData
  return data.年度保费计划
}
