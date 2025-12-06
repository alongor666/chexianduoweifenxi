/**
 * ECharts 坐标轴配置
 */

import type { XAXisComponentOption, YAXisComponentOption } from 'echarts'
import { TEXT_COLORS, BORDER_COLORS } from './colors'

/**
 * X轴配置预设
 */
export const XAXIS_PRESETS = {
  /** 默认X轴配置 */
  default: {
    type: 'category' as const,
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
  },

  /** 旋转标签的X轴配置（适用于标签过长） */
  rotated: {
    type: 'category' as const,
    axisLabel: {
      fontSize: 11,
      rotate: 45,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
  },

  /** 带阴影指示器的X轴配置 */
  withShadow: {
    type: 'category' as const,
    axisPointer: {
      type: 'shadow' as const,
    },
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
  },
} satisfies Record<string, Partial<XAXisComponentOption>>

/**
 * Y轴配置预设
 */
export const YAXIS_PRESETS = {
  /** 默认Y轴配置 */
  default: {
    type: 'value' as const,
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
    splitLine: {
      lineStyle: {
        color: BORDER_COLORS.light,
        type: 'dashed' as const,
      },
    },
  },

  /** 左侧Y轴配置（双Y轴场景） */
  left: {
    type: 'value' as const,
    position: 'left' as const,
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
    splitLine: {
      lineStyle: {
        color: BORDER_COLORS.light,
        type: 'dashed' as const,
      },
    },
  },

  /** 右侧Y轴配置（双Y轴场景） */
  right: {
    type: 'value' as const,
    position: 'right' as const,
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
    splitLine: {
      show: false, // 右Y轴通常不显示分割线
    },
  },

  /** 百分比Y轴配置 */
  percent: {
    type: 'value' as const,
    axisLabel: {
      fontSize: 11,
      color: TEXT_COLORS.secondary,
      formatter: '{value}%',
    },
    axisLine: {
      lineStyle: {
        color: BORDER_COLORS.normal,
      },
    },
    splitLine: {
      lineStyle: {
        color: BORDER_COLORS.light,
        type: 'dashed' as const,
      },
    },
  },
} satisfies Record<string, Partial<YAXisComponentOption>>

/**
 * 创建自定义X轴配置
 * @param preset 预设名称
 * @param overrides 自定义覆盖配置
 * @returns X轴配置对象
 */
export function createXAxisConfig(
  preset: keyof typeof XAXIS_PRESETS = 'default',
  overrides?: Partial<XAXisComponentOption>
): Partial<XAXisComponentOption> {
  // @ts-expect-error ECharts 类型系统复杂，预设对象类型推断存在兼容性问题
  return {
    ...XAXIS_PRESETS[preset],
    ...overrides,
  }
}

/**
 * 创建自定义Y轴配置
 * @param preset 预设名称
 * @param overrides 自定义覆盖配置
 * @returns Y轴配置对象
 */
export function createYAxisConfig(
  preset: keyof typeof YAXIS_PRESETS = 'default',
  overrides?: Partial<YAXisComponentOption>
): Partial<YAXisComponentOption> {
  // @ts-expect-error ECharts 类型系统复杂，预设对象类型推断存在兼容性问题
  return {
    ...YAXIS_PRESETS[preset],
    ...overrides,
  }
}
