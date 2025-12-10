import { useMemo } from 'react'
import {
  getBusinessTypeCode,
  getBusinessTypeShortLabelByCode,
} from '@/constants/dimensions'
import { useAppStore } from '@/store/use-app-store'
import type { InsuranceRecord } from '@/types/insurance'
import { useFilteredData, applyFilters } from './use-filtered-data'
import { buildPreviousFilters } from './utils/filter-helpers'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

export type LossDimensionKey =
  | 'customer_category_3'
  | 'business_type_category'
  | 'third_level_organization'
  | 'insurance_type'
  | 'is_new_energy_vehicle'
  | 'is_transferred_vehicle'
  | 'renewal_status'

interface LossMetrics {
  lossRatio: number | null
  reportedClaimPayment: number
  claimCaseCount: number
  averageClaim: number | null
  maturedPremiumYuan: number
  signedPremiumYuan: number
}

export interface LossDimensionItem {
  key: string
  label: string
  current: LossMetrics
  previous: LossMetrics | null
}

interface GroupAccumulator {
  label: string
  maturedPremiumYuan: number
  reportedClaimPaymentYuan: number
  claimCaseCount: number
  signedPremiumYuan: number
}

function normalizeDimensionValue(
  record: InsuranceRecord,
  dimensionKey: LossDimensionKey
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

      const raw = normalizeChineseText(String(rawValue))
      if (dimensionKey === 'business_type_category') {
        const code = getBusinessTypeCode(raw)
        return { key: code, label: getBusinessTypeShortLabelByCode(code) }
      }
      return { key: raw, label: raw }
    }
  }
}

function aggregateLossMetrics(
  records: InsuranceRecord[],
  dimensionKey: LossDimensionKey
): Map<string, LossMetrics & { label: string }> {
  const groups = new Map<string, GroupAccumulator>()

  records.forEach(record => {
    const { key, label } = normalizeDimensionValue(record, dimensionKey)

    if (!groups.has(key)) {
      groups.set(key, {
        label,
        maturedPremiumYuan: 0,
        reportedClaimPaymentYuan: 0,
        claimCaseCount: 0,
        signedPremiumYuan: 0,
      })
    }

    const group = groups.get(key)!
    group.label = label
    group.maturedPremiumYuan += record.matured_premium_yuan
    group.reportedClaimPaymentYuan += record.reported_claim_payment_yuan
    group.claimCaseCount += record.claim_case_count
    group.signedPremiumYuan += record.signed_premium_yuan
  })

  const result = new Map<string, LossMetrics & { label: string }>()

  groups.forEach((group, key) => {
    const lossRatio =
      group.maturedPremiumYuan > 0
        ? (group.reportedClaimPaymentYuan / group.maturedPremiumYuan) * 100
        : null
    const reportedClaimPayment = group.reportedClaimPaymentYuan / 10000
    const claimCaseCount = group.claimCaseCount
    const averageClaim =
      group.claimCaseCount > 0
        ? group.reportedClaimPaymentYuan / group.claimCaseCount
        : null

    result.set(key, {
      label: group.label,
      lossRatio,
      reportedClaimPayment,
      claimCaseCount,
      averageClaim,
      maturedPremiumYuan: group.maturedPremiumYuan,
      signedPremiumYuan: group.signedPremiumYuan,
    })
  })

  return result
}

function mergeMetrics(
  currentMap: Map<string, LossMetrics & { label: string }>,
  previousMap: Map<string, LossMetrics & { label: string }>
): LossDimensionItem[] {
  const items: LossDimensionItem[] = []

  currentMap.forEach((current, key) => {
    items.push({
      key,
      label: current.label,
      current,
      previous: previousMap.get(key) ?? null,
    })
  })

  // 按签单保费降序排序，保持与保费分析一致的展示顺序
  return items.sort(
    (a, b) => b.current.signedPremiumYuan - a.current.signedPremiumYuan
  )
}

export function useLossDimensionAnalysis(
  dimensionKey: LossDimensionKey
): LossDimensionItem[] {
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

  const currentMap = useMemo(
    () => aggregateLossMetrics(filteredData, dimensionKey),
    [filteredData, dimensionKey]
  )

  const previousMap = useMemo(
    () => aggregateLossMetrics(previousData, dimensionKey),
    [previousData, dimensionKey]
  )

  return useMemo(
    () => mergeMetrics(currentMap, previousMap),
    [currentMap, previousMap]
  )
}
