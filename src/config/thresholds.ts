/**
 * 统一阈值配置体系
 *
 * 定义5级阈值标准：卓越、优秀、健康、预警、危险
 * 为所有KPI指标提供统一的阈值判断和颜色映射
 */

// 阈值等级枚举
export type ThresholdLevel =
  | 'excellent'
  | 'outstanding'
  | 'healthy'
  | 'warning'
  | 'danger'

// 阈值等级配置
export interface ThresholdConfig {
  level: ThresholdLevel
  label: string
  color: string
  bgColor: string
  priority: number // 用于排序，数字越小优先级越高（危险=1，预警=2，以此类推）
}

// 阈值范围定义
export interface ThresholdRange {
  min?: number
  max?: number
  level: ThresholdLevel
}

// 指标阈值配置
export interface MetricThresholds {
  metricKey: string
  metricName: string
  unit: string
  ranges: ThresholdRange[]
  // 对于某些指标，值越小越好（如赔付率），值越大越好（如达成率）
  isHigherBetter: boolean
}

// 阈值等级映射表
export const THRESHOLD_LEVELS: Record<ThresholdLevel, ThresholdConfig> = {
  excellent: {
    level: 'excellent',
    label: '卓越',
    color: '#059669', // 深绿色
    bgColor: '#ecfdf5',
    priority: 5,
  },
  outstanding: {
    level: 'outstanding',
    label: '优秀',
    color: '#0284c7', // 深蓝色
    bgColor: '#f0f9ff',
    priority: 4,
  },
  healthy: {
    level: 'healthy',
    label: '健康',
    color: '#10b981', // 绿色
    bgColor: '#d1fae5',
    priority: 3,
  },
  warning: {
    level: 'warning',
    label: '预警',
    color: '#f59e0b', // 橙色
    bgColor: '#fef3c7',
    priority: 2,
  },
  danger: {
    level: 'danger',
    label: '危险',
    color: '#ef4444', // 红色
    bgColor: '#fee2e2',
    priority: 1,
  },
}

