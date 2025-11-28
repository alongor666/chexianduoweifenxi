/**
 * Domain 层 - KPI 计算规则
 *
 * 核心规则：
 * - 纯函数（无副作用）
 * - 不依赖任何外部框架
 * - 业务逻辑集中且透明
 *
 * 这个模块包含所有 KPI 的计算公式，是系统的核心业务逻辑。
 */

import { InsuranceRecord } from '../entities/InsuranceRecord'

/**
 * KPI 计算结果
 */
export interface KPIResult {
  // 率值指标（百分比）
  lossRatio: number | null // 满期赔付率
  expenseRatio: number | null // 费用率
  maturityRatio: number | null // 满期率
  contributionMarginRatio: number | null // 满期边际贡献率
  variableCostRatio: number | null // 变动成本率
  maturedClaimRatio: number | null // 满期出险率
  autonomyCoefficient: number | null // 商业险自主系数
  premiumProgress: number | null // 保费达成率
  premiumTimeProgressAchievementRate: number | null // 保费时间进度达成率
  policyCountTimeProgressAchievementRate: number | null // 件数时间进度达成率

  // 绝对值指标（元）
  signedPremium: number // 签单保费
  maturedPremium: number // 满期保费
  policyCount: number // 保单件数
  claimCaseCount: number // 赔案件数
  reportedClaimPayment: number // 已报告赔款
  expenseAmount: number // 费用金额
  contributionMarginAmount: number // 边际贡献额

  // 均值指标（元）
  averagePremium: number | null // 单均保费
  averageClaim: number | null // 案均赔款
  averageExpense: number | null // 单均费用
  averageContribution: number | null // 单均边贡额
}

/**
 * 聚合数据（中间计算结果）
 */
interface AggregatedData {
  signedPremiumYuan: number
  maturedPremiumYuan: number
  policyCount: number
  claimCaseCount: number
  reportedClaimPaymentYuan: number
  expenseAmountYuan: number
  commercialPremiumBeforeDiscountYuan: number
  marginalContributionAmountYuan: number
}

// ============= 工具函数 =============

/**
 * 安全除法 - 防止除零错误
 *
 * @param numerator - 分子
 * @param denominator - 分母
 * @returns 计算结果，除零时返回 null
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
 *
 * @param value - 小数值（0-1）
 * @returns 百分比值（0-100），如果输入为 null 则返回 null
 */
function toPercentage(value: number | null): number | null {
  if (value === null) {
    return null
  }
  return value * 100
}

// ============= 聚合函数 =============

/**
 * 聚合保险记录数据
 *
 * 将多条保险记录聚合为汇总数据，这是计算 KPI 的第一步。
 *
 * @param records - 保险记录数组
 * @returns 聚合后的数据
 */
export function aggregateInsuranceRecords(
  records: InsuranceRecord[]
): AggregatedData {
  return records.reduce(
    (acc, record) => ({
      signedPremiumYuan: acc.signedPremiumYuan + record.signedPremiumYuan,
      maturedPremiumYuan: acc.maturedPremiumYuan + record.maturedPremiumYuan,
      policyCount: acc.policyCount + record.policyCount,
      claimCaseCount: acc.claimCaseCount + record.claimCaseCount,
      reportedClaimPaymentYuan:
        acc.reportedClaimPaymentYuan + record.reportedClaimPaymentYuan,
      expenseAmountYuan: acc.expenseAmountYuan + record.expenseAmountYuan,
      commercialPremiumBeforeDiscountYuan:
        acc.commercialPremiumBeforeDiscountYuan +
        record.commercialPremiumBeforeDiscountYuan,
      marginalContributionAmountYuan:
        acc.marginalContributionAmountYuan +
        record.marginalContributionAmountYuan,
    }),
    {
      signedPremiumYuan: 0,
      maturedPremiumYuan: 0,
      policyCount: 0,
      claimCaseCount: 0,
      reportedClaimPaymentYuan: 0,
      expenseAmountYuan: 0,
      commercialPremiumBeforeDiscountYuan: 0,
      marginalContributionAmountYuan: 0,
    }
  )
}

// ============= 率值指标计算 =============

/**
 * 计算满期赔付率
 *
 * 公式：(已报告赔款 / 满期保费) × 100%
 * 业务含义：每 100 元满期保费对应的赔款支出
 *
 * @param reportedClaimPayment - 已报告赔款（元）
 * @param maturedPremium - 满期保费（元）
 * @returns 赔付率（%），满期保费为 0 时返回 null
 */
