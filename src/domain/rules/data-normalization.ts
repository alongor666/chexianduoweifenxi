/**
 * Domain 层 - 数据规范化规则
 *
 * 核心规则：
 * - 纯函数（无副作用）
 * - 统一的数据清洗逻辑
 * - 防御性编程（处理各种异常情况）
 *
 * 这个模块负责将外部数据转换为符合系统规范的格式。
 */

import { InsuranceRecord, RawInsuranceData } from '../entities/InsuranceRecord'

/**
 * 规范化中文文本
 *
 * 清理中文文本中的不可见字符、多余空格等，确保数据一致性。
 *
 * 业务背景：
 * CSV 文件可能包含：
 * - 零宽字符（\u200B, \u200C, \u200D, \uFEFF）
 * - 全角空格（\u3000）
 * - 首尾空格
 *
 * @param text - 原始文本
 * @returns 规范化后的文本
 *
 * @example
 * normalizeChineseText(" 成都 \u200B ") // "成都"
 * normalizeChineseText("武侯　区") // "武侯区"
 */
export function normalizeChineseText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return (
    text
      // 1. 移除零宽字符
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // 2. 将全角空格替换为半角空格
      .replace(/\u3000/g, ' ')
      // 3. 移除首尾空格
      .trim()
      // 4. 将多个连续空格替换为单个空格
      .replace(/\s+/g, ' ')
  )
}

/**
 * 规范化数字
 *
 * 将各种可能的数字表示（字符串、null、undefined）转换为有效数字。
 *
 * @param value - 原始值
 * @param defaultValue - 默认值（当无法转换时使用）
 * @returns 规范化后的数字
 *
 * @example
 * normalizeNumber("123.45", 0) // 123.45
 * normalizeNumber(null, 0) // 0
 * normalizeNumber("abc", 0) // 0
 */
export function normalizeNumber(
  value: unknown,
  defaultValue: number = 0
): number {
  // 如果已经是有效数字，直接返回
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  // 尝试将字符串转换为数字
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return defaultValue
    }
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  // 无法转换，返回默认值
  return defaultValue
}

/**
 * 规范化布尔值
 *
 * 将各种可能的布尔表示转换为标准布尔值。
 *
 * @param value - 原始值
 * @param defaultValue - 默认值
 * @returns 规范化后的布尔值
 *
 * @example
 * normalizeBoolean("true", false) // true
 * normalizeBoolean("是", false) // true
 * normalizeBoolean(1, false) // true
 * normalizeBoolean("否", false) // false
 */
export function normalizeBoolean(
  value: unknown,
  defaultValue: boolean = false
): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    if (lower === 'true' || lower === '是' || lower === 'yes' || lower === '1') {
      return true
    }
    if (
      lower === 'false' ||
      lower === '否' ||
      lower === 'no' ||
      lower === '0'
    ) {
      return false
    }
  }

  return defaultValue
}

/**
 * 规范化日期字符串
 *
 * 确保日期格式为 YYYY-MM-DD。
 *
 * @param value - 原始值
 * @param defaultValue - 默认值
 * @returns 规范化后的日期字符串
 *
 * @example
 * normalizeDateString("2025-01-14", "") // "2025-01-14"
 * normalizeDateString("2025/01/14", "") // "2025-01-14"
 */
export function normalizeDateString(
  value: unknown,
  defaultValue: string = ''
): string {
  if (typeof value !== 'string') {
    return defaultValue
  }

  const trimmed = value.trim()

  // 已经是 YYYY-MM-DD 格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // 转换 YYYY/MM/DD 或 YYYY.MM.DD 格式
  if (/^\d{4}[\/\.]\d{2}[\/\.]\d{2}$/.test(trimmed)) {
    return trimmed.replace(/[\/\.]/g, '-')
  }

  return defaultValue
}

/**
 * 验证周序号
 *
 * 周序号必须在 1-105 之间（对应 2 年的周次）。
 *
 * @param weekNumber - 周序号
 * @returns 验证通过返回原值，否则抛出错误
 */
export function validateWeekNumber(weekNumber: number): number {
  if (weekNumber < 1 || weekNumber > 105) {
    throw new Error(`周序号必须在 1-105 之间，当前值：${weekNumber}`)
  }
  return weekNumber
}

/**
 * 验证年份
 *
 * 年份必须在合理范围内（2000-2100）。
 *
 * @param year - 年份
 * @returns 验证通过返回原值，否则抛出错误
 */
export function validateYear(year: number): number {
  if (year < 2000 || year > 2100) {
    throw new Error(`年份必须在 2000-2100 之间，当前值：${year}`)
  }
  return year
}

