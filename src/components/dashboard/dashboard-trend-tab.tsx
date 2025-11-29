/**
 * Dashboard Trend Analysis Tab Component
 * 趋势分析标签页
 */

'use client';

import { TimeProgressIndicator } from '@/components/features/time-progress-indicator';
import { TrendChart } from '@/components/features/trend-chart';
import { WeeklyOperationalTrend } from '@/components/features/weekly-operational-trend';

interface DashboardTrendTabProps {
  data: any[];
}

export function DashboardTrendTab({ data }: DashboardTrendTabProps) {
  return (
    <div className="space-y-6">
      <TimeProgressIndicator data={data} />
      <TrendChart data={data} />
      <WeeklyOperationalTrend data={data} />
    </div>
  );
}