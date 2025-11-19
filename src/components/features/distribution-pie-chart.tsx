'use client'

import React, { useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import {
  useCustomerDistribution,
  useChannelDistribution,
} from '@/hooks/use-aggregation'
import { formatNumber } from '@/utils/formatters'
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
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${formatNumber(value, 2)} 万`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-right text-xs text-slate-600">
        总计：{formatNumber(total, 2)} 万
      </div>
    </div>
  )
})
