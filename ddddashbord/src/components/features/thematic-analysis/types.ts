/**
 * 主题分析模块 - 类型定义
 */

import type { KPIResult } from '@/types/insurance'
import type {
  PremiumDimensionKey,
  PremiumDimensionItem,
} from '@/hooks/use-premium-dimension-analysis'
import type {
  LossDimensionKey,
  LossDimensionItem,
} from '@/hooks/use-loss-dimension-analysis'

// ============= 主组件 Props =============

export interface ThematicAnalysisProps {
  /**
   * 当前周期的 KPI 数据
   */
  currentKpis: KPIResult | null

  /**
   * 对比周期的 KPI 数据（用于环比计算）
   */
  compareKpis?: KPIResult | null

  /**
   * 时间进度百分比（0-100）
   */
  timeProgress: number

  /**
   * 年度保费目标（万元）
   */
  annualPremiumTarget?: number

  /**
   * 紧凑模式（用于顶部横向布局）
   */
  compact?: boolean

  /**
   * 自定义类名
   */
  className?: string
}

// ============= 卡片组件 Props =============

export interface TimeProgressAnalysisCardProps {
  title: string
  description: string
  objectiveKpi: number | null // 核心目标KPI：时间进度达成率（驱动色彩和主数值）
  achievedValue: number | null // 已达成绝对值
  targetValue: number | null // 目标绝对值
  achievementRate: number | null // 年度达成率
  timeProgress: number // 时间进度百分比
  unit?: string
  compact?: boolean
}

export interface RatioOverviewCardProps {
  title: string
  description: string
  kpiValue: number | null
  formatAsPercent?: boolean
  compact?: boolean
}

export interface TrendAnalysisCardProps {
  title: string
  currentValue: number | null
  previousValue: number | null
  higherIsBetter: boolean
  unit?: string
  compact?: boolean
}

export interface AnalysisSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

export interface PremiumProgressCardProps {
  item: PremiumDimensionItem
  compact?: boolean
}

export interface PolicyProgressCardProps {
  item: PremiumDimensionItem
  compact?: boolean
}

export interface AveragePremiumCardProps {
  item: PremiumDimensionItem
  compact?: boolean
}

export interface LossRatioRiskCardProps {
  item: LossDimensionItem
  compact?: boolean
}

export type LossTrendMetricKey =
  | 'loss_amount'
  | 'claim_count'
  | 'avg_claim_amount'

export interface LossTrendCardProps {
  item: LossDimensionItem
  metricKey: LossTrendMetricKey
  compact?: boolean
}

export interface MarginRatioGridCardProps {
  currentKpis: KPIResult | null
  compareKpis: KPIResult | null
  compact?: boolean
}

export interface MarginAmountGridCardProps {
  currentKpis: KPIResult | null
  compareKpis: KPIResult | null
  compact?: boolean
}

export interface TabContentProps {
  currentKpis: KPIResult | null
  compareKpis?: KPIResult | null
  timeProgress: number
  annualPremiumTarget?: number
  compact?: boolean
}

// ============= 导出维度类型（重新导出） =============

export type { PremiumDimensionKey, PremiumDimensionItem }
export type { LossDimensionKey, LossDimensionItem }
