'use client'

import React, { useMemo, useState } from 'react'
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
  Line,
} from 'recharts'

import { TrendingUp, AlertTriangle, Settings } from 'lucide-react'

import { useTrendData } from '@/hooks/use-trend'
import { useAppStore } from '@/store/use-app-store'
import {
  detectAnomalies,
  type AnomalyDetectionOptions,
} from '@/lib/analytics/anomaly-detection'
import {
  describeTrend,
  fitTrend,
  type TrendFittingOptions,
} from '@/lib/analytics/trend-fitting'
import { formatNumber, formatPercent } from '@/utils/formatters'

const LOSS_RISK_THRESHOLD = 70
const LOSS_ROLLING_WINDOW = 4

type SeriesKey = 'signed' | 'matured' | 'loss'

interface BrushRange {
  startIndex?: number
  endIndex?: number
}

interface PointAnalytics {
  wowSignedRate: number | null
  yoySignedRate: number | null
  wowMaturedRate: number | null
  yoyMaturedRate: number | null
  wowLossDelta: number | null
  yoyLossDelta: number | null
  rollingLossAvg: number | null
  maturedShare: number | null
}

function calcRelativeChange(
  current: number | null,
  base: number | null
): number | null {
  if (
    current === null ||
    base === null ||
    Number.isNaN(current) ||
    Number.isNaN(base) ||
    base === 0
  ) {
    return null
  }
  return (current - base) / base
}

function calcDifference(
  current: number | null,
  base: number | null
): number | null {
  if (
    current === null ||
    base === null ||
    Number.isNaN(current) ||
    Number.isNaN(base)
  ) {
    return null
  }
  return current - base
}

function formatDelta(
  change: number | null,
  mode: 'relative' | 'absolutePercent',
  digits = 1
): string {
  if (change === null || Number.isNaN(change)) return '—'
  const sign = change > 0 ? '+' : change < 0 ? '-' : ''

  if (mode === 'relative') {
    return `${sign}${Math.abs(change * 100).toFixed(digits)}%`
  }

  return `${sign}${Math.abs(change).toFixed(digits)}pp`
}

function getDeltaClass(change: number | null, inverse = false): string {
  if (change === null || Number.isNaN(change) || change === 0) {
    return 'text-slate-500'
  }
  const isPositive = change > 0
  const isGood = inverse ? !isPositive : isPositive
  return isGood ? 'text-emerald-600' : 'text-rose-500'
}

interface CustomTooltipPayload {
  key: string
  signed_premium_10k: number
  matured_premium_10k: number
  loss_ratio: number | null
  anomalyScore?: number
  anomalyType?: string
}

interface Insight {
  id: string
  text: string
}

