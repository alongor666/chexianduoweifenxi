/**
 * Dashboard Multidimensional Analysis Tab Component
 * 多维分析标签页
 */

'use client';

import { MultiChartTabs } from '@/components/features/multi-chart-tabs';
import { CustomerSegmentationBubble } from '@/components/features/customer-segmentation-bubble';
import { ExpenseHeatmap } from '@/components/features/expense-heatmap';
import { ThematicAnalysis } from '@/components/features/thematic-analysis';

interface DashboardMultidimensionalTabProps {
  data: any[];
}

export function DashboardMultidimensionalTab({ data }: DashboardMultidimensionalTabProps) {
  return (
    <div className="space-y-6">
      <MultiChartTabs data={data} />
      <CustomerSegmentationBubble data={data} />
      <ExpenseHeatmap data={data} />
      <ThematicAnalysis data={data} />
    </div>
  );
}