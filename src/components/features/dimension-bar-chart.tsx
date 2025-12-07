'use client'

import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
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

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={metricConfig.formatter} />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => metricConfig.formatter(value)}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Bar
              dataKey={metricConfig.dataKey}
              name={metricConfig.name}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map(dataPoint => (
                <Cell
                  key={`${chartId}-bar-${dataPoint.key}`}
                  fill={getContributionMarginHexColor(
                    dataPoint.contribution_margin_ratio
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
