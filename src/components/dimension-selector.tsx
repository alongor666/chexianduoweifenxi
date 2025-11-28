'use client'

import React from 'react'

export type DimensionType = 'businessType' | 'thirdLevelOrganization' | 'customerCategory' | 'insuranceType'

interface DimensionSelectorProps {
  selectedDimension: DimensionType
  onDimensionChange: (dimension: DimensionType) => void
  className?: string
}

const DIMENSION_OPTIONS = [
  { value: 'businessType' as const, label: '业务类型' },
  { value: 'thirdLevelOrganization' as const, label: '三级机构' },
  { value: 'customerCategory' as const, label: '客户类型' },
  { value: 'insuranceType' as const, label: '保险类型' },
]

export function DimensionSelector({
  selectedDimension,
  onDimensionChange,
  className = '',
}: DimensionSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-slate-700">目标维度:</span>
      <div className="flex gap-2">
        {DIMENSION_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`px-3 py-1 text-sm rounded-full border transition-colors cursor-pointer ${
              selectedDimension === option.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => onDimensionChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}