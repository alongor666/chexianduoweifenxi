'use client'

import React from 'react'
import { ClaimAnalysisBarChart } from '@/components/features/claim-analysis-bar-chart'

/**
 * 经营观察：成本风险分析（复用赔付分析条形图）
 */
export function CostRiskAnalysis() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        成本风险分析
      </h4>
      <ClaimAnalysisBarChart />
    </div>
  )
}
