import { formatNumber } from '@/utils/format'

export function formatDeltaPercentPoint(
  value: number | null,
  decimals = 1
): string | null {
  if (value === null || Number.isNaN(value)) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}pp`
}

export function formatDeltaAmountWan(
  value: number | null,
  decimals = 1
): string | null {
  if (value === null || Number.isNaN(value)) return null
  const direction = value >= 0 ? '增加' : '减少'
  return `${direction} ${formatNumber(Math.abs(value), decimals)} 万元`
}

export function formatFilterList(values: string[], maxLength = 3): string {
  const unique = Array.from(new Set(values.filter(Boolean)))
  if (unique.length === 0) return '—'
  const sliced = unique.slice(0, maxLength)
  const suffix = unique.length > maxLength ? '等' : ''
  return `${sliced.join('、')}${suffix}`
}

export function sanitizeText(
  value: string | null | undefined,
  fallback: string
): string {
  if (value === null || value === undefined) return fallback
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : fallback
}

export function formatWeekList(weeks: number[]): string {
  if (weeks.length === 0) return ''
  return weeks.map(week => `第${week}周`).join('、')
}
