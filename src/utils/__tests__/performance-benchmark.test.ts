/**
 * 性能基准测试
 * 用于比较新旧架构的性能差异
 *
 * @description
 * 测试内容：
 * 1. Store 操作性能（设置数据、更新筛选、缓存操作）
 * 2. 数据筛选性能（大数据量下的筛选速度）
 * 3. KPI 计算性能（缓存命中率、计算速度）
 * 4. 内存占用对比
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useDataStore } from '@/store/domains/dataStore'
import { useFilterStore } from '@/store/domains/filterStore'
import { useCacheStore } from '@/store/domains/cacheStore'
import { DataService } from '@/services/DataService'
import type { InsuranceRecord, KPIResult } from '@/types/insurance'

/**
 * 生成测试数据
 */
function generateMockData(count: number): InsuranceRecord[] {
  const data: InsuranceRecord[] = []
  const organizations = ['机构A', '机构B', '机构C', '机构D', '机构E']
  const businessTypes = ['新车', '续保', '转保']
  const insuranceTypes = ['交强险', '商业险']

  for (let i = 0; i < count; i++) {
    data.push({
      snapshot_date: '2025-10-22',
      week_number: 42 + (i % 4),
      policy_start_year: 2025,
      third_level_organization: organizations[i % organizations.length],
      customer_category_3: '个人客户',
      insurance_type: insuranceTypes[i % insuranceTypes.length],
      business_type_category: businessTypes[i % businessTypes.length],
      coverage_type: '全险',
      terminal_source: '直销',
      renewal_status: i % 2 === 0 ? '首次' : '续保',
      is_new_energy_vehicle: i % 3 === 0,
      vehicle_insurance_grade: 'A',
      signed_premium: Math.random() * 10000,
      signed_policy_count: 1,
      earned_premium: Math.random() * 8000,
      incurred_loss: Math.random() * 2000,
      paid_loss: Math.random() * 1500,
      loss_ratio: Math.random() * 0.3,
    } as InsuranceRecord)
  }

  return data
}

/**
 * 性能测量工具
 */
function measurePerformance(fn: () => void, label: string): number {
  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start
  console.log(`[性能测试] ${label}: ${duration.toFixed(2)}ms`)
  return duration
}

async function measureAsyncPerformance(
  fn: () => Promise<void>,
  label: string
): Promise<number> {
  const start = performance.now()
  await fn()
  const end = performance.now()
  const duration = end - start
  console.log(`[性能测试] ${label}: ${duration.toFixed(2)}ms`)
  return duration
}

