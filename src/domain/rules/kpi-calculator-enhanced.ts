/**
 * Domain 层 - 增强的 KPI 计算规则
 *
 * 核心规则：
 * - 纯函数（无副作用）
 * - 不依赖任何外部框架
 * - 业务逻辑集中且透明
 * - 统一所有散落的KPI计算逻辑
 *
 * 这个模块合并了来自以下文件的逻辑：
 * - src/lib/calculations/kpi-engine.ts
 * - src/services/KPIService.ts
 * - src/domain/rules/kpi-calculator.ts (原版)
 */

import { InsuranceRecord } from '../entities/InsuranceRecord'

// ============= 类型定义 =============

/**
 * KPI 计算结果（与项目类型定义保持一致，使用 snake_case 命名）
 */
export interface KPIResult {
  // 率值指标
  loss_ratio: number | null // 满期赔付率
  premium_progress: number | null // 保费达成率
  premium_time_progress_achievement_rate: number | null // 保费时间进度达成率 = (保费达成率 / 时间进度) × 100
  policy_count_time_progress_achievement_rate: number | null // 件数时间进度达成率
  maturity_ratio: number | null // 满期率
  expense_ratio: number | null // 费用率
  contribution_margin_ratio: number | null // 满期边际贡献率
  variable_cost_ratio: number | null // 变动成本率
  matured_claim_ratio: number | null // 满期出险率
  autonomy_coefficient: number | null // 商业险自主系数

  // 绝对值指标（万元）
  signed_premium: number // 签单保费
  matured_premium: number // 满期保费
  policy_count: number // 保单件数
  claim_case_count: number // 赔案件数
  reported_claim_payment: number // 已报告赔款
  expense_amount: number // 费用金额
  contribution_margin_amount: number // 边际贡献额
  annual_premium_target: number | null // 年度保费目标
  annual_policy_count_target: number | null // 年度件数目标

  // 均值指标（元）
  average_premium: number | null // 单均保费
  average_claim: number | null // 案均赔款
  average_expense: number | null // 单均费用
  average_contribution: number | null // 单均边贡额
}

/**
 * 聚合数据（中间计算结果）
 */
interface AggregatedData {
  signed_premium_yuan: number
  matured_premium_yuan: number
  policy_count: number
  claim_case_count: number
  reported_claim_payment_yuan: number
  expense_amount_yuan: number
  commercial_premium_before_discount_yuan: number
  marginal_contribution_amount_yuan: number
  premium_plan_yuan: number
}

/**
 * KPI 计算选项
 */
export interface KPICalculationOptions {
  /** 年度目标（元），用于计算达成率 */
  annualTargetYuan?: number | null
  /** 年度件数目标 */
  annualPolicyCountTarget?: number | null
  /** 计算模式：'current' 当周值（累计）| 'increment' 周增量 */
  mode?: 'current' | 'increment'
  /** 当前周次（用于计算时间进度） */
  currentWeekNumber?: number | null
  /** 年份（用于计算时间进度） */
  year?: number | null
}

// ============= 常量定义 =============

/** 每年工作周数（用于时间进度计算） */
export const WORKING_WEEKS_PER_YEAR = 50

// ============= 工具函数 =============

/**
 * 安全除法 - 防止除零错误
 */
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return null
  }
  if (!Number.isFinite(numerator)) {
    return null
  }
  return numerator / denominator
}

/**
 * 转换为百分比
 */
function toPercentage(value: number | null): number | null {
  if (value === null) {
    return null
  }
  return value * 100
}

/**
 * 计算年度时间进度
 */
function calculateYearProgress(currentWeekNumber?: number | null): number {
  if (currentWeekNumber) {
    return Math.min(currentWeekNumber / WORKING_WEEKS_PER_YEAR, 1.0)
  }

  // 降级：使用当前日期估算
  const currentDayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const estimatedWeek = Math.ceil(currentDayOfYear / 7)
  return Math.min(estimatedWeek / WORKING_WEEKS_PER_YEAR, 1.0)
}

// ============= 聚合函数 =============

