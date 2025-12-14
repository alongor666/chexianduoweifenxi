'use client'

import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  useOrganizationComparison,
  useBusinessTypeComparison,
} from '@/hooks/use-comparison-analysis'
import { getThresholdLevel, sortByValue } from '@/config/thresholds'

/**
 * 经营观察：变动成本率观察
 * 分两类维度暴露状态：机构维度、业务类型维度
 */
export function CostRiskAnalysis() {
  const [dimension, setDimension] = useState<'organization' | 'businessType'>(
    'organization'
  )
  const organizationComparisons = useOrganizationComparison()
  const businessTypeComparisons = useBusinessTypeComparison()

  const chartData = useMemo(() => {
    const comparisons =
      dimension === 'organization'
        ? organizationComparisons
        : businessTypeComparisons

    // 筛选出危险或预警状态
    const riskItems = comparisons.filter(item => {
      const level = getThresholdLevel(
        item.kpi.variable_cost_ratio,
        'variable_cost_ratio'
      )
      return level === 'danger' || level === 'warning'
    })

    // 按变动成本率从最差到最好排序
    const sorted = sortByValue(
      riskItems,
      item => item.kpi.variable_cost_ratio,
      'variable_cost_ratio'
    )

    return sorted.map(item => ({
      name:
        dimension === 'organization'
          ? (item as any).organization
          : (item as any).businessType,
      value: item.kpi.variable_cost_ratio ?? 0,
      level: getThresholdLevel(
        item.kpi.variable_cost_ratio,
        'variable_cost_ratio'
      ),
    }))
  }, [dimension, organizationComparisons, businessTypeComparisons])

  // 统计危险和预警数量
  const stats = useMemo(() => {
    const danger = chartData.filter(d => d.level === 'danger').length
    const warning = chartData.filter(d => d.level === 'warning').length
    return { danger, warning }
  }, [chartData])

  const option = {
    title: {
      text: `变动成本率风险分布（${dimension === 'organization' ? '机构' : '业务类型'}）`,
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        const level = data.data.level === 'danger' ? '危险' : '预警'
        return `${data.name}<br/>成本率: ${data.value.toFixed(1)}%<br/>状态: ${level}`
      },
    },
    grid: {
      left: '15%',
      right: '5%',
      top: '15%',
      bottom: '10%',
    },
    xAxis: {
      type: 'value',
      name: '变动成本率 (%)',
      axisLabel: { formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: chartData.map(d => ({
          value: d.value,
          level: d.level,
          itemStyle: {
            color: d.level === 'danger' ? '#ef4444' : '#f59e0b',
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 10,
        },
      },
    ],
  }

  return (
    <div className="rounded-xl border p-4 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-700">
          经营观察：变动成本率
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setDimension('organization')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              dimension === 'organization'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            机构维度
          </button>
          <button
            onClick={() => setDimension('businessType')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              dimension === 'businessType'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            业务类型维度
          </button>
        </div>
      </div>

      {/* 风险统计 */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500"></span>
          <span className="text-slate-600">危险状态: {stats.danger}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-500"></span>
          <span className="text-slate-600">预警状态: {stats.warning}</span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ReactECharts option={option} style={{ height: '400px' }} />
      ) : (
        <div className="text-center text-slate-500 py-8">
          暂无风险{dimension === 'organization' ? '机构' : '业务类型'}数据
        </div>
      )}
    </div>
  )
}
