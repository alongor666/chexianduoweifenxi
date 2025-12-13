'use client'

/**
 * 客户分群气泡图 (P2功能)
 *
 * 功能描述：
 * - X轴：单均保费（average_premium）
 * - Y轴：赔付率（loss_ratio）
 * - 气泡大小：保单件数（policy_count）
 * - 支持按客户类型、业务类型着色
 * - 自动标注高价值客户群和高风险客户群
 *
 * PRD位置：2.2.5 结构分析与对比模块 - 客户分群气泡图（P1）
 */

import { useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { BaseEChart } from '@/components/charts/BaseEChart'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { InsuranceRecord } from '@/types/insurance'
import { formatNumber, formatPercent } from '@/utils/format'
import {
  getBusinessTypeCode,
  getBusinessTypeShortLabelByCode,
} from '@/constants/dimensions'

// 颜色配置 - 按客户类型
const CUSTOMER_COLORS: Record<string, string> = {
  个人客户: '#3b82f6', // 蓝色
  企业客户: '#10b981', // 绿色
  政府机关: '#f59e0b', // 橙色
  其他: '#6b7280', // 灰色
}

// 颜色配置 - 按业务类型
const BUSINESS_COLORS: Record<string, string> = {
  '非营客-新': '#3b82f6',
  '非营客-旧': '#10b981',
  '非营客-过户': '#f59e0b',
  '非营货-<1t': '#8b5cf6',
  '非营货-1–2t': '#6366f1',
  '营货-<2t': '#ef4444',
  '营货-2–9t': '#f97316',
  '营货-9–10t': '#f59e0b',
  '营货-≥10t普': '#22c55e',
  '营货-≥10t牵': '#0ea5e9',
  '营货-≥10t卸': '#14b8a6',
  '营货-≥10t特': '#a855f7',
  '营货-其他': '#6b7280',
  摩托: '#64748b',
  '营客-出租': '#d946ef',
  '营客-网约': '#ec4899',
  其他: '#6b7280',
}

type ColorByType = 'customer' | 'business'

interface BubbleDataPoint {
  name: string // 分组名称
  averagePremium: number // 单均保费（元）
  lossRatio: number // 赔付率（%）
  policyCount: number // 保单件数
  color: string
  segment: 'high-value' | 'high-risk' | 'normal' | 'low-value' // 客户群标签
}

interface Props {
  className?: string
}

// 客户群标签（供 tooltip 使用）
const segmentLabels = {
  'high-value': '💎 高价值客户',
  'high-risk': '⚠️ 高风险客户',
  'low-value': '📉 低价值客户',
  normal: '✓ 正常客户',
}

export function CustomerSegmentationBubble({ className }: Props) {
  const filteredData = useFilteredData()
  const [colorBy, setColorBy] = useState<ColorByType>('customer')

  // 计算气泡图数据
  const bubbleData = useMemo(() => {
    if (filteredData.length === 0) return []

    // 按选定维度分组
    const groupKey =
      colorBy === 'customer' ? 'customer_category_3' : 'business_type_category'
    const groups = new Map<string, InsuranceRecord[]>()

    filteredData.forEach(record => {
      const key =
        colorBy === 'customer'
          ? (record[groupKey] as string) || '其他'
          : getBusinessTypeCode((record[groupKey] as string) || '')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(record)
    })

    // 计算每组的指标
    const results: BubbleDataPoint[] = []

    groups.forEach((records, groupName) => {
      const totalPremium = records.reduce(
        (sum, r) => sum + r.signed_premium_yuan,
        0
      )
      const totalMaturedPremium = records.reduce(
        (sum, r) => sum + r.matured_premium_yuan,
        0
      )
      const totalClaim = records.reduce(
        (sum, r) => sum + r.reported_claim_payment_yuan,
        0
      )
      const totalPolicyCount = records.reduce(
        (sum, r) => sum + r.policy_count,
        0
      )

      // 跳过无效数据
      if (totalPolicyCount === 0) return

      const averagePremium = Math.round(totalPremium / totalPolicyCount) // 单均保费取整
      const lossRatio =
        totalMaturedPremium > 0 ? (totalClaim / totalMaturedPremium) * 100 : 0

      // 获取颜色
      const colorMap =
        colorBy === 'customer' ? CUSTOMER_COLORS : BUSINESS_COLORS
      const colorKey =
        colorBy === 'customer'
          ? (groupName as string)
          : getBusinessTypeShortLabelByCode(groupName as any)
      const color = colorMap[colorKey] || colorMap['其他']

      // 客户群分类逻辑
      let segment: BubbleDataPoint['segment'] = 'normal'

      // 高价值客户：单均保费高 + 赔付率低
      if (averagePremium > 3000 && lossRatio < 60) {
        segment = 'high-value'
      }
      // 高风险客户：赔付率高
      else if (lossRatio > 80) {
        segment = 'high-risk'
      }
      // 低价值客户：单均保费低 + 赔付率高
      else if (averagePremium < 2000 && lossRatio > 70) {
        segment = 'low-value'
      }

      results.push({
        name:
          colorBy === 'business'
            ? getBusinessTypeShortLabelByCode(groupName as any)
            : (groupName as string),
        averagePremium,
        lossRatio,
        policyCount: totalPolicyCount,
        color,
        segment,
      })
    })

    return results
  }, [filteredData, colorBy])

  // 计算参考线位置（行业平均值）
  const references = useMemo(() => {
    if (bubbleData.length === 0) return { avgPremium: 0, avgLossRatio: 0 }

    const totalPolicies = bubbleData.reduce((sum, d) => sum + d.policyCount, 0)
    const weightedPremium = bubbleData.reduce(
      (sum, d) => sum + d.averagePremium * d.policyCount,
      0
    )
    const weightedLossRatio = bubbleData.reduce(
      (sum, d) => sum + d.lossRatio * d.policyCount,
      0
    )

    return {
      avgPremium: Math.round(weightedPremium / totalPolicies),
      avgLossRatio: weightedLossRatio / totalPolicies,
    }
  }, [bubbleData])

  // 客户群标签已移至组件外部

  const option: EChartsOption | null = useMemo(() => {
    if (bubbleData.length === 0) return null
    const chartData = bubbleData.map(d => ({
      value: [d.averagePremium, d.lossRatio, d.policyCount],
      name: d.name,
      itemStyle: { color: d.color },
      segment: d.segment,
      policyCount: d.policyCount,
    }))
    const opt: EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%',
        containLabel: true,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 12, fontWeight: 'bold' },
        padding: 16,
        formatter: (params: any) => {
          const data = params.data
          const segment = data.segment as BubbleDataPoint['segment']
          const segmentLabel = segmentLabels[segment]
          return `<div style="min-width: 220px;">
            <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${data.name}</div>
            <div style="margin-bottom: 4px;">
              <span style="color: #64748b;">单均保费：</span>
              <span style="font-weight: 600;">${formatNumber(data.value[0])} 元</span>
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #64748b;">赔付率：</span>
              <span style="font-weight: 600;">${formatPercent(data.value[1] / 100)}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="color: #64748b;">保单件数：</span>
              <span style="font-weight: 600;">${data.policyCount.toLocaleString()}</span>
            </div>
            <div style="padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">${segmentLabel}</span>
            </div>
          </div>`
        },
      },
      xAxis: {
        type: 'value',
        name: '单均保费（元）',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
        axisLabel: {
          formatter: (value: number) => `${(value / 1000).toFixed(1)}k`,
          fontSize: 11,
          color: '#64748b',
          fontWeight: 'bold',
          hideOverlap: true,
          rotate: 0,
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '赔付率（%）',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
        axisLabel: {
          formatter: (value: number) => `${value.toFixed(0)}%`,
          fontSize: 11,
          color: '#64748b',
          fontWeight: 'bold',
          hideOverlap: true,
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { show: false },
      },
      series: [
        {
          name: '客户群',
          type: 'scatter',
          data: chartData,
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => `${p.value[1].toFixed(0)}%`,
          },
          symbolSize: (data: number[]) => {
            const policyCount = data[2]
            const minSize = 10
            const maxSize = 40
            const minCount = Math.min(...bubbleData.map(d => d.policyCount))
            const maxCount = Math.max(...bubbleData.map(d => d.policyCount))
            if (maxCount === minCount) return (minSize + maxSize) / 2
            return (
              minSize +
              ((policyCount - minCount) / (maxCount - minCount)) *
                (maxSize - minSize)
            )
          },
          emphasis: {
            focus: 'series',
            itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 0, 0, 0.3)' },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#9ca3af', width: 1 },
            label: { fontSize: 11, color: '#6b7280', fontWeight: 'bold' },
            data: [
              {
                xAxis: references.avgPremium,
                label: { formatter: '平均单均保费', position: 'end' },
              },
              {
                yAxis: references.avgLossRatio,
                label: { formatter: '平均赔付率', position: 'end' },
              },
            ],
          },
        },
      ],
    }
    return opt
  }, [bubbleData, references])

  // 使用 BaseEChart 渲染

  if (bubbleData.length === 0) {
    return (
      <div className={`bg-white rounded-lg border p-8 ${className}`}>
        <div className="text-center text-gray-500">
          暂无数据，请先上传数据文件
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* 标题和控制 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">客户分群气泡图</h3>
            <p className="text-sm text-gray-500 mt-1">
              X轴：单均保费 | Y轴：赔付率 | 气泡大小：保单件数
            </p>
          </div>

          {/* 着色方式切换 */}
          <div className="flex gap-2">
            <button
              onClick={() => setColorBy('customer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                colorBy === 'customer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按客户类型
            </button>
            <button
              onClick={() => setColorBy('business')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                colorBy === 'business'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按业务类型
            </button>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="p-4">
        {option && <BaseEChart option={option} height={500} />}

        {/* 智能洞察 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 高价值客户群 */}
          {bubbleData.filter(d => d.segment === 'high-value').length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="font-semibold text-green-900 mb-2">
                💎 高价值客户群
              </div>
              <div className="text-sm text-green-800">
                {bubbleData
                  .filter(d => d.segment === 'high-value')
                  .map(d => d.name)
                  .join('、')}
              </div>
              <div className="text-xs text-green-700 mt-2">
                单均保费高且赔付率低，建议加大营销力度
              </div>
            </div>
          )}

          {/* 高风险客户群 */}
          {bubbleData.filter(d => d.segment === 'high-risk').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-semibold text-red-900 mb-2">
                ⚠️ 高风险客户群
              </div>
              <div className="text-sm text-red-800">
                {bubbleData
                  .filter(d => d.segment === 'high-risk')
                  .map(d => d.name)
                  .join('、')}
              </div>
              <div className="text-xs text-red-700 mt-2">
                赔付率偏高，需加强风险管控和定价策略
              </div>
            </div>
          )}

          {/* 低价值客户群 */}
          {bubbleData.filter(d => d.segment === 'low-value').length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="font-semibold text-yellow-900 mb-2">
                📉 低价值客户群
              </div>
              <div className="text-sm text-yellow-800">
                {bubbleData
                  .filter(d => d.segment === 'low-value')
                  .map(d => d.name)
                  .join('、')}
              </div>
              <div className="text-xs text-yellow-700 mt-2">
                单均保费低且赔付率高，建议优化客户结构
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
