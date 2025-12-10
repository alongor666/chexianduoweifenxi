/**
 * DuckDB 数据仓储实现
 *
 * 实现 IDataRepository 接口，提供基于 DuckDB-WASM 的数据持久化。
 *
 * @layer Infrastructure
 * @implements IDataRepository
 * @depends Application/Ports, Domain/Entities
 */

import * as duckdb from '@duckdb/duckdb-wasm'
import type {
  IDataRepository,
  DataFilters,
  DataStats,
} from '../../application/ports/IDataRepository'
import { InsuranceRecord } from '../../domain'
import type { RawInsuranceData } from '../../domain'
import { normalizeChineseText } from '../../domain/rules/data-normalization'

/**
 * DuckDB 仓储实现
 *
 * 提供高性能的列式存储和 SQL 查询能力。
 * 特点：
 * - 列式存储，查询性能优异
 * - 原生 SQL 支持
 * - 自动索引优化
 */
export class DuckDBRepository implements IDataRepository {
  private db: duckdb.AsyncDuckDB | null = null
  private conn: duckdb.AsyncDuckDBConnection | null = null
  private initialized = false
  private readonly tableName = 'insurance_records'
  private fullTableName = 'insurance_records'

  /**
   * 初始化数据库连接
   *
   * @param file - DuckDB 数据库文件
   */
  async initialize(file: File): Promise<void> {
    try {
      console.log('[DuckDBRepository] 开始初始化...')
      const startTime = performance.now()

      // 1. 加载 WASM 模块
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

      // 2. 创建 Worker 和数据库实例
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: 'text/javascript',
        })
      )

      const worker = new Worker(workerUrl)
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)

      this.db = new duckdb.AsyncDuckDB(logger, worker)
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)

      // 3. 打开连接
      this.conn = await this.db.connect()

      // 4. 注册并打开数据库文件
      console.log(`[DuckDBRepository] 读取文件: ${file.name}`)
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      await this.db.registerFileBuffer(file.name, uint8Array)

      // 5. 附加数据库
      try {
        await this.conn.query(`ATTACH '${file.name}' AS imported_db`)
        console.log('[DuckDBRepository] 数据库已附加')
      } catch (e) {
        console.warn('[DuckDBRepository] 附加数据库失败，尝试直接访问')
      }

      // 6. 查找表位置
      const tables = await this.conn.query(`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_name = '${this.tableName}'
      `)
      const tableList = tables.toArray()

      if (tableList.length === 0) {
        throw new Error(`未找到表 ${this.tableName}`)
      }

      const tableInfo = tableList[0] as {
        table_schema: string
        table_name: string
      }
      const schema = tableInfo.table_schema

      // 设置完整表名
      if (schema && schema !== 'main') {
        this.fullTableName = `${schema}.${this.tableName}`
      } else {
        this.fullTableName = this.tableName
      }

      this.initialized = true

      const elapsed = performance.now() - startTime
      console.log(`[DuckDBRepository] 初始化完成，耗时 ${elapsed.toFixed(0)}ms`)
    } catch (error) {
      console.error('[DuckDBRepository] 初始化失败:', error)
      throw new Error(
        `DuckDB 初始化失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 保存保险记录
   */
  async save(records: InsuranceRecord[]): Promise<void> {
    this.ensureInitialized()

    try {
      // DuckDB 已经通过文件初始化，这里不支持动态插入
      // 如果需要支持，需要创建新表或使用临时表
      throw new Error('DuckDB 仓储当前不支持动态保存，请使用文件初始化')
    } catch (error) {
      throw new Error(
        `保存数据失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 获取所有保险记录
   */
  async findAll(): Promise<InsuranceRecord[]> {
    this.ensureInitialized()

    try {
      const result = await this.conn!.query(
        `SELECT * FROM ${this.fullTableName}`
      )
      return this.arrowToRecords(result)
    } catch (error) {
      throw new Error(
        `查询所有数据失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 根据周次查询保险记录
   */
  async findByWeek(weekNumber: number): Promise<InsuranceRecord[]> {
    this.ensureInitialized()

    try {
      const sql = `
        SELECT * FROM ${this.fullTableName}
        WHERE week_number = ${weekNumber}
      `
      const result = await this.conn!.query(sql)
      return this.arrowToRecords(result)
    } catch (error) {
      throw new Error(
        `按周次查询失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 根据年份查询保险记录
   */
  async findByYear(year: number): Promise<InsuranceRecord[]> {
    this.ensureInitialized()

    try {
      const sql = `
        SELECT * FROM ${this.fullTableName}
        WHERE policy_start_year = ${year}
      `
      const result = await this.conn!.query(sql)
      return this.arrowToRecords(result)
    } catch (error) {
      throw new Error(
        `按年份查询失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 根据多个条件查询保险记录
   */
  async findByFilters(filters: DataFilters): Promise<InsuranceRecord[]> {
    this.ensureInitialized()

    try {
      const whereClause = this.buildWhereClause(filters)
      const sql = `SELECT * FROM ${this.fullTableName} ${whereClause}`

      console.log('[DuckDBRepository] 执行查询:', sql.substring(0, 200))

      const result = await this.conn!.query(sql)
      return this.arrowToRecords(result)
    } catch (error) {
      throw new Error(
        `按条件查询失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    // DuckDB 数据库不支持动态清空，只能关闭连接
    await this.close()
  }

  /**
   * 获取数据统计信息
   */
  async getStats(): Promise<DataStats> {
    this.ensureInitialized()

    try {
      // 获取基本统计
      const statsResult = await this.conn!.query(`
        SELECT
          COUNT(*) as total_records,
          MIN(snapshot_date) as min_date,
          MAX(snapshot_date) as max_date
        FROM ${this.fullTableName}
      `)
      const statsRow = statsResult.toArray()[0]

      // 获取唯一年份
      const yearsResult = await this.conn!.query(`
        SELECT DISTINCT policy_start_year
        FROM ${this.fullTableName}
        ORDER BY policy_start_year
      `)
      const availableYears = yearsResult
        .toArray()
        .map((r: any) => Number(r.policy_start_year))

      // 获取周次范围
      const weekResult = await this.conn!.query(`
        SELECT
          MIN(week_number) as min_week,
          MAX(week_number) as max_week
        FROM ${this.fullTableName}
      `)
      const weekRow = weekResult.toArray()[0]

      return {
        totalRecords: Number(statsRow.total_records),
        availableYears,
        weekRange: {
          min: Number(weekRow.min_week),
          max: Number(weekRow.max_week),
        },
        lastUpdated: new Date(),
      }
    } catch (error) {
      throw new Error(
        `获取统计信息失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    try {
      if (this.conn) {
        await this.conn.close()
        this.conn = null
      }

      if (this.db) {
        await this.db.terminate()
        this.db = null
      }

      this.initialized = false
      console.log('[DuckDBRepository] 连接已关闭')
    } catch (error) {
      console.error('[DuckDBRepository] 关闭连接失败:', error)
    }
  }

  // ============= 私有辅助方法 =============

  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause(filters: DataFilters): string {
    const conditions: string[] = []

    // 年份筛选
    if (filters.years && filters.years.length > 0) {
      conditions.push(`policy_start_year IN (${filters.years.join(',')})`)
    }

    // 周次范围筛选
    if (filters.weekRange) {
      conditions.push(
        `week_number BETWEEN ${filters.weekRange.start} AND ${filters.weekRange.end}`
      )
    }

    // 机构筛选
    if (filters.institutions && filters.institutions.length > 0) {
      const orgs = filters.institutions
        .map(o => `'${this.escapeSql(o)}'`)
        .join(',')
      conditions.push(`third_level_organization IN (${orgs})`)
    }

    // 客户类别筛选
    if (filters.customerCategory3 && filters.customerCategory3.length > 0) {
      const cats = filters.customerCategory3
        .map(c => `'${this.escapeSql(c)}'`)
        .join(',')
      conditions.push(`customer_category_3 IN (${cats})`)
    }

    // 业务类别筛选
    if (
      filters.businessTypeCategory &&
      filters.businessTypeCategory.length > 0
    ) {
      const types = filters.businessTypeCategory
        .map(t => `'${this.escapeSql(t)}'`)
        .join(',')
      conditions.push(`business_type_category IN (${types})`)
    }

    // 新能源车筛选
    if (filters.isNewEnergy !== null && filters.isNewEnergy !== undefined) {
      conditions.push(`is_new_energy_vehicle = ${filters.isNewEnergy}`)
    }

    // 渠道筛选
    if (filters.channel && filters.channel.length > 0) {
      const channels = filters.channel
        .map(c => `'${this.escapeSql(c)}'`)
        .join(',')
      conditions.push(`terminal_source IN (${channels})`)
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  }

  /**
   * 转换 Arrow 结果为记录数组
   */
  private arrowToRecords(result: any): InsuranceRecord[] {
    return result.toArray().map((row: any) => {
      const rawData: RawInsuranceData = {
        snapshot_date: String(row.snapshot_date),
        policy_start_year: Number(row.policy_start_year),
        week_number: Number(row.week_number),
        chengdu_branch: row.chengdu_branch,
        third_level_organization: normalizeChineseText(
          String(row.third_level_organization)
        ),
        customer_category_3: normalizeChineseText(
          String(row.customer_category_3)
        ),
        insurance_type: row.insurance_type,
        business_type_category: normalizeChineseText(
          String(row.business_type_category)
        ),
        coverage_type: row.coverage_type,
        renewal_status: row.renewal_status,
        is_new_energy_vehicle: Boolean(row.is_new_energy_vehicle),
        is_transferred_vehicle: Boolean(row.is_transferred_vehicle),
        vehicle_insurance_grade: row.vehicle_insurance_grade ?? null,
        highway_risk_grade: row.highway_risk_grade ?? null,
        large_truck_score: row.large_truck_score ?? null,
        small_truck_score: row.small_truck_score ?? null,
        terminal_source: normalizeChineseText(String(row.terminal_source)),
        signed_premium_yuan: Number(row.signed_premium_yuan),
        matured_premium_yuan: Number(row.matured_premium_yuan),
        policy_count: Number(row.policy_count),
        claim_case_count: Number(row.claim_case_count),
        reported_claim_payment_yuan: Number(row.reported_claim_payment_yuan),
        expense_amount_yuan: Number(row.expense_amount_yuan),
        commercial_premium_before_discount_yuan: Number(
          row.commercial_premium_before_discount_yuan
        ),
        premium_plan_yuan: row.premium_plan_yuan
          ? Number(row.premium_plan_yuan)
          : null,
        marginal_contribution_amount_yuan: Number(
          row.marginal_contribution_amount_yuan
        ),
      }

      // 使用 Domain 实体的工厂方法创建实例
      return InsuranceRecord.fromRawData(rawData)
    })
  }

  /**
   * SQL 字符串转义
   */
  private escapeSql(value: string): string {
    return value.replace(/'/g, "''")
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.conn) {
      throw new Error('数据库未初始化')
    }
  }
}
