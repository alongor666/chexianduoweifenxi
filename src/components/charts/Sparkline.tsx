/**
 * Sparkline - 微型趋势图组件（ECharts 版本）
 *
 * 用于在KPI卡片中显示简洁的趋势线
 *
 * 替代原有的 Recharts Sparkline，使用 ECharts 实现更好的性能和一致性
 */

'use client'

import React, { useMemo } from 'react'
import { BaseEChart } from './BaseEChart'
import type { EChartsOption } from 'echarts'
import { CHART_COLORS, getGradientColor } from '@/lib/charts/theme'

export interface SparklineProps {
  /**
   * 数据点数组（null值表示数据缺失，将显示为断点）
   */
  data: (number | null)[]

  /**
   * 线条颜色
   */
  color?: string

  /**
   * 高度（像素）
   */
  height?: number

  /**
   * 宽度（像素或百分比）
   */
  width?: number | string

  /**
   * 是否显示为平滑曲线
   */
  smooth?: boolean

  /**
   * 是否显示数据点
   */
  showSymbol?: boolean

  /**
   * 线条粗细
   */
  strokeWidth?: number

  /**
   * 是否填充区域
   */
  filled?: boolean

  /**
   * 填充透明度
   */
  fillOpacity?: number

  /**
   * 是否连接null值（false时null值会造成线条断裂）
   */
  connectNulls?: boolean

  /**
   * 容器类名
   */
  className?: string
}

/**
 * Sparkline 微型趋势图组件
 */
export function Sparkline({
  data,
  color = CHART_COLORS.primary[0],
  height = 40,
  width = '100%',
  smooth = true,
  showSymbol = false,
  strokeWidth = 2,
  filled = false,
  fillOpacity = 0.2,
  connectNulls = false,
  className,
}: SparklineProps) {
  const option = useMemo<EChartsOption>(() => {
    // 构建配置
    const config: EChartsOption = {
      grid: {
        left: 0,
        right: 0,
        top: 2,
        bottom: 2,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          type: 'line',
          data,
          smooth,
          showSymbol: showSymbol,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color,
            width: strokeWidth,
          },
          itemStyle: {
            color,
          },
          areaStyle: filled
            ? {
                color: getGradientColor(color, fillOpacity),
              }
            : undefined,
          connectNulls,
          animation: false, // 微型图表不需要动画，提高性能
        },
      ],
    }

    return config
  }, [
    data,
    color,
    smooth,
    showSymbol,
    strokeWidth,
    filled,
    fillOpacity,
    connectNulls,
  ])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <BaseEChart
      option={option}
      height={height}
      width={width}
      className={className}
      mergeTheme={false} // 微型图表不需要合并主题
      autoResize={false} // 微型图表尺寸固定，不需要自动 resize
    />
  )
}

/**
 * 带填充的 Sparkline 变体
 */
export function SparklineArea({
  data,
  color = CHART_COLORS.primary[0],
  height = 40,
  width = '100%',
  fillOpacity = 0.2,
  className,
}: Omit<SparklineProps, 'filled' | 'smooth'>) {
  return (
    <Sparkline
      data={data}
      color={color}
      height={height}
      width={width}
      smooth={true}
      filled={true}
      fillOpacity={fillOpacity}
      className={className}
    />
  )
}

/**
 * 条形 Sparkline（使用纯 CSS 实现，不使用 ECharts）
 * 保持原有实现，因为简单的条形图用 CSS 更轻量
 */
export interface SparklineBarsProps {
  data: number[]
  color?: string
  height?: number
  width?: number | string
  barWidth?: number
  gap?: number
}

export function SparklineBars({
  data,
  color = CHART_COLORS.primary[0],
  height = 40,
  width = '100%',
  barWidth = 3,
  gap = 1,
}: SparklineBarsProps) {
  if (!data || data.length === 0) return null

  const max = data.reduce((max, val) => Math.max(max, val), -Infinity)
  const min = data.reduce((min, val) => Math.min(min, val), Infinity)
  const range = max - min || 1

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'flex-end',
        gap: `${gap}px`,
        overflow: 'hidden',
      }}
    >
      {data.map((value, index) => {
        const normalizedHeight = ((value - min) / range) * 100
        return (
          <div
            key={index}
            style={{
              flex: 1,
              minWidth: `${barWidth}px`,
              height: `${normalizedHeight}%`,
              backgroundColor: color,
              borderRadius: '1px',
              transition: 'height 0.3s ease',
            }}
          />
        )
      })}
    </div>
  )
}
