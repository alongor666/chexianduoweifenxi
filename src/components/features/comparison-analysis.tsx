'use client'

import { Building2, PieChart as PieChartIcon } from 'lucide-react'
import {
  useOrganizationComparison,
  useInsuranceTypeStructure,
} from '@/hooks/use-comparison-analysis'
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatters'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

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

  if (comparisons.length === 0) {
    return null
  }

  // 准备图表数据
  const chartData = comparisons.slice(0, 10).map(item => ({
    name: item.organization,
    满期保费: item.kpi.matured_premium,
    签单保费: item.kpi.signed_premium,
    边际贡献率: item.kpi.contribution_margin_ratio || 0,
  }))

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
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="满期保费"
              fill="#3b82f6"
              name="满期保费(万元)"
            />
            <Bar
              yAxisId="right"
              dataKey="边际贡献率"
              fill="#10b981"
              name="边际贡献率(%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * 险种结构分析组件
 */
export function InsuranceTypeStructureChart() {
  const structures = useInsuranceTypeStructure()

  if (structures.length === 0) {
    return null
  }

  // 饼图数据
  const pieData = structures.map(item => ({
    name: item.insuranceType,
    value: item.signedPremium,
    percentage: item.percentage,
  }))

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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) =>
                  `${name} ${(percentage as number).toFixed(1)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

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
