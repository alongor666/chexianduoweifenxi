/**
 * 主题分析专用五级预警色彩系统
 * 为不同KPI指标提供动态色彩计算
 */

export interface ColorScale {
  text: string
  bg: string
  progress: string
  border: string
  level: 'excellent' | 'good' | 'medium' | 'warning' | 'danger'
  label: string
}

/**
 * 保费进度达成率五级预警色彩
 * @param rate 时间进度达成率（%）例如：110表示进度超前10%
 * @returns ColorScale 色彩对象
 *
 * 业务规则（根据PRD精确定义）：
 * - 卓越（≥110%）：进度超前10%以上，深绿色
 * - 健康（100-110%）：进度正常或略微超前，绿色
 * - 预警（90-100%）：进度略微落后，黄色
 * - 危险（80-90%）：进度明显落后，橙色
 * - 高危（<80%）：进度严重落后，红色
 */
export function getDynamicColorByPremiumProgress(
  rate: number | null | undefined
): ColorScale {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return {
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      progress: 'bg-slate-400',
      border: 'border-slate-300',
      level: 'medium',
      label: '无数据',
    }
  }

  if (rate >= 110) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      progress: 'bg-green-600',
      border: 'border-green-300',
      level: 'excellent',
      label: '卓越',
    }
  }

  if (rate >= 100) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      progress: 'bg-green-500',
      border: 'border-green-200',
      level: 'good',
      label: '健康',
    }
  }

  if (rate >= 90) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      progress: 'bg-yellow-500',
      border: 'border-yellow-200',
      level: 'warning',
      label: '预警',
    }
  }

  if (rate >= 80) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      progress: 'bg-orange-500',
      border: 'border-orange-200',
      level: 'warning',
      label: '危险',
    }
  }

  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    progress: 'bg-red-500',
    border: 'border-red-200',
    level: 'danger',
    label: '高危',
  }
}

/**
 * 满期赔付率五级预警色彩
 * @param ratio 满期赔付率（%）
 * @returns ColorScale 色彩对象
 *
 * 业务规则：
 * - 优秀（<50%）：赔付风险极低，深绿色
 * - 良好（50-60%）：赔付风险较低，绿色
 * - 中等（60-70%）：赔付风险正常，蓝色
 * - 预警（70-80%）：赔付风险偏高，黄色
 * - 高危（>80%）：赔付风险严重，红色
 */
export function getDynamicColorByLossRatio(
  ratio: number | null | undefined
): ColorScale {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return {
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      progress: 'bg-slate-400',
      border: 'border-slate-300',
      level: 'medium',
      label: '无数据',
    }
  }

  if (ratio < 50) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      progress: 'bg-green-600',
      border: 'border-green-300',
      level: 'excellent',
      label: '优秀',
    }
  }

  if (ratio < 60) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      progress: 'bg-green-500',
      border: 'border-green-200',
      level: 'good',
      label: '良好',
    }
  }

  if (ratio < 70) {
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      progress: 'bg-blue-500',
      border: 'border-blue-200',
      level: 'medium',
      label: '中等',
    }
  }

  if (ratio < 80) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      progress: 'bg-yellow-500',
      border: 'border-yellow-200',
      level: 'warning',
      label: '预警',
    }
  }

  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    progress: 'bg-red-500',
    border: 'border-red-200',
    level: 'danger',
    label: '高危',
  }
}

/**
 * 满期边际贡献率五级预警色彩（扩展版，6级）
 * @param ratio 满期边际贡献率（%）
 * @returns ColorScale 色彩对象
 *
 * 业务规则（来自CLAUDE.md）：
 * - 优秀（>12%）：深绿色 #2E7D32
 * - 良好（8-12%）：浅绿色 #4CAF50
 * - 中等（~8%，即 6-8%）：蓝色 #1976D2
 * - 一般（4-6%）：黄色 #FBC02D
 * - 较差（0-4%）：橙色 #F57C00
 * - 严重（<0%）：红色 #D32F2F
 */
