/**
 * 增强版KPI仪表板组件
 * 使用EnhancedKPICard提供更丰富的视觉效果
 */

'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Shield,
  PieChart,
  Zap,
  TrendingUpIcon,
  TrendingDownIcon,
  Activity,
  Award
} from "lucide-react";
import { EnhancedKPICard, EnhancedKPICardSkeleton } from "./enhanced-kpi-card";
import {
  formatPercent,
  formatCurrency,
  getContributionMarginColor,
  getContributionMarginBgColor,
} from "@/utils/format";
import type { KPIResult } from "@/types/insurance";
import { cn } from "@/lib/utils";

export interface EnhancedKPIDashboardProps {
  /**
   * KPI 计算结果
   */
  kpiData: KPIResult | null;

  /**
   * 是否正在加载
   */
  isLoading?: boolean;

  /**
   * 对比数据（用于显示环比变化）
   */
  compareData?: KPIResult | null;

  /**
   * 点击KPI卡片时的回调
   */
  onKPIClick?: (kpiKey: string, value: any) => void;

  /**
   * 趋势数据（用于显示迷你趋势线）
   */
  trendData?: Record<string, number[]>;
}

interface KPIConfig {
  key: keyof KPIResult;
  title: string;
  unit: string;
  icon: React.ReactNode;
  formatter?: (value: number) => string;
  kpiFormulaKey?: string;
  numerator?: string;
  denominator?: string;
  getStatus?: (value: number) => 'excellent' | 'good' | 'warning' | 'danger' | undefined;
  large?: boolean;
}

export function EnhancedKPIDashboard({
  kpiData,
  isLoading = false,
  compareData,
  onKPIClick,
  trendData,
}: EnhancedKPIDashboardProps) {
  // KPI配置
  const kpiConfigs: KPIConfig[] = [
    {
      key: 'earnedPremiumTotal' as any,
      title: '已赚保费',
      unit: '万元',
      icon: <DollarSign className="h-5 w-5" />,
      formatter: (value) => formatCurrency(value, '万元'),
      getStatus: (value) => {
        if (value > 1000) return 'excellent';
        if (value > 500) return 'good';
        if (value > 100) return 'warning';
        return 'danger';
      },
    },
    {
      key: 'totalIncurred' as any,
      title: '总已发生损失',
      unit: '万元',
      icon: <TrendingDown className="h-5 w-5" />,
      formatter: (value) => formatCurrency(value, '万元'),
      getStatus: (value) => {
        if (value < 100) return 'excellent';
        if (value < 300) return 'good';
        if (value < 500) return 'warning';
        return 'danger';
      },
    },
    {
      key: 'lossRatio' as any,
      title: '赔付率',
      unit: '%',
      icon: <Shield className="h-5 w-5" />,
      formatter: (value) => formatPercent(value),
      kpiFormulaKey: 'lossRatio',
      numerator: '总已发生损失',
      denominator: '已赚保费',
      getStatus: (value) => {
        if (value < 60) return 'excellent';
        if (value < 70) return 'good';
        if (value < 80) return 'warning';
        return 'danger';
      },
    },
    {
      key: 'expenseRatio' as any,
      title: '费用率',
      unit: '%',
      icon: <PieChart className="h-5 w-5" />,
      formatter: (value) => formatPercent(value),
      kpiFormulaKey: 'expenseRatio',
      getStatus: (value) => {
        if (value < 15) return 'excellent';
        if (value < 20) return 'good';
        if (value < 25) return 'warning';
        return 'danger';
      },
    },
    {
      key: 'combinedRatio' as any,
      title: '综合成本率',
      unit: '%',
      icon: <Target className="h-5 w-5" />,
      formatter: (value) => formatPercent(value),
      kpiFormulaKey: 'combinedRatio',
      getStatus: (value) => {
        if (value < 90) return 'excellent';
        if (value < 97) return 'good';
        if (value < 100) return 'warning';
        return 'danger';
      },
      large: true,
    },
    {
      key: 'contributionMargin' as any,
      title: '满期边际贡献率',
      unit: '%',
      icon: <Award className="h-5 w-5" />,
      formatter: (value) => formatPercent(value),
      valueColor: getContributionMarginColor(kpiData?.contributionMargin || 0),
      bgColor: getContributionMarginBgColor(kpiData?.contributionMargin || 0),
      kpiFormulaKey: 'contributionMargin',
      getStatus: (value) => {
        if (value > 15) return 'excellent';
        if (value > 10) return 'good';
        if (value > 5) return 'warning';
        return 'danger';
      },
      large: true,
    },
  ];

  // 如果正在加载，显示骨架屏
  if (isLoading || !kpiData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiConfigs.map((config, index) => (
          <EnhancedKPICardSkeleton key={config.key} large={config.large} />
        ))}
      </div>
    );
  }

  // 计算环比变化
  const getCompareValue = (key: keyof KPIResult) => {
    if (!compareData) return null;
    const currentValue = kpiData[key] as number;
    const previousValue = compareData[key] as number;
    if (previousValue === 0) return null;

    // 对于比率型指标，直接计算差值
    if (key === 'lossRatio' || key === 'expenseRatio' || key === 'combinedRatio' || key === 'contributionMargin') {
      return currentValue - previousValue;
    }

    // 对于数值型指标，计算百分比变化
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 主要KPI指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiConfigs.map((config) => {
          const value = kpiData[config.key] as number;
          const compareValue = getCompareValue(config.key);
          const status = config.getStatus?.(value);

          return (
            <EnhancedKPICard
              key={config.key}
              title={config.title}
              value={value}
              unit={config.unit}
              icon={config.icon}
              formatter={config.formatter}
              compareValue={compareValue}
              compareUnit={config.key === 'lossRatio' || config.key === 'expenseRatio' ||
                         config.key === 'combinedRatio' || config.key === 'contributionMargin' ? 'pp' : '%'}
              large={config.large}
              kpiKey={config.kpiFormulaKey}
              status={status}
              showPulse={status === 'danger'}
              trendData={trendData?.[config.key]}
              onClick={() => {
                onKPIClick?.(config.key, {
                  value,
                  compareValue,
                  status,
                  filterParams: {
                    [config.key]: value,
                  }
                });
              }}
            />
          );
        })}
      </div>

      {/* 补充信息区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* 业绩概览 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            业绩概览
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">保费达成率</span>
              <span className="text-sm font-semibold text-blue-900">
                {kpiData.earnedPremiumTotal ? Math.min((kpiData.earnedPremiumTotal / 1000) * 100, 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">成本控制</span>
              <span className={cn(
                "text-sm font-semibold",
                (kpiData.combinedRatio || 0) < 100 ? "text-green-700" : "text-red-700"
              )}>
                {(kpiData.combinedRatio || 0) < 100 ? '良好' : '需改进'}
              </span>
            </div>
          </div>
        </div>

        {/* 趋势提示 */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            关键洞察
          </h3>
          <div className="space-y-2 text-sm text-purple-700">
            {(kpiData.combinedRatio || 0) < 100 && (
              <p>✅ 综合成本率低于100%，承保盈利</p>
            )}
            {(kpiData.lossRatio || 0) < 65 && (
              <p>✅ 赔付率控制良好，风险可控</p>
            )}
            {(kpiData.contributionMargin || 0) > 10 && (
              <p>✅ 边际贡献率优秀，盈利能力强</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}