// 核心KPI指标阈值配置
export const METRIC_THRESHOLDS: MetricThresholds[] = [
  // 时间进度达成率（越高越好）
  {
    metricKey: 'time_progress_ratio',
    metricName: '时间进度达成率',
    unit: '%',
    isHigherBetter: true,
    ranges: [
      { max: 60, level: 'danger' }, // <60% 危险
      { min: 60, max: 80, level: 'warning' }, // 60-80% 预警
      { min: 80, max: 95, level: 'healthy' }, // 80-95% 健康
      { min: 95, max: 105, level: 'outstanding' }, // 95-105% 优秀
      { min: 105, level: 'excellent' }, // >105% 卓越
    ],
  },

  // 变动成本率（越低越好）
  {
    metricKey: 'variable_cost_ratio',
    metricName: '变动成本率',
    unit: '%',
    isHigherBetter: false,
    ranges: [
      { min: 92, level: 'danger' }, // >92% 危险
      { min: 85, max: 92, level: 'warning' }, // 85-92% 预警
      { min: 75, max: 85, level: 'healthy' }, // 75-85% 健康
      { min: 65, max: 75, level: 'outstanding' }, // 65-75% 优秀
      { max: 65, level: 'excellent' }, // <65% 卓越
    ],
  },

  // 满期赔付率（越低越好）
  {
    metricKey: 'loss_ratio',
    metricName: '满期赔付率',
    unit: '%',
    isHigherBetter: false,
    ranges: [
      { min: 80, level: 'danger' }, // >80% 危险
      { min: 70, max: 80, level: 'warning' }, // 70-80% 预警
      { min: 60, max: 70, level: 'healthy' }, // 60-70% 健康
      { min: 50, max: 60, level: 'outstanding' }, // 50-60% 优秀
      { max: 50, level: 'excellent' }, // <50% 卓越
    ],
  },

  // 费用率（越低越好）
  {
    metricKey: 'expense_ratio',
    metricName: '费用率',
    unit: '%',
    isHigherBetter: false,
    ranges: [
      { min: 30, level: 'danger' }, // >30% 危险
      { min: 25, max: 30, level: 'warning' }, // 25-30% 预警
      { min: 20, max: 25, level: 'healthy' }, // 20-25% 健康
      { min: 15, max: 20, level: 'outstanding' }, // 15-20% 优秀
      { max: 15, level: 'excellent' }, // <15% 卓越
    ],
  },

  // 边际贡献率（越高越好）
  {
    metricKey: 'contribution_margin_ratio',
    metricName: '边际贡献率',
    unit: '%',
    isHigherBetter: true,
    ranges: [
      { max: 10, level: 'danger' }, // <10% 危险
      { min: 10, max: 20, level: 'warning' }, // 10-20% 预警
      { min: 20, max: 30, level: 'healthy' }, // 20-30% 健康
      { min: 30, max: 40, level: 'outstanding' }, // 30-40% 优秀
      { min: 40, level: 'excellent' }, // >40% 卓越
    ],
  },

  // 综合成本率（越低越好）
  {
    metricKey: 'combined_ratio',
    metricName: '综合成本率',
    unit: '%',
    isHigherBetter: false,
    ranges: [
      { min: 105, level: 'danger' }, // >105% 危险
      { min: 100, max: 105, level: 'warning' }, // 100-105% 预警
      { min: 95, max: 100, level: 'healthy' }, // 95-100% 健康
      { min: 90, max: 95, level: 'outstanding' }, // 90-95% 优秀
      { max: 90, level: 'excellent' }, // <90% 卓越
    ],
  },
  // 满期出险率（越低越好）
  {
    metricKey: 'matured_claim_ratio',
    metricName: '满期出险率',
    unit: '%',
    isHigherBetter: false,
    ranges: [
      { min: 12, level: 'danger' }, // >12% 危险
      { min: 11.5, max: 12, level: 'warning' }, // 11.5-12% 预警
      { min: 11, max: 11.5, level: 'healthy' }, // 11-11.5% 健康
      { min: 10.5, max: 11, level: 'outstanding' }, // 10.5-11% 优秀
      { max: 10.5, level: 'excellent' }, // <10.5% 卓越
    ],
  },

  // 案均赔款（越低越好）
  {
    metricKey: 'average_claim',
    metricName: '案均赔款',
    unit: '元',
    isHigherBetter: false,
    ranges: [
      { min: 5400, level: 'danger' }, // >5400 元 危险
      { min: 5200, max: 5400, level: 'warning' }, // 5200-5400 预警
      { min: 5000, max: 5200, level: 'healthy' }, // 5000-5200 健康
      { min: 4800, max: 5000, level: 'outstanding' }, // 4800-5000 优秀
      { max: 4800, level: 'excellent' }, // <4800 卓越
    ],
  },

  // 单均费用（越低越好） — 占位阈值，待用户确认
  {
    metricKey: 'average_expense',
    metricName: '单均费用',
    unit: '元',
    isHigherBetter: false,
    ranges: [
      { min: 700, level: 'danger' }, // >700 元 危险（占位）
      { min: 500, max: 700, level: 'warning' }, // 500-700 预警（占位）
      { min: 300, max: 500, level: 'healthy' }, // 300-500 健康（占位）
      { min: 150, max: 300, level: 'outstanding' }, // 150-300 优秀（占位）
      { max: 150, level: 'excellent' }, // <150 元 卓越（占位）
    ],
  },
  // 费用金额（相对值越低越好） — 占位阈值，待用户确认
  {
    metricKey: 'expense_amount',
    metricName: '费用金额',
    unit: '万元',
    isHigherBetter: false,
    ranges: [
      { min: 10000, level: 'danger' }, // >10000 万 危险（占位）
      { min: 5000, max: 10000, level: 'warning' }, // 5000-10000 预警（占位）
      { min: 2000, max: 5000, level: 'healthy' }, // 2000-5000 健康（占位）
      { min: 500, max: 2000, level: 'outstanding' }, // 500-2000 优秀（占位）
      { max: 500, level: 'excellent' }, // <500 万 卓越（占位）
    ],
  },
]