export function calculateLossRatio(
  reportedClaimPayment: number,
  maturedPremium: number
): number | null {
  return toPercentage(safeDivide(reportedClaimPayment, maturedPremium))
}

/**
 * 计算费用率
 *
 * 公式：(费用金额 / 签单保费) × 100%
 * 业务含义：每 100 元签单保费对应的费用支出
 *
 * @param expenseAmount - 费用金额（元）
 * @param signedPremium - 签单保费（元）
 * @returns 费用率（%），签单保费为 0 时返回 null
 */
export function calculateExpenseRatio(
  expenseAmount: number,
  signedPremium: number
): number | null {
  return toPercentage(safeDivide(expenseAmount, signedPremium))
}

/**
 * 计算满期率
 *
 * 公式：(满期保费 / 签单保费) × 100%
 * 业务含义：签单保费中已满期保费的占比
 *
 * @param maturedPremium - 满期保费（元）
 * @param signedPremium - 签单保费（元）
 * @returns 满期率（%），签单保费为 0 时返回 null
 */
export function calculateMaturityRatio(
  maturedPremium: number,
  signedPremium: number
): number | null {
  return toPercentage(safeDivide(maturedPremium, signedPremium))
}

/**
 * 计算满期边际贡献率
 *
 * 公式：(边际贡献额 / 满期保费) × 100%
 * 业务含义：每 100 元满期保费贡献的边际利润
 *
 * @param contributionMargin - 边际贡献额（元）
 * @param maturedPremium - 满期保费（元）
 * @returns 满期边际贡献率（%），满期保费为 0 时返回 null
 */
export function calculateContributionMarginRatio(
  contributionMargin: number,
  maturedPremium: number
): number | null {
  return toPercentage(safeDivide(contributionMargin, maturedPremium))
}

/**
 * 计算变动成本率
 *
 * 公式：(已报告赔款 + 费用金额) / 签单保费 × 100%
 * 业务含义：每 100 元签单保费的变动成本
 *
 * @param reportedClaimPayment - 已报告赔款（元）
 * @param expenseAmount - 费用金额（元）
 * @param signedPremium - 签单保费（元）
 * @returns 变动成本率（%），签单保费为 0 时返回 null
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
 *
 * 公式：(赔案件数 / 保单件数) × 100%
 * 业务含义：每 100 件保单中的出险件数
 *
 * @param claimCaseCount - 赔案件数
 * @param policyCount - 保单件数
 * @returns 满期出险率（%），保单件数为 0 时返回 null
 */
export function calculateMaturedClaimRatio(
  claimCaseCount: number,
  policyCount: number
): number | null {
  return toPercentage(safeDivide(claimCaseCount, policyCount))
}

/**
 * 计算商业险自主系数
 *
 * 公式：签单保费 / 商业险折前保费
 * 业务含义：实际签单保费与折前保费的比值，反映定价能力
 *
 * @param signedPremium - 签单保费（元）
 * @param commercialPremiumBeforeDiscount - 商业险折前保费（元）
 * @returns 自主系数，折前保费为 0 时返回 null
 */
export function calculateAutonomyCoefficient(
  signedPremium: number,
  commercialPremiumBeforeDiscount: number
): number | null {
  return safeDivide(signedPremium, commercialPremiumBeforeDiscount)
}

/**
 * 计算保费达成率
 *
 * 公式：(签单保费 / 保费目标) × 100%
 * 业务含义：实际签单保费占年度目标的百分比
 *
 * @param signedPremium - 签单保费（元）
 * @param premiumTarget - 保费目标（元）
 * @returns 保费达成率（%），目标为 0 或 null 时返回 null
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
 *
 * 公式：签单保费 / 保单件数
 * 业务含义：平均每件保单的保费金额
 *
 * @param signedPremium - 签单保费（元）
 * @param policyCount - 保单件数
 * @returns 单均保费（元），保单件数为 0 时返回 null
 */
export function calculateAveragePremium(
  signedPremium: number,
  policyCount: number
): number | null {
  return safeDivide(signedPremium, policyCount)
}

/**
 * 计算案均赔款
 *
 * 公式：已报告赔款 / 赔案件数
 * 业务含义：平均每个赔案的赔款金额
 *
 * @param reportedClaimPayment - 已报告赔款（元）
 * @param claimCaseCount - 赔案件数
 * @returns 案均赔款（元），赔案件数为 0 时返回 null
 */
