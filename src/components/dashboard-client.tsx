'use client'

import { Database, HardDrive, Cloud } from 'lucide-react'
import { FileUpload } from '@/components/features/file-upload'
import { FullKPIDashboard } from '@/components/features/full-kpi-dashboard'
import { WeeklyOperationalTrend } from '@/components/features/weekly-operational-trend'
import { ComparisonAnalysisPanel } from '@/components/features/comparison-analysis'
import { MultiChartTabs } from '@/components/features/multi-chart-tabs'
import { CustomerSegmentationBubble } from '@/components/features/customer-segmentation-bubble'
import { ExpenseHeatmap } from '@/components/features/expense-heatmap'
import { ThematicAnalysis } from '@/components/features/thematic-analysis'
import {
  FilterInteractionManager,
  useFilterPersistence,
} from '@/components/filters/filter-interaction-manager'
import { TopToolbar } from '@/components/layout/top-toolbar'
import { Toaster } from '@/components/ui/toaster'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { useFiltering } from '@/hooks/domains/useFiltering'
import { useKPICalculation } from '@/hooks/domains/useKPICalculation'
import { useKPI } from '@/hooks/use-kpi'
import { usePersistData } from '@/hooks/use-persist-data'
import { useSmartComparison } from '@/hooks/use-smart-comparison'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EnterpriseCockpit } from '@/components/features/enterprise-cockpit'
import {
  AnalysisTabs,
  type AnalysisTabValue,
} from '@/components/layout/analysis-tabs'
import { PredictionManagerPanel } from '@/components/features/prediction-manager'
import { DataManagementPanel } from '@/components/features/data-management-panel'
import { DrillDownBar } from '@/components/features/drill-down/drill-down-bar'
import { useDrillDownStore } from '@/store/drill-down-store'
import type { InsuranceRecord } from '@/types/insurance'

interface DashboardClientProps {
  initialData: InsuranceRecord[]
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  // 使用新架构的 Hooks
  const { rawData } = useInsuranceData()
  const { setViewMode, viewMode } = useFiltering()
  const kpiData = useKPI()
  const { premiumTargets } = useKPICalculation()
  const premiumTargetsOverall = premiumTargets?.overall

  // 判断数据来源
  const dataSource =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_DATA_SOURCE || 'local'
      : 'local'
  const isSupabaseMode = dataSource === 'supabase' && initialData.length > 0

  // 使用智能环比数据（优化参数以避免无限重渲染）
  const smartComparisonOptions = useMemo(
    () => ({
      annualTargetYuan: premiumTargetsOverall || null,
    }),
    [premiumTargetsOverall]
  )
  const { currentKpi, compareKpi, previousWeekNumber } = useSmartComparison(
    smartComparisonOptions
  )

  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTabParam =
    (searchParams?.get('tab') as AnalysisTabValue | null) ?? 'kpi'
  const validTabs: AnalysisTabValue[] = [
    'data-management',
    'cockpit',
    'kpi',
    'trend',
    'thematic',
    'multichart',
    'prediction',
    'targets',
  ]
  const initialTab: AnalysisTabValue = validTabs.includes(initialTabParam)
    ? initialTabParam
    : 'kpi'
  const [activeTab, setActiveTab] = useState<AnalysisTabValue>(
    initialTab === 'targets' ? 'kpi' : initialTab
  )

  // 数据持久化 Hook，现在会接收初始数据
  usePersistData(initialData)

  // 使用筛选器状态持久化
  useFilterPersistence()

  // 判断是否有数据
  const hasData = rawData.length > 0

