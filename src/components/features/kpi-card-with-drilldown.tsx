/**
 * 带下钻功能的KPI卡片组件
 * 在原有KPI卡片基础上增加多层下钻分析能力
 */

'use client'

import { useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { KPICard, type KPICardProps } from './kpi-card'
import { DrillDownControl } from './drill-down/drill-down-control'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useKPIDrillDownSteps } from '@/store/drill-down-store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InsuranceRecord } from '@/types/insurance'

export interface KPICardWithDrilldownProps extends KPICardProps {
  /**
   * KPI 键值（用于标识当前指标）
   */
  kpiKey?: string

  /**
   * 是否启用下钻功能
   */
  enableDrillDown?: boolean

  /**
   * 计算KPI值的函数（用于下钻时动态计算）
   */
  calculateValue?: (data: InsuranceRecord[]) => number | null
}

export function KPICardWithDrilldown({
  enableDrillDown = true,
  kpiKey,
  onClick,
  calculateValue,
  ...kpiCardProps
}: KPICardWithDrilldownProps) {
  const [showDrillDown, setShowDrillDown] = useState(false)

  // 获取下钻步骤数量（用于显示徽章）
  const drillDownSteps = useKPIDrillDownSteps(kpiKey || '')
  const drillDownCount = drillDownSteps.length

  // 处理卡片点击
  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else if (enableDrillDown && kpiKey) {
      setShowDrillDown(true)
    }
  }

  return (
    <>
      {/* KPI卡片 */}
      <div className="relative">
        <KPICard {...kpiCardProps} onClick={handleCardClick} />

        {/* 下钻按钮（如果启用） */}
        {enableDrillDown && kpiKey && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 gap-1.5 bg-white/80 backdrop-blur-sm hover:bg-blue-50 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              setShowDrillDown(true)
            }}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span className="text-xs">下钻</span>
            {drillDownCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[1.25rem] bg-blue-600 px-1.5 text-xs text-white"
              >
                {drillDownCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* 下钻对话框 */}
      {enableDrillDown && kpiKey && (
        <Dialog open={showDrillDown} onOpenChange={setShowDrillDown}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-blue-600" />
                <span>{kpiCardProps.title} - 多维下钻分析</span>
              </DialogTitle>
              <DialogDescription>
                选择维度和具体值进行多层下钻分析，每次下钻不能重复使用相同维度
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <DrillDownControl kpiKey={kpiKey}>
                {(filteredData) => {
                  if (!calculateValue) return null
                  const val = calculateValue(filteredData)
                  if (val === null) return null

                  return (
                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                      <div className="text-sm text-slate-600">
                        {kpiCardProps.title} (当前筛选)
                      </div>
                      <div
                        className={cn(
                          'mt-1 text-2xl font-bold',
                          kpiCardProps.valueColor
                        )}
                      >
                        {kpiCardProps.formatter
                          ? kpiCardProps.formatter(val)
                          : val}
                        <span className="ml-1 text-sm text-slate-500">
                          {kpiCardProps.unit}
                        </span>
                      </div>
                    </div>
                  )
                }}
              </DrillDownControl>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
