/**
 * 完整版KPI看板 - 4x4网格布局
 * 指标名称和顺序与紧凑版保持一致
 * 集成：公式详情Tooltip、智能环比
 */
"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  formatCurrency,
  getContributionMarginColor,
} from "@/utils/format";
import type { KPIResult } from "@/types/insurance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getKPIFormula } from "@/lib/calculations/kpi-formulas";

export interface FullKPIDashboardProps {
  /**
   * KPI 计算结果
   */
  kpiData: KPIResult | null;

  /**
   * 对比数据（用于显示环比变化）
   */
  compareData?: KPIResult | null;

  /**
   * 是否正在加载
   */
  isLoading?: boolean;

  /**
   * 对比周期号（用于显示"vs 第N周"）
   */
  compareWeekNumber?: number | null;
}

// KPI配置定义
interface KPIConfig {
  key: keyof KPIResult;
  title: string;
  unit: string;
  formatter: (val: number | null | undefined) => string;
  getColor: (val: number | null) => string;
  decimals?: number; // 用于计算增量的小数位数
  hasFormula?: boolean; // 是否显示公式详情
}

export function FullKPIDashboard({
  kpiData,
  compareData,
  isLoading = false,
  compareWeekNumber,
}: FullKPIDashboardProps) {
  // 第一行：比率指标
  const row1KPIs: KPIConfig[] = [
    {
      key: "contribution_margin_ratio",
      title: "满期边际贡献率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) => getContributionMarginColor(val),
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "premium_time_progress_achievement_rate",
      title: "保费时间进度达成率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val >= 100
          ? "text-green-600"
          : val !== null && val >= 80
            ? "text-blue-600"
            : "text-orange-600",
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "loss_ratio",
      title: "满期赔付率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val > 70
          ? "text-red-600"
          : val !== null && val > 60
            ? "text-orange-600"
            : "text-green-600",
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "expense_ratio",
      title: "费用率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val > 25
          ? "text-red-600"
          : val !== null && val > 20
            ? "text-orange-600"
            : "text-green-600",
      decimals: 2,
      hasFormula: true,
    },
  ];

  // 第二行：金额指标
  const row2KPIs: KPIConfig[] = [
    {
      key: "contribution_margin_amount",
      title: "满期边际贡献额",
      unit: "",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : "-",
      getColor: (val) =>
        val !== null && val >= 0 ? "text-green-600" : "text-red-600",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "signed_premium",
      title: "签单保费",
      unit: "",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "reported_claim_payment",
      title: "已报告赔款",
      unit: "",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "expense_amount",
      title: "费用额",
      unit: "",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? formatCurrency(val)
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
  ];

  // 第三行：比率/数量指标
  const row3KPIs: KPIConfig[] = [
    {
      key: "variable_cost_ratio",
      title: "变动成本率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val > 90
          ? "text-red-600"
          : val !== null && val > 85
            ? "text-orange-600"
            : "text-green-600",
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "maturity_ratio",
      title: "满期率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val >= 80
          ? "text-green-600"
          : val !== null && val >= 60
            ? "text-blue-600"
            : "text-orange-600",
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "matured_claim_ratio",
      title: "满期出险率",
      unit: "",
      formatter: formatPercent,
      getColor: (val) =>
        val !== null && val > 60
          ? "text-red-600"
          : val !== null && val > 50
            ? "text-orange-600"
            : "text-green-600",
      decimals: 2,
      hasFormula: true,
    },
    {
      key: "policy_count",
      title: "保单件数",
      unit: "件",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString("zh-CN")
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
  ];

  // 第四行：单均指标
  const row4KPIs: KPIConfig[] = [
    {
      key: "claim_case_count",
      title: "赔案件数",
      unit: "件",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? val.toLocaleString("zh-CN")
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "average_premium",
      title: "单均保费",
      unit: "元",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString("zh-CN")
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "average_claim",
      title: "案均赔款",
      unit: "元",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString("zh-CN")
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
    {
      key: "average_expense",
      title: "单均费用",
      unit: "元",
      formatter: (val) =>
        val !== null && val !== undefined && !isNaN(val)
          ? Math.round(val).toLocaleString("zh-CN")
          : "-",
      getColor: () => "text-slate-700",
      decimals: 0,
      hasFormula: true,
    },
  ];

  // 计算环比增量和变化幅度
  const getChangeInfo = (
    current: number | null,
    previous: number | null,
    decimals: number = 2,
  ): {
    delta: string;
    percent: string;
    direction: "up" | "down" | "flat";
    color: string;
  } => {
    if (
      current === null ||
      previous === null ||
      current === undefined ||
      previous === undefined ||
      isNaN(current) ||
      isNaN(previous)
    ) {
      return {
        delta: "-",
        percent: "-",
        direction: "flat",
        color: "text-slate-400",
      };
    }

    const delta = current - previous;
    const percent = previous !== 0 ? (delta / previous) * 100 : 0;

    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const color =
      direction === "up"
        ? "text-green-600"
        : direction === "down"
          ? "text-red-600"
          : "text-slate-500";

    const deltaStr =
      delta >= 0 ? `+${delta.toFixed(decimals)}` : delta.toFixed(decimals);
    const percentStr =
      percent >= 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`;

    return { delta: deltaStr, percent: percentStr, direction, color };
  };

  // 渲染单个KPI卡片
  const renderKPICard = (config: KPIConfig) => {
    const value = kpiData?.[config.key] as number | null;
    const formattedValue = config.formatter(value);
    const compareValue = compareData
      ? (compareData[config.key] as number | null)
      : null;
    const changeInfo = getChangeInfo(value, compareValue, config.decimals);
    const formulaDefinition = config.hasFormula
      ? getKPIFormula(config.key as string)
      : undefined;

    // 获取分子分母值（用于显示计算详情）
    const getNumeratorDenominator = () => {
      const key = config.key as string;
      if (!kpiData) return { numerator: null, denominator: null };

      // 根据不同的KPI类型返回对应的分子分母
      switch (key) {
        case "contribution_margin_ratio":
          return {
            numerator: kpiData.contribution_margin_amount * 10000,
            denominator: kpiData.matured_premium * 10000,
          };
        case "loss_ratio":
          return {
            numerator: kpiData.reported_claim_payment * 10000,
            denominator: kpiData.matured_premium * 10000,
          };
        case "expense_ratio":
          return {
            numerator: kpiData.expense_amount * 10000,
            denominator: kpiData.signed_premium * 10000,
          };
        case "maturity_ratio":
          return {
            numerator: kpiData.matured_premium * 10000,
            denominator: kpiData.signed_premium * 10000,
          };
        case "matured_claim_ratio":
          return {
            numerator: kpiData.claim_case_count,
            denominator: kpiData.policy_count,
          };
        case "average_premium":
          return {
            numerator: kpiData.signed_premium * 10000,
            denominator: kpiData.policy_count,
          };
        case "average_claim":
          return {
            numerator: kpiData.reported_claim_payment * 10000,
            denominator: kpiData.claim_case_count,
          };
        case "average_expense":
          return {
            numerator: kpiData.expense_amount * 10000,
            denominator: kpiData.policy_count,
          };
        default:
          return { numerator: null, denominator: null };
      }
    };

    const { numerator, denominator } = getNumeratorDenominator();

    return (
      <div
        key={config.key as string}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300",
          "hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50",
        )}
      >
        {/* 装饰性渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative space-y-3">
          {/* 标题行 */}
          <div className="flex items-start justify-between">
            <h4 className="text-xs font-medium text-slate-600">
              {config.title}
            </h4>
            {formulaDefinition && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button className="ml-2 text-slate-400 transition-colors hover:text-blue-600">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-sm border border-slate-200 bg-white p-4 shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* 计算公式 */}
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          计算公式
                        </p>
                        <p className="mt-1 font-mono text-sm text-blue-600">
                          {formulaDefinition.formula}
                        </p>
                      </div>

                      {/* 计算详情（如果有分子分母） */}
                      {formulaDefinition.numerator &&
                        formulaDefinition.denominator && (
                          <div className="space-y-1 border-t border-slate-100 pt-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">
                                {formulaDefinition.numerator}
                              </span>
                              <span className="font-mono font-semibold text-slate-800">
                                {numerator !== null && numerator !== undefined
                                  ? numerator.toLocaleString("zh-CN", {
                                      maximumFractionDigits: 2,
                                    })
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">
                                {formulaDefinition.denominator}
                              </span>
                              <span className="font-mono font-semibold text-slate-800">
                                {denominator !== null &&
                                denominator !== undefined
                                  ? denominator.toLocaleString("zh-CN", {
                                      maximumFractionDigits: 2,
                                    })
                                  : "-"}
                              </span>
                            </div>
                            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-xs">
                              <span className="font-semibold text-slate-700">
                                结果
                              </span>
                              <span className="font-mono font-bold text-blue-600">
                                {formattedValue}
                                {config.unit && ` ${config.unit}`}
                              </span>
                            </div>
                          </div>
                        )}

                      {/* 业务含义 */}
                      <div className="border-t border-slate-100 pt-2">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">业务含义：</span>
                          {formulaDefinition.businessMeaning}
                        </p>
                      </div>

                      {/* 示例 */}
                      {formulaDefinition.example && (
                        <div className="border-t border-slate-100 pt-2">
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold">示例：</span>
                            {formulaDefinition.example}
                          </p>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* 当前值 - 更大更突出 */}
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                config.getColor(value),
              )}
            >
              {formattedValue}
            </span>
            {config.unit && (
              <span className="text-sm text-slate-500">{config.unit}</span>
            )}
          </div>

          {/* 环比信息 */}
          {compareData && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                {changeInfo.direction === "up" && (
                  <TrendingUp className="h-4 w-4" />
                )}
                {changeInfo.direction === "down" && (
                  <TrendingDown className="h-4 w-4" />
                )}
                {changeInfo.direction === "flat" && (
                  <Minus className="h-4 w-4" />
                )}
                <span className={cn("font-semibold", changeInfo.color)}>
                  {changeInfo.delta}
                </span>
              </div>
              <span className={cn("font-semibold", changeInfo.color)}>
                {changeInfo.percent}
              </span>
              {compareWeekNumber && (
                <span className="text-xs text-slate-400">
                  vs W{compareWeekNumber}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 h-3 w-28 rounded bg-slate-200" />
                <div className="mb-2 h-8 w-24 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 如果没有数据，显示空状态
  if (!kpiData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-slate-600">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 第一行：比率指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row1KPIs.map((config) => renderKPICard(config))}
      </div>

      {/* 第二行：金额指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row2KPIs.map((config) => renderKPICard(config))}
      </div>

      {/* 第三行：比率/数量指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row3KPIs.map((config) => renderKPICard(config))}
      </div>

      {/* 第四行：单均指标 */}
      <div className="grid grid-cols-4 gap-4">
        {row4KPIs.map((config) => renderKPICard(config))}
      </div>
    </div>
  );
}
