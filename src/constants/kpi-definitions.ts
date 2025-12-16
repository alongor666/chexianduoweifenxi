/**
 * KPI 公式定义
 *
 * 从《核心指标计算引擎 V2.0》提取的关键公式与业务含义，
 * 用于前端展示公式提示。
 */

export interface KPIFormulaDefinition {
  /** 公式展示字符串 */
  formula: string
  /** 业务含义描述 */
  businessMeaning: string
  /** 可选的分子描述 */
  numerator?: string
  /** 可选的分母描述 */
  denominator?: string
  /** 示例或补充说明 */
  example?: string
}

export const KPI_FORMULAS: Record<string, KPIFormulaDefinition> = {
  contribution_margin_ratio: {
    formula: '100% - 变动成本率',
    businessMeaning: '盈利能力结果指标，衡量最终的盈利空间。',
  },
  premium_time_progress_achievement_rate: {
    formula: '(签单保费 / 年度目标) / (当前周次 / 50) × 100%',
    businessMeaning:
      '衡量保费达成进度与时间进度的匹配程度（基于50周工作制，考虑春节和国庆长假）。',
    example: '示例：第25周累计5500万，目标1亿，达成率 = (55% / 50%) = 110%',
  },
  loss_ratio: {
    formula: '满期赔付 / 满期保费',
    businessMeaning: '反映赔付支出占满期保费的比例。',
    numerator: '满期赔付',
    denominator: '满期保费',
  },
  expense_ratio: {
    formula: '总费用 / 签单保费',
    businessMeaning: '衡量获取和管理业务所需成本的效率。',
    numerator: '总费用',
    denominator: '签单保费',
  },
  contribution_margin_amount: {
    formula: '满期保费 × 满期边际贡献率',
    businessMeaning: '利润绝对值，定位利润的绝对贡献来源。',
  },
  signed_premium: {
    formula: 'Σ 签单保费',
    businessMeaning: '业务规模的核心体现。',
  },
  reported_claim_payment: {
    formula: 'Σ 已报告赔款',
    businessMeaning: '已发生并上报的赔案金额。',
  },
  expense_amount: {
    formula: 'Σ 总费用',
    businessMeaning: '业务相关的总费用支出。',
  },
  variable_cost_ratio: {
    formula: '满期赔付率 + 费用率',
    businessMeaning: '成本控制能力指标，诊断成本端的整体表现。',
  },
  maturity_ratio: {
    formula: '满期保费 / 签单保费',
    businessMeaning: '反映当期保费中已实现风险价值的部分。',
    numerator: '满期保费',
    denominator: '签单保费',
  },
  matured_claim_ratio: {
    formula: '赔案件数 / 满期保单数',
    businessMeaning: '衡量已满期保单的出险频率。',
    numerator: '赔案件数',
    denominator: '满期保单数',
  },
  policy_count: {
    formula: 'COUNT(保单)',
    businessMeaning: '业务规模的辅助指标。',
  },
  claim_case_count: {
    formula: 'COUNT(赔案)',
    businessMeaning: '赔付发生的频率。',
  },
  average_premium: {
    formula: '签单保费 / 保单件数',
    businessMeaning: '衡量平均每张保单的保费收入。',
    numerator: '签单保费',
    denominator: '保单件数',
  },
  average_claim: {
    formula: '已报告赔款 / 赔案件数',
    businessMeaning: '衡量平均每起赔案的赔付金额。',
    numerator: '已报告赔款',
    denominator: '赔案件数',
  },
  average_expense: {
    formula: '总费用 / 保单件数',
    businessMeaning: '衡量平均每张保单的费用成本。',
    numerator: '总费用',
    denominator: '保单件数',
  },
}

export function getKPIFormulaDefinition(
  kpiKey?: string
): KPIFormulaDefinition | undefined {
  if (!kpiKey) return undefined
  return KPI_FORMULAS[kpiKey]
}
