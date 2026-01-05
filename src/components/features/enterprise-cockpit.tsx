'use client'

import React from 'react'
import { KPIMetricsRow } from './cockpit/kpi-metrics-row'
import { StatisticsRow } from './cockpit/statistics-row'
import { TimeProgressAnalysis } from './cockpit/business-observation/TimeProgressAnalysis'
import { CostRiskAnalysis } from './cockpit/business-observation/CostRiskAnalysis'
import { ChartCardWrapper } from './cockpit/business-observation/ChartCardWrapper'
import { BusinessTypeHeatmap } from './business-type-heatmap'
import { MultiDimensionRadar } from './multi-dimension-radar'
import { PremiumAnalysisBarChart } from './structure-bar-chart'
import { DistributionPieChart } from './distribution-pie-chart'

/**
 * 企业驾驶舱主组件
 * 布局：第一行4个核心KPI + 第二行4个统计指标 + 经营观察模块
 */
export function EnterpriseCockpit() {
  return (
    <div className="space-y-6">
      {/* 第一行：核心KPI */}
      <KPIMetricsRow />

      {/* 第二行：统计指标 */}
      <StatisticsRow />

      {/* 经营观察模块：一行一个图 */}
      <TimeProgressAnalysis />
      <CostRiskAnalysis />
      <ChartCardWrapper title="业务健康度热力图">
        <BusinessTypeHeatmap />
      </ChartCardWrapper>
      <ChartCardWrapper title="多维健康度雷达">
        <MultiDimensionRadar />
      </ChartCardWrapper>
      <ChartCardWrapper title="动态条形图">
        <PremiumAnalysisBarChart />
      </ChartCardWrapper>
      <ChartCardWrapper title="占比分析">
        <DistributionPieChart />
      </ChartCardWrapper>
    </div>
  )
}
