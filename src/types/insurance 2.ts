/**
 * 车险数据分析 - 核心类型定义
 */

// ============= 枚举类型定义 =============

/**
 * 三级机构枚举
 */
export enum ThirdLevelOrganization {
  HEADQUARTERS = '本部',
  DAZHOU = '达州',
  DEYANG = '德阳',
  GAOXIN = '高新',
  LESHAN = '乐山',
  LUZHOU = '泸州',
  QINGYANG = '青羊',
  TIANFU = '天府',
  WUHOU = '武侯',
  XINDU = '新都',
  YIBIN = '宜宾',
  ZIYANG = '资阳',
  ZIGONG = '自贡',
}

/**
 * 保险类型
 */
export type InsuranceType = '商业险' | '交强险'

/**
 * 险别组合
 */
export type CoverageType = '主全' | '交三' | '单交'

/**
 * 新续转状态
 */
export type RenewalStatus = '新保' | '续保' | '转保'

/**
 * 车险评级
 */
export type VehicleInsuranceGrade =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'X'

/**
 * 高速风险等级
 */
export type HighwayRiskGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X'

/**
 * 货车评分
 */
export type TruckScore = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'

// ============= 数据记录类型 =============

/**
 * 保险记录接口 - 单条数据记录
 */
export interface InsuranceRecord {
  // 时间维度
  snapshot_date: string // 快照日期 YYYY-MM-DD
  policy_start_year: number // 保单年度
  week_number: number // 周序号 1-105

  // 组织维度
  chengdu_branch: '成都' | '中支' // 地域属性
  second_level_organization?: string // 二级机构（可选）
  third_level_organization: string // 三级机构

  // 客户维度
  customer_category_3: string // 客户类型

  // 产品维度
  insurance_type: InsuranceType
  business_type_category: string // 业务类型
  coverage_type: CoverageType // 险别组合

  // 业务属性
  renewal_status: RenewalStatus
  is_new_energy_vehicle: boolean // 是否新能源
  is_transferred_vehicle: boolean // 是否过户车

  // 评级维度
  vehicle_insurance_grade?: VehicleInsuranceGrade // 车险评级 A-G/X（可选）
  highway_risk_grade?: HighwayRiskGrade // 高速风险等级（可选）
  large_truck_score?: TruckScore // 大货车评分（可选）
  small_truck_score?: TruckScore // 小货车评分（可选）

  // 渠道维度
  terminal_source: string // 终端来源

  // 业务指标（绝对值，单位：元）
  signed_premium_yuan: number // 签单保费 ≥0
  matured_premium_yuan: number // 满期保费 ≥0
  policy_count: number // 保单件数 ≥0
  claim_case_count: number // 赔案件数 ≥0
  reported_claim_payment_yuan: number // 已报告赔款 ≥0
  expense_amount_yuan: number // 费用金额 ≥0
  commercial_premium_before_discount_yuan: number // 商业险折前保费 ≥0
  premium_plan_yuan: number | null // 保费计划（可选）
  marginal_contribution_amount_yuan: number // 边际贡献额（可负）
}

// ============= KPI 类型定义 =============

/**
 * KPI 计算结果
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
 * 保费目标配置
 */
export type TargetDimensionKey =
  | 'businessType'
  | 'thirdLevelOrganization'
  | 'customerCategory'
  | 'insuranceType'

export const TARGET_DIMENSIONS: TargetDimensionKey[] = [
  'businessType',
  'thirdLevelOrganization',
  'customerCategory',
  'insuranceType',
]

export interface TargetVersionSnapshot {
  /**
   * 版本唯一标识
   */
  id: string

  /**
   * 版本名称（默认使用时间戳，可由用户自定义）
   */
  label: string

  /**
   * 创建时间
   */
  createdAt: string

  /**
   * 适用年度目标总额（单位：元）
   */
  overall: number

  /**
   * 各项目标快照（单位：元）
   */
  entries: Record<string, number>

  /**
   * 可选备注
   */
  note?: string
}

export interface DimensionTargetState {
  /**
   * 当前版本的目标配额（单位：元，key 为规范化后的实体文本）
   */
  entries: Record<string, number>

