/**
 * 增强版KPI卡片组件
 * 提供更丰富的视觉效果，包括动态箭头、胶囊标签、数字动画等
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getKPIFormula } from "@/lib/calculations/kpi-formulas";
import { Badge } from "@/components/ui/badge";

export interface EnhancedKPICardProps {
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
   * 值的颜色（可选，如果不提供则使用默认颜色）
   */
  valueColor?: string;

  /**
   * 背景颜色（可选）
   */
  bgColor?: string;

  /**
   * 对比值（用于显示变化）
   */
  compareValue?: number | null;

  /**
   * 对比值单位
   */
  compareUnit?: string;

  /**
   * 格式化函数（如果不提供，使用默认格式化）
   */
  formatter?: (value: number | null | undefined) => string;

  /**
   * 是否为大卡片（占据更多空间）
   */
  large?: boolean;

  /**
   * 自定义图标
   */
  icon?: React.ReactNode;

  /**
   * 点击事件
   */
  onClick?: () => void;

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
   * 趋势数据（用于显示迷你趋势线）
   */
  trendData?: number[];

  /**
   * 状态标签（如"优秀"、"良好"、"需关注"）
   */
  status?: 'excellent' | 'good' | 'warning' | 'danger';

  /**
   * 是否显示脉冲动画
   */
  showPulse?: boolean;

  /**
   * 点击时的筛选参数
   */
  filterParams?: Record<string, any>;
}

// 数字动画Hook
function useAnimatedValue(value: number | null | undefined, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef<number | null | undefined>(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // 如果值无效，直接返回
    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue(0);
      return;
    }

    const startValue = previousValue.current || 0;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // 使用easeOutExpo缓动函数
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = startValue + (endValue - startValue) * easeOutExpo;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    // 清理之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
}

// 迷你趋势线组件
function MiniTrendLine({ data, positive = true }: { data: number[], positive?: boolean }) {
  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 40" className="w-full h-10 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#10b981' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {/* 渐变填充 */}
      <defs>
        <linearGradient id={`trend-gradient-${positive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity="0.2" />
          <stop offset="100%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${points} 100,40 0,40`}
        fill={`url(#trend-gradient-${positive ? 'up' : 'down'})`}
        className="opacity-30"
      />
    </svg>
  );
}

