import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import type { InsuranceRecord } from '@/types/insurance'
import { useFilteredData, applyFilters } from './use-filtered-data'
import { buildPreviousFilters } from './utils/filter-helpers'

export type PremiumDimensionKey =
  | 'customer_category_3'
  | 'business_type_category'
  | 'third_level_organization'
  | 'insurance_type'
  | 'is_new_energy_vehicle'
  | 'is_transferred_vehicle'
  | 'renewal_status'

export interface PremiumDimensionItem {
  key: string
  label: string
  signedPremiumYuan: number
  premiumPlanYuan: number
  policyCount: number
  policyTarget: number | null
  averagePremium: number | null
}

interface GroupAccumulator {
  label: string
  signedPremiumYuan: number
  premiumPlanYuan: number
  policyCount: number
  estimatedPolicyTarget: number
}

function normalizeDimensionValue(
  record: InsuranceRecord,
  dimensionKey: PremiumDimensionKey
): { key: string; label: string } {
  switch (dimensionKey) {
    case 'is_new_energy_vehicle':
      return record.is_new_energy_vehicle
        ? { key: 'new_energy', label: '新能源车' }
        : { key: 'traditional', label: '燃油车' }
    case 'is_transferred_vehicle':
      return record.is_transferred_vehicle
        ? { key: 'transferred', label: '过户车' }
        : { key: 'non_transferred', label: '非过户车' }
    default: {
      const rawValue = (record as unknown as Record<string, unknown>)[
        dimensionKey
      ]
      const isEmpty =
        rawValue === null ||
        rawValue === undefined ||
        (typeof rawValue === 'string' && rawValue.trim() === '')

      if (isEmpty) {
        return { key: `__EMPTY__:${dimensionKey}`, label: '未标记' }
      }

      return {
        key: String(rawValue),
        label: String(rawValue),
      }
    }
  }
}

function aggregateByDimension(
  records: InsuranceRecord[],
  dimensionKey: PremiumDimensionKey
): PremiumDimensionItem[] {
  const groups = new Map<string, GroupAccumulator>()

  records.forEach(record => {
    const { key, label } = normalizeDimensionValue(record, dimensionKey)

    if (!groups.has(key)) {
      groups.set(key, {
        label,
        signedPremiumYuan: 0,
        premiumPlanYuan: 0,
        policyCount: 0,
        estimatedPolicyTarget: 0,
      })
    }

    const group = groups.get(key)!
    group.label = label
    group.signedPremiumYuan += record.signed_premium_yuan
    group.premiumPlanYuan += record.premium_plan_yuan ?? 0
    group.policyCount += record.policy_count

    if (
      record.premium_plan_yuan &&
      record.policy_count > 0 &&
      record.signed_premium_yuan > 0
    ) {
      const averagePremium = record.signed_premium_yuan / record.policy_count
      if (averagePremium > 0) {
        group.estimatedPolicyTarget += record.premium_plan_yuan / averagePremium
      }
    }
  })

  const results: PremiumDimensionItem[] = []

  groups.forEach((group, key) => {
    const averagePremium =
      group.policyCount > 0 ? group.signedPremiumYuan / group.policyCount : null

    const policyTarget =
      group.estimatedPolicyTarget > 0 ? group.estimatedPolicyTarget : null

    results.push({
      key,
      label: group.label,
      signedPremiumYuan: group.signedPremiumYuan,
      premiumPlanYuan: group.premiumPlanYuan,
      policyCount: group.policyCount,
      policyTarget,
      averagePremium,
    })
  })

  results.sort((a, b) => b.signedPremiumYuan - a.signedPremiumYuan)

  return results
}

export function usePremiumDimensionAnalysis(
  dimensionKey: PremiumDimensionKey,
  limit = 12
): {
  items: PremiumDimensionItem[]
  previousMap: Map<string, PremiumDimensionItem>
} {
  const filteredData = useFilteredData()
  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)

  const previousFilters = useMemo(
    () => buildPreviousFilters(filters),
    [filters]
  )

  const previousData = useMemo(() => {
    if (!previousFilters) {
      return []
    }
    return applyFilters(rawData, previousFilters)
  }, [previousFilters, rawData])

  const currentItems = useMemo(
    () => aggregateByDimension(filteredData, dimensionKey).slice(0, limit),
    [filteredData, dimensionKey, limit]
  )

  const previousItems = useMemo(
    () => aggregateByDimension(previousData, dimensionKey),
    [previousData, dimensionKey]
  )

  const previousMap = useMemo(() => {
    const map = new Map<string, PremiumDimensionItem>()
    previousItems.forEach(item => {
      map.set(item.key, item)
    })
    return map
  }, [previousItems])

  return {
    items: currentItems,
    previousMap,
  }
}
