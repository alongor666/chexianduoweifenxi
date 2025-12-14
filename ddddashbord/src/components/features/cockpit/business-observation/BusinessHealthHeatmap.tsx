'use client'

import React from 'react'
import { BusinessTypeHeatmap } from '@/components/features/business-type-heatmap'

/**
 * 经营观察：业务健康度热力图包装组件
 */
export function BusinessHealthHeatmap() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        业务健康度热力图
      </h4>
      <BusinessTypeHeatmap />
    </div>
  )
}
