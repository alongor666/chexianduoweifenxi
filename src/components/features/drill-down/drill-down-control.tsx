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
import type {
  DrillDownDimensionKey,
  DrillDownStep,
} from '@/types/drill-down'
import type { InsuranceRecord } from '@/types/insurance'
import { getBusinessTypeCode } from '@/constants/dimensions'
import { cn } from '@/lib/utils'

export interface DrillDownControlProps {
  /**
   * KPI标识
   */
  kpiKey: string

  /**
   * 自定义类名
   */
  className?: string
}

export function DrillDownControl({
  kpiKey,
  className,
}: DrillDownControlProps) {
  // 从store获取数据和方法
  const rawData = useAppStore((state) => state.rawData)
  const filters = useAppStore((state) => state.filters)
  const addDrillDownStep = useDrillDownStore(
    (state) => state.addDrillDownStep
  )
  const removeDrillDownStepsFrom = useDrillDownStore(
    (state) => state.removeDrillDownStepsFrom
  )

  // 获取当前KPI的下钻步骤
  const drillDownSteps = useKPIDrillDownSteps(kpiKey)

  // 获取可用的维度列表
  const availableDimensions = useAvailableDimensions(kpiKey)

  // 根据下钻路径和全局筛选器筛选数据
  const filteredData = useMemo(() => {
    return rawData.filter((record: InsuranceRecord) => {
      // 应用全局筛选器
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false
      }

      if (filters.viewMode === 'single' && filters.singleModeWeek !== null) {
        if (record.week_number !== filters.singleModeWeek) {
          return false
        }
      }

      if (
        filters.organizations.length > 0 &&
        !filters.organizations.includes(record.third_level_organization)
      ) {
        return false
      }

      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(record.insurance_type)
      ) {
        return false
      }

      if (filters.businessTypes.length > 0) {
        const btCode = getBusinessTypeCode(record.business_type_category)
        if (!filters.businessTypes.includes(btCode)) {
          return false
        }
      }

      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(record.coverage_type)
      ) {
        return false
      }

      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(record.customer_category_3)
      ) {
        return false
      }

      if (
        filters.vehicleGrades.length > 0 &&
        record.vehicle_insurance_grade &&
        !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
      ) {
        return false
      }

      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(record.terminal_source)
      ) {
        return false
      }

      if (
        filters.isNewEnergy !== null &&
        record.is_new_energy_vehicle !== filters.isNewEnergy
      ) {
        return false
      }

      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(record.renewal_status)
      ) {
        return false
      }

      // 应用下钻筛选
      for (const step of drillDownSteps) {
        const recordValue = getRecordValue(record, step.dimensionKey)
        if (recordValue !== step.value) {
          return false
        }
      }

      return true
    })
  }, [rawData, filters, drillDownSteps])

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
      <DrillDownBreadcrumb
        steps={drillDownSteps}
        onNavigate={handleNavigate}
      />

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
            {drillDownSteps.length > 0
              ? `当前层级数据量`
              : `全部数据量`}
          </span>
          <span className="font-semibold text-slate-800">
            {filteredData.length.toLocaleString('zh-CN')} 条记录
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 从记录中获取指定维度的值
 */
function getRecordValue(
  record: InsuranceRecord,
  dimensionKey: DrillDownDimensionKey
): string | boolean {
  switch (dimensionKey) {
    case 'third_level_organization':
      return record.third_level_organization
    case 'business_type_category':
      return record.business_type_category
    case 'coverage_type':
      return record.coverage_type
    case 'terminal_source':
      return record.terminal_source
    case 'is_new_energy_vehicle':
      return record.is_new_energy_vehicle
    case 'renewal_status':
      return record.renewal_status
    case 'is_transferred_vehicle':
      return record.is_transferred_vehicle
    case 'insurance_type':
      return record.insurance_type
    default:
      return ''
  }
}
