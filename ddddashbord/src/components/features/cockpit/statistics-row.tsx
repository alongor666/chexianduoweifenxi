'use client'

import React, { useMemo } from 'react'
import { useOrganizationComparison } from '@/hooks/use-comparison-analysis'
import { useBusinessTypeComparison } from '@/hooks/use-comparison-analysis'
import { getThresholdLevel } from '@/config/thresholds'

/**
 * 统计指标行组件（第二行）
 * 展示4个风险数量型指标：
 * 1. 时间进度达成率落后机构数量
 * 2. 变动成本率 >92% 的机构数量
 * 3. 满期赔付率 >70% 的机构数量
 * 4. 满期赔付率 >70% 的业务类型数量
 */
export function StatisticsRow() {
  const organizationComparisons = useOrganizationComparison()
  const businessTypeComparisons = useBusinessTypeComparison()

  const stats = useMemo(() => {
    // 1. 时间进度达成率落后机构数量（预警或危险状态）
    const timeProgressLagging = organizationComparisons.filter(item => {
      const level = getThresholdLevel(
        item.kpi.premium_time_progress_achievement_rate,
        'time_progress_ratio'
      )
      return level === 'danger' || level === 'warning'
    }).length

    // 2. 变动成本率 >92% 的机构数量
    const highVariableCost = organizationComparisons.filter(item => {
      const ratio = item.kpi.variable_cost_ratio ?? 0
      return ratio > 92
    }).length

    // 3. 满期赔付率 >70% 的机构数量
    const highLossRatioOrgs = organizationComparisons.filter(item => {
      const ratio = item.kpi.loss_ratio ?? 0
      return ratio > 70
    }).length

    // 4. 满期赔付率 >70% 的业务类型数量
    const highLossRatioBusinessTypes = businessTypeComparisons.filter(item => {
      const ratio = item.kpi.loss_ratio ?? 0
      return ratio > 70
    }).length

    return {
      timeProgressLagging,
      highVariableCost,
      highLossRatioOrgs,
      highLossRatioBusinessTypes,
    }
  }, [organizationComparisons, businessTypeComparisons])

  const tiles = [
    {
      title: '时间进度达成率落后机构数',
      value: stats.timeProgressLagging,
      color: 'text-amber-600',
      icon: '⏰',
    },
    {
      title: '变动成本率>92%机构数',
      value: stats.highVariableCost,
      color: 'text-orange-600',
      icon: '📊',
    },
    {
      title: '满期赔付率>70%机构数',
      value: stats.highLossRatioOrgs,
      color: 'text-red-600',
      icon: '⚠️',
    },
    {
      title: '满期赔付率>70%业务类型数',
      value: stats.highLossRatioBusinessTypes,
      color: 'text-red-700',
      icon: '🔴',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map(t => (
        <div
          key={t.title}
          className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{t.icon}</span>
            <div className="text-xs font-medium text-slate-600">{t.title}</div>
          </div>
          <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
        </div>
      ))}
    </div>
  )
}
