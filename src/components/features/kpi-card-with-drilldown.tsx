/**
 * 带下钻功能的KPI卡片组件
 * 在原有KPI卡片基础上增加多层下钻分析能力
 */

'use client'

import { KPICard, type KPICardProps } from './kpi-card'
import type { InsuranceRecord } from '@/types/insurance'

export interface KPICardWithDrilldownProps extends KPICardProps {
  /**
   * KPI 键值（用于标识当前指标）
   * @deprecated 全局下钻模式下不再需要
   */
  kpiKey?: string

  /**
   * 是否启用下钻功能
   * @deprecated 全局下钻模式下不再需要
   */
  enableDrillDown?: boolean

  /**
   * 计算KPI值的函数（用于下钻时动态计算）
   * @deprecated 全局下钻模式下不再需要，值由父组件计算
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
  // 全局下钻模式下，KPICardWithDrilldown 仅作为 KPICard 的包装
  // 值(value)已经包含了全局下钻的影响

  return (
    <div className="relative group">
      <div className="transition-all duration-200 rounded-xl">
        <KPICard {...kpiCardProps} onClick={onClick} />
      </div>
    </div>
  )
}