/**
 * 聚合保险记录数据
 */
export function aggregateInsuranceRecords(
  records: InsuranceRecord[]
): AggregatedData {
  return records.reduce(
    (acc, record) => ({
      signed_premium_yuan: acc.signed_premium_yuan + record.signedPremiumYuan,
      matured_premium_yuan:
        acc.matured_premium_yuan + record.maturedPremiumYuan,
      policy_count: acc.policy_count + record.policyCount,
      claim_case_count: acc.claim_case_count + record.claimCaseCount,
      reported_claim_payment_yuan:
        acc.reported_claim_payment_yuan + record.reportedClaimPaymentYuan,
      expense_amount_yuan: acc.expense_amount_yuan + record.expenseAmountYuan,
      commercial_premium_before_discount_yuan:
        acc.commercial_premium_before_discount_yuan +
        record.commercialPremiumBeforeDiscountYuan,
      marginal_contribution_amount_yuan:
        acc.marginal_contribution_amount_yuan +
        record.marginalContributionAmountYuan,
      premium_plan_yuan: acc.premium_plan_yuan + (record.premiumPlanYuan || 0),
    }),
    {
      signed_premium_yuan: 0,
      matured_premium_yuan: 0,
      policy_count: 0,
      claim_case_count: 0,
      reported_claim_payment_yuan: 0,
      expense_amount_yuan: 0,
      commercial_premium_before_discount_yuan: 0,
      marginal_contribution_amount_yuan: 0,
      premium_plan_yuan: 0,
    }
  )
}

// ============= 率值指标计算 =============

/**
 * 计算满期赔付率
 */
export function calculateLossRatio(
  reportedClaimPayment: number,
  maturedPremium: number
): number | null {
  return toPercentage(safeDivide(reportedClaimPayment, maturedPremium))
}

/**
 * 计算费用率
 */
export function calculateExpenseRatio(
  expenseAmount: number,
  signedPremium: number
): number | null {
  return toPercentage(safeDivide(expenseAmount, signedPremium))
}

/**
 * 计算满期率
 */
export function calculateMaturityRatio(
  maturedPremium: number,
  signedPremium: number
): number | null {
  return toPercentage(safeDivide(maturedPremium, signedPremium))
}

/**
 * 计算满期边际贡献率
 */
export function calculateContributionMarginRatio(
  contributionMargin: number,
  maturedPremium: number
): number | null {
  return toPercentage(safeDivide(contributionMargin, maturedPremium))
}

/**
 * 计算变动成本率
 */
export function calculateVariableCostRatio(
  reportedClaimPayment: number,
  expenseAmount: number,
  signedPremium: number
): number | null {
  const variableCost = reportedClaimPayment + expenseAmount
  return toPercentage(safeDivide(variableCost, signedPremium))
}

/**
 * 计算满期出险率
 */
export function calculateMaturedClaimRatio(
  claimCaseCount: number,
  policyCount: number
): number | null {
  return toPercentage(safeDivide(claimCaseCount, policyCount))
}

/**
 * 计算商业险自主系数
 */
export function calculateAutonomyCoefficient(
  signedPremium: number,
  commercialPremiumBeforeDiscount: number
): number | null {
  return safeDivide(signedPremium, commercialPremiumBeforeDiscount)
}

/**
 * 计算保费达成率
 */
export function calculatePremiumProgress(
  signedPremium: number,
  premiumTarget: number | null
): number | null {
  if (premiumTarget === null) {
    return null
  }
  return toPercentage(safeDivide(signedPremium, premiumTarget))
}

// ============= 均值指标计算 =============

/**
 * 计算单均保费
 */
export function calculateAveragePremium(
  signedPremium: number,
  policyCount: number
): number | null {
  return safeDivide(signedPremium, policyCount)
}

/**
 * 计算案均赔款
 */
export function calculateAverageClaim(
  reportedClaimPayment: number,
  claimCaseCount: number
): number | null {
  return safeDivide(reportedClaimPayment, claimCaseCount)
}

/**
 * 计算单均费用
 */
