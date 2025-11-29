/**
 * 数据库适配器接口
 * 定义统一的数据库操作接口，支持多种数据库后端
 *
 * @architecture 适配器模式
 * - 允许在不修改上层代码的情况下切换数据库实现
 * - 支持 IndexedDB、DuckDB-WASM 等多种后端
 */

import type { InsuranceRecord, FilterState } from "@/types/insurance";

/**
 * 数据库适配器接口
 */
export interface DatabaseAdapter {
  /**
   * 适配器名称
   */
  readonly name: string;

  /**
   * 是否已初始化
   */
  readonly initialized: boolean;

  /**
   * 初始化数据库
   * @param file 数据文件（CSV 或 DuckDB 文件）
   */
  initialize(file: File): Promise<void>;

  /**
   * 获取所有原始数据
   */
  getAllData(): Promise<InsuranceRecord[]>;

  /**
   * 根据筛选条件获取数据
   * @param filters 筛选条件
   */
  getFilteredData(filters: FilterState): Promise<InsuranceRecord[]>;

  /**
   * 执行 SQL 查询（可选，仅SQL数据库支持）
   * @param sql SQL 查询语句
   */
  query?<T = any>(sql: string): Promise<T[]>;

  /**
   * 获取数据统计信息
   */
  getStatistics(): Promise<{
    totalRecords: number;
    totalPremium: number;
    totalPolicyCount: number;
    uniqueWeeks: number[];
    uniqueOrganizations: string[];
    dateRange: { min: string; max: string } | null;
  }>;

  /**
   * 清空数据
   */
  clear(): Promise<void>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;
}

/**
 * 数据库适配器工厂
 */
export class DatabaseAdapterFactory {
  /**
   * 创建适配器实例
   * @param type 适配器类型
   */
  static create(type: "indexeddb" | "duckdb"): DatabaseAdapter {
    switch (type) {
      case "duckdb": {
        // 动态导入避免未使用时加载
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { DuckDBAdapter } = require("./duckdb-adapter");
        return new DuckDBAdapter();
      }

      case "indexeddb":
      default: {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { IndexedDBAdapter } = require("./indexeddb-adapter");
        return new IndexedDBAdapter();
      }
    }
  }

  /**
   * 根据文件类型自动选择适配器
   * @param file 数据文件
   */
  static createFromFile(file: File): DatabaseAdapter {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "duckdb" || extension === "db") {
      return this.create("duckdb");
    }

    // 默认使用 IndexedDB（支持 CSV）
    return this.create("indexeddb");
  }
}

/**
 * 数据库适配器错误类
 */
export class DatabaseAdapterError extends Error {
  constructor(
    message: string,
    public readonly adapterName: string,
    public readonly originalError?: Error,
  ) {
    super(`[${adapterName}] ${message}`);
    this.name = "DatabaseAdapterError";
  }
}