describe('性能基准测试', () => {
  describe('数据Store性能测试', () => {
    beforeEach(() => {
      // 重置Store
      useDataStore.getState().clearData(false)
    })

    it('应该快速设置小数据集（1000条）', async () => {
      const mockData = generateMockData(1000)
      const duration = await measureAsyncPerformance(async () => {
        await useDataStore.getState().setData(mockData, false)
      }, '设置1000条数据')

      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })

    it('应该快速设置中等数据集（10000条）', async () => {
      const mockData = generateMockData(10000)
      const duration = await measureAsyncPerformance(async () => {
        await useDataStore.getState().setData(mockData, false)
      }, '设置10000条数据')

      expect(duration).toBeLessThan(500) // 应该在500ms内完成
    })

    it('应该高效追加数据并去重', async () => {
      const initialData = generateMockData(5000)
      const appendData = generateMockData(5000)

      await useDataStore.getState().setData(initialData, false)

      const duration = await measureAsyncPerformance(async () => {
        await useDataStore.getState().appendData(appendData, false)
      }, '追加5000条数据并去重')

      expect(duration).toBeLessThan(300) // 应该在300ms内完成
    })

    it('应该快速获取数据统计信息', () => {
      const mockData = generateMockData(10000)
      useDataStore.getState().setData(mockData, false)

      const duration = measurePerformance(() => {
        useDataStore.getState().getStats()
      }, '获取10000条数据的统计信息')

      expect(duration).toBeLessThan(50) // 应该在50ms内完成
    })
  })

  describe('筛选Store性能测试', () => {
    it('应该快速更新筛选条件', () => {
      const duration = measurePerformance(() => {
        useFilterStore.getState().updateFilters({
          years: [2024, 2025],
          weeks: [41, 42, 43],
          organizations: ['机构A', '机构B'],
          businessTypes: ['新车', '续保'],
        })
      }, '更新多个筛选条件')

      expect(duration).toBeLessThan(10) // 应该在10ms内完成
    })

    it('应该快速计算激活的筛选器数量', () => {
      useFilterStore.getState().updateFilters({
        years: [2024, 2025],
        weeks: [41, 42, 43],
        organizations: ['机构A', '机构B'],
        businessTypes: ['新车', '续保'],
        isNewEnergy: true,
      })

      const duration = measurePerformance(() => {
        useFilterStore.getState().getActiveFilterCount()
      }, '计算激活筛选器数量')

      expect(duration).toBeLessThan(5) // 应该在5ms内完成
    })
  })

  describe('缓存Store性能测试', () => {
    it('应该快速设置和获取缓存', () => {
      const mockResult: KPIResult = {
        signed_premium: 1000000,
        signed_policy_count: 500,
        earned_premium: 800000,
        incurred_loss: 200000,
        paid_loss: 150000,
        loss_ratio: 0.25,
      }

      const setDuration = measurePerformance(() => {
        for (let i = 0; i < 100; i++) {
          useCacheStore.getState().setKPICache(`key-${i}`, mockResult)
        }
      }, '设置100个缓存项')

      expect(setDuration).toBeLessThan(20) // 应该在20ms内完成

      const getDuration = measurePerformance(() => {
        for (let i = 0; i < 100; i++) {
          useCacheStore.getState().getKPICache(`key-${i}`)
        }
      }, '获取100个缓存项')

      expect(getDuration).toBeLessThan(10) // 应该在10ms内完成
    })

    it('应该快速清空缓存', () => {
      // 先设置大量缓存
      const mockResult: KPIResult = {
        signed_premium: 1000000,
        signed_policy_count: 500,
        earned_premium: 800000,
        incurred_loss: 200000,
        paid_loss: 150000,
        loss_ratio: 0.25,
      }

      for (let i = 0; i < 1000; i++) {
        useCacheStore.getState().setKPICache(`key-${i}`, mockResult)
      }

      const duration = measurePerformance(() => {
        useCacheStore.getState().clearKPICache()
      }, '清空1000个缓存项')

      expect(duration).toBeLessThan(10) // 应该在10ms内完成
    })

    it('应该正确统计缓存命中率', () => {
      const mockResult: KPIResult = {
        signed_premium: 1000000,
        signed_policy_count: 500,
        earned_premium: 800000,
        incurred_loss: 200000,
        paid_loss: 150000,
        loss_ratio: 0.25,
      }

      // 设置一些缓存
      useCacheStore.getState().clearAll() // 重置统计
      useCacheStore.getState().setKPICache('key-1', mockResult)
      useCacheStore.getState().setKPICache('key-2', mockResult)

      // 模拟缓存命中和未命中
      useCacheStore.getState().getKPICache('key-1') // 命中
      useCacheStore.getState().getKPICache('key-2') // 命中
      useCacheStore.getState().getKPICache('key-3') // 未命中
      useCacheStore.getState().getKPICache('key-4') // 未命中

      const stats = useCacheStore.getState().getCacheStats()

      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(50)
      expect(stats.totalRequests).toBe(4)
    })
  })

  describe('DataService性能测试', () => {
    it('应该快速筛选大数据集', () => {
      const mockData = generateMockData(10000)

      const duration = measurePerformance(() => {
        DataService.filter(mockData, {
          years: [2025],
          weeks: [42, 43],
          organizations: ['机构A', '机构B'],
          businessTypes: ['新车'],
          insuranceTypes: [],
          coverageTypes: [],
          customerCategories: [],
          vehicleGrades: [],
          highwayRiskGrades: [],
          smallTruckScores: [],
          largeTruckScores: [],
          terminalSources: [],
          isNewEnergy: null,
          renewalStatuses: [],
          viewMode: 'single',
          dataViewType: 'current',
          singleModeWeek: 42,
          trendModeWeeks: [],
        })
      }, '筛选10000条数据')

      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })

    it('应该快速规范化数据', () => {
      const mockData = generateMockData(10000)

      const duration = measurePerformance(() => {
        DataService.normalize(mockData)
      }, '规范化10000条数据')

      expect(duration).toBeLessThan(200) // 应该在200ms内完成
    })

    it('应该快速合并数据', () => {
      const data1 = generateMockData(5000)
      const data2 = generateMockData(5000)

      const duration = measurePerformance(() => {
        DataService.merge(data1, data2)
      }, '合并两个5000条的数据集')

      expect(duration).toBeLessThan(300) // 应该在300ms内完成
    })

    it('应该快速获取统计信息', () => {
      const mockData = generateMockData(10000)

      const duration = measurePerformance(() => {
        DataService.getStatistics(mockData)
      }, '计算10000条数据的统计信息')

      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })
  })

  describe('内存占用测试', () => {
    it('应该报告数据集的内存占用', () => {
      const smallData = generateMockData(1000)
      const mediumData = generateMockData(10000)
      const largeData = generateMockData(50000)

      // 使用粗略估算（实际内存占用难以精确测量）
      const smallSize = JSON.stringify(smallData).length
      const mediumSize = JSON.stringify(mediumData).length
      const largeSize = JSON.stringify(largeData).length

      console.log('\n[内存占用估算]')
      console.log(`1000条数据: ${(smallSize / 1024).toFixed(2)} KB`)
      console.log(`10000条数据: ${(mediumSize / 1024).toFixed(2)} KB`)
      console.log(`50000条数据: ${(largeSize / 1024 / 1024).toFixed(2)} MB`)

      // 验证内存占用合理性
      expect(smallSize).toBeLessThan(1024 * 1024) // 小于1MB
      expect(mediumSize).toBeLessThan(10 * 1024 * 1024) // 小于10MB
      expect(largeSize).toBeLessThan(100 * 1024 * 1024) // 小于100MB
    })
  })

  describe('综合性能测试', () => {
    it('应该快速完成完整的数据处理流程', async () => {
      const mockData = generateMockData(10000)

      const totalDuration = await measureAsyncPerformance(async () => {
        // 1. 设置数据
        await useDataStore.getState().setData(mockData, false)

        // 2. 更新筛选条件
        useFilterStore.getState().updateFilters({
          years: [2025],
          weeks: [42],
          organizations: ['机构A'],
        })

        // 3. 执行筛选
        const filters = useFilterStore.getState().filters
        const filteredData = DataService.filter(mockData, filters)

        // 4. 计算统计
        DataService.getStatistics(filteredData)

        // 5. 模拟缓存KPI结果
        const mockResult: KPIResult = {
          signed_premium: 1000000,
          signed_policy_count: 500,
          earned_premium: 800000,
          incurred_loss: 200000,
          paid_loss: 150000,
          loss_ratio: 0.25,
        }
        useCacheStore.getState().setKPICache('test-key', mockResult)
      }, '完整数据处理流程')

      expect(totalDuration).toBeLessThan(500) // 整个流程应该在500ms内完成
    })
  })
})

