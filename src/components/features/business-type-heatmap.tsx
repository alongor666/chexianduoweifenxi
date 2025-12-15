/**
 * 业务类型热力日历矩阵（方案3）
 *
 * 用途：展示16个业务类型在多周的经营健康度全景图
 *
 * 设计理念：
 * - GitHub贡献热力图风格
 * - 颜色深浅表示指标健康度（绿色=优秀，红色=风险）
 * - 一屏展示 16×多周 的全部数据
 * - 快速发现异常模式和趋势
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
  CANONICAL_BUSINESS_CODES,
  getBusinessTypeCode,
  getBusinessTypeFullCNByCode,
  getBusinessTypeShortLabelByCode,
  type BusinessTypeCode,
} from '@/constants/dimensions'
import { formatPercent } from '@/utils/formatters'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import {
  calculateContributionMarginRatio,
  calculateExpenseRatio,
  calculateLossRatio,
  calculateVariableCostRatio,
} from '@/domain/rules/kpi-calculator-enhanced'

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
    /** 是否逆向指标(越低越好) */
    isInverse: boolean
    /** 颜色阈值配置 */
    thresholds: {
      excellent: number // 优秀
      good: number // 良好
      warning: number // 警戒
      danger: number // 危险
    }
  }
> = {
  variableCostRatio: {
    label: '变动成本率',
    isInverse: true,
    thresholds: { excellent: 75, good: 80, warning: 85, danger: 90 },
  },
  contributionMarginRatio: {
    label: '边际贡献率',
    isInverse: false,
    thresholds: { excellent: 20, good: 15, warning: 10, danger: 5 },
  },
  lossRatio: {
    label: '满期赔付率',
    isInverse: true,
    thresholds: { excellent: 50, good: 60, warning: 70, danger: 80 },
  },
  expenseRatio: {
    label: '费用率',
    isInverse: true,
    thresholds: { excellent: 15, good: 20, warning: 25, danger: 30 },
  },
}

/**
 * 热力图数据点
 */
interface HeatmapDataPoint {
  businessType: BusinessTypeCode
  weekNumber: number
  metricValue: number | null
  signedPremiumYuan: number
  policyCount: number
  // Intermediate fields for calculation
  maturedPremiumYuan: number
  reportedClaimPaymentYuan: number
  expenseAmountYuan: number
  marginalContributionAmountYuan: number
}

/**
 * 异常模式
 */
interface AnomalyPattern {
  type: 'continuous_danger' | 'v_shape' | 'excellent_streak'
  businessType: BusinessTypeCode
  description: string
  severity: 'high' | 'medium' | 'low'
}

