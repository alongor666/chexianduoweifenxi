import { describe, expect, it } from 'vitest'
import { parseGoalCsv } from '../csvParser'
import { GoalCsvParseError } from '@/types/goal'
import { KNOWN_BUSINESS_TYPES } from '@/store/goalStore'

const validCsv = `业务类型,年度目标（万）\n车险整体,100\n网约车,200\n`

describe('parseGoalCsv', () => {
  it('parses valid csv data', () => {
    const result = parseGoalCsv(validCsv, {
      knownBusinessTypes: KNOWN_BUSINESS_TYPES,
    })
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ bizType: '车险整体', annualTarget: 100 })
  })

  it('throws when required columns missing', () => {
    const csv = `业务类型\n车险整体`
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      })
    ).toThrow(GoalCsvParseError)
  })

  it('throws when encountering non numeric value', () => {
    const csv = `业务类型,年度目标（万）\n车险整体,abc`
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      })
    ).toThrow(GoalCsvParseError)
  })

  it('throws when duplicate business types found', () => {
    const csv = `业务类型,年度目标（万）\n车险整体,100\n车险整体,120`
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      })
    ).toThrow(GoalCsvParseError)
  })

  it('throws on unknown business type by default', () => {
    const csv = `业务类型,年度目标（万）\n未知业务,100`
    expect(() =>
      parseGoalCsv(csv, {
        knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      })
    ).toThrow(GoalCsvParseError)
  })

  it('ignores unknown business type when configured', () => {
    const csv = `业务类型,年度目标（万）\n未知业务,100`
    const result = parseGoalCsv(csv, {
      knownBusinessTypes: KNOWN_BUSINESS_TYPES,
      unknownBusinessStrategy: 'ignore',
    })
    expect(result.rows).toHaveLength(0)
    expect(result.ignoredUnknownCount).toBe(1)
  })
})
