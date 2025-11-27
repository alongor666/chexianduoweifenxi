/**
 * API Route: /api/ingest-file
 * 接收来自客户端的数据并将其持久化到数据库
 */
import { NextResponse } from 'next/server'
import type { InsuranceRecord } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('API:IngestFile')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = body.data as InsuranceRecord[]

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { message: '错误：未提供有效数据' },
        { status: 400 }
      )
    }

    log.info('收到数据，准备处理', { recordCount: data.length })

    // --- 在此调用 DataService ---
    // 这是一个占位符。在未来的步骤中，我们将在这里集成 DataService
    // 以执行"按周覆盖"的去重策略并写入 PostgreSQL 数据库。
    const processedRecords = data.length

    log.info('数据处理成功', { processedRecords })

    return NextResponse.json({
      message: '数据归档成功',
      processedRecords,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部错误'
    log.error('数据处理失败', error)
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
