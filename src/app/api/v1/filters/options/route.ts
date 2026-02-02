/**
 * 筛选选项 API
 * GET /api/v1/filters/options - 获取可用的筛选选项
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/services/DataService'
import type { FilterState } from '@/types/insurance'
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type GetFilterOptionsResponse,
} from '@/lib/api/types'

/**
 * GET /api/v1/filters/options
 * 获取可用的筛选选项
 * 支持基于当前筛选上下文动态计算可用选项
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // 解析上下文筛选条件（用于级联筛选）
    const contextParam = searchParams.get('context')
    let context: Partial<FilterState> = {}
    if (contextParam) {
      try {
        context = JSON.parse(contextParam)
      } catch {
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.INVALID_REQUEST,
            'Invalid context parameter'
          ),
          { status: 400 }
        )
      }
    }

    // 获取数据
    const allRecords = await DataService.fetchAllData()

    // 如果有上下文，先应用筛选
    const contextRecords =
      Object.keys(context).length > 0
        ? DataService.filter(allRecords, context as FilterState)
        : allRecords

    // 提取唯一值
    const uniqueValues = {
      years: new Set<number>(),
      weeks: new Set<number>(),
      organizations: new Set<string>(),
      insuranceTypes: new Set<string>(),
      businessTypes: new Set<string>(),
      coverageTypes: new Set<string>(),
      customerCategories: new Set<string>(),
      vehicleGrades: new Set<string>(),
      terminalSources: new Set<string>(),
      renewalStatuses: new Set<string>(),
    }

    for (const record of contextRecords) {
      // 时间维度
      if (record.policy_start_year) {
        uniqueValues.years.add(record.policy_start_year)
      }
      if (record.week_number) {
        uniqueValues.weeks.add(record.week_number)
      }

      // 组织维度
      if (record.third_level_organization) {
        uniqueValues.organizations.add(record.third_level_organization)
      }

      // 产品维度
      if (record.insurance_type) {
        uniqueValues.insuranceTypes.add(record.insurance_type)
      }
      if (record.business_type_category) {
        uniqueValues.businessTypes.add(record.business_type_category)
      }
      if (record.coverage_type) {
        uniqueValues.coverageTypes.add(record.coverage_type)
      }

      // 客户维度
      if (record.customer_category_3) {
        uniqueValues.customerCategories.add(record.customer_category_3)
      }
      if (record.vehicle_insurance_grade) {
        uniqueValues.vehicleGrades.add(record.vehicle_insurance_grade)
      }

      // 渠道维度
      if (record.terminal_source) {
        uniqueValues.terminalSources.add(record.terminal_source)
      }

      // 业务属性
      if (record.renewal_status) {
        uniqueValues.renewalStatuses.add(record.renewal_status)
      }
    }

    // 转换为数组并排序
    const response: GetFilterOptionsResponse = {
      options: {
        years: Array.from(uniqueValues.years).sort((a, b) => b - a), // 年份降序
        weeks: Array.from(uniqueValues.weeks).sort((a, b) => a - b), // 周次升序
        organizations: Array.from(uniqueValues.organizations).sort(),
        insuranceTypes: Array.from(uniqueValues.insuranceTypes).sort(),
        businessTypes: Array.from(uniqueValues.businessTypes).sort(),
        coverageTypes: Array.from(uniqueValues.coverageTypes).sort(),
        customerCategories: Array.from(uniqueValues.customerCategories).sort(),
        vehicleGrades: Array.from(uniqueValues.vehicleGrades).sort(),
        terminalSources: Array.from(uniqueValues.terminalSources).sort(),
        renewalStatuses: Array.from(uniqueValues.renewalStatuses).sort(),
      },
    }

    return NextResponse.json(
      createSuccessResponse(response, {
        processingTime: Date.now() - startTime,
      })
    )
  } catch (error) {
    console.error('[API] GET /api/v1/filters/options error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to get filter options',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}
