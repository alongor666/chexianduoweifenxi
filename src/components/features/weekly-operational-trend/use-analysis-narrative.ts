import { useMemo } from 'react'
import type { FilterState, InsuranceRecord } from '@/types/insurance'
import { formatNumber, formatPercent } from '@/utils/format'
import {
  LOSS_RISK_THRESHOLD,
  describeFilters,
  createWeekScopedFilters,
  aggregateTotals,
  computeLossRatio,
  buildDimensionHighlights,
  formatDeltaPercentPoint,
  formatDeltaAmountWan,
  formatFilterList,
} from './utils'
import { generateActionLines } from './summary-utils'
import { applyFilters } from '@/hooks/use-filtered-data'
import type { ChartDataPoint, NarrativeSummary } from './types'

interface UseAnalysisNarrativeProps {
  displayData: ChartDataPoint[]
  rawRecords: InsuranceRecord[]
  filters: FilterState
  dataViewType: 'current' | 'increment'
  totalRiskWeeks: number
}

export const useAnalysisNarrative = ({
  displayData,
  rawRecords,
  filters,
  dataViewType,
  totalRiskWeeks,
}: UseAnalysisNarrativeProps) => {
  return useMemo<NarrativeSummary | null>(() => {
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
      .map(d => d.signedPremium)
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
        : totalRiskWeeks > 0
          ? `本期共出现 ${totalRiskWeeks} 个预警周`
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

    const coverageHotspots = formatFilterList([
      ...businessHighlights.map(item => item.topCoverage ?? '').filter(Boolean),
      ...organizationHighlights
        .map(item => item.topCoverage ?? '')
        .filter(Boolean),
    ])
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

    const actionLines = generateActionLines(
      businessHighlights,
      organizationHighlights,
      coverageHotspots,
      businessHotspots,
      organizationHotspots,
      hasHighlights
    )

    const followUpLine = `【后续跟踪】请于下周周例会上复盘整改进度，并持续关注第${
      latestPoint.weekNumber + 1
    }周实时赔付表现。`

    return {
      overview: overviewLine,
      lossTrend: lossTrendLine,
      businessLines,
      organizationLines,
      insight: insightLineText,
      actionLines,
      followUp: `${followUpLine}`,
    }
  }, [dataViewType, displayData, filters, rawRecords, totalRiskWeeks])
}
