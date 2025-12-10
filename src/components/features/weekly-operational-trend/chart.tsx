import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { ChartDataPoint } from './types'
import { getChartOption } from './chart-config'

interface WeeklyOperationalTrendChartProps {
  displayData: ChartDataPoint[]
  trendLineData: number[]
  onPointClick: (point: ChartDataPoint) => void
}

export const WeeklyOperationalTrendChart = React.memo(
  function WeeklyOperationalTrendChart({
    displayData,
    trendLineData,
    onPointClick,
  }: WeeklyOperationalTrendChartProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstanceRef = useRef<echarts.ECharts | null>(null)

    useEffect(() => {
      if (!chartRef.current || displayData.length === 0) return

      // 初始化 ECharts 实例
      if (!chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
          renderer: 'canvas',
        })
      }

      const chart = chartInstanceRef.current
      const option = getChartOption({
        displayData,
        trendLineData,
        onPointClick,
      })

      chart.setOption(option, true)

      // 注册点击事件（下钻入口）
      chart.off('click')
      chart.on('click', (params: any) => {
        if (
          params.componentType === 'series' &&
          params.seriesType === 'scatter'
        ) {
          const dataIndex = params.dataIndex
          const point = displayData[dataIndex]
          if (point) {
            onPointClick(point)
          }
        }
      })

      // 响应式调整
      const resizeObserver = new ResizeObserver(() => {
        chart.resize()
      })

      if (chartRef.current) {
        resizeObserver.observe(chartRef.current)
      }

      return () => {
        resizeObserver.disconnect()
      }
    }, [displayData, trendLineData, onPointClick])

    // 清理
    useEffect(() => {
      return () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose()
          chartInstanceRef.current = null
        }
      }
    }, [])

    return (
      <div
        ref={chartRef}
        className="h-[400px] w-full"
        style={{ minHeight: '400px' }}
      />
    )
  }
)
