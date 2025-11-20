/**
 * ECharts 通用配置
 */

import type { EChartsOption } from 'echarts'
import { DEFAULT_CHART_COLORS } from './colors'
import { createGridConfig } from './grid'
import { createTooltipConfig } from './tooltip'
import { createLegendConfig } from './legend'

/**
 * 基础配置预设
 */
export const BASE_CONFIG: Partial<EChartsOption> = {
  backgroundColor: 'transparent',
  color: DEFAULT_CHART_COLORS,
}

/**
 * 创建基础图表配置
 * @param options 自定义配置
 * @returns 完整的图表配置对象
 *
 * @example
 * const option = createBaseChartOption({
 *   title: { text: '销售趋势' },
 *   series: [{ type: 'line', data: [1, 2, 3] }]
 * })
 */
export function createBaseChartOption(
  options: Partial<EChartsOption> = {}
): EChartsOption {
  return {
    ...BASE_CONFIG,
    grid: createGridConfig('default'),
    tooltip: createTooltipConfig('default'),
    legend: createLegendConfig('default'),
    ...options,
  }
}

/**
 * 创建双Y轴图表配置
 * @param options 自定义配置
 * @returns 完整的图表配置对象
 *
 * @example
 * const option = createDualAxisChartOption({
 *   title: { text: '销售与利润' },
 *   series: [
 *     { type: 'bar', yAxisIndex: 0, data: [1, 2, 3] },
 *     { type: 'line', yAxisIndex: 1, data: [10, 20, 30] }
 *   ]
 * })
 */
export function createDualAxisChartOption(
  options: Partial<EChartsOption> = {}
): EChartsOption {
  return {
    ...BASE_CONFIG,
    grid: createGridConfig('dualAxis'),
    tooltip: createTooltipConfig('cross'),
    legend: createLegendConfig('default'),
    ...options,
  }
}

/**
 * 响应式配置选项
 */
export const RESPONSIVE_OPTIONS = {
  /** 移动端配置 */
  mobile: {
    grid: createGridConfig('compact'),
    legend: createLegendConfig('compact'),
  },

  /** 平板配置 */
  tablet: {
    grid: createGridConfig('default'),
    legend: createLegendConfig('default'),
  },

  /** 桌面配置 */
  desktop: {
    grid: createGridConfig('loose'),
    legend: createLegendConfig('default'),
  },
} as const