export function BusinessTypeHeatmap() {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('variableCostRatio')
  const filteredData = useFilteredData()

  // 计算热力图数据
  const { heatmapData, weekNumbers, anomalies } = useMemo(() => {
    const metricConfig = METRIC_CONFIG[selectedMetric]
    const dataMap = new Map<BusinessTypeCode, Map<number, HeatmapDataPoint>>()

    // 按业务类型和周次聚合数据
    filteredData.forEach(record => {
      const businessType = getBusinessTypeCode(record.business_type_category)
      const weekNumber = record.week_number

      if (!dataMap.has(businessType)) {
        dataMap.set(businessType, new Map())
      }

      const weekMap = dataMap.get(businessType)!
      const existing = weekMap.get(weekNumber) || {
        businessType,
        weekNumber,
        metricValue: null,
        signedPremiumYuan: 0,
        policyCount: 0,
        maturedPremiumYuan: 0,
        reportedClaimPaymentYuan: 0,
        expenseAmountYuan: 0,
        marginalContributionAmountYuan: 0,
      }

      existing.signedPremiumYuan += record.signed_premium_yuan
      existing.policyCount += record.policy_count
      existing.maturedPremiumYuan += record.matured_premium_yuan
      existing.reportedClaimPaymentYuan += record.reported_claim_payment_yuan
      existing.expenseAmountYuan += record.expense_amount_yuan
      existing.marginalContributionAmountYuan +=
        record.marginal_contribution_amount_yuan

      // 计算指标值
      let metricValue: number | null = null
      switch (selectedMetric) {
        case 'variableCostRatio': {
          metricValue = calculateVariableCostRatio(
            existing.reportedClaimPaymentYuan,
            existing.expenseAmountYuan,
            existing.signedPremiumYuan
          )
          break
        }
        case 'contributionMarginRatio': {
          metricValue = calculateContributionMarginRatio(
            existing.marginalContributionAmountYuan,
            existing.maturedPremiumYuan
          )
          break
        }
        case 'lossRatio': {
          metricValue = calculateLossRatio(
            existing.reportedClaimPaymentYuan,
            existing.maturedPremiumYuan
          )
          break
        }
        case 'expenseRatio': {
          metricValue = calculateExpenseRatio(
            existing.expenseAmountYuan,
            existing.signedPremiumYuan
          )
          break
        }
      }

      existing.metricValue = metricValue
      weekMap.set(weekNumber, existing)
    })

    // 收集所有周次并排序
    const allWeeks = new Set<number>()
    dataMap.forEach(weekMap => {
      weekMap.forEach((_, week) => allWeeks.add(week))
    })
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => a - b)

    // 转换为 ECharts 热力图数据格式 [weekIndex, businessTypeIndex, value]
    const heatData: [number, number, number][] = []
    CANONICAL_BUSINESS_CODES.forEach((businessType, bizIndex) => {
      const weekMap = dataMap.get(businessType)
      sortedWeeks.forEach((week, weekIndex) => {
        const data = weekMap?.get(week)
        const value = data?.metricValue ?? -1 // -1 表示无数据
        heatData.push([weekIndex, bizIndex, value])
      })
    })

    // 检测异常模式
    const detectedAnomalies: AnomalyPattern[] = []
    CANONICAL_BUSINESS_CODES.forEach(businessType => {
      const weekMap = dataMap.get(businessType)
      if (!weekMap) return

      const values = sortedWeeks.map(week => weekMap.get(week)?.metricValue)

      // 检测连续3周危险值
      let consecutiveDanger = 0
      values.forEach((value, index) => {
        if (value === null || value === undefined) {
          consecutiveDanger = 0
          return
        }

        const isDanger = metricConfig.isInverse
          ? value >= metricConfig.thresholds.danger
          : value <= metricConfig.thresholds.danger

        if (isDanger) {
          consecutiveDanger++
          if (consecutiveDanger >= 3) {
            detectedAnomalies.push({
              type: 'continuous_danger',
              businessType,
              description: `连续${consecutiveDanger}周处于危险区域（周${sortedWeeks[index - consecutiveDanger + 1]}-${sortedWeeks[index]}）`,
              severity: 'high',
            })
          }
        } else {
          consecutiveDanger = 0
        }
      })

      // 检测优秀连续记录
      let consecutiveExcellent = 0
      values.forEach(value => {
        if (value === null || value === undefined) {
          consecutiveExcellent = 0
          return
        }

        const isExcellent = metricConfig.isInverse
          ? value <= metricConfig.thresholds.excellent
          : value >= metricConfig.thresholds.excellent

        if (isExcellent) {
          consecutiveExcellent++
        } else {
          if (consecutiveExcellent >= 4) {
            detectedAnomalies.push({
              type: 'excellent_streak',
              businessType,
              description: `连续${consecutiveExcellent}周保持优秀水平`,
              severity: 'low',
            })
          }
          consecutiveExcellent = 0
        }
      })
    })

    return {
      heatmapData: heatData,
      weekNumbers: sortedWeeks,
      anomalies: detectedAnomalies,
    }
  }, [filteredData, selectedMetric])

  // 构建 ECharts 配置
  const option: EChartsOption = useMemo(() => {
    const metricConfig = METRIC_CONFIG[selectedMetric]

    const noDataPiece = {
      value: -1,
      label: '无数据',
      color: '#e2e8f0',
    }

    const pieces = metricConfig.isInverse
      ? [
          noDataPiece,
          {
            lte: metricConfig.thresholds.excellent,
            label: `≤${metricConfig.thresholds.excellent}%`,
            color: '#22c55e',
          },
          {
            gt: metricConfig.thresholds.excellent,
            lte: metricConfig.thresholds.good,
            label: `${metricConfig.thresholds.excellent}-${metricConfig.thresholds.good}%`,
            color: '#84cc16',
          },
          {
            gt: metricConfig.thresholds.good,
            lte: metricConfig.thresholds.warning,
            label: `${metricConfig.thresholds.good}-${metricConfig.thresholds.warning}%`,
            color: '#eab308',
          },
          {
            gt: metricConfig.thresholds.warning,
            lte: metricConfig.thresholds.danger,
            label: `${metricConfig.thresholds.warning}-${metricConfig.thresholds.danger}%`,
            color: '#f97316',
          },
          {
            gt: metricConfig.thresholds.danger,
            label: `>${metricConfig.thresholds.danger}%`,
            color: '#ef4444',
          },
        ]
      : [
          noDataPiece,
          {
            lte: metricConfig.thresholds.danger,
            label: `≤${metricConfig.thresholds.danger}%`,
            color: '#ef4444',
          },
          {
            gt: metricConfig.thresholds.danger,
            lte: metricConfig.thresholds.warning,
            label: `${metricConfig.thresholds.danger}-${metricConfig.thresholds.warning}%`,
            color: '#f97316',
          },
          {
            gt: metricConfig.thresholds.warning,
            lte: metricConfig.thresholds.good,
            label: `${metricConfig.thresholds.warning}-${metricConfig.thresholds.good}%`,
            color: '#eab308',
          },
          {
            gt: metricConfig.thresholds.good,
            lte: metricConfig.thresholds.excellent,
            label: `${metricConfig.thresholds.good}-${metricConfig.thresholds.excellent}%`,
            color: '#84cc16',
          },
          {
            gt: metricConfig.thresholds.excellent,
            label: `>${metricConfig.thresholds.excellent}%`,
            color: '#22c55e',
          },
        ]

    return {
      tooltip: {
        position: 'top',
        textStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        formatter: (params: any) => {
          const weekIndex = params.data[0]
          const bizIndex = params.data[1]
          const value = params.data[2]

          if (value === -1) {
            return `<div style="padding: 8px;">
              <div style="font-weight: 600;">暂无数据</div>
              <div>第${weekNumbers[weekIndex]}周 - ${getBusinessTypeFullCNByCode(CANONICAL_BUSINESS_CODES[bizIndex])}</div>
            </div>`
          }

          return `<div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">第${weekNumbers[weekIndex]}周 - ${getBusinessTypeFullCNByCode(CANONICAL_BUSINESS_CODES[bizIndex])}</div>
            <div>${metricConfig.label}: ${formatPercent(value, 2)}</div>
          </div>`
        },
      },
      grid: {
        left: 120,
        right: 80,
        top: 40,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: weekNumbers.map(w => `周${w}`),
        splitArea: {
          show: false,
        },
        axisLabel: {
          interval: 0,
          rotate: 0,
          fontSize: 11,
          fontWeight: 'bold',
          hideOverlap: true,
        },
      },
      yAxis: {
        type: 'category',
        data: CANONICAL_BUSINESS_CODES.map(code =>
          getBusinessTypeShortLabelByCode(code)
        ),
        splitArea: {
          show: false,
        },
        axisLabel: {
          fontSize: 11,
          fontWeight: 'bold',
          hideOverlap: true,
        },
      },
      visualMap: {
        type: 'piecewise',
        pieces,
        selectedMode: false,
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
      },
      series: [
        {
          name: metricConfig.label,
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            fontSize: 10,
            fontWeight: 'bold',
            formatter: (p: any) =>
              p.data[2] === -1 ? '' : `${Number(p.data[2]).toFixed(0)}%`,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }
  }, [heatmapData, weekNumbers, selectedMetric])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">业务类型健康度热力图</CardTitle>
            <CardDescription>
              一屏展示所有业务类型在多周的健康度变化，颜色越深表示风险越高
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
      <CardContent className="space-y-6">
        {/* 热力图 */}
        {heatmapData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '600px' }}
            opts={{ renderer: 'canvas' }}
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">当前筛选条件下暂无数据</p>
          </div>
        )}

        {/* 异常模式识别 */}
        {anomalies.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              异常模式识别
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <Alert
                  key={index}
                  className={`border-l-4 ${
                    anomaly.severity === 'high'
                      ? 'border-l-red-500 bg-red-50'
                      : anomaly.severity === 'medium'
                        ? 'border-l-amber-500 bg-amber-50'
                        : 'border-l-green-500 bg-green-50'
                  }`}
                >
                  <AlertDescription className="flex items-start gap-2 text-sm">
                    {anomaly.type === 'continuous_danger' && (
                      <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    {anomaly.type === 'excellent_streak' && (
                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-medium">
                        {getBusinessTypeShortLabelByCode(anomaly.businessType)}
                      </span>
                      ：{anomaly.description}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">
            使用说明
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• 颜色越深（红色）表示该指标处于风险区域</li>
            <li>• 颜色越浅（绿色）表示该指标表现优秀</li>
            <li>• 悬停在格子上查看详细数值</li>
            <li>• 横向观察可以看出某业务类型的时间趋势</li>
            <li>• 纵向观察可以对比不同业务类型在同一周的表现</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
