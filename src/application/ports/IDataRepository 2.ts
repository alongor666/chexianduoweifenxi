/**
 * 数据仓储接口（Data Repository Port）
 *
 * 这是 Application 层定义的抽象接口，具体实现在 Infrastructure 层。
 * 遵循依赖倒置原则：高层模块不依赖低层模块，都依赖抽象。
 *
 * @layer Application
 * @depends Domain (InsuranceRecord)
 */

import type { InsuranceRecord } from '../../domain'

/**
 * 数据仓储接口
 *
 * 定义了保险数据的持久化操作规范。
 * Infrastructure 层的具体实现可以是：DuckDB、IndexedDB、Supabase 等。
 */
export interface IDataRepository {
  /**
   * 保存保险记录
   * @param records - 保险记录数组
   * @returns Promise<void>
   */
  save(records: InsuranceRecord[]): Promise<void>

  /**
   * 获取所有保险记录
   * @returns Promise<InsuranceRecord[]>
   */
  findAll(): Promise<InsuranceRecord[]>

  /**
   * 根据周次查询保险记录
   * @param weekNumber - 周次号
   * @returns Promise<InsuranceRecord[]>
   */
  findByWeek(weekNumber: number): Promise<InsuranceRecord[]>

  /**
   * 根据年份查询保险记录
   * @param year - 年份
   * @returns Promise<InsuranceRecord[]>
   */
  findByYear(year: number): Promise<InsuranceRecord[]>

  /**
   * 根据多个条件查询保险记录
   * @param filters - 筛选条件对象
   * @returns Promise<InsuranceRecord[]>
   */
  findByFilters(filters: DataFilters): Promise<InsuranceRecord[]>

  /**
   * 清空所有数据
   * @returns Promise<void>
   */
  clear(): Promise<void>

  /**
   * 获取数据统计信息
   * @returns Promise<DataStats>
   */
  getStats(): Promise<DataStats>
}

/**
 * 数据筛选条件
 */
export interface DataFilters {
  /** 年份范围 */
  years?: number[]
  /** 周次范围 */
  weekRange?: { start: number; end: number }
  /** 机构名称 */
  institutions?: string[]
  /** 客户类别3 */
  customerCategory3?: string[]
  /** 业务类别 */
  businessTypeCategory?: string[]
  /** 是否新能源 */
  isNewEnergy?: boolean
  /** 渠道 */
  channel?: string[]
}

/**
 * 数据统计信息
 */
export interface DataStats {
  /** 总记录数 */
  totalRecords: number
  /** 年份列表 */
  availableYears: number[]
  /** 周次范围 */
  weekRange: { min: number; max: number }
  /** 最后更新时间 */
  lastUpdated: Date
}
