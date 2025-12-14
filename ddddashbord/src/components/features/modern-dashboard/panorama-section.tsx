'use client'

import React from 'react'
import { BusinessTypeHeatmap } from '../business-type-heatmap'
import { WeeklyOperationalTrend } from '../weekly-operational-trend/component'
import { Activity, LayoutGrid } from 'lucide-react'

export function PanoramaSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. 业务健康度热力图 (Problem Spotter) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">业务健康全景</h2>
        </div>
        <BusinessTypeHeatmap />
      </div>

      {/* 2. 运营趋势分析 (Trend Spotter) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">运营趋势监控</h2>
        </div>
        <WeeklyOperationalTrend />
      </div>
    </div>
  )
}
