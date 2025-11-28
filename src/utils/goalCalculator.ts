/**
 * 目标计算工具
 * 负责达成率、缺口、占比等指标的统一计算与格式化
 */

import type { GoalRow } from '@/types/goal'

export interface GoalMetrics {
  initialAchievementRate: number | null
  tunedAchievementRate: number | null
  initialGap: number
  tunedGap: number
  shareOfTotal: number | null
}

export interface GoalDisplayRow extends GoalRow, GoalMetrics {}

const HUNDRED = 100

/**
 * 安全除法
 * 当分母为 0 时返回 null，以便在界面中展示“—”
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null
  }
  return numerator / denominator
}

/**
 * 计算单行目标指标
 */
export function calculateGoalMetrics(row: GoalRow, totalInitialTarget: number): GoalMetrics {
  const initialAchievementRate = safeDivide(row.achieved, row.annualTargetInit)
  const tunedAchievementRate = safeDivide(row.achieved, row.annualTargetTuned)
  const initialGap = row.annualTargetInit - row.achieved
  const tunedGap = row.annualTargetTuned - row.achieved
  const shareOfTotal = safeDivide(row.annualTargetInit, totalInitialTarget)

  return {
    initialAchievementRate,
    tunedAchievementRate,
    initialGap,
    tunedGap,
    shareOfTotal,
  }
}

/**
 * 构建用于展示的目标数据行
 */
export function buildGoalDisplayRow(
  row: GoalRow,
  totalInitialTarget: number
): GoalDisplayRow {
  return {
    ...row,
    ...calculateGoalMetrics(row, totalInitialTarget),
  }
}

/**
 * 达成率格式化
 */
export function formatAchievementRate(rate: number | null): string {
  if (rate === null) {
    return '—'
  }
  return `${(rate * HUNDRED).toFixed(2)}%`
}

/**
 * 缺口格式化
 */
export function formatGapValue(gap: number): string {
  return gap.toFixed(1)
}

/**
 * 占比格式化
 */
export function formatShareOfTotal(share: number | null): string {
  if (share === null) {
    return '—'
  }
  return `${(share * HUNDRED).toFixed(2)}%`
}

/**
 * 判断缺口是否为负数
 */
export function isNegativeGap(gap: number): boolean {
  return gap < 0
}

/**
 * 根据年初目标排序
 */
export function sortByInitialTarget(rows: GoalDisplayRow[]): GoalDisplayRow[] {
  return [...rows].sort((a, b) => b.annualTargetInit - a.annualTargetInit)
}
