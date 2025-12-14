/**
 * 维度选择器组件
 * 用于选择下钻维度和具体的维度值
 */

'use client'

import { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  DrillDownDimension,
  DrillDownDimensionKey,
} from '@/types/drill-down'
import { formatBooleanValue } from '@/types/drill-down'
import type { InsuranceRecord } from '@/types/insurance'
import { cn } from '@/lib/utils'

export interface DimensionSelectorProps {
  /**
   * 可用的维度列表
   */
  availableDimensions: DrillDownDimension[]

  /**
   * 当前筛选后的数据（用于获取维度的可选值）
   */
  filteredData: InsuranceRecord[]

  /**
   * 选择维度值后的回调
   */
  onSelectValue: (
    dimensionKey: DrillDownDimensionKey,
    dimensionLabel: string,
    value: string | boolean,
    displayLabel: string
  ) => void

  /**
   * 自定义类名
   */
  className?: string
}

export function DimensionSelector({
  availableDimensions,
  filteredData,
  onSelectValue,
  className,
}: DimensionSelectorProps) {
  // 当前选择的维度
  const [selectedDimension, setSelectedDimension] =
    useState<DrillDownDimension | null>(null)

  // 获取当前选择维度的所有可选值
  const dimensionValues = useMemo(() => {
    if (!selectedDimension || filteredData.length === 0) {
      return []
    }

    // 从数据中提取该维度的所有唯一值
    const valuesMap = new Map<string | boolean, number>()

    filteredData.forEach(record => {
      const value = selectedDimension.getValue(record)
      const count = valuesMap.get(value) || 0
      valuesMap.set(value, count + 1)
    })

    // 转换为数组并按记录数量排序
    return Array.from(valuesMap.entries())
      .map(([value, count]) => ({
        value,
        count,
        displayLabel:
          typeof value === 'boolean'
            ? formatBooleanValue(value)
            : String(value),
      }))
      .sort((a, b) => b.count - a.count) // 按记录数量降序
  }, [selectedDimension, filteredData])

  // 重置选择
  const handleReset = () => {
    setSelectedDimension(null)
  }

  // 处理维度选择
  const handleDimensionChange = (dimensionKey: string) => {
    const dimension = availableDimensions.find(d => d.key === dimensionKey)
    setSelectedDimension(dimension || null)
  }

  // 处理值选择
  const handleValueSelect = (value: string | boolean) => {
    if (!selectedDimension) return

    const displayLabel =
      typeof value === 'boolean' ? formatBooleanValue(value) : String(value)

    onSelectValue(
      selectedDimension.key,
      selectedDimension.label,
      value,
      displayLabel
    )

    // 选择后重置
    handleReset()
  }

  // 如果没有可用维度，显示提示
  if (availableDimensions.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center',
          className
        )}
      >
        <p className="text-sm text-slate-500">所有维度已使用，无法继续下钻</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border border-slate-200 bg-white p-4',
        className
      )}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-600" />
        <h4 className="text-sm font-semibold text-slate-700">选择下钻维度</h4>
      </div>

      {/* 维度选择 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">
          第一步：选择维度
        </label>
        <Select
          value={selectedDimension?.key ?? ''}
          onValueChange={handleDimensionChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择维度..." />
          </SelectTrigger>
          <SelectContent>
            {availableDimensions.map(dimension => (
              <SelectItem key={dimension.key} value={dimension.key}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dimension.label}</span>
                  {dimension.description && (
                    <span className="text-xs text-slate-500">
                      {dimension.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 维度值选择 */}
      {selectedDimension && dimensionValues.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">
            第二步：选择{selectedDimension.label}的具体值
          </label>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2">
            {dimensionValues.map(({ value, count, displayLabel }) => (
              <Button
                key={String(value)}
                variant="ghost"
                className="w-full justify-between hover:bg-blue-50 hover:text-blue-700"
                onClick={() => handleValueSelect(value)}
              >
                <span className="font-medium">{displayLabel}</span>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-slate-200 text-slate-700"
                >
                  {count.toLocaleString('zh-CN')} 条
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {selectedDimension && dimensionValues.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <p className="text-xs text-amber-700">当前数据中没有该维度的可选值</p>
        </div>
      )}
    </div>
  )
}
