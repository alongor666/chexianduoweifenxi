/**
 * ECharts 图表颜色配置
 */

/**
 * 主题颜色
 */
export const CHART_COLORS = {
  /** 主色（蓝色） */
  primary: '#3b82f6',
  /** 成功色（绿色） */
  success: '#10b981',
  /** 警告色（橙色） */
  warning: '#f59e0b',
  /** 危险色（红色） */
  danger: '#ef4444',
  /** 次要色（紫色） */
  secondary: '#8b5cf6',
  /** 信息色（青色） */
  info: '#06b6d4',
  /** 中性色（灰色） */
  neutral: '#6b7280',
  /** 粉色 */
  pink: '#ec4899',
} as const

/**
 * 默认图表颜色序列
 */
export const DEFAULT_CHART_COLORS = [
  CHART_COLORS.primary,    // 蓝色
  CHART_COLORS.success,    // 绿色
  CHART_COLORS.warning,    // 橙色
  CHART_COLORS.danger,     // 红色
  CHART_COLORS.secondary,  // 紫色
  CHART_COLORS.info,       // 青色
  CHART_COLORS.pink,       // 粉色
  CHART_COLORS.neutral,    // 灰色
]

/**
 * 文本颜色
 */
export const TEXT_COLORS = {
  /** 主要文本 */
  primary: '#334155',
  /** 次要文本 */
  secondary: '#64748b',
  /** 禁用文本 */
  disabled: '#94a3b8',
  /** 浅色文本 */
  light: '#cbd5e1',
} as const

/**
 * 边框颜色
 */
export const BORDER_COLORS = {
  /** 浅边框 */
  light: '#e2e8f0',
  /** 普通边框 */
  normal: '#cbd5e1',
  /** 深边框 */
  dark: '#94a3b8',
} as const

/**
 * 渐变颜色生成器
 * @param color 基础颜色
 * @param opacity 透明度（0-1）
 * @returns RGBA 颜色字符串
 */
export function withOpacity(color: string, opacity: number): string {
  // 简单的 hex 转 rgba（仅支持 #RRGGBB 格式）
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

/**
 * 创建线性渐变色
 * @param color 基础颜色
 * @param startOpacity 起始透明度
 * @param endOpacity 结束透明度
 * @returns ECharts 渐变配置对象
 */
export function createLinearGradient(
  color: string,
  startOpacity = 0.3,
  endOpacity = 0.05
) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: withOpacity(color, startOpacity) },
      { offset: 1, color: withOpacity(color, endOpacity) },
    ],
  }
}
