'use client'

import { useMemo, useState } from 'react'
import { useDataStore, useFilterStore } from '@/store/domains'
import { DataService } from '@/services/DataService'
import { usePremiumDimensionAnalysis } from '@/hooks/use-premium-dimension-analysis'
import { useLossDimensionAnalysis } from '@/hooks/use-loss-dimension-analysis'
import { kpiEngine } from '@/lib/calculations/kpi-engine'
import { safeMax } from '@/lib/utils/array-utils'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PredictionOverride {
  signedPremiumYuan?: number
  premiumAchievementRate?: number
  averagePremium?: number
  policyCount?: number
  claimCaseCount?: number
  maturedFrequencyRate?: number
  averageClaim?: number
  expenseRatio?: number
  lossRatio?: number
}

const TARGET_OPTIONS = [
  { key: '2025-11-30', label: '2025年11月30日' },
  { key: '2025-12-31', label: '2025年12月31日' },
  { key: '2026-03-31', label: '2026年3月31日' },
  { key: '2026-06-30', label: '2026年6月30日' },
  { key: '2026-09-30', label: '2026年9月30日' },
  { key: '2026-12-31', label: '2026年12月31日' },
]

function parseDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfYearDate(year: number): Date {
  return new Date(year, 0, 1)
}

function daysBetweenInclusive(a: Date, b: Date): number {
  const ms = 1000 * 60 * 60 * 24
  const diff = Math.floor((b.getTime() - a.getTime()) / ms)
  return Math.max(0, diff + 1)
}

function daysToWeekSaturday(year: number, week: number): number {
  // 近似：周六为第 week*7 天
  const saturday = new Date(year, 0, 1 + week * 7 - 1)
  return daysBetweenInclusive(startOfYearDate(year), saturday)
}

function yuanToWan(value: number): number {
  return Math.round((value / 10000) * 100) / 100
}

