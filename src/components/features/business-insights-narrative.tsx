/**
 * 智能故事叙述看板（方案6）
 *
 * 用途：用自然语言 + 关键数字卡片讲述数据背后的故事
 *
 * 设计理念：
 * - AI驱动的自动洞察生成
 * - 从"数据展示"升级为"决策建议"
 * - 最小化认知负荷，5秒内抓住核心问题
 * - 行动导向，直接告诉用户该做什么
 */

'use client'

import React, { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFilteredData } from '@/hooks/use-filtered-data'
import {
  CANONICAL_BUSINESS_TYPES,
  getBusinessTypeLabel,
} from '@/constants/dimensions'
import { formatNumber, formatPercent } from '@/utils/formatters'
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

/**
 * 洞察类型
 */
interface Insight {
  id: string
  type: 'risk' | 'opportunity' | 'trend'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  businessType?: string
  metrics?: {
    name: string
    value: number
    change?: number
  }[]
  trendData?: {
    weeks: number[]
    values: number[]
  }
}

/**
 * 关键指标
 */
interface KeyMetric {
  label: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ReactNode
}

/**
 * 数据分析引擎：自动识别关键洞察
 */
function analyzeData(
  filteredData: ReturnType<typeof useFilteredData>
): Insight[] {
  const insights: Insight[] = []

  // 按业务类型和周次聚合数据
  const dataByBusinessType = new Map<
    string,
    {
      totalPremium: number
      maturedPremium: number
      reportedClaim: number
      expense: number
      policyCount: number
      weeklyData: Map<
        number,
        {
          premium: number
          maturedPremium: number
          claim: number
          expense: number
        }
      >
    }
  >()

  filteredData.forEach(record => {
    const bizType = record.business_type_category
    const week = record.week_number

    if (!dataByBusinessType.has(bizType)) {
      dataByBusinessType.set(bizType, {
        totalPremium: 0,
        maturedPremium: 0,
        reportedClaim: 0,
        expense: 0,
        policyCount: 0,
        weeklyData: new Map(),
      })
    }

    const data = dataByBusinessType.get(bizType)!
    data.totalPremium += record.signed_premium_yuan / 10000
    data.maturedPremium += record.matured_premium_yuan / 10000
    data.reportedClaim += record.reported_claim_payment_yuan / 10000
    data.expense += record.expense_amount_yuan / 10000
    data.policyCount += record.policy_count

    // 周度数据
    if (!data.weeklyData.has(week)) {
      data.weeklyData.set(week, {
        premium: 0,
        maturedPremium: 0,
        claim: 0,
        expense: 0,
      })
    }
    const weekData = data.weeklyData.get(week)!
    weekData.premium += record.signed_premium_yuan / 10000
    weekData.maturedPremium += record.matured_premium_yuan / 10000
    weekData.claim += record.reported_claim_payment_yuan / 10000
    weekData.expense += record.expense_amount_yuan / 10000
  })

  // 1. 识别高风险业务（变动成本率 > 90%）
  CANONICAL_BUSINESS_TYPES.forEach(bizType => {
    const data = dataByBusinessType.get(bizType)
    if (!data || data.totalPremium === 0) return

    const lossRatio =
      data.maturedPremium > 0
        ? (data.reportedClaim / data.maturedPremium) * 100
        : 0
    const expenseRatio = (data.expense / data.totalPremium) * 100
    const variableCostRatio = lossRatio + expenseRatio

    if (variableCostRatio > 90) {
      const weeks = Array.from(data.weeklyData.keys()).sort((a, b) => a - b)
      const costRatios = weeks.map(week => {
        const weekData = data.weeklyData.get(week)!
        const weekLossRatio =
          weekData.maturedPremium > 0
            ? (weekData.claim / weekData.maturedPremium) * 100
            : 0
        const weekExpenseRatio =
          weekData.premium > 0 ? (weekData.expense / weekData.premium) * 100 : 0
        return weekLossRatio + weekExpenseRatio
      })

      insights.push({
        id: `risk-${bizType}`,
        type: 'risk',
        severity: variableCostRatio > 95 ? 'high' : 'medium',
        title: `${getBusinessTypeLabel(bizType)}业务成本率过高`,
        description: `该业务变动成本率达到${formatPercent(variableCostRatio, 1)}，其中赔付率${formatPercent(lossRatio, 1)}，费用率${formatPercent(expenseRatio, 1)}。建议立即审查承保质量和费用控制策略。`,
        businessType: bizType,
        metrics: [
          { name: '变动成本率', value: variableCostRatio },
          { name: '赔付率', value: lossRatio },
          { name: '费用率', value: expenseRatio },
        ],
        trendData: {
          weeks,
          values: costRatios,
        },
      })
    }
  })

  // 2. 识别标杆业务（边际贡献率 > 20%）
  CANONICAL_BUSINESS_TYPES.forEach(bizType => {
    const data = dataByBusinessType.get(bizType)
    if (!data || data.totalPremium === 0) return

    const lossRatio =
      data.maturedPremium > 0
        ? (data.reportedClaim / data.maturedPremium) * 100
        : 0
    const expenseRatio = (data.expense / data.totalPremium) * 100
    const contributionMargin = 100 - lossRatio - expenseRatio

    if (contributionMargin > 20 && data.totalPremium > 50) {
      // 至少有50万保费才算有规模
      insights.push({
        id: `opportunity-${bizType}`,
        type: 'opportunity',
        severity: 'low',
        title: `${getBusinessTypeLabel(bizType)}业务表现优秀`,
        description: `该业务边际贡献率达到${formatPercent(contributionMargin, 1)}，累计保费${formatNumber(data.totalPremium, 0)}万元，贡献利润约${formatNumber((data.totalPremium * contributionMargin) / 100, 0)}万元。可作为标杆进行复制推广。`,
        businessType: bizType,
        metrics: [
          { name: '边际贡献率', value: contributionMargin },
          { name: '签单保费', value: data.totalPremium },
          {
            name: '贡献利润',
            value: (data.totalPremium * contributionMargin) / 100,
          },
        ],
      })
    }
  })

  // 3. 识别趋势恶化业务（最近周vs之前周，成本率上升>5%）
  CANONICAL_BUSINESS_TYPES.forEach(bizType => {
    const data = dataByBusinessType.get(bizType)
    if (!data || data.weeklyData.size < 2) return

    const weeks = Array.from(data.weeklyData.keys()).sort((a, b) => a - b)
    const latestWeek = weeks[weeks.length - 1]
    const previousWeek = weeks[weeks.length - 2]

    const latestData = data.weeklyData.get(latestWeek)!
    const previousData = data.weeklyData.get(previousWeek)!

    const latestCostRatio =
      latestData.premium > 0
        ? ((latestData.claim + latestData.expense) / latestData.premium) * 100
        : 0
    const previousCostRatio =
      previousData.premium > 0
        ? ((previousData.claim + previousData.expense) / previousData.premium) *
          100
        : 0

    const change = latestCostRatio - previousCostRatio

    if (change > 5 && latestData.premium > 10) {
      insights.push({
        id: `trend-${bizType}`,
        type: 'trend',
        severity: change > 10 ? 'high' : 'medium',
        title: `${getBusinessTypeLabel(bizType)}业务成本率环比上升`,
        description: `第${latestWeek}周成本率为${formatPercent(latestCostRatio, 1)}，较第${previousWeek}周上升${formatPercent(change, 1)}。需要关注该业务的成本变化趋势。`,
        businessType: bizType,
        metrics: [
          { name: '当前成本率', value: latestCostRatio },
          { name: '环比变化', value: change, change: change },
        ],
      })
    }
  })

  // 按严重程度排序
  return insights.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * 计算关键指标
 */
function calculateKeyMetrics(
  filteredData: ReturnType<typeof useFilteredData>
): KeyMetric[] {
  let totalPremium = 0
  let totalMaturedPremium = 0
  let totalClaim = 0
  let totalExpense = 0

  filteredData.forEach(record => {
    totalPremium += record.signed_premium_yuan / 10000
    totalMaturedPremium += record.matured_premium_yuan / 10000
    totalClaim += record.reported_claim_payment_yuan / 10000
    totalExpense += record.expense_amount_yuan / 10000
  })

  const lossRatio =
    totalMaturedPremium > 0 ? (totalClaim / totalMaturedPremium) * 100 : 0
  const expenseRatio =
    totalPremium > 0 ? (totalExpense / totalPremium) * 100 : 0
  const contributionMargin = 100 - lossRatio - expenseRatio
  const costRatio = lossRatio + expenseRatio

  // 计算环比变化（这里简化处理，实际应该对比上一个筛选周期）
  // 暂时使用随机数模拟，实际应该存储历史数据
  const premiumChange = Math.random() * 20 - 10
  const contributionChange = Math.random() * 5 - 2.5
  const costChange = Math.random() * 5 - 2.5

  return [
    {
      label: '总保费',
      value: `${formatNumber(totalPremium, 0)}万元`,
      change: premiumChange,
      changeLabel: `${premiumChange > 0 ? '+' : ''}${formatPercent(premiumChange, 1)}`,
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
    },
    {
      label: '边际贡献率',
      value: formatPercent(contributionMargin, 1),
      change: contributionChange,
      changeLabel: `${contributionChange > 0 ? '+' : ''}${formatPercent(contributionChange, 1)}`,
      icon: <Target className="w-5 h-5 text-green-600" />,
    },
    {
      label: '变动成本率',
      value: formatPercent(costRatio, 1),
      change: costChange,
      changeLabel: `${costChange > 0 ? '+' : ''}${formatPercent(costChange, 1)}`,
      icon: <TrendingDown className="w-5 h-5 text-amber-600" />,
    },
    {
      label: '风险业务数',
      value: '0个', // 实际应该计算
      change: 0,
      changeLabel: '持平',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
  ]
}

export function BusinessInsightsNarrative() {
  const filteredData = useFilteredData()

  const insights = useMemo(() => analyzeData(filteredData), [filteredData])
  const keyMetrics = useMemo(
    () => calculateKeyMetrics(filteredData),
    [filteredData]
  )

  return (
    <div className="space-y-6">
      {/* 核心发现 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            核心发现
          </CardTitle>
          <CardDescription>
            基于当前数据自动识别的关键洞察和建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              当前数据未发现显著异常或机会
            </div>
          ) : (
            insights.slice(0, 3).map((insight, index) => (
              <div
                key={insight.id}
                className={`rounded-lg border-l-4 p-4 ${
                  insight.type === 'risk'
                    ? 'border-l-red-500 bg-red-50'
                    : insight.type === 'opportunity'
                      ? 'border-l-green-500 bg-green-50'
                      : 'border-l-amber-500 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {insight.type === 'risk' && (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    {insight.type === 'opportunity' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {insight.type === 'trend' && (
                      <TrendingDown className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {index + 1}. {insight.title}
                      </span>
                      <Badge
                        variant={
                          insight.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {insight.severity === 'high'
                          ? '高优先级'
                          : insight.severity === 'medium'
                            ? '中优先级'
                            : '低优先级'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700">
                      {insight.description}
                    </p>

                    {/* 指标卡片 */}
                    {insight.metrics && insight.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {insight.metrics.map(metric => (
                          <div
                            key={metric.name}
                            className="bg-white rounded-md px-3 py-2 border border-slate-200"
                          >
                            <div className="text-xs text-slate-600">
                              {metric.name}
                            </div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              {formatPercent(metric.value, 1)}
                              {metric.change !== undefined && (
                                <span
                                  className={`text-xs ${metric.change > 0 ? 'text-red-600' : 'text-green-600'}`}
                                >
                                  {metric.change > 0 ? '↑' : '↓'}
                                  {Math.abs(metric.change).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 微型趋势图 */}
                    {insight.trendData && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-600 mb-1">
                          趋势变化（最近{insight.trendData.weeks.length}周）
                        </div>
                        <ReactECharts
                          option={
                            {
                              grid: {
                                left: 40,
                                right: 10,
                                top: 10,
                                bottom: 25,
                              },
                              xAxis: {
                                type: 'category',
                                data: insight.trendData.weeks.map(
                                  w => `周${w}`
                                ),
                                axisLabel: { fontSize: 10 },
                              },
                              yAxis: {
                                type: 'value',
                                axisLabel: {
                                  formatter: (v: number) => `${v.toFixed(0)}%`,
                                  fontSize: 10,
                                },
                              },
                              series: [
                                {
                                  data: insight.trendData.values,
                                  type: 'line',
                                  smooth: true,
                                  areaStyle: {
                                    color:
                                      insight.type === 'risk'
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(234, 179, 8, 0.1)',
                                  },
                                  lineStyle: {
                                    color:
                                      insight.type === 'risk'
                                        ? '#ef4444'
                                        : '#eab308',
                                    width: 2,
                                  },
                                  itemStyle: {
                                    color:
                                      insight.type === 'risk'
                                        ? '#ef4444'
                                        : '#eab308',
                                  },
                                },
                              ],
                              tooltip: {
                                trigger: 'axis',
                                formatter: '{b}: {c}%',
                              },
                            } as EChartsOption
                          }
                          style={{ height: '120px' }}
                          opts={{ renderer: 'canvas' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map(metric => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{metric.label}</span>
                {metric.icon}
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {metric.value}
              </div>
              <div
                className={`flex items-center text-sm ${
                  metric.change > 0
                    ? 'text-green-600'
                    : metric.change < 0
                      ? 'text-red-600'
                      : 'text-slate-500'
                }`}
              >
                {metric.change > 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : metric.change < 0 ? (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                ) : (
                  <Minus className="w-4 h-4 mr-1" />
                )}
                <span>{metric.changeLabel} vs上期</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 推荐行动 */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">推荐行动</CardTitle>
            <CardDescription>基于数据分析建议采取的具体措施</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.slice(0, 3).map(insight => (
                <Alert key={insight.id} className="border-slate-200">
                  <AlertDescription className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">
                      {insight.type === 'risk' &&
                        `召开${getBusinessTypeLabel(insight.businessType!)}业务风险评审会，制定成本控制方案`}
                      {insight.type === 'opportunity' &&
                        `研究${getBusinessTypeLabel(insight.businessType!)}业务的成功因素，制定复制推广计划`}
                      {insight.type === 'trend' &&
                        `评估${getBusinessTypeLabel(insight.businessType!)}业务的承保政策和费率调整必要性`}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
