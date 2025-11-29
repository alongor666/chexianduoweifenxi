"use client";

import { TrendingUp, TrendingDown, Minus, Info, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getKPIFormula } from "@/lib/calculations/kpi-formulas";

export interface CompactKPICardProps {
  /**
   * KPI 名称
   */
  title: string;

  /**
   * KPI 值
   */
  value: number | null | undefined;

  /**
   * 单位（如 %、万元等）
   */
  unit?: string;

  /**
   * 描述信息
   */
  description?: string;

  /**
   * 值的颜色（可选）
   */
  valueColor?: string;

  /**
   * 背景颜色（可选）
   */
  bgColor?: string;

  /**
   * 对比值（用于显示环比变化）
   */
  compareValue?: number | null;

  /**
   * 格式化函数
   */
  formatter?: (value: number | null | undefined) => string;

  /**
   * 自定义图标
   */
  icon?: React.ReactNode;

  /**
   * KPI 键名（用于显示公式）
   */
  kpiKey?: string;

  /**
   * 分子值（用于计算详情）
   */
  numeratorValue?: number | null;

  /**
   * 分母值（用于计算详情）
   */
  denominatorValue?: number | null;

  /**
   * 是否为核心指标（突出显示）
   */
  isCore?: boolean;
}

export function CompactKPICard({
  title,
  value,
  unit = "",
  description,
  valueColor,
  bgColor,
  compareValue,
  formatter,
  icon,
  kpiKey,
  numeratorValue,
  denominatorValue,
  isCore = false,
}: CompactKPICardProps) {
  const [showDetail, setShowDetail] = useState(false);

  // 格式化主值
  const formattedValue = formatter
    ? formatter(value)
    : value !== null && value !== undefined && !isNaN(value)
      ? value.toLocaleString("zh-CN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "-";

  // 格式化对比值
  const hasCompareValue =
    compareValue !== null && compareValue !== undefined && !isNaN(compareValue);

  const compareDirection =
    hasCompareValue && compareValue > 0
      ? "up"
      : hasCompareValue && compareValue < 0
        ? "down"
        : "flat";

  const compareColorClass =
    compareDirection === "up"
      ? "text-green-600"
      : compareDirection === "down"
        ? "text-red-600"
        : "text-slate-500";

  const formattedCompareValue = hasCompareValue
    ? `${compareValue > 0 ? "+" : ""}${compareValue.toFixed(2)}%`
    : null;

  // 获取 KPI 公式定义
  const formulaDefinition = kpiKey ? getKPIFormula(kpiKey) : undefined;

  return (
    <div className="relative">
      {/* 主卡片 */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={cn(
          "group relative w-full overflow-hidden rounded-lg border text-left transition-all duration-200",
          isCore
            ? "border-blue-200 bg-gradient-to-br from-blue-50/80 to-white hover:border-blue-300 hover:shadow-md"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
          bgColor,
        )}
      >
        {/* 顶部指示条 */}
        {isCore && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400" />
        )}

        <div className="p-4">
          {/* 标题和图标 */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-medium text-slate-600 truncate">
                  {title}
                </h3>
                {formulaDefinition && (
                  <TooltipProvider>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex"
                        >
                          <Info className="h-3 w-3 text-slate-400 hover:text-blue-600 transition-colors" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs border border-slate-200 bg-white p-3 shadow-lg"
                      >
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              计算公式
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-blue-600">
                              {formulaDefinition.formula}
                            </p>
                          </div>
                          <div className="border-t border-slate-100 pt-1.5">
                            <p className="text-xs text-slate-600">
                              {formulaDefinition.businessMeaning}
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {icon && (
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  isCore
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <div className="scale-75">{icon}</div>
              </div>
            )}
          </div>

          {/* 数值 */}
          <div className="mb-2 flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                valueColor || "text-slate-800",
              )}
            >
              {formattedValue}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-500">{unit}</span>
            )}
          </div>

          {/* 对比值 */}
          {formattedCompareValue && (
            <div className="flex items-center gap-1">
              {compareDirection === "up" && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
              {compareDirection === "down" && (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              {compareDirection === "flat" && (
                <Minus className="h-3 w-3 text-slate-500" />
              )}
              <span className={cn("text-xs font-semibold", compareColorClass)}>
                {formattedCompareValue}
              </span>
              <span className="text-xs text-slate-400">vs上期</span>
            </div>
          )}
        </div>

        {/* 展开图标 */}
        <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3 w-3 text-slate-400" />
        </div>
      </button>

      {/* 详情弹窗 */}
      {showDetail && formulaDefinition && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          />

          {/* 弹窗内容 */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="space-y-4">
              {/* 标题 */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                  {description && (
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Maximize2 className="h-4 w-4 rotate-90" />
                </button>
              </div>

              {/* 当前值 */}
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-600 mb-1">当前值</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-4xl font-bold tabular-nums",
                      valueColor || "text-slate-800",
                    )}
                  >
                    {formattedValue}
                  </span>
                  {unit && (
                    <span className="text-lg font-medium text-slate-500">
                      {unit}
                    </span>
                  )}
                </div>
              </div>

              {/* 计算公式 */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  计算公式
                </p>
                <div className="rounded-lg border border-slate-200 bg-blue-50/50 p-3">
                  <p className="font-mono text-sm text-blue-700">
                    {formulaDefinition.formula}
                  </p>
                </div>
              </div>

              {/* 计算详情 */}
              {formulaDefinition.numerator && formulaDefinition.denominator && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    计算详情
                  </p>
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {formulaDefinition.numerator}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {numeratorValue !== null && numeratorValue !== undefined
                          ? numeratorValue.toLocaleString("zh-CN", {
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {formulaDefinition.denominator}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {denominatorValue !== null &&
                        denominatorValue !== undefined
                          ? denominatorValue.toLocaleString("zh-CN", {
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 业务含义 */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  业务含义
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {formulaDefinition.businessMeaning}
                </p>
              </div>

              {/* 示例 */}
              {formulaDefinition.example && (
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900 mb-1">
                    示例
                  </p>
                  <p className="text-sm text-amber-800">
                    {formulaDefinition.example}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * KPI 卡片骨架屏
 */
export function CompactKPICardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 h-3 w-20 rounded bg-slate-200" />
      <div className="mb-2 h-7 w-24 rounded bg-slate-200" />
      <div className="h-3 w-16 rounded bg-slate-200" />
    </div>
  );
}
