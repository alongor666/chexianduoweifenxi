/**
 * Domain 层 - 保险记录实体
 *
 * 核心规则：
 * - 纯 TypeScript（不依赖任何框架）
 * - 不可变数据结构
 * - 包含领域行为方法
 */

/**
 * 保险记录实体
 *
 * 这是系统的核心业务实体，代表一条车险数据记录。
 * 包含时间、组织、客户、产品、评级、渠道等多个维度的信息。
 */
export class InsuranceRecord {
  constructor(
    // 时间维度
    public readonly snapshotDate: string, // 快照日期 YYYY-MM-DD
    public readonly policyStartYear: number, // 保单年度
    public readonly weekNumber: number, // 周序号 1-105

    // 组织维度
    public readonly chengduBranch: '成都' | '中支', // 地域属性
    public readonly thirdLevelOrganization: string, // 三级机构

    // 客户维度
    public readonly customerCategory: string, // 客户类型

    // 产品维度
    public readonly insuranceType: '商业险' | '交强险',
    public readonly businessTypeCategory: string, // 业务类型
    public readonly coverageType: '主全' | '交三' | '单交', // 险别组合

    // 业务属性
    public readonly renewalStatus: '新保' | '续保' | '转保',
    public readonly isNewEnergyVehicle: boolean, // 是否新能源
    public readonly isTransferredVehicle: boolean, // 是否过户车

    // 评级维度（可选）
    public readonly vehicleInsuranceGrade: string | null, // 车险评级 A-G/X
    public readonly highwayRiskGrade: string | null, // 高速风险等级
    public readonly largeTruckScore: string | null, // 大货车评分
    public readonly smallTruckScore: string | null, // 小货车评分

    // 渠道维度
    public readonly terminalSource: string, // 终端来源

    // 业务指标（绝对值，单位：元）
    public readonly signedPremiumYuan: number, // 签单保费 ≥0
    public readonly maturedPremiumYuan: number, // 满期保费 ≥0
    public readonly policyCount: number, // 保单件数 ≥0
    public readonly claimCaseCount: number, // 赔案件数 ≥0
    public readonly reportedClaimPaymentYuan: number, // 已报告赔款 ≥0
    public readonly expenseAmountYuan: number, // 费用金额 ≥0
    public readonly commercialPremiumBeforeDiscountYuan: number, // 商业险折前保费 ≥0
    public readonly premiumPlanYuan: number | null, // 保费计划（可选）
    public readonly marginalContributionAmountYuan: number // 边际贡献额（可负）
  ) {
    // 基础验证（确保不变式）
    this.validateInvariants()
  }

  /**
   * 验证不变式（领域规则）
   *
   * 不变式是领域实体必须始终满足的业务规则。
   */
  private validateInvariants(): void {
    // 时间维度验证
    if (this.weekNumber < 1 || this.weekNumber > 105) {
      throw new Error(`周序号必须在 1-105 之间，当前值：${this.weekNumber}`)
    }

    if (this.policyStartYear < 2000 || this.policyStartYear > 2100) {
      throw new Error(`保单年度异常：${this.policyStartYear}`)
    }

    // 业务指标验证（非负值）
    const nonNegativeFields = [
      { name: '签单保费', value: this.signedPremiumYuan },
      { name: '满期保费', value: this.maturedPremiumYuan },
      { name: '保单件数', value: this.policyCount },
      { name: '赔案件数', value: this.claimCaseCount },
      // { name: '已报告赔款', value: this.reportedClaimPaymentYuan }, // 允许为负数（如追偿）
      { name: '费用金额', value: this.expenseAmountYuan },
      {
        name: '商业险折前保费',
        value: this.commercialPremiumBeforeDiscountYuan,
      },
    ]

    for (const field of nonNegativeFields) {
      if (field.value < 0) {
        throw new Error(`${field.name}不能为负数，当前值：${field.value}`)
      }
    }
  }

  // ============= 领域行为方法（业务查询） =============

  /**
   * 判断是否为高价值保单
   *
   * 业务规则：签单保费 > 10000 元
   */
  isHighValuePolicy(): boolean {
    return this.signedPremiumYuan > 10000
  }

  /**
   * 判断是否为商业险
   */
  isCommercialInsurance(): boolean {
    return this.insuranceType === '商业险'
  }

  /**
   * 判断是否为交强险
   */
  isCompulsoryInsurance(): boolean {
    return this.insuranceType === '交强险'
  }

  /**
   * 判断是否为新保
   */
  isNewPolicy(): boolean {
    return this.renewalStatus === '新保'
  }

  /**
   * 判断是否为续保
   */
  isRenewalPolicy(): boolean {
    return this.renewalStatus === '续保'
  }

  /**
   * 判断是否有赔案
   */
  hasClaims(): boolean {
    return this.claimCaseCount > 0
  }

  /**
   * 判断是否有保费计划
   */
  hasPremiumPlan(): boolean {
    return this.premiumPlanYuan !== null && this.premiumPlanYuan > 0
  }

  /**
   * 获取单均保费（元）
   *
   * 业务规则：签单保费 / 保单件数
   */
  getAveragePremium(): number | null {
    if (this.policyCount === 0) {
      return null
    }
    return this.signedPremiumYuan / this.policyCount
  }

