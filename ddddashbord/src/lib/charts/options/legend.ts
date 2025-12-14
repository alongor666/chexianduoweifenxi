/**
 * ECharts 图例配置
 */

import type { LegendComponentOption } from 'echarts'

/**
 * 图例配置预设
 */
export const LEGEND_PRESETS = {
  /** 默认图例配置（顶部居中） */
  default: {
    top: '2%',
    textStyle: {
      fontSize: 12,
    },
  },

  /** 底部图例配置 */
  bottom: {
    bottom: '2%',
    textStyle: {
      fontSize: 12,
    },
  },

  /** 左侧图例配置 */
  left: {
    orient: 'vertical' as const,
    left: '2%',
    top: 'center' as const,
    textStyle: {
      fontSize: 12,
    },
  },

  /** 右侧图例配置 */
  right: {
    orient: 'vertical' as const,
    right: '2%',
    top: 'center' as const,
    textStyle: {
      fontSize: 12,
    },
  },

  /** 紧凑图例配置（小字体） */
  compact: {
    top: '2%',
    textStyle: {
      fontSize: 11,
    },
  },
} as const satisfies Record<string, LegendComponentOption>

/**
 * 创建自定义图例配置
 * @param preset 预设名称
 * @param overrides 自定义覆盖配置
 * @returns 图例配置对象
 */
export function createLegendConfig(
  preset: keyof typeof LEGEND_PRESETS = 'default',
  overrides?: Partial<LegendComponentOption>
): LegendComponentOption {
  return {
    ...LEGEND_PRESETS[preset],
    ...overrides,
  }
}
