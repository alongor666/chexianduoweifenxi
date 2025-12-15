/**
 * 车险数据验证 Schema
 * 使用 Zod 进行运行时数据验证
 */

import { z } from 'zod'

// ============= 枚举值定义 =============

/**
 * 三级机构枚举
 */
const thirdLevelOrganizations = [
  '本部',
  '达州',
  '德阳',
  '高新',
  '乐山',
  '泸州',
  '青羊',
  '天府',
  '武侯',
  '新都',
  '宜宾',
  '资阳',
  '自贡',
] as const

/**
 * 保险类型
 */
const insuranceTypes = ['商业险', '交强险'] as const

/**
 * 险别组合
 */
const coverageTypes = ['主全', '交三', '单交'] as const

/**
 * 新续转状态
 */
const renewalStatuses = ['新保', '续保', '转保'] as const

/**
 * 车险评级
 */
const vehicleGrades = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const

/**
 * 地域属性
 */
const chengduBranches = ['成都', '中支'] as const

// ============= Schema 定义 =============

/**
 * 保险记录验证 Schema
 */
export const InsuranceRecordSchema = z
  .object({
    // 时间维度
    snapshot_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '快照日期格式必须为 YYYY-MM-DD')
      .refine(
        date => {
          const d = new Date(date)
          const minDate = new Date('2020-01-01')
          const maxDate = new Date()
          return d >= minDate && d <= maxDate
        },
        { message: '快照日期必须在 2020-01-01 至今之间' }
      ),

    policy_start_year: z
      .number()
      .int('保单年度必须是整数')
      .min(2020, '保单年度不能早于 2020')
      .max(2030, '保单年度不能晚于 2030'),

    week_number: z
      .number()
      .int('周序号必须是整数')
      .min(1, '周序号最小为 1')
      .max(105, '周序号最大为 105'),

    // 组织维度
    chengdu_branch: z.enum(chengduBranches, {
      message: '地域属性必须为"成都"或"中支"',
    }),

    second_level_organization: z.string().optional(),

    third_level_organization: z.enum(thirdLevelOrganizations, {
      message: '三级机构代码不存在',
    }),

    // 客户维度
    customer_category_3: z.string().min(1, '客户类型不能为空'),

    // 产品维度
    insurance_type: z.enum(insuranceTypes, {
      message: '保险类型只能是"商业险"或"交强险"',
    }),

    business_type_category: z.string().min(1, '业务类型不能为空'),

    coverage_type: z.enum(coverageTypes, {
      message: '险别组合必须是"主全"、"交三"或"单交"',
    }),

    // 业务属性
    renewal_status: z.enum(renewalStatuses, {
      message: '新续转状态必须是"新保"、"续保"或"转保"',
    }),

    is_new_energy_vehicle: z.boolean({
      message: '是否新能源车必须为布尔值',
    }),

    is_transferred_vehicle: z.boolean({
      message: '是否过户车必须为布尔值',
    }),

    // 评级维度 - 设为可选字段，允许空值
    vehicle_insurance_grade: z
      .enum(vehicleGrades, {
        message: '车险评级必须是 A-G',
      })
      .optional(),

    highway_risk_grade: z
      .enum([...vehicleGrades, 'X'] as const, {
        message: '高速风险等级必须是 A-F 或 X',
      })
      .optional(),

    large_truck_score: z
      .enum([...vehicleGrades.slice(0, 5), 'X'] as const, {
        message: '大货车评分必须是 A-E 或 X',
      })
      .optional(),

    small_truck_score: z
      .enum([...vehicleGrades.slice(0, 5), 'X'] as const, {
        message: '小货车评分必须是 A-E 或 X',
      })
      .optional(),

    // 渠道维度
    terminal_source: z.string().min(1, '终端来源不能为空'),

    // 业务指标（单位：元）
    signed_premium_yuan: z
      .number()
      .nonnegative('签单保费必须为非负数')
      .max(10000000, '签单保费不能超过 1000 万元'),

    matured_premium_yuan: z
      .number()
      .nonnegative('满期保费必须为非负数')
      .max(10000000, '满期保费不能超过 1000 万元'),

    policy_count: z
      .number()
      .int('保单件数必须是整数')
      .nonnegative('保单件数必须为非负数'),

    claim_case_count: z
      .number()
      .int('赔案件数必须是整数')
      .nonnegative('赔案件数必须为非负数'),

    // 注意：允许为负数（如追偿/冲减），详见 开发文档/03_technical_design/data_architecture.md
    reported_claim_payment_yuan: z.number(),

    expense_amount_yuan: z.number().nonnegative('费用金额必须为非负数'),

    commercial_premium_before_discount_yuan: z
      .number()
      .nonnegative('商业险折前保费必须为非负数'),

    premium_plan_yuan: z
      .number()
      .nonnegative('保费计划必须为非负数')
      .nullable(),

    marginal_contribution_amount_yuan: z.number(), // 可为负数
  })
  .refine(data => data.matured_premium_yuan <= data.signed_premium_yuan, {
    message: '满期保费不能超过签单保费',
    path: ['matured_premium_yuan'],
  })
// 取消以下规则以放宽上传校验：
// - 赔案件数 ≤ 保单件数（业务场景下可能不成立）
// - 商业险折前保费 ≥ 签单保费（现已不强制）
// - 非营业个人客车评级不能为 X（现允许为 X）

/**
 * 批量验证结果类型
 */
export type InsuranceRecordInput = z.infer<typeof InsuranceRecordSchema>

/**
 * 验证单条记录
 */
export function validateRecord(record: unknown): {
  valid: boolean
  data?: InsuranceRecordInput
  errors?: string[]
} {
  try {
    const validated = InsuranceRecordSchema.parse(record)
    return {
      valid: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 确保 error.issues 存在且是数组
      const errorList = error.issues || []
      return {
        valid: false,
        errors: errorList.map(
          (err: z.ZodIssue) =>
            `${err.path?.join('.') || 'unknown'}: ${err.message || '验证失败'}`
        ),
      }
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : '未知验证错误'],
    }
  }
}

/**
 * 批量验证记录
 */
export function validateRecords(records: unknown[]): {
  totalRecords: number
  validRecords: number
  invalidRecords: Array<{
    index: number
    errors: string[]
  }>
  validData: InsuranceRecordInput[]
} {
  const results = records.map((record, index) => ({
    index,
    ...validateRecord(record),
  }))

  const validResults = results.filter(r => r.valid)
  const invalidResults = results.filter(r => !r.valid)

  return {
    totalRecords: records.length,
    validRecords: validResults.length,
    invalidRecords: invalidResults.map(r => ({
      index: r.index,
      errors: r.errors || [],
    })),
    validData: validResults
      .map(r => r.data)
      .filter((d): d is InsuranceRecordInput => d !== undefined),
  }
}

/**
 * 导出枚举值供其他模块使用
 */
export const ENUMS = {
  thirdLevelOrganizations,
  insuranceTypes,
  coverageTypes,
  renewalStatuses,
  vehicleGrades,
  chengduBranches,
} as const
