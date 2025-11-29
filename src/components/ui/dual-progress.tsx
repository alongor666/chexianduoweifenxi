/**
 * 双轨进度条组件
 * 用于对比"已完成进度"与"时间进度"
 *
 * 设计理念：
 * - 背景填充条：表示已达成的进度（如保费达成率）
 * - 垂直标记线：表示时间进度基准线
 * - 用户可一眼看出进度是否跟上了时间
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface DualProgressProps {
  /**
   * 已达成的进度百分比（0-100+）
   */
  achievedProgress: number;

  /**
   * 时间进度百分比（0-100）
   */
  timeProgress: number;

  /**
   * 进度条颜色类名（Tailwind）
   */
  progressColor: string;

  /**
   * 时间标记线颜色类名（Tailwind）
   */
  timeMarkerColor?: string;

  /**
   * 高度类名
   */
  height?: string;

  /**
   * 是否显示标签
   */
  showLabels?: boolean;

  /**
   * 自定义类名
   */
  className?: string;
}

export function DualProgress({
  achievedProgress,
  timeProgress,
  progressColor,
  timeMarkerColor = "bg-slate-700",
  height = "h-4",
  showLabels = true,
  className,
}: DualProgressProps) {
  // 限制进度在 0-100 范围内（用于显示）
  const displayProgress = Math.min(Math.max(achievedProgress, 0), 100);
  const displayTimeProgress = Math.min(Math.max(timeProgress, 0), 100);

  // 判断进度是否超前/落后
  const isAhead = achievedProgress >= timeProgress;
  const gap = Math.abs(achievedProgress - timeProgress);

  return (
    <div className={cn("w-full", className)}>
      {/* 进度条主体 */}
      <div className={cn("relative w-full rounded-full bg-slate-100", height)}>
        {/* 已达成进度（背景填充条） */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out",
            progressColor,
          )}
          style={{ width: `${displayProgress}%` }}
        />

        {/* 时间进度标记线 */}
        <div
          className={cn(
            "absolute top-0 h-full w-1 transition-all duration-500 ease-out",
            timeMarkerColor,
          )}
          style={{ left: `${displayTimeProgress}%` }}
        >
          {/* 标记线顶部三角形指示器 */}
          <div
            className={cn(
              "absolute -top-1.5 left-1/2 h-0 w-0 -translate-x-1/2",
              "border-l-[4px] border-r-[4px] border-t-[6px]",
              "border-l-transparent border-r-transparent",
              timeMarkerColor.replace("bg-", "border-t-"),
            )}
          />
        </div>
      </div>

      {/* 标签说明 */}
      {showLabels && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded", progressColor)} />
            <span>已达成: {achievedProgress.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("h-3 w-1", timeMarkerColor)} />
            <span>时间进度: {timeProgress.toFixed(1)}%</span>
          </div>

          <div
            className={cn(
              "text-xs font-medium",
              isAhead ? "text-green-600" : "text-orange-600",
            )}
          >
            {isAhead ? "超前" : "落后"} {gap.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 简化版双轨进度条（无标签，更紧凑）
 */
export function CompactDualProgress({
  achievedProgress,
  timeProgress,
  progressColor,
  timeMarkerColor = "bg-slate-700",
  className,
}: Omit<DualProgressProps, "showLabels" | "height">) {
  return (
    <DualProgress
      achievedProgress={achievedProgress}
      timeProgress={timeProgress}
      progressColor={progressColor}
      timeMarkerColor={timeMarkerColor}
      height="h-3"
      showLabels={false}
      className={className}
    />
  );
}
