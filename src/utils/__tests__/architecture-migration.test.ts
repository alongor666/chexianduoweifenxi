/**
 * 架构迁移E2E测试
 * 验证新架构的核心功能
 */

import { test, expect } from '@playwright/test'

test.describe('新架构 - 数据管理', () => {
  test('应正确加载和过滤数据', async () => {
    // 导入新架构模块
    const { useDataStore } = await import('../../src/store/domains/dataStore')
    const { useFilterStore } = await import('../../src/store/domains/filterStore')
    const { DataService } = await import('../../src/services/DataService')

    // 准备测试数据
    const mockData = [
      {
        id: '1',
        policy_start_year: 2024,
        week_number: 1,
        business_type_category: '车险',
        signed_premium_yuan: 100000,
        third_level_organization: '测试机构',
        customer_category: '个人',
        insurance_type: '交强险',
      },
      {
        id: '2',
        policy_start_year: 2024,
        week_number: 2,
        business_type_category: '车险',
        signed_premium_yuan: 200000,
        third_level_organization: '测试机构',
        customer_category: '个人',
        insurance_type: '交强险',
      },
      {
        id: '3',
        policy_start_year: 2025,
        week_number: 1,
        business_type_category: '非车险',
        signed_premium_yuan: 150000,
        third_level_organization: '其他机构',
        customer_category: '企业',
        insurance_type: '商业险',
      },
    ] as any[]

    // 1. 测试数据存储
    useDataStore.getState().setRawData(mockData)
    expect(useDataStore.getState().rawData).toHaveLength(3)
    expect(useDataStore.getState().stats.totalRecords).toBe(3)

    // 2. 测试筛选功能
    useFilterStore.getState().updateFilters({ years: [2024] })
    const filteredData = DataService.filter(mockData, useFilterStore.getState().filters)
    expect(filteredData).toHaveLength(2)

    // 3. 测试筛选器重置
    useFilterStore.getState().resetFilters()
    const allData = DataService.filter(mockData, useFilterStore.getState().filters)
    expect(allData).toHaveLength(3)
  })
})

test.describe('新架构 - KPI计算', () => {
  test('应正确计算基础KPI', async () => {
    const { KPIService } = await import('../../src/services/KPIService')

    const mockData = [
      {
        id: '1',
        policy_start_year: 2024,
        week_number: 1,
        business_type_category: '车险',
        signed_premium_yuan: 100000,
        signed_premium_wan: 10,
        first_year_premium_yuan: 80000,
        first_year_premium_wan: 8,
        policy_count: 10,
        third_level_organization: '测试机构',
        customer_category: '个人',
        insurance_type: '交强险',
      },
      {
        id: '2',
        policy_start_year: 2024,
        week_number: 1,
        business_type_category: '车险',
        signed_premium_yuan: 200000,
        signed_premium_wan: 20,
        first_year_premium_yuan: 160000,
        first_year_premium_wan: 16,
        policy_count: 20,
        third_level_organization: '测试机构',
        customer_category: '个人',
        insurance_type: '交强险',
      },
    ] as any[]

    const kpi = KPIService.calculate(mockData, {
      mode: 'current',
      currentWeekNumber: 1,
      year: 2024,
    })

    expect(kpi).not.toBeNull()
    expect(kpi!.signed_premium).toBe(30) // 10 + 20 万元
    expect(kpi!.policy_count).toBe(30) // 10 + 20 件
    expect(kpi!.first_year_premium).toBe(24) // 8 + 16 万元
  })

  test('应正确计算目标达成率', async () => {
    const { KPIService } = await import('../../src/services/KPIService')

    const mockData = [
      {
        id: '1',
        policy_start_year: 2024,
        week_number: 1,
        business_type_category: '车险',
        signed_premium_yuan: 500000,
        signed_premium_wan: 50,
        first_year_premium_yuan: 400000,
        first_year_premium_wan: 40,
        policy_count: 10,
        third_level_organization: '测试机构',
        customer_category: '个人',
        insurance_type: '交强险',
      },
    ] as any[]

    const kpi = KPIService.calculate(mockData, {
      mode: 'current',
      currentWeekNumber: 1,
      year: 2024,
      annualTargetYuan: 1000000, // 100万元目标
    })

    expect(kpi).not.toBeNull()
    expect(kpi!.signed_premium).toBe(50) // 50万元
    expect(kpi!.target_achievement_rate).toBeCloseTo(0.5, 2) // 50%达成率
  })
})

