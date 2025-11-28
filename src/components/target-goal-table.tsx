'use client'

import React, { useMemo, useState } from 'react'
import { useGoalStore } from '@/store/goalStore'
import {
  buildGoalDisplayRow,
  formatAchievementRate,
  formatGapValue,
  formatShareOfTotal,
  isNegativeGap,
  sortByInitialTarget,
} from '@/utils/goalCalculator'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const columns = [
  { key: 'bizType', label: '业务类型' },
  { key: 'annualTargetInit', label: '年初目标（万）' },
  { key: 'annualTargetTuned', label: '微调目标（万）' },
  { key: 'achieved', label: '已达成（万）' },
  { key: 'initialAchievementRate', label: '年初达成率' },
  { key: 'tunedAchievementRate', label: '微调达成率' },
  { key: 'initialGap', label: '年初缺口（万）' },
  { key: 'tunedGap', label: '微调缺口（万）' },
  { key: 'shareOfTotal', label: '总目标占比' },
] as const

type ColumnKey = (typeof columns)[number]['key']

type SortState = {
  key: ColumnKey
  direction: 'asc' | 'desc'
}

/**
 * 双轨目标表格
 * 用于同时展示年初目标与微调目标的关键指标
 */
export function TargetGoalTable() {
  const initialVersion = useGoalStore(state => state.getInitialVersion())
  const currentVersion = useGoalStore(state => state.getCurrentVersion())
  const achievedMap = useGoalStore(state => state.achievedMap)

  const [sortState, setSortState] = useState<SortState>({
    key: 'annualTargetInit',
    direction: 'desc',
  })

  const tableRows = useMemo(() => {
    const totalInitial = initialVersion.rows.reduce(
      (sum, row) => sum + row.annualTargetInit,
      0
    )

    const displayRows = currentVersion.rows.map(row => {
      const initRow = initialVersion.rows.find(
        item => item.bizType === row.bizType
      )
      const achieved = achievedMap[row.bizType] ?? 0
      const annualTargetInit = initRow?.annualTargetInit ?? row.annualTargetInit
      return buildGoalDisplayRow(
        {
          bizType: row.bizType,
          annualTargetInit,
          annualTargetTuned: row.annualTargetTuned,
          achieved,
        },
        totalInitial
      )
    })

    return sortByInitialTarget(displayRows)
  }, [achievedMap, currentVersion, initialVersion])

  const sortedRows = useMemo(() => {
    const rows = [...tableRows]
    const { key, direction } = sortState
    rows.sort((a, b) => {
      const valueA = a[key as keyof typeof a]
      const valueB = b[key as keyof typeof b]

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc'
          ? valueA.localeCompare(valueB, 'zh-Hans-CN')
          : valueB.localeCompare(valueA, 'zh-Hans-CN')
      }

      const numberA = typeof valueA === 'number' ? valueA : Number(valueA ?? 0)
      const numberB = typeof valueB === 'number' ? valueB : Number(valueB ?? 0)
      return direction === 'asc' ? numberA - numberB : numberB - numberA
    })
    return rows
  }, [sortState, tableRows])

  const handleSort = (key: ColumnKey) => {
    setSortState(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return {
        key,
        direction: key === 'bizType' ? 'asc' : 'desc',
      }
    })
  }

  const showShareColumn = useMemo(
    () => sortedRows.some(row => row.shareOfTotal !== null),
    [sortedRows]
  )

  const renderRateCell = (value: number | null) => {
    if (value === null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-muted-foreground">—</span>
            </TooltipTrigger>
            <TooltipContent>分母为 0，无法计算</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return formatAchievementRate(value)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="min-w-full table-fixed">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map(column => {
                if (column.key === 'shareOfTotal' && !showShareColumn) {
                  return null
                }
                const isActive = sortState.key === column.key
                return (
                  <th
                    key={column.key}
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort(column.key)}
                    aria-sort={
                      isActive
                        ? sortState.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span
                      className={cn(
                        'flex items-center gap-1 font-semibold',
                        isActive && 'text-primary'
                      )}
                    >
                      {column.label}
                      {isActive
                        ? sortState.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-background text-sm">
            {sortedRows.map(row => (
              <tr key={row.bizType} className="border-t">
                <td className="px-4 py-3 font-medium">{row.bizType}</td>
                <td className="px-4 py-3 text-right">
                  {row.annualTargetInit.toLocaleString('zh-Hans-CN')}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.annualTargetTuned.toLocaleString('zh-Hans-CN')}
                </td>
                <td className="px-4 py-3 text-right">
                  {(row.achieved || 0).toLocaleString('zh-Hans-CN')}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderRateCell(row.initialAchievementRate)}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderRateCell(row.tunedAchievementRate)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-right',
                    isNegativeGap(row.initialGap) ? 'text-red-500' : undefined
                  )}
                >
                  {formatGapValue(row.initialGap)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-right',
                    isNegativeGap(row.tunedGap) ? 'text-red-500' : undefined
                  )}
                >
                  {formatGapValue(row.tunedGap)}
                </td>
                {showShareColumn ? (
                  <td className="px-4 py-3 text-right">
                    {formatShareOfTotal(row.shareOfTotal)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}
