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
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { InsuranceRecord } from '@/types/insurance'
import { formatNumber, formatPercent } from '@/utils/format'

// 颜色配置 - 按客户类型
const CUSTOMER_COLORS: Record<string, string> = {
  个人客户: '#3b82f6', // 蓝色
  企业客户: '#10b981', // 绿色
  政府机关: '#f59e0b', // 橙色
  其他: '#6b7280', // 灰色
}

// 颜色配置 - 按业务类型
const BUSINESS_COLORS: Record<string, string> = {
  非营业客车新车: '#3b82f6',
  非营业客车旧车非过户: '#10b981',
  非营业客车旧车过户车: '#f59e0b',
  营业货车新车: '#ef4444',
  营业货车旧车: '#8b5cf6',
  网约车: '#ec4899',
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
      const key = record[groupKey] || '其他'
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
      const color = colorMap[groupName] || colorMap['其他']

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
        name: groupName,
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

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null

    const data = payload[0].payload as BubbleDataPoint

    const segmentLabels = {
      'high-value': '💎 高价值客户',
      'high-risk': '⚠️ 高风险客户',
      'low-value': '📉 低价值客户',
      normal: '✓ 正常客户',
    }

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <div className="font-semibold text-lg mb-2">{data.name}</div>
        <div className="space-y-1 text-sm">
          <div>
            单均保费:{' '}
            <span className="font-medium">{`${formatNumber(data.averagePremium)} 元`}</span>
          </div>
          <div>
            赔付率:{' '}
            <span className="font-medium">
              {formatPercent(data.lossRatio / 100)}
            </span>
          </div>
          <div>
            保单件数:{' '}
            <span className="font-medium">
              {data.policyCount.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t mt-2">
            <span className="text-gray-600">{segmentLabels[data.segment]}</span>
          </div>
        </div>
      </div>
    )
  }

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
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 80, bottom: 60, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              type="number"
              dataKey="averagePremium"
              name="单均保费"
              unit="元"
              tickFormatter={value => `${(value / 1000).toFixed(1)}k`}
              label={{
                value: '单均保费（元）',
                position: 'bottom',
                offset: 40,
                style: { fontSize: 14, fontWeight: 500 },
              }}
            />

            <YAxis
              type="number"
              dataKey="lossRatio"
              name="赔付率"
              unit="%"
              tickFormatter={value => `${value.toFixed(0)}%`}
              label={{
                value: '赔付率（%）',
                angle: -90,
                position: 'left',
                offset: 50,
                style: { fontSize: 14, fontWeight: 500 },
              }}
            />

            <ZAxis
              type="number"
              dataKey="policyCount"
              range={[100, 2000]}
              name="保单件数"
            />

            {/* 参考线 - 行业平均 */}
            <ReferenceLine
              x={references.avgPremium}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{
                value: '平均单均保费',
                position: 'top',
                fill: '#6b7280',
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={references.avgLossRatio}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{
                value: '平均赔付率',
                position: 'right',
                fill: '#6b7280',
                fontSize: 12,
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: string) => value}
            />

            <Scatter name="客户群" data={bubbleData} fill="#8884d8">
              {bubbleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

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
