/**
 * BaseEChart - 统一的 ECharts 基础组件
 *
 * 功能：
 * 1. 自动初始化和销毁 ECharts 实例
 * 2. 响应式尺寸调整
 * 3. 统一的配置合并
 * 4. 统一的事件处理
 * 5. 加载状态管理
 */

'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'
import { buildBaseTheme } from '@/lib/charts/theme'
import { cn } from '@/lib/utils'

export interface BaseEChartProps {
  /** 图表配置项 */
  option: EChartsOption

  /** 容器类名 */
  className?: string

  /** 容器样式 */
  style?: React.CSSProperties

  /** 图表高度（像素） */
  height?: number | string

  /** 图表宽度（像素或百分比） */
  width?: number | string

  /** 是否显示加载状态 */
  loading?: boolean

  /** 加载提示文本 */
  loadingText?: string

  /** 点击事件 */
  onClick?: (params: any, chart: ECharts) => void

  /** 双击事件 */
  onDblClick?: (params: any, chart: ECharts) => void

  /** 鼠标悬停事件 */
  onMouseOver?: (params: any, chart: ECharts) => void

  /** 鼠标移出事件 */
  onMouseOut?: (params: any, chart: ECharts) => void

  /** 图表渲染完成回调 */
  onChartReady?: (chart: ECharts) => void

  /** 是否启用自动 resize（默认 true） */
  autoResize?: boolean

  /** 渲染器类型（默认 'canvas'） */
  renderer?: 'canvas' | 'svg'

  /** 是否合并基础主题（默认 true） */
  mergeTheme?: boolean

  /** 图表实例 ref（用于外部控制） */
  chartRef?: React.MutableRefObject<ECharts | null>

  /** 自定义空状态提示 */
  emptyText?: string

  /** 是否为空状态 */
  isEmpty?: boolean
}

/**
 * BaseEChart 组件
 */
export const BaseEChart = React.memo<BaseEChartProps>(function BaseEChart({
  option,
  className,
  style,
  height = 400,
  width = '100%',
  loading = false,
  loadingText = '加载中...',
  onClick,
  onDblClick,
  onMouseOver,
  onMouseOut,
  onChartReady,
  autoResize = true,
  renderer = 'canvas',
  mergeTheme = true,
  chartRef: externalChartRef,
  emptyText = '暂无数据',
  isEmpty = false,
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalChartRef = useRef<ECharts | null>(null)
  const [isReady, setIsReady] = useState(false)

  // 使用外部 ref 或内部 ref
  const chartRef = externalChartRef || internalChartRef

  // 合并配置项（包含基础主题）
  const finalOption = useMemo(() => {
    if (!mergeTheme) return option

    const baseTheme = buildBaseTheme()
    return {
      ...baseTheme,
      ...option,
    }
  }, [option, mergeTheme])

  // 初始化 ECharts 实例
  useEffect(() => {
    if (!containerRef.current) return

    // 初始化图表
    const chart = echarts.init(containerRef.current, undefined, {
      renderer,
      useDirtyRect: true, // 开启脏矩形优化
    })

    chartRef.current = chart
    setIsReady(true)

    // 触发就绪回调
    if (onChartReady) {
      onChartReady(chart)
    }

    // 清理函数
    return () => {
      chart.dispose()
      chartRef.current = null
      setIsReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer])

  // 更新配置项
  useEffect(() => {
    if (!chartRef.current || !isReady) return

    chartRef.current.setOption(finalOption, {
      notMerge: false,
      lazyUpdate: false,
      silent: false,
    })
  }, [finalOption, isReady, chartRef])

  // 处理加载状态
  useEffect(() => {
    if (!chartRef.current || !isReady) return

    if (loading) {
      chartRef.current.showLoading('default', {
        text: loadingText,
        color: '#3b82f6',
        textColor: '#64748b',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel: 0,
      })
    } else {
      chartRef.current.hideLoading()
    }
  }, [loading, loadingText, isReady, chartRef])

  // 注册事件监听
  useEffect(() => {
    if (!chartRef.current || !isReady) return

    const chart = chartRef.current

    // 点击事件
    if (onClick) {
      const handler = (params: any) => onClick(params, chart)
      chart.on('click', handler)
      return () => {
        chart.off('click', handler)
      }
    }
  }, [onClick, isReady, chartRef])

  useEffect(() => {
    if (!chartRef.current || !isReady) return

    const chart = chartRef.current

    // 双击事件
    if (onDblClick) {
      const handler = (params: any) => onDblClick(params, chart)
      chart.on('dblclick', handler)
      return () => {
        chart.off('dblclick', handler)
      }
    }
  }, [onDblClick, isReady, chartRef])

  useEffect(() => {
    if (!chartRef.current || !isReady) return

    const chart = chartRef.current

    // 鼠标悬停事件
    if (onMouseOver) {
      const handler = (params: any) => onMouseOver(params, chart)
      chart.on('mouseover', handler)
      return () => {
        chart.off('mouseover', handler)
      }
    }
  }, [onMouseOver, isReady, chartRef])

  useEffect(() => {
    if (!chartRef.current || !isReady) return

    const chart = chartRef.current

    // 鼠标移出事件
    if (onMouseOut) {
      const handler = (params: any) => onMouseOut(params, chart)
      chart.on('mouseout', handler)
      return () => {
        chart.off('mouseout', handler)
      }
    }
  }, [onMouseOut, isReady, chartRef])

  // 响应式 resize
  useEffect(() => {
    if (!chartRef.current || !autoResize || !containerRef.current) return

    const chart = chartRef.current

    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [autoResize, isReady, chartRef])

  // 容器样式
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }

  // 空状态渲染
  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50',
          className
        )}
        style={containerStyle}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl text-slate-300">📊</div>
          <p className="text-sm text-slate-500">{emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('echarts-container', className)}
      style={containerStyle}
    />
  )
})

BaseEChart.displayName = 'BaseEChart'
