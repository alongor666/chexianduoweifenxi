/**
 * 测试辅助函数
 *
 * 提供创建测试数据的工具函数
 */

import { InsuranceRecord, type RawInsuranceData } from '../../domain'

/**
 * 创建测试用的 InsuranceRecord
 */
export function createTestInsuranceRecord(
  overrides?: Partial<{
    snapshotDate: string
    policyStartYear: number
    weekNumber: number
    signedPremiumYuan: number
    maturedPremiumYuan: number
    policyCount: number
    claimCaseCount: number
    reportedClaimPaymentYuan: number
    expenseAmountYuan: number
    commercialPremiumBeforeDiscountYuan: number
    premiumPlanYuan: number | null
    marginalContributionAmountYuan: number
  }>
): InsuranceRecord {
  return new InsuranceRecord(
    overrides?.snapshotDate || '2024-01-01',
    overrides?.policyStartYear || 2024,
    overrides?.weekNumber || 1,
    '成都',
    '测试机构',
    '非营业个人客车',
    '商业险',
    '非营业客车新车',
    '主全',
    '新保',
    false, // isNewEnergyVehicle
    false, // isTransferredVehicle
    null, // vehicleInsuranceGrade
    null, // highwayRiskGrade
    null, // largeTruckScore
    null, // smallTruckScore
    '直销', // terminalSource
    overrides?.signedPremiumYuan !== undefined
      ? overrides.signedPremiumYuan
      : 5000,
    overrides?.maturedPremiumYuan !== undefined
      ? overrides.maturedPremiumYuan
      : 4000,
    overrides?.policyCount !== undefined ? overrides.policyCount : 1,
    overrides?.claimCaseCount !== undefined ? overrides.claimCaseCount : 0,
    overrides?.reportedClaimPaymentYuan !== undefined
      ? overrides.reportedClaimPaymentYuan
      : 1000,
    overrides?.expenseAmountYuan !== undefined
      ? overrides.expenseAmountYuan
      : 500,
    overrides?.commercialPremiumBeforeDiscountYuan !== undefined
      ? overrides.commercialPremiumBeforeDiscountYuan
      : 6000,
    overrides?.premiumPlanYuan !== undefined ? overrides.premiumPlanYuan : null,
    overrides?.marginalContributionAmountYuan !== undefined
      ? overrides.marginalContributionAmountYuan
      : 3500
  )
}

/**
 * 创建测试用的 RawInsuranceData
 */
export function createTestRawData(
  overrides?: Partial<RawInsuranceData>
): RawInsuranceData {
  return {
    snapshot_date: overrides?.snapshot_date || '2024-01-01',
    policy_start_year: overrides?.policy_start_year || 2024,
    week_number: overrides?.week_number || 1,
    chengdu_branch: overrides?.chengdu_branch || '成都',
    third_level_organization: overrides?.third_level_organization || '测试机构',
    customer_category_3: overrides?.customer_category_3 || '非营业个人客车',
    insurance_type: overrides?.insurance_type || '商业险',
    business_type_category:
      overrides?.business_type_category || '非营业客车新车',
    coverage_type: overrides?.coverage_type || '主全',
    renewal_status: overrides?.renewal_status || '新保',
    is_new_energy_vehicle:
      overrides?.is_new_energy_vehicle !== undefined
        ? overrides.is_new_energy_vehicle
        : false,
    is_transferred_vehicle:
      overrides?.is_transferred_vehicle !== undefined
        ? overrides.is_transferred_vehicle
        : false,
    vehicle_insurance_grade: overrides?.vehicle_insurance_grade,
    highway_risk_grade: overrides?.highway_risk_grade,
    large_truck_score: overrides?.large_truck_score,
    small_truck_score: overrides?.small_truck_score,
    terminal_source: overrides?.terminal_source || '直销',
    signed_premium_yuan:
      overrides?.signed_premium_yuan !== undefined
        ? overrides.signed_premium_yuan
        : 5000,
    matured_premium_yuan:
      overrides?.matured_premium_yuan !== undefined
        ? overrides.matured_premium_yuan
        : 4000,
    policy_count:
      overrides?.policy_count !== undefined ? overrides.policy_count : 1,
    claim_case_count:
      overrides?.claim_case_count !== undefined
        ? overrides.claim_case_count
        : 0,
    reported_claim_payment_yuan:
      overrides?.reported_claim_payment_yuan !== undefined
        ? overrides.reported_claim_payment_yuan
        : 1000,
    expense_amount_yuan:
      overrides?.expense_amount_yuan !== undefined
        ? overrides.expense_amount_yuan
        : 500,
    commercial_premium_before_discount_yuan:
      overrides?.commercial_premium_before_discount_yuan !== undefined
        ? overrides.commercial_premium_before_discount_yuan
        : 6000,
    premium_plan_yuan:
      overrides?.premium_plan_yuan !== undefined
        ? overrides.premium_plan_yuan
        : null,
    marginal_contribution_amount_yuan:
      overrides?.marginal_contribution_amount_yuan !== undefined
        ? overrides.marginal_contribution_amount_yuan
        : 3500,
  }
}
