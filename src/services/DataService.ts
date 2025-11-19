/**
 * 数据管理服务
 * 提供保险数据的加载、过滤、聚合等核心业务逻辑
 *
 * @architecture
 * - 纯业务逻辑，不依赖任何UI框架
 * - 所有方法都是纯函数或返回新对象，无副作用
 * - 便于单元测试和逻辑复用
 *
 * @migration
 * 提取和统一以下逻辑：
 * 1. use-app-store.ts 中的筛选逻辑 (useFilteredData, filterRecordsWithExclusions)
 * 2. use-kpi.ts 中重复的筛选逻辑 (95-247行)
 * 3. 各个组件中散落的数据处理逻辑
 */

import type { InsuranceRecord, FilterState } from '@/types/insurance'
import { normalizeChineseText } from '@/lib/utils'
import { supabase, isSupabaseEnabled, getDataSource } from '@/lib/supabase/client'

export class DataService {
  /**
   * 从数据库中获取所有保险记录
   * @returns 所有保险记录的数组
   */
  static async fetchAllData(): Promise<InsuranceRecord[]> {
    // 检查数据源类型
    const dataSource = getDataSource()

    if (dataSource === 'local' || !isSupabaseEnabled) {
      console.log('[DataService] 当前使用本地数据模式，不从数据库获取数据')
      return []
    }

    console.log('[DataService] 开始从 Supabase 数据库获取所有记录...')

    try {
      if (!supabase) {
        console.warn('[DataService] Supabase 客户端未初始化')
        return []
      }

      const { data, error } = await supabase.from('fact_insurance_cost').select('*')

      if (error) {
        console.error('[DataService] 数据库查询失败:', error)
        throw new Error(`数据库查询失败: ${error.message}`)
      }

      console.log(`[DataService] 成功从 Supabase 获取 ${data.length} 条记录。`)

      // 将从数据库蛇形命名法（snake_case）返回的数据映射到驼峰式命名法（camelCase）的类型，如果需要的话
      // 在当前场景下，两边命名一致，因此直接断言类型
      return data as InsuranceRecord[]
    } catch (error) {
      console.error('[DataService] 获取数据失败:', error)
      // 不抛出错误，而是返回空数组，让应用降级到本地模式
      return []
    }
  }

  /**
   * 根据筛选条件过滤数据
   * @param rawData 原始数据
   * @param filters 筛选条件
   * @param excludeKeys 要排除的筛选键（用于联动计算可选项）
   * @returns 过滤后的数据
   */
  static filter(
    rawData: InsuranceRecord[],
    filters: FilterState,
    excludeKeys: Array<keyof FilterState> = []
  ): InsuranceRecord[] {
    const excluded = new Set<keyof FilterState>(excludeKeys)

    return rawData.filter(record => {
      // 时间筛选
      if (!excluded.has('years')) {
        if (
          filters.years &&
          filters.years.length > 0 &&
          !filters.years.includes(record.policy_start_year)
        ) {
          return false
        }
      }

      if (!excluded.has('weeks')) {
        if (
          filters.weeks &&
          filters.weeks.length > 0 &&
          !filters.weeks.includes(record.week_number)
        ) {
          return false
        }
      }

      // 空间筛选（组织机构）
      if (!excluded.has('organizations')) {
        if (
          filters.organizations &&
          filters.organizations.length > 0 &&
          !filters.organizations.includes(
            normalizeChineseText(record.third_level_organization)
          )
        ) {
          return false
        }
      }

      // 产品筛选
      if (!excluded.has('insuranceTypes')) {
        if (
          filters.insuranceTypes &&
          filters.insuranceTypes.length > 0 &&
          !filters.insuranceTypes.includes(record.insurance_type)
        ) {
          return false
        }
      }

      if (!excluded.has('businessTypes')) {
        if (
          filters.businessTypes &&
          filters.businessTypes.length > 0 &&
          !filters.businessTypes.includes(
            normalizeChineseText(record.business_type_category)
          )
        ) {
          return false
        }
      }

      if (!excluded.has('coverageTypes')) {
        if (
          filters.coverageTypes &&
          filters.coverageTypes.length > 0 &&
          !filters.coverageTypes.includes(record.coverage_type)
        ) {
          return false
        }
      }

      // 客户筛选
      if (!excluded.has('customerCategories')) {
        if (
          filters.customerCategories &&
          filters.customerCategories.length > 0 &&
          !filters.customerCategories.includes(
            normalizeChineseText(record.customer_category_3)
          )
        ) {
          return false
        }
      }

      if (!excluded.has('vehicleGrades')) {
        if (filters.vehicleGrades && filters.vehicleGrades.length > 0) {
          // 如果记录有车险评级，则检查是否在过滤器范围内
          // 如果记录没有车险评级（空值），则不过滤（允许显示）
          if (
            record.vehicle_insurance_grade &&
            !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
          ) {
            return false
          }
        }
      }

      // 渠道筛选
      if (!excluded.has('terminalSources')) {
        if (
          filters.terminalSources &&
          filters.terminalSources.length > 0 &&
          !filters.terminalSources.includes(
            normalizeChineseText(record.terminal_source)
          )
        ) {
          return false
        }
      }

      if (!excluded.has('isNewEnergy')) {
        if (filters.isNewEnergy !== null && filters.isNewEnergy !== undefined) {
          if (record.is_new_energy_vehicle !== filters.isNewEnergy) {
            return false
          }
        }
      }

      if (!excluded.has('renewalStatuses')) {
        if (
          filters.renewalStatuses &&
          filters.renewalStatuses.length > 0 &&
          !filters.renewalStatuses.includes(record.renewal_status)
        ) {
          return false
        }
      }

      return true
    })
  }