describe('缓存效率测试', () => {
  it('应该显著提升重复查询的性能', () => {
    const mockData = generateMockData(10000)
    const filters = {
      years: [2025],
      weeks: [42],
      organizations: ['机构A', '机构B'],
      businessTypes: ['新车'],
      insuranceTypes: [],
      coverageTypes: [],
      customerCategories: [],
      vehicleGrades: [],
      highwayRiskGrades: [],
      smallTruckScores: [],
      largeTruckScores: [],
      terminalSources: [],
      isNewEnergy: null,
      renewalStatuses: [],
      viewMode: 'single' as const,
      dataViewType: 'current' as const,
      singleModeWeek: 42,
      trendModeWeeks: [],
    }

    // 首次查询（无缓存）
    const firstQueryDuration = measurePerformance(() => {
      const result = DataService.filter(mockData, filters)
      const stats = DataService.getStatistics(result)
      useCacheStore.getState().setKPICache('test-filter-key', {
        signed_premium: stats.totalPremium,
        signed_policy_count: stats.totalPolicyCount,
        earned_premium: 0,
        incurred_loss: 0,
        paid_loss: 0,
        loss_ratio: 0,
      })
    }, '首次查询（无缓存）')

    // 第二次查询（有缓存）
    const secondQueryDuration = measurePerformance(() => {
      const cached = useCacheStore.getState().getKPICache('test-filter-key')
      if (!cached) {
        // 如果缓存不存在才计算
        const result = DataService.filter(mockData, filters)
        DataService.getStatistics(result)
      }
    }, '第二次查询（有缓存）')

    console.log(
      `\n[缓存性能提升] ${((firstQueryDuration / secondQueryDuration) * 100 - 100).toFixed(2)}%`
    )

    // 第二次查询应该显著更快
    expect(secondQueryDuration).toBeLessThan(firstQueryDuration * 0.1)
  })
})
