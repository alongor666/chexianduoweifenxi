'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
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

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 初始化和更新图表
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const chart = chartInstanceRef.current

    // 提取数据
    const labels = chartData.map(d => d.label)
    const actualData = chartData.map(d => d.actual)
    const fittedData = chartData.map(d => d.fitted)
    const predictedData = chartData.map(d => d.predicted)

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '10%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155',
          fontSize: 12,
        },
        padding: 12,
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const label = params[0].name

          let html = `<div style="min-width: 180px;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">${label}</div>`

          params.forEach((param: any) => {
            if (param.value !== null) {
              html += `<div style="margin-bottom: 2px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 6px;"></span>
                <span style="color: #64748b;">${param.seriesName}：</span>
                <span style="font-weight: 600;">${formatNumber(param.value, 1)} 万元</span>
              </div>`
            }
          })

          html += `</div>`
          return html
        },
      },
      legend: {
        data: ['实际', '拟合', '预测'],
        top: '2%',
        textStyle: {
          fontSize: 12,
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '单位：万元',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
          },
        },
      },
      series: [
        {
          name: '实际',
          type: 'line',
          data: actualData,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: '#2563eb',
            width: 2,
          },
          itemStyle: {
            color: '#2563eb',
          },
        },
        {
          name: '拟合',
          type: 'line',
          data: fittedData,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: '#10b981',
            width: 2,
            type: 'dashed',
          },
          itemStyle: {
            color: '#10b981',
          },
        },
        {
          name: '预测',
          type: 'line',
          data: predictedData,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: '#f59e0b',
            width: 2,
          },
          itemStyle: {
            color: '#f59e0b',
          },
        },
      ],
    }

    chart.setOption(option, true)

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [chartData])

  // 清理
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [])

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
        <div ref={chartRef} className="h-72 w-full" />
        <div className="mt-2 text-xs text-slate-500">
          注：预测基于所选筛选条件下的历史趋势，不构成保证；建议与目标管理和周趋势分析配合使用。
        </div>
      </div>
    </div>
  )
}
