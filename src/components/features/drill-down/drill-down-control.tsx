/**
 * 下钻控制器组件
 * 整合面包屑导航和维度选择器，提供完整的下钻功能
 */

'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import {
  useDrillDownStore,
  useKPIDrillDownSteps,
  useAvailableDimensions,
} from '@/store/drill-down-store'
import { DrillDownBreadcrumb } from './drill-down-breadcrumb'
import { DimensionSelector } from './dimension-selector'
import type { DrillDownDimensionKey, DrillDownStep } from '@/types/drill-down'
import type { InsuranceRecord } from '@/types/insurance'
import { cn } from '@/lib/utils'
import { filterDrillDownData } from './utils'

export interface DrillDownControlProps {
  /**
   * KPI标识
   */
  kpiKey: string

  /**
   * 自定义类名
   */
  className?: string

  /**
   * 初始数据（如果提供，将基于此数据进行下钻，不再应用全局筛选器）
   */
  initialData?: InsuranceRecord[]

  /**
   * 自定义渲染内容
   * 接收当前过滤后的数据作为参数
   */
  children?: (filteredData: InsuranceRecord[]) => React.ReactNode
}

export function DrillDownControl({
  kpiKey,
  className,
  initialData,
  children,
}: DrillDownControlProps) {
  // 从store获取数据和方法
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)
  const addDrillDownStep = useDrillDownStore(state => state.addDrillDownStep)
  const removeDrillDownStepsFrom = useDrillDownStore(
    state => state.removeDrillDownStepsFrom
  )

  // 获取当前KPI的下钻步骤
  const drillDownSteps = useKPIDrillDownSteps(kpiKey)

  // 获取可用的维度列表
  const availableDimensions = useAvailableDimensions(kpiKey)

  // 根据下钻路径和全局筛选器筛选数据
  const filteredData = useMemo(() => {
    return filterDrillDownData({
      rawData,
      initialData,
      filters,
      drillDownSteps,
    })
  }, [rawData, filters, drillDownSteps, initialData])

  // 处理导航（返回到某个层级）
  const handleNavigate = (stepIndex: number) => {
    removeDrillDownStepsFrom(kpiKey, stepIndex)
  }

  // 处理选择维度值
  const handleSelectValue = (
    dimensionKey: DrillDownDimensionKey,
    dimensionLabel: string,
    value: string | boolean,
    displayLabel: string
  ) => {
    const step: DrillDownStep = {
      dimensionKey,
      dimensionLabel,
      value,
      displayLabel,
    }
    addDrillDownStep(kpiKey, step)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 面包屑导航 */}
      <DrillDownBreadcrumb steps={drillDownSteps} onNavigate={handleNavigate} />

      {/* 维度选择器 */}
      <DimensionSelector
        availableDimensions={availableDimensions}
        filteredData={filteredData}
        onSelectValue={handleSelectValue}
      />

      {/* 数据统计 */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {drillDownSteps.length > 0 ? `当前层级数据量` : `全部数据量`}
          </span>
          <span className="font-semibold text-slate-800">
            {filteredData.length.toLocaleString('zh-CN')} 条记录
          </span>
        </div>
      </div>

      {/* 自定义内容渲染 */}
      {children && children(filteredData)}
    </div>
  )
}
