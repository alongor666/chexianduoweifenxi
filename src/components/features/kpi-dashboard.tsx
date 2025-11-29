/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-01: KPI看板增强](./../../../开发文档/01_features/FEAT-P1-01_kpi-dashboard-enhancements.md)
 */
"use client";

import {
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Shield,
  PieChart,
  Zap,
} from "lucide-react";
import { KPICard, KPICardSkeleton } from "./kpi-card";
import {
  formatPercent,
  formatCurrency,
  getContributionMarginColor,
  getContributionMarginBgColor,
} from "@/utils/format";
import type { KPIResult } from "@/types/insurance";

export interface KPIDashboardProps {
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
}

export function KPIDashboard({
  kpiData,
  isLoading = false,
  compareData,
}: KPIDashboardProps) {
  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <KPICardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // 如果没有数据，显示空状态
  if (!kpiData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
        <div className="text-center">
          <PieChart className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="mb-2 text-lg font-semibold text-slate-700">
            暂无数据
          </h3>
          <p className="text-sm text-slate-500">
            请先上传 CSV 数据文件以查看 KPI 看板
          </p>
        </div>
      </div>
    );
  }

  // 计算环比变化
  const getChangeValue = (
    current: number | null,
    previous: number | null,
  ): number | null => {
    if (
      current === null ||
      previous === null ||
      current === undefined ||
      previous === undefined ||
      isNaN(current) ||
      isNaN(previous) ||
      previous === 0
    ) {
      return null;
    }
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">核心 KPI 看板</h2>
          <p className="mt-1 text-sm text-slate-600">
            基于当前筛选条件的关键绩效指标
          </p>
        </div>
      </div>

      {/* KPI 网格 - 4x2 布局 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. 赔付率 */}
        <KPICard
          title="赔付率"
          value={kpiData.loss_ratio}
          unit="%"
          description="已决赔款 / 满期保费"
          valueColor={
            kpiData.loss_ratio !== null && kpiData.loss_ratio > 70
              ? "text-red-600"
              : kpiData.loss_ratio !== null && kpiData.loss_ratio > 60
                ? "text-orange-600"
                : "text-green-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(kpiData.loss_ratio, compareData.loss_ratio)
              : null
          }
          icon={<TrendingDown className="h-5 w-5" />}
          kpiKey="loss_ratio"
          numeratorValue={kpiData.reported_claim_payment * 10000}
          denominatorValue={kpiData.matured_premium * 10000}
        />

        {/* 2. 费用率 */}
        <KPICard
          title="费用率"
          value={kpiData.expense_ratio}
          unit="%"
          description="费用总额 / 满期保费"
          valueColor={
            kpiData.expense_ratio !== null && kpiData.expense_ratio > 25
              ? "text-red-600"
              : kpiData.expense_ratio !== null && kpiData.expense_ratio > 20
                ? "text-orange-600"
                : "text-green-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(kpiData.expense_ratio, compareData.expense_ratio)
              : null
          }
          icon={<DollarSign className="h-5 w-5" />}
          kpiKey="expense_ratio"
          numeratorValue={kpiData.expense_amount * 10000}
          denominatorValue={kpiData.signed_premium * 10000}
        />

        {/* 3. 满期边际贡献率 ⭐ 核心指标 */}
        <KPICard
          title="满期边际贡献率"
          value={kpiData.contribution_margin_ratio}
          unit="%"
          description="满期边际 / 满期保费"
          valueColor={getContributionMarginColor(
            kpiData.contribution_margin_ratio,
          )}
          bgColor={getContributionMarginBgColor(
            kpiData.contribution_margin_ratio,
          )}
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.contribution_margin_ratio,
                  compareData.contribution_margin_ratio,
                )
              : null
          }
          large={true}
          icon={<Target className="h-6 w-6" />}
          kpiKey="contribution_margin_ratio"
          numeratorValue={kpiData.contribution_margin_amount * 10000}
          denominatorValue={kpiData.matured_premium * 10000}
        />

        {/* 4. 保费进度 */}
        <KPICard
          title="保费进度"
          value={kpiData.premium_progress}
          unit="%"
          description="签单保费 / 目标保费"
          valueColor={
            kpiData.premium_progress !== null && kpiData.premium_progress >= 100
              ? "text-green-600"
              : kpiData.premium_progress !== null &&
                  kpiData.premium_progress >= 80
                ? "text-blue-600"
                : "text-orange-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.premium_progress,
                  compareData.premium_progress,
                )
              : null
          }
          icon={<Calendar className="h-5 w-5" />}
        />

        {/* 5. 满期率 */}
        <KPICard
          title="满期率"
          value={kpiData.maturity_ratio}
          unit="%"
          description="满期保费 / 签单保费"
          valueColor={
            kpiData.maturity_ratio !== null && kpiData.maturity_ratio >= 80
              ? "text-green-600"
              : kpiData.maturity_ratio !== null && kpiData.maturity_ratio >= 60
                ? "text-blue-600"
                : "text-orange-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.maturity_ratio,
                  compareData.maturity_ratio,
                )
              : null
          }
          icon={<Shield className="h-5 w-5" />}
          kpiKey="maturity_ratio"
          numeratorValue={kpiData.matured_premium * 10000}
          denominatorValue={kpiData.signed_premium * 10000}
        />

        {/* 6. 满期出险率 */}
        <KPICard
          title="满期出险率"
          value={kpiData.matured_claim_ratio}
          unit="%"
          description="(赔案件数 / 保单件数) × 满期率"
          valueColor={
            kpiData.matured_claim_ratio !== null &&
            kpiData.matured_claim_ratio > 60
              ? "text-red-600"
              : kpiData.matured_claim_ratio !== null &&
                  kpiData.matured_claim_ratio > 50
                ? "text-orange-600"
                : "text-green-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.matured_claim_ratio,
                  compareData.matured_claim_ratio,
                )
              : null
          }
          icon={<TrendingDown className="h-5 w-5" />}
          kpiKey="matured_claim_ratio"
          numeratorValue={kpiData.claim_case_count}
          denominatorValue={kpiData.policy_count}
        />

        {/* 7. 变动成本率 */}
        <KPICard
          title="变动成本率"
          value={kpiData.variable_cost_ratio}
          unit="%"
          description="变动成本 / 满期保费"
          valueColor={
            kpiData.variable_cost_ratio !== null &&
            kpiData.variable_cost_ratio > 90
              ? "text-red-600"
              : kpiData.variable_cost_ratio !== null &&
                  kpiData.variable_cost_ratio > 85
                ? "text-orange-600"
                : "text-green-600"
          }
          formatter={formatPercent}
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.variable_cost_ratio,
                  compareData.variable_cost_ratio,
                )
              : null
          }
          icon={<DollarSign className="h-5 w-5" />}
          kpiKey="variable_cost_ratio"
        />

        {/* 8. 自主系数 */}
        <KPICard
          title="自主系数"
          value={kpiData.autonomy_coefficient}
          unit=""
          description="折扣后保费 / 基准保费"
          valueColor={
            kpiData.autonomy_coefficient !== null &&
            kpiData.autonomy_coefficient >= 0.85
              ? "text-green-600"
              : kpiData.autonomy_coefficient !== null &&
                  kpiData.autonomy_coefficient >= 0.75
                ? "text-blue-600"
                : "text-orange-600"
          }
          formatter={(val) =>
            val !== null && val !== undefined && !isNaN(val)
              ? val.toFixed(3)
              : "-"
          }
          compareValue={
            compareData
              ? getChangeValue(
                  kpiData.autonomy_coefficient,
                  compareData.autonomy_coefficient,
                )
              : null
          }
          icon={<Zap className="h-5 w-5" />}
          kpiKey="autonomy_coefficient"
        />
      </div>

      {/* 补充指标（可选） */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">补充指标</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* 满期保费总额 */}
          <KPICard
            title="满期保费总额"
            value={kpiData.matured_premium}
            description="已满期的保费总额"
            formatter={(val) =>
              val !== null && val !== undefined && !isNaN(val)
                ? formatCurrency(val) // 已经是万元
                : "-"
            }
            icon={<DollarSign className="h-5 w-5" />}
            kpiKey="matured_premium"
          />

          {/* 签单保费总额 */}
          <KPICard
            title="签单保费总额"
            value={kpiData.signed_premium}
            description="已签单的保费总额"
            formatter={(val) =>
              val !== null && val !== undefined && !isNaN(val)
                ? formatCurrency(val) // 已经是万元
                : "-"
            }
            icon={<DollarSign className="h-5 w-5" />}
            kpiKey="signed_premium"
          />

          {/* 已报告赔款总额 */}
          <KPICard
            title="已报告赔款总额"
            value={kpiData.reported_claim_payment}
            description="已报告的赔款总额"
            formatter={(val) =>
              val !== null && val !== undefined && !isNaN(val)
                ? formatCurrency(val) // 已经是万元
                : "-"
            }
            icon={<TrendingDown className="h-5 w-5" />}
            kpiKey="reported_claim_payment"
          />

          {/* 费用总额 */}
          <KPICard
            title="费用总额"
            value={kpiData.expense_amount}
            description="各项费用合计"
            formatter={(val) =>
              val !== null && val !== undefined && !isNaN(val)
                ? formatCurrency(val) // 已经是万元
                : "-"
            }
            icon={<DollarSign className="h-5 w-5" />}
            kpiKey="expense_amount"
          />
        </div>
      </div>
    </div>
  );
}