  /**
   * 获取案均赔款（元）
   *
   * 业务规则：已报告赔款 / 赔案件数
   */
  getAverageClaimPayment(): number | null {
    if (this.claimCaseCount === 0) {
      return null
    }
    return this.reportedClaimPaymentYuan / this.claimCaseCount
  }

  /**
   * 获取单均费用（元）
   *
   * 业务规则：费用金额 / 保单件数
   */
  getAverageExpense(): number | null {
    if (this.policyCount === 0) {
      return null
    }
    return this.expenseAmountYuan / this.policyCount
  }

  /**
   * 获取单均边贡额（元）
   *
   * 业务规则：边际贡献额 / 保单件数
   */
  getAverageContribution(): number | null {
    if (this.policyCount === 0) {
      return null
    }
    return this.marginalContributionAmountYuan / this.policyCount
  }

  /**
   * 判断是否满期
   *
   * 业务规则：满期保费 > 0
   */
  isMatured(): boolean {
    return this.maturedPremiumYuan > 0
  }

  /**
   * 判断是否出险
   *
   * 业务规则：已报告赔款 > 0
   */
  hasClaimed(): boolean {
    return this.reportedClaimPaymentYuan > 0
  }

  // ============= 值对象转换 =============

  /**
   * 转换为原始数据格式（用于存储）
   *
   * 注意：这个方法返回的是原始数据格式，用于与外部系统交互。
   * 不应该在 Domain 层内部使用。
   */
  toRawData(): RawInsuranceData {
    return {
      snapshot_date: this.snapshotDate,
      policy_start_year: this.policyStartYear,
      week_number: this.weekNumber,
      chengdu_branch: this.chengduBranch,
      third_level_organization: this.thirdLevelOrganization,
      customer_category_3: this.customerCategory,
      insurance_type: this.insuranceType,
      business_type_category: this.businessTypeCategory,
      coverage_type: this.coverageType,
      renewal_status: this.renewalStatus,
      is_new_energy_vehicle: this.isNewEnergyVehicle,
      is_transferred_vehicle: this.isTransferredVehicle,
      vehicle_insurance_grade: this.vehicleInsuranceGrade ?? undefined,
      highway_risk_grade: this.highwayRiskGrade ?? undefined,
      large_truck_score: this.largeTruckScore ?? undefined,
      small_truck_score: this.smallTruckScore ?? undefined,
      terminal_source: this.terminalSource,
      signed_premium_yuan: this.signedPremiumYuan,
      matured_premium_yuan: this.maturedPremiumYuan,
      policy_count: this.policyCount,
      claim_case_count: this.claimCaseCount,
      reported_claim_payment_yuan: this.reportedClaimPaymentYuan,
      expense_amount_yuan: this.expenseAmountYuan,
      commercial_premium_before_discount_yuan:
        this.commercialPremiumBeforeDiscountYuan,
      premium_plan_yuan: this.premiumPlanYuan,
      marginal_contribution_amount_yuan: this.marginalContributionAmountYuan,
    }
  }

  /**
   * 从原始数据创建实体（工厂方法）
   */
  static fromRawData(raw: RawInsuranceData): InsuranceRecord {
    return new InsuranceRecord(
      raw.snapshot_date,
      raw.policy_start_year,
      raw.week_number,
      raw.chengdu_branch,
      raw.third_level_organization,
      raw.customer_category_3,
      raw.insurance_type,
      raw.business_type_category,
      raw.coverage_type,
      raw.renewal_status,
      raw.is_new_energy_vehicle,
      raw.is_transferred_vehicle,
      raw.vehicle_insurance_grade ?? null,
      raw.highway_risk_grade ?? null,
      raw.large_truck_score ?? null,
      raw.small_truck_score ?? null,
      raw.terminal_source,
      raw.signed_premium_yuan,
      raw.matured_premium_yuan,
      raw.policy_count,
      raw.claim_case_count,
      raw.reported_claim_payment_yuan,
      raw.expense_amount_yuan,
      raw.commercial_premium_before_discount_yuan,
      raw.premium_plan_yuan ?? null,
      raw.marginal_contribution_amount_yuan
    )
  }
}

/**
 * 原始数据格式（来自数据库/API）
 *
 * 这个类型用于与外部系统交互，使用 snake_case 命名。
 */
export interface RawInsuranceData {
  snapshot_date: string
  policy_start_year: number
  week_number: number
  chengdu_branch: '成都' | '中支'
  second_level_organization?: string
  third_level_organization: string
  customer_category_3: string
  insurance_type: '商业险' | '交强险'
  business_type_category: string
  coverage_type: '主全' | '交三' | '单交'
  renewal_status: '新保' | '续保' | '转保'
  is_new_energy_vehicle: boolean
  is_transferred_vehicle: boolean
  vehicle_insurance_grade?: string
  highway_risk_grade?: string
  large_truck_score?: string
  small_truck_score?: string
  terminal_source: string
  signed_premium_yuan: number
  matured_premium_yuan: number
  policy_count: number
  claim_case_count: number
  reported_claim_payment_yuan: number
  expense_amount_yuan: number
  commercial_premium_before_discount_yuan: number
  premium_plan_yuan?: number | null
  marginal_contribution_amount_yuan: number
}
