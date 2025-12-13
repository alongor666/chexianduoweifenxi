/**
 * 多维图表标签页容器组件
 * 将机构雷达图、保费分析图、赔付分析图、占比分析图整合到标签页中
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MultiDimensionRadar } from './multi-dimension-radar'
import { PremiumAnalysisBarChart } from './structure-bar-chart'
import { ClaimAnalysisBarChart } from './claim-analysis-bar-chart'
import { DistributionPieChart } from './distribution-pie-chart'
import { BusinessTypeDualAxisChart } from './business-type-dual-axis-chart'
import { BusinessInsightsNarrative } from './business-insights-narrative'
import { BusinessTypeHeatmap } from './business-type-heatmap'

export type MultiChartTabValue =
  | 'insights'
  | 'heatmap'
  | 'radar'
  | 'premium'
  | 'claim'
  | 'distribution'
  | 'businessType'

interface MultiChartTabsProps {
  /** 自定义类名 */
  className?: string
}

/**
 * 多维图表标签页容器
 * 整合4个核心分析图表到标签页界面
 */
export function MultiChartTabs({ className }: MultiChartTabsProps) {
  const [activeTab, setActiveTab] = useState<MultiChartTabValue>('insights')

  const tabItems = [
    {
      value: 'insights' as const,
      label: '智能洞察',
      description: '自动识别关键问题和机会，提供决策建议',
    },
    {
      value: 'heatmap' as const,
      label: '健康度热力图',
      description: '全局展示业务类型在多周的健康度变化',
    },
    {
      value: 'radar' as const,
      label: '机构雷达图',
      description: '多机构健康度对比分析',
    },
    {
      value: 'premium' as const,
      label: '保费分析',
      description: '保费数据多维度分析',
    },
    {
      value: 'claim' as const,
      label: '赔付分析',
      description: '赔付数据多维度分析',
    },
    {
      value: 'distribution' as const,
      label: '占比分析',
      description: '客户与渠道占比分析',
    },
    {
      value: 'businessType' as const,
      label: '业务类型经营',
      description: '业务类型规模与效率双维度分析',
    },
  ]

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as MultiChartTabValue)}
        className="space-y-6"
      >
        {/* 标签页导航 */}
        <div className="rounded-2xl border border-white/50 bg-white/40 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-blue-600 text-left">
                多维图表分析
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {tabItems.find(item => item.value === activeTab)?.description}
              </p>
            </div>
          </div>

          <TabsList className="grid grid-cols-7 gap-2 bg-slate-100/50 p-1 rounded-lg text-xs">
            {tabItems.map(item => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 智能洞察看板 */}
        <TabsContent value="insights" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              智能洞察
            </h4>
          </div>
          <BusinessInsightsNarrative />
        </TabsContent>

        {/* 健康度热力图 */}
        <TabsContent value="heatmap" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              健康度热力图
            </h4>
          </div>
          <BusinessTypeHeatmap />
        </TabsContent>

        {/* 机构雷达图 */}
        <TabsContent value="radar" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              机构雷达图
            </h4>
          </div>
          <MultiDimensionRadar />
        </TabsContent>

        {/* 保费分析图 */}
        <TabsContent value="premium" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              保费分析
            </h4>
          </div>
          <PremiumAnalysisBarChart />
        </TabsContent>

        {/* 赔付分析图 */}
        <TabsContent value="claim" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              赔付分析
            </h4>
          </div>
          <ClaimAnalysisBarChart />
        </TabsContent>

        {/* 占比分析图 */}
        <TabsContent value="distribution" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              占比分析
            </h4>
          </div>
          <DistributionPieChart />
        </TabsContent>

        {/* 业务类型经营分析图 */}
        <TabsContent value="businessType" className="mt-0">
          <div className="mb-3">
            <h4 className="text-lg font-bold text-blue-600 text-left">
              业务类型经营
            </h4>
          </div>
          <BusinessTypeDualAxisChart />
        </TabsContent>
      </Tabs>

      {/* 使用说明 */}
      <div className="rounded-2xl border border-slate-200 p-4 bg-white/60 backdrop-blur-sm">
        <h4 className="text-sm font-semibold text-slate-800 mb-2">
          图表使用说明
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600">
          <div>
            <span className="font-medium text-slate-700">智能洞察：</span>
            自动分析数据，识别风险业务、标杆业务和趋势变化，提供决策建议
          </div>
          <div>
            <span className="font-medium text-slate-700">健康度热力图：</span>
            一屏展示16个业务类型在多周的健康度，快速发现异常模式
          </div>
          <div>
            <span className="font-medium text-slate-700">机构雷达图：</span>
            对比多个机构在承保、赔付、客户、渠道、综合5个维度的健康评分
          </div>
          <div>
            <span className="font-medium text-slate-700">保费分析：</span>
            按业务类型、机构、险别等维度分析保费数据
          </div>
          <div>
            <span className="font-medium text-slate-700">赔付分析：</span>
            按业务类型、机构、险别等维度分析赔付数据
          </div>
          <div>
            <span className="font-medium text-slate-700">占比分析：</span>
            展示客户类型和渠道类型的满期保费占比
          </div>
          <div>
            <span className="font-medium text-slate-700">业务类型经营：</span>
            双Y轴复合图展示业务类型的规模与效率，可切换多种经营指标
          </div>
        </div>
      </div>
    </div>
  )
}
