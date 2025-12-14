'use client'

/**
 * 费用结构热力图 (P2功能)
 *
 * 功能描述：
 * - 行：三级机构（third_level_organization）
 * - 列：费用类型（费用率、单均费用等维度）
 * - 颜色深浅：费用率高低
 * - 快速识别费用管控的薄弱环节
 *
 * PRD位置：2.2.5 结构分析与对比模块 - 费用结构热力图（P1）
 */

import { useMemo } from 'react'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { InsuranceRecord } from '@/types/insurance'
import { formatPercent, formatCurrency, formatNumber } from '@/utils/format'
import {
  getMetricColor,
  getThresholdLevel,
} from '@/config/thresholds'

interface HeatmapCell {
  organization: string
  metric: string
  value: number
  displayValue: string
  color: string
  level: 'excellent' | 'outstanding' | 'healthy' | 'warning' | 'danger'
}

interface OrganizationMetrics {
  organization: string
  expenseRatio: number // 费用率 (%)
  averageExpense: number // 单均费用 (元)
  expenseAmount: number // 费用金额 (万元)
  totalPremium: number // 签单保费 (万元)
}

interface Props {
  className?: string
}

// 根据费用率获取颜色和等级（使用统一阈值体系）
function getColorByExpenseRatio(ratio: number): {
  color: string
  level: HeatmapCell['level']
} {
  const level = getThresholdLevel(ratio, 'expense_ratio')
  const color = getMetricColor(ratio, 'expense_ratio')
  return { color, level }
}

// 根据单均费用获取颜色和等级
function getColorByAverageExpense(expense: number): {
  color: string
  level: HeatmapCell['level']
} {
  const level = getThresholdLevel(expense, 'average_expense')
  const color = getMetricColor(expense, 'average_expense')
  return { color, level }
}

export function ExpenseHeatmap({ className }: Props) {
  const filteredData = useFilteredData()

  // 计算每个机构的费用指标
  const organizationMetrics = useMemo(() => {
    if (filteredData.length === 0) return []

    const orgMap = new Map<string, InsuranceRecord[]>()

    // 按机构分组
    filteredData.forEach(record => {
      const org = record.third_level_organization
      if (!orgMap.has(org)) {
        orgMap.set(org, [])
      }
      orgMap.get(org)!.push(record)
    })

    // 计算每个机构的指标
    const metrics: OrganizationMetrics[] = []

    orgMap.forEach((records, org) => {
      const totalExpense = records.reduce(
        (sum, r) => sum + r.expense_amount_yuan,
        0
      )
      const totalPremium = records.reduce(
        (sum, r) => sum + r.signed_premium_yuan,
        0
      )
      const totalPolicyCount = records.reduce(
        (sum, r) => sum + r.policy_count,
        0
      )

      const expenseRatio =
        totalPremium > 0 ? (totalExpense / totalPremium) * 100 : 0
      const averageExpense =
        totalPolicyCount > 0 ? Math.round(totalExpense / totalPolicyCount) : 0

      metrics.push({
        organization: org,
        expenseRatio,
        averageExpense,
        expenseAmount: Math.round(totalExpense / 10000), // 转万元
        totalPremium: Math.round(totalPremium / 10000), // 转万元
      })
    })

    // 按费用率降序排序，突出问题机构
    return metrics.sort((a, b) => b.expenseRatio - a.expenseRatio)
  }, [filteredData])

  // 转换为热力图数据格式
  const heatmapData = useMemo(() => {
    const cells: HeatmapCell[] = []

    organizationMetrics.forEach(org => {
      // 费用率
      const expenseRatioColor = getColorByExpenseRatio(org.expenseRatio)
      cells.push({
        organization: org.organization,
        metric: '费用率',
        value: org.expenseRatio,
        displayValue: formatPercent(org.expenseRatio / 100),
        color: expenseRatioColor.color,
        level: expenseRatioColor.level,
      })

      // 单均费用
      const avgExpenseColor = getColorByAverageExpense(org.averageExpense)
      cells.push({
        organization: org.organization,
        metric: '单均费用',
        value: org.averageExpense,
        displayValue: `${formatNumber(org.averageExpense)} 元`,
        color: avgExpenseColor.color,
        level: avgExpenseColor.level,
      })

      // 费用金额（使用相对值着色）
      const maxExpense = organizationMetrics.reduce(
        (max, m) => Math.max(max, m.expenseAmount),
        0
      )
      const expenseRatioRelative = (org.expenseAmount / maxExpense) * 100
      const expenseAmountColor = getColorByExpenseRatio(
        expenseRatioRelative * 0.3
      ) // 缩放到合理范围
      cells.push({
        organization: org.organization,
        metric: '费用金额',
        value: org.expenseAmount,
        displayValue: formatCurrency(org.expenseAmount),
        color: expenseAmountColor.color,
        level: expenseAmountColor.level,
      })
    })

    return cells
  }, [organizationMetrics])

  // 指标列表
  const metrics = ['费用率', '单均费用', '费用金额']

  // 获取指定机构和指标的单元格
  const getCell = (org: string, metric: string): HeatmapCell | undefined => {
    return heatmapData.find(
      cell => cell.organization === org && cell.metric === metric
    )
  }

  // 统计分析
  // (移除未使用的 analysis 计算)

  if (filteredData.length === 0) {
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
      {/* 标题 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">费用结构热力图</h3>
        <p className="text-sm text-gray-500 mt-1">
          行：三级机构 | 列：费用指标 | 颜色：费用水平（绿色优秀，红色警告）
        </p>
      </div>

      {/* 热力图 */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 z-10">
                机构
              </th>
              {metrics.map(metric => (
                <th
                  key={metric}
                  className="border bg-gray-50 px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]"
                >
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organizationMetrics.map((org, idx) => (
              <tr
                key={org.organization}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="border px-4 py-3 font-medium text-gray-900 sticky left-0 z-10 bg-inherit">
                  {org.organization}
                </td>
                {metrics.map(metric => {
                  const cell = getCell(org.organization, metric)
                  if (!cell) return <td key={metric} className="border"></td>

                  return (
                    <td
                      key={metric}
                      className="border px-4 py-3 text-center transition-all hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: cell.color + '20', // 20% opacity
                        borderLeftColor: cell.color,
                        borderLeftWidth: '4px',
                      }}
                      title={`${org.organization} - ${metric}: ${cell.displayValue}`}
                    >
                      <div
                        className="font-semibold"
                        style={{ color: cell.color }}
                      >
                        {cell.displayValue}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {cell.level === 'excellent' && '✓ 卓越'}
                        {cell.level === 'outstanding' && '★ 优秀'}
                        {cell.level === 'healthy' && '○ 健康'}
                        {cell.level === 'warning' && '△ 预警'}
                        {cell.level === 'danger' && '✕ 危险'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 移除建议与推荐行动，保持纯数据展示 */}
      {null}
    </div>
  )
}
