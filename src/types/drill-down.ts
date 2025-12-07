/**
 * KPI下钻功能类型定义
 */

import type { InsuranceRecord } from './insurance'

/**
 * 可下钻的维度键
 */
export type DrillDownDimensionKey =
  | 'third_level_organization' // 三级机构
  | 'business_type_category' // 业务类型
  | 'coverage_type' // 险别组合
  | 'terminal_source' // 终端来源
  | 'is_new_energy_vehicle' // 能源类型
  | 'renewal_status' // 新转续维度（续保状态）
  | 'is_transferred_vehicle' // 是否过户车
  | 'insurance_type' // 车险种类

/**
 * 维度配置
 */
export interface DrillDownDimension {
  /**
   * 维度键（对应 InsuranceRecord 的字段名）
   */
  key: DrillDownDimensionKey

  /**
   * 维度显示名称
   */
  label: string

  /**
   * 维度描述
   */
  description?: string

  /**
   * 从记录中提取维度值的函数
   */
  getValue: (record: InsuranceRecord) => string | boolean
}

/**
 * 下钻路径中的单个步骤
 */
export interface DrillDownStep {
  /**
   * 维度键
   */
  dimensionKey: DrillDownDimensionKey

  /**
   * 维度显示名称
   */
  dimensionLabel: string

  /**
   * 选择的值
   */
  value: string | boolean

  /**
   * 显示的标签
   */
  displayLabel: string
}

/**
 * 单个KPI的下钻路径
 */
export interface KPIDrillDownPath {
  /**
   * KPI标识（例如："loss_ratio"）
   */
  kpiKey: string

  /**
   * 下钻路径（按下钻顺序排列）
   */
  steps: DrillDownStep[]
}

/**
 * 全局下钻状态
 */
export interface DrillDownState {
  /**
   * 所有KPI的下钻路径
   * key为KPI标识
   */
  paths: Record<string, KPIDrillDownPath>

  /**
   * 添加下钻步骤
   */
  addDrillDownStep: (
    kpiKey: string,
    step: DrillDownStep
  ) => void

  /**
   * 移除指定步骤及之后的所有步骤（用于面包屑导航）
   */
  removeDrillDownStepsFrom: (kpiKey: string, stepIndex: number) => void

  /**
   * 清空指定KPI的下钻路径
   */
  clearDrillDownPath: (kpiKey: string) => void

  /**
   * 获取指定KPI已使用的维度键
   */
  getUsedDimensions: (kpiKey: string) => DrillDownDimensionKey[]

  /**
   * 获取指定KPI可用的维度列表（排除已使用的）
   */
  getAvailableDimensions: (kpiKey: string) => DrillDownDimension[]
}

/**
 * 所有可用的下钻维度配置
 */
export const DRILL_DOWN_DIMENSIONS: DrillDownDimension[] = [
  {
    key: 'third_level_organization',
    label: '三级机构',
    description: '按三级机构进行下钻分析',
    getValue: (record) => record.third_level_organization,
  },
  {
    key: 'business_type_category',
    label: '业务类型',
    description: '按业务类型进行下钻分析',
    getValue: (record) => record.business_type_category,
  },
  {
    key: 'coverage_type',
    label: '险别组合',
    description: '按险别组合进行下钻分析',
    getValue: (record) => record.coverage_type,
  },
  {
    key: 'terminal_source',
    label: '终端来源',
    description: '按终端来源进行下钻分析',
    getValue: (record) => record.terminal_source,
  },
  {
    key: 'is_new_energy_vehicle',
    label: '能源类型',
    description: '按能源类型进行下钻分析',
    getValue: (record) => record.is_new_energy_vehicle,
  },
  {
    key: 'renewal_status',
    label: '新转续维度',
    description: '按续保状态进行下钻分析',
    getValue: (record) => record.renewal_status,
  },
  {
    key: 'is_transferred_vehicle',
    label: '是否过户车',
    description: '按是否过户车进行下钻分析',
    getValue: (record) => record.is_transferred_vehicle,
  },
  {
    key: 'insurance_type',
    label: '车险种类',
    description: '按车险种类进行下钻分析',
    getValue: (record) => record.insurance_type,
  },
]

/**
 * 根据维度键获取维度配置
 */
export function getDimensionByKey(
  key: DrillDownDimensionKey
): DrillDownDimension | undefined {
  return DRILL_DOWN_DIMENSIONS.find((dim) => dim.key === key)
}

/**
 * 格式化布尔值为显示文本
 */
export function formatBooleanValue(value: boolean): string {
  if (value === true) return '是'
  if (value === false) return '否'
  return String(value)
}