export function EnhancedKPICard({
  title,
  value,
  unit = "",
  description,
  valueColor,
  bgColor,
  compareValue,
  compareUnit = "%",
  formatter,
  large = false,
  icon,
  onClick,
  kpiKey,
  numeratorValue,
  denominatorValue,
  trendData,
  status,
  showPulse = false,
  filterParams,
}: EnhancedKPICardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const animatedValue = useAnimatedValue(value);

  // 格式化主值
  const formattedValue = formatter
    ? formatter(value)
    : value !== null && value !== undefined && !isNaN(value)
      ? value.toLocaleString("zh-CN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "-";

  // 格式化动画值
  const formattedAnimatedValue = formatter
    ? formatter(animatedValue)
    : animatedValue.toLocaleString("zh-CN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

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
      ? "text-emerald-600"
      : compareDirection === "down"
        ? "text-rose-600"
        : "text-slate-500";

  const formattedCompareValue = hasCompareValue
    ? `${compareValue > 0 ? "+" : ""}${compareValue.toFixed(2)}${compareUnit}`
    : null;

  // 状态标签配置
  const statusConfig = {
    excellent: { label: "优秀", color: "bg-emerald-100 text-emerald-800" },
    good: { label: "良好", color: "bg-blue-100 text-blue-800" },
    warning: { label: "需关注", color: "bg-amber-100 text-amber-800" },
    danger: { label: "危险", color: "bg-red-100 text-red-800" },
  };

  // 获取 KPI 公式定义
  const formulaDefinition = kpiKey ? getKPIFormula(kpiKey) : undefined;

  // 计算趋势方向
  const trendDirection = trendData && trendData.length > 1
    ? trendData[trendData.length - 1] - trendData[0]
    : 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white/80 backdrop-blur-sm transition-all duration-300",
        "hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1",
        onClick && "cursor-pointer",
        large ? "col-span-2" : "col-span-1",
        bgColor,
        showPulse && "animate-pulse",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 装饰性渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 脉冲动画效果 */}
      {showPulse && (
        <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-xl animate-pulse opacity-75" />
      )}

      <div className="relative p-6">
        {/* 标题行 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-700">{title}</h3>

              {/* 状态标签 */}
              {status && statusConfig[status] && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-2 py-0.5 font-medium",
                    statusConfig[status].color
                  )}
                >
                  {statusConfig[status].label}
                </Badge>
              )}

              {formulaDefinition && (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button className="group/info inline-flex items-center">
                        <Info className="h-4 w-4 text-slate-400 transition-colors hover:text-blue-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-sm border border-slate-200 bg-white p-4 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            计算公式
                          </p>
                          <p className="mt-1 font-mono text-sm text-blue-600">
                            {formulaDefinition.formula}
                          </p>
                        </div>

                        {formulaDefinition.numerator &&
                          formulaDefinition.denominator && (
                            <div className="space-y-1 border-t border-slate-100 pt-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">
                                  {formulaDefinition.numerator}
                                </span>
                                <span className="font-mono font-semibold text-slate-800">
                                  {numeratorValue !== null &&
                                  numeratorValue !== undefined
                                    ? numeratorValue.toLocaleString("zh-CN", {
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
                                  {denominatorValue !== null &&
                                  denominatorValue !== undefined
                                    ? denominatorValue.toLocaleString("zh-CN", {
                                        maximumFractionDigits: 2,
                                      })
                                    : "-"}
                                </span>
                              </div>
                            </div>
                          )}

                        <div className="border-t border-slate-100 pt-2">
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold">业务含义：</span>
                            {formulaDefinition.businessMeaning}
                          </p>
                        </div>

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
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "ml-3 flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300",
              isHovered ? "scale-110" : "scale-100",
              valueColor?.includes("green") ? "bg-emerald-50 text-emerald-600" :
              valueColor?.includes("red") ? "bg-rose-50 text-rose-600" :
              valueColor?.includes("blue") ? "bg-blue-50 text-blue-600" :
              valueColor?.includes("yellow") ? "bg-amber-50 text-amber-600" :
              "bg-blue-50 text-blue-600",
              isHovered && (
                valueColor?.includes("green") ? "bg-emerald-100" :
                valueColor?.includes("red") ? "bg-rose-100" :
                valueColor?.includes("blue") ? "bg-blue-100" :
                valueColor?.includes("yellow") ? "bg-amber-100" :
                "bg-blue-100"
              )
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* 数值显示 */}
        <div className="mb-3 flex items-baseline gap-2">
          <span
            className={cn(
              "text-3xl font-bold tabular-nums transition-all duration-300",
              isHovered && "scale-105",
              valueColor || "text-slate-800",
            )}
          >
            {formattedAnimatedValue}
          </span>
          {unit && (
            <span className="text-base font-medium text-slate-500">{unit}</span>
          )}
        </div>

        {/* 对比值显示（胶囊样式） */}
        {formattedCompareValue && (
          <div className="mb-3 flex items-center gap-2">
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-300",
              compareDirection === "up" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
              compareDirection === "down" && "bg-rose-50 text-rose-700 border border-rose-200",
              compareDirection === "flat" && "bg-slate-50 text-slate-600 border border-slate-200",
              isHovered && "scale-105"
            )}>
              {compareDirection === "up" && (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {compareDirection === "down" && (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {compareDirection === "flat" && (
                <Minus className="h-3.5 w-3.5" />
              )}
              <span>{formattedCompareValue}</span>
            </div>
            <span className="text-xs text-slate-500">vs 上期</span>
          </div>
        )}

        {/* 迷你趋势线 */}
        {trendData && trendData.length > 1 && (
          <div className="mb-3 opacity-60 hover:opacity-100 transition-opacity">
            <MiniTrendLine
              data={trendData}
              positive={trendDirection >= 0}
            />
          </div>
        )}

        {/* 活动指示器 */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
            <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* 底部装饰条（动态） */}
      {valueColor && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
            valueColor.replace("text-", "bg-"),
            isHovered ? "opacity-100 h-1.5" : "opacity-70"
          )}
        />
      )}

      {/* 悬浮时的光晕效果 */}
      {isHovered && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
      )}
    </div>
  );
}

/**
 * 增强版KPI卡片骨架屏
 */
export function EnhancedKPICardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-slate-200 bg-white/80 p-6",
        large ? "col-span-2" : "col-span-1",
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="mt-1 h-3 w-24 rounded bg-slate-200" />
        </div>
        <div className="ml-3 h-10 w-10 rounded-lg bg-slate-200" />
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <div className="h-8 w-32 rounded bg-slate-200" />
        <div className="h-5 w-8 rounded bg-slate-200" />
      </div>
      <div className="mb-3 h-6 w-24 rounded-full bg-slate-200" />
      <div className="h-10 w-full rounded bg-slate-200" />
    </div>
  );
}