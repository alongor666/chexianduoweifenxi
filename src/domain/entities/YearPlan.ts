/**
 * Domain层 - 年度计划实体
 * 
 * 定义各机构的年度保费计划数据结构
 * 用于计算机构维度的保费时间进度达成率
 */

/**
 * 年度计划实体
 */
export interface YearPlan {
  /** 保单年度 */
  policy_start_year: number
  /** 二级机构名称 */
  second_level_organization: string
  /** 三级机构名称 */
  third_level_organization: string
  /** 年度保费计划（元） */
  premium_plan_yuan: number
}

/**
 * 年度计划数据集合
 * 按年份分组的年度计划数据
 */
export interface YearPlans {
  [year: string]: YearPlan[]
}

/**
 * 机构级别枚举
 */
export type OrganizationLevel = 'second' | 'third'

/**
 * 机构目标查询结果
 */
export interface OrganizationTarget {
  /** 机构名称 */
  organization: string
  /** 机构级别 */
  level: OrganizationLevel
  /** 年度目标（元） */
  annualTarget: number
  /** 包含的三级机构列表（仅二级机构查询时返回） */
  subOrganizations?: string[]
}