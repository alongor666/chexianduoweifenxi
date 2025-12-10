import { useMemo, useState } from 'react'
import { useTrendData, type TrendPoint } from '../../../hooks/use-trend'
import { useAppStore } from '../../../store/use-app-store'
import type { AppState } from '../../../store/types'
import { useDrillDownStore } from '../../../store/drill-down-store'
import {
  LOSS_RISK_THRESHOLD,
  generateOperationalSummary,
  calculateTrendLine,
} from './utils'
import type { ChartDataPoint } from './types'
import { useAnalysisNarrative } from './use-analysis-narrative'

export const useTrendLogic = () => {
  const trendData = useTrendData()

  // 状态管理
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(
    null
  )

  const dataViewType = useAppStore(
    (state: AppState) => state.filters.dataViewType
  )
  const filters = useAppStore((state: AppState) => state.filters)
  const rawRecords = useAppStore((state: AppState) => state.rawData)

  // 下钻相关状态
  const addDrillDownStep = useDrillDownStore(state => state.addDrillDownStep)

  // 处理数据
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return []

    return trendData
      .map((d: TrendPoint) => ({
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

  const analysisNarrative = useAnalysisNarrative({
    displayData,
    rawRecords,
    filters,
    dataViewType,
    totalRiskWeeks: stats.totalRiskWeeks,
  })

  // 计算趋势线
  const trendLineData = useMemo(() => {
    return calculateTrendLine(displayData)
  }, [displayData])

  // 处理风险点点击事件
  const handlePointClick = (point: ChartDataPoint) => {
    console.log('🔍 下钻分析：', point)
    setSelectedPoint(point)

    // 添加周次下钻步骤
    addDrillDownStep({
      dimensionKey: 'week_number',
      dimensionLabel: '周次',
      value: String(point.weekNumber),
      displayLabel: `${point.year}年第${point.weekNumber}周`,
    })
  }

  return {
    trendData,
    chartData,
    displayData,
    operationalSummary,
    stats,
    filters,
    dataViewType,
    selectedPoint,
    setSelectedPoint,
    addDrillDownStep,
    rawRecords,
    analysisNarrative,
    trendLineData,
    handlePointClick,
  }
}