test.describe('新架构 - 缓存管理', () => {
  test('应正确管理KPI缓存', async () => {
    const { useCacheStore } = await import('../../src/store/domains/cacheStore')

    const mockKpi = {
      signed_premium: 100,
      policy_count: 50,
      first_year_premium: 80,
      renewal_premium: 20,
      average_premium: 2,
      renewal_rate: 0.2,
      target_achievement_rate: 0.5,
    }

    // 1. 设置缓存
    useCacheStore.getState().setKpiCache('week-1-2024', mockKpi)

    // 2. 获取缓存
    const cached = useCacheStore.getState().getKpiCache('week-1-2024')
    expect(cached).toEqual(mockKpi)

    // 3. 验证缓存命中率统计
    useCacheStore.getState().getKpiCache('week-1-2024') // 再次获取
    const stats = useCacheStore.getState().getCacheStats()
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(0)

    // 4. 清空缓存
    useCacheStore.getState().clearKpiCache()
    const clearedCache = useCacheStore.getState().getKpiCache('week-1-2024')
    expect(clearedCache).toBeNull()
  })
})

test.describe('新架构 - UI状态管理', () => {
  test('应正确管理视图模式和面板状态', async () => {
    const { useUIStore } = await import('../../src/store/domains/uiStore')

    // 1. 切换视图模式
    useUIStore.getState().setCurrentView('trend')
    expect(useUIStore.getState().currentView).toBe('trend')

    // 2. 管理面板展开状态
    useUIStore.getState().togglePanel('filters')
    expect(useUIStore.getState().expandedPanels.has('filters')).toBe(true)

    useUIStore.getState().togglePanel('filters')
    expect(useUIStore.getState().expandedPanels.has('filters')).toBe(false)

    // 3. 设置表格列可见性
    useUIStore.getState().setTableColumns(['column1', 'column2'])
    expect(useUIStore.getState().tableConfig.visibleColumns).toEqual(['column1', 'column2'])
  })
})

test.describe('新架构 - 集成测试', () => {
  test('应支持完整的数据流程', async () => {
    const { useDataStore } = await import('../../src/store/domains/dataStore')
    const { useFilterStore } = await import('../../src/store/domains/filterStore')
    const { useCacheStore } = await import('../../src/store/domains/cacheStore')
    const { DataService } = await import('../../src/services/DataService')
    const { KPIService } = await import('../../src/services/KPIService')

    // 准备测试数据
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      policy_start_year: 2024,
      week_number: (i % 10) + 1,
      business_type_category: i % 2 === 0 ? '车险' : '非车险',
      signed_premium_yuan: (i + 1) * 10000,
      signed_premium_wan: (i + 1) * 1,
      first_year_premium_yuan: (i + 1) * 8000,
      first_year_premium_wan: (i + 1) * 0.8,
      policy_count: i + 1,
      third_level_organization: '测试机构',
      customer_category: '个人',
      insurance_type: '交强险',
    })) as any[]

    // 1. 加载数据
    useDataStore.getState().setRawData(mockData)
    expect(useDataStore.getState().stats.totalRecords).toBe(100)

    // 2. 应用筛选
    useFilterStore.getState().updateFilters({
      businessTypes: ['车险'],
      weeks: [1, 2, 3],
    })

    const filteredData = DataService.filter(mockData, useFilterStore.getState().filters)
    expect(filteredData.length).toBeGreaterThan(0)

    // 3. 计算KPI（使用缓存）
    const cacheKey = 'test-kpi'
    let cachedKpi = useCacheStore.getState().getKpiCache(cacheKey)

    if (!cachedKpi) {
      const kpi = KPIService.calculate(filteredData, {
        mode: 'current',
        year: 2024,
      })
      if (kpi) {
        useCacheStore.getState().setKpiCache(cacheKey, kpi)
      }
    }

    // 4. 验证缓存工作
    cachedKpi = useCacheStore.getState().getKpiCache(cacheKey)
    expect(cachedKpi).not.toBeNull()

    // 5. 清理
    useDataStore.getState().clearData()
    useFilterStore.getState().resetFilters()
    useCacheStore.getState().clearKpiCache()

    expect(useDataStore.getState().rawData).toHaveLength(0)
  })
})
