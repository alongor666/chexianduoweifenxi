/**
 * 趋势图表自定义工具提示组件
 *
 * 为趋势图表提供丰富的数据展示，包括：
 * - 基础指标：签单保费、满期保费、赔付率
 * - 趋势线数值
 * - 分析指标：环比、同比、滑动平均
 * - 异常检测信息
 */

import React from 'react'
import type { TooltipProps } from 'recharts'
import { formatNumber, formatPercent } from '@/utils/formatters'
import type { CustomTooltipPayload, PointAnalytics } from '../types'
import { formatDelta, getDeltaClass } from '../utils'
import { LOSS_RISK_THRESHOLD } from '../constants'

/**
 * TrendTooltip 组件属性
 * 继承自 recharts 的 TooltipProps，并扩展自定义属性
 */
interface TrendTooltipProps {
  /** 是否激活 */
  active?: boolean
  /** 数据载荷 */
  payload?: Array<{ payload: CustomTooltipPayload }>
  /** 标签文本 */
  label?: string
  /** 数据点分析指标映射表 */
  analyticsMap: Map<string, PointAnalytics>
  /** 趋势线数值映射表 */
  trendMap: Map<string, number>
  /** 异常检测结果映射表 */
  anomalyMap: Map<string, { score: number; type: string }>
}

/**
 * 趋势图表自定义提示框组件
 *
 * 当鼠标悬停在图表数据点上时，显示该数据点的详细信息，包括：
 * - 时间标签
 * - 基础业务指标（签单、满期、赔付率）
 * - 趋势分析数据
 * - 环比、同比变化
 * - 滑动平均值
 * - 异常检测结果（如有）
 */
export const TrendTooltip = React.memo(function TrendTooltip({
  active,
  payload,
  label,
  analyticsMap,
  trendMap,
  anomalyMap,
}: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const base = payload[0]?.payload as CustomTooltipPayload | undefined
  if (!base) return null

  const analytics = analyticsMap.get(base.key)
  const trend = base.key ? trendMap.get(base.key) : undefined
  const anomaly = base.key ? anomalyMap.get(base.key) : undefined

  return (
    <div className="w-64 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {anomaly && (
          <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            异常 {anomaly.type === 'high' ? '高波动' : '低波动'}
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>签单保费</span>
          <span className="font-semibold text-slate-800">
            {formatNumber(base.signed_premium_10k, 1)} 万
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>满期保费</span>
          <span className="font-semibold text-slate-800">
            {formatNumber(base.matured_premium_10k, 1)} 万
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>赔付率</span>
          <span
            className={`font-semibold ${
              base.loss_ratio !== null && base.loss_ratio >= LOSS_RISK_THRESHOLD
                ? 'text-rose-500'
                : 'text-slate-800'
            }`}
          >
            {formatPercent(base.loss_ratio, 2)}
          </span>
        </div>

        {trend !== undefined && (
          <div className="flex items-center justify-between">
            <span>趋势线</span>
            <span className="text-slate-700">{formatPercent(trend, 2)}</span>
          </div>
        )}

        {analytics && (
          <>
            <div className="flex items-center justify-between">
              <span>环比签单</span>
              <span className={getDeltaClass(analytics.wowSignedRate, false)}>
                {formatDelta(analytics.wowSignedRate, 'relative', 1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>环比赔付率</span>
              <span className={getDeltaClass(analytics.wowLossDelta, true)}>
                {formatDelta(analytics.wowLossDelta, 'absolutePercent', 1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>4周滑动平均</span>
              <span className="text-slate-700">
                {analytics.rollingLossAvg !== null
                  ? formatPercent(analytics.rollingLossAvg, 2)
                  : '—'}
              </span>
            </div>
          </>
        )}

        {anomaly && (
          <div className="flex items-center justify-between">
            <span>异常评分</span>
            <span className="text-orange-700">{anomaly.score.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )
})

TrendTooltip.displayName = 'TrendTooltip'
