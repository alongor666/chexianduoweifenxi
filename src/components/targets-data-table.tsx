'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useGoalStore } from '@/store/goalStore'
import { useFiltering } from '@/hooks/domains/useFiltering'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import { getDynamicColorByPremiumProgress } from '@/utils/color-scale'
import { getTimeProgressForWeek } from '@/lib/utils/date-utils'

interface RowData {
  itemKey: string
  itemLabel: string
  annualTargetInit: number
  annualTargetTuned: number
  achieved: number
  initialAchievementRate: number | null
  tunedAchievementRate: number | null
  initialGap: number
  tunedGap: number
  shareOfTotal: number
  // 新增缺口计算字段
  annualGap: number
  dailyGapForRemaining: number | null
}

interface TargetsDataTableProps {
  className?: string
}

export function TargetsDataTable({ className }: TargetsDataTableProps) {
  const {
    getCurrentVersion,
    achievedMap,
    createTunedVersion,
    currentDimension,
    getDimensionItems,
  } = useGoalStore()
  // 使用新架构的 Hook
  const { filters, selectedYear } = useFiltering()
  const [editableTargets, setEditableTargets] = useState<
    Record<string, number>
  >({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // 获取当前版本数据和维度项目
  const currentVersion = getCurrentVersion()
  const dimensionItems = getDimensionItems(currentDimension)

  // 获取维度标签映射
  const getDimensionLabel = (key: string): string => {
    // 直接返回 key 作为标签，因为 getDimensionItems 返回的就是字符串数组
    return key
  }

  // 计算剩余天数（基于选定的周）
  const remainingDays = useMemo(() => {
    if (!filters.singleModeWeek || !selectedYear) return null

    const timeProgress = getTimeProgressForWeek(
      filters.singleModeWeek,
      selectedYear
    )
    const totalDaysInYear = 365 // 简化计算，可以根据需要调整为精确天数
    const daysPassed = Math.floor(totalDaysInYear * timeProgress)
    return totalDaysInYear - daysPassed
  }, [filters.singleModeWeek, selectedYear])

  // 获取行数据的函数
  const getRowData = useCallback(
    (itemKey: string): RowData => {
      const row = currentVersion.rows.find((r: any) => r.bizType === itemKey)
      if (!row) {
        return {
          itemKey,
          itemLabel: getDimensionLabel(itemKey),
          annualTargetInit: 0,
          annualTargetTuned: 0,
          achieved: 0,
          initialAchievementRate: null,
          tunedAchievementRate: null,
          initialGap: 0,
          tunedGap: 0,
          shareOfTotal: 0,
          annualGap: 0,
          dailyGapForRemaining: null,
        }
      }

      const achieved = achievedMap[itemKey] || 0
      const tunedTarget = editableTargets[itemKey] ?? row.annualTargetTuned
      const initialAchievementRate =
        row.annualTargetInit > 0
          ? (achieved / row.annualTargetInit) * 100
          : null
      const tunedAchievementRate =
        tunedTarget > 0 ? (achieved / tunedTarget) * 100 : null
      const initialGap = row.annualTargetInit - achieved
      const tunedGap = tunedTarget - achieved

      // 计算总目标占比
      const totalTarget = currentVersion.rows.reduce(
        (sum: number, r: any) => sum + r.annualTargetTuned,
        0
      )
      const shareOfTotal =
        totalTarget > 0 ? (tunedTarget / totalTarget) * 100 : 0

      // 新增缺口计算
      const annualGap = tunedTarget - achieved
      const dailyGapForRemaining =
        remainingDays && remainingDays > 0 ? annualGap / remainingDays : null

      return {
        itemKey,
        itemLabel: getDimensionLabel(itemKey),
        annualTargetInit: row.annualTargetInit,
        annualTargetTuned: tunedTarget,
        achieved,
        initialAchievementRate,
        tunedAchievementRate,
        initialGap,
        tunedGap,
        shareOfTotal,
        annualGap,
        dailyGapForRemaining,
      }
    },
    [
      currentVersion.rows,
      achievedMap,
      editableTargets,
      getDimensionLabel,
      remainingDays,
    ]
  )

  // 计算子业务线目标总和（仅在业务类型维度时使用）
  const sumOfSubTargets = useMemo(() => {
    if (currentDimension !== 'businessType') {
      return currentVersion.rows.reduce((sum: number, row: any) => {
        const target = editableTargets[row.bizType] ?? row.annualTargetTuned
        return sum + target
      }, 0)
    }

    return currentVersion.rows
      .filter((row: any) => row.bizType !== '车险整体')
      .reduce((sum: number, row: any) => {
        const target = editableTargets[row.bizType] ?? row.annualTargetTuned
        return sum + target
      }, 0)
  }, [currentVersion.rows, editableTargets, currentDimension])

  // 实时验证警告
  const validationWarnings = useMemo(() => {
    const warnings: Array<{ type: 'error' | 'warning'; message: string }> = []

    // 检查单个项目目标变化幅度
    currentVersion.rows.forEach((row: any) => {
      const editedTarget = editableTargets[row.bizType]
      if (
        editedTarget !== undefined &&
        (currentDimension !== 'businessType' || row.bizType !== '车险整体')
      ) {
        const changePercent =
          Math.abs(
            (editedTarget - row.annualTargetTuned) / row.annualTargetTuned
          ) * 100
        if (changePercent > 50) {
          warnings.push({
            type: 'warning',
            message: `${getDimensionLabel(row.bizType)}目标变化幅度过大：${changePercent.toFixed(1)}%`,
          })
        }
      }
    })

    return warnings
  }, [
    currentVersion.rows,
    editableTargets,
    currentDimension,
    getDimensionLabel,
  ])

  // 风险等级计算
  const getRiskLevel = (
    achievementRate: number | null
  ): 'safe' | 'warning' | 'danger' => {
    if (achievementRate === null) return 'safe'
    if (achievementRate < 70) return 'danger'
    if (achievementRate < 85) return 'warning'
    return 'safe'
  }

  // 风险样式
  const getRiskStyle = (
    riskLevel: 'safe' | 'warning' | 'danger',
    isEdited: boolean = false
  ) => {
    const baseStyle = 'transition-all duration-200'

    if (isEdited) {
      return `${baseStyle} bg-blue-50 border-l-4 border-blue-400`
    }

    switch (riskLevel) {
      case 'danger':
        return `${baseStyle} bg-red-50 border-l-4 border-red-400`
      case 'warning':
        return `${baseStyle} bg-yellow-50 border-l-4 border-yellow-400`
      default:
        return baseStyle
    }
  }

  // 键盘导航处理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, itemKey: string) => {
      // 禁用上下键的默认行为（防止数字增减）
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()

        // 获取所有可编辑的输入框
        const editableInputs = Object.keys(inputRefs.current)
          .filter(key => inputRefs.current[key] !== null)
          .sort()

        const currentIndex = editableInputs.indexOf(itemKey)

        if (currentIndex !== -1) {
          let nextIndex: number

          if (e.key === 'ArrowUp') {
            // 向上移动到前一个输入框
            nextIndex =
              currentIndex > 0 ? currentIndex - 1 : editableInputs.length - 1
          } else {
            // 向下移动到下一个输入框
            nextIndex =
              currentIndex < editableInputs.length - 1 ? currentIndex + 1 : 0
          }

          const nextInput = inputRefs.current[editableInputs[nextIndex]]
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        }
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()

        // Tab键也实现导航功能
        const editableInputs = Object.keys(inputRefs.current)
          .filter(key => inputRefs.current[key] !== null)
          .sort()

        const currentIndex = editableInputs.indexOf(itemKey)

        if (currentIndex !== -1) {
          const nextIndex =
            currentIndex < editableInputs.length - 1 ? currentIndex + 1 : 0
          const nextInput = inputRefs.current[editableInputs[nextIndex]]
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        }
      }
    },
    []
  )

  // 应用更改
  const handleApplyChanges = () => {
    const updatedRows = currentVersion.rows.map((row: any) => {
      const editedTarget = editableTargets[row.bizType]
      if (
        editedTarget !== undefined &&
        (currentDimension !== 'businessType' || row.bizType !== '车险整体')
      ) {
        return { ...row, annualTargetTuned: editedTarget }
      }
      return row
    })

    // 仅在业务类型维度时自动计算车险整体目标
    if (currentDimension === 'businessType') {
      const subBusinessSum = updatedRows
        .filter((row: any) => row.bizType !== '车险整体')
        .reduce((sum: number, row: any) => sum + row.annualTargetTuned, 0)

      const finalRows = updatedRows.map((row: any) => {
        if (row.bizType === '车险整体') {
          return { ...row, annualTargetTuned: subBusinessSum }
        }
        return row
      })

      createTunedVersion(finalRows)
    } else {
      createTunedVersion(updatedRows)
    }

    setEditableTargets({})
  }

  // 表格数据
  const tableData = useMemo(() => {
    return currentVersion.rows.map((row: any) => getRowData(row.bizType))
  }, [currentVersion.rows, getRowData])

  // 整体数据（仅在业务类型维度显示）
  const overallData =
    currentDimension === 'businessType'
      ? tableData.find(row => row.itemKey === '车险整体')
      : null
  const mainData =
    currentDimension === 'businessType'
      ? tableData.filter(row => row.itemKey !== '车险整体')
      : tableData

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>目标设定与达成情况</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 实时验证警告 */}
        {validationWarnings.length > 0 && (
          <div className="mb-4 space-y-2">
            {validationWarnings.map((warning, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-md text-sm',
                  warning.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                )}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium">
                  {currentDimension === 'businessType'
                    ? '业务类型'
                    : currentDimension === 'thirdLevelOrganization'
                      ? '三级机构'
                      : currentDimension === 'customerCategory'
                        ? '客户类型'
                        : '保险类型'}
                </th>
                <th className="text-right p-3 font-medium">年初目标</th>
                <th className="text-right p-3 font-medium">调优目标</th>
                <th className="text-right p-3 font-medium">已达成</th>
                <th className="text-right p-3 font-medium">年初达成率</th>
                <th className="text-right p-3 font-medium">调优达成率</th>
                <th className="text-right p-3 font-medium">年目标缺口</th>
                <th className="text-right p-3 font-medium">日均缺口</th>
                <th className="text-right p-3 font-medium">占比</th>
              </tr>
            </thead>
            <tbody>
              {/* 整体数据行（仅业务类型维度显示） */}
              {overallData && (
                <tr className="border-b bg-blue-50 font-medium">
                  <td className="p-3 font-semibold text-blue-600">
                    {overallData.itemLabel}
                  </td>
                  <td className="text-right p-3 font-semibold">
                    {formatNumber(overallData.annualTargetInit)}
                  </td>
                  <td className="text-right p-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        自动计算
                      </span>
                      <span className="font-semibold text-blue-600">
                        {formatNumber(sumOfSubTargets)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right p-3">
                    {formatNumber(overallData.achieved)}
                  </td>
                  <td className="text-right p-3">
                    {overallData.initialAchievementRate !== null && (
                      <span
                        className={
                          getDynamicColorByPremiumProgress(
                            overallData.initialAchievementRate / 100
                          ).text
                        }
                      >
                        {overallData.initialAchievementRate.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3">
                    {overallData.tunedAchievementRate !== null && (
                      <span
                        className={
                          getDynamicColorByPremiumProgress(
                            overallData.tunedAchievementRate / 100
                          ).text
                        }
                      >
                        {overallData.tunedAchievementRate.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="text-right p-3">
                    <span
                      className={
                        overallData.annualGap > 0
                          ? 'text-red-500'
                          : 'text-green-500'
                      }
                    >
                      {formatNumber(overallData.annualGap)}
                    </span>
                  </td>
                  <td className="text-right p-3">
                    {overallData.dailyGapForRemaining !== null ? (
                      <span
                        className={
                          overallData.dailyGapForRemaining > 0
                            ? 'text-red-500'
                            : 'text-green-500'
                        }
                      >
                        {formatNumber(overallData.dailyGapForRemaining)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-right p-3">
                    {overallData.shareOfTotal.toFixed(1)}%
                  </td>
                </tr>
              )}

              {/* 主要数据行 */}
              {mainData.map(row => {
                const riskLevel = getRiskLevel(row.tunedAchievementRate)
                const isEdited = editableTargets[row.itemKey] !== undefined

                return (
                  <tr
                    key={row.itemKey}
                    className={cn(
                      'border-b hover:bg-gray-50',
                      getRiskStyle(riskLevel, isEdited)
                    )}
                  >
                    <td className="p-3 flex items-center gap-2">
                      {(riskLevel === 'danger' || riskLevel === 'warning') && (
                        <AlertCircle
                          className={cn('h-4 w-4', {
                            'text-red-500': riskLevel === 'danger',
                            'text-yellow-500': riskLevel === 'warning',
                          })}
                        />
                      )}
                      <span className="font-medium">{row.itemLabel}</span>
                    </td>
                    <td className="text-right p-3">
                      {formatNumber(row.annualTargetInit)}
                    </td>
                    <td className="text-right p-3">
                      <Input
                        ref={el => {
                          inputRefs.current[row.itemKey] = el
                        }}
                        type="number"
                        value={
                          editableTargets[row.itemKey] ?? row.annualTargetTuned
                        }
                        onChange={e => {
                          // 只允许输入整数，过滤掉小数点和非数字字符
                          let value = e.target.value.replace(/[^0-9]/g, '')
                          // 如果为空，默认为0
                          const numericValue =
                            value === '' ? 0 : parseInt(value, 10)
                          setEditableTargets(prev => ({
                            ...prev,
                            [row.itemKey]: numericValue,
                          }))
                        }}
                        onKeyDown={e => handleKeyDown(e, row.itemKey)}
                        className="w-24 text-right text-sm"
                        step="1"
                      />
                    </td>
                    <td className="text-right p-3">
                      {formatNumber(row.achieved)}
                    </td>
                    <td className="text-right p-3">
                      {row.initialAchievementRate !== null && (
                        <span
                          className={
                            getDynamicColorByPremiumProgress(
                              row.initialAchievementRate / 100
                            ).text
                          }
                        >
                          {row.initialAchievementRate.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      {row.tunedAchievementRate !== null && (
                        <span
                          className={
                            getDynamicColorByPremiumProgress(
                              row.tunedAchievementRate / 100
                            ).text
                          }
                        >
                          {row.tunedAchievementRate.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      <span
                        className={
                          row.annualGap > 0 ? 'text-red-500' : 'text-green-500'
                        }
                      >
                        {formatNumber(row.annualGap)}
                      </span>
                    </td>
                    <td className="text-right p-3">
                      {row.dailyGapForRemaining !== null ? (
                        <span
                          className={
                            row.dailyGapForRemaining > 0
                              ? 'text-red-500'
                              : 'text-green-500'
                          }
                        >
                          {formatNumber(row.dailyGapForRemaining)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-right p-3">
                      {row.shareOfTotal.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 操作按钮 */}
        {Object.keys(editableTargets).length > 0 && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditableTargets({})}>
              取消
            </Button>
            <Button onClick={handleApplyChanges}>应用更改</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
