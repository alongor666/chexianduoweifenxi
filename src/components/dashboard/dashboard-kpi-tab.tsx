/**
 * Dashboard KPI Tab Component
 * KPI指标分析标签页
 */

'use client';

import { useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KPICards } from '@/components/features/kpi-cards';
import { BusinessTypeAnalysis } from '@/components/features/business-type-analysis';
import { useDataFilter } from '@/hooks/use-data-filter';
import type { SmartComparisonOptions } from '@/types';

interface DashboardKPITabProps {
  data: any[];
  premiumTargetsOverall?: number | null;
}

export function DashboardKPITab({
  data,
  premiumTargetsOverall,
}: DashboardKPITabProps) {
  // 使用数据过滤钩子
  const {
    filteredData,
    updateOptions,
  } = useDataFilter(data);

  // 计算智能对比选项
  const smartComparisonOptions = useMemo((): SmartComparisonOptions => ({
    annualTargetYuan: premiumTargetsOverall || null,
  }), [premiumTargetsOverall]);

  // 处理选项变更
  const handleOptionsChange = useCallback((newOptions: SmartComparisonOptions) => {
    updateOptions({
      ...newOptions,
      comparisonMode: 'vs',
    });
  }, [updateOptions]);

  return (
    <div className="space-y-6">
      <KPICards
        data={filteredData}
        comparisonOptions={smartComparisonOptions}
        onComparisonOptionsChange={handleOptionsChange}
      />

      <BusinessTypeAnalysis data={filteredData} />
    </div>
  );
}