'use client'

import React from 'react'
import { BusinessTypeDualAxisChart } from '../business-type-dual-axis-chart'
import { MultiDimensionRadar } from '../multi-dimension-radar'
import { PremiumAnalysisBarChart } from '../structure-bar-chart'
import { BarChart3, PieChart, Radar } from 'lucide-react'

export function DeepDiveSection() {
  return (
    <div className="space-y-8">
      {/* 1. 经营效益深度分析 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            经营效益深度分析
          </h2>
        </div>
        <BusinessTypeDualAxisChart />
      </div>

      {/* 2. 结构与对比分析 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 机构能力对比 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              机构能力雷达
            </h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <MultiDimensionRadar />
          </div>
        </div>

        {/* 保费结构分析 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              保费结构分析
            </h2>
          </div>
          <PremiumAnalysisBarChart />
        </div>
      </div>
    </div>
  )
}
