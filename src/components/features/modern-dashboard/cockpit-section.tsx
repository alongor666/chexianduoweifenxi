'use client'

import React, { useMemo } from 'react'
import { formatPercent, formatNumber } from '@/utils/format'
import type {
  KPIResult,
  InsuranceRecord as RawInsuranceRecord,
} from '@/types/insurance'
import { KPICardWithDrilldown } from '../kpi-card-with-drilldown'
import {
  calculateKPIs,
  InsuranceRecord as DomainInsuranceRecord,
} from '@/domain'
import { getComparisonMetrics } from '@/utils/comparison'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useAppStore } from '@/store/use-app-store'
import { getMetricColor } from '@/config/thresholds'
import {
  calculateLossRatio,
  calculateVariableCostRatio,
  WORKING_WEEKS_PER_YEAR,
} from '@/domain/rules/kpi-calculator-enhanced'

export interface CockpitSectionProps {
  kpiData: KPIResult | null
  compareData?: KPIResult | null
  isLoading?: boolean
}

// 核心 KPI 配置（第一行）
const CORE_KPIS_ROW1 = [
  {
    key: 'premium_time_progress_achievement_rate',
    title: '时间进度达成率',
    unit: '',
    formatter: formatPercent,
    getColor: (val: number | null) =>
      `text-[${getMetricColor(val, 'time_progress_ratio')}]`,
    description: '业绩完成情况的核心指标',
  },
  {
    key: 'variable_cost_ratio',
    title: '变动成本率',
    unit: '',
    formatter: formatPercent,
    getColor: (val: number | null) =>
      `text-[${getMetricColor(val, 'variable_cost_ratio')}]`,
    description: '成本控制的复合指标',
  },
  {
    key: 'loss_ratio',
    title: '满期赔付率',
    unit: '',
    formatter: formatPercent,
    getColor: (val: number | null) =>
      `text-[${getMetricColor(val, 'loss_ratio')}]`,
    description: '业务质量的核心风险指标',
  },
  {
    key: 'expense_ratio',
    title: '费用率',
    unit: '',
    formatter: formatPercent,
    getColor: (val: number | null) =>
      `text-[${getMetricColor(val, 'expense_ratio')}]`,
    description: '费用管控水平',
  },
]

/**
 * 计算机构维度的聚合指标
 */
function aggregateByOrganization(records: RawInsuranceRecord[]) {
  const map = new Map<string, RawInsuranceRecord[]>()
  records.forEach(r => {
    const org = r.third_level_organization
    if (!map.has(org)) map.set(org, [])
    map.get(org)!.push(r)
  })
  return Array.from(map.entries()).map(([org, recs]) => {
    const sum = (fn: (r: RawInsuranceRecord) => number) =>
      recs.reduce((acc, r) => acc + fn(r), 0)
    const signed = sum(r => r.signed_premium_yuan)
    const matured = sum(r => r.matured_premium_yuan)
    const reported = sum(r => r.reported_claim_payment_yuan)
    const expense = sum(r => r.expense_amount_yuan)
    const plan = sum(r => r.premium_plan_yuan || 0)
    const count = sum(r => r.policy_count)
    return {
      organization: org,
      signed,
      matured,
      reported,
      expense,
      plan,
      policyCount: count,
    }
  })
}

/**
 * 计算业务类型维度的聚合指标
 */
function aggregateByBusinessType(records: RawInsuranceRecord[]) {
  const map = new Map<string, RawInsuranceRecord[]>()
  records.forEach(r => {
    const bt = r.business_type_category
    if (!map.has(bt)) map.set(bt, [])
    map.get(bt)!.push(r)
  })
  return Array.from(map.entries()).map(([bt, recs]) => {
    const sum = (fn: (r: RawInsuranceRecord) => number) =>
      recs.reduce((acc, r) => acc + fn(r), 0)
    const matured = sum(r => r.matured_premium_yuan)
    const reported = sum(r => r.reported_claim_payment_yuan)
    return {
      businessType: bt,
      matured,
      reported,
    }
  })
}

