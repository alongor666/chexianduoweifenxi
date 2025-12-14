'use client'

import { Building2, PieChart as PieChartIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import {
  useOrganizationComparison,
  useInsuranceTypeStructure,
} from '@/hooks/use-comparison-analysis'
import { formatNumber, formatPercent, formatCurrency } from '@/utils/format'

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
]

/**
 * 机构对比分析组件
 */
export function OrganizationComparisonChart() {
  const comparisons = useOrganizationComparison()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 准备图表数据
  const chartData = comparisons
    .slice(0, 50)
    .map(item => ({
      name: item.organization,
      满期保费: item.kpi.matured_premium,
      签单保费: item.kpi.signed_premium,
      边际贡献率: item.kpi.contribution_margin_ratio || 0,
    }))
    // 从最差到最好排序（以边际贡献率为排序依据，越低越差）
    .sort((a, b) => a.边际贡献率 - b.边际贡献率)
    .slice(0, 10)

  // 初始化和更新图表
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0 || comparisons.length === 0)
      return

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const chart = chartInstanceRef.current

    // 提取数据
    const organizations = chartData.map(d => d.name)
    const premiumData = chartData.map(d => d.满期保费)
    const marginData = chartData.map(d => d.边际贡献率)

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '5%',
        right: '10%',
        top: '12%',
        bottom: '15%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155',
          fontSize: 12,
          fontWeight: 'bold',
        },
        padding: 12,
      },
      legend: {
        data: ['满期保费(万元)', '边际贡献率(%)'],
        top: '2%',
        textStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      },
      xAxis: {
        type: 'category',
        data: organizations,
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          fontWeight: 'bold',
          rotate: 0,
          interval: 0,
          hideOverlap: true,
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '满期保费(万元)',
          position: 'left',
          nameTextStyle: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 'bold',
          },
          axisLabel: {
            fontSize: 11,
            color: '#64748b',
            fontWeight: 'bold',
          },
          axisLine: {
            lineStyle: {
              color: '#cbd5e1',
            },
          },
          splitLine: {
            show: false,
          },
        },
        {
          type: 'value',
          name: '边际贡献率(%)',
          position: 'right',
          nameTextStyle: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 'bold',
          },
          axisLabel: {
            fontSize: 11,
            color: '#64748b',
            fontWeight: 'bold',
          },
          axisLine: {
            lineStyle: {
              color: '#cbd5e1',
            },
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: '满期保费(万元)',
          type: 'bar',
          yAxisIndex: 0,
          data: premiumData,
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => formatNumber(p.value, 0),
          },
          itemStyle: {
            color: '#3b82f6',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
        {
          name: '边际贡献率(%)',
          type: 'bar',
          yAxisIndex: 1,
          data: marginData,
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => `${(p.value as number).toFixed(1)}%`,
          },
          itemStyle: {
            color: '#10b981',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          markLine: {
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
              color: '#10b981',
              width: 2,
            },
            label: {
              show: true,
              position: 'end',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#10b981',
              formatter: '目标 15%',
            },
            data: [{ yAxis: 15 }],
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

  if (comparisons.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">机构对比分析</h3>
        </div>
        <p className="text-xs text-slate-500">Top {chartData.length} 机构</p>
      </div>

      {/* 对比表格 */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-2 text-left font-medium text-slate-700">排名</th>
              <th className="p-2 text-left font-medium text-slate-700">机构</th>
              <th className="p-2 text-right font-medium text-slate-700">
                满期保费(万元)
              </th>
              <th className="p-2 text-right font-medium text-slate-700">
                边际贡献率
              </th>
              <th className="p-2 text-right font-medium text-slate-700">
                赔付率
              </th>
              <th className="p-2 text-right font-medium text-slate-700">
                保单数
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.slice(0, 10).map((item, index) => (
              <tr
                key={item.organization}
                className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
              >
                <td className="p-2 font-semibold text-slate-600">
                  {index + 1}
                </td>
                <td className="p-2 font-medium text-slate-800">
                  {item.organization}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatCurrency(item.kpi.matured_premium)}
                </td>
                <td
                  className={`p-2 text-right font-semibold tabular-nums ${
                    (item.kpi.contribution_margin_ratio || 0) > 15
                      ? 'text-green-600'
                      : (item.kpi.contribution_margin_ratio || 0) > 10
                        ? 'text-blue-600'
                        : 'text-orange-600'
                  }`}
                >
                  {formatPercent(item.kpi.contribution_margin_ratio)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatPercent(item.kpi.loss_ratio)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatNumber(item.kpi.policy_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 对比图表 */}
      <div ref={chartRef} className="h-80" />
    </div>
  )
}

/**
 * 险种结构分析组件
 */
export function InsuranceTypeStructureChart() {
  const structures = useInsuranceTypeStructure()
  const pieChartRef = useRef<HTMLDivElement>(null)
  const pieChartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 饼图数据
  const pieData = structures
    .map(item => ({
      name: item.insuranceType,
      value: item.signedPremium,
      percentage: item.percentage,
    }))
    // 从最差到最好排序（占比越低视为越差）
    .sort((a, b) => a.percentage - b.percentage)

  // 初始化和更新饼图
  useEffect(() => {
    if (!pieChartRef.current || pieData.length === 0 || structures.length === 0)
      return

    // 初始化 ECharts 实例
    if (!pieChartInstanceRef.current) {
      pieChartInstanceRef.current = echarts.init(
        pieChartRef.current,
        undefined,
        {
          renderer: 'canvas',
        }
      )
    }

    const chart = pieChartInstanceRef.current

    // 准备数据
    const chartData = pieData.map((item, index) => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: COLORS[index % COLORS.length],
      },
    }))

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155',
          fontSize: 12,
          fontWeight: 'bold',
        },
        padding: 12,
        formatter: (params: any) => {
          return `<div style="min-width: 180px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div>
              <span style="color: #64748b;">签单保费：</span>
              <span style="font-weight: 600;">${formatCurrency(params.value)}</span>
            </div>
            <div>
              <span style="color: #64748b;">占比：</span>
              <span style="font-weight: 600; color: #3b82f6;">${params.percent.toFixed(1)}%</span>
            </div>
          </div>`
        },
      },
      series: [
        {
          name: '险种结构',
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: chartData,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            color: '#334155',
            fontWeight: 'bold',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      ],
    }

    chart.setOption(option, true)

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })

    if (pieChartRef.current) {
      resizeObserver.observe(pieChartRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [pieData])

  // 清理
  useEffect(() => {
    return () => {
      if (pieChartInstanceRef.current) {
        pieChartInstanceRef.current.dispose()
        pieChartInstanceRef.current = null
      }
    }
  }, [])

  if (structures.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-lg backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-800">险种结构分析</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 饼图 */}
        <div ref={pieChartRef} className="h-64" />

        {/* 详细数据 */}
        <div className="space-y-3">
          {structures.map((item, index) => (
            <div
              key={item.insuranceType}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-slate-800">
                    {item.insuranceType}
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-slate-500">签单保费</div>
                  <div className="font-semibold text-slate-700">
                    {formatCurrency(item.signedPremium)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">保单数</div>
                  <div className="font-semibold text-slate-700">
                    {formatNumber(item.policyCount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">件均保费</div>
                  <div className="font-semibold text-slate-700">
                    {formatNumber(item.avgPremiumPerPolicy)}元
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 综合对比分析面板
 */
export function ComparisonAnalysisPanel() {
  return (
    <div className="space-y-6">
      <OrganizationComparisonChart />
      <InsuranceTypeStructureChart />
    </div>
  )
}