export function getDynamicColorByContributionMargin(
  ratio: number | null | undefined
): ColorScale {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return {
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      progress: 'bg-slate-400',
      border: 'border-slate-300',
      level: 'medium',
      label: '无数据',
    }
  }

  if (ratio > 12) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      progress: 'bg-green-600',
      border: 'border-green-300',
      level: 'excellent',
      label: '优秀',
    }
  }

  if (ratio >= 8) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      progress: 'bg-green-500',
      border: 'border-green-200',
      level: 'good',
      label: '良好',
    }
  }

  if (ratio >= 6) {
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      progress: 'bg-blue-500',
      border: 'border-blue-200',
      level: 'medium',
      label: '中等',
    }
  }

  if (ratio >= 4) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      progress: 'bg-yellow-500',
      border: 'border-yellow-200',
      level: 'warning',
      label: '一般',
    }
  }

  if (ratio >= 0) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      progress: 'bg-orange-500',
      border: 'border-orange-200',
      level: 'warning',
      label: '较差',
    }
  }

  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    progress: 'bg-red-500',
    border: 'border-red-200',
    level: 'danger',
    label: '严重',
  }
}

/**
 * 根据满期边际贡献率获取直观填充色（十六进制）
 * @param ratio 满期边际贡献率（%）
 * @returns 十六进制颜色值
 */
export function getContributionMarginHexColor(
  ratio: number | null | undefined
): string {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return '#cbd5e1' // 默认：灰蓝色
  }

  if (ratio > 12) return '#2E7D32' // 优秀：深绿
  if (ratio >= 8) return '#4CAF50' // 良好：浅绿
  if (ratio >= 6) return '#1976D2' // 中等：蓝色
  if (ratio >= 4) return '#FBC02D' // 一般：黄色
  if (ratio >= 0) return '#F57C00' // 较差：橙色
  return '#D32F2F' // 严重：红色
}

/**
 * 变动成本率五级预警色彩
 * @param ratio 变动成本率（%）= 费用率 + 满期赔付率
 * @returns ColorScale 色彩对象
 *
 * 业务规则：
 * - 优秀（<65%）：成本控制优秀，深绿色
 * - 良好（65-75%）：成本控制良好，绿色
 * - 中等（75-85%）：成本控制正常，蓝色
 * - 预警（85-95%）：成本偏高，黄色
 * - 高危（>95%）：成本严重超标，红色
 */
export function getDynamicColorByVariableCostRatio(
  ratio: number | null | undefined
): ColorScale {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return {
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      progress: 'bg-slate-400',
      border: 'border-slate-300',
      level: 'medium',
      label: '无数据',
    }
  }

  if (ratio < 65) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      progress: 'bg-green-600',
      border: 'border-green-300',
      level: 'excellent',
      label: '优秀',
    }
  }

  if (ratio < 75) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      progress: 'bg-green-500',
      border: 'border-green-200',
      level: 'good',
      label: '良好',
    }
  }

  if (ratio < 85) {
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      progress: 'bg-blue-500',
      border: 'border-blue-200',
      level: 'medium',
      label: '中等',
    }
  }

  if (ratio < 95) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      progress: 'bg-yellow-500',
      border: 'border-yellow-200',
      level: 'warning',
      label: '预警',
    }
  }

  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    progress: 'bg-red-500',
    border: 'border-red-200',
    level: 'danger',
    label: '高危',
  }
}

/**
 * 通用：根据指标类型自动选择色彩函数
 * @param kpiType KPI类型标识
 * @param value KPI数值
 * @returns ColorScale 色彩对象
 */
export function getDynamicColorByKPI(
  kpiType:
    | 'premium_progress'
    | 'loss_ratio'
    | 'contribution_margin'
    | 'variable_cost',
  value: number | null | undefined
): ColorScale {
  switch (kpiType) {
    case 'premium_progress':
      return getDynamicColorByPremiumProgress(value)
    case 'loss_ratio':
      return getDynamicColorByLossRatio(value)
    case 'contribution_margin':
      return getDynamicColorByContributionMargin(value)
    case 'variable_cost':
      return getDynamicColorByVariableCostRatio(value)
    default:
      return {
        text: 'text-slate-600',
        bg: 'bg-slate-50',
        progress: 'bg-slate-400',
        border: 'border-slate-300',
        level: 'medium',
        label: '未知',
      }
  }
}
