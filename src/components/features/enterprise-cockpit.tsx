'use client'

import React from 'react'
import { KPIMetricsRow } from './cockpit/kpi-metrics-row'
import { StatisticsRow } from './cockpit/statistics-row'
import { TimeProgressAnalysis } from './cockpit/business-observation/TimeProgressAnalysis'
import { CostRiskAnalysis } from './cockpit/business-observation/CostRiskAnalysis'
import { BusinessHealthHeatmap } from './cockpit/business-observation/BusinessHealthHeatmap'
import { MultiDimensionRadarWrapper } from './cockpit/business-observation/MultiDimensionRadarWrapper'
import { DynamicBarChart } from './cockpit/business-observation/DynamicBarChart'
import { ProportionChart } from './cockpit/business-observation/ProportionChart'

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
      <BusinessHealthHeatmap />
      <MultiDimensionRadarWrapper />
      <DynamicBarChart />
      <ProportionChart />
    </div>
  )
}
