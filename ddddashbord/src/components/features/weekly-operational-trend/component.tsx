'use client'

import React from 'react'
import { WeeklyOperationalTrendChart } from './chart'
import { AnalysisNarrative } from './narrative'
import { useTrendLogic } from './use-trend-logic'

/**
 * 周度经营趋势分析组件
 */
export const WeeklyOperationalTrend = React.memo(
  function WeeklyOperationalTrend() {
    const {
      displayData,
      operationalSummary,
      stats,
      analysisNarrative,
      trendLineData,
      handlePointClick,
    } = useTrendLogic()

    if (!displayData || displayData.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur">
          <div className="text-center text-slate-500">暂无周度趋势数据</div>
        </div>
      )
    }

    return (
      <>
        <div className="rounded-2xl border border-slate-100 bg-white/60 p-6 shadow-lg backdrop-blur">
          {/* 趋势图标题 - 核心观点 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  📈 趋势洞察：
                  {stats.totalRiskWeeks > 0
                    ? `赔付率连续${stats.totalRiskWeeks}周预警，经营风险上升`
                    : `经营态势平稳，保费增长${
                        displayData.length > 1
                          ? displayData[displayData.length - 1].signedPremium >
                            displayData[displayData.length - 2].signedPremium
                            ? '向好'
                            : '承压'
                          : '稳定'
                      }`}
                </h3>
                {displayData.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {displayData[displayData.length - 1].year}年第
                    {displayData[displayData.length - 1].weekNumber}周
                  </span>
                )}
              </div>

              {/* 统计标签 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  累计保费趋势
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  赔付率风险点
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">{operationalSummary}</p>
          </div>

          <WeeklyOperationalTrendChart
            displayData={displayData}
            trendLineData={trendLineData}
            onPointClick={handlePointClick}
          />
        </div>

        {/* 深度经营复盘 */}
        <AnalysisNarrative narrative={analysisNarrative} />
      </>
    )
  }
)