  /**
   * 获取指定周次的数据
   * @param rawData 原始数据
   * @param weekNumber 周次
   * @param filters 其他筛选条件（可选）
   */
  static getByWeek(
    rawData: InsuranceRecord[],
    weekNumber: number,
    filters?: Partial<FilterState>
  ): InsuranceRecord[] {
    const weekFilter: FilterState = {
      ...this.getDefaultFilters(),
      ...filters,
      weeks: [weekNumber],
    }

    return this.filter(rawData, weekFilter)
  }

  /**
   * 获取指定周次范围的数据
   * @param rawData 原始数据
   * @param weekRange 周次范围 [起始周, 结束周]
   * @param filters 其他筛选条件（可选）
   */
  static getByWeekRange(
    rawData: InsuranceRecord[],
    weekRange: [number, number],
    filters?: Partial<FilterState>
  ): InsuranceRecord[] {
    const [startWeek, endWeek] = weekRange
    const weeks = Array.from(
      { length: endWeek - startWeek + 1 },
      (_, i) => startWeek + i
    )

    const rangeFilter: FilterState = {
      ...this.getDefaultFilters(),
      ...filters,
      weeks,
    }

    return this.filter(rawData, rangeFilter)
  }

  /**
   * 数据去重（根据多个字段组合）
   * @param data 数据数组
   * @returns 去重后的数据
   */
  static deduplicate(data: InsuranceRecord[]): InsuranceRecord[] {
    const uniqueKeys = new Set<string>()
    const result: InsuranceRecord[] = []

    for (const record of data) {
      // 使用多个字段组合作为唯一标识
      const key = `${record.snapshot_date}_${record.week_number}_${record.policy_start_year}_${record.third_level_organization}_${record.customer_category_3}_${record.insurance_type}_${record.business_type_category}`

      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key)
        result.push(record)
      }
    }

    return result
  }

  /**
   * 合并多个数据集并去重
   * @param dataSets 多个数据集
   * @returns 合并后的数据
   */
  static merge(...dataSets: InsuranceRecord[][]): InsuranceRecord[] {
    const merged = dataSets.flat()
    return this.deduplicate(merged)
  }

  /**
   * 按维度分组聚合数据
   * @param data 数据数组
   * @param dimension 分组维度（字段名）
   * @returns 分组结果 { [维度值]: 记录数组 }
   */
  static groupBy<K extends keyof InsuranceRecord>(
    data: InsuranceRecord[],
    dimension: K
  ): Map<InsuranceRecord[K], InsuranceRecord[]> {
    const groups = new Map<InsuranceRecord[K], InsuranceRecord[]>()

    for (const record of data) {
      const key = record[dimension]
      const group = groups.get(key) || []
      group.push(record)
      groups.set(key, group)
    }

    return groups
  }

  /**
   * 计算数据的基本统计信息
   * @param data 数据数组
   */
  static getStatistics(data: InsuranceRecord[]): {
    totalRecords: number
    totalPremium: number
    totalPolicyCount: number
    uniqueWeeks: number[]
    uniqueOrganizations: string[]
    dateRange: { min: string; max: string } | null
  } {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalPremium: 0,
        totalPolicyCount: 0,
        uniqueWeeks: [],
        uniqueOrganizations: [],
        dateRange: null,
      }
    }

    const totalPremium = data.reduce(
      (sum, r) => sum + r.signed_premium_yuan,
      0
    )
    const totalPolicyCount = data.reduce((sum, r) => sum + r.policy_count, 0)

    const uniqueWeeks = Array.from(
      new Set(data.map(r => r.week_number))
    ).sort((a, b) => a - b)

    const uniqueOrganizations = Array.from(
      new Set(data.map(r => normalizeChineseText(r.third_level_organization)))
    ).sort()

    const dates = data.map(r => r.snapshot_date).sort()
    const dateRange = {
      min: dates[0],
      max: dates[dates.length - 1],
    }

    return {
      totalRecords: data.length,
      totalPremium,
      totalPolicyCount,
      uniqueWeeks,
      uniqueOrganizations,
      dateRange,
    }
  }

  /**
   * 规范化数据（统一中文文本格式）
   * @param data 原始数据
   * @returns 规范化后的数据
   */
  static normalize(data: InsuranceRecord[]): InsuranceRecord[] {
    return data.map(record => ({
      ...record,
      customer_category_3: normalizeChineseText(record.customer_category_3),
      business_type_category: normalizeChineseText(record.business_type_category),
      third_level_organization: normalizeChineseText(record.third_level_organization),
      terminal_source: normalizeChineseText(record.terminal_source),
    }))
  }

  /**
   * 获取可用的筛选选项（根据当前数据动态计算）
   * @param data 数据数组
   * @param currentFilters 当前筛选条件
   * @param targetField 目标字段
   */
  static getAvailableOptions<K extends keyof FilterState>(
    data: InsuranceRecord[],
    currentFilters: FilterState,
    targetField: K
  ): string[] | number[] {
    // 排除目标字段，使用其他筛选条件过滤
    const otherFilters = { ...currentFilters }
    delete otherFilters[targetField]

    const filteredData = this.filter(data, otherFilters as FilterState, [
      targetField,
    ])

    // 根据目标字段提取唯一值
    const values = new Set<string | number>()

    switch (targetField) {
      case 'years':
        filteredData.forEach(r => values.add(r.policy_start_year))
        return Array.from(values as Set<number>).sort((a, b) => b - a)

      case 'weeks':
        filteredData.forEach(r => values.add(r.week_number))
        return Array.from(values as Set<number>).sort((a, b) => b - a)

      case 'organizations':
        filteredData.forEach(r =>
          values.add(normalizeChineseText(r.third_level_organization))
        )
        return Array.from(values as Set<string>).sort()

      case 'businessTypes':
        filteredData.forEach(r =>
          values.add(normalizeChineseText(r.business_type_category))
        )
        return Array.from(values as Set<string>).sort()

      case 'customerCategories':
        filteredData.forEach(r =>
          values.add(normalizeChineseText(r.customer_category_3))
        )
        return Array.from(values as Set<string>).sort()

      default:
        return []
    }
  }

  /**
   * 获取默认筛选器
   */
  private static getDefaultFilters(): FilterState {
    return {
      viewMode: 'single',
      dataViewType: 'current',
      years: [],
      weeks: [],
      singleModeWeek: null,
      trendModeWeeks: [],
      organizations: [],
      insuranceTypes: [],
      businessTypes: [],
      coverageTypes: [],
      customerCategories: [],
      vehicleGrades: [],
      highwayRiskGrades: [],
      smallTruckScores: [],
      largeTruckScores: [],
      terminalSources: [],
      isNewEnergy: null,
      renewalStatuses: [],
    }
  }
}
