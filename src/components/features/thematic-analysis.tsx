/**
 * 主题分析模块
 * 将分析维度从"单一KPI"提升到"业务主题健康度诊断"
 *
 * 三大主题：
 * - 保费分析：关注保费进度、件数、单均保费
 * - 赔付分析：关注赔付率、赔款、案均赔款、赔案件数
 * - 边际贡献分析：关注边贡率、成本率、边贡额
 */

'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { ThematicAnalysisProps } from './thematic-analysis/types'
import {
  PremiumAnalysisTab,
  LossAnalysisTab,
  ContributionAnalysisTab,
} from './thematic-analysis/components/tabs'

/**
 * 主题分析主组件
 *
 * 提供三个分析标签页：
 * - 保费分析：多维度保费进度、件数、单均保费分析
 * - 赔付分析：多维度赔付率、赔款、案均赔款、赔案件数分析
 * - 边际贡献分析：边贡率、成本率、边贡额分析
 */
export function ThematicAnalysis({
  currentKpis,
  compareKpis,
  timeProgress,
  annualPremiumTarget,
  compact = false,
  className,
}: ThematicAnalysisProps) {
  return (
    <div className={cn('w-full', className)}>
      <Tabs defaultValue="premium" className="w-full">
        <TabsList
          className={cn('grid w-full', compact ? 'grid-cols-3' : 'grid-cols-3')}
        >
          <TabsTrigger value="premium">保费分析</TabsTrigger>
          <TabsTrigger value="loss">赔付分析</TabsTrigger>
          <TabsTrigger value="contribution">边贡分析</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-4">
          <PremiumAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            annualPremiumTarget={annualPremiumTarget}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="loss" className="mt-4">
          <LossAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="contribution" className="mt-4">
          <ContributionAnalysisTab
            currentKpis={currentKpis}
            compareKpis={compareKpis}
            timeProgress={timeProgress}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 导出类型定义，方便外部使用
export type { ThematicAnalysisProps } from './thematic-analysis/types'