const TrendTooltip = React.memo(function TrendTooltip({
  active,
  payload,
  label,
  analyticsMap,
  trendMap,
  anomalyMap,
}: any & {
  analyticsMap: Map<string, PointAnalytics>
  trendMap: Map<string, number>
  anomalyMap: Map<string, { score: number; type: string }>
}) {
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

export const TrendChart = React.memo(function TrendChart() {
  const data = useTrendData()
  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)

  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    signed: true,
    matured: true,
    loss: true,
  })

  const [activeSeries, setActiveSeries] = useState<SeriesKey | null>(null)
  const [showAnomalies, setShowAnomalies] = useState(true)
  const [showTrend, setShowTrend] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const [anomalyOptions, setAnomalyOptions] = useState<AnomalyDetectionOptions>(
    {
      method: 'zscore',
      threshold: 3,
    }
  )

  const [trendOptions, setTrendOptions] = useState<TrendFittingOptions>({
    method: 'linear',
  })

  const chronological = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.week - b.week
    })
  }, [data])

  const analyticsByKey = useMemo(() => {
    const result = new Map<string, PointAnalytics>()
    if (chronological.length === 0) return result

    const weekBuckets = new Map<number, Map<number, number>>() // week -> (year -> index)

    chronological.forEach((point, index) => {
      const prev = index > 0 ? chronological[index - 1] : null

      if (!weekBuckets.has(point.week)) {
        weekBuckets.set(point.week, new Map())
      }
      const yearlyIndexMap = weekBuckets.get(point.week)!
      yearlyIndexMap.set(point.year, index)

      const yoyIndex = yearlyIndexMap.get(point.year - 1)
      const yoyPoint = yoyIndex !== undefined ? chronological[yoyIndex] : null

      const windowStart = Math.max(0, index - (LOSS_ROLLING_WINDOW - 1))
      const rollingWindow = chronological.slice(windowStart, index + 1)
      const rollingLossValues = rollingWindow
        .map(item => item.loss_ratio)
        .filter((value): value is number => value !== null)

      result.set(point.key, {
        wowSignedRate: calcRelativeChange(
          point.signed_premium_10k,
          prev?.signed_premium_10k ?? null
        ),
        yoySignedRate: calcRelativeChange(
          point.signed_premium_10k,
          yoyPoint?.signed_premium_10k ?? null
        ),
        wowMaturedRate: calcRelativeChange(
          point.matured_premium_10k,
          prev?.matured_premium_10k ?? null
        ),
        yoyMaturedRate: calcRelativeChange(
          point.matured_premium_10k,
          yoyPoint?.matured_premium_10k ?? null
        ),
        wowLossDelta: calcDifference(
          point.loss_ratio,
          prev?.loss_ratio ?? null
        ),
        yoyLossDelta: calcDifference(
          point.loss_ratio,
          yoyPoint?.loss_ratio ?? null
        ),
        rollingLossAvg:
          rollingLossValues.length > 0
            ? rollingLossValues.reduce((sum, value) => sum + value, 0) /
              rollingLossValues.length
            : null,
        maturedShare:
          point.signed_premium_10k > 0
            ? point.matured_premium_10k / point.signed_premium_10k
            : null,
      })
    })

    return result
  }, [chronological])

  const lossStats = useMemo(() => {
    if (chronological.length === 0) {
      return { average: null as number | null, max: 0 }
    }

    let sum = 0
    let count = 0
    let max = 0

    for (const point of chronological) {
      if (point.loss_ratio !== null) {
        sum += point.loss_ratio
        count += 1
        if (point.loss_ratio > max) max = point.loss_ratio
      }
    }

    return {
      average: count > 0 ? sum / count : null,
      max,
    }
  }, [chronological])

  const latestPoint =
    chronological.length > 0 ? chronological[chronological.length - 1] : null
  const latestAnalytics = latestPoint
    ? (analyticsByKey.get(latestPoint.key) ?? null)
    : null

  const anomalyAnalysis = useMemo(() => {
    if (!data || data.length === 0 || !showAnomalies) return null

    const lossRatioData = data
      .map(d => d.loss_ratio)
      .filter((value): value is number => value !== null)
    if (lossRatioData.length === 0) return null

    const anomalies = detectAnomalies(lossRatioData, anomalyOptions)
    const anomalyPoints = anomalies.map(anomaly => ({
      ...data[anomaly.index],
      anomalyScore: anomaly.score,
      anomalyType: anomaly.type,
    }))

    return { anomalies, anomalyPoints }
  }, [data, showAnomalies, anomalyOptions])

  const anomalyMap = useMemo(() => {
    const map = new Map<string, { score: number; type: string }>()
    if (!anomalyAnalysis) return map
    for (const point of anomalyAnalysis.anomalyPoints) {
      map.set(point.key, {
        score: point.anomalyScore ?? 0,
        type: point.anomalyType ?? 'unknown',
      })
    }
    return map
  }, [anomalyAnalysis])

  const trendAnalysis = useMemo(() => {
    if (!data || data.length === 0 || !showTrend) return null

    const lossRatioData = data
      .map(d => d.loss_ratio)
      .filter((value): value is number => value !== null)
    if (lossRatioData.length === 0) return null

    const trendResult = fitTrend(lossRatioData, trendOptions)
    const trendData = trendResult.trendPoints.map((point, index) => ({
      key: data[index]?.key,
      label: data[index]?.label,
      year: data[index]?.year,
      week: data[index]?.week,
      trend_loss_ratio: point.value,
    }))

    const description = describeTrend(trendResult)

    return { trendResult, trendData, description }
  }, [data, showTrend, trendOptions])

  const trendMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!trendAnalysis) return map
    for (const item of trendAnalysis.trendData) {
      if (item.key) map.set(item.key, item.trend_loss_ratio)
    }
    return map
  }, [trendAnalysis])

  const insights: Insight[] = useMemo(() => {
    if (chronological.length === 0) return []

    const candidates: Insight[] = []

    const bestSigned = chronological.reduce((acc, curr) =>
      curr.signed_premium_10k > acc.signed_premium_10k ? curr : acc
    )
    candidates.push({
      id: 'peak-signed',
      text: `签单峰值出现在 ${bestSigned.label}，达到 ${formatNumber(bestSigned.signed_premium_10k, 1)} 万`,
    })

    const riskWeeks = chronological.filter(
      point =>
        point.loss_ratio !== null && point.loss_ratio >= LOSS_RISK_THRESHOLD
    )
    if (riskWeeks.length > 0) {
      candidates.push({
        id: 'risk-weeks',
        text: `赔付率 ≥ ${formatPercent(LOSS_RISK_THRESHOLD, 0)} 的高风险周次累计 ${riskWeeks.length} 个`,
      })
    }

    if (latestPoint && latestAnalytics) {
      candidates.push({
        id: 'latest-loss',
        text: `${latestPoint.label} 赔付率为 ${formatPercent(latestPoint.loss_ratio, 1)}，环比变化 ${formatDelta(latestAnalytics.wowLossDelta, 'absolutePercent', 1)}`,
      })
    }

    if (anomalyAnalysis && anomalyAnalysis.anomalies.length > 0) {
      candidates.push({
        id: 'anomaly',
        text: `智能检测识别到 ${anomalyAnalysis.anomalies.length} 个异常波动点，请关注原因`,
      })
    }

    if (latestPoint && latestAnalytics?.maturedShare !== null && latestAnalytics) {
      candidates.push({
        id: 'maturity-share',
        text: `${latestPoint.label} 满期占比 ${formatPercent(latestAnalytics.maturedShare * 100, 1)}，衡量业务兑现能力`,
      })
    }

    return candidates.slice(0, 3)
  }, [chronological, latestPoint, latestAnalytics, anomalyAnalysis])

  const legendHandlers = useMemo(
    () => ({
      onClick: (payload: any) => {
        const name = payload?.value ?? ''
        const key: SeriesKey = name.includes('签单')
          ? 'signed'
          : name.includes('满期')
            ? 'matured'
            : 'loss'
        setVisible(v => ({ ...v, [key]: !v[key] }))
      },
      onMouseEnter: (payload: any) => {
        const name = payload?.value ?? ''
        const key: SeriesKey = name.includes('签单')
          ? 'signed'
          : name.includes('满期')
            ? 'matured'
            : 'loss'
        setActiveSeries(key)
      },
      onMouseLeave: () => setActiveSeries(null),
    }),
    []
  )

  if (!data || data.length === 0) return null

  const headlineCards = [
    {
      id: 'signed',
      label: '签单保费',
      value:
        latestPoint !== null
          ? formatNumber(latestPoint.signed_premium_10k, 1)
          : '—',
      unit: '万',
      wow: latestAnalytics?.wowSignedRate ?? null,
      yoy: latestAnalytics?.yoySignedRate ?? null,
      mode: 'relative' as const,
      inverse: false,
    },
    {
      id: 'matured',
      label: '满期保费',
      value:
        latestPoint !== null
          ? formatNumber(latestPoint.matured_premium_10k, 1)
          : '—',
      unit: '万',
      wow: latestAnalytics?.wowMaturedRate ?? null,
      yoy: latestAnalytics?.yoyMaturedRate ?? null,
      mode: 'relative' as const,
      inverse: false,
    },
    {
      id: 'loss',
      label: '赔付率',
      value:
        latestPoint !== null ? formatPercent(latestPoint.loss_ratio, 1) : '—',
      unit: '',
      wow: latestAnalytics?.wowLossDelta ?? null,
      yoy: latestAnalytics?.yoyLossDelta ?? null,
      mode: 'absolutePercent' as const,
      inverse: true,
    },
  ]

  return (
    <div
      id="trend-chart"
      className="rounded-2xl border border-slate-100 bg-white/60 p-6 shadow-lg backdrop-blur"
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">周度趋势</h3>
          <p className="text-xs text-slate-500">
            签单/满期保费（万元）与赔付率（%），配合异常检测与趋势洞察
          </p>
          {latestPoint && (
            <p className="mt-1 text-xs text-slate-500">
              最新数据：{latestPoint.label} · 签单{' '}
              {formatNumber(latestPoint.signed_premium_10k, 1)} 万 · 赔付率{' '}
              {formatPercent(latestPoint.loss_ratio, 1)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trendAnalysis && (
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-indigo-700">
                {trendAnalysis.description}
              </span>
            </div>
          )}

          {anomalyAnalysis && anomalyAnalysis.anomalies.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-700">
                检测到 {anomalyAnalysis.anomalies.length} 个异常点
              </span>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            title="分析设置"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {headlineCards.map(card => (
          <div
            key={card.id}
            className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{card.label}</span>
              {lossStats.average !== null && card.id === 'loss' && (
                <span>均值 {formatPercent(lossStats.average, 1)}</span>
              )}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-900">
                  {card.value}
                  {card.unit && <span className="text-sm"> {card.unit}</span>}
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <span>环比</span>
                  <span className={getDeltaClass(card.wow, card.inverse)}>
                    {formatDelta(card.wow, card.mode, 1)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>同比</span>
                  <span className={getDeltaClass(card.yoy, card.inverse)}>
                    {formatDelta(card.yoy, card.mode, 1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {insights.map(insight => (
            <span
              key={insight.id}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
            >
              {insight.text}
            </span>
          ))}
        </div>
      )}

      {showSettings && (
        <div className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showAnomalies}
                onChange={e => setShowAnomalies(e.target.checked)}
                className="rounded"
              />
              显示异常点
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showTrend}
                onChange={e => setShowTrend(e.target.checked)}
                className="rounded"
              />
              显示趋势线
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                异常检测方法
              </label>
              <select
                value={anomalyOptions.method}
                onChange={e =>
                  setAnomalyOptions({
                    ...anomalyOptions,
                    method: e.target.value as 'zscore' | 'iqr' | 'mad',
                  })
                }
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="zscore">Z-Score（正态分布）</option>
                <option value="iqr">IQR（四分位距）</option>
                <option value="mad">MAD（中位数绝对偏差）</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                趋势拟合方法
              </label>
              <select
                value={trendOptions.method}
                onChange={e =>
                  setTrendOptions({
                    ...trendOptions,
                    method: e.target.value as
                      | 'linear'
                      | 'movingAverage'
                      | 'exponential',
                  })
                }
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="linear">线性回归</option>
                <option value="movingAverage">移动平均</option>
                <option value="exponential">指数平滑</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 16, right: 40, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="signedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="maturedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />

            <YAxis
              yAxisId="left"
              width={70}
              tick={{ fontSize: 12 }}
              tickFormatter={value => formatNumber(value, 0)}
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={70}
              tick={{ fontSize: 12 }}
              tickFormatter={value => formatPercent(value, 0)}
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />

            {lossStats.max > LOSS_RISK_THRESHOLD && (
              <ReferenceArea
                yAxisId="right"
                y1={LOSS_RISK_THRESHOLD}
                y2={Math.max(lossStats.max, LOSS_RISK_THRESHOLD)}
                fill="#fee2e2"
                fillOpacity={0.45}
                stroke="none"
              />
            )}

            {lossStats.average !== null && (
              <ReferenceLine
                yAxisId="right"
                y={lossStats.average}
                stroke="#6366f1"
                strokeDasharray="4 4"
                label={{
                  value: '平均赔付率',
                  position: 'insideTopRight',
                  fill: '#4f46e5',
                  fontSize: 11,
                }}
              />
            )}

            <Tooltip
              content={
                <TrendTooltip
                  analyticsMap={analyticsByKey}
                  trendMap={trendMap}
                  anomalyMap={anomalyMap}
                />
              }
            />

            <Legend
              onClick={legendHandlers.onClick}
              onMouseEnter={legendHandlers.onMouseEnter}
              onMouseLeave={legendHandlers.onMouseLeave}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="signed_premium_10k"
              name="签单保费(万)"
              stroke="#1d4ed8"
              strokeWidth={activeSeries === 'signed' ? 3 : 2}
              fill="url(#signedGradient)"
              fillOpacity={
                activeSeries && activeSeries !== 'signed' ? 0.15 : 0.35
              }
              isAnimationActive={false}
              hide={!visible.signed}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="matured_premium_10k"
              name="满期保费(万)"
              stroke="#0ea5e9"
              strokeWidth={activeSeries === 'matured' ? 3 : 2}
              fill="url(#maturedGradient)"
              fillOpacity={
                activeSeries && activeSeries !== 'matured' ? 0.15 : 0.35
              }
              isAnimationActive={false}
              hide={!visible.matured}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="loss_ratio"
              name="赔付率(%)"
              stroke="#ef4444"
              strokeWidth={activeSeries === 'loss' ? 3 : 2}
              strokeOpacity={activeSeries && activeSeries !== 'loss' ? 0.35 : 1}
              dot={false}
              isAnimationActive={false}
              hide={!visible.loss}
            />

            {trendAnalysis && showTrend && (
              <Line
                yAxisId="right"
                type="monotone"
                data={trendAnalysis.trendData}
                dataKey="trend_loss_ratio"
                name="趋势线"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}

            {anomalyAnalysis && showAnomalies && (
              <Scatter
                yAxisId="right"
                data={anomalyAnalysis.anomalyPoints}
                dataKey="loss_ratio"
                fill="#f97316"
                name="异常点"
              >
                {anomalyAnalysis.anomalyPoints.map((entry, index) => (
                  <circle
                    key={`anomaly-${index}`}
                    r={6}
                    fill={entry.anomalyType === 'high' ? '#ef4444' : '#f59e0b'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            )}

            <Brush
              dataKey="label"
              height={20}
              stroke="#94a3b8"
              travellerWidth={8}
              onChange={(range?: BrushRange) => {
                const start = Math.max(0, Number(range?.startIndex ?? 0))
                const end = Math.min(
                  data.length - 1,
                  Number(range?.endIndex ?? data.length - 1)
                )
                if (end < start) return
                if (filters.years && filters.years.length === 1) {
                  const weeks = data.slice(start, end + 1).map(d => d.week)
                  const minW = weeks.reduce(
                    (min, week) => Math.min(min, week),
                    Infinity
                  )
                  const maxW = weeks.reduce(
                    (max, week) => Math.max(max, week),
                    -Infinity
                  )
                  if (start === 0 && end === data.length - 1) {
                    updateFilters({ trendModeWeeks: [], weeks: [] })
                  } else {
                    const rangeWeeks: number[] = []
                    for (let week = minW; week <= maxW; week++) {
                      rangeWeeks.push(week)
                    }
                    updateFilters({
                      trendModeWeeks: rangeWeeks,
                      weeks: rangeWeeks,
                    })
                  }
                }
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
