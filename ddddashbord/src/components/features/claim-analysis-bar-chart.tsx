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

// X轴指标类型（赔付分析）
type ClaimMetric =
  | 'reported_claim'
  | 'claim_count'
  | 'avg_claim'
  | 'matured_claim_ratio'
  | 'loss_ratio'

// 赔付分析数据点类型
interface ClaimDataPoint extends DataPoint<ClaimMetric> {
  reported_claim_10k: number // 已报告赔款（万元）
  claim_count: number // 赔案件数
  avg_claim: number // 案均赔款（元）
  matured_claim_ratio: number // 满期出险率（%）
  loss_ratio: number // 满期赔付率（%）
}

// 按维度聚合赔付数据
function aggregateClaimData(
  data: InsuranceRecord[],
  dimension: YAxisDimension
): ClaimDataPoint[] {
  const map = new Map<
    string,
    {
      reportedClaim: number
      claimCount: number
      maturedPremium: number
      policyCount: number
      contribution: number
    }
  >()

  for (const record of data) {
    const key = getDimensionKey(record, dimension)

    if (!map.has(key)) {
      map.set(key, {
        reportedClaim: 0,
        claimCount: 0,
        maturedPremium: 0,
        policyCount: 0,
        contribution: 0,
      })
    }
    const entry = map.get(key)!
    entry.reportedClaim += record.reported_claim_payment_yuan
    entry.claimCount += record.claim_case_count
    entry.maturedPremium += record.matured_premium_yuan
    entry.policyCount += record.policy_count
    entry.contribution += record.marginal_contribution_amount_yuan
  }

  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    label: getDimensionLabel(key, dimension),
    reported_claim_10k: value.reportedClaim / 10000,
    claim_count: value.claimCount,
    avg_claim:
      value.claimCount > 0 ? value.reportedClaim / value.claimCount : 0,
    matured_claim_ratio:
      value.policyCount > 0 ? (value.claimCount / value.policyCount) * 100 : 0,
    loss_ratio:
      value.maturedPremium > 0
        ? (value.reportedClaim / value.maturedPremium) * 100
        : 0,
    contribution_margin_ratio:
      value.maturedPremium > 0
        ? (value.contribution / value.maturedPremium) * 100
        : null,
  }))
}

// 赔付分析指标配置
const CLAIM_METRICS: MetricDefinition<ClaimMetric>[] = [
  {
    value: 'reported_claim',
    label: '已报告赔款',
    config: {
      dataKey: 'reported_claim_10k',
      name: '已报告赔款',
      unit: '万元',
      formatter: (v: number) => formatNumber(v, 2),
      sortKey: 'reported_claim_10k',
    },
  },
  {
    value: 'claim_count',
    label: '赔案件数',
    config: {
      dataKey: 'claim_count',
      name: '赔案件数',
      unit: '件',
      formatter: (v: number) => formatNumber(v, 0),
      sortKey: 'claim_count',
    },
  },
  {
    value: 'avg_claim',
    label: '案均赔款',
    config: {
      dataKey: 'avg_claim',
      name: '案均赔款',
      unit: '元',
      formatter: (v: number) => formatNumber(v, 0),
      sortKey: 'avg_claim',
    },
  },
  {
    value: 'matured_claim_ratio',
    label: '满期出险率',
    config: {
      dataKey: 'matured_claim_ratio',
      name: '满期出险率',
      unit: '%',
      formatter: (v: number) => formatNumber(v, 2) + '%',
      sortKey: 'matured_claim_ratio',
    },
  },
  {
    value: 'loss_ratio',
    label: '满期赔付率',
    config: {
      dataKey: 'loss_ratio',
      name: '满期赔付率',
      unit: '%',
      formatter: (v: number) => formatNumber(v, 2) + '%',
      sortKey: 'loss_ratio',
    },
  },
]

/**
 * 赔付分析条形图组件
 *
 * 使用通用 DimensionBarChart 组件，配置赔付相关指标
 */
export const ClaimAnalysisBarChart = React.memo(
  function ClaimAnalysisBarChart() {
    return (
      <DimensionBarChart
        title="赔付分析条形图"
        chartId="claim-analysis-chart"
        metrics={CLAIM_METRICS}
        defaultMetric="reported_claim"
        aggregateFunction={aggregateClaimData}
        defaultTopN={12}
      />
    )
  }
)
