/**
 * CSV（逗号分隔值）解析工具
 * 使用 PapaParse（CSV 解析库）实现目标数据的读取与校验
 */

import Papa from 'papaparse'
import {
  GoalCsvParseError,
  GoalCsvParseOptions,
  GoalCsvParseResult,
  CsvIssue,
  GoalCsvRow,
} from '@/types/goal'

const EXPECTED_COLUMNS = ['业务类型', '年度目标（万）'] as const

/**
 * 校验 CSV（逗号分隔值）表头
 */
function validateHeader(fields: string[] | undefined): CsvIssue[] {
  const issues: CsvIssue[] = []
  if (!fields) {
    return [
      {
        type: 'MISSING_COLUMN',
        message: 'CSV（逗号分隔值）缺少表头，无法识别字段',
      },
    ]
  }

  for (const column of EXPECTED_COLUMNS) {
    if (!fields.includes(column)) {
      issues.push({
        type: 'MISSING_COLUMN',
        message: `缺少必填列：${column}`,
      })
    }
  }
  return issues
}

/**
 * 解析 CSV（逗号分隔值）字符串
 */
export function parseGoalCsv(
  content: string,
  options: GoalCsvParseOptions
): GoalCsvParseResult {
  const parseResult = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim(),
  })

  const headerIssues = validateHeader(parseResult.meta.fields)
  const issues: CsvIssue[] = [...headerIssues]
  const rows: GoalCsvRow[] = []
  const seenBizTypes = new Set<string>()
  let ignoredUnknownCount = 0

  parseResult.data.forEach((record, index) => {
    const rowIndex = index + 2 // 考虑表头行
    const rawBizType = record['业务类型']?.trim() ?? ''
    const rawTarget = record['年度目标（万）']?.trim() ?? ''

    if (!rawBizType) {
      issues.push({
        type: 'EMPTY_VALUE',
        message: '业务类型不能为空',
        rowIndex,
      })
      return
    }

    if (seenBizTypes.has(rawBizType)) {
      issues.push({
        type: 'DUPLICATE_BIZ_TYPE',
        message: `重复的业务类型：${rawBizType}`,
        rowIndex,
        bizType: rawBizType,
      })
      return
    }

    seenBizTypes.add(rawBizType)

    if (!rawTarget) {
      issues.push({
        type: 'EMPTY_VALUE',
        message: `业务类型 ${rawBizType} 的年度目标（万）不能为空`,
        rowIndex,
        bizType: rawBizType,
      })
      return
    }

    const numericTarget = Number(rawTarget)
    if (!Number.isFinite(numericTarget)) {
      issues.push({
        type: 'NON_NUMERIC',
        message: `业务类型 ${rawBizType} 的年度目标（万）必须为数字`,
        rowIndex,
        bizType: rawBizType,
        rawValue: rawTarget,
      })
      return
    }

    if (numericTarget < 0) {
      issues.push({
        type: 'NEGATIVE_VALUE',
        message: `业务类型 ${rawBizType} 的年度目标（万）不能为负数`,
        rowIndex,
        bizType: rawBizType,
        rawValue: rawTarget,
      })
      return
    }

    const { knownBusinessTypes, unknownBusinessStrategy = 'block' } = options
    if (!knownBusinessTypes.includes(rawBizType)) {
      if (unknownBusinessStrategy === 'ignore') {
        ignoredUnknownCount += 1
        return
      }
      issues.push({
        type: 'UNKNOWN_BIZ_TYPE',
        message: `未知业务类型：${rawBizType}`,
        rowIndex,
        bizType: rawBizType,
      })
      return
    }

    rows.push({
      bizType: rawBizType,
      annualTarget: numericTarget,
    })
  })

  if (issues.length > 0) {
    throw new GoalCsvParseError('CSV（逗号分隔值）导入失败', issues)
  }

  return {
    success: true,
    data: rows,
    issues: [],
    rows,
    ignoredUnknownCount,
  }
}

/**
 * 解析浏览器文件对象
 */
export async function parseGoalCsvFile(
  file: File,
  options: GoalCsvParseOptions
): Promise<GoalCsvParseResult> {
  const content = await file.text()
  return parseGoalCsv(content, options)
}
