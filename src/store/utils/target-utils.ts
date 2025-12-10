/**
 * 保费目标相关工具函数
 */

import {
  PremiumTargets,
  DimensionTargetMap,
  TargetVersionSnapshot,
  TARGET_DIMENSIONS,
} from '@/types/insurance'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

export const PREMIUM_TARGET_STORAGE_KEY = 'insurDashPremiumTargets'

export function createEmptyDimensionTargets(): DimensionTargetMap {
  return TARGET_DIMENSIONS.reduce((acc, key) => {
    acc[key] = {
      entries: {},
      updatedAt: null,
      versions: [],
    }
    return acc
  }, {} as DimensionTargetMap)
}

export const defaultPremiumTargets: PremiumTargets = {
  year: new Date().getFullYear(),
  overall: 0,
  byBusinessType: {},
  dimensions: createEmptyDimensionTargets(),
  updatedAt: null,
}

export function normalizeTargetValue(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return 0
  return Math.round(numeric)
}

export function normalizeTargetEntries(
  entries?: Record<string, number>
): Record<string, number> {
  if (!entries || typeof entries !== 'object') return {}
  const normalized: Record<string, number> = {}
  Object.entries(entries).forEach(([rawKey, rawValue]) => {
    const key = normalizeChineseText(rawKey)
    if (!key) return
    normalized[key] = normalizeTargetValue(rawValue)
  })
  return normalized
}

export function normalizeVersionSnapshots(
  versions: TargetVersionSnapshot[] | undefined
): TargetVersionSnapshot[] {
  if (!Array.isArray(versions)) return []
  const sanitized = versions
    .map(version => {
      if (!version) return null
      const id =
        version.id ||
        `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return {
        id,
        label: version.label || id,
        createdAt: version.createdAt || new Date().toISOString(),
        overall: normalizeTargetValue(version.overall),
        entries: normalizeTargetEntries(version.entries),
        ...(version.note !== undefined && { note: version.note }),
      } as TargetVersionSnapshot
    })
    .filter((snapshot): snapshot is TargetVersionSnapshot => snapshot !== null)
  return sanitized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function upgradePremiumTargets(
  raw?: Partial<PremiumTargets>
): PremiumTargets {
  if (!raw) {
    return { ...defaultPremiumTargets, year: new Date().getFullYear() }
  }

  const year = raw.year || new Date().getFullYear()
  const overall = normalizeTargetValue(raw.overall)
  const baseUpdatedAt = raw.updatedAt ?? null

  const normalizedDimensions: DimensionTargetMap = createEmptyDimensionTargets()

  const legacyBusinessEntries = normalizeTargetEntries(raw.byBusinessType)
  TARGET_DIMENSIONS.forEach(dimensionKey => {
    const rawDimension = raw.dimensions?.[dimensionKey]
    const entries = (() => {
      if (dimensionKey === 'businessType') {
        if (Object.keys(legacyBusinessEntries).length > 0) {
          return legacyBusinessEntries
        }
      }
      return normalizeTargetEntries(rawDimension?.entries)
    })()

    normalizedDimensions[dimensionKey] = {
      entries,
      updatedAt:
        rawDimension?.updatedAt ??
        (dimensionKey === 'businessType'
          ? baseUpdatedAt
          : (rawDimension?.updatedAt ?? null)),
      versions: normalizeVersionSnapshots(rawDimension?.versions),
    }
  })

  return {
    year,
    overall,
    byBusinessType: normalizedDimensions.businessType.entries,
    dimensions: normalizedDimensions,
    updatedAt: baseUpdatedAt,
  }
}

export function loadPremiumTargetsFromStorage(): PremiumTargets {
  if (typeof window === 'undefined') {
    return defaultPremiumTargets
  }

  try {
    const stored = window.localStorage.getItem(PREMIUM_TARGET_STORAGE_KEY)
    if (!stored) {
      return defaultPremiumTargets
    }
    const parsed = JSON.parse(stored) as Partial<PremiumTargets>
    return upgradePremiumTargets(parsed)
  } catch (error) {
    console.warn('[useAppStore] 读取保费目标数据失败，已回退默认值', error)
    return defaultPremiumTargets
  }
}

export function savePremiumTargetsToStorage(targets: PremiumTargets) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      PREMIUM_TARGET_STORAGE_KEY,
      JSON.stringify(targets)
    )
  }
}

export function processAndSavePremiumTargets(
  targets: PremiumTargets
): PremiumTargets {
  const timestamp = targets.updatedAt ?? new Date().toISOString()
  const year = targets.year || new Date().getFullYear()
  const overall = normalizeTargetValue(targets.overall)

  const normalizedDimensions: DimensionTargetMap = createEmptyDimensionTargets()
  TARGET_DIMENSIONS.forEach(dimensionKey => {
    const incomingDimension = targets.dimensions?.[dimensionKey]
    const fallbackEntries =
      dimensionKey === 'businessType' ? targets.byBusinessType : undefined

    const entries = normalizeTargetEntries(
      incomingDimension?.entries ?? fallbackEntries
    )

    const hasMeaningfulPayload =
      incomingDimension?.entries !== undefined ||
      (dimensionKey === 'businessType' && Object.keys(entries).length > 0)

    normalizedDimensions[dimensionKey] = {
      entries,
      updatedAt:
        incomingDimension?.updatedAt ??
        (hasMeaningfulPayload ? timestamp : null),
      versions: normalizeVersionSnapshots(incomingDimension?.versions),
    }
  })

  const nextTargets: PremiumTargets = {
    year,
    overall,
    byBusinessType: normalizedDimensions.businessType.entries,
    dimensions: normalizedDimensions,
    updatedAt: timestamp,
  }

  savePremiumTargetsToStorage(nextTargets)

  return nextTargets
}