export function calculateAverageExpense(
  expenseAmount: number,
  policyCount: number
): number | null {
  return safeDivide(expenseAmount, policyCount)
}

/**
 * 计算单均边贡额
 */
export function calculateAverageContribution(
  contributionMargin: number,
  policyCount: number
): number | null {
  return safeDivide(contributionMargin, policyCount)
}

// ============= 核心计算函数 =============

/**
 * 计算完整的 KPI 结果（当周值模式）
 */
export function calculateKPIs(
  records: InsuranceRecord[],
  options: KPICalculationOptions = {}
): KPIResult {
  // 1. 聚合数据
  const aggregated = aggregateInsuranceRecords(records)

  // 2. 处理目标值
  const annualTargetYuan = options.annualTargetYuan
    ? Math.max(0, options.annualTargetYuan)
    : null
  const annualPolicyCountTarget = options.annualPolicyCountTarget
    ? Math.max(0, Math.round(options.annualPolicyCountTarget))
    : null
  const premiumPlanYuan = annualTargetYuan ?? aggregated.premium_plan_yuan

  // 3. 计算率值指标
  const loss_ratio = calculateLossRatio(
    aggregated.reported_claim_payment_yuan,
    aggregated.matured_premium_yuan
  )

  const expense_ratio = calculateExpenseRatio(
    aggregated.expense_amount_yuan,
    aggregated.signed_premium_yuan
  )

  const maturity_ratio = calculateMaturityRatio(
    aggregated.matured_premium_yuan,
    aggregated.signed_premium_yuan
  )

  const contribution_margin_ratio = calculateContributionMarginRatio(
    aggregated.marginal_contribution_amount_yuan,
    aggregated.matured_premium_yuan
  )

  const variable_cost_ratio = calculateVariableCostRatio(
    aggregated.reported_claim_payment_yuan,
    aggregated.expense_amount_yuan,
    aggregated.signed_premium_yuan
  )

  const matured_claim_ratio = calculateMaturedClaimRatio(
    aggregated.claim_case_count,
    aggregated.policy_count
  )

  const autonomy_coefficient = calculateAutonomyCoefficient(
    aggregated.signed_premium_yuan,
    aggregated.commercial_premium_before_discount_yuan
  )

  const premium_progress = calculatePremiumProgress(
    aggregated.signed_premium_yuan,
    premiumPlanYuan
  )

  // 4. 计算时间进度达成率
  const yearProgress = calculateYearProgress(options.currentWeekNumber)
  const completionRatio = safeDivide(
    aggregated.signed_premium_yuan,
    premiumPlanYuan
  )

  let premium_time_progress_achievement_rate: number | null = null
  if (options.mode === 'increment' && premiumPlanYuan > 0) {
    // 周增量模式：周增量 / 周计划
    const weekPlan = premiumPlanYuan / WORKING_WEEKS_PER_YEAR
    premium_time_progress_achievement_rate = toPercentage(
      safeDivide(aggregated.signed_premium_yuan, weekPlan)
    )
  } else if (completionRatio !== null && yearProgress > 0) {
    // 当周值模式：(达成率 / 时间进度) × 100%
    premium_time_progress_achievement_rate =
      (completionRatio / yearProgress) * 100
  }

  const policyCompletionRatio =
    annualPolicyCountTarget !== null
      ? safeDivide(aggregated.policy_count, annualPolicyCountTarget)
      : null
  const policy_count_time_progress_achievement_rate =
    policyCompletionRatio !== null && yearProgress > 0
      ? (policyCompletionRatio / yearProgress) * 100
      : null

  // 5. 计算均值指标
  const average_premium = calculateAveragePremium(
    aggregated.signed_premium_yuan,
    aggregated.policy_count
  )

  const average_claim = calculateAverageClaim(
    aggregated.reported_claim_payment_yuan,
    aggregated.claim_case_count
  )

  const average_expense = calculateAverageExpense(
    aggregated.expense_amount_yuan,
    aggregated.policy_count
  )

  const average_contribution = calculateAverageContribution(
    aggregated.marginal_contribution_amount_yuan,
    aggregated.policy_count
  )

  // 6. 返回结果
  return {
    // 率值指标
    loss_ratio,
    expense_ratio,
    maturity_ratio,
    contribution_margin_ratio,
    variable_cost_ratio,
    matured_claim_ratio,
    autonomy_coefficient,
    premium_progress,
    premium_time_progress_achievement_rate,
    policy_count_time_progress_achievement_rate,

    // 绝对值指标（万元）
    signed_premium: Math.round(aggregated.signed_premium_yuan / 10000),
    matured_premium: Math.round(aggregated.matured_premium_yuan / 10000),
    policy_count: aggregated.policy_count,
    claim_case_count: aggregated.claim_case_count,
    reported_claim_payment: Math.round(
      aggregated.reported_claim_payment_yuan / 10000
    ),
    expense_amount: Math.round(aggregated.expense_amount_yuan / 10000),
    contribution_margin_amount: Math.round(
      aggregated.marginal_contribution_amount_yuan / 10000
    ),

    // 均值指标（元）
    average_premium,
    average_claim,
    average_expense,
    average_contribution,

    // 目标相关
    annual_premium_target: annualTargetYuan
      ? Math.round(annualTargetYuan / 10000)
      : null, // 转换为万元
    annual_policy_count_target: annualPolicyCountTarget,
  }
}

