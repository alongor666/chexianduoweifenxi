/**
 * Domain层 - 年度计划数据仓库
 * 
 * 职责：
 * - 加载年度计划数据
 * - 提供机构目标查询服务
 * - 支持二级和三级机构维度查询
 */

import { YearPlan, YearPlans, OrganizationTarget, OrganizationLevel } from '../entities/YearPlan'

/**
 * 年度计划数据仓库
 */
export class YearPlanRepository {
  private plans: YearPlan[] = []
  private isLoaded = false

  /**
   * 加载年度计划数据
   * @param year 年份，默认2025
   */
  async loadPlans(year: number = 2025): Promise<YearPlan[]> {
    if (this.isLoaded) {
      return this.plans
    }

    try {
      // 动态导入年度计划数据
      const yearPlansData = await import('@/data/reference/year-plans.json')
      const yearKey = `year_plans_${year}`
      
      if (yearPlansData[yearKey]) {
        this.plans = yearPlansData[yearKey]
        this.isLoaded = true
      } else {
        console.warn(`未找到 ${year} 年的年度计划数据`)
        this.plans = []
        this.isLoaded = true
      }
    } catch (error) {
      console.error('加载年度计划数据失败:', error)
      this.plans = []
      this.isLoaded = true
    }

    return this.plans
  }

  /**
   * 获取所有年度计划数据
   */
  getAllPlans(): YearPlan[] {
    return this.plans
  }

  /**
   * 根据机构查询年度目标
   * @param organization 机构名称
   * @param level 机构级别：'second' | 'third'
   * @param year 年份，默认2025
   */
  async getTargetByOrganization(
    organization: string, 
    level: OrganizationLevel,
    year: number = 2025
  ): Promise<OrganizationTarget | null> {
    await this.loadPlans(year)

    if (level === 'third') {
      // 三级机构：直接匹配
      const plan = this.plans.find(
        p => p.third_level_organization === organization && p.policy_start_year === year
      )
      
      if (plan) {
        return {
          organization,
          level: 'third',
          annualTarget: plan.premium_plan_yuan
        }
      }
    } else if (level === 'second') {
      // 二级机构：汇总该二级机构下所有三级机构的目标
      const subPlans = this.plans.filter(
        p => p.second_level_organization === organization && p.policy_start_year === year
      )
      
      if (subPlans.length > 0) {
        const totalTarget = subPlans.reduce((sum, plan) => sum + plan.premium_plan_yuan, 0)
        const subOrganizations = subPlans.map(p => p.third_level_organization)
        
        return {
          organization,
          level: 'second',
          annualTarget: totalTarget,
          subOrganizations
        }
      }
    }

    return null
  }

  /**
   * 获取指定年份的所有二级机构目标
   * @param year 年份，默认2025
   */
  async getSecondLevelTargets(year: number = 2025): Promise<OrganizationTarget[]> {
    await this.loadPlans(year)
    
    const secondLevelMap = new Map<string, OrganizationTarget>()
    
    this.plans
      .filter(p => p.policy_start_year === year)
      .forEach(plan => {
        const key = plan.second_level_organization
        
        if (!secondLevelMap.has(key)) {
          secondLevelMap.set(key, {
            organization: key,
            level: 'second',
            annualTarget: 0,
            subOrganizations: []
          })
        }
        
        const target = secondLevelMap.get(key)!
        target.annualTarget += plan.premium_plan_yuan
        target.subOrganizations!.push(plan.third_level_organization)
      })
    
    return Array.from(secondLevelMap.values())
  }

  /**
   * 获取指定年份的所有三级机构目标
   * @param year 年份，默认2025
   */
  async getThirdLevelTargets(year: number = 2025): Promise<OrganizationTarget[]> {
    await this.loadPlans(year)
    
    return this.plans
      .filter(p => p.policy_start_year === year)
      .map(plan => ({
        organization: plan.third_level_organization,
        level: 'third' as const,
        annualTarget: plan.premium_plan_yuan
      }))
  }

  /**
   * 获取指定二级机构下的三级机构列表
   * @param secondLevelOrg 二级机构名称
   * @param year 年份，默认2025
   */
  async getThirdLevelOrganizations(
    secondLevelOrg: string, 
    year: number = 2025
  ): Promise<string[]> {
    await this.loadPlans(year)
    
    return this.plans
      .filter(p => 
        p.second_level_organization === secondLevelOrg && 
        p.policy_start_year === year
      )
      .map(p => p.third_level_organization)
      .filter((org, index, arr) => arr.indexOf(org) === index) // 去重
  }

  /**
   * 检查机构是否存在
   * @param organization 机构名称
   * @param level 机构级别
   * @param year 年份，默认2025
   */
  async organizationExists(
    organization: string,
    level: OrganizationLevel,
    year: number = 2025
  ): Promise<boolean> {
    const target = await this.getTargetByOrganization(organization, level, year)
    return target !== null
  }

  /**
   * 清除缓存，强制重新加载数据
   */
  clearCache(): void {
    this.isLoaded = false
    this.plans = []
  }
}

/**
 * 导出单例实例
 */
export const yearPlanRepository = new YearPlanRepository()