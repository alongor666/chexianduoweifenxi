/**
 * KPI 计算服务
 * 封装所有 KPI 相关的计算逻辑，提供统一的计算接口
 *
 * @architecture
 * - 纯函数实现，无副作用
 * - 与 UI 框架解耦，可独立测试
 * - 复用现有的 kpi-engine，作为适配层
 *
 * @migration
 * 统一以下计算逻辑：
 * 1. use-kpi.ts 中的 KPI 计算
 * 2. 各个组件中散落的 KPI 计算
 */

import { kpiEngine } from '@/lib/calculations/kpi-engine'
import type { InsuranceRecord, KPIResult, FilterState } from '@/types/insurance'
import { DataService } from './DataService'
import { safeMax } from '@/lib/utils/array-utils'

/**
 * KPI 计算选项
 */
export interface KPICalculationOptions {
  /**
   * 年度目标（元），用于计算达成率
   */
  annualTargetYuan?: number

  /**
   * 计算模式
   * - current: 当周值（累计）
   * - increment: 周增量（本周新增）
   */
  mode?: 'current' | 'increment'

  /**
   * 当前周次（用于时间进度计算）
   */
  currentWeekNumber?: number

  /**
   * 年份
   */
  year?: number
}

/**
 * 趋势分析选项
 */
export interface TrendAnalysisOptions {
  /**
   * 周次范围
   */
  weekRange: number[]

  /**
   * 是否计算同比/环比
   */
  includeComparison?: boolean
}

export class KPIService {
  /**
   * 计算当周 KPI
   * @param data 已筛选的数据
   * @param options 计算选项
   */
  static calculate(
    data: InsuranceRecord[],
    options: KPICalculationOptions = {}
  ): KPIResult | null {
    if (data.length === 0) {
      return null
    }

    return kpiEngine.calculate(data, {
      annualTargetYuan: options.annualTargetYuan,
      mode: options.mode || 'current',
      currentWeekNumber: options.currentWeekNumber,
      year: options.year || new Date().getFullYear(),
    })
  }

  /**
   * 计算周增量 KPI（本周相比上周的增量）
   * @param currentWeekData 当周数据
   * @param previousWeekData 上周数据
   * @param options 计算选项
   */
  static calculateIncrement(
    currentWeekData: InsuranceRecord[],
    previousWeekData: InsuranceRecord[],
    options: KPICalculationOptions = {}
  ): KPIResult | null {
    if (currentWeekData.length === 0) {
      return null
    }

    return kpiEngine.calculateIncrement(currentWeekData, previousWeekData, {
      mode: 'increment',
      annualTargetYuan: options.annualTargetYuan,
      currentWeekNumber: options.currentWeekNumber,
      year: options.year || new Date().getFullYear(),
    })
  }

  /**
   * 计算多周趋势数据
   * @param rawData 原始数据
   * @param filters 筛选条件
   * @param options 趋势分析选项
   */
  static calculateTrend(
    rawData: InsuranceRecord[],
    filters: FilterState,
    options: TrendAnalysisOptions
  ): Map<number, KPIResult> {
    const trendData = new Map<number, KPIResult>()

    for (const week of options.weekRange) {
      const weekData = DataService.getByWeek(rawData, week, filters)

      if (weekData.length > 0) {
        const kpi = this.calculate(weekData, {
          currentWeekNumber: week,
          year: filters.years && filters.years.length > 0
            ? safeMax(filters.years)
            : new Date().getFullYear(),
        })

        if (kpi) {
          trendData.set(week, kpi)
        }
      }
    }

    return trendData
  }

