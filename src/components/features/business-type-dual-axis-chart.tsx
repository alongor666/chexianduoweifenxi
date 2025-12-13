/**
 * 业务类型双Y轴复合图
 *
 * 用途:经营分析工具,展示业务类型的规模与效率双维度
 *
 * 图表结构:
 * - X轴: 业务类型(沿用项目既有维度、顺序与展示规则)
 * - 左Y轴(柱): 签单保费(规模)
 * - 右Y轴(折线):
 *   A. 签单保费占比(%)
 *   B. 指标折线(可切换: 变动成本率、边际贡献率、满期赔付率、费用率)
 */

'use client'

import React, { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFilteredData } from '@/hooks/use-filtered-data'
import {
  CANONICAL_BUSINESS_TYPES,
  getBusinessTypeLabel,
} from '@/constants/dimensions'
import { formatNumber, formatPercent } from '@/utils/formatters'
import {
  buildGrid,
  buildTooltip,
  buildLegend,
  buildXAxis,
  buildYAxis,
  buildBarSeries,
  buildLineSeries,
} from '@/lib/charts/builders'
import { CHART_COLORS } from '@/lib/charts/theme'

/**
 * 可切换的指标类型
 */
type MetricType =
  | 'variableCostRatio'
  | 'contributionMarginRatio'
  | 'lossRatio'
  | 'expenseRatio'

/**
 * 指标配置
 */
const METRIC_CONFIG: Record<
  MetricType,
  {
    label: string
    color: string
    /** 是否逆向指标(越低越好) */
    isInverse: boolean
    /** 状态阈值(用于颜色判断) */
    thresholds?: { warning: number; danger: number }
  }
> = {
  variableCostRatio: {
    label: '变动成本率',
    color: '#f97316', // 橙色
    isInverse: true,
    thresholds: { warning: 85, danger: 90 },
  },
  contributionMarginRatio: {
    label: '边际贡献率',
    color: '#10b981', // 绿色
    isInverse: false,
    thresholds: { warning: 10, danger: 5 },
  },
  lossRatio: {
    label: '满期赔付率',
    color: '#ef4444', // 红色
    isInverse: true,
    thresholds: { warning: 60, danger: 70 },
  },
  expenseRatio: {
    label: '费用率',
    color: '#8b5cf6', // 紫色
    isInverse: true,
    thresholds: { warning: 20, danger: 25 },
  },
}

/**
 * 业务类型数据项
 */
interface BusinessTypeDataItem {
  /** 业务类型(原始值) */
  businessType: string
  /** 签单保费(万元) */
  signedPremium: number
  /** 签单保费占比(%) */
  premiumRatio: number
  /** 可切换指标值(%) */
  metricValue: number | null
}