/**
 * 获取指标阈值配置
 */
export function getMetricThresholds(
  metricKey: string
): MetricThresholds | null {
  return (
    METRIC_THRESHOLDS.find(config => config.metricKey === metricKey) || null
  )
}

/**
 * 根据值判断阈值等级
 */
export function getThresholdLevel(
  value: number | null,
  metricKey: string
): ThresholdLevel {
  if (value === null || value === undefined) {
    return 'warning' // 缺失数据视为预警
  }

  const config = getMetricThresholds(metricKey)
  if (!config) {
    return 'healthy' // 默认健康
  }

  // 遍历阈值范围，找到匹配的等级
  for (const range of config.ranges) {
    let inRange = false

    if (range.min !== undefined && range.max !== undefined) {
      inRange = value >= range.min && value <= range.max
    } else if (range.min !== undefined) {
      inRange = value >= range.min
    } else if (range.max !== undefined) {
      inRange = value <= range.max
    }

    if (inRange) {
      return range.level
    }
  }

  return 'healthy' // 默认健康
}

/**
 * 获取阈值等级配置
 */
export function getThresholdConfig(level: ThresholdLevel): ThresholdConfig {
  return THRESHOLD_LEVELS[level]
}

/**
 * 获取指标对应的颜色
 */
export function getMetricColor(
  value: number | null,
  metricKey: string
): string {
  const level = getThresholdLevel(value, metricKey)
  return getThresholdConfig(level).color
}

/**
 * 获取指标对应的背景色
 */
export function getMetricBgColor(
  value: number | null,
  metricKey: string
): string {
  const level = getThresholdLevel(value, metricKey)
  return getThresholdConfig(level).bgColor
}

/**
 * 获取指标对应的标签文本
 */
export function getMetricLabel(
  value: number | null,
  metricKey: string
): string {
  const level = getThresholdLevel(value, metricKey)
  return getThresholdConfig(level).label
}

/**
 * 根据阈值等级排序（从最差到最好）
 */
export function sortByThresholdLevel<T>(
  items: T[],
  getValue: (item: T) => number | null,
  metricKey: string
): T[] {
  return [...items].sort((a, b) => {
    const levelA = getThresholdLevel(getValue(a), metricKey)
    const levelB = getThresholdLevel(getValue(b), metricKey)

    const priorityA = getThresholdConfig(levelA).priority
    const priorityB = getThresholdConfig(levelB).priority

    // 优先级小的排在前面（危险、预警、健康、优秀、卓越）
    return priorityA - priorityB
  })
}

/**
 * 根据数值排序（从最差到最好）
 */
export function sortByValue<T>(
  items: T[],
  getValue: (item: T) => number | null,
  metricKey: string
): T[] {
  const config = getMetricThresholds(metricKey)
  if (!config) return items

  return [...items].sort((a, b) => {
    const valueA = getValue(a) ?? 0
    const valueB = getValue(b) ?? 0

    // 如果指标是越高越好，则降序排列；否则升序排列
    return config.isHigherBetter ? valueB - valueA : valueA - valueB
  })
}

/**
 * 检查值是否处于危险或预警状态
 */
export function isValueAtRisk(
  value: number | null,
  metricKey: string
): boolean {
  const level = getThresholdLevel(value, metricKey)
  return level === 'danger' || level === 'warning'
}

/**
 * 获取所有指标键名
 */
export function getAllMetricKeys(): string[] {
  return METRIC_THRESHOLDS.map(config => config.metricKey)
}
