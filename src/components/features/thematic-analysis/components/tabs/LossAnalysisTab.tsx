/**
 * 赔付分析标签页
 *
 * 支持多维度分析（客户类别、业务类型、三级机构、险种类型、能源类型、过户车状态、新转续状态）
 * 包含四个分析板块：
 * - 满期赔付率概览：风险等级和环比恶化预警
 * - 已报告赔款分析：识别赔款额增长最快的业务线
 * - 赔案件数分析：衡量出险频率变化
 * - 案均赔款分析：观察单次赔款严重度变化
 */

'use client'

import React, { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useLossDimensionAnalysis,
  type LossDimensionKey,
  type LossDimensionItem,
} from '@/hooks/use-loss-dimension-analysis'
import { LOSS_DIMENSION_OPTIONS, DEFAULT_LOSS_DIMENSION } from '../../constants'
import { LossRatioRiskCard, LossTrendCard } from '../cards'
import { AnalysisSection } from '../AnalysisSection'
import type { TabContentProps } from '../../types'

type LossTrendMetricKey =
  | 'reportedClaimPayment'
  | 'claimCaseCount'
  | 'averageClaim'

export function LossAnalysisTab({ compact = false }: TabContentProps) {
  const [dimension, setDimension] = useState<LossDimensionKey>(
    DEFAULT_LOSS_DIMENSION
  )
  const items = useLossDimensionAnalysis(dimension)
  const hasData = items.length > 0

  const gridCols = compact
    ? 'grid-cols-2 md:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  const sortByLossRatio = [...items]
    .sort((a, b) => {
      const aValue = a.current.lossRatio ?? -Infinity
      const bValue = b.current.lossRatio ?? -Infinity
      return bValue - aValue
    })
    .slice(0, 12)

  const getAbsoluteChange = (
    item: LossDimensionItem,
    metric: LossTrendMetricKey
  ) => {
    const current = item.current[metric]
    const previous = item.previous?.[metric] ?? null
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined
    ) {
      return -Infinity
    }
    return Math.abs(current - previous)
  }

  const sortByReportedClaim = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'reportedClaimPayment') -
        getAbsoluteChange(a, 'reportedClaimPayment')
    )
    .slice(0, 12)

  const sortByClaimCount = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'claimCaseCount') -
        getAbsoluteChange(a, 'claimCaseCount')
    )
    .slice(0, 12)

  const sortByAverageClaim = [...items]
    .sort(
      (a, b) =>
        getAbsoluteChange(b, 'averageClaim') -
        getAbsoluteChange(a, 'averageClaim')
    )
    .slice(0, 12)

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex flex-col gap-3',
          compact
            ? 'sm:flex-row sm:items-center sm:justify-between'
            : 'md:flex-row md:items-center md:justify-between'
        )}
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800">分析维度</h2>
          <p className="text-xs text-slate-500">
            从结果指标到驱动因，逐层定位赔付风险的根源
          </p>
        </div>
        <Select
          value={dimension}
          onValueChange={value => setDimension(value as LossDimensionKey)}
        >
          <SelectTrigger
            className={cn('w-full', compact ? 'sm:w-48' : 'sm:w-60')}
          >
            <SelectValue placeholder="选择分析维度" />
          </SelectTrigger>
          <SelectContent>
            {LOSS_DIMENSION_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasData ? (
        <>
          <AnalysisSection
            title="满期赔付率概览"
            description="按业务板块呈现赔付风险等级，并高亮环比恶化的业务"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByLossRatio.map(item => (
                <LossRatioRiskCard
                  key={`loss-ratio-${item.key}`}
                  item={item}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="已报告赔款分析"
            description="识别赔款额增长最快的业务线，以判断赔付额上升的主因"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByReportedClaim.map(item => (
                <LossTrendCard
                  key={`reported-${item.key}`}
                  item={item}
                  metric="reportedClaimPayment"
                  unit=" 万元"
                  decimals={2}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="赔案件数分析"
            description="衡量出险频率的变化，判断风险是否因为事故更频繁"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByClaimCount.map(item => (
                <LossTrendCard
                  key={`claim-count-${item.key}`}
                  item={item}
                  metric="claimCaseCount"
                  unit=" 件"
                  decimals={0}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>

          <AnalysisSection
            title="案均赔款分析"
            description="观察单次赔款的严重度变化，识别赔付额被拉高的根因"
          >
            <div className={cn('grid gap-3', gridCols)}>
              {sortByAverageClaim.map(item => (
                <LossTrendCard
                  key={`avg-claim-${item.key}`}
                  item={item}
                  metric="averageClaim"
                  unit=" 元"
                  decimals={0}
                  compact={compact}
                />
              ))}
            </div>
          </AnalysisSection>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          当前筛选下暂无可用数据，请调整筛选条件后重试
        </div>
      )}
    </div>
  )
}
