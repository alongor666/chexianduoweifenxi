'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { useFilteredData } from '@/store/use-app-store'
import type { InsuranceRecord } from '@/types/insurance'
import { getContributionMarginHexColor } from '@/utils/color-scale'

// Y轴维度类型
export type YAxisDimension = 'business_type' | 'organization' | 'coverage_type'

// 指标配置类型
export interface MetricConfig<T extends string> {
  dataKey: string
  name: string
  unit: string
  formatter: (v: number) => string
  sortKey: keyof DataPoint<T>
}

// 指标定义类型
export interface MetricDefinition<T extends string> {
  value: T
  label: string
  config: MetricConfig<T>
}

// 通用数据点类型
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DataPoint<_T extends string = string> {
  key: string
  label: string
  contribution_margin_ratio: number | null
  [key: string]: number | string | null
}

// 聚合函数类型
export type AggregateFunction<T extends string> = (
  data: InsuranceRecord[],
  dimension: YAxisDimension
) => DataPoint<T>[]

// 组件 Props 类型
export interface DimensionBarChartProps<T extends string> {
  title: string
  chartId: string
  metrics: MetricDefinition<T>[]
  defaultMetric: T
  aggregateFunction: AggregateFunction<T>
  defaultTopN?: number
}

/**
 * 通用维度条形图组件
 *
 * 可配置化的条形图，支持：
 * - 多维度切换（业务类型、三级机构、险别组合）
 * - 多指标切换（通过配置传入）
 * - TopN 控制
 * - 按边际贡献率着色
 */
export function DimensionBarChart<T extends string>({
  title,
  chartId,
  metrics,
  defaultMetric,
  aggregateFunction,
  defaultTopN = 12,
}: DimensionBarChartProps<T>) {
  const filteredData = useFilteredData()

  // Y轴维度选择
  const [yDimension, setYDimension] = useState<YAxisDimension>('business_type')

  // X轴指标选择
  const [xMetric, setXMetric] = useState<T>(defaultMetric)

  // TopN 控件
  const [topN, setTopN] = useState<number>(defaultTopN)

  // 获取当前指标的配置
  const currentMetric = metrics.find(m => m.value === xMetric)
  if (!currentMetric) {
    throw new Error(`未找到指标配置: ${xMetric}`)
  }
  const metricConfig = currentMetric.config

  // 聚合并排序数据
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []

    const aggregated = aggregateFunction(filteredData, yDimension)

    // 根据X轴指标排序
    aggregated.sort((a, b) => {
      const aVal = a[metricConfig.sortKey] as number
      const bVal = b[metricConfig.sortKey] as number
      return bVal - aVal
    })

    return aggregated.slice(0, Math.max(1, Math.min(50, topN)))
  }, [filteredData, yDimension, topN, aggregateFunction, metricConfig.sortKey])

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 初始化和更新图表
  useEffect(() => {
    if (!chartRef.current || !chartData || chartData.length === 0) return

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const chart = chartInstanceRef.current

    // 准备数据：横向条形图需要反转数据顺序（从下到上显示）
    const reversedData = [...chartData].reverse()

    // 提取 Y 轴标签和 X 轴数值
    const yAxisLabels = reversedData.map((d) => d.label)
    const xAxisValues = reversedData.map((d) => d[metricConfig.dataKey] as number)

    // 为每个条形设置颜色
    const itemColors = reversedData.map((d) =>
      getContributionMarginHexColor(d.contribution_margin_ratio)
    )

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '15%',
        right: '5%',
        top: '5%',
        bottom: '5%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155',
          fontSize: 12,
        },
        padding: 12,
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const param = params[0]
          const dataIndex = param.dataIndex
          const originalIndex = chartData.length - 1 - dataIndex
          const dataPoint = chartData[originalIndex]

          if (!dataPoint) return ''

          const contributionText =
            dataPoint.contribution_margin_ratio !== null
              ? `${(dataPoint.contribution_margin_ratio * 100).toFixed(1)}%`
              : '—'

          return `<div style="min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">${param.name}</div>
            <div style="margin-bottom: 4px;">
              <span style="color: #64748b;">${metricConfig.name}：</span>
              <span style="font-weight: 600;">${metricConfig.formatter(param.value)}</span>
            </div>
            <div>
              <span style="color: #64748b;">边际贡献率：</span>
              <span style="font-weight: 600; color: #3b82f6;">${contributionText}</span>
            </div>
          </div>`
        },
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => metricConfig.formatter(value),
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisLabels,
        axisLabel: {
          fontSize: 12,
          color: '#334155',
          width: 110,
          overflow: 'truncate',
          ellipsis: '...',
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
      },
      series: [
        {
          name: metricConfig.name,
          type: 'bar',
          data: xAxisValues,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params: any) => {
              return itemColors[params.dataIndex] || '#94a3b8'
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          barMaxWidth: 30,
        },
      ],
    }

    chart.setOption(option, true)

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
  }, [chartData, metricConfig, chartId])

  // 清理
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [])

  if (!chartData || chartData.length === 0) return null

  return (
    <div
      id={chartId}
      className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">
              {metricConfig.name}（{metricConfig.unit}） Top 排序
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600">Top</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={e => setTopN(Number(e.target.value) || 1)}
              className="w-16 border border-slate-300 rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">Y轴维度</label>
            <select
              className="border border-slate-300 rounded px-3 py-1 bg-white"
              value={yDimension}
              onChange={e => setYDimension(e.target.value as YAxisDimension)}
            >
              <option value="business_type">业务类型</option>
              <option value="organization">三级机构</option>
              <option value="coverage_type">险别组合</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">X轴指标</label>
            <select
              className="border border-slate-300 rounded px-3 py-1 bg-white"
              value={xMetric}
              onChange={e => setXMetric(e.target.value as T)}
            >
              {metrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="h-80" />
    </div>
  )
}
