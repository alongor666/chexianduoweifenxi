/**
 * KPI 趋势 API
 * GET /api/v1/kpi/trends - 获取多周 KPI 趋势数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/services/DataService'
import { KPIService } from '@/services/KPIService'
import type { FilterState } from '@/types/insurance'
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type GetKPITrendsResponse,
} from '@/lib/api/types'

/**
 * GET /api/v1/kpi/trends
 * 获取多周 KPI 趋势数据
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // 解析周次参数
    const weeksParam = searchParams.get('weeks')
    if (!weeksParam) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'weeks parameter is required'
        ),
        { status: 400 }
      )
    }

    let weeks: number[]
    try {
      weeks = JSON.parse(weeksParam)
      if (!Array.isArray(weeks) || weeks.length === 0) {
        throw new Error('weeks must be a non-empty array')
      }
    } catch {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.INVALID_REQUEST,
          'Invalid weeks parameter'
        ),
        { status: 400 }
      )
    }

    // 解析筛选条件
    const filtersParam = searchParams.get('filters')
    let filters: Partial<FilterState> = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch {
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.INVALID_REQUEST,
            'Invalid filters parameter'
          ),
          { status: 400 }
        )
      }
    }

    // 获取数据
    const allRecords = await DataService.fetchAllData()

    // 计算趋势
    const trendMap = KPIService.calculateTrend(allRecords, filters as FilterState, {
      weekRange: weeks,
    })

    // 转换为数组格式
    const trends: GetKPITrendsResponse['trends'] = []
    for (const [weekNumber, kpi] of trendMap.entries()) {
      trends.push({ weekNumber, kpi })
    }

    // 按周次排序
    trends.sort((a, b) => a.weekNumber - b.weekNumber)

    const response: GetKPITrendsResponse = { trends }

    return NextResponse.json(
      createSuccessResponse(response, {
        total: trends.length,
        processingTime: Date.now() - startTime,
      })
    )
  } catch (error) {
    console.error('[API] GET /api/v1/kpi/trends error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to calculate KPI trends',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}
