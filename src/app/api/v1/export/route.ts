/**
 * 数据导出 API
 * POST /api/v1/export - 导出数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/services/DataService'
import type { FilterState, InsuranceRecord } from '@/types/insurance'
import {
  createErrorResponse,
  ErrorCodes,
  type ExportRequest,
} from '@/lib/api/types'

/**
 * 将记录转换为 CSV 格式
 */
function recordsToCSV(
  records: InsuranceRecord[],
  columns?: Array<keyof InsuranceRecord>
): string {
  if (records.length === 0) {
    return ''
  }

  // 使用指定列或全部列
  const cols = columns || (Object.keys(records[0]) as Array<keyof InsuranceRecord>)

  // CSV 头部
  const header = cols.join(',')

  // CSV 行
  const rows = records.map(record => {
    return cols
      .map(col => {
        const value = record[col]
        // 处理特殊字符
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * POST /api/v1/export
 * 导出数据
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()

    // 验证格式参数
    const supportedFormats = ['csv', 'xlsx', 'pdf']
    if (!body.format || !supportedFormats.includes(body.format)) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          `format must be one of: ${supportedFormats.join(', ')}`
        ),
        { status: 400 }
      )
    }

    // 获取数据
    const allRecords = await DataService.fetchAllData()

    // 应用筛选
    const filteredRecords = body.filters
      ? DataService.filter(allRecords, body.filters as FilterState)
      : allRecords

    if (filteredRecords.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.NOT_FOUND,
          'No records match the given filters'
        ),
        { status: 404 }
      )
    }

    // 根据格式导出
    switch (body.format) {
      case 'csv': {
        const csv = recordsToCSV(filteredRecords, body.columns)
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="insurance_data_${Date.now()}.csv"`,
          },
        })
      }

      case 'xlsx': {
        // xlsx 格式需要额外的库，当前返回未实现
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'xlsx format is not yet implemented'
          ),
          { status: 501 }
        )
      }

      case 'pdf': {
        // pdf 格式需要额外的库，当前返回未实现
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'pdf format is not yet implemented'
          ),
          { status: 501 }
        )
      }

      default:
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Unsupported format'
          ),
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[API] POST /api/v1/export error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to export data',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}
