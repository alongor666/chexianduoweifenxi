/**
 * 多维图表标签页容器组件
 * 将机构雷达图、保费分析图、赔付分析图、占比分析图整合到标签页中
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiDimensionRadar } from "./multi-dimension-radar";
import { PremiumAnalysisBarChart } from "./structure-bar-chart";
import { ClaimAnalysisBarChart } from "./claim-analysis-bar-chart";
import { DistributionPieChart } from "./distribution-pie-chart";

export type MultiChartTabValue = "radar" | "premium" | "claim" | "distribution";

interface MultiChartTabsProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 多维图表标签页容器
 * 整合4个核心分析图表到标签页界面
 */
export function MultiChartTabs({ className }: MultiChartTabsProps) {
  const [activeTab, setActiveTab] = useState<MultiChartTabValue>("radar");

  const tabItems = [
    {
      value: "radar" as const,
      label: "机构雷达图",
      description: "多机构健康度对比分析",
    },
    {
      value: "premium" as const,
      label: "保费分析",
      description: "保费数据多维度分析",
    },
    {
      value: "claim" as const,
      label: "赔付分析",
      description: "赔付数据多维度分析",
    },
    {
      value: "distribution" as const,
      label: "占比分析",
      description: "客户与渠道占比分析",
    },
  ];

  return (
    <div className={className}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MultiChartTabValue)}
        className="space-y-6"
      >
        {/* 标签页导航 */}
        <div className="rounded-2xl border border-white/50 bg-white/40 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                多维图表分析
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {tabItems.find((item) => item.value === activeTab)?.description}
              </p>
            </div>
          </div>

          <TabsList className="grid grid-cols-4 gap-2 bg-slate-100/50 p-1 rounded-lg">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 机构雷达图 */}
        <TabsContent value="radar" className="mt-0">
          <MultiDimensionRadar />
        </TabsContent>

        {/* 保费分析图 */}
        <TabsContent value="premium" className="mt-0">
          <PremiumAnalysisBarChart />
        </TabsContent>

        {/* 赔付分析图 */}
        <TabsContent value="claim" className="mt-0">
          <ClaimAnalysisBarChart />
        </TabsContent>

        {/* 占比分析图 */}
        <TabsContent value="distribution" className="mt-0">
          <DistributionPieChart />
        </TabsContent>
      </Tabs>

      {/* 使用说明 */}
      <div className="rounded-2xl border border-slate-200 p-4 bg-white/60 backdrop-blur-sm">
        <h4 className="text-sm font-semibold text-slate-800 mb-2">
          图表使用说明
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div>
            <span className="font-medium text-slate-700">机构雷达图：</span>
            对比多个机构在承保、赔付、客户、渠道、综合5个维度的健康评分
          </div>
          <div>
            <span className="font-medium text-slate-700">保费分析：</span>
            按业务类型、机构、险别等维度分析保费数据
          </div>
          <div>
            <span className="font-medium text-slate-700">赔付分析：</span>
            按业务类型、机构、险别等维度分析赔付数据
          </div>
          <div>
            <span className="font-medium text-slate-700">占比分析：</span>
            展示客户类型和渠道类型的满期保费占比
          </div>
        </div>
      </div>
    </div>
  );
}
