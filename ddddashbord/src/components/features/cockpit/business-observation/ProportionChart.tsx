'use client'

import React from 'react'
import { DistributionPieChart } from '@/components/features/distribution-pie-chart'

/**
 * 经营观察：占比分析包装组件
 */
export function ProportionChart() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        占比分析
      </h4>
      <DistributionPieChart />
    </div>
  )
}