  /**
   * 计算智能环比数据（自动选择上一周）
   * @param rawData 原始数据
   * @param currentWeek 当前周次
   * @param filters 筛选条件
   * @param annualTarget 年度目标
   */
  static calculateSmartComparison(
    rawData: InsuranceRecord[],
    currentWeek: number,
    filters: FilterState,
    annualTarget?: number
  ): {
    currentKpi: KPIResult | null
    compareKpi: KPIResult | null
    previousWeekNumber: number | null
  } {
    // 获取当前周数据
    const currentWeekData = DataService.getByWeek(rawData, currentWeek, filters)

    // 获取上一周数据
    const previousWeek = currentWeek - 1
    const previousWeekData = DataService.getByWeek(rawData, previousWeek, filters)

    const currentKpi = this.calculate(currentWeekData, {
      annualTargetYuan: annualTarget,
      currentWeekNumber: currentWeek,
    })

    const compareKpi =
      previousWeekData.length > 0
        ? this.calculate(previousWeekData, {
            annualTargetYuan: annualTarget,
            currentWeekNumber: previousWeek,
          })
        : null

    return {
      currentKpi,
      compareKpi,
      previousWeekNumber: previousWeekData.length > 0 ? previousWeek : null,
    }
  }

  /**
   * 计算按维度分组的 KPI
   * @param rawData 原始数据
   * @param dimension 分组维度
   * @param filters 筛选条件
   */
  static calculateByDimension<K extends keyof InsuranceRecord>(
    rawData: InsuranceRecord[],
    dimension: K,
    filters: FilterState
  ): Map<InsuranceRecord[K], KPIResult> {
    const filteredData = DataService.filter(rawData, filters)
    const groups = DataService.groupBy(filteredData, dimension)
    const kpiByDimension = new Map<InsuranceRecord[K], KPIResult>()

    for (const [key, records] of groups.entries()) {
      const kpi = this.calculate(records)
      if (kpi) {
        kpiByDimension.set(key, kpi)
      }
    }

    return kpiByDimension
  }

  /**
   * 批量计算多个筛选条件的 KPI
   * @param rawData 原始数据
   * @param filtersList 多个筛选条件
   */
  static calculateBatch(
    rawData: InsuranceRecord[],
    filtersList: FilterState[]
  ): KPIResult[] {
    return filtersList
      .map(filters => {
        const filteredData = DataService.filter(rawData, filters)
        return this.calculate(filteredData)
      })
      .filter((kpi): kpi is KPIResult => kpi !== null)
  }

  /**
   * 计算 KPI 达成率
   * @param actualPremium 实际保费（元）
   * @param targetPremium 目标保费（元）
   * @returns 达成率（0-1之间的小数）
   */
  static calculateAchievementRate(
    actualPremium: number,
    targetPremium: number
  ): number {
    if (targetPremium === 0) return 0
    return actualPremium / targetPremium
  }

  /**
   * 计算时间进度（已过去的天数占全年的比例）
   * @param currentDate 当前日期
   * @param year 年份
   */
  static calculateTimeProgress(currentDate: Date, year?: number): number {
    const targetYear = year || currentDate.getFullYear()
    const startOfYear = new Date(targetYear, 0, 1)
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59)

    const totalDays =
      (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    const passedDays =
      (currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)

    return Math.min(passedDays / totalDays, 1)
  }

  /**
   * 计算 KPI 同比增长率
   * @param currentKpi 当期 KPI
   * @param comparisonKpi 对比期 KPI
   */
  static calculateGrowthRate(
    currentKpi: KPIResult,
    comparisonKpi: KPIResult
  ): {
    premiumGrowthRate: number
    policyCountGrowthRate: number
    averagePremiumGrowthRate: number
  } {
    const premiumGrowthRate =
      comparisonKpi.signed_premium > 0
        ? (currentKpi.signed_premium - comparisonKpi.signed_premium) /
          comparisonKpi.signed_premium
        : 0

    const policyCountGrowthRate =
      comparisonKpi.policy_count > 0
        ? (currentKpi.policy_count - comparisonKpi.policy_count) /
          comparisonKpi.policy_count
        : 0

    const averagePremiumGrowthRate =
      comparisonKpi.average_premium && comparisonKpi.average_premium > 0
        ? ((currentKpi.average_premium ?? 0) - comparisonKpi.average_premium) /
          comparisonKpi.average_premium
        : 0

    return {
      premiumGrowthRate,
      policyCountGrowthRate,
      averagePremiumGrowthRate,
    }
  }
}
