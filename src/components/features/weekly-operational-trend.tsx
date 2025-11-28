'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts'
import { AlertTriangle } from 'lucide-react'
import { useTrendData } from '@/hooks/use-trend'
import { applyFilters } from '@/hooks/use-filtered-data'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { useAppStore, type AppState } from '@/store/use-app-store'
import type { FilterState, InsuranceRecord } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('WeeklyOperationalTrend')
import {
  LOSS_RISK_THRESHOLD,
  type ChartDataPoint,
  type NarrativeSummary,
  calculateTrendLine,
  generateOperationalSummary,
  formatDeltaPercentPoint,
  formatDeltaAmountWan,
  createWeekScopedFilters,
  describeFilters,
  aggregateTotals,
  computeLossRatio,
  formatFilterList,
  buildDimensionHighlights,
} from './weekly-operational-trend/index'
import { createWeeklyTrendChartOption } from './weekly-operational-trend/chart-config'

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

/**
 * 周度经营趋势图表组件
 */
export const WeeklyOperationalTrend = React.memo(
  function WeeklyOperationalTrend() {
    const trendData = useTrendData()
    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstanceRef = useRef<echarts.ECharts | null>(null)
    const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(
      null
    )
    const dataViewType = useAppStore((state: AppState) => state.filters.dataViewType)
    const filters = useAppStore((state: AppState) => state.filters)
    const rawRecords = useAppStore((state: AppState) => state.rawData)

    // 处理数据
    const chartData = useMemo(() => {
      if (!trendData || trendData.length === 0) return []

      return trendData
        .map(d => ({
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
        .map(d => d.lossRatio)
        .filter((v): v is number => v !== null)

      return {
        totalRiskWeeks: displayData.filter(d => d.isRisk).length,
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
        previousPoint !== null
          ? latestSigned - previousPoint.signedPremium
          : null
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
        createWeekScopedFilters(
          filters,
          latestPoint.year,
          latestPoint.weekNumber
        )
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
        totalsPrevious.claimPaymentYuan > 0 ||
        totalsCurrent.claimPaymentYuan > 0
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

      const coverageHotspots = formatFilterList([
        ...businessHighlights
          .map(item => item.topCoverage ?? '')
          .filter(Boolean),
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
          (businessHotspots !== '—'
            ? businessHotspots.replace(/等$/, '')
            : '重点业务')
        const primaryCoverage =
          businessHighlights[0]?.topCoverage ??
          (coverageHotspots !== '—'
            ? coverageHotspots.replace(/等$/, '')
            : '重点险别')
        const primaryOrganization =
          organizationHighlights[0]?.label ??
          (organizationHotspots !== '—'
            ? organizationHotspots.replace(/等$/, '')
            : '重点机构')
        actionLines.push(
          `作业：构建"${primaryBusiness}—${primaryCoverage}—${primaryOrganization}"风险热力图，纳入周度经营例会跟踪。`
        )
      } else {
        actionLines.push('渠道：当前未发现异常波动，维持现有巡检节奏即可。')
        actionLines.push(
          '流程：持续关注赔付率趋势，如触及阈值及时启动专项排查。'
        )
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

      // 使用提取的配置函数
      const option = createWeeklyTrendChartOption({
        displayData,
        trendLine: trendLineData,
        dataViewType: filters.dataViewType,
      })

      chart.setOption(option, true)

      // 点击事件
      chart.off('click')
      chart.on('click', (params: any) => {
        if (
          params.componentType === 'series' &&
          params.seriesType === 'scatter'
        ) {
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
    }, [displayData, trendLineData, filters.dataViewType])

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
      log.debug('下钻分析', { point })
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
        {/* 标题和经营摘要 */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  📊 周度经营趋势分析
                </h3>
                {displayData.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {displayData[displayData.length - 1].year}年第
                    {displayData[displayData.length - 1].weekNumber}周
                  </span>
                )}
              </div>
              {analysisNarrative ? (
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
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
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {operationalSummary}
                </p>
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
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
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
      </div>
    )
  }
)

WeeklyOperationalTrend.displayName = 'WeeklyOperationalTrend'
