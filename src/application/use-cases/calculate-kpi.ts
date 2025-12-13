/**
 * 计算 KPI 用例（Calculate KPI Use Case）
 *
 * 负责获取数据并计算 KPI 指标。
 *
 * @layer Application
 * @depends Domain (calculateKPIs)
 * @depends Ports (IDataRepository)
 */

import type { IDataRepository, DataFilters } from '../ports/IDataRepository'
import type { InsuranceRecord } from '../../domain'
import { calculateKPIs, calculateIncrementKPIs } from '../../domain'

/**
 * 将 Domain 层 KPI 结果（snake_case）映射为应用层（camelCase）
 */
function mapDomainKPIToApp(
  k: import('../../domain').KPIResult
): ApplicationKPIResult {
  return {
    // 率值指标
    lossRatio: k.loss_ratio,
    expenseRatio: k.expense_ratio,
    maturityRatio: k.maturity_ratio,
    contributionMarginRatio: k.contribution_margin_ratio,
    variableCostRatio: k.variable_cost_ratio,
    maturedClaimRatio: k.matured_claim_ratio,
    autonomyCoefficient: k.autonomy_coefficient,
    premiumProgress: k.premium_time_progress_achievement_rate,
    premiumTimeProgressAchievementRate:
      k.premium_time_progress_achievement_rate,
    policyCountTimeProgressAchievementRate:
      k.policy_count_time_progress_achievement_rate,

    // 绝对值指标
    signedPremium: k.signed_premium,
    maturedPremium: k.matured_premium,
    policyCount: k.policy_count,
    claimCaseCount: k.claim_case_count,
    reportedClaimPayment: k.reported_claim_payment,
    expenseAmount: k.expense_amount,
    contributionMarginAmount: k.contribution_margin_amount,

    // 目标相关
    annualPremiumTarget: k.annual_premium_target,
    annualPolicyCountTarget: k.annual_policy_count_target,

    // 均值指标
    averagePremium: k.average_premium,
    averageClaim: k.average_claim,
    averageExpense: k.average_expense,
    averageContribution: k.average_contribution,
  }
}

/**
 * 计算 KPI 用例
 *
 * 编排数据获取和 KPI 计算的流程。
 */
export class CalculateKPIUseCase {
  constructor(private readonly repository: IDataRepository) {}

  /**
   * 执行 KPI 计算
   *
   * @param filters - 数据筛选条件（可选）
   * @returns Promise<KPICalculationResult> - 计算结果
   */
  async execute(filters?: DataFilters): Promise<KPICalculationResult> {
    try {
      // 步骤 1: 获取数据
      const records = await this.getRecords(filters)

      if (records.length === 0) {
        return {
          success: true,
          kpis: this.getEmptyKPIs(),
          recordCount: 0,
          message: '没有符合条件的数据',
        }
      }

      // 步骤 2: 计算 KPI（调用 Domain 层）
      const domainKpis = calculateKPIs(records)

      // 返回结果
      return {
        success: true,
        kpis: mapDomainKPIToApp(domainKpis),
        recordCount: records.length,
        filters,
      }
    } catch (error) {
      throw new KPICalculationError('CALCULATION_FAILED', 'KPI 计算失败', error)
    }
  }