/**
 * 计算周增量 KPI
 *
 * 逻辑说明：
 * - currentWeekRecords: 当前周的记录（CSV中是年初至今的累计数据）
 * - previousWeekRecords: 上周的记录（CSV中是年初至上周的累计数据）
 * - 增量计算：绝对值指标 = 当周累计 - 上周累计
 * - 比率计算：基于当周累计数据计算（不是基于增量）
 */
export function calculateIncrementKPIs(
  currentWeekRecords: InsuranceRecord[],
  previousWeekRecords: InsuranceRecord[],
  options: KPICalculationOptions = {}
): KPIResult {
  if (currentWeekRecords.length === 0) {
    return getEmptyKPIResult()
  }

  // 1. 聚合当前周和前一周数据
  const currentAgg = aggregateInsuranceRecords(currentWeekRecords)
  const previousAgg =
    previousWeekRecords.length > 0
      ? aggregateInsuranceRecords(previousWeekRecords)
      : getEmptyAggregation()

  // 2. 计算增量聚合数据
  const incrementAgg: AggregatedData = {
    signed_premium_yuan:
      currentAgg.signed_premium_yuan - previousAgg.signed_premium_yuan,
    matured_premium_yuan:
      currentAgg.matured_premium_yuan - previousAgg.matured_premium_yuan,
    policy_count: currentAgg.policy_count - previousAgg.policy_count,
    claim_case_count:
      currentAgg.claim_case_count - previousAgg.claim_case_count,
    reported_claim_payment_yuan:
      currentAgg.reported_claim_payment_yuan -
      previousAgg.reported_claim_payment_yuan,
    expense_amount_yuan:
      currentAgg.expense_amount_yuan - previousAgg.expense_amount_yuan,
    commercial_premium_before_discount_yuan:
      currentAgg.commercial_premium_before_discount_yuan -
      previousAgg.commercial_premium_before_discount_yuan,
    marginal_contribution_amount_yuan:
      currentAgg.marginal_contribution_amount_yuan -
      previousAgg.marginal_contribution_amount_yuan,
    premium_plan_yuan:
      currentAgg.premium_plan_yuan - previousAgg.premium_plan_yuan,
  }

  // 3. 计算增量 KPI（用于绝对值指标）
  const incrementResult = calculateKPIsFromAggregation(incrementAgg, {
    ...options,
    mode: 'increment',
  })

  // 4. 计算累计 KPI（用于比率指标）
  const cumulativeResult = calculateKPIsFromAggregation(currentAgg, {
    ...options,
    mode: 'current',
  })

  // 5. 合并结果：绝对值使用增量，比率使用累计
  return {
    // 【比率指标】使用累计数据计算
    loss_ratio: cumulativeResult.loss_ratio,
    maturity_ratio: cumulativeResult.maturity_ratio,
    expense_ratio: cumulativeResult.expense_ratio,
    contribution_margin_ratio: cumulativeResult.contribution_margin_ratio,
    variable_cost_ratio: cumulativeResult.variable_cost_ratio,
    matured_claim_ratio: cumulativeResult.matured_claim_ratio,
    autonomy_coefficient: cumulativeResult.autonomy_coefficient,

    // 【绝对值指标】使用增量数据
    signed_premium: incrementResult.signed_premium,
    matured_premium: incrementResult.matured_premium,
    policy_count: incrementResult.policy_count,
    claim_case_count: incrementResult.claim_case_count,
    reported_claim_payment: incrementResult.reported_claim_payment,
    expense_amount: incrementResult.expense_amount,
    contribution_margin_amount: incrementResult.contribution_margin_amount,

    // 【均值指标】使用增量数据计算
    average_premium: incrementResult.average_premium,
    average_claim: incrementResult.average_claim,
    average_expense: incrementResult.average_expense,
    average_contribution: incrementResult.average_contribution,

    // 【时间进度】使用增量数据
    premium_progress: incrementResult.premium_progress,
    premium_time_progress_achievement_rate:
      incrementResult.premium_time_progress_achievement_rate,
    policy_count_time_progress_achievement_rate:
      incrementResult.policy_count_time_progress_achievement_rate,

    // 【目标相关】
    annual_premium_target: incrementResult.annual_premium_target,
    annual_policy_count_target: incrementResult.annual_policy_count_target,
  }
}

// ============= 辅助函数 =============

/**
 * 从聚合数据计算 KPI
 */
function calculateKPIsFromAggregation(
  aggregated: AggregatedData,
  options: KPICalculationOptions = {}
): KPIResult {
  // 复用主要的 calculateKPIs 函数逻辑，但直接使用聚合数据
  const annualTargetYuan = options.annualTargetYuan
    ? Math.max(0, options.annualTargetYuan)
    : null
  const annualPolicyCountTarget = options.annualPolicyCountTarget
    ? Math.max(0, Math.round(options.annualPolicyCountTarget))
    : null
  const premiumPlanYuan = annualTargetYuan ?? aggregated.premium_plan_yuan

  // 计算各项指标（复用上面的函数）
  const loss_ratio = calculateLossRatio(
    aggregated.reported_claim_payment_yuan,
    aggregated.matured_premium_yuan
  )

  const expense_ratio = calculateExpenseRatio(
    aggregated.expense_amount_yuan,
    aggregated.signed_premium_yuan
  )

  const maturity_ratio = calculateMaturityRatio(
    aggregated.matured_premium_yuan,
    aggregated.signed_premium_yuan
  )

  const contribution_margin_ratio = calculateContributionMarginRatio(
    aggregated.marginal_contribution_amount_yuan,
    aggregated.matured_premium_yuan
  )

  const variable_cost_ratio = calculateVariableCostRatio(
    aggregated.reported_claim_payment_yuan,
    aggregated.expense_amount_yuan,
    aggregated.signed_premium_yuan
  )

  const matured_claim_ratio = calculateMaturedClaimRatio(
    aggregated.claim_case_count,
    aggregated.policy_count
  )

  const autonomy_coefficient = calculateAutonomyCoefficient(
    aggregated.signed_premium_yuan,
    aggregated.commercial_premium_before_discount_yuan
  )

  const premium_progress = calculatePremiumProgress(
    aggregated.signed_premium_yuan,
    premiumPlanYuan
  )

  // 时间进度达成率
  const yearProgress = calculateYearProgress(options.currentWeekNumber)
  const completionRatio = safeDivide(
    aggregated.signed_premium_yuan,
    premiumPlanYuan
  )

  let premium_time_progress_achievement_rate: number | null = null
  if (options.mode === 'increment' && premiumPlanYuan > 0) {
    const weekPlan = premiumPlanYuan / WORKING_WEEKS_PER_YEAR
    premium_time_progress_achievement_rate = toPercentage(
      safeDivide(aggregated.signed_premium_yuan, weekPlan)
    )
  } else if (completionRatio !== null && yearProgress > 0) {
    premium_time_progress_achievement_rate =
      (completionRatio / yearProgress) * 100
  }

  const policyCompletionRatio =
    annualPolicyCountTarget !== null
      ? safeDivide(aggregated.policy_count, annualPolicyCountTarget)
      : null
  const policy_count_time_progress_achievement_rate =
    policyCompletionRatio !== null && yearProgress > 0
      ? (policyCompletionRatio / yearProgress) * 100
      : null

  // 均值指标
  const average_premium = calculateAveragePremium(
    aggregated.signed_premium_yuan,
    aggregated.policy_count
  )

  const average_claim = calculateAverageClaim(
    aggregated.reported_claim_payment_yuan,
    aggregated.claim_case_count
  )

  const average_expense = calculateAverageExpense(
    aggregated.expense_amount_yuan,
    aggregated.policy_count
  )

  const average_contribution = calculateAverageContribution(
    aggregated.marginal_contribution_amount_yuan,
    aggregated.policy_count
  )

  return {
    loss_ratio,
    expense_ratio,
    maturity_ratio,
    contribution_margin_ratio,
    variable_cost_ratio,
    matured_claim_ratio,
    autonomy_coefficient,
    premium_progress,
    premium_time_progress_achievement_rate,
    policy_count_time_progress_achievement_rate,
    signed_premium: Math.round(aggregated.signed_premium_yuan / 10000),
    matured_premium: Math.round(aggregated.matured_premium_yuan / 10000),
    policy_count: aggregated.policy_count,
    claim_case_count: aggregated.claim_case_count,
    reported_claim_payment: Math.round(
      aggregated.reported_claim_payment_yuan / 10000
    ),
    expense_amount: Math.round(aggregated.expense_amount_yuan / 10000),
    contribution_margin_amount: Math.round(
      aggregated.marginal_contribution_amount_yuan / 10000
    ),
    average_premium,
    average_claim,
    average_expense,
    average_contribution,
    annual_premium_target: annualTargetYuan
      ? Math.round(annualTargetYuan / 10000)
      : null,
    annual_policy_count_target: annualPolicyCountTarget,
  }
}