  // 计算时间进度（当前年度已过天数占365天的百分比）
  const timeProgress = useMemo(() => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const daysPassed = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    )
    return (daysPassed / 365) * 100
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialTab === 'trend') {
      setViewMode('trend')
      setActiveTab('trend')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) {
    return null
  }

  const handleTabChange = (tab: AnalysisTabValue) => {
    // 切换标签页时重置下钻状态
    useDrillDownStore.getState().resetAll()

    if (tab === 'targets') {
      router.push('/targets')
      return
    }

    setActiveTab(tab)
    if (tab === 'trend') {
      if (viewMode !== 'trend') {
        setViewMode('trend')
      }
    } else if (tab === 'multichart') {
      // 趋势与多维图表支持单选/多选，不强制切换模式
    } else if (viewMode !== 'single') {
      setViewMode('single')
    }

    if (tab === 'kpi') {
      router.replace('/', { scroll: false })
    } else {
      router.replace(`/?tab=${tab}`, { scroll: false })
    }
  }

  return (
    <div className="min-h-screen p-8">
      {/* 筛选器交互管理器 - 不渲染UI，只处理逻辑 */}
      <FilterInteractionManager />

      {/* 头部 */}
      <header className="mb-8">
        <div className="max-w-7xl mx-auto">
          {/* 标题行 */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  车险多维数据分析平台
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-slate-600">
                    数据驱动决策 · 智能洞察业务 · 可视化分析
                  </p>
                  {/* 数据源指示器 */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                    {isSupabaseMode ? (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          Supabase
                        </span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          本地模式
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* 分析模式切换 - 移除，改由顶部标签页控制 */}
            {/* {hasData && <ViewModeSelector />} */}
          </div>

          {/* 统一导航 Tabs，驱动内容与视图模式 */}
          {hasData && (
            <div className="mb-4">
              <AnalysisTabs active={activeTab} onChange={handleTabChange} />
            </div>
          )}

          {/* 顶部工具栏（已整合时间进度） - 放置在统一导航之下，数据管理页面不显示 */}
          {hasData && activeTab !== 'data-management' && (
            <div className="mb-4">
              <TopToolbar rawCount={rawData.length} activeTab={activeTab} />
            </div>
          )}

          {/* 下钻导航条 - 位于筛选器和内容区之间 */}
          {/* 移除头部内的 DrillDownBar */}
        </div>
      </header>

      {/* 主内容（16:9 比例容器） */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="aspect-[16/9] w-full overflow-auto rounded-xl">
          <main className="h-full w-full">
            {/* 下钻导航条 - 位于筛选器和内容区之间，Sticky 定位 */}
            {hasData && (activeTab === 'kpi' || activeTab === 'trend') && (
              <div className="sticky top-0 z-40 mb-6 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200/60 transition-all duration-200">
                <DrillDownBar />
              </div>
            )}

            {!hasData && (
              <div className="space-y-6">
                <FileUpload />
              </div>
            )}

            {hasData && (
              <div className="space-y-8">
                {/* 数据管理页面 */}
                {activeTab === 'data-management' && (
                  <div className="space-y-6">
                    <DataManagementPanel />
                  </div>
                )}

                {/* 🚀 驾驶舱 */}
                {activeTab === 'cockpit' && <EnterpriseCockpit />}

                {/* KPI 看板 - 使用完整版 */}
                {activeTab === 'kpi' && (
                  <FullKPIDashboard
                    kpiData={currentKpi || kpiData}
                    compareData={compareKpi}
                    compareWeekNumber={previousWeekNumber}
                  />
                )}

                {/* 多周趋势分析 */}
                {activeTab === 'trend' && (
                  <div className="space-y-6">
                    <WeeklyOperationalTrend />
                  </div>
                )}

                {/* 预测管理 */}
                {activeTab === 'prediction' && <PredictionManagerPanel />}

                {/* 专题分析模块 */}
                {activeTab === 'thematic' && (
                  <div className="space-y-8">
                    <ThematicAnalysis
                      currentKpis={kpiData}
                      timeProgress={timeProgress}
                      compact={false}
                    />
                    <CustomerSegmentationBubble />
                    <ExpenseHeatmap />
                  </div>
                )}

                {/* 多维图表展示 */}
                {activeTab === 'multichart' && (
                  <div className="space-y-8">
                    <MultiChartTabs />
                    <ComparisonAnalysisPanel />
                  </div>
                )}

                {/* 说明区块 */}
                <div className="rounded-2xl border border-slate-200 p-6 bg-white/60 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    数据可视化
                  </h3>
                  <p className="text-sm text-slate-600">
                    趋势图表、结构分析，让数据洞察更直观易懂
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
