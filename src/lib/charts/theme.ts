/**
 * ECharts 统一主题配置
 *
 * 定义全局的颜色、样式、字体等视觉规范，确保所有图表的一致性
 */

import type { EChartsOption } from 'echarts'

/**
 * 颜色编码规则
 */
export const CHART_COLORS = {
  // 主色板 - 用于数据系列
  primary: [
    '#3b82f6', // 蓝色 - 签单保费
    '#f97316', // 橙色 - 赔付率
    '#10b981', // 绿色 - 边际贡献
    '#8b5cf6', // 紫色 - 趋势线
    '#ef4444', // 红色 - 预警/风险
    '#06b6d4', // 青色
    '#f59e0b', // 黄色
    '#ec4899', // 粉色
  ],

  // 风险等级颜色
  risk: {
    safe: '#10b981', // 安全 - 绿色
    warning: '#f59e0b', // 预警 - 黄色
    danger: '#ef4444', // 危险 - 红色
    critical: '#dc2626', // 严重 - 深红色
  },

  // 业务指标颜色
  metrics: {
    premium: '#3b82f6', // 保费 - 蓝色
    lossRatio: '#f97316', // 赔付率 - 橙色
    contribution: '#10b981', // 边际贡献 - 绿色
    trend: '#8b5cf6', // 趋势 - 紫色
  },

  // 阈值线颜色
  threshold: {
    standard: '#ef4444', // 标准阈值 - 红色
    target: '#10b981', // 目标值 - 绿色
    average: '#9ca3af', // 平均值 - 灰色
  },

  // 中性色
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const

/**
 * 风险区间规则
 */
export const RISK_ZONES = {
  lossRatio: {
    safe: { max: 60, color: 'rgba(16, 185, 129, 0.05)' }, // < 60%
    warning: { min: 60, max: 70, color: 'rgba(245, 158, 11, 0.1)' }, // 60-70%
    danger: { min: 70, color: 'rgba(239, 68, 68, 0.15)' }, // > 70%
  },
  contribution: {
    danger: { max: 10, color: 'rgba(239, 68, 68, 0.15)' }, // < 10%
    warning: { min: 10, max: 15, color: 'rgba(245, 158, 11, 0.1)' }, // 10-15%
    safe: { min: 15, color: 'rgba(16, 185, 129, 0.05)' }, // > 15%
  },
} as const

/**
 * 阈值线配置
 */
export const THRESHOLD_LINES = {
  lossRatio: {
    value: 70,
    label: '赔付率阈值 70%',
    color: CHART_COLORS.threshold.standard,
    lineStyle: {
      type: 'dashed' as const,
      width: 2,
    },
  },
  contribution: {
    value: 15,
    label: '边际贡献率目标 15%',
    color: CHART_COLORS.threshold.target,
    lineStyle: {
      type: 'dashed' as const,
      width: 2,
    },
  },
} as const

/**
 * 字体配置
 */
export const CHART_FONTS = {
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: CHART_COLORS.neutral[800],
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 400,
    color: CHART_COLORS.neutral[500],
  },
  axis: {
    fontSize: 11,
    color: CHART_COLORS.neutral[600],
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: CHART_COLORS.neutral[700],
  },
  legend: {
    fontSize: 12,
    fontWeight: 400,
    color: CHART_COLORS.neutral[700],
  },
  tooltip: {
    fontSize: 12,
    color: CHART_COLORS.neutral[700],
  },
} as const

/**
 * 网格配置
 */
export const CHART_GRID = {
  default: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true,
  },
  compact: {
    left: '2%',
    right: '2%',
    bottom: '10%',
    top: '10%',
    containLabel: true,
  },
  vertical: {
    left: '10%',
    right: '5%',
    bottom: '5%',
    top: '5%',
    containLabel: true,
  },
} as const

/**
 * Tooltip 统一样式
 */
export const CHART_TOOLTIP: EChartsOption['tooltip'] = {
  trigger: 'axis',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderColor: CHART_COLORS.neutral[200],
  borderWidth: 1,
  textStyle: {
    color: CHART_COLORS.neutral[700],
    fontSize: 12,
  },
  padding: 12,
  extraCssText:
    'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
} as const

/**
 * Legend 统一样式
 */
export const CHART_LEGEND: EChartsOption['legend'] = {
  top: '2%',
  textStyle: {
    fontSize: CHART_FONTS.legend.fontSize,
    color: CHART_FONTS.legend.color,
  },
  itemWidth: 14,
  itemHeight: 14,
  itemGap: 16,
} as const

/**
 * 坐标轴统一样式
 */
export const CHART_AXIS = {
  xAxis: {
    axisLine: {
      lineStyle: {
        color: CHART_COLORS.neutral[300],
      },
    },
    axisLabel: {
      fontSize: CHART_FONTS.axis.fontSize,
      color: CHART_FONTS.axis.color,
    },
    splitLine: {
      lineStyle: {
        color: CHART_COLORS.neutral[100],
      },
    },
  },
  yAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: CHART_COLORS.neutral[300],
      },
    },
    axisLabel: {
      fontSize: CHART_FONTS.axis.fontSize,
      color: CHART_FONTS.axis.color,
    },
    splitLine: {
      lineStyle: {
        color: CHART_COLORS.neutral[100],
      },
    },
    nameTextStyle: {
      color: CHART_FONTS.axis.color,
      fontSize: 12,
    },
  },
} as const

/**
 * 动画配置
 */
export const CHART_ANIMATION = {
  duration: 750,
  easing: 'cubicOut' as const,
} as const

/**
 * DataZoom 统一配置
 */
export const CHART_DATAZOOM = {
  slider: {
    type: 'slider' as const,
    show: true,
    height: 20,
    bottom: '5%',
    handleSize: '80%',
    textStyle: {
      fontSize: 10,
    },
    borderColor: CHART_COLORS.neutral[300],
    fillerColor: 'rgba(59, 130, 246, 0.1)',
    handleStyle: {
      color: CHART_COLORS.primary[0],
      borderColor: CHART_COLORS.neutral[300],
    },
  },
  inside: {
    type: 'inside' as const,
    zoomOnMouseWheel: true,
    moveOnMouseMove: true,
  },
} as const

/**
 * 构建基础主题配置
 */
export function buildBaseTheme(): EChartsOption {
  return {
    backgroundColor: 'transparent',
    color: [...CHART_COLORS.primary],
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    animation: true,
    animationDuration: CHART_ANIMATION.duration,
    animationEasing: CHART_ANIMATION.easing,
  }
}

/**
 * 获取渐变色配置（用于区域图）
 */
export function getGradientColor(color: string, opacity = 0.3) {
  // 将 hex 颜色转换为 rgb
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      {
        offset: 0,
        color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      },
      {
        offset: 1,
        color: `rgba(${r}, ${g}, ${b}, 0.05)`,
      },
    ],
  }
}

/**
 * 获取风险等级对应的颜色
 */
export function getRiskColor(
  value: number,
  thresholds: { warning: number; danger: number }
): string {
  if (value >= thresholds.danger) return CHART_COLORS.risk.danger
  if (value >= thresholds.warning) return CHART_COLORS.risk.warning
  return CHART_COLORS.risk.safe
}
