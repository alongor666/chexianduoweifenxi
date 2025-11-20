/**
 * ECharts 网格配置
 */

import type { GridComponentOption } from 'echarts'

/**
 * 网格配置预设
 */
export const GRID_PRESETS = {
  /** 默认网格配置 */
  default: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true,
  },

  /** 紧凑网格配置 */
  compact: {
    left: '2%',
    right: '2%',
    bottom: '10%',
    top: '10%',
    containLabel: true,
  },

  /** 宽松网格配置 */
  loose: {
    left: '5%',
    right: '5%',
    bottom: '20%',
    top: '20%',
    containLabel: true,
  },

  /** 带顶部标题的网格配置 */
  withTopTitle: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '20%', // 为标题预留更多空间
    containLabel: true,
  },

  /** 双Y轴网格配置 */
  dualAxis: {
    left: '5%',  // 左侧留空间给左Y轴
    right: '8%', // 右侧留空间给右Y轴
    bottom: '15%',
    top: '15%',
    containLabel: true,
  },
} as const satisfies Record<string, GridComponentOption>

/**
 * 创建自定义网格配置
 * @param preset 预设名称
 * @param overrides 自定义覆盖配置
 * @returns 网格配置对象
 */
export function createGridConfig(
  preset: keyof typeof GRID_PRESETS = 'default',
  overrides?: Partial<GridComponentOption>
): GridComponentOption {
  return {
    ...GRID_PRESETS[preset],
    ...overrides,
  }
}
