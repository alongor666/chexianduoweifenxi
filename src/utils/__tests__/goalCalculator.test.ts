import { describe, expect, it } from 'vitest'
import {
  buildGoalDisplayRow,
  calculateGoalMetrics,
  formatAchievementRate,
  formatGapValue,
  safeDivide,
} from '../goalCalculator'

const sampleRow = {
  bizType: '示例业务',
  annualTargetInit: 100,
  annualTargetTuned: 80,
  achieved: 120,
}

describe('goalCalculator', () => {
  it('handles division by zero gracefully', () => {
    expect(safeDivide(10, 0)).toBeNull()
  })

  it('calculates metrics with over achievement', () => {
    const metrics = calculateGoalMetrics(sampleRow, 500)
    expect(metrics.initialGap).toBe(-20)
    expect(metrics.tunedGap).toBe(40)
    expect(metrics.initialAchievementRate).toBeCloseTo(1.2)
    expect(metrics.tunedAchievementRate).toBeCloseTo(1.5)
  })

  it('formats output correctly', () => {
    expect(formatAchievementRate(1.2345)).toBe('123.45%')
    expect(formatAchievementRate(null)).toBe('—')
    expect(formatGapValue(-12.345)).toBe('-12.3')
  })

  it('builds display row with share of total', () => {
    const display = buildGoalDisplayRow(sampleRow, 1000)
    expect(display.shareOfTotal).toBeCloseTo(0.1)
    expect(display.initialAchievementRate).toBeCloseTo(1.2)
  })
})
