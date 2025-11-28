/**
 * 数据服务（Data Service）
 *
 * 提供数据查询和管理的高级接口，封装常用的数据操作。
 *
 * @layer Application
 * @depends Domain (InsuranceRecord)
 * @depends Ports (IDataRepository)
 */

import type { IDataRepository, DataFilters, DataStats } from '../ports'
import type { InsuranceRecord } from '../../domain'

/**
 * 数据服务
 *
 * 提供数据的统一访问接口，简化上层调用。
 */
export class DataService {
  constructor(private readonly repository: IDataRepository) {}

  /**
   * 获取所有数据
   *
   * @returns Promise<InsuranceRecord[]>
   */
  async getAllData(): Promise<InsuranceRecord[]> {
    return await this.repository.findAll()
  }

  /**
   * 根据筛选条件获取数据
   *
   * @param filters - 筛选条件
   * @returns Promise<InsuranceRecord[]>
   */
  async getFilteredData(filters: DataFilters): Promise<InsuranceRecord[]> {
    return await this.repository.findByFilters(filters)
  }

  /**
   * 根据周次获取数据
   *
   * @param weekNumber - 周次号
   * @returns Promise<InsuranceRecord[]>
   */
  async getDataByWeek(weekNumber: number): Promise<InsuranceRecord[]> {
    return await this.repository.findByWeek(weekNumber)
  }

  /**
   * 根据年份获取数据
   *
   * @param year - 年份
   * @returns Promise<InsuranceRecord[]>
   */
  async getDataByYear(year: number): Promise<InsuranceRecord[]> {
    return await this.repository.findByYear(year)
  }

  /**
   * 获取数据统计信息
   *
   * @returns Promise<DataStats>
   */
  async getStats(): Promise<DataStats> {
    return await this.repository.getStats()
  }

  /**
   * 清空所有数据
   *
   * @returns Promise<void>
   */
  async clearAllData(): Promise<void> {
    await this.repository.clear()
  }

  /**
   * 检查是否有数据
   *
   * @returns Promise<boolean>
   */
  async hasData(): Promise<boolean> {
    const stats = await this.repository.getStats()
    return stats.totalRecords > 0
  }

  /**
   * 获取可用的年份列表
   *
   * @returns Promise<number[]>
   */
  async getAvailableYears(): Promise<number[]> {
    const stats = await this.repository.getStats()
    return stats.availableYears
  }

  /**
   * 获取周次范围
   *
   * @returns Promise<{ min: number; max: number }>
   */
  async getWeekRange(): Promise<{ min: number; max: number }> {
    const stats = await this.repository.getStats()
    return stats.weekRange
  }
}
