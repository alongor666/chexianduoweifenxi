'use client'

import React from 'react'
import {
  DimensionBarChart,
  type YAxisDimension,
  type DataPoint,
  type MetricDefinition,
} from './dimension-bar-chart'
import { getDimensionKey, getDimensionLabel } from '@/utils/aggregation'
import { formatNumber } from '@/utils/format'
import type { InsuranceRecord } from '@/types/insurance'

// X轴指标类型（保费分析）
type PremiumMetric =
  | 'signed_premium'
  | 'matured_premium'
  | 'avg_premium'
  | 'policy_count'
  | 'maturity_ratio'

// 保费分析数据点类型
interface PremiumDataPoint extends DataPoint<PremiumMetric> {
  signed_premium_10k: number // 签单保费（万元）
  matured_premium_10k: number // 满期保费（万元）
  policy_count: number // 保单件数
  avg_premium: number // 单均保费（元）
  maturity_ratio: number // 满期率（%）
}

// 按维度聚合保费数据
function aggregatePremiumData(
  data: InsuranceRecord[],
  dimension: YAxisDimension
): PremiumDataPoint[] {
  const map = new Map<
    string,
    {
      signed: number
      matured: number
      count: number
      contribution: number
    }
  >()

  for (const record of data) {
    const key = getDimensionKey(record, dimension)

    if (!map.has(key)) {
      map.set(key, { signed: 0, matured: 0, count: 0, contribution: 0 })
    }
    const entry = map.get(key)!
    entry.signed += record.signed_premium_yuan
    entry.matured += record.matured_premium_yuan
    entry.count += record.policy_count
    entry.contribution += record.marginal_contribution_amount_yuan
  }

  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    label: getDimensionLabel(key, dimension),
    signed_premium_10k: value.signed / 10000,
    matured_premium_10k: value.matured / 10000,
    policy_count: value.count,
    avg_premium: value.count > 0 ? value.signed / value.count : 0,
    maturity_ratio: value.signed > 0 ? (value.matured / value.signed) * 100 : 0,
    contribution_margin_ratio:
      value.matured > 0 ? (value.contribution / value.matured) * 100 : null,
  }))
}

// 保费分析指标配置
const PREMIUM_METRICS: MetricDefinition<PremiumMetric>[] = [
  {
    value: 'signed_premium',
    label: '签单保费',
    config: {
      dataKey: 'signed_premium_10k',
      name: '签单保费',
      unit: '万元',
      formatter: (v: number) => formatNumber(v, 2),
      sortKey: 'signed_premium_10k',
    },
  },
  {
    value: 'matured_premium',
    label: '满期保费',
    config: {
      dataKey: 'matured_premium_10k',
      name: '满期保费',
      unit: '万元',
      formatter: (v: number) => formatNumber(v, 2),
      sortKey: 'matured_premium_10k',
    },
  },
  {
    value: 'avg_premium',
    label: '单均保费',
    config: {
      dataKey: 'avg_premium',
      name: '单均保费',
      unit: '元',
      formatter: (v: number) => formatNumber(v, 0),
      sortKey: 'avg_premium',
    },
  },
  {
    value: 'policy_count',
    label: '保单件数',
    config: {
      dataKey: 'policy_count',
      name: '保单件数',
      unit: '件',
      formatter: (v: number) => formatNumber(v, 0),
      sortKey: 'policy_count',
    },
  },
  {
    value: 'maturity_ratio',
    label: '满期率',
    config: {
      dataKey: 'maturity_ratio',
      name: '满期率',
      unit: '%',
      formatter: (v: number) => formatNumber(v, 2) + '%',
      sortKey: 'maturity_ratio',
    },
  },
]

/**
 * 保费分析条形图组件
 *
 * 使用通用 DimensionBarChart 组件，配置保费相关指标
 */
export const PremiumAnalysisBarChart = React.memo(
  function PremiumAnalysisBarChart() {
    return (
      <DimensionBarChart
        title="保费分析条形图"
        chartId="premium-analysis-chart"
        metrics={PREMIUM_METRICS}
        defaultMetric="matured_premium"
        aggregateFunction={aggregatePremiumData}
        defaultTopN={12}
      />
    )
  }
)
