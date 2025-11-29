/**
 * Dashboard Targets Tab Component
 * 目标对比标签页
 */

'use client';

import { ComparisonAnalysisPanel } from '@/components/features/comparison-analysis';

interface DashboardTargetsTabProps {
  data: any[];
  annualTarget?: number | null;
}

export function DashboardTargetsTab({ data, annualTarget }: DashboardTargetsTabProps) {
  return (
    <ComparisonAnalysisPanel
      data={data}
      annualTarget={annualTarget}
    />
  );
}