/**
 * 获取空的聚合数据
 */
function getEmptyAggregation(): AggregatedData {
  return {
    signed_premium_yuan: 0,
    matured_premium_yuan: 0,
    policy_count: 0,
    claim_case_count: 0,
    reported_claim_payment_yuan: 0,
    expense_amount_yuan: 0,
    commercial_premium_before_discount_yuan: 0,
    marginal_contribution_amount_yuan: 0,
    premium_plan_yuan: 0,
  }
}

/**
 * 获取空的 KPI 结果
 */
export function getEmptyKPIResult(): KPIResult {
  return {
    loss_ratio: null,
    expense_ratio: null,
    maturity_ratio: null,
    contribution_margin_ratio: null,
    variable_cost_ratio: null,
    matured_claim_ratio: null,
    autonomy_coefficient: null,
    premium_progress: null,
    premium_time_progress_achievement_rate: null,
    policy_count_time_progress_achievement_rate: null,
    signed_premium: 0,
    matured_premium: 0,
    policy_count: 0,
    claim_case_count: 0,
    reported_claim_payment: 0,
    expense_amount: 0,
    contribution_margin_amount: 0,
    average_premium: null,
    average_claim: null,
    average_expense: null,
    average_contribution: null,
    annual_premium_target: null,
    annual_policy_count_target: null,
  }
}

// ============= KPI 计算引擎类 =============

/**
 * KPI 计算引擎类（带缓存）
 * 合并了原 kpi-engine.ts 的缓存功能
 */
