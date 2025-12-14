'use client'

import React from 'react'
import { MultiDimensionRadar } from '@/components/features/multi-dimension-radar'

/**
 * 经营观察：多维健康度雷达包装组件
 */
export function MultiDimensionRadarWrapper() {
  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <h4 className="text-sm font-bold text-blue-600 mb-2 text-left">
        多维健康度雷达
      </h4>
      <MultiDimensionRadar />
    </div>
  )
}
