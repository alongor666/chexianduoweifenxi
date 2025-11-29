/**
 * KPI 计算公式定义和说明
 * 提供完全透明的计算逻辑展示
 */

export interface KPIFormulaDefinition {
  /**
   * KPI 名称
   */
  name: string;

  /**
   * KPI 代码
   */
  key: string;

  /**
   * 计算公式（LaTeX 或纯文本格式）
   */
  formula: string;

  /**
   * 公式说明（人类可读）
   */
  description: string;

  /**
   * 分子说明
   */
  numerator?: string;

  /**
   * 分母说明
   */
  denominator?: string;

  /**
   * 单位
   */
  unit: string;

  /**
   * 业务含义
   */
  businessMeaning: string;

  /**
   * 计算示例
   */
  example?: string;
}

/**
 * 所有 KPI 的公式定义
 */
export const KPI_FORMULAS: Record<string, KPIFormulaDefinition> = {
  // ============= 率值指标 =============
  loss_ratio: {
    name: "满期赔付率",
    key: "loss_ratio",
    formula: "(已报告赔款 / 满期保费) × 100%",
    description: "每100元满期保费对应的赔款支出",
    numerator: "已报告赔款（元）",
    denominator: "满期保费（元）",
    unit: "%",
    businessMeaning: "反映保险业务的风险成本，赔付率越低表示盈利能力越强",
    example: "赔款500万元 ÷ 满期保费1000万元 = 50%",
  },

  expense_ratio: {
    name: "费用率",
    key: "expense_ratio",
    formula: "(费用金额 / 签单保费) × 100%",
    description: "每100元签单保费对应的费用支出",
    numerator: "费用金额（元）",
    denominator: "签单保费（元）",
    unit: "%",
    businessMeaning: "反映业务的运营效率，费用率越低表示管理越精细",
    example: "费用300万元 ÷ 签单保费1000万元 = 30%",
  },

  maturity_ratio: {
    name: "满期率",
    key: "maturity_ratio",
    formula: "(满期保费 / 签单保费) × 100%",
    description: "签单保费中已满期保费的占比",
    numerator: "满期保费（元）",
    denominator: "签单保费（元）",
    unit: "%",
    businessMeaning: "反映保单的成熟度，满期率越高表示保单越接近全年覆盖",
    example: "满期保费800万元 ÷ 签单保费1000万元 = 80%",
  },

  contribution_margin_ratio: {
    name: "满期边际贡献率",
    key: "contribution_margin_ratio",
    formula: "(边际贡献额 / 满期保费) × 100%",
    description: "每100元满期保费贡献的边际利润",
    numerator: "边际贡献额（元）",
    denominator: "满期保费（元）",
    unit: "%",
    businessMeaning: "反映业务的盈利能力，贡献率越高表示盈利越好",
    example: "边际贡献200万元 ÷ 满期保费1000万元 = 20%",
  },

  variable_cost_ratio: {
    name: "变动成本率",
    key: "variable_cost_ratio",
    formula: "费用率 + 满期赔付率",
    description: "综合成本率，包含费用和赔款",
    unit: "%",
    businessMeaning: "反映业务的综合成本水平，成本率越低越好",
    example: "费用率30% + 赔付率50% = 80%",
  },

  matured_claim_ratio: {
    name: "满期出险率",
    key: "matured_claim_ratio",
    formula: "(赔案件数 / 保单件数) × 满期率",
    description: "考虑满期因素的出险率",
    numerator: "赔案件数",
    denominator: "保单件数",
    unit: "%",
    businessMeaning: "反映客户的出险频率，出险率越低表示客户质量越好",
    example: "(500件 ÷ 10000件) × 80% = 4%",
  },

  autonomy_coefficient: {
    name: "商业险自主系数",
    key: "autonomy_coefficient",
    formula: "签单保费 / 商业险折前保费",
    description: "实际签单保费与标准保费的比率",
    numerator: "签单保费（元）",
    denominator: "商业险折前保费（元）",
    unit: "",
    businessMeaning: "反映定价的自主性和折扣力度，系数越接近1表示折扣越少",
    example: "签单800万元 ÷ 折前1000万元 = 0.80",
  },

  premium_progress: {
    name: "保费达成率",
    key: "premium_progress",
    formula: "(签单保费 / 保费计划) / (已过天数 / 365) × 100%",
    description: "考虑时间进度的保费完成情况",
    numerator: "实际签单保费（元）",
    denominator: "计划保费 × 时间进度",
    unit: "%",
    businessMeaning: "反映业务进度是否符合预期，达成率>100%表示超额完成",
    example: "(签单500万 ÷ 计划1000万) ÷ (182天 ÷ 365天) = 100.3%",
  },

  // ============= 绝对值指标（万元）=============
  signed_premium: {
    name: "签单保费",
    key: "signed_premium",
    formula: "Σ 签单保费（元）/ 10000",
    description: "所有保单的签单保费总和，单位万元",
    unit: "万元",
    businessMeaning: "反映业务规模，是最核心的业务量指标",
    example: "1000万元保费",
  },

  matured_premium: {
    name: "满期保费",
    key: "matured_premium",
    formula: "Σ 满期保费（元）/ 10000",
    description: "已满期保单的保费总和，单位万元",
    unit: "万元",
    businessMeaning: "反映已经完全成熟的保费规模",
    example: "800万元满期保费",
  },

  policy_count: {
    name: "保单件数",
    key: "policy_count",
    formula: "Σ 保单件数",
    description: "保单的总数量",
    unit: "件",
    businessMeaning: "反映业务量的数量维度",
    example: "10,000件保单",
  },

  claim_case_count: {
    name: "赔案件数",
    key: "claim_case_count",
    formula: "Σ 赔案件数",
    description: "发生理赔的案件总数",
    unit: "件",
    businessMeaning: "反映出险频率的绝对数量",
    example: "500件赔案",
  },

  reported_claim_payment: {
    name: "已报告赔款",
    key: "reported_claim_payment",
    formula: "Σ 已报告赔款（元）/ 10000",
    description: "已报告的赔款支出总和，单位万元",
    unit: "万元",
    businessMeaning: "反映赔款成本的绝对规模",
    example: "500万元赔款",
  },

  expense_amount: {
    name: "费用金额",
    key: "expense_amount",
    formula: "Σ 费用金额（元）/ 10000",
    description: "业务费用支出总和，单位万元",
    unit: "万元",
    businessMeaning: "反映运营成本的绝对规模",
    example: "300万元费用",
  },

  contribution_margin_amount: {
    name: "边际贡献额",
    key: "contribution_margin_amount",
    formula: "Σ 边际贡献额（元）/ 10000",
    description: "边际利润总和，单位万元",
    unit: "万元",
    businessMeaning: "反映盈利能力的绝对金额",
    example: "200万元边际贡献",
  },

  // ============= 均值指标（元）=============
  average_premium: {
    name: "件均保费",
    key: "average_premium",
    formula: "签单保费（元）/ 保单件数",
    description: "每张保单的平均保费",
    numerator: "签单保费总额（元）",
    denominator: "保单件数",
    unit: "元",
    businessMeaning: "反映单均业务价值，件均越高表示客户质量越好",
    example: "1000万元 ÷ 10000件 = 1000元/件",
  },

  average_claim: {
    name: "件均赔款",
    key: "average_claim",
    formula: "已报告赔款（元）/ 赔案件数",
    description: "每个赔案的平均赔款金额",
    numerator: "已报告赔款总额（元）",
    denominator: "赔案件数",
    unit: "元",
    businessMeaning: "反映案件严重程度，件均赔款越高表示风险越大",
    example: "500万元 ÷ 500件 = 10000元/件",
  },

  average_expense: {
    name: "件均费用",
    key: "average_expense",
    formula: "费用金额（元）/ 保单件数",
    description: "每张保单的平均费用支出",
    numerator: "费用总额（元）",
    denominator: "保单件数",
    unit: "元",
    businessMeaning: "反映单均运营成本，件均费用越低表示效率越高",
    example: "300万元 ÷ 10000件 = 300元/件",
  },
};

/**
 * 获取 KPI 公式定义
 */
export function getKPIFormula(
  kpiKey: string,
): KPIFormulaDefinition | undefined {
  return KPI_FORMULAS[kpiKey];
}

/**
 * 获取所有 KPI 公式定义
 */
export function getAllKPIFormulas(): KPIFormulaDefinition[] {
  return Object.values(KPI_FORMULAS);
}

/**
 * 格式化计算详情
 * @param kpiKey KPI 键名
 * @param numeratorValue 分子值
 * @param denominatorValue 分母值
 * @param result 计算结果
 */
export function formatCalculationDetail(
  kpiKey: string,
  numeratorValue?: number | null,
  denominatorValue?: number | null,
  result?: number | null,
): string {
  const formula = getKPIFormula(kpiKey);
  if (!formula) return "";

  if (!formula.numerator || !formula.denominator) {
    return formula.formula;
  }

  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return val.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  };

  return `${formula.numerator}: ${formatValue(numeratorValue)}\n${formula.denominator}: ${formatValue(denominatorValue)}\n结果 = ${formatValue(result)}${formula.unit}`;
}