export class KPIEngine {
  private cache: Map<string, KPIResult> = new Map()

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    records: InsuranceRecord[],
    mode?: string,
    targetOverride?: number | null
  ): string {
    // 使用记录数量和基础字段的哈希作为缓存键
    const targetKey = targetOverride ? `_${Math.round(targetOverride)}` : ''
    const key = `${mode || 'current'}_${records.length}_${records.reduce((sum, r) => sum + r.signedPremiumYuan, 0)}${targetKey}`
    return key
  }

  /**
   * 计算 KPI（当周值模式）
   * @param records 保险记录数组
   * @param options 计算选项
   * @returns KPI 计算结果
   */
  calculate(
    records: InsuranceRecord[],
    options: {
      annualTargetYuan?: number | null
      useCache?: boolean
      mode?: 'current' | 'increment'
      currentWeekNumber?: number | null
      year?: number | null
    } = {}
  ): KPIResult {
    const {
      annualTargetYuan = null,
      useCache = true,
      mode = 'current',
      currentWeekNumber = null,
      year = null,
    } = options

    if (records.length === 0) {
      return getEmptyKPIResult()
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(records, mode, annualTargetYuan)
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 计算 KPI
    const result = calculateKPIs(records, {
      annualTargetYuan: annualTargetYuan ?? null,
      mode,
      currentWeekNumber,
      year,
    })

    // 缓存结果
    if (useCache) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * 计算周增量 KPI
   * @param currentWeekRecords 当前周的记录（累计数据）
   * @param previousWeekRecords 前一周的记录（累计数据）
   * @param options 计算选项
   * @returns 周增量 KPI 结果
   */
  calculateIncrement(
    currentWeekRecords: InsuranceRecord[],
    previousWeekRecords: InsuranceRecord[],
    options: {
      useCache?: boolean
      mode?: 'current' | 'increment'
      annualTargetYuan?: number | null
      currentWeekNumber?: number | null
      year?: number | null
    } = {}
  ): KPIResult {
    const {
      useCache = true,
      mode = 'increment',
      annualTargetYuan = null,
      currentWeekNumber = null,
      year = null,
    } = options

    // 如果当前周没有数据，返回空结果
    if (currentWeekRecords.length === 0) {
      return getEmptyKPIResult()
    }

    // 检查缓存
    // 周增量模式的缓存键需要同时包含当前周和前一周的信息
    const currentWeek = currentWeekRecords[0]?.weekNumber ?? 0
    const currentYear = currentWeekRecords[0]?.policyStartYear ?? 0
    const previousWeek = previousWeekRecords[0]?.weekNumber ?? 0
    const previousYear = previousWeekRecords[0]?.policyStartYear ?? 0

    // 生成数据哈希：包含所有关键业务指标，避免只依赖保费总和
    const generateDataHash = (records: InsuranceRecord[]): string => {
      if (records.length === 0) return '0'
      const aggregated = aggregateInsuranceRecords(records)
      return [
        aggregated.signed_premium_yuan.toFixed(2),
        aggregated.matured_premium_yuan.toFixed(2),
        aggregated.policy_count,
        aggregated.claim_case_count,
        aggregated.reported_claim_payment_yuan.toFixed(2),
        aggregated.expense_amount_yuan.toFixed(2),
      ].join('_')
    }

    const currentHash = generateDataHash(currentWeekRecords)
    const previousHash = generateDataHash(previousWeekRecords)
    const targetKey = annualTargetYuan
      ? `_t${Math.round(annualTargetYuan)}`
      : ''
    const cacheKey = `inc_${currentYear}w${currentWeek}_${currentHash}_${previousYear}w${previousWeek}_${previousHash}${targetKey}`

    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 计算增量 KPI
    const result = calculateIncrementKPIs(
      currentWeekRecords,
      previousWeekRecords,
      {
        mode,
        annualTargetYuan,
        currentWeekNumber,
        year,
      }
    )

    // 缓存结果
    if (useCache) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * 导出单例实例
 */
export const kpiEngine = new KPIEngine()

/**
 * 便捷函数：直接计算 KPI
 */
export function calculateKPIsWithEngine(
  records: InsuranceRecord[],
  options?: { annualTargetYuan?: number | null; useCache?: boolean }
): KPIResult {
  return kpiEngine.calculate(records, options)
}
