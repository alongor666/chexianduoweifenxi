import {
  getBusinessTypeCode,
  getBusinessTypeShortLabelByCode,
} from '@/constants/dimensions'
import type { InsuranceRecord } from '@/types/insurance'
import type { DimensionAccumulator, DimensionHighlight } from './types'
import { sanitizeText } from './format-utils'
import { pickTopLabel } from './calc-utils'

export function buildDimensionHighlights(
  dimension: 'business' | 'organization',
  currentRecords: InsuranceRecord[],
  previousRecords: InsuranceRecord[]
): DimensionHighlight[] {
  const map = new Map<string, DimensionAccumulator>()

  const ensureAccumulator = (
    key: string,
    label: string
  ): DimensionAccumulator => {
    if (!map.has(key)) {
      map.set(key, {
        label,
        currentMatured: 0,
        currentClaim: 0,
        previousMatured: 0,
        previousClaim: 0,
        coverageClaims: new Map(),
        partnerClaims: new Map(),
      })
    }
    return map.get(key)!
  }

  const getKeyAndLabel = (
    record: InsuranceRecord
  ): { key: string; label: string } => {
    if (dimension === 'business') {
      const raw = sanitizeText(record.business_type_category, '未标记业务')
      const code = getBusinessTypeCode(raw)
      return { key: code, label: getBusinessTypeShortLabelByCode(code) }
    }
    const label = sanitizeText(record.third_level_organization, '未标记机构')
    return { key: label, label }
  }

  const getPartnerLabel = (record: InsuranceRecord): string => {
    if (dimension === 'business') {
      return sanitizeText(record.third_level_organization, '未标记机构')
    }
    const raw = sanitizeText(record.business_type_category, '未标记业务')
    const code = getBusinessTypeCode(raw)
    return getBusinessTypeShortLabelByCode(code)
  }

  currentRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.currentMatured += record.matured_premium_yuan
    accumulator.currentClaim += record.reported_claim_payment_yuan

    const coverageLabel = sanitizeText(record.coverage_type, '未标记险别')
    accumulator.coverageClaims.set(
      coverageLabel,
      (accumulator.coverageClaims.get(coverageLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )

    const partnerLabel = getPartnerLabel(record)
    accumulator.partnerClaims.set(
      partnerLabel,
      (accumulator.partnerClaims.get(partnerLabel) ?? 0) +
        record.reported_claim_payment_yuan
    )
  })

  previousRecords.forEach(record => {
    const { key, label } = getKeyAndLabel(record)
    const accumulator = ensureAccumulator(key, label)

    accumulator.previousMatured += record.matured_premium_yuan
    accumulator.previousClaim += record.reported_claim_payment_yuan
  })

  const highlights: DimensionHighlight[] = []

  map.forEach((accumulator, key) => {
    const currentMatured = accumulator.currentMatured
    const currentClaim = accumulator.currentClaim
    const previousMatured = accumulator.previousMatured
    const previousClaim = accumulator.previousClaim

    if (
      currentMatured <= 0 &&
      currentClaim <= 0 &&
      previousMatured <= 0 &&
      previousClaim <= 0
    ) {
      return
    }

    let lossRatio: number | null = null
    if (currentMatured > 0 && currentClaim >= 0) {
      lossRatio = (currentClaim / currentMatured) * 100
    }

    let previousLossRatio: number | null = null
    if (previousMatured > 0 && previousClaim >= 0) {
      previousLossRatio = (previousClaim / previousMatured) * 100
    }

    const lossRatioChange =
      lossRatio !== null && previousLossRatio !== null
        ? lossRatio - previousLossRatio
        : null

    const claimPaymentWan = currentClaim / 10000
    const claimPaymentChangeWan =
      currentClaim - previousClaim !== 0
        ? (currentClaim - previousClaim) / 10000
        : null

    const topCoverage = pickTopLabel(accumulator.coverageClaims)
    const topPartner = pickTopLabel(accumulator.partnerClaims)

    highlights.push({
      key,
      label: accumulator.label,
      lossRatio,
      lossRatioChange,
      claimPaymentWan,
      claimPaymentChangeWan,
      topCoverage,
      topPartner,
    })
  })

  const valueOf = (value: number | null | undefined): number =>
    value === null || value === undefined ? Number.NEGATIVE_INFINITY : value

  highlights.sort((a, b) => {
    const changeDiff = valueOf(b.lossRatioChange) - valueOf(a.lossRatioChange)
    if (changeDiff !== 0 && Number.isFinite(changeDiff)) {
      return changeDiff
    }

    const ratioDiff = valueOf(b.lossRatio) - valueOf(a.lossRatio)
    if (ratioDiff !== 0 && Number.isFinite(ratioDiff)) {
      return ratioDiff
    }

    return b.claimPaymentWan - a.claimPaymentWan
  })

  return highlights
}
