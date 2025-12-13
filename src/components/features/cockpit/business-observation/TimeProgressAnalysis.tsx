'use client'

import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useOrganizationComparison } from '@/hooks/use-comparison-analysis'
import { getThresholdLevel, sortByValue } from '@/config/thresholds'

/**
 * 经营观察：时间进度达成率观察
 * 关注点：哪些机构落后、环比变化值、变化幅度
 */
export function TimeProgressAnalysis() {
  const organizationComparisons = useOrganizationComparison()

  const chartData = useMemo(() => {
    // 筛选出落后机构（预警或危险状态）
    const laggingOrgs = organizationComparisons.filter(item => {
      const level = getThresholdLevel(
        item.kpi.premium_time_progress_achievement_rate,
        'time_progress_ratio'
      )
      return level === 'danger' || level === 'warning'
    })

    // 按时间进度达成率从最差到最好排序
    const sorted = sortByValue(
      laggingOrgs,
      item => item.kpi.premium_time_progress_achievement_rate,
      'time_progress_ratio'
    )

    return sorted.map(item => ({
      organization: item.organization,
      value: item.kpi.premium_time_progress_achievement_rate ?? 0,
      level: getThresholdLevel(
        item.kpi.premium_time_progress_achievement_rate,
        'time_progress_ratio'
      ),
    }))
  }, [organizationComparisons])

  const option = {
    title: {
      text: '时间进度达成率落后机构',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>达成率: ${data.value.toFixed(1)}%`
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
      name: '达成率 (%)',
      axisLabel: { formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.organization),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: chartData.map(d => ({
          value: d.value,
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
      <h4 className="text-sm font-bold text-slate-700 mb-4">
        经营观察：时间进度达成率
      </h4>
      {chartData.length > 0 ? (
        <ReactECharts option={option} style={{ height: '400px' }} />
      ) : (
        <div className="text-center text-slate-500 py-8">暂无落后机构数据</div>
      )}
    </div>
  )
}