export function PredictionManagerPanel() {
  const rawData = useDataStore(state => state.rawData)
  const filters = useFilterStore(state => state.filters)
  const filteredData = useMemo(() => DataService.filter(rawData, filters), [rawData, filters])

  const { items: premiumItems } = usePremiumDimensionAnalysis(
    'business_type_category',
    20
  )
  const lossItems = useLossDimensionAnalysis('business_type_category')

  const [targetKey, setTargetKey] = useState<string>(TARGET_OPTIONS[0].key)
  const [overrides, setOverrides] = useState<
    Record<string, PredictionOverride>
  >({})

  const policyYear: number = useMemo(() => {
    if (filters.years && filters.years.length > 0) return filters.years[0]
    const first = filteredData[0]
    return first ? first.policy_start_year : new Date().getFullYear()
  }, [filters.years, filteredData])

  const latestWeek: number = useMemo(() => {
    if (filters.singleModeWeek) return filters.singleModeWeek
    if (filters.trendModeWeeks && filters.trendModeWeeks.length > 0) {
      return safeMax(filters.trendModeWeeks)
    }
    const maxWeek = filteredData.reduce(
      (acc, r) => Math.max(acc, r.week_number),
      1
    )
    return maxWeek || 1
  }, [filters.singleModeWeek, filters.trendModeWeeks, filteredData])

  const daysToLatestSat = daysToWeekSaturday(policyYear, latestWeek)
  const targetDate = parseDate(targetKey)
  const daysToTarget = daysBetweenInclusive(
    startOfYearDate(policyYear),
    targetDate
  )

  // 按业务类型分组计算当周KPI（获取满期率、费用率、赔付率等基线）
  const kpiByBusinessType = useMemo(() => {
    const groups = new Map<string, typeof filteredData>()
    filteredData.forEach(r => {
      const key = r.business_type_category || '__EMPTY__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    })
    const map = new Map<string, ReturnType<typeof kpiEngine.calculate>>()
    groups.forEach((records, key) => {
      map.set(key, kpiEngine.calculate(records))
    })
    return map
  }, [filteredData])

  // 业务类型的基础数据映射
  const basics = useMemo(() => {
    const lossMap = new Map<
      string,
      { avgClaim: number | null; claimCases: number }
    >()
    lossItems.forEach(item => {
      lossMap.set(item.key, {
        avgClaim: item.current.averageClaim,
        claimCases: item.current.claimCaseCount,
      })
    })

    const map = new Map(
      premiumItems.map(it => [
        it.key,
        {
          label: it.label,
          signedPremiumYuan: it.signedPremiumYuan,
          premiumPlanYuan: it.premiumPlanYuan,
          policyCount: it.policyCount,
          averagePremium: it.averagePremium,
          avgClaim: lossMap.get(it.key)?.avgClaim ?? null,
          claimCases: lossMap.get(it.key)?.claimCases ?? 0,
        },
      ])
    )
    return map
  }, [premiumItems, lossItems])

  const rows = useMemo(() => {
    return premiumItems.map(it => {
      const key = it.key
      const base = basics.get(key)!
      const ov = overrides[key] || {}
      const kpi = kpiByBusinessType.get(key)

      const latestMaturity = kpi?.maturity_ratio ?? null // %
      const dailyMaturity =
        latestMaturity !== null && daysToLatestSat > 0
          ? latestMaturity / daysToLatestSat
          : null
      const maturityAtTarget =
        dailyMaturity !== null
          ? Math.min(100, Math.max(0, dailyMaturity * daysToTarget))
          : latestMaturity

      // 预测签单保费
      let signedPremiumYuan = base.signedPremiumYuan
      if (typeof ov.signedPremiumYuan === 'number') {
        signedPremiumYuan = ov.signedPremiumYuan
      } else if (
        typeof ov.premiumAchievementRate === 'number' &&
        base.premiumPlanYuan > 0
      ) {
        signedPremiumYuan =
          (base.premiumPlanYuan * ov.premiumAchievementRate) / 100
      } else if (
        typeof ov.averagePremium === 'number' &&
        typeof ov.policyCount === 'number'
      ) {
        signedPremiumYuan = ov.averagePremium * ov.policyCount
      }

      // 预测件数与单均保费
      let policyCount = base.policyCount
      if (typeof ov.policyCount === 'number') {
        policyCount = Math.round(Math.max(0, ov.policyCount))
      } else if (typeof ov.averagePremium === 'number') {
        policyCount = Math.round(
          signedPremiumYuan / Math.max(1, ov.averagePremium)
        )
      }
      let averagePremium =
        base.averagePremium ??
        (base.policyCount > 0
          ? base.signedPremiumYuan / base.policyCount
          : null)
      if (typeof ov.averagePremium === 'number') {
        averagePremium = ov.averagePremium
      } else if (policyCount > 0) {
        averagePremium = signedPremiumYuan / policyCount
      }

      // 预测满期率与满期保费
      const maturityRatio = maturityAtTarget ?? kpi?.maturity_ratio ?? null
      const maturedPremiumYuan =
        maturityRatio !== null ? (signedPremiumYuan * maturityRatio) / 100 : 0

      // 预测赔案件数（优先使用输入的满期出险率或案件数）
      let claimCaseCount = base.claimCases
      if (typeof ov.claimCaseCount === 'number') {
        claimCaseCount = Math.round(Math.max(0, ov.claimCaseCount))
      } else if (typeof ov.maturedFrequencyRate === 'number') {
        claimCaseCount = Math.round(
          (policyCount * ov.maturedFrequencyRate) / 100
        )
      } else if (
        policyCount > 0 &&
        maturityRatio !== null &&
        kpi?.matured_claim_ratio !== null
      ) {
        // 基于当前成熟出险率估计（如有）
        const freq = kpi?.matured_claim_ratio ?? 0
        claimCaseCount = Math.round((policyCount * freq) / 100)
      }

      // 预测案均赔款
      let averageClaim = base.avgClaim ?? null
      if (typeof ov.averageClaim === 'number') {
        averageClaim = ov.averageClaim
      }

      // 预测已报告赔款：优先使用输入的满期赔付率，否则用案件数*案均
      let reportedClaimPaymentYuan = 0
      if (typeof ov.lossRatio === 'number' && maturityRatio !== null) {
        reportedClaimPaymentYuan = (maturedPremiumYuan * ov.lossRatio) / 100
      } else if (averageClaim !== null) {
        reportedClaimPaymentYuan = claimCaseCount * averageClaim
      } else if ((kpi?.loss_ratio ?? null) !== null) {
        reportedClaimPaymentYuan =
          (maturedPremiumYuan * (kpi?.loss_ratio ?? 0)) / 100
      }

      // 预测费用率与费用金额
      const expenseRatio =
        typeof ov.expenseRatio === 'number'
          ? ov.expenseRatio
          : (kpi?.expense_ratio ?? null)
      const expenseAmountYuan =
        expenseRatio !== null ? (signedPremiumYuan * expenseRatio) / 100 : 0

      // 预测边贡
      const contributionMarginAmountYuan =
        maturedPremiumYuan - reportedClaimPaymentYuan - expenseAmountYuan
      const contributionMarginRatio =
        maturedPremiumYuan > 0
          ? (contributionMarginAmountYuan / maturedPremiumYuan) * 100
          : null

      // 派生率值
      const lossRatio =
        maturedPremiumYuan > 0
          ? (reportedClaimPaymentYuan / maturedPremiumYuan) * 100
          : null
      const maturedFrequencyRate =
        policyCount > 0 && maturityRatio !== null
          ? (claimCaseCount / policyCount) * maturityRatio
          : null
      const averageExpense =
        policyCount > 0 ? expenseAmountYuan / policyCount : null
      const averageContribution =
        policyCount > 0 ? contributionMarginAmountYuan / policyCount : null

      return {
        key,
        label: base.label,
        input: ov,
        output: {
          signedPremiumWan: yuanToWan(signedPremiumYuan),
          maturedPremiumWan: yuanToWan(maturedPremiumYuan),
          reportedClaimPaymentWan: yuanToWan(reportedClaimPaymentYuan),
          expenseAmountWan: yuanToWan(expenseAmountYuan),
          contributionMarginWan: yuanToWan(contributionMarginAmountYuan),
          policyCount,
          claimCaseCount,
        },
        rates: {
          maturityRatio,
          lossRatio,
          expenseRatio,
          contributionMarginRatio,
          maturedFrequencyRate,
        },
        averages: {
          averagePremium,
          averageClaim,
          averageExpense,
          averageContribution,
        },
      }
    })
  }, [
    premiumItems,
    basics,
    overrides,
    kpiByBusinessType,
    daysToLatestSat,
    daysToTarget,
  ])

  const handleOverrideChange = (
    key: string,
    field: keyof PredictionOverride,
    value: string
  ) => {
    const num = value === '' ? undefined : Number(value)
    setOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: num },
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-700 font-medium">目标时间点</div>
          <Select value={targetKey} onValueChange={setTargetKey}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="选择目标日期" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_OPTIONS.map(opt => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-slate-500">
            满期率预测：日均满期率 × 年内已过天数（按所选年度）
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {rows.map(row => (
          <Card key={row.key} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-[180px]">
                <div className="text-base font-semibold text-slate-800">
                  {row.label}
                </div>
                <div className="mt-1 text-xs text-slate-500">业务类型</div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* 输入组合 */}
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    签单保费(元)
                  </div>
                  <Input
                    type="number"
                    value={row.input.signedPremiumYuan ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'signedPremiumYuan',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    保费达成率(%)
                  </div>
                  <Input
                    type="number"
                    value={row.input.premiumAchievementRate ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'premiumAchievementRate',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    单均保费(元)
                  </div>
                  <Input
                    type="number"
                    value={row.input.averagePremium ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'averagePremium',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    保单件数(件)
                  </div>
                  <Input
                    type="number"
                    value={row.input.policyCount ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'policyCount',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    赔案件数(件)
                  </div>
                  <Input
                    type="number"
                    value={row.input.claimCaseCount ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'claimCaseCount',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    满期出险率(%)
                  </div>
                  <Input
                    type="number"
                    value={row.input.maturedFrequencyRate ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'maturedFrequencyRate',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    案均赔款(元)
                  </div>
                  <Input
                    type="number"
                    value={row.input.averageClaim ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'averageClaim',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">费用率(%)</div>
                  <Input
                    type="number"
                    value={row.input.expenseRatio ?? ''}
                    onChange={e =>
                      handleOverrideChange(
                        row.key,
                        'expenseRatio',
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">
                    满期赔付率(%)
                  </div>
                  <Input
                    type="number"
                    value={row.input.lossRatio ?? ''}
                    onChange={e =>
                      handleOverrideChange(row.key, 'lossRatio', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              <div>
                <div className="text-slate-500">签单保费(万元)</div>
                <div className="font-semibold">
                  {row.output.signedPremiumWan.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">满期保费(万元)</div>
                <div className="font-semibold">
                  {row.output.maturedPremiumWan.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">已报告赔款(万元)</div>
                <div className="font-semibold">
                  {row.output.reportedClaimPaymentWan.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">费用金额(万元)</div>
                <div className="font-semibold">
                  {row.output.expenseAmountWan.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">满期边贡额(万元)</div>
                <div className="font-semibold">
                  {row.output.contributionMarginWan.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">保单/赔案件数</div>
                <div className="font-semibold">
                  {row.output.policyCount.toLocaleString()} /{' '}
                  {row.output.claimCaseCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <div className="text-slate-500">满期率(%)</div>
                <div className="font-medium">
                  {row.rates.maturityRatio
                    ? row.rates.maturityRatio.toFixed(2)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">满期赔付率(%)</div>
                <div className="font-medium">
                  {row.rates.lossRatio ? row.rates.lossRatio.toFixed(2) : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">费用率(%)</div>
                <div className="font-medium">
                  {row.rates.expenseRatio
                    ? row.rates.expenseRatio.toFixed(2)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">满期边贡率(%)</div>
                <div className="font-medium">
                  {row.rates.contributionMarginRatio
                    ? row.rates.contributionMarginRatio.toFixed(2)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">满期出险率(%)</div>
                <div className="font-medium">
                  {row.rates.maturedFrequencyRate
                    ? row.rates.maturedFrequencyRate.toFixed(2)
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">
                  件均/案均/单均费用/单均边贡(元)
                </div>
                <div className="font-medium">
                  {row.averages.averagePremium
                    ? Math.round(row.averages.averagePremium).toLocaleString()
                    : '—'}{' '}
                  /
                  {row.averages.averageClaim
                    ? Math.round(row.averages.averageClaim).toLocaleString()
                    : '—'}{' '}
                  /
                  {row.averages.averageExpense
                    ? Math.round(row.averages.averageExpense).toLocaleString()
                    : '—'}{' '}
                  /
                  {row.averages.averageContribution
                    ? Math.round(
                        row.averages.averageContribution
                      ).toLocaleString()
                    : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOverrides(prev => ({ ...prev, [row.key]: {} }))
                }
              >
                清空该行输入
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