/**
 * 规范化保险记录
 *
 * 这是主函数，将原始数据转换为规范化的 InsuranceRecord 实体。
 *
 * 处理步骤：
 * 1. 清理中文文本（去除不可见字符）
 * 2. 转换数字类型（确保有效性）
 * 3. 转换布尔类型（统一格式）
 * 4. 验证业务规则（周序号、年份等）
 * 5. 创建实体对象（触发不变式验证）
 *
 * @param raw - 原始数据
 * @returns 规范化后的保险记录实体
 * @throws 如果数据不符合业务规则
 *
 * @example
 * const raw = {
 *   snapshot_date: "2025-01-14",
 *   policy_start_year: 2025,
 *   week_number: 45,
 *   // ... 其他字段
 * }
 * const normalized = normalizeInsuranceRecord(raw)
 */
export function normalizeInsuranceRecord(
  raw: RawInsuranceData
): InsuranceRecord {
  // 1. 规范化文本字段
  const snapshotDate = normalizeDateString(raw.snapshot_date, '')
  const thirdLevelOrganization = normalizeChineseText(
    raw.third_level_organization
  )
  const customerCategory = normalizeChineseText(raw.customer_category_3)
  const businessTypeCategory = normalizeChineseText(raw.business_type_category)
  const terminalSource = normalizeChineseText(raw.terminal_source)

  // 2. 规范化数字字段
  const policyStartYear = validateYear(normalizeNumber(raw.policy_start_year))
  const weekNumber = validateWeekNumber(normalizeNumber(raw.week_number))
  const signedPremiumYuan = normalizeNumber(raw.signed_premium_yuan, 0)
  const maturedPremiumYuan = normalizeNumber(raw.matured_premium_yuan, 0)
  const policyCount = normalizeNumber(raw.policy_count, 0)
  const claimCaseCount = normalizeNumber(raw.claim_case_count, 0)
  const reportedClaimPaymentYuan = normalizeNumber(
    raw.reported_claim_payment_yuan,
    0
  )
  const expenseAmountYuan = normalizeNumber(raw.expense_amount_yuan, 0)
  const commercialPremiumBeforeDiscountYuan = normalizeNumber(
    raw.commercial_premium_before_discount_yuan,
    0
  )
  const premiumPlanYuan =
    raw.premium_plan_yuan !== null && raw.premium_plan_yuan !== undefined
      ? normalizeNumber(raw.premium_plan_yuan, 0)
      : null
  const marginalContributionAmountYuan = normalizeNumber(
    raw.marginal_contribution_amount_yuan,
    0
  )

  // 3. 规范化布尔字段
  const isNewEnergyVehicle = normalizeBoolean(raw.is_new_energy_vehicle, false)
  const isTransferredVehicle = normalizeBoolean(
    raw.is_transferred_vehicle,
    false
  )

  // 4. 规范化可选字段
  const vehicleInsuranceGrade = raw.vehicle_insurance_grade
    ? normalizeChineseText(raw.vehicle_insurance_grade)
    : null
  const highwayRiskGrade = raw.highway_risk_grade
    ? normalizeChineseText(raw.highway_risk_grade)
    : null
  const largeTruckScore = raw.large_truck_score
    ? normalizeChineseText(raw.large_truck_score)
    : null
  const smallTruckScore = raw.small_truck_score
    ? normalizeChineseText(raw.small_truck_score)
    : null

  // 5. 创建实体（会触发不变式验证）
  return new InsuranceRecord(
    snapshotDate,
    policyStartYear,
    weekNumber,
    raw.chengdu_branch,
    thirdLevelOrganization,
    customerCategory,
    raw.insurance_type,
    businessTypeCategory,
    raw.coverage_type,
    raw.renewal_status,
    isNewEnergyVehicle,
    isTransferredVehicle,
    vehicleInsuranceGrade,
    highwayRiskGrade,
    largeTruckScore,
    smallTruckScore,
    terminalSource,
    signedPremiumYuan,
    maturedPremiumYuan,
    policyCount,
    claimCaseCount,
    reportedClaimPaymentYuan,
    expenseAmountYuan,
    commercialPremiumBeforeDiscountYuan,
    premiumPlanYuan,
    marginalContributionAmountYuan
  )
}

/**
 * 批量规范化保险记录
 *
 * 处理一批原始数据，返回成功和失败的结果。
 *
 * @param rawRecords - 原始数据数组
 * @returns 规范化结果
 */
export function normalizeInsuranceRecordsBatch(
  rawRecords: RawInsuranceData[]
): {
  success: InsuranceRecord[]
  failed: Array<{ index: number; data: RawInsuranceData; error: Error }>
} {
  const success: InsuranceRecord[] = []
  const failed: Array<{ index: number; data: RawInsuranceData; error: Error }> =
    []

  rawRecords.forEach((raw, index) => {
    try {
      const normalized = normalizeInsuranceRecord(raw)
      success.push(normalized)
    } catch (error) {
      failed.push({
        index,
        data: raw,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  })

  return { success, failed }
}
