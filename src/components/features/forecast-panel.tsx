'use client'

import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { Settings } from 'lucide-react'

import { useTrendData } from '@/hooks/use-trend'
import {
  fitTrend,
  type TrendFittingOptions,
} from '@/lib/analytics/trend-fitting'
import { formatNumber } from '@/utils/format'

interface ForecastPanelProps {
  className?: string
}

export function ForecastPanel({ className }: ForecastPanelProps) {
  const series = useTrendData()

  const [options, setOptions] = useState<TrendFittingOptions>({
    method: 'linear',
    predict: true,
    predictSteps: 8,
    window: 4,
    alpha: 0.4,
  })

  // 仅使用签单保费进行预测（单位：万元）
  const actual = useMemo(
    () => series.map(p => p.signed_premium_10k ?? 0),
    [series]
  )

  const result = useMemo(() => fitTrend(actual, options), [actual, options])

  const chartData = useMemo(() => {
    const data: Array<{
      index: number
      label: string
      actual: number | null
      fitted: number | null
      predicted: number | null
    }> = []

    const totalLength =
      actual.length + (options.predict ? (options.predictSteps ?? 0) : 0)

    for (let i = 0; i < totalLength; i++) {
      const isHistorical = i < actual.length
      const label = isHistorical
        ? (series[i]?.label ?? `第${i + 1}周`)
        : `预测第${i - actual.length + 1}周`

      const fittedPoint = result.trendPoints[i] ?? null
      const predictedPoint = result.predictedPoints?.[i - actual.length] ?? null

      data.push({
        index: i,
        label,
        actual: isHistorical ? actual[i] : null,
        fitted: fittedPoint ? fittedPoint.value : null,
        predicted: predictedPoint ? predictedPoint.value : null,
      })
    }

    return data
  }, [series, actual, result, options.predict, options.predictSteps])

  const r2 = result.rSquared
  const slope = result.coefficients?.slope ?? 0
  const direction = result.direction

  const summaryText = useMemo(() => {
    const dirText =
      direction === 'increasing'
        ? '上升'
        : direction === 'decreasing'
          ? '下降'
          : '平稳'
    const slopeText = slope >= 0 ? `+${slope.toFixed(2)}` : slope.toFixed(2)
    return `趋势：${dirText} | 斜率：${slopeText} | 拟合优度R²：${r2.toFixed(3)}`
  }, [direction, slope, r2])

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            预测分析（签单保费）
          </h2>
          <p className="text-xs text-slate-600">
            基于历史周度数据进行趋势拟合与向后预测，仅供参考
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() =>
              setOptions(prev => ({
                ...prev,
                method:
                  prev.method === 'linear'
                    ? 'movingAverage'
                    : prev.method === 'movingAverage'
                      ? 'exponential'
                      : 'linear',
              }))
            }
            title="切换拟合方法：线性/移动平均/指数平滑"
          >
            <Settings className="h-3.5 w-3.5" />
            {options.method === 'linear'
              ? '线性'
              : options.method === 'movingAverage'
                ? '移动平均'
                : '指数平滑'}
          </button>
          <select
            className="rounded-md border bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
            value={options.predictSteps}
            onChange={e =>
              setOptions(prev => ({
                ...prev,
                predictSteps: Number(e.target.value),
              }))
            }
            title="预测步数"
          >
            {[4, 8, 12, 16].map(n => (
              <option key={n} value={n}>
                {n}周
              </option>
            ))}
          </select>
          {options.method === 'movingAverage' && (
            <select
              className="rounded-md border bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
              value={options.window ?? 4}
              onChange={e =>
                setOptions(prev => ({
                  ...prev,
                  window: Number(e.target.value),
                }))
              }
              title="移动平均窗口大小"
            >
              {[3, 4, 5, 6].map(n => (
                <option key={n} value={n}>
                  {n}点
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-xs text-slate-600">{summaryText}</div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: '单位：万元',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'actual') return [formatNumber(value, 1), '实际']
                  if (name === 'fitted') return [formatNumber(value, 1), '拟合']
                  if (name === 'predicted')
                    return [formatNumber(value, 1), '预测']
                  return [value, name]
                }}
              />
              <Legend verticalAlign="top" height={24} />

              <Line
                type="monotone"
                dataKey="actual"
                name="实际"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fitted"
                name="拟合"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="预测"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          注：预测基于所选筛选条件下的历史趋势，不构成保证；建议与目标管理和周趋势分析配合使用。
        </div>
      </div>
    </div>
  )
}
