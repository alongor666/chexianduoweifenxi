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
import type { InsuranceRecord, KPIResult } from '../../domain'
import { calculateKPIs } from '../../domain'

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
      const kpis = calculateKPIs(records)

      // 返回结果
      return {
        success: true,
        kpis,
        recordCount: records.length,
        filters,
      }
    } catch (error) {
      throw new KPICalculationError('CALCULATION_FAILED', 'KPI 计算失败', error)
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
        const kpis = calculateKPIs(groupRecords)
        results.push({
          groupBy,
          groupValue,
          kpis,
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
  private getEmptyKPIs(): KPIResult {
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
  kpis: KPIResult

  /** 记录数量 */
  recordCount: number

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
  kpis: KPIResult

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
