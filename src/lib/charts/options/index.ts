/**
 * ECharts 配置工具库
 *
 * 提供统一的图表配置预设和工具函数
 * 消除代码重复，建立规范的图表配置组织结构
 *
 * @example
 * import { createBaseChartOption, CHART_COLORS } from '@/lib/charts/options'
 *
 * const option = createBaseChartOption({
 *   title: { text: '销售趋势' },
 *   series: [{
 *     type: 'line',
 *     data: [1, 2, 3],
 *     itemStyle: { color: CHART_COLORS.primary }
 *   }]
 * })
 */

// 颜色配置
export {
  CHART_COLORS,
  DEFAULT_CHART_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  withOpacity,
  createLinearGradient,
} from './colors'

// 网格配置
export { GRID_PRESETS, createGridConfig } from './grid'

// 提示框配置
export { TOOLTIP_PRESETS, createTooltipConfig } from './tooltip'

// 图例配置
export { LEGEND_PRESETS, createLegendConfig } from './legend'

// 坐标轴配置
export {
  XAXIS_PRESETS,
  YAXIS_PRESETS,
  createXAxisConfig,
  createYAxisConfig,
} from './axis'

// 通用配置
export {
  BASE_CONFIG,
  createBaseChartOption,
  createDualAxisChartOption,
  RESPONSIVE_OPTIONS,
} from './common'