  /**
   * 计算增量 KPI（对比上周数据）
   *
   * @param currentWeek - 当前周次
   * @param previousWeek - 上周周次
   * @param year - 年份
   * @param filters - 额外的数据筛选条件
   * @returns Promise<IncrementKPIResult> - 增量 KPI 计算结果
   */
  async executeIncrement(
    currentWeek: number,
    previousWeek: number,
    year: number,
    filters?: DataFilters
  ): Promise<IncrementKPIResult> {
    try {
      // 获取当前周数据
      const currentFilters = {
        ...filters,
        weekRange: { start: currentWeek, end: currentWeek },
        years: [year],
      }
      const currentRecords = await this.getRecords(currentFilters)

      // 获取上周数据
      const previousFilters = {
        ...filters,
        weekRange: { start: previousWeek, end: previousWeek },
        years: [year],
      }
      const previousRecords = await this.getRecords(previousFilters)

      if (currentRecords.length === 0) {
        return {
          success: true,
          currentWeekKPIs: this.getEmptyKPIs(),
          previousWeekKPIs: this.getEmptyKPIs(),
          incrementKPIs: this.getEmptyKPIs(),
          currentWeekRecordCount: 0,
          previousWeekRecordCount: previousRecords.length,
          message: '当前周没有数据',
        }
      }

      if (previousRecords.length === 0) {
        const currentDomain = calculateKPIs(currentRecords)
        return {
          success: true,
          currentWeekKPIs: mapDomainKPIToApp(currentDomain),
          previousWeekKPIs: this.getEmptyKPIs(),
          incrementKPIs: this.getEmptyKPIs(),
          currentWeekRecordCount: currentRecords.length,
          previousWeekRecordCount: 0,
          message: '上周没有数据，无法计算增量',
        }
      }

      // 计算当前周 KPI
      const currentWeekKPIsDomain = calculateKPIs(currentRecords)

      // 计算上周 KPI
      const previousWeekKPIsDomain = calculateKPIs(previousRecords)

      // 计算增量 KPI
      const incrementKPIsDomain = calculateIncrementKPIs(
        currentRecords,
        previousRecords
      )

      return {
        success: true,
        currentWeekKPIs: mapDomainKPIToApp(currentWeekKPIsDomain),
        previousWeekKPIs: mapDomainKPIToApp(previousWeekKPIsDomain),
        incrementKPIs: mapDomainKPIToApp(incrementKPIsDomain),
        currentWeekRecordCount: currentRecords.length,
        previousWeekRecordCount: previousRecords.length,
        filters,
      }
    } catch (error) {
      throw new KPICalculationError(
        'INCREMENT_CALCULATION_FAILED',
        '增量 KPI 计算失败',
        error
      )
    }
  }

  /**
   * 批量计算 KPI（按不同维度分组）
   *
   * @param groupBy - 分组维度
   * @param filters - 数据筛选条件
   * @returns Promise<GroupedKPIResult[]> - 分组计算结果
   */
  async executeGrouped(
    groupBy: GroupByDimension,
    filters?: DataFilters
  ): Promise<GroupedKPIResult[]> {
    try {
      // 获取数据
      const records = await this.getRecords(filters)

      if (records.length === 0) {
        return []
      }

      // 按维度分组
      const groups = this.groupRecords(records, groupBy)

      // 计算每组的 KPI
      const results: GroupedKPIResult[] = []
      for (const [groupValue, groupRecords] of groups) {
        const domainKpis = calculateKPIs(groupRecords)
        results.push({
          groupBy,
          groupValue,
          kpis: mapDomainKPIToApp(domainKpis),
          recordCount: groupRecords.length,
        })
      }

      return results
    } catch (error) {
      throw new KPICalculationError(
        'GROUPED_CALCULATION_FAILED',
        '分组 KPI 计算失败',
        error
      )
    }
  }

  /**
   * 获取数据记录
   */
  private async getRecords(filters?: DataFilters): Promise<InsuranceRecord[]> {
    if (!filters) {
      return await this.repository.findAll()
    }
    return await this.repository.findByFilters(filters)
  }

  /**
   * 按维度分组记录
   */
  private groupRecords(
    records: InsuranceRecord[],
    groupBy: GroupByDimension
  ): Map<string, InsuranceRecord[]> {
    const groups = new Map<string, InsuranceRecord[]>()

    for (const record of records) {
      const key = this.getGroupKey(record, groupBy)
      const group = groups.get(key) || []
      group.push(record)
      groups.set(key, group)
    }

    return groups
  }

  /**
   * 获取分组键
   */
  private getGroupKey(
    record: InsuranceRecord,
    groupBy: GroupByDimension
  ): string {
    switch (groupBy) {
      case 'year':
        return String(record.policyStartYear)
      case 'week':
        return `${record.policyStartYear}-W${String(record.weekNumber).padStart(2, '0')}`
      case 'institution':
        return record.thirdLevelOrganization
      case 'customerCategory3':
        return record.customerCategory
      case 'businessTypeCategory':
        return record.businessTypeCategory
      case 'isNewEnergy':
        return record.isNewEnergyVehicle ? '新能源' : '非新能源'
      default:
        return 'unknown'
    }
  }

