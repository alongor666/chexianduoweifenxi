import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { normalizeChineseText } from '@/lib/utils'
import type { TargetDimensionKey } from '@/types/insurance'
import {
  CANONICAL_BUSINESS_TYPES,
  CANONICAL_CUSTOMER_CATEGORIES,
} from '@/constants/dimensions'

type DimensionOptions = Record<TargetDimensionKey, string[]>

export function usePremiumTargets() {
  const rawData = useAppStore(state => state.rawData)
  const premiumTargets = useAppStore(state => state.premiumTargets)
  const loadPremiumTargets = useAppStore(state => state.loadPremiumTargets)

  useEffect(() => {
    loadPremiumTargets()
  }, [loadPremiumTargets])

  const dimensionOptions = useMemo<DimensionOptions>(() => {
    const collector: Record<TargetDimensionKey, Set<string>> = {
      businessType: new Set<string>(),
      thirdLevelOrganization: new Set<string>(),
      customerCategory: new Set<string>(),
      insuranceType: new Set<string>(),
    }

    rawData.forEach(record => {
      const businessType = normalizeChineseText(record.business_type_category)
      if (businessType) collector.businessType.add(businessType)

      const org = normalizeChineseText(record.third_level_organization)
      if (org) collector.thirdLevelOrganization.add(org)

      const customer = normalizeChineseText(record.customer_category_3)
      if (customer) collector.customerCategory.add(customer)

      const insuranceType = normalizeChineseText(record.insurance_type)
      if (insuranceType) collector.insuranceType.add(insuranceType)
    })

    const toSortedArray = (set: Set<string>) =>
      Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))

    return {
      businessType: [...CANONICAL_BUSINESS_TYPES],
      thirdLevelOrganization: toSortedArray(collector.thirdLevelOrganization),
      customerCategory: [...CANONICAL_CUSTOMER_CATEGORIES],
      insuranceType: toSortedArray(collector.insuranceType),
    }
  }, [rawData])

  return {
    premiumTargets,
    dimensionOptions,
  }
}
