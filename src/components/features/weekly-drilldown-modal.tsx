'use client'

import React, { useMemo } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPercent } from '@/utils/format'
import { applyFilters } from '@/hooks/use-filtered-data'
import type { InsuranceRecord, FilterState } from '@/types/insurance'

/**
 * 下钻层级类型
 */
type DrilldownLevel = 0 | 1 | 2 | 3 | 4

interface DrilldownState {
  level: DrilldownLevel
  weekNumber: number
  year: number
  organization?: string
  businessType?: string
  coverageType?: string
}

interface DrilldownData {
  key: string
  label: string
  lossRatio: number | null
  expenseRatio?: number | null
  maturedPremium: number
  claimPayment: number
}

interface WeeklyDrilldownModalProps {
  open: boolean
  onClose: () => void
  drilldownState: DrilldownState
  onDrilldownChange: (state: DrilldownState) => void
  rawRecords: InsuranceRecord[]
  filters: FilterState
}

/**
 * 创建周范围筛选器
 */
function createWeekScopedFilters(
  baseFilters: FilterState,
  year: number,
  week: number
): FilterState {
  return {
    ...baseFilters,
    years: [year],
    weeks: [week],
    trendModeWeeks: week > 0 ? [week] : [],
    singleModeWeek: week > 0 ? week : null,
  }
}

/**
 * 周度下钻分析模态框
 *
 * 下钻路径：三级机构 → 业务类型 → 险别组合 → 新转续状态
 */