  /**
   * 获取空 KPI 结果（当没有数据时）
   */
  private getEmptyKPIs(): ApplicationKPIResult {
    return {
      lossRatio: null,
      expenseRatio: null,
      maturityRatio: null,
      contributionMarginRatio: null,
      variableCostRatio: null,
      maturedClaimRatio: null,
      autonomyCoefficient: null,
      premiumProgress: null,
      premiumTimeProgressAchievementRate: null,
      policyCountTimeProgressAchievementRate: null,
      signedPremium: 0,
      maturedPremium: 0,
      policyCount: 0,
      claimCaseCount: 0,
      reportedClaimPayment: 0,
      expenseAmount: 0,
      contributionMarginAmount: 0,
      averagePremium: null,
      averageClaim: null,
      averageExpense: null,
      averageContribution: null,
      annualPremiumTarget: null,
      annualPolicyCountTarget: null,
    }
  }
}

/**
 * KPI 计算结果
 */
export interface KPICalculationResult {
  /** 是否成功 */
  success: boolean

  /** KPI 计算结果 */
  kpis: ApplicationKPIResult

  /** 记录数量 */
  recordCount: number

  /** 应用的筛选条件 */
  filters?: DataFilters

  /** 消息（如果有） */
  message?: string
}

/**
 * 增量 KPI 结果
 */
export interface IncrementKPIResult {
  /** 是否成功 */
  success: boolean

  /** 当前周 KPI 结果 */
  currentWeekKPIs: ApplicationKPIResult

  /** 上周 KPI 结果 */
  previousWeekKPIs: ApplicationKPIResult

  /** 增量 KPI 结果 */
  incrementKPIs: ApplicationKPIResult

  /** 当前周记录数量 */
  currentWeekRecordCount: number

  /** 上周记录数量 */
  previousWeekRecordCount: number

  /** 应用的筛选条件 */
  filters?: DataFilters

  /** 消息（如果有） */
  message?: string
}

/**
 * 分组 KPI 结果
 */
export interface GroupedKPIResult {
  /** 分组维度 */
  groupBy: GroupByDimension

  /** 分组值 */
  groupValue: string

  /** KPI 结果 */
  kpis: ApplicationKPIResult

  /** 记录数量 */
  recordCount: number
}

/**
 * 分组维度
 */
export type GroupByDimension =
  | 'year'
  | 'week'
  | 'institution'
  | 'customerCategory3'
  | 'businessTypeCategory'
  | 'isNewEnergy'

/**
 * KPI 计算错误
 */
export class KPICalculationError extends Error {
  constructor(
    public readonly code: KPIErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'KPICalculationError'
  }
}

/**
 * KPI 错误代码
 */
export type KPIErrorCode =
  | 'CALCULATION_FAILED'
  | 'GROUPED_CALCULATION_FAILED'
  | 'NO_DATA'
  | 'INCREMENT_CALCULATION_FAILED'

/**
 * 应用层 KPI 结果（camelCase 命名）
 */
export interface ApplicationKPIResult {
  lossRatio: number | null
  expenseRatio: number | null
  maturityRatio: number | null
  contributionMarginRatio: number | null
  variableCostRatio: number | null
  maturedClaimRatio: number | null
  autonomyCoefficient: number | null
  premiumProgress: number | null
  premiumTimeProgressAchievementRate: number | null
  policyCountTimeProgressAchievementRate: number | null

  signedPremium: number
  maturedPremium: number
  policyCount: number
  claimCaseCount: number
  reportedClaimPayment: number
  expenseAmount: number
  contributionMarginAmount: number

  annualPremiumTarget: number | null
  annualPolicyCountTarget: number | null

  averagePremium: number | null
  averageClaim: number | null
  averageExpense: number | null
  averageContribution: number | null
}
