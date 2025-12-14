'use client'

import React, { useState, useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { BaseEChart } from '@/components/charts/BaseEChart'
import {
  useCustomerDistribution,
  useChannelDistribution,
} from '@/hooks/use-aggregation'
import { formatNumber } from '@/utils/format'
import type { PiePoint } from '@/hooks/use-aggregation'

const COLORS = [
  '#1d4ed8',
  '#0ea5e9',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#94a3b8',
  '#eab308',
  '#10b981',
]

// 使用React.memo优化组件性能
export const DistributionPieChart = React.memo(function DistributionPieChart() {
  const [mode, setMode] = useState<'customer' | 'channel'>('customer')
  const customer = useCustomerDistribution()
  const channel = useChannelDistribution()
  const data: PiePoint[] = mode === 'customer' ? customer : channel

  // 构建图表配置
  const option: EChartsOption | null = useMemo(() => {
    if (!data || data.length === 0) return null
    const total = data.reduce((s, d) => s + d.value, 0)
    const chartData = [...data]
      .sort((a, b) => a.value - b.value)
      .map(item => ({
        name: item.label,
        value: item.value,
      }))
    const opt: EChartsOption = {
      backgroundColor: 'transparent',
      color: COLORS,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12, fontWeight: 'bold' },
        padding: 12,
        formatter: (params: any) => {
          const percent = params.percent.toFixed(1)
          return `<div style="min-width: 160px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="margin-bottom: 2px;">
              <span style="color: #64748b;">保费：</span>
              <span style="font-weight: 600;">${formatNumber(params.value, 2)} 万</span>
            </div>
            <div>
              <span style="color: #64748b;">占比：</span>
              <span style="font-weight: 600; color: #3b82f6;">${percent}%</span>
            </div>
          </div>`
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 12, fontWeight: 'bold' },
        formatter: (name: string) => {
          const item = data.find(d => d.label === name)
          if (!item) return name
          const percent = ((item.value / total) * 100).toFixed(1)
          return `${name}  ${percent}%`
        },
      },
      series: [
        {
          name: '满期保费',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            color: '#334155',
            fontWeight: 'bold',
          },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          data: chartData,
        },
      ],
    }
    return opt
  }, [data])

  if (!data || data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">占比分析</h3>
          <p className="text-xs text-slate-500">满期保费（万元）占比</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 text-xs rounded border ${mode === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}
            onClick={() => setMode('customer')}
          >
            客户
          </button>
          <button
            className={`px-2 py-1 text-xs rounded border ${mode === 'channel' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}
            onClick={() => setMode('channel')}
          >
            渠道
          </button>
        </div>
      </div>
      {option && <BaseEChart option={option} height={320} />}
      <div className="mt-3 text-right text-xs text-slate-600">
        总计：{formatNumber(total, 2)} 万
      </div>
    </div>
  )
})