export function CockpitSection({
  kpiData,
  compareData,
  isLoading = false,
}: CockpitSectionProps) {
  const filteredData = useFilteredData()
  const filters = useAppStore(state => state.filters)

  // 计算当前选择的周进度（用于时间进度达成率“落后机构”判断）
  const currentWeekNumber = useMemo(() => {
    if (filters.viewMode === 'single' && filters.singleModeWeek) {
      return filters.singleModeWeek
    }
    if (filters.viewMode !== 'single' && filters.weeks?.length) {
      return Math.max(...filters.weeks)
    }
    // 如果未选择周，使用数据中的最大周或默认值
    const maxWeek =
      filteredData.length > 0
        ? Math.max(...filteredData.map(r => r.week_number))
        : null
    return maxWeek ?? null
  }, [filters, filteredData])

  // 机构聚合与统计
  const orgAgg = useMemo(
    () => aggregateByOrganization(filteredData),
    [filteredData]
  )
  const behindOrgCount = useMemo(() => {
    if (!currentWeekNumber || currentWeekNumber <= 0) return 0
    const yearProgress = Math.min(currentWeekNumber / WORKING_WEEKS_PER_YEAR, 1)
    return orgAgg.filter(org => {
      if (!org.plan || org.plan <= 0) return false
      const completionRatio = org.signed / org.plan
      const timeProgressAchievement = (completionRatio / yearProgress) * 100
      return timeProgressAchievement < 100 // 落后判定
    }).length
  }, [orgAgg, currentWeekNumber])

  const variableCostRiskOrgCount = useMemo(() => {
    return orgAgg.filter(org => {
      const ratio = calculateVariableCostRatio(
        org.reported,
        org.matured,
        org.expense,
        org.signed
      )
      return ratio !== null && ratio > 92
    }).length
  }, [orgAgg])

  const lossRatioRiskOrgCount = useMemo(() => {
    return orgAgg.filter(org => {
      const ratio = calculateLossRatio(org.reported, org.matured)
      return ratio !== null && ratio > 70
    }).length
  }, [orgAgg])

  // 业务类型聚合与统计（满期赔付率超70%的业务类型数量）
  const btAgg = useMemo(
    () => aggregateByBusinessType(filteredData),
    [filteredData]
  )
  const lossRatioRiskBusinessTypeCount = useMemo(() => {
    return btAgg.filter(bt => {
      const ratio = calculateLossRatio(bt.reported, bt.matured)
      return ratio !== null && ratio > 70
    }).length
  }, [btAgg])

  // 渲染单个KPI卡片
  const renderKPICard = (config: (typeof CORE_KPIS_ROW1)[0]) => {
    const value = kpiData?.[config.key as keyof KPIResult] as number | null
    const comparison = getComparisonMetrics(
      config.key as keyof KPIResult,
      kpiData,
      compareData
    )

    const isRatioMetric = [
      'loss_ratio',
      'expense_ratio',
      'premium_time_progress_achievement_rate',
    ].includes(config.key)

    let displayCompareValue: number | null = null
    let displayCompareUnit = '%'

    if (comparison.absoluteChange !== null) {
      if (isRatioMetric) {
        displayCompareValue = comparison.absoluteChange
        displayCompareUnit = 'pp'
      } else {
        displayCompareValue = comparison.percentChange
        displayCompareUnit = '%'
      }
    }

    return (
      <KPICardWithDrilldown
        key={config.key}
        title={config.title}
        value={value}
        compareValue={displayCompareValue}
        compareUnit={displayCompareUnit}
        unit={config.unit}
        valueColor={config.getColor(value)}
        formatter={config.formatter}
        kpiKey={config.key}
        enableDrillDown={true}
        calculateValue={data => {
          const records = data.map(d => DomainInsuranceRecord.fromRawData(d))
          const result = calculateKPIs(records)
          return result[config.key as keyof KPIResult] as number | null
        }}
      />
    )
  }

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-slate-100"></div>
  }

  return (
    <div className="space-y-6">
      {/* 核心KPI 第一行 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CORE_KPIS_ROW1.map(config => renderKPICard(config))}
      </div>

      {/* 核心KPI 第二行：统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICardWithDrilldown
          title="时间进度达成率落后机构数量"
          value={behindOrgCount}
          unit="家"
          valueColor={behindOrgCount > 0 ? 'text-orange-600' : 'text-green-600'}
          formatter={(v: number | null | undefined) =>
            v !== null && v !== undefined ? formatNumber(v) : '-'
          }
        />
        <KPICardWithDrilldown
          title="变动成本率超92%机构数量"
          value={variableCostRiskOrgCount}
          unit="家"
          valueColor={
            variableCostRiskOrgCount > 0 ? 'text-red-600' : 'text-green-600'
          }
          formatter={(v: number | null | undefined) =>
            v !== null && v !== undefined ? formatNumber(v) : '-'
          }
        />
        <KPICardWithDrilldown
          title="满期赔付率超70%机构数量"
          value={lossRatioRiskOrgCount}
          unit="家"
          valueColor={
            lossRatioRiskOrgCount > 0 ? 'text-red-600' : 'text-green-600'
          }
          formatter={(v: number | null | undefined) =>
            v !== null && v !== undefined ? formatNumber(v) : '-'
          }
        />
        <KPICardWithDrilldown
          title="满期赔付率超70%业务类型数量"
          value={lossRatioRiskBusinessTypeCount}
          unit="类"
          valueColor={
            lossRatioRiskBusinessTypeCount > 0
              ? 'text-red-600'
              : 'text-green-600'
          }
          formatter={(v: number | null | undefined) =>
            v !== null && v !== undefined ? formatNumber(v) : '-'
          }
        />
      </div>
    </div>
  )
}
