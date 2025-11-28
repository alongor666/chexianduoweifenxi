/**
 * 对比分析 Hook
 * 支持机构对比、险种结构分析等多维度对比
 */

import { useMemo } from 'react'
import { useFilteredData } from './use-filtered-data'
import { calculateKPIs } from '@/lib/calculations/kpi-engine'
import type { InsuranceRecord, KPIResult } from '@/types/insurance'

/**
 * 机构对比数据
 */
export interface OrganizationComparison {
  organization: string
  kpi: KPIResult
  recordCount: number
  rank: number
}

/**
 * 险种结构数据
 */
export interface InsuranceTypeStructure {
  insuranceType: string
  signedPremium: number
  maturedPremium: number
  policyCount: number
  percentage: number
  avgPremiumPerPolicy: number
}

/**
 * 机构对比分析
 */
export function useOrganizationComparison() {
  const filteredData = useFilteredData()

  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return []
    }

    // 按机构分组
    const orgMap = new Map<string, InsuranceRecord[]>()
    filteredData.forEach(record => {
      const org = record.third_level_organization
      if (!orgMap.has(org)) {
        orgMap.set(org, [])
      }
      orgMap.get(org)!.push(record)
    })

    // 计算每个机构的KPI
    const comparisons: OrganizationComparison[] = Array.from(
      orgMap.entries()
    ).map(([organization, records]) => ({
      organization,
      kpi: calculateKPIs(records),
      recordCount: records.length,
      rank: 0, // 稍后填充
    }))

    // 按满期边际贡献率排序并设置排名
    comparisons.sort(
      (a, b) =>
        (b.kpi.contribution_margin_ratio || 0) -
        (a.kpi.contribution_margin_ratio || 0)
    )
    comparisons.forEach((item, index) => {
      item.rank = index + 1
    })

    return comparisons
  }, [filteredData])
}

/**
 * 险种结构分析
 */
export function useInsuranceTypeStructure() {
  const filteredData = useFilteredData()

  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return []
    }

    // 按险种分组
    const typeMap = new Map<
      string,
      {
        signedPremium: number
        maturedPremium: number
        policyCount: number
      }
    >()

    filteredData.forEach(record => {
      const type = record.insurance_type
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          signedPremium: 0,
          maturedPremium: 0,
          policyCount: 0,
        })
      }
      const data = typeMap.get(type)!
      data.signedPremium += record.signed_premium_yuan
      data.maturedPremium += record.matured_premium_yuan
      data.policyCount += record.policy_count
    })

    // 计算总签单保费用于百分比计算
    const totalSignedPremium = Array.from(typeMap.values()).reduce(
      (sum, data) => sum + data.signedPremium,
      0
    )

    // 转换为结构数据
    const structures: InsuranceTypeStructure[] = Array.from(
      typeMap.entries()
    ).map(([insuranceType, data]) => ({
      insuranceType,
      signedPremium: Math.round(data.signedPremium / 10000), // 转为万元并取整
      maturedPremium: Math.round(data.maturedPremium / 10000),
      policyCount: data.policyCount,
      percentage:
        totalSignedPremium > 0
          ? (data.signedPremium / totalSignedPremium) * 100
          : 0,
      avgPremiumPerPolicy:
        data.policyCount > 0
          ? Math.round(data.signedPremium / data.policyCount)
          : 0,
    }))

    // 按签单保费降序排序
    structures.sort((a, b) => b.signedPremium - a.signedPremium)

    return structures
  }, [filteredData])
}

/**
 * 获取Top N机构
 */
export function useTopOrganizations(
  n = 5,
  sortBy: keyof KPIResult = 'matured_premium'
) {
  const comparisons = useOrganizationComparison()

  return useMemo(() => {
    const sorted = [...comparisons].sort((a, b) => {
      const aValue = a.kpi[sortBy]
      const bValue = b.kpi[sortBy]
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      return (bValue as number) - (aValue as number)
    })
    return sorted.slice(0, n)
  }, [comparisons, n, sortBy])
}