export const WeeklyDrilldownModal: React.FC<WeeklyDrilldownModalProps> = ({
  open,
  onClose,
  drilldownState,
  onDrilldownChange,
  rawRecords,
  filters,
}) => {
  /**
   * 获取当前层级的数据
   */
  const currentData = useMemo<DrilldownData[]>(() => {
    const { level, year, weekNumber, organization, businessType, coverageType } = drilldownState

    // 创建周范围筛选器
    const weekFilters = createWeekScopedFilters(filters, year, weekNumber)
    let filteredRecords = applyFilters(rawRecords, weekFilters)

    // 根据下钻路径进一步筛选
    if (level >= 2 && organization) {
      filteredRecords = filteredRecords.filter(r => r.third_level_organization === organization)
    }
    if (level >= 3 && businessType) {
      filteredRecords = filteredRecords.filter(r => r.business_type_category === businessType)
    }
    if (level >= 4 && coverageType) {
      filteredRecords = filteredRecords.filter(r => r.coverage_type === coverageType)
    }

    // 根据层级进行分组聚合
    const dataMap = new Map<string, {
      maturedPremium: number
      claimPayment: number
      expenseAmount: number
    }>()

    let groupKey: (record: InsuranceRecord) => string

    if (level === 1) {
      // 第1层：三级机构
      groupKey = (r) => r.third_level_organization || '未知机构'
    } else if (level === 2) {
      // 第2层：业务类型
      groupKey = (r) => r.business_type_category || '未知业务类型'
    } else if (level === 3) {
      // 第3层：险别组合
      groupKey = (r) => r.coverage_type || '未知险别'
    } else if (level === 4) {
      // 第4层：新转续状态
      groupKey = (r) => r.is_transferred_vehicle ? '转保' : '续保'
    } else {
      return []
    }

    filteredRecords.forEach(record => {
      const key = groupKey(record)
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          maturedPremium: 0,
          claimPayment: 0,
          expenseAmount: 0,
        })
      }
      const data = dataMap.get(key)!
      data.maturedPremium += record.matured_premium_yuan
      data.claimPayment += record.reported_claim_payment_yuan
      data.expenseAmount += record.expense_amount_yuan
    })

    // 转换为数组并计算比率
    const result: DrilldownData[] = []
    dataMap.forEach((data, key) => {
      const lossRatio = data.maturedPremium > 0
        ? (data.claimPayment / data.maturedPremium) * 100
        : null
      const expenseRatio = data.maturedPremium > 0
        ? (data.expenseAmount / data.maturedPremium) * 100
        : null

      result.push({
        key,
        label: key,
        lossRatio,
        expenseRatio,
        maturedPremium: data.maturedPremium / 10000, // 转换为万元
        claimPayment: data.claimPayment / 10000, // 转换为万元
      })
    })

    // 按赔付率降序排序
    result.sort((a, b) => {
      if (a.lossRatio === null) return 1
      if (b.lossRatio === null) return -1
      return b.lossRatio - a.lossRatio
    })

    return result
  }, [drilldownState, rawRecords, filters])

  /**
   * 处理下钻点击
   */
  const handleDrilldown = (key: string) => {
    const { level } = drilldownState

    if (level === 1) {
      // 下钻到业务类型
      onDrilldownChange({
        ...drilldownState,
        level: 2,
        organization: key,
      })
    } else if (level === 2) {
      // 下钻到险别组合
      onDrilldownChange({
        ...drilldownState,
        level: 3,
        businessType: key,
      })
    } else if (level === 3) {
      // 下钻到新转续状态
      onDrilldownChange({
        ...drilldownState,
        level: 4,
        coverageType: key,
      })
    }
  }

  /**
   * 处理面包屑导航
   */
  const breadcrumbs = useMemo(() => {
    const { level, year, weekNumber, organization, businessType, coverageType } = drilldownState
    const crumbs = [
      {
        label: `${year}年第${weekNumber}周`,
        onClick: () => onDrilldownChange({ ...drilldownState, level: 1 }),
      },
    ]

    if (level >= 2 && organization) {
      crumbs.push({
        label: organization,
        onClick: () => onDrilldownChange({ ...drilldownState, level: 2 }),
      })
    }
    if (level >= 3 && businessType) {
      crumbs.push({
        label: businessType,
        onClick: () => onDrilldownChange({ ...drilldownState, level: 3 }),
      })
    }
    if (level >= 4 && coverageType) {
      crumbs.push({
        label: coverageType,
        onClick: () => onDrilldownChange({ ...drilldownState, level: 4 }),
      })
    }

    return crumbs
  }, [drilldownState, onDrilldownChange])

  /**
   * 获取当前层级标题
   */
  const getLevelTitle = () => {
    const { level } = drilldownState
    switch (level) {
      case 1:
        return '三级机构风险分析'
      case 2:
        return '业务类型分析'
      case 3:
        return '险别组合分析'
      case 4:
        return '新转续状态分析'
      default:
        return '数据分析'
    }
  }

  /**
   * 判断是否可以继续下钻
   */
  const canDrilldown = drilldownState.level < 4

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getLevelTitle()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <button
                onClick={crumb.onClick}
                className="hover:text-blue-600 hover:underline"
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 数据表格 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-3 font-semibold text-slate-700">
                  {drilldownState.level === 1
                    ? '三级机构'
                    : drilldownState.level === 2
                      ? '业务类型'
                      : drilldownState.level === 3
                        ? '险别组合'
                        : '状态'}
                </th>
                <th className="text-right p-3 font-semibold text-slate-700">满期保费（万元）</th>
                <th className="text-right p-3 font-semibold text-slate-700">赔款（万元）</th>
                <th className="text-right p-3 font-semibold text-slate-700">赔付率</th>
                {drilldownState.level === 1 && (
                  <th className="text-right p-3 font-semibold text-slate-700">费用率</th>
                )}
                {canDrilldown && (
                  <th className="text-center p-3 font-semibold text-slate-700">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={canDrilldown ? 6 : 5}
                    className="text-center p-6 text-slate-500"
                  >
                    暂无数据
                  </td>
                </tr>
              ) : (
                currentData.map((item) => {
                  const isRisk = item.lossRatio !== null && item.lossRatio >= 70
                  return (
                    <tr
                      key={item.key}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        isRisk ? 'bg-rose-50' : ''
                      }`}
                    >
                      <td className="p-3 text-slate-700">{item.label}</td>
                      <td className="p-3 text-right text-slate-700">
                        {formatNumber(item.maturedPremium, 2)}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {formatNumber(item.claimPayment, 2)}
                      </td>
                      <td className={`p-3 text-right font-semibold ${
                        isRisk ? 'text-rose-600' : 'text-slate-700'
                      }`}>
                        {item.lossRatio !== null ? formatPercent(item.lossRatio, 2) : '—'}
                      </td>
                      {drilldownState.level === 1 && (
                        <td className="p-3 text-right text-slate-700">
                          {item.expenseRatio !== null
                            ? formatPercent(item.expenseRatio, 2)
                            : '—'}
                        </td>
                      )}
                      {canDrilldown && (
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDrilldown(item.key)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            查看详情 <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 说明文本 */}
        <div className="mt-4 text-xs text-slate-500">
          <p>💡 提示：橙色背景表示赔付率 ≥ 70% 的风险项</p>
          {canDrilldown && <p>• 点击"查看详情"可继续下钻分析</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

WeeklyDrilldownModal.displayName = 'WeeklyDrilldownModal'
