'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts'
import { AlertTriangle } from 'lucide-react'
import { useTrendData } from '@/hooks/use-trend'
import { applyFilters } from '@/hooks/use-filtered-data'
import { formatNumber, formatPercent } from '@/utils/format'
import { useAppStore } from '@/store/use-app-store'
import type { FilterState, InsuranceRecord } from '@/types/insurance'
import { getBusinessTypeLabel, getBusinessTypeCode, getBusinessTypeShortLabelByCode, getBusinessTypeFullCNByCode } from '@/constants/dimensions'

/**
 * 周度经营趋势分析组件
 *
 * 核心指标：
 * - 签单保费（主趋势线，蓝色）
 * - 赔付率（橙色风险点，阈值线70%）
 *
 * 【重要】数据说明：
 * - CSV原始数据：每周的数据是**年度累计值**（从1月1日到该周结束的累计）
 * - 签单保费展示：根据 filters.dataViewType 决定
 *   - 'current'（当周值模式）：显示累计签单保费曲线
 *   - 'increment'（周增量模式）：显示每周新增签单保费
 * - 赔付率计算：始终基于累计数据（累计赔款 / 累计保费）
 *   - 每周的赔付率 = 该周累计赔款 / 该周累计保费
 *   - 反映从年初到该周的整体赔付水平
 *
 * 功能特性：
 * 1. 双Y轴设计：左轴签单保费，右轴赔付率
 * 2. 赔付率≥70%自动高亮为橙色风险点
 * 3. 背景淡红色标识高风险区域
 * 4. 紫色虚线趋势线
 * 5. 智能Tooltip显示详细信息
 * 6. 点击事件支持下钻分析
 * 7. 自动生成经营摘要
 */

// 赔付率风险阈值
const LOSS_RISK_THRESHOLD = 70

/**
 * 图表数据点类型
 */
interface ChartDataPoint {
  week: string // 周次标签
  weekNumber: number // 周次数字
  year: number // 年份
  signedPremium: number // 签单保费（万元）
  lossRatio: number | null // 赔付率（%）
  isRisk: boolean // 是否为风险点
}

/**
 * 计算线性趋势线数据
 */
function calculateTrendLine(data: ChartDataPoint[]): number[] {
  const lossRatios = data
    .map((d) => d.lossRatio)
    .filter((v): v is number => v !== null)

  if (lossRatios.length < 2) return []

  // 最小二乘法计算线性回归
  const n = lossRatios.length
  const sumX = lossRatios.reduce((sum, _, i) => sum + i, 0)
  const sumY = lossRatios.reduce((sum, v) => sum + v, 0)
  const sumXY = lossRatios.reduce((sum, v, i) => sum + v * i, 0)
  const sumX2 = lossRatios.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return data.map((_, i) => slope * i + intercept)
}

interface NarrativeSummary {
  overview: string
  lossTrend: string
  businessLines: string[]
  organizationLines: string[]
  insight: string | null
  actionLines: string[]
  followUp: string
}

interface DimensionHighlight {
  key: string
  label: string
  lossRatio: number | null
  lossRatioChange: number | null
  claimPaymentWan: number
  claimPaymentChangeWan: number | null
  topCoverage: string | null
  topPartner: string | null
}