  /**
   * 当前版本更新时间（ISO 字符串）
   */
  updatedAt: string | null

  /**
   * 历史版本记录（最新版本排在前面）
   */
  versions: TargetVersionSnapshot[]
}

export type DimensionTargetMap = Record<
  TargetDimensionKey,
  DimensionTargetState
>

export interface PremiumTargets {
  /**
   * 适用年度
   */
  year: number

  /**
   * 车险整体年度保费目标（单位：元）
   */
  overall: number

  /**
   * 各业务类型年度保费目标（单位：元，向后兼容字段）
   */
  byBusinessType: Record<string, number>

  /**
   * 多维度目标配额
   */
  dimensions: DimensionTargetMap

  /**
   * 最后更新时间（ISO 字符串）
   */
  updatedAt: string | null
}

/**
 * KPI 对比结果
 */
export interface KPIComparison {
  type: 'yoy' | 'mom' | 'custom'
  baseline: KPIResult
  changes: {
    [key: string]: {
      absolute: number // 绝对变化值
      relative: number // 相对变化率（%）
      direction: 'up' | 'down' | 'flat'
    }
  }
}

/**
 * 完整的 KPI 响应
 */
export interface KPIResponse {
  filters: FilterState
  kpis: KPIResult
  comparison?: KPIComparison
  meta: {
    calculationTime: number // 计算耗时（ms）
    recordCount: number // 参与计算的记录数
    cacheHit: boolean // 是否命中缓存
    timestamp: string // 计算时间戳
  }
}

// ============= 筛选器类型 =============

/**
 * 筛选器状态 - 单层筛选配置
 */
export interface FilterState {
  // 顶层筛选
  viewMode: 'single' | 'trend' // 分析模式
  dataViewType: 'current' | 'increment' // 数据类型：当周值/周增量

  // 时间筛选
  years: number[] // 保单年度（多选）
  weeks: number[] // 周序号（多选）
  singleModeWeek: number | null // 单周模式当前选择的周次
  trendModeWeeks: number[] // 多周模式当前选择的周次集合

  // 组织筛选
  organizations: string[] // 三级机构

  // 产品筛选
  insuranceTypes: string[] // 保险类型
  businessTypes: string[] // 业务类型
  coverageTypes: string[] // 险别组合

  // 客户筛选
  customerCategories: string[] // 客户分类
  vehicleGrades: string[] // 车险评级

  // 其他筛选
  terminalSources: string[]
  isNewEnergy: boolean | null
  renewalStatuses: string[] // 新续转状态
}

/**
 * 分层筛选状态
 */
export interface HierarchicalFilterState {
  // 第一级：全局筛选（顶层，影响所有下级）
  global: Partial<FilterState>

  // 第二级：Tab级筛选（按Tab存储，继承全局）
  tabs: {
    kpi?: Partial<FilterState>
    trend?: Partial<FilterState>
    thematic?: Partial<FilterState>
    multichart?: Partial<FilterState>
    targets?: Partial<FilterState>
  }

  // 当前激活的Tab
  activeTab: 'kpi' | 'trend' | 'thematic' | 'multichart' | 'targets'
}

// ============= 聚合结果类型 =============

/**
 * 基础聚合结果
 */
export interface BaseAggregation {
  signed_premium_yuan: number
  matured_premium_yuan: number
  policy_count: number
  claim_case_count: number
  reported_claim_payment_yuan: number
  expense_amount_yuan: number
  commercial_premium_before_discount_yuan: number
  premium_plan_yuan: number
  marginal_contribution_amount_yuan: number
}

/**
 * 聚合结果（带 KPI）
 */
export interface AggregationResult extends BaseAggregation, KPIResult {}

// ============= 数据验证类型 =============

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  index?: number
  data?: InsuranceRecord
  errors?: Array<{
    field: string
    message: string
    code: string
  }>
}

/**
 * 批量验证结果
 */
export interface BatchValidationResult {
  totalRecords: number
  validRecords: number
  invalidRecords: ValidationResult[]
  validData: InsuranceRecord[]
}
