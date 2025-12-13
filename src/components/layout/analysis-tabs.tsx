'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type AnalysisTabValue =
  | 'data-management'
  | 'cockpit'
  | 'kpi'
  | 'trend'
  | 'thematic'
  | 'multichart'
  | 'targets'
  | 'prediction'

interface AnalysisTabsProps {
  active: AnalysisTabValue
  onChange: (value: AnalysisTabValue) => void
}

const TAB_ITEMS: Array<{ value: AnalysisTabValue; label: string }> = [
  { value: 'data-management', label: '数据管理' },
  { value: 'cockpit', label: '🚀 驾驶舱 (Beta)' },
  { value: 'kpi', label: 'KPI看板' },
  { value: 'trend', label: '周趋势分析' },
  { value: 'thematic', label: '专题分析' },
  { value: 'multichart', label: '多维图表' },
  // { value: 'prediction', label: '预测管理' },
  // { value: 'targets', label: '目标管理' },
]

export function AnalysisTabs({ active, onChange }: AnalysisTabsProps) {
  return (
    <Tabs
      value={active}
      onValueChange={value => onChange(value as AnalysisTabValue)}
    >
      <TabsList>
        {TAB_ITEMS.map(item => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
