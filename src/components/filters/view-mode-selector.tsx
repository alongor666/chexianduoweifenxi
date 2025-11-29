"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * 视图模式选择器组件（Tab标签页形式）
 * 支持单周表现分析和多周趋势分析两种模式
 * 用于页面顶部标题右侧
 */
export function ViewModeSelector() {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <Tabs
      value={viewMode}
      onValueChange={(v) => setViewMode(v as "single" | "trend")}
    >
      <TabsList className="bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
        <TabsTrigger
          value="single"
          className="data-[state=active]:bg-white/20 data-[state=active]:shadow-sm gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          单周表现分析
        </TabsTrigger>
        <TabsTrigger
          value="trend"
          className="data-[state=active]:bg-white/20 data-[state=active]:shadow-sm gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          多周趋势分析
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
