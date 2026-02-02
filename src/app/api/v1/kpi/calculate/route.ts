/**
 * KPI 计算 API
 * POST /api/v1/kpi/calculate - 计算 KPI 指标
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/services/DataService'
import { KPIService } from '@/services/KPIService'
import type { FilterState } from '@/types/insurance'
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type CalculateKPIRequest,
  type CalculateKPIResponse,
} from '@/lib/api/types'

/**
 * POST /api/v1/kpi/calculate
 * 计算 KPI 指标
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: CalculateKPIRequest = await request.json()

    // 验证请求体
    if (!body.filters) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'filters is required'
        ),
        { status: 400 }
      )
    }

    // 获取数据（注意：服务端 API 依赖远程数据源）
    const allRecords = await DataService.fetchAllData()

    // 应用筛选
    const filteredRecords = DataService.filter(
      allRecords,
      body.filters as FilterState
    )

    if (filteredRecords.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.NOT_FOUND,
          'No records match the given filters'
        ),
        { status: 404 }
      )
    }

    // 计算 KPI
    const kpi = KPIService.calculate(filteredRecords, {
      annualTargetYuan: body.options?.annualTargetYuan,
      mode: body.options?.mode || 'current',
      currentWeekNumber: body.options?.currentWeekNumber,
      year: body.options?.year,
    })

    if (!kpi) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to calculate KPI'
        ),
        { status: 500 }
      )
    }

    // 计算对比数据（如果需要）
    let comparison: CalculateKPIResponse['comparison'] = undefined

    if (body.options?.includeComparison && body.options?.currentWeekNumber) {
      const comparisonResult = KPIService.calculateSmartComparison(
        allRecords,
        body.options.currentWeekNumber,
        body.filters as FilterState,
        body.options.annualTargetYuan
      )

      comparison = {
        previousKpi: comparisonResult.compareKpi,
        previousWeekNumber: comparisonResult.previousWeekNumber,
      }
    }

    const response: CalculateKPIResponse = {
      kpi,
      comparison,
      recordCount: filteredRecords.length,
    }

    return NextResponse.json(
      createSuccessResponse(response, {
        processingTime: Date.now() - startTime,
      })
    )
  } catch (error) {
    console.error('[API] POST /api/v1/kpi/calculate error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to calculate KPI',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}
