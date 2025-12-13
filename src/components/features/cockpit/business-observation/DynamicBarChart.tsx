'use client'

import React from 'react'
import { PremiumAnalysisBarChart } from '@/components/features/structure-bar-chart'

/**
 * 经营观察：动态条形图（复用保费分析条形图）
 */
export function DynamicBarChart() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        动态条形图
      </h4>
      <PremiumAnalysisBarChart />
    </div>
  )
}
