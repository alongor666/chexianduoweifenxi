/**
 * 目标管理相关类型定义
 */

import type { DimensionType } from '@/components/dimension-selector'

export type GoalVersionType = 'INIT' | 'TUNED'

export interface GoalRow {
  bizType: string
  annualTargetInit: number
  annualTargetTuned: number
  achieved?: number
}

export interface GoalVersion {
  id: string
  type: GoalVersionType
  createdAt: string
  locked: boolean
  rows: GoalRow[]
}

export interface GoalState {
  baseYear: number
  versions: GoalVersion[]
  currentVersionId: string
  achievedMap: Record<string, number>
  // 新增：多维度支持
  currentDimension: DimensionType
  dimensionData: Record<
    DimensionType,
    {
      versions: GoalVersion[]
      currentVersionId: string
      achievedMap: Record<string, number>
    }
  >
}

export interface GoalSnapshot {
  currentVersionId: string
  versions: GoalVersion[]
  // 新增：多维度快照支持
  currentDimension: DimensionType
  dimensionData: Record<
    DimensionType,
    {
      versions: GoalVersion[]
      currentVersionId: string
      achievedMap: Record<string, number>
    }
  >
}

export interface GoalCsvRow {
  bizType: string
  annualTarget: number
}

export interface GoalCsvParseOptions {
  skipValidation?: boolean
  allowUnknownBizTypes?: boolean
  knownBusinessTypes?: string[]
  unknownBusinessStrategy?: 'block' | 'ignore'
}

export interface GoalCsvParseResult {
  success: boolean
  data: GoalCsvRow[]
  issues: CsvIssue[]
  rows?: GoalCsvRow[]
  ignoredUnknownCount?: number
}

export interface CsvIssue {
  row?: number
  field?: string
  value?: string
  message: string
  severity?: 'error' | 'warning'
  type?: string
  rowIndex?: number
  bizType?: string
  rawValue?: string
}

export class GoalCsvParseError extends Error {
  constructor(
    message: string,
    public issues: CsvIssue[]
  ) {
    super(message)
    this.name = 'GoalCsvParseError'
  }
}
