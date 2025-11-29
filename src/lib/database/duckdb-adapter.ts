/**
 * DuckDB-WASM 数据库适配器
 * 提供基于 DuckDB-WASM 的高性能数据查询能力
 *
 * @features
 * - 列式存储，查询性能优异
 * - 原生 SQL 支持
 * - 自动索引优化
 * - Web Worker 并行处理
 */

import * as duckdb from "@duckdb/duckdb-wasm";
import type { DatabaseAdapter } from "./adapter";
import { DatabaseAdapterError } from "./adapter";
import type { InsuranceRecord, FilterState } from "@/types/insurance";
import { normalizeChineseText } from "@/lib/utils";

export class DuckDBAdapter implements DatabaseAdapter {
  readonly name = "DuckDB-WASM";
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private _initialized = false;

  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * 初始化 DuckDB 数据库
   */
  async initialize(file: File): Promise<void> {
    try {
      console.log("[DuckDB] 开始初始化...");
      const startTime = performance.now();

      // 1. 加载 WASM 模块
      console.log("[DuckDB] 加载 WASM 模块...");
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      // 2. 创建 Worker 和数据库实例
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: "text/javascript",
        }),
      );

      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      console.log("[DuckDB] WASM 模块已加载");

      // 3. 注册数据库文件
      console.log(
        `[DuckDB] 读取文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      await this.db.registerFileBuffer(file.name, uint8Array);

      // 4. 打开连接并附加数据库
      this.conn = await this.db.connect();

      // 尝试打开数据库文件
      try {
        await this.conn.query(`ATTACH '${file.name}' AS main`);
        console.log("[DuckDB] 数据库文件已附加");
      } catch (e) {
        console.warn("[DuckDB] 附加数据库失败，尝试直接查询:", e);
      }

      // 5. 验证表是否存在
      const tables = await this.conn.query(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );
      const tableList = tables.toArray().map((row) => row.name);

      console.log("[DuckDB] 可用表:", tableList);

      if (!tableList.includes("insurance_records")) {
        throw new Error("未找到 insurance_records 表，请检查数据库文件");
      }

      this._initialized = true;

      const elapsed = performance.now() - startTime;
      console.log(`[DuckDB] 初始化完成，耗时 ${elapsed.toFixed(0)}ms`);

      // 6. 显示基本统计
      const stats = await this.getStatistics();
      console.log(`[DuckDB] 数据统计: ${stats.totalRecords} 条记录`);
    } catch (error) {
      console.error("[DuckDB] 初始化失败:", error);
      throw new DatabaseAdapterError(
        "初始化失败",
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 获取所有数据
   */
  async getAllData(): Promise<InsuranceRecord[]> {
    this.ensureInitialized();

    try {
      const result = await this.conn!.query("SELECT * FROM insurance_records");
      return this.arrowToRecords(result);
    } catch (error) {
      throw new DatabaseAdapterError(
        "获取数据失败",
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 根据筛选条件获取数据
   */
  async getFilteredData(filters: FilterState): Promise<InsuranceRecord[]> {
    this.ensureInitialized();

    try {
      const whereClause = this.buildWhereClause(filters);
      const sql = `SELECT * FROM insurance_records ${whereClause}`;

      console.log("[DuckDB] 执行查询:", sql.slice(0, 200));

      const result = await this.conn!.query(sql);
      return this.arrowToRecords(result);
    } catch (error) {
      console.error("[DuckDB] 查询失败:", error);
      throw new DatabaseAdapterError(
        "查询数据失败",
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 执行 SQL 查询
   */
  async query<T = any>(sql: string): Promise<T[]> {
    this.ensureInitialized();

    try {
      const result = await this.conn!.query(sql);
      return result.toArray().map((row) => row.toJSON() as T);
    } catch (error) {
      throw new DatabaseAdapterError(
        `SQL 查询失败: ${sql}`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    this.ensureInitialized();

    try {
      const result = await this.conn!.query(`
        SELECT
          COUNT(*) as totalRecords,
          SUM(signed_premium_yuan) as totalPremium,
          SUM(policy_count) as totalPolicyCount,
          MIN(snapshot_date) as minDate,
          MAX(snapshot_date) as maxDate
        FROM insurance_records
      `);

      const row = result.toArray()[0];

      // 获取唯一周次
      const weeksResult = await this.conn!.query(`
        SELECT DISTINCT week_number
        FROM insurance_records
        ORDER BY week_number
      `);
      const uniqueWeeks = weeksResult
        .toArray()
        .map((r) => Number(r.week_number));

      // 获取唯一机构
      const orgsResult = await this.conn!.query(`
        SELECT DISTINCT third_level_organization
        FROM insurance_records
        ORDER BY third_level_organization
      `);
      const uniqueOrganizations = orgsResult
        .toArray()
        .map((r) => normalizeChineseText(String(r.third_level_organization)));

      return {
        totalRecords: Number(row.totalRecords),
        totalPremium: Number(row.totalPremium),
        totalPolicyCount: Number(row.totalPolicyCount),
        uniqueWeeks,
        uniqueOrganizations,
        dateRange: {
          min: String(row.minDate),
          max: String(row.maxDate),
        },
      };
    } catch (error) {
      throw new DatabaseAdapterError(
        "获取统计信息失败",
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 清空数据
   */
  async clear(): Promise<void> {
    // DuckDB 数据库不支持动态清空，只能关闭连接
    await this.close();
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    try {
      if (this.conn) {
        await this.conn.close();
        this.conn = null;
      }

      if (this.db) {
        await this.db.terminate();
        this.db = null;
      }

      this._initialized = false;
      console.log("[DuckDB] 连接已关闭");
    } catch (error) {
      console.error("[DuckDB] 关闭连接失败:", error);
    }
  }

  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause(filters: FilterState): string {
    const conditions: string[] = [];

    // 年份筛选
    if (filters.years && filters.years.length > 0) {
      conditions.push(`policy_start_year IN (${filters.years.join(",")})`);
    }

    // 周次筛选
    if (filters.weeks && filters.weeks.length > 0) {
      conditions.push(`week_number IN (${filters.weeks.join(",")})`);
    }

    // 机构筛选
    if (filters.organizations && filters.organizations.length > 0) {
      const orgs = filters.organizations
        .map((o) => `'${this.escapeSql(o)}'`)
        .join(",");
      conditions.push(`third_level_organization IN (${orgs})`);
    }

    // 保险类型筛选
    if (filters.insuranceTypes && filters.insuranceTypes.length > 0) {
      const types = filters.insuranceTypes
        .map((t) => `'${this.escapeSql(t)}'`)
        .join(",");
      conditions.push(`insurance_type IN (${types})`);
    }

    // 业务类型筛选
    if (filters.businessTypes && filters.businessTypes.length > 0) {
      const types = filters.businessTypes
        .map((t) => `'${this.escapeSql(t)}'`)
        .join(",");
      conditions.push(`business_type_category IN (${types})`);
    }

    // 险别组合筛选
    if (filters.coverageTypes && filters.coverageTypes.length > 0) {
      const types = filters.coverageTypes
        .map((t) => `'${this.escapeSql(t)}'`)
        .join(",");
      conditions.push(`coverage_type IN (${types})`);
    }

    // 客户类别筛选
    if (filters.customerCategories && filters.customerCategories.length > 0) {
      const cats = filters.customerCategories
        .map((c) => `'${this.escapeSql(c)}'`)
        .join(",");
      conditions.push(`customer_category_3 IN (${cats})`);
    }

    // 车险评级筛选
    if (filters.vehicleGrades && filters.vehicleGrades.length > 0) {
      const grades = filters.vehicleGrades
        .map((g) => `'${this.escapeSql(g)}'`)
        .join(",");
      conditions.push(`vehicle_insurance_grade IN (${grades})`);
    }

    // 终端来源筛选
    if (filters.terminalSources && filters.terminalSources.length > 0) {
      const sources = filters.terminalSources
        .map((s) => `'${this.escapeSql(s)}'`)
        .join(",");
      conditions.push(`terminal_source IN (${sources})`);
    }

    // 新能源车筛选
    if (filters.isNewEnergy !== null && filters.isNewEnergy !== undefined) {
      conditions.push(`is_new_energy_vehicle = ${filters.isNewEnergy}`);
    }

    // 续保状态筛选
    if (filters.renewalStatuses && filters.renewalStatuses.length > 0) {
      const statuses = filters.renewalStatuses
        .map((s) => `'${this.escapeSql(s)}'`)
        .join(",");
      conditions.push(`renewal_status IN (${statuses})`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  }

  /**
   * 转换 Arrow 结果为记录数组
   */
  private arrowToRecords(result: any): InsuranceRecord[] {
    return result.toArray().map((row: any) => {
      const record: any = {};

      // 遍历所有列
      for (const field of result.schema.fields) {
        const value = row[field.name];
        record[field.name] = value;
      }

      return record as InsuranceRecord;
    });
  }

  /**
   * SQL 字符串转义
   */
  private escapeSql(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this._initialized || !this.conn) {
      throw new DatabaseAdapterError("数据库未初始化", this.name);
    }
  }
}
