'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AnalysisTabs, type AnalysisTabValue } from '@/components/layout/analysis-tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TargetsDataTable } from '@/components/targets-data-table'
import { TargetManagementPanel } from '@/components/target-management-panel'
import { DimensionSelector } from '@/components/dimension-selector'
import { WeekSelector } from '@/components/filters/week-selector'
import { useGoalStore } from '@/store/goalStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { useFiltering } from '@/hooks/domains/useFiltering'
import { normalizeChineseText } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import { formatAchievementRate } from '@/utils/goalCalculator'

export default function TargetsPage() {
  const router = useRouter()
  // 使用新架构的 Hooks
  const { rawData } = useInsuranceData()
  const { filters, updateFilters } = useFiltering()
  const setAchievedMap = useGoalStore(state => state.setAchievedMap)
  const initialVersion = useGoalStore(state => state.getInitialVersion())
  const currentVersion = useGoalStore(state => state.getCurrentVersion())
  const achievedMap = useGoalStore(state => state.achievedMap)
  const currentDimension = useGoalStore(state => state.currentDimension)
  const switchDimension = useGoalStore(state => state.switchDimension)

  // 强制单选周模式
  useEffect(() => {
    updateFilters({ viewMode: 'single' })
  }, [updateFilters])

  // 获取可用周次
  const availableWeeks = useMemo(() => {
    const weekSet = new Set<number>()
    rawData.forEach(record => {
      if (record.week_number) {
        weekSet.add(record.week_number)
      }
    })
    return Array.from(weekSet)
      .sort((a, b) => a - b)
      .map(week => ({
        label: `W${week}`,
        value: `${week}`,
        week
      }))
  }, [rawData])

  // 基于选定周数据计算已达成值
  const achievedWanMap = useMemo(() => {
    const aggregatedYuan = new Map<string, number>()
    
    // 只使用选定周的数据
    const selectedWeek = filters.singleModeWeek
    const filteredData = selectedWeek 
      ? rawData.filter(record => record.week_number === selectedWeek)
      : []

    filteredData.forEach(record => {
      const bizType = normalizeChineseText(record.business_type_category)
      if (!bizType) {
        return
      }
      const current = aggregatedYuan.get(bizType) ?? 0
      aggregatedYuan.set(bizType, current + record.signed_premium_yuan)
    })

    const result: Record<string, number> = {}
    initialVersion.rows.forEach(row => {
      const normalized = normalizeChineseText(row.bizType)
      const totalYuan = aggregatedYuan.get(normalized) ?? 0
      result[row.bizType] = Number((totalYuan / 10000).toFixed(2))
    })

    return result
  }, [initialVersion, rawData, filters.singleModeWeek])

  useEffect(() => {
    setAchievedMap(achievedWanMap)
  }, [achievedWanMap, setAchievedMap])

  const totalInitial = useMemo(
    () => initialVersion.rows.reduce((sum, row) => sum + row.annualTargetInit, 0),
    [initialVersion]
  )
  const totalTuned = useMemo(
    () => currentVersion.rows.reduce((sum, row) => sum + row.annualTargetTuned, 0),
    [currentVersion]
  )
  const totalAchieved = useMemo(
    () => Object.values(achievedMap).reduce((sum, value) => sum + value, 0),
    [achievedMap]
  )

  const initialAchievementRate = totalInitial > 0 ? totalAchieved / totalInitial : null
  const tunedAchievementRate = totalTuned > 0 ? totalAchieved / totalTuned : null

  const navigateByTab = (tab: AnalysisTabValue) => {
    if (tab === 'targets') return
    router.push(tab === 'kpi' ? '/' : `/?tab=${tab}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回主页
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">目标管理</h1>
        </div>

        <AnalysisTabs active="targets" onChange={navigateByTab} />

        {/* 维度选择器和周选择器 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>目标维度</CardTitle>
            </CardHeader>
            <CardContent>
              <DimensionSelector
                selectedDimension={currentDimension}
                onDimensionChange={switchDimension}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分析周次</CardTitle>
            </CardHeader>
            <CardContent>
              <WeekSelector availableWeeks={availableWeeks} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>目标概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">初始目标总额</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatNumber(totalInitial)} 万元
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    达成率: {formatAchievementRate(initialAchievementRate)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">调整后目标</div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatNumber(totalTuned)} 万元
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    达成率: {formatAchievementRate(tunedAchievementRate)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">实际完成</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatNumber(totalAchieved)} 万元
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>目标详情</CardTitle>
            </CardHeader>
            <CardContent>
              <TargetsDataTable />
            </CardContent>
          </Card>

          {/* 目标管理操作面板 - 移到底部 */}
          <TargetManagementPanel />
        </div>
      </div>
    </div>
  )
}
