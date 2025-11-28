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
import { formatNumber } from '@/utils/formatters'
import type { InsuranceRecord } from '@/types/insurance'
import { getContributionMarginHexColor } from '@/utils/color-scale'

// Y轴维度类型
type YAxisDimension = 'business_type' | 'organization' | 'coverage_type'

// X轴指标类型（保费分析）
type XAxisMetric =
  | 'signed_premium'
  | 'matured_premium'
  | 'avg_premium'
  | 'policy_count'
  | 'maturity_ratio'

// 聚合数据点类型
interface DataPoint {
  key: string
  label: string
  signed_premium_10k: number // 签单保费（万元）
  matured_premium_10k: number // 满期保费（万元）
  policy_count: number // 保单件数
  avg_premium: number // 单均保费（元）
  maturity_ratio: number // 满期率（%）
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
      signed: number
      matured: number
      count: number
      contribution: number
    }
  >()

  for (const record of data) {
    let key: string
    switch (dimension) {
      case 'business_type':
        key = record.business_type_category || '未知'
        break
      case 'organization':
        key = record.third_level_organization || '未知'
        break
      case 'coverage_type':
        key = record.coverage_type || '未知'
        break
    }

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
    label: key,
    signed_premium_10k: value.signed / 10000,
    matured_premium_10k: value.matured / 10000,
    policy_count: value.count,
    avg_premium: value.count > 0 ? value.signed / value.count : 0,
    maturity_ratio: value.signed > 0 ? (value.matured / value.signed) * 100 : 0,
    contribution_margin_ratio:
      value.matured > 0 ? (value.contribution / value.matured) * 100 : null,
  }))
}

// 使用React.memo优化组件性能
export const PremiumAnalysisBarChart = React.memo(
  function PremiumAnalysisBarChart() {
    const filteredData = useFilteredData()

    // Y轴维度选择
    const [yDimension, setYDimension] =
      useState<YAxisDimension>('business_type')

    // X轴指标选择
    const [xMetric, setXMetric] = useState<XAxisMetric>('matured_premium')

    // TopN 控件
    const [topN, setTopN] = useState<number>(12)

    // 聚合并排序数据
    const chartData = useMemo(() => {
      if (!filteredData || filteredData.length === 0) return []

      const aggregated = aggregateByDimension(filteredData, yDimension)

      // 根据X轴指标排序
      aggregated.sort((a, b) => {
        switch (xMetric) {
          case 'signed_premium':
            return b.signed_premium_10k - a.signed_premium_10k
          case 'matured_premium':
            return b.matured_premium_10k - a.matured_premium_10k
          case 'avg_premium':
            return b.avg_premium - a.avg_premium
          case 'policy_count':
            return b.policy_count - a.policy_count
          case 'maturity_ratio':
            return b.maturity_ratio - a.maturity_ratio
        }
      })

      return aggregated.slice(0, Math.max(1, Math.min(50, topN)))
    }, [filteredData, yDimension, xMetric, topN])

    if (!chartData || chartData.length === 0) return null

    // 获取当前指标的配置
    const metricConfig = {
      signed_premium: {
        dataKey: 'signed_premium_10k',
        name: '签单保费',
        unit: '万元',
        formatter: (v: number) => formatNumber(v, 2),
      },
      matured_premium: {
        dataKey: 'matured_premium_10k',
        name: '满期保费',
        unit: '万元',
        formatter: (v: number) => formatNumber(v, 2),
      },
      avg_premium: {
        dataKey: 'avg_premium',
        name: '单均保费',
        unit: '元',
        formatter: (v: number) => formatNumber(v, 0),
      },
      policy_count: {
        dataKey: 'policy_count',
        name: '保单件数',
        unit: '件',
        formatter: (v: number) => formatNumber(v, 0),
      },
      maturity_ratio: {
        dataKey: 'maturity_ratio',
        name: '满期率',
        unit: '%',
        formatter: (v: number) => formatNumber(v, 2) + '%',
      },
    }[xMetric]

    return (
      <div
        id="premium-analysis-chart"
        className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl"
      >
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                保费分析条形图
              </h3>
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
                <option value="signed_premium">签单保费</option>
                <option value="matured_premium">满期保费</option>
                <option value="avg_premium">单均保费</option>
                <option value="policy_count">保单件数</option>
                <option value="maturity_ratio">满期率</option>
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
              <XAxis type="number" tickFormatter={metricConfig.formatter} />
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
                    key={`premium-bar-${dataPoint.key}`}
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
  }
)
