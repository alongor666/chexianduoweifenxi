/**
 * ECharts 提示框配置
 */

import type { TooltipComponentOption } from 'echarts'
import { TEXT_COLORS, BORDER_COLORS } from './colors'

/**
 * 提示框配置预设
 */
export const TOOLTIP_PRESETS = {
  /** 默认提示框配置 */
  default: {
    trigger: 'axis' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: BORDER_COLORS.light,
    borderWidth: 1,
    textStyle: {
      color: TEXT_COLORS.primary,
      fontSize: 12,
    },
    padding: 12,
  },

  /** 简洁提示框配置 */
  simple: {
    trigger: 'item' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: BORDER_COLORS.light,
    borderWidth: 1,
    textStyle: {
      color: TEXT_COLORS.primary,
      fontSize: 11,
    },
    padding: 8,
  },

  /** 带十字准星的提示框配置 */
  cross: {
    trigger: 'axis' as const,
    axisPointer: {
      type: 'cross' as const,
      crossStyle: {
        color: '#999',
      },
    },
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: BORDER_COLORS.light,
    borderWidth: 1,
    textStyle: {
      color: TEXT_COLORS.primary,
      fontSize: 12,
    },
    padding: 12,
  },

  /** 带阴影准星的提示框配置 */
  shadow: {
    trigger: 'axis' as const,
    axisPointer: {
      type: 'shadow' as const,
    },
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: BORDER_COLORS.light,
    borderWidth: 1,
    textStyle: {
      color: TEXT_COLORS.primary,
      fontSize: 12,
    },
    padding: 12,
  },
} as const satisfies Record<string, TooltipComponentOption>

/**
 * 创建自定义提示框配置
 * @param preset 预设名称
 * @param overrides 自定义覆盖配置
 * @returns 提示框配置对象
 */
export function createTooltipConfig(
  preset: keyof typeof TOOLTIP_PRESETS = 'default',
  overrides?: Partial<TooltipComponentOption>
): TooltipComponentOption {
  return {
    ...TOOLTIP_PRESETS[preset],
    ...overrides,
  }
}
