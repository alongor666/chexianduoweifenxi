'use client'

import React from 'react'
import { useKPI } from '@/hooks/use-kpi'
import { getThresholdLevel, getThresholdConfig } from '@/config/thresholds'

/**
 * KPI指标行组件（第一行）
 * 展示4个结果型核心指标：时间进度达成率、变动成本率、满期赔付率、费用率
 */
export function KPIMetricsRow() {
  const kpi = useKPI()
  if (!kpi) return null

  // 使用保费时间进度达成率作为主时间进度指标
  const timeProgress = kpi.premium_time_progress_achievement_rate ?? null
  const variableCost = kpi.variable_cost_ratio ?? null
  const lossRatio = kpi.loss_ratio ?? null
  const expenseRatio = kpi.expense_ratio ?? null

  const tiles: Array<{
    title: string
    value: number | null
    metricKey: string
    unit: string
    formatter: (v: number | null) => string
  }> = [
    {
      title: '时间进度达成率',
      value: timeProgress,
      metricKey: 'time_progress_ratio',
      unit: '%',
      formatter: v => (v === null ? '—' : `${v.toFixed(1)}%`),
    },
    {
      title: '变动成本率',
      value: variableCost,
      metricKey: 'variable_cost_ratio',
      unit: '%',
      formatter: v => (v === null ? '—' : `${v.toFixed(1)}%`),
    },
    {
      title: '满期赔付率',
      value: lossRatio,
      metricKey: 'loss_ratio',
      unit: '%',
      formatter: v => (v === null ? '—' : `${v.toFixed(1)}%`),
    },
    {
      title: '费用率',
      value: expenseRatio,
      metricKey: 'expense_ratio',
      unit: '%',
      formatter: v => (v === null ? '—' : `${v.toFixed(1)}%`),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map(({ title, value, metricKey, unit, formatter }) => {
        const level = getThresholdLevel(value, metricKey)
        const config = getThresholdConfig(level)
        return (
          <div
            key={title}
            className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm"
            style={{ borderColor: config.bgColor }}
          >
            <div className="text-xs font-medium text-slate-600">{title}</div>
            <div className="mt-2 flex items-end justify-between">
              <div
                className="text-2xl font-bold"
                style={{ color: config.color }}
              >
                {formatter(value)}
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                {config.label}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">单位：{unit}</div>
          </div>
        )
      })}
    </div>
  )
}
