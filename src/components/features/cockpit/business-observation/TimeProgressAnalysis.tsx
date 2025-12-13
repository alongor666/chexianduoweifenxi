'use client'

import React from 'react'
import { KPIMetricsRow } from '../kpi-metrics-row'

/**
 * 经营观察：时间进度分析（复用KPI行中的时间进度指标）
 */
export function TimeProgressAnalysis() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        时间进度分析
      </h4>
      <KPIMetricsRow />
    </div>
  )
}