export function calculateAverageClaim(
  reportedClaimPayment: number,
  claimCaseCount: number
): number | null {
  return safeDivide(reportedClaimPayment, claimCaseCount)
}

/**
 * 计算单均费用
 *
 * 公式：费用金额 / 保单件数
 * 业务含义：平均每件保单的费用金额
 *
 * @param expenseAmount - 费用金额（元）
 * @param policyCount - 保单件数
 * @returns 单均费用（元），保单件数为 0 时返回 null
 */
export function calculateAverageExpense(
  expenseAmount: number,
  policyCount: number
): number | null {
  return safeDivide(expenseAmount, policyCount)
}

/**
 * 计算单均边贡额
 *
 * 公式：边际贡献额 / 保单件数
 * 业务含义：平均每件保单的边际贡献
 *
 * @param contributionMargin - 边际贡献额（元）
 * @param policyCount - 保单件数
 * @returns 单均边贡额（元），保单件数为 0 时返回 null
 */
export function calculateAverageContribution(
  contributionMargin: number,
  policyCount: number
): number | null {
  return safeDivide(contributionMargin, policyCount)
}

// ============= 综合计算函数 =============

/**
 * 计算完整的 KPI 结果
 *
 * 这是主函数，接收保险记录数组，返回所有 KPI 指标。
 *
 * @param records - 保险记录数组
 * @param options - 计算选项（目标值等）
 * @returns KPI 计算结果
 */
export function calculateKPIs(
  records: InsuranceRecord[],
  options: {
    premiumTarget?: number | null
    policyCountTarget?: number | null
  } = {}
): KPIResult {
  // 1. 聚合数据
  const aggregated = aggregateInsuranceRecords(records)

  // 2. 计算率值指标
  const lossRatio = calculateLossRatio(
    aggregated.reportedClaimPaymentYuan,
    aggregated.maturedPremiumYuan
  )

  const expenseRatio = calculateExpenseRatio(
    aggregated.expenseAmountYuan,
    aggregated.signedPremiumYuan
  )

  const maturityRatio = calculateMaturityRatio(
    aggregated.maturedPremiumYuan,
    aggregated.signedPremiumYuan
  )

  const contributionMarginRatio = calculateContributionMarginRatio(
    aggregated.marginalContributionAmountYuan,
    aggregated.maturedPremiumYuan
  )

  const variableCostRatio = calculateVariableCostRatio(
    aggregated.reportedClaimPaymentYuan,
    aggregated.expenseAmountYuan,
    aggregated.signedPremiumYuan
  )

  const maturedClaimRatio = calculateMaturedClaimRatio(
    aggregated.claimCaseCount,
    aggregated.policyCount
  )

  const autonomyCoefficient = calculateAutonomyCoefficient(
    aggregated.signedPremiumYuan,
    aggregated.commercialPremiumBeforeDiscountYuan
  )

  const premiumProgress = calculatePremiumProgress(
    aggregated.signedPremiumYuan,
    options.premiumTarget ?? null
  )

  // 3. 计算均值指标
  const averagePremium = calculateAveragePremium(
    aggregated.signedPremiumYuan,
    aggregated.policyCount
  )

  const averageClaim = calculateAverageClaim(
    aggregated.reportedClaimPaymentYuan,
    aggregated.claimCaseCount
  )

  const averageExpense = calculateAverageExpense(
    aggregated.expenseAmountYuan,
    aggregated.policyCount
  )

  const averageContribution = calculateAverageContribution(
    aggregated.marginalContributionAmountYuan,
    aggregated.policyCount
  )

  // 4. 返回完整结果
  return {
    // 率值指标
    lossRatio,
    expenseRatio,
    maturityRatio,
    contributionMarginRatio,
    variableCostRatio,
    maturedClaimRatio,
    autonomyCoefficient,
    premiumProgress,
    premiumTimeProgressAchievementRate: null, // 需要时间进度信息
    policyCountTimeProgressAchievementRate: null, // 需要时间进度信息

    // 绝对值指标
    signedPremium: aggregated.signedPremiumYuan,
    maturedPremium: aggregated.maturedPremiumYuan,
    policyCount: aggregated.policyCount,
    claimCaseCount: aggregated.claimCaseCount,
    reportedClaimPayment: aggregated.reportedClaimPaymentYuan,
    expenseAmount: aggregated.expenseAmountYuan,
    contributionMarginAmount: aggregated.marginalContributionAmountYuan,

    // 均值指标
    averagePremium,
    averageClaim,
    averageExpense,
    averageContribution,
  }
}
