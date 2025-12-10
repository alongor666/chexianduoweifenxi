/**
 * 趋势数据 Hook
 * 将筛选后的数据按 年-周 聚合，生成趋势序列
 * 支持当周值和周增量两种模式
 */

'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import type { InsuranceRecord } from '@/types/insurance'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import { normalizeChineseText } from '@/domain/rules/data-normalization'
import { getBusinessTypeFullCNByCode } from '@/constants/dimensions'

export interface TrendPoint {
  key: string
  year: number
  week: number
  label: string
  signed_premium_10k: number
  matured_premium_10k: number
  loss_ratio: number | null
  contribution_margin_ratio: number | null
}

function groupByYearWeek(
  records: InsuranceRecord[]
): Map<string, InsuranceRecord[]> {
  const map = new Map<string, InsuranceRecord[]>()
  for (const r of records) {
    const key = `${r.policy_start_year}-${String(r.week_number).padStart(3, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return map
}

/**
 * 按照 年份 + 周次 的实际先后顺序排序键名
 * 不能直接使用字符串排序，否则第100周会排在第99周之前
 */
function sortYearWeekKeys(keys: string[]): string[] {
  return keys.sort((a, b) => {
    const [yearA, weekA] = a.split('-').map(Number)
    const [yearB, weekB] = b.split('-').map(Number)
    if (yearA !== yearB) return yearA - yearB
    return weekA - weekB
  })
}

export function useTrendData(records?: InsuranceRecord[]): TrendPoint[] {
  const filteredFromStore = useFilteredData()
  const filtered = records || filteredFromStore
  const filters = useAppStore(state => state.filters)
  const dataViewType = filters.dataViewType
  const premiumTargets = useAppStore(state => state.premiumTargets)

  const targetForScope = useMemo(() => {
    if (!premiumTargets) return null

    // 优先级：业务类型 > 三级机构 > 客户分类 > 保险类型 > 总体目标

    // 1. 业务类型目标
    if (filters.businessTypes.length > 0) {
      const sum = filters.businessTypes.reduce((acc, code) => {
        const cn = getBusinessTypeFullCNByCode(code as any)
        const normalized = normalizeChineseText(cn)
        return (
          acc +
          (premiumTargets.dimensions.businessType.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 2. 三级机构目标
    if (filters.organizations.length > 0) {
      const sum = filters.organizations.reduce((acc, org) => {
        const normalized = normalizeChineseText(org)
        return (
          acc +
          (premiumTargets.dimensions.thirdLevelOrganization.entries[
            normalized
          ] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 3. 客户分类目标
    if (filters.customerCategories.length > 0) {
      const sum = filters.customerCategories.reduce((acc, category) => {
        const normalized = normalizeChineseText(category)
        return (
          acc +
          (premiumTargets.dimensions.customerCategory.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 4. 保险类型目标
    if (filters.insuranceTypes.length > 0) {
      const sum = filters.insuranceTypes.reduce((acc, type) => {
        const normalized = normalizeChineseText(type)
        return (
          acc +
          (premiumTargets.dimensions.insuranceType.entries[normalized] ?? 0)
        )
      }, 0)
      if (sum > 0) return sum
    }

    // 5. 总体目标
    return premiumTargets.overall > 0 ? premiumTargets.overall : null
  }, [filters, premiumTargets])

  const series = useMemo(() => {
    if (filtered.length === 0) return []

    // 分组
    const grouped = groupByYearWeek(filtered)

    // 将Map转换为数组并排序，以便计算周增量
    const sortedKeys = sortYearWeekKeys(Array.from(grouped.keys()))
    const points: TrendPoint[] = []

    sortedKeys.forEach((key, index) => {
      const rows = grouped.get(key)!
      const [y, w] = key.split('-')

      let kpi
      if (dataViewType === 'increment' && index > 0) {
        // 周增量模式：计算当前周与前一周的差值
        const previousKey = sortedKeys[index - 1]
        const previousRows = grouped.get(previousKey)!
        kpi = kpiEngine.calculateIncrement(rows, previousRows, {
          annualTargetYuan: targetForScope ?? undefined,
        })
      } else {
        // 当周值模式 或 第一周（没有前一周可比较）
        kpi = kpiEngine.calculate(rows, {
          annualTargetYuan: targetForScope ?? undefined,
        })
      }

      points.push({
        key,
        year: Number(y),
        week: Number(w),
        label: `${y}年第${Number(w)}周`,
        signed_premium_10k: kpi.signed_premium,
        matured_premium_10k: kpi.matured_premium,
        loss_ratio: kpi.loss_ratio,
        contribution_margin_ratio: kpi.contribution_margin_ratio,
      })
    })

    // 排序：优先年份倒序，其次周序号升序（便于当前年观察）
    points.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return a.week - b.week
    })

    // 若选择了具体年份，仅保留该年份的序列（便于聚焦）；未选年份则返回全部
    if (filters.years && filters.years.length === 1) {
      return points.filter(p => p.year === filters.years[0])
    }

    return points
  }, [filtered, filters.years, dataViewType, targetForScope])

  return series
}
