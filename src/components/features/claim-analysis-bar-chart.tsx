'use client'

import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { useFilteredData } from '@/store/use-app-store'
import { getBusinessTypeCode, getBusinessTypeShortLabelByCode } from '@/constants/dimensions'
import { formatNumber } from '@/utils/format'
import type { InsuranceRecord } from '@/types/insurance'
import { getContributionMarginHexColor } from '@/utils/color-scale'

// Y轴维度类型
type YAxisDimension = 'business_type' | 'organization' | 'coverage_type'

// X轴指标类型（赔付分析）
type XAxisMetric =
  | 'reported_claim'
  | 'claim_count'
  | 'avg_claim'
  | 'matured_claim_ratio'
  | 'loss_ratio'

// 聚合数据点类型
interface DataPoint {
  key: string
  label: string
  reported_claim_10k: number // 已报告赔款（万元）
  claim_count: number // 赔案件数
  avg_claim: number // 案均赔款（元）
  matured_claim_ratio: number // 满期出险率（%）
  loss_ratio: number // 满期赔付率（%）
  contribution_margin_ratio: number | null // 满期边际贡献率（%）
}

// 按维度聚合数据
function aggregateByDimension(
  data: InsuranceRecord[],
  dimension: YAxisDimension
): DataPoint[] {
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
    let key: string
    switch (dimension) {
      case 'business_type':
        key = getBusinessTypeCode(record.business_type_category || '')
        break
      case 'organization':
        key = record.third_level_organization || '未知'
        break
      case 'coverage_type':
        key = record.coverage_type || '未知'
        break
    }

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
    label: dimension === 'business_type' ? getBusinessTypeShortLabelByCode(key as any) : key,
    reported_claim_10k: value.reportedClaim / 10000,
    claim_count: value.claimCount,
    avg_claim: value.claimCount > 0 ? value.reportedClaim / value.claimCount : 0,
    matured_claim_ratio: value.policyCount > 0 ? (value.claimCount / value.policyCount) * 100 : 0,
    loss_ratio: value.maturedPremium > 0 ? (value.reportedClaim / value.maturedPremium) * 100 : 0,
    contribution_margin_ratio:
      value.maturedPremium > 0 ? (value.contribution / value.maturedPremium) * 100 : null,
  }))
}

// 使用React.memo优化组件性能
export const ClaimAnalysisBarChart = React.memo(function ClaimAnalysisBarChart() {
  const filteredData = useFilteredData()

  // Y轴维度选择
  const [yDimension, setYDimension] = useState<YAxisDimension>('business_type')

  // X轴指标选择
  const [xMetric, setXMetric] = useState<XAxisMetric>('reported_claim')

  // TopN 控件
  const [topN, setTopN] = useState<number>(12)

  // 聚合并排序数据
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []

    const aggregated = aggregateByDimension(filteredData, yDimension)

    // 根据X轴指标排序
    aggregated.sort((a, b) => {
      switch (xMetric) {
        case 'reported_claim':
          return b.reported_claim_10k - a.reported_claim_10k
        case 'claim_count':
          return b.claim_count - a.claim_count
        case 'avg_claim':
          return b.avg_claim - a.avg_claim
        case 'matured_claim_ratio':
          return b.matured_claim_ratio - a.matured_claim_ratio
        case 'loss_ratio':
          return b.loss_ratio - a.loss_ratio
      }
    })

    return aggregated.slice(0, Math.max(1, Math.min(50, topN)))
  }, [filteredData, yDimension, xMetric, topN])

  if (!chartData || chartData.length === 0) return null

  // 获取当前指标的配置
  const metricConfig = {
    reported_claim: {
      dataKey: 'reported_claim_10k',
      name: '已报告赔款',
      unit: '万元',
      formatter: (v: number) => formatNumber(v, 2),
    },
    claim_count: {
      dataKey: 'claim_count',
      name: '赔案件数',
      unit: '件',
      formatter: (v: number) => formatNumber(v, 0),
    },
    avg_claim: {
      dataKey: 'avg_claim',
      name: '案均赔款',
      unit: '元',
      formatter: (v: number) => formatNumber(v, 0),
    },
    matured_claim_ratio: {
      dataKey: 'matured_claim_ratio',
      name: '满期出险率',
      unit: '%',
      formatter: (v: number) => formatNumber(v, 2) + '%',
    },
    loss_ratio: {
      dataKey: 'loss_ratio',
      name: '满期赔付率',
      unit: '%',
      formatter: (v: number) => formatNumber(v, 2) + '%',
    },
  }[xMetric]

  return (
    <div
      id="claim-analysis-chart"
      className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">赔付分析条形图</h3>
            <p className="text-xs text-slate-500">
              {metricConfig.name}（{metricConfig.unit}） Top 排序
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600">Top</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={e => setTopN(Number(e.target.value) || 1)}
              className="w-16 border border-slate-300 rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">Y轴维度</label>
            <select
              className="border border-slate-300 rounded px-3 py-1 bg-white"
              value={yDimension}
              onChange={e => setYDimension(e.target.value as YAxisDimension)}
            >
              <option value="business_type">业务类型</option>
              <option value="organization">三级机构</option>
              <option value="coverage_type">险别组合</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600 font-medium">X轴指标</label>
            <select
              className="border border-slate-300 rounded px-3 py-1 bg-white"
              value={xMetric}
              onChange={e => setXMetric(e.target.value as XAxisMetric)}
            >
              <option value="reported_claim">已报告赔款</option>
              <option value="claim_count">赔案件数</option>
              <option value="avg_claim">案均赔款</option>
              <option value="matured_claim_ratio">满期出险率</option>
              <option value="loss_ratio">满期赔付率</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tickFormatter={metricConfig.formatter}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => metricConfig.formatter(value)}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Bar
              dataKey={metricConfig.dataKey}
              name={metricConfig.name}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map(dataPoint => (
                <Cell
                  key={`claim-bar-${dataPoint.key}`}
                  fill={getContributionMarginHexColor(
                    dataPoint.contribution_margin_ratio
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