export function BusinessTypeDualAxisChart() {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('variableCostRatio')
  const filteredData = useFilteredData()

  // 按业务类型聚合数据
  const chartData = useMemo(() => {
    const groupedByBusinessType = new Map<
      string,
      {
        signedPremium: number
        maturedPremium: number
        reportedClaimPayment: number
        expenseAmount: number
        policyCount: number
      }
    >()

    // 聚合数据
    filteredData.forEach(record => {
      const businessType = record.business_type_category
      const existing = groupedByBusinessType.get(businessType) || {
        signedPremium: 0,
        maturedPremium: 0,
        reportedClaimPayment: 0,
        expenseAmount: 0,
        policyCount: 0,
      }

      existing.signedPremium += record.signed_premium_yuan / 10000 // 转换为万元
      existing.maturedPremium += record.matured_premium_yuan / 10000
      existing.reportedClaimPayment +=
        record.reported_claim_payment_yuan / 10000
      existing.expenseAmount += record.expense_amount_yuan / 10000
      existing.policyCount += record.policy_count

      groupedByBusinessType.set(businessType, existing)
    })

    // 计算总签单保费用于占比计算
    const totalSignedPremium = Array.from(
      groupedByBusinessType.values()
    ).reduce((sum, item) => sum + item.signedPremium, 0)

    // 转换为图表数据项
    const items: BusinessTypeDataItem[] = []

    // 按照标准业务类型顺序输出（显示所有业务类型，包括无数据的）
    CANONICAL_BUSINESS_TYPES.forEach(businessType => {
      const data = groupedByBusinessType.get(businessType) || {
        signedPremium: 0,
        maturedPremium: 0,
        reportedClaimPayment: 0,
        expenseAmount: 0,
        policyCount: 0,
      }

      const signedPremium = data.signedPremium
      const maturedPremium = data.maturedPremium
      const premiumRatio =
        totalSignedPremium > 0 ? (signedPremium / totalSignedPremium) * 100 : 0

      // 计算可切换指标
      let metricValue: number | null = null
      switch (selectedMetric) {
        case 'variableCostRatio': {
          // 变动成本率 = 满期赔付率 + 费用率
          const lossRatio =
            maturedPremium > 0
              ? (data.reportedClaimPayment / maturedPremium) * 100
              : 0
          const expenseRatio =
            signedPremium > 0 ? (data.expenseAmount / signedPremium) * 100 : 0
          metricValue = lossRatio + expenseRatio
          break
        }
        case 'contributionMarginRatio': {
          // 边际贡献率 = 100% - 变动成本率
          const lossRatio =
            maturedPremium > 0
              ? (data.reportedClaimPayment / maturedPremium) * 100
              : 0
          const expenseRatio =
            signedPremium > 0 ? (data.expenseAmount / signedPremium) * 100 : 0
          const variableCostRatio = lossRatio + expenseRatio
          metricValue = 100 - variableCostRatio
          break
        }
        case 'lossRatio': {
          // 满期赔付率
          metricValue =
            maturedPremium > 0
              ? (data.reportedClaimPayment / maturedPremium) * 100
              : 0
          break
        }
        case 'expenseRatio': {
          // 费用率
          metricValue =
            signedPremium > 0 ? (data.expenseAmount / signedPremium) * 100 : 0
          break
        }
      }

      items.push({
        businessType,
        signedPremium,
        premiumRatio,
        metricValue,
      })
    })

    // 从最差到最好排序：逆向指标按高到低，正向指标按低到高
    const metricConf = METRIC_CONFIG[selectedMetric]
    items.sort((a, b) => {
      const av = a.metricValue ?? 0
      const bv = b.metricValue ?? 0
      return metricConf.isInverse ? bv - av : av - bv
    })

    return items
  }, [filteredData, selectedMetric])

  // 构建ECharts配置
  const option: EChartsOption = useMemo(() => {
    const metricConfig = METRIC_CONFIG[selectedMetric]

    // X轴数据(业务类型短标签)
    const xAxisData = chartData.map(item =>
      getBusinessTypeLabel(item.businessType)
    )

    // 签单保费数据
    const premiumData = chartData.map(item => item.signedPremium)

    // 保费占比数据
    const ratioData = chartData.map(item => item.premiumRatio)

    // 指标数据
    const metricData = chartData.map(item => item.metricValue)

    return {
      grid: buildGrid('default'),
      tooltip: buildTooltip({
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: CHART_COLORS.neutral[400],
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''

          const index = params[0].dataIndex
          const item = chartData[index]
          if (!item) return ''

          const lines = [
            `<div style="font-weight: 600; margin-bottom: 4px;">${getBusinessTypeLabel(item.businessType)}</div>`,
            `<div style="display: flex; align-items: center; gap: 8px;">`,
            `  <span style="display: inline-block; width: 10px; height: 10px; background: ${CHART_COLORS.primary[0]}; border-radius: 2px;"></span>`,
            `  <span>签单保费: ${formatNumber(item.signedPremium, 0)} 万元</span>`,
            `</div>`,
            `<div style="display: flex; align-items: center; gap: 8px;">`,
            `  <span style="display: inline-block; width: 10px; height: 10px; background: ${CHART_COLORS.neutral[500]}; border-radius: 50%;"></span>`,
            `  <span>保费占比: ${formatPercent(item.premiumRatio, 2)}</span>`,
            `</div>`,
            `<div style="display: flex; align-items: center; gap: 8px;">`,
            `  <span style="display: inline-block; width: 10px; height: 10px; background: ${metricConfig.color}; border-radius: 50%;"></span>`,
            `  <span>${metricConfig.label}: ${item.metricValue !== null ? formatPercent(item.metricValue, 2) : '-'}</span>`,
            `</div>`,
          ]

          return lines.join('')
        },
      }),
      legend: buildLegend({
        data: ['签单保费', '保费占比', metricConfig.label],
      }),
      xAxis: buildXAxis({
        data: xAxisData,
        axisLabel: {
          interval: 0,
          rotate: 0,
          fontSize: 11,
          fontWeight: 'bold',
          hideOverlap: true,
        },
      }),
      yAxis: [
        // 左Y轴: 签单保费
        buildYAxis({
          name: '签单保费 (万元)',
          position: 'left',
          axisLabel: {
            formatter: (value: number) => formatNumber(value, 0),
            fontWeight: 'bold',
          },
        }),
        // 右Y轴: 百分比
        buildYAxis({
          name: '比率 (%)',
          position: 'right',
          axisLabel: {
            formatter: (value: number) => `${value}%`,
            fontWeight: 'bold',
          },
          splitLine: {
            show: false,
          },
        }),
      ],
      series: [
        // 柱状图: 签单保费
        buildBarSeries({
          name: '签单保费',
          data: premiumData,
          color: CHART_COLORS.primary[0],
          yAxisIndex: 0,
          barWidth: '40%',
          // @ts-expect-error ECharts 系列扩展
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => formatNumber(p.value, 0),
          },
        }),
        // 折线1: 保费占比
        buildLineSeries({
          name: '保费占比',
          data: ratioData,
          color: CHART_COLORS.neutral[500],
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          lineWidth: 2,
          symbolSize: 6,
          // @ts-expect-error ECharts 系列扩展
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => `${(p.value as number).toFixed(1)}%`,
          },
        }),
        // 折线2: 可切换指标
        buildLineSeries({
          name: metricConfig.label,
          data: metricData,
          color: metricConfig.color,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          lineWidth: 3,
          symbolSize: 7,
          // @ts-expect-error ECharts 系列扩展
          label: {
            show: true,
            position: 'top',
            fontWeight: 'bold',
            formatter: (p: any) => `${(p.value as number).toFixed(1)}%`,
          },
        }),
      ],
    }
  }, [chartData, selectedMetric])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">业务类型经营分析</CardTitle>
            <CardDescription>
              规模与效率双维度分析,柱状图展示保费规模,折线展示占比与经营指标
            </CardDescription>
          </div>
          <Select
            value={selectedMetric}
            onValueChange={value => setSelectedMetric(value as MetricType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择指标" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '500px' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">当前筛选条件下暂无数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
