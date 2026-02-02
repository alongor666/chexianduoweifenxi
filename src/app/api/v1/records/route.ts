/**
 * 保险记录 API
 * GET /api/v1/records - 查询记录
 * POST /api/v1/records - 创建/导入记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/services/DataService'
import type { FilterState } from '@/types/insurance'
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type GetRecordsResponse,
  type CreateRecordsRequest,
  type CreateRecordsResponse,
} from '@/lib/api/types'

/**
 * GET /api/v1/records
 * 查询保险记录
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    // 解析查询参数
    const filtersParam = searchParams.get('filters')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '1000', 10)

    // 解析筛选条件
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

    // 注意：当前实现是本地模式，数据来自前端 localStorage
    // 服务端 API 主要用于 SSR 或远程数据源模式
    const allRecords = await DataService.fetchAllData()

    // 应用筛选
    const filteredRecords = DataService.filter(allRecords, filters as FilterState)

    // 分页
    const total = filteredRecords.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

    const response: GetRecordsResponse = {
      records: paginatedRecords,
      total,
    }

    return NextResponse.json(
      createSuccessResponse(response, {
        total,
        page,
        pageSize,
        processingTime: Date.now() - startTime,
      })
    )
  } catch (error) {
    console.error('[API] GET /api/v1/records error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to fetch records',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/records
 * 创建/导入保险记录
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: CreateRecordsRequest = await request.json()

    // 验证请求体
    if (!body.records || !Array.isArray(body.records)) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'records must be a non-empty array'
        ),
        { status: 400 }
      )
    }

    if (body.records.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'records array cannot be empty'
        ),
        { status: 400 }
      )
    }

    // 数据处理逻辑
    // 注意：当前实现是占位符，实际数据存储由前端 localStorage 处理
    // 未来可以集成数据库写入
    const processedCount = body.records.length
    let successCount = 0
    const errors: Array<{ index: number; message: string }> = []

    // 简单验证每条记录
    for (let i = 0; i < body.records.length; i++) {
      const record = body.records[i]

      // 基础字段验证
      if (
        typeof record.signed_premium_yuan !== 'number' ||
        typeof record.policy_count !== 'number'
      ) {
        errors.push({
          index: i,
          message: 'Missing required numeric fields',
        })
        continue
      }

      successCount++
    }

    const response: CreateRecordsResponse = {
      processedCount,
      successCount,
      failedCount: processedCount - successCount,
      errors: errors.length > 0 ? errors : undefined,
    }

    return NextResponse.json(
      createSuccessResponse(response, {
        processingTime: Date.now() - startTime,
      })
    )
  } catch (error) {
    console.error('[API] POST /api/v1/records error:', error)
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to create records',
        error instanceof Error ? error.message : undefined
      ),
      { status: 500 }
    )
  }
}