function formatDeltaPercentPoint(
  value: number | null,
  decimals = 1
): string | null {
  if (value === null || Number.isNaN(value)) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}pp`
}

function formatDeltaAmountWan(value: number | null, decimals = 1): string | null {
  if (value === null || Number.isNaN(value)) return null
  const direction = value >= 0 ? '增加' : '减少'
  return `${direction} ${formatNumber(Math.abs(value), decimals)} 万元`
}

function createWeekScopedFilters(
  baseFilters: FilterState,
  year: number,
  week: number
): FilterState {
  return {
    ...baseFilters,
    years: [year],
    weeks: [week],
    trendModeWeeks: week > 0 ? [week] : [],
    singleModeWeek: week > 0 ? week : null,
  }
}

function describeFilters(filters: FilterState): string {
  const parts: string[] = []
  if (filters.years?.length) {
    parts.push(`年度=${filters.years.map(String).join('、')}`)
  }
  if (filters.organizations?.length) {
    parts.push(`机构=${filters.organizations.join('、')}`)
  }
  if (filters.businessTypes?.length) {
    // 业务类型为代码值，展示中文简称
    parts.push(
      `业务类型=${filters.businessTypes
        .map(code => getBusinessTypeShortLabelByCode(code as any))
        .join('、')}`
    )
  }
  if (filters.coverageTypes?.length) {
    parts.push(`险别=${filters.coverageTypes.join('、')}`)
  }
  if (filters.insuranceTypes?.length) {
    parts.push(`保险类别=${filters.insuranceTypes.join('、')}`)
  }
  if (filters.customerCategories?.length) {
    parts.push(`客户分类=${filters.customerCategories.join('、')}`)
  }
  if (filters.vehicleGrades?.length) {
    parts.push(`车险评级=${filters.vehicleGrades.join('、')}`)
  }
  if (filters.renewalStatuses?.length) {
    parts.push(`新续转=${filters.renewalStatuses.join('、')}`)
  }
  if (filters.isNewEnergy !== null && filters.isNewEnergy !== undefined) {
    parts.push(`新能源=${filters.isNewEnergy ? '是' : '否'}`)
  }
  if (filters.terminalSources?.length) {
    parts.push(`渠道=${filters.terminalSources.join('、')}`)
  }
  if (parts.length === 0) {
    return '筛选条件：全部业务'
  }
  return `筛选条件：${parts.join(' | ')}`
}

interface TotalsAggregation {
  signedPremiumYuan: number
  maturedPremiumYuan: number
  claimPaymentYuan: number
  claimCaseCount: number
}

function aggregateTotals(records: InsuranceRecord[]): TotalsAggregation {
  return records.reduce<TotalsAggregation>(
    (acc, record) => {
      acc.signedPremiumYuan += record.signed_premium_yuan
      acc.maturedPremiumYuan += record.matured_premium_yuan
      acc.claimPaymentYuan += record.reported_claim_payment_yuan
      acc.claimCaseCount += record.claim_case_count
      return acc
    },
    {
      signedPremiumYuan: 0,
      maturedPremiumYuan: 0,
      claimPaymentYuan: 0,
      claimCaseCount: 0,
    }
  )
}

function computeLossRatio(totals: TotalsAggregation): number | null {
  if (totals.maturedPremiumYuan <= 0) return null
  return (totals.claimPaymentYuan / totals.maturedPremiumYuan) * 100
}

function formatFilterList(values: string[], maxLength = 3): string {
  const unique = Array.from(new Set(values.filter(Boolean)))
  if (unique.length === 0) return '—'
  const sliced = unique.slice(0, maxLength)
  const suffix = unique.length > maxLength ? '等' : ''
  return `${sliced.join('、')}${suffix}`
}

function sanitizeText(value: string | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function pickTopLabel(claims: Map<string, number>): string | null {
  let topLabel: string | null = null
  let topValue = Number.NEGATIVE_INFINITY
  claims.forEach((value, label) => {
    if (value > topValue) {
      topValue = value
      topLabel = label
    }
  })
  return topLabel
}

interface DimensionAccumulator {
  label: string
  currentMatured: number
  currentClaim: number
  previousMatured: number
  previousClaim: number
  coverageClaims: Map<string, number>
  partnerClaims: Map<string, number>
}

function buildDimensionHighlights(
  dimension: 'business' | 'organization',
  currentRecords: InsuranceRecord[],
  previousRecords: InsuranceRecord[]
): DimensionHighlight[] {
  const map = new Map<string, DimensionAccumulator>()

  const ensureAccumulator = (key: string, label: string): DimensionAccumulator => {
    if (!map.has(key)) {
      map.set(key, {
        label,
        currentMatured: 0,
        currentClaim: 0,
        previousMatured: 0,
        previousClaim: 0,
        coverageClaims: new Map(),
        partnerClaims: new Map(),
      })
    }
    return map.get(key)!
  }

  const getKeyAndLabel = (record: InsuranceRecord): { key: string; label: string } => {
    if (dimension === 'business') {
      const raw = sanitizeText(record.business_type_category, '未标记业务')
      const code = getBusinessTypeCode(raw)
      return { key: code, label: getBusinessTypeShortLabelByCode(code) }
    }
    const label = sanitizeText(record.third_level_organization, '未标记机构')
    return { key: label, label }
  }

  const getPartnerLabel = (record: InsuranceRecord): string => {
    if (dimension === 'business') {
      return sanitizeText(record.third_level_organization, '未标记机构')
    }
    const raw = sanitizeText(record.business_type_category, '未标记业务')
    const code = getBusinessTypeCode(raw)
    return getBusinessTypeShortLabelByCode(code)
  }

  currentRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.currentMatured += record.matured_premium_yuan
    accumulator.currentClaim += record.reported_claim_payment_yuan

    const coverageLabel = sanitizeText(record.coverage_type, '未标记险别')
    accumulator.coverageClaims.set(
      coverageLabel,
      (accumulator.coverageClaims.get(coverageLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )

    const partnerLabel = getPartnerLabel(record)
    accumulator.partnerClaims.set(
      partnerLabel,
      (accumulator.partnerClaims.get(partnerLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )
  })

  previousRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.previousMatured += record.matured_premium_yuan
    accumulator.previousClaim += record.reported_claim_payment_yuan
  })

  const highlights: DimensionHighlight[] = []

  map.forEach((accumulator, key) => {
    const currentMatured = accumulator.currentMatured
    const currentClaim = accumulator.currentClaim
    const previousMatured = accumulator.previousMatured
    const previousClaim = accumulator.previousClaim

    if (currentMatured <= 0 && currentClaim <= 0 && previousMatured <= 0 && previousClaim <= 0) {
      return
    }

    let lossRatio: number | null = null
    if (currentMatured > 0 && currentClaim >= 0) {
      lossRatio = (currentClaim / currentMatured) * 100
    }

    let previousLossRatio: number | null = null
    if (previousMatured > 0 && previousClaim >= 0) {
      previousLossRatio = (previousClaim / previousMatured) * 100
    }

    const lossRatioChange =
      lossRatio !== null && previousLossRatio !== null
        ? lossRatio - previousLossRatio
        : null

    const claimPaymentWan = currentClaim / 10000
    const claimPaymentChangeWan =
      currentClaim - previousClaim !== 0
        ? (currentClaim - previousClaim) / 10000
        : null

    const topCoverage = pickTopLabel(accumulator.coverageClaims)
    const topPartner = pickTopLabel(accumulator.partnerClaims)

    highlights.push({
      key,
      label: accumulator.label,
      lossRatio,
      lossRatioChange,
      claimPaymentWan,
      claimPaymentChangeWan,
      topCoverage,
      topPartner,
    })
  })

  const valueOf = (value: number | null | undefined): number =>
    value === null || value === undefined ? Number.NEGATIVE_INFINITY : value

  highlights.sort((a, b) => {
    const changeDiff = valueOf(b.lossRatioChange) - valueOf(a.lossRatioChange)
    if (changeDiff !== 0 && Number.isFinite(changeDiff)) {
      return changeDiff
    }

    const ratioDiff = valueOf(b.lossRatio) - valueOf(a.lossRatio)
    if (ratioDiff !== 0 && Number.isFinite(ratioDiff)) {
      return ratioDiff
    }

    return b.claimPaymentWan - a.claimPaymentWan
  })

  return highlights
}

/**
 * 生成经营摘要
 */
function formatWeekList(weeks: number[]): string {
  if (weeks.length === 0) return ''
  return weeks.map((week) => `第${week}周`).join('、')
}

function generateOperationalSummary(
  data: ChartDataPoint[],
  mode: 'current' | 'increment'
): string {
  if (data.length === 0) return ''

  const latestPoint = data[data.length - 1]
  // 修正：当前周值下，年度累计签单保费就是第42周的当前周值，而不是多周的合计值
  const latestPremium = latestPoint.signedPremium

  // 计算连续高风险周数
  let consecutiveRiskWeeks = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].isRisk) {
      consecutiveRiskWeeks++
    } else {
      break
    }
  }

  const totalRiskWeeks = data.filter((d) => d.isRisk).length

  if (mode === 'increment') {
    const previousPoint =
      data.length > 1 ? data[data.length - 2] : null
    const latestPremiumWan = formatNumber(latestPremium, 0)
    const premiumChange =
      previousPoint != null
        ? latestPremium - previousPoint.signedPremium
        : null
    const premiumChangeText =
      premiumChange != null
        ? `，较上周${premiumChange >= 0 ? '增加' : '下降'} ${formatNumber(
            Math.abs(premiumChange),
            0
          )} 万元`
        : ''

    const recentWindowStart = Math.max(1, data.length - 6)
    const premiumDrops: Array<{ week: number; diff: number }> = []
    for (let i = recentWindowStart; i < data.length; i++) {
      const prev = data[i - 1]
      const curr = data[i]
      if (curr.signedPremium < prev.signedPremium) {
        premiumDrops.push({
          week: curr.weekNumber,
          diff: curr.signedPremium - prev.signedPremium,
        })
      }
    }

    const premiumIssueText =
      premiumDrops.length > 0
        ? `保费周增量在${premiumDrops
            .slice(-2)
            .map(
              (item) =>
                `第${item.week}周较前一周下降 ${formatNumber(
                  Math.abs(item.diff),
                  0
                )} 万元`
            )
            .join('、')}，需尽快排查渠道与获客效率`
        : '保费周增量总体保持平稳'

    const riskWeeks = data
      .filter((d) => d.isRisk)
      .map((d) => d.weekNumber)
    const riskWeekText =
      riskWeeks.length > 0
        ? `赔付率预警集中在 ${formatWeekList(
            riskWeeks.slice(-4)
          )}，赔付压力明显上行`
        : '赔付率暂未触发预警'

    const trendWindow = data.slice(-Math.min(5, data.length))
    const trendChange =
      trendWindow.length >= 2
        ? trendWindow[trendWindow.length - 1].signedPremium -
          trendWindow[0].signedPremium
        : 0
    let consecutiveDecline = 0
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i].signedPremium < data[i - 1].signedPremium) {
        consecutiveDecline += 1
      } else {
        break
      }
    }

    let trendText = '趋势暂未出现明显恶化'
    if (trendChange < 0) {
      const declineRemark =
        consecutiveDecline >= 2
          ? `已连续 ${consecutiveDecline} 周回落`
          : '近几周动能转弱'
      trendText = `趋势正在恶化，${declineRemark}，累计回落 ${formatNumber(
        Math.abs(trendChange),
        0
      )} 万元`
    }

    let summary = `截至${latestPoint.year}年第${latestPoint.weekNumber}周，本周签单保费周增量 ${latestPremiumWan} 万元${premiumChangeText}。`
    summary += `${premiumIssueText}。`
    summary += `${riskWeekText}。`
    summary += `${trendText}。`
    return summary.trim()
  }

  let summary = `截至${latestPoint.year}年第${latestPoint.weekNumber}周，`
  summary += `年度累计签单保费 ${formatNumber(latestPremium, 0)} 万元`

  // 修正：赔付率不用均值，直接说多少周处于预警区
  if (consecutiveRiskWeeks > 0) {
    summary += `，连续 ${consecutiveRiskWeeks} 周处于预警区`
  } else if (totalRiskWeeks > 0) {
    summary += `，${totalRiskWeeks} 周处于预警区`
  } else {
    summary += `，经营状况良好`
  }

  return summary
}

/**
 * 周度经营趋势图表组件
 */
export const WeeklyOperationalTrend = React.memo(function WeeklyOperationalTrend() {
  const trendData = useTrendData()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null)
  const dataViewType = useAppStore((state) => state.filters.dataViewType)
  const filters = useAppStore((state) => state.filters)
  const rawRecords = useAppStore((state) => state.rawData)

  // 处理数据
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return []

    return trendData
      .map((d) => ({
        week: d.label,
        weekNumber: d.week,
        year: d.year,
        signedPremium: d.signed_premium_10k,
        lossRatio: d.loss_ratio,
        isRisk: d.loss_ratio !== null && d.loss_ratio >= LOSS_RISK_THRESHOLD,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.weekNumber - b.weekNumber
      })
  }, [trendData])

  // 处理周增量模式：跳过第一周（无法计算增量）
  const displayData = useMemo(() => {
    if (dataViewType === 'increment' && chartData.length > 1) {
      // 周增量模式下，跳过第一周
      return chartData.slice(1)
    }
    return chartData
  }, [chartData, dataViewType])

  // 生成经营摘要
  const operationalSummary = useMemo(() => {
    return generateOperationalSummary(displayData, dataViewType)
  }, [displayData, dataViewType])

  // 统计数据
  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return {
        totalRiskWeeks: 0,
        avgLossRatio: 0,
        maxLossRatio: 0,
      }
    }

    const lossRatios = displayData
      .map((d) => d.lossRatio)
      .filter((v): v is number => v !== null)

    return {
      totalRiskWeeks: displayData.filter((d) => d.isRisk).length,
      avgLossRatio:
        lossRatios.length > 0
          ? lossRatios.reduce((sum, v) => sum + v, 0) / lossRatios.length
          : 0,
      maxLossRatio: lossRatios.length > 0 ? Math.max(...lossRatios) : 0,
    }
  }, [displayData])

  const analysisNarrative = useMemo<NarrativeSummary | null>(() => {
    if (!displayData || displayData.length === 0) return null
    if (!rawRecords || rawRecords.length === 0) return null

    const latestPoint = displayData[displayData.length - 1]
    if (!latestPoint) return null

    const filterSummary = describeFilters(filters)
    const weekLabel = `${latestPoint.year}年第${latestPoint.weekNumber}周`
    const metricLabel =
      dataViewType === 'increment' ? '签单保费周增量' : '年度累计签单保费'
    const latestSigned = latestPoint.signedPremium
    const latestSignedText = `${formatNumber(latestSigned, 0)} 万元`

    const previousPoint =
      displayData.length > 1 ? displayData[displayData.length - 2] : null
    const signedDiff =
      previousPoint !== null ? latestSigned - previousPoint.signedPremium : null
    const signedDiffText =
      signedDiff !== null
        ? `，环比${signedDiff >= 0 ? '增加' : '下降'} ${formatNumber(
            Math.abs(signedDiff),
            0
          )} 万元`
        : ''

    const recentValues = displayData
      .slice(-Math.min(4, displayData.length))
      .map((d) => d.signedPremium)
    const recentPeak =
      recentValues.length > 0 ? Math.max(...recentValues) : latestSigned
    const cumulativeDrop = recentPeak - latestSigned
    const cumulativeDropText =
      cumulativeDrop > 0
        ? `，较近四周峰值累计回落 ${formatNumber(cumulativeDrop, 0)} 万元`
        : ''

    let consecutiveDecline = 0
    for (let i = displayData.length - 1; i > 0; i -= 1) {
      if (displayData[i].signedPremium < displayData[i - 1].signedPremium) {
        consecutiveDecline += 1
      } else {
        break
      }
    }
    const declineText =
      consecutiveDecline >= 2 ? `，已连续 ${consecutiveDecline} 周走低` : ''

    const latestWeekRecords = applyFilters(
      rawRecords,
      createWeekScopedFilters(filters, latestPoint.year, latestPoint.weekNumber)
    )
    const previousWeekNumber =
      previousPoint?.weekNumber ?? latestPoint.weekNumber - 1
    const previousWeekRecords =
      previousWeekNumber && previousWeekNumber >= 1
        ? applyFilters(
            rawRecords,
            createWeekScopedFilters(
              filters,
              latestPoint.year,
              previousWeekNumber
            )
          )
        : []

    const totalsCurrent = aggregateTotals(latestWeekRecords)
    const totalsPrevious = aggregateTotals(previousWeekRecords)
    const currentLossRatio = computeLossRatio(totalsCurrent)
    const previousLossRatio = computeLossRatio(totalsPrevious)

    const businessHighlights = buildDimensionHighlights(
      'business',
      latestWeekRecords,
      previousWeekRecords
    )
    const organizationHighlights = buildDimensionHighlights(
      'organization',
      latestWeekRecords,
      previousWeekRecords
    )
    let fallbackPreviousLossRatio: number | null = previousLossRatio
    if (fallbackPreviousLossRatio === null) {
      for (let i = displayData.length - 2; i >= 0; i -= 1) {
        if (displayData[i].lossRatio !== null) {
          fallbackPreviousLossRatio = displayData[i].lossRatio
          break
        }
      }
    }

    const latestLossRatio =
      currentLossRatio !== null ? currentLossRatio : latestPoint.lossRatio
    const lossRatioChangeText =
      latestLossRatio !== null && fallbackPreviousLossRatio !== null
        ? formatDeltaPercentPoint(
            latestLossRatio - fallbackPreviousLossRatio,
            1
          )
        : null
    const lossRatioText =
      latestLossRatio !== null ? formatPercent(latestLossRatio, 1) : '—'

    let riskStreak = 0
    for (let i = displayData.length - 1; i >= 0; i -= 1) {
      if (displayData[i].isRisk) {
        riskStreak += 1
      } else {
        break
      }
    }

    const claimPaymentChangeWan =
      totalsPrevious.claimPaymentYuan > 0 || totalsCurrent.claimPaymentYuan > 0
        ? (totalsCurrent.claimPaymentYuan - totalsPrevious.claimPaymentYuan) /
          10000
        : null

    const overviewLine = `【经营概览】${filterSummary}；${weekLabel} ${metricLabel} ${latestSignedText}${signedDiffText}${cumulativeDropText}${declineText}。`

    const lossTrendIntro =
      riskStreak > 0
        ? `赔付率已连续 ${riskStreak} 周触发预警`
        : stats.totalRiskWeeks > 0
          ? `本期共出现 ${stats.totalRiskWeeks} 个预警周`
          : '赔付率保持在安全区间'
    const lossTrendLine =
      lossTrendIntro === '赔付率保持在安全区间'
        ? `【赔付趋势】${lossTrendIntro}，最新值 ${lossRatioText}${
            lossRatioChangeText ? `，环比${lossRatioChangeText}` : ''
          }。`
        : `【赔付趋势】${lossTrendIntro}，最新值 ${lossRatioText}${
            lossRatioChangeText ? `，环比${lossRatioChangeText}` : ''
          }${
            claimPaymentChangeWan !== null
              ? `，赔款${formatDeltaAmountWan(claimPaymentChangeWan, 1)}`
              : ''
          }。`

    const businessLines = businessHighlights.slice(0, 3).map(item => {
      const ratioText =
        item.lossRatio !== null ? formatPercent(item.lossRatio, 1) : '—'
      const changeText = item.lossRatioChange
        ? formatDeltaPercentPoint(item.lossRatioChange, 1)
        : null
      const claimChangeText =
        item.claimPaymentChangeWan !== null
          ? formatDeltaAmountWan(item.claimPaymentChangeWan, 1)
          : `赔款 ${formatNumber(item.claimPaymentWan, 1)} 万元`
      const coverageText = item.topCoverage ?? '重点险别'
      const partnerText =
        item.topPartner && item.topPartner !== '未标记机构'
          ? `，重点机构 ${item.topPartner}`
          : ''
      return `${item.label}：赔付率 ${ratioText}${
        changeText ? `，环比${changeText}` : ''
      }，${claimChangeText}，风险集中于 ${coverageText}${partnerText}`
    })

    const organizationLines = organizationHighlights.slice(0, 3).map(item => {
      const ratioText =
        item.lossRatio !== null ? formatPercent(item.lossRatio, 1) : '—'
      const changeText = item.lossRatioChange
        ? formatDeltaPercentPoint(item.lossRatioChange, 1)
        : null
      const claimChangeText =
        item.claimPaymentChangeWan !== null
          ? formatDeltaAmountWan(item.claimPaymentChangeWan, 1)
          : `赔款 ${formatNumber(item.claimPaymentWan, 1)} 万元`
      const coverageText = item.topCoverage ?? '重点险别'
      const partnerText =
        item.topPartner && item.topPartner !== '未标记业务'
          ? `，涉及业务 ${item.topPartner}`
          : ''
      return `${item.label}：赔付率 ${ratioText}${
        changeText ? `，环比${changeText}` : ''
      }，${claimChangeText}，涉险险别 ${coverageText}${partnerText}`
    })

    const coverageHotspots = formatFilterList(
      [
        ...businessHighlights.map(item => item.topCoverage ?? '').filter(Boolean),
        ...organizationHighlights.map(item => item.topCoverage ?? '').filter(Boolean),
      ]
    )
    const businessHotspots = formatFilterList(
      businessHighlights.map(item => item.label)
    )
    const organizationHotspots = formatFilterList(
      organizationHighlights.map(item => item.label)
    )

    const hasHighlights =
      businessHighlights.length > 0 || organizationHighlights.length > 0

    const insightLineText = hasHighlights
      ? `【风险洞察】异常组合集中在 ${coverageHotspots}，叠加 ${businessHotspots} 等业务类型，并显著指向 ${organizationHotspots} 等机构，需重点复核赔付控制。`
      : null

    const actionLines: string[] = []
    if (hasHighlights) {
      const coverageDisplay =
        coverageHotspots === '—' ? '重点险别' : coverageHotspots
      const businessDisplay =
        businessHotspots === '—' ? '重点业务类型' : businessHotspots
      const organizationDisplay =
        organizationHotspots === '—' ? '重点机构' : organizationHotspots

      if (organizationHotspots !== '—') {
        actionLines.push(
          `渠道：聚焦 ${organizationDisplay} 等机构，核查代理与直销渠道质量并梳理承保准入。`
        )
      } else {
        actionLines.push('渠道：保持重点机构渠道巡查频次，确保异常及时上报。')
      }
      actionLines.push(
        `产品：针对 ${coverageDisplay} 与 ${businessDisplay}，复盘费率及赔付条款，评估是否需调整承保策略。`
      )
      const primaryBusiness =
        businessHighlights[0]?.label ??
        (businessHotspots !== '—' ? businessHotspots.replace(/等$/, '') : '重点业务')
      const primaryCoverage =
        businessHighlights[0]?.topCoverage ??
        (coverageHotspots !== '—' ? coverageHotspots.replace(/等$/, '') : '重点险别')
      const primaryOrganization =
        organizationHighlights[0]?.label ??
        (organizationHotspots !== '—'
          ? organizationHotspots.replace(/等$/, '')
          : '重点机构')
      actionLines.push(
        `作业：构建“${primaryBusiness}—${primaryCoverage}—${primaryOrganization}”风险热力图，纳入周度经营例会跟踪。`
      )
    } else {
      actionLines.push('渠道：当前未发现异常波动，维持现有巡检节奏即可。')
      actionLines.push('流程：持续关注赔付率趋势，如触及阈值及时启动专项排查。')
    }

    const followUpLine = `【后续跟踪】请于下周周例会上复盘整改进度，并持续关注第${latestPoint.weekNumber + 1}周实时赔付表现。`

    return {
      overview: overviewLine,
      lossTrend: lossTrendLine,
      businessLines,
      organizationLines,
      insight: insightLineText,
      actionLines,
      followUp: `${followUpLine}`,
    }
  }, [dataViewType, displayData, filters, rawRecords, stats.totalRiskWeeks])

  // 计算趋势线
  const trendLineData = useMemo(() => {
    return calculateTrendLine(displayData)
  }, [displayData])

  // 初始化和更新图表
  useEffect(() => {
    if (!chartRef.current || displayData.length === 0) return

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const chart = chartInstanceRef.current

    // 准备数据
    // 优化X轴标签：只显示周序号，不显示年份；只显示每月第1周和最近1周
    const weeks = displayData.map((d, index) => {
      const isFirstWeekOfMonth = d.weekNumber % 4 === 1 || d.weekNumber === 1
      const isLastWeek = index === displayData.length - 1

      // 只在每月第1周和最近1周显示标签
      if (isFirstWeekOfMonth || isLastWeek) {
        return `第${d.weekNumber}周`
      }
      return '' // 其他周不显示标签
    })

    const signedPremiums = displayData.map((d) => d.signedPremium)
    const lossRatios = displayData.map((d) => d.lossRatio)

    // 分离风险点和正常点
    const normalPoints = displayData
      .map((d, i) => (!d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
      .filter((v): v is [number, number] => v !== null)

    const riskPoints = displayData
      .map((d, i) => (d.isRisk && d.lossRatio !== null ? [i, d.lossRatio] : null))
      .filter((v): v is [number, number] => v !== null)

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999',
          },
        },
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

          const dataIndex = params[0].dataIndex
          const point = displayData[dataIndex]

          if (!point) return ''

          const thresholdDiff =
            point.lossRatio !== null
              ? point.lossRatio - LOSS_RISK_THRESHOLD
              : null

          let html = `<div style="min-width: 260px;">
            <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${point.week}</div>
            <div style="margin-bottom: 4px;">
              <span style="color: #64748b;">签单保费：</span>
              <span style="font-weight: 600;">${formatNumber(point.signedPremium, 1)} 万元</span>
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #64748b;">赔付率（累计）：</span>
              <span style="font-weight: 600; color: ${point.isRisk ? '#ef4444' : '#334155'};">
                ${point.lossRatio !== null ? formatPercent(point.lossRatio, 2) : '—'}
              </span>
            </div>
            <div style="margin-bottom: 8px; font-size: 10px; color: #94a3b8;">
              💡 赔付率 = 年初至今累计赔款 / 累计保费
            </div>`

          if (thresholdDiff !== null) {
            html += `<div style="margin-bottom: 8px;">
              <span style="color: #64748b;">与阈值差值：</span>
              <span style="font-weight: 600; color: ${thresholdDiff >= 0 ? '#ef4444' : '#10b981'};">
              ${thresholdDiff >= 0 ? '+' : ''}${thresholdDiff.toFixed(1)}pp
              </span>
            </div>`
          }

          html += `</div>`

          return html
        },
      },
      legend: {
        data: ['签单保费', '赔付率', '阈值线 70%', '趋势线'],
        top: '2%',
        textStyle: {
          fontSize: 12,
        },
      },
      xAxis: [
        {
          type: 'category',
          data: weeks,
          axisPointer: {
            type: 'shadow',
          },
          axisLabel: {
            fontSize: 11,
            rotate: 45,
            color: '#64748b',
          },
          axisLine: {
            lineStyle: {
              color: '#cbd5e1',
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '签单保费（万元）',
          position: 'left',
          nameTextStyle: {
            color: '#64748b',
            fontSize: 12,
          },
          axisLabel: {
            formatter: (value: number) => formatNumber(value, 0),
            fontSize: 11,
            color: '#64748b',
          },
          axisLine: {
            show: true,
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
        {
          type: 'value',
          name: '赔付率（%）',
          position: 'right',
          nameTextStyle: {
            color: '#64748b',
            fontSize: 12,
          },
          axisLabel: {
            formatter: (value: number) => `${value.toFixed(0)}%`,
            fontSize: 11,
            color: '#64748b',
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: '#cbd5e1',
            },
          },
          splitLine: {
            show: false,
          },
          // 右轴只显示关键刻度：70%、均值、最大值
          min: (value: any) => Math.floor(value.min / 10) * 10,
          max: (value: any) => Math.ceil(value.max / 10) * 10,
        },
      ],
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: 0,
          start: displayData.length > 26 ? ((displayData.length - 26) / displayData.length) * 100 : 0,
          end: 100,
          height: 20,
          bottom: '5%',
          handleSize: '80%',
          textStyle: {
            fontSize: 10,
          },
        },
        {
          type: 'inside',
          xAxisIndex: 0,
          start: displayData.length > 26 ? ((displayData.length - 26) / displayData.length) * 100 : 0,
          end: 100,
        },
      ],
      series: [
        // 签单保费趋势线（蓝色）
        {
          name: '签单保费',
          type: 'line',
          yAxisIndex: 0,
          data: signedPremiums,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#3b82f6',
            width: 3,
          },
          itemStyle: {
            color: '#3b82f6',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          // LTTB 降采样（大数据优化）
          sampling: 'lttb',
        },
        // 赔付率正常点（灰色）
        {
          name: '赔付率',
          type: 'scatter',
          yAxisIndex: 1,
          data: normalPoints,
          symbolSize: 8,
          itemStyle: {
            color: '#94a3b8',
          },
          emphasis: {
            scale: 1.5,
          },
        },
        // 赔付率风险点（橙色高亮）
        {
          name: '赔付率（风险）',
          type: 'scatter',
          yAxisIndex: 1,
          data: riskPoints,
          symbolSize: 12,
          itemStyle: {
            color: '#f97316',
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: 'rgba(249, 115, 22, 0.5)',
          },
          emphasis: {
            scale: 1.8,
            itemStyle: {
              shadowBlur: 10,
            },
          },
          zlevel: 10,
        },
        // 赔付率连线（橙色）
        {
          name: '赔付率',
          type: 'line',
          yAxisIndex: 1,
          data: lossRatios,
          showSymbol: false,
          lineStyle: {
            color: '#f97316',
            width: 2,
            type: 'solid',
          },
          emphasis: {
            focus: 'series',
          },
          // 标记区域：赔付率≥70%的背景淡红色
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(254, 226, 226, 0.3)',
            },
            data: [
              [
                {
                  yAxis: LOSS_RISK_THRESHOLD,
                },
                {
                  yAxis: 'max',
                },
              ],
            ],
          },
        },
        // 阈值线 70%（红色虚线）
        {
          name: '阈值线 70%',
          type: 'line',
          yAxisIndex: 1,
          data: new Array(weeks.length).fill(LOSS_RISK_THRESHOLD),
          lineStyle: {
            color: '#ef4444',
            width: 2,
            type: 'dashed',
          },
          symbol: 'none',
          emphasis: {
            disabled: true,
          },
        },
        // 趋势线（紫色虚线）
        {
          name: '趋势线',
          type: 'line',
          yAxisIndex: 1,
          data: trendLineData,
          lineStyle: {
            color: '#8b5cf6',
            width: 2,
            type: 'dashed',
          },
          symbol: 'none',
          emphasis: {
            disabled: true,
          },
        },
      ],
    }

    chart.setOption(option, true)

    // 注册点击事件（下钻入口）
    chart.off('click')
    chart.on('click', (params: any) => {
      if (params.componentType === 'series' && params.seriesType === 'scatter') {
        const dataIndex = params.dataIndex
        const point = displayData[dataIndex]
        if (point) {
          handlePointClick(point)
        }
      }
    })

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
  }, [displayData, trendLineData])

  // 清理
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [])

  /**
   * 处理风险点点击事件
   */
  const handlePointClick = (point: ChartDataPoint) => {
    console.log('🔍 下钻分析：', point)
    setSelectedPoint(point)

    // TODO: 集成下钻逻辑
    // 可以触发筛选器更新、打开详情面板等
    // 例如：
    // updateFilters({
    //   years: [point.year],
    //   weeks: [point.weekNumber],
    // })
    // router.push('/detail-analysis')

    alert(`点击了 ${point.week}\n将进入车型/机构剖面下钻分析`)
  }

  if (!displayData || displayData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur">
        <div className="text-center text-slate-500">暂无周度趋势数据</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/60 p-6 shadow-lg backdrop-blur">
      {/* 趋势图标题 - 核心观点 */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">
              📈 趋势洞察：{stats.totalRiskWeeks > 0 
                ? `赔付率连续${stats.totalRiskWeeks}周预警，经营风险上升` 
                : `经营态势平稳，保费增长${displayData.length > 1 
                  ? displayData[displayData.length - 1].signedPremium > displayData[displayData.length - 2].signedPremium 
                    ? '向好' 
                    : '承压'
                  : '稳定'}`}
            </h3>
            {displayData.length > 0 && (
              <span className="text-sm text-slate-500">
                {displayData[displayData.length - 1].year}年第
                {displayData[displayData.length - 1].weekNumber}周
              </span>
            )}
          </div>
          
          {/* 统计标签 */}
          <div className="flex flex-wrap items-center gap-2">
            {stats.totalRiskWeeks > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="font-medium text-rose-700">
                  {stats.totalRiskWeeks} 个高风险周
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图表容器 */}
      <div ref={chartRef} style={{ width: '100%', height: '480px' }} />

      {/* 操作提示 */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>💡 提示：点击橙色风险点可进入下钻分析</span>
          <span>• 拖动时间轴可缩放查看</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
          <span>签单保费</span>
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-orange-500"></span>
          <span>赔付率</span>
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-red-500"></span>
          <span>阈值 70%</span>
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-purple-500"></span>
          <span>趋势线</span>
        </div>
      </div>

      {/* 经营摘要 - 交换到下部 */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-semibold text-slate-900">
                📊 详细经营分析
              </h4>
            </div>
            {analysisNarrative ? (
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>{analysisNarrative.overview}</p>
                <p>{analysisNarrative.lossTrend}</p>

                {analysisNarrative.businessLines.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700">业务类型异常</p>
                    <ul className="list-disc space-y-1 pl-5 text-slate-600">
                      {analysisNarrative.businessLines.map((line, index) => (
                        <li key={`business-${index}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisNarrative.organizationLines.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700">机构集中区域</p>
                    <ul className="list-disc space-y-1 pl-5 text-slate-600">
                      {analysisNarrative.organizationLines.map(
                        (line, index) => (
                          <li key={`organization-${index}`}>{line}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysisNarrative.insight && (
                  <p>{analysisNarrative.insight}</p>
                )}

                <div className="space-y-1">
                  <p className="font-medium text-slate-700">管理建议</p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-600">
                    {analysisNarrative.actionLines.map((line, index) => (
                      <li key={`action-${index}`}>{line}</li>
                    ))}
                  </ul>
                </div>

                <p>{analysisNarrative.followUp}</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600">
                {operationalSummary}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

WeeklyOperationalTrend.displayName = 'WeeklyOperationalTrend'
