/**
 * 多维健康度雷达图组件 - 机构对比版本
 * 综合展示5个核心维度的健康评分，支持多个机构（最多7个）的对比分析
 */

"use client";

import React, { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Info } from "lucide-react";
import {
  RADAR_DIMENSIONS,
  convertKPIToRadarScores,
  type RadarScoreResult,
} from "@/utils/radar-score";
import { formatPercent, formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";
import { getOrganizationColor } from "@/utils/organization-config";
import { OrganizationSelector } from "./organization-selector";
import { useMultipleOrganizationKPIs } from "@/hooks/use-organization-kpi";
import { getAllQuickFilters } from "@/utils/quick-filters";
import type { KPIResult } from "@/types/insurance";
import { ALL_ORGANIZATIONS } from "@/utils/organization-config";

interface MultiDimensionRadarProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 雷达数据点（支持多个机构）
 */
interface RadarDataPoint {
  dimension: string; // 维度简称
  fullLabel: string; // 维度全称
  dimensionKey: string; // 维度key
  unit: string;
  description: string;

  // 动态机构评分字段（使用索引签名）
  [key: string]: string | number | Record<string, any>;

  // 辅助数据
  rawValues: Record<string, number>;
  levels: Record<string, string>;
  colors: Record<string, string>;
}

/**
 * 多维健康度雷达图 - 机构对比
 */
export function MultiDimensionRadar({ className }: MultiDimensionRadarProps) {
  // 机构选择状态（默认选择前3个）
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([
    "天府",
    "高新",
    "宜宾",
  ]);

  // 悬停状态
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);

  // 获取所有机构的KPI（用于快捷筛选）
  const allOrgKPIs = useMultipleOrganizationKPIs(Array.from(ALL_ORGANIZATIONS));

  // 获取已选机构的KPI
  const selectedOrgKPIs = useMultipleOrganizationKPIs(selectedOrganizations);

  // 生成快捷筛选列表
  const quickFilters = useMemo(() => {
    return getAllQuickFilters(allOrgKPIs);
  }, [allOrgKPIs]);

  // 转换为雷达图数据
  const radarData = useMemo((): RadarDataPoint[] => {
    // 为每个维度创建数据点
    return RADAR_DIMENSIONS.map((dim) => {
      const dataPoint: RadarDataPoint = {
        dimension: dim.shortLabel,
        fullLabel: dim.label,
        dimensionKey: dim.key,
        unit: dim.unit,
        description: dim.description,
        rawValues: {},
        levels: {},
        colors: {},
      };

      // 为每个已选机构添加评分
      selectedOrganizations.forEach((orgName) => {
        const kpi = selectedOrgKPIs.get(orgName);
        const scores = kpi ? convertKPIToRadarScores(kpi) : new Map();
        const scoreResult = scores.get(dim.key);

        // 添加评分（使用机构名作为key）
        dataPoint[orgName] = scoreResult?.score ?? 0;

        // 添加辅助数据
        dataPoint.rawValues[orgName] = scoreResult?.rawValue ?? 0;
        dataPoint.levels[orgName] = scoreResult?.label ?? "-";
        dataPoint.colors[orgName] = scoreResult?.color ?? "#94a3b8";
      });

      return dataPoint;
    });
  }, [selectedOrganizations, selectedOrgKPIs]);

  // 计算每个机构的综合评分
  const overallScores = useMemo(() => {
    const scores: Record<string, number> = {};

    selectedOrganizations.forEach((orgName) => {
      const validScores = radarData
        .map((d) => d[orgName] as number)
        .filter((s) => s > 0);

      if (validScores.length > 0) {
        scores[orgName] = Math.round(
          validScores.reduce((sum, s) => sum + s, 0) / validScores.length,
        );
      } else {
        scores[orgName] = 0;
      }
    });

    return scores;
  }, [selectedOrganizations, radarData]);

  // 获取综合评分等级
  const getOverallLevel = (score: number) => {
    if (score >= 95) return { label: "卓越", color: "#2E7D32" };
    if (score >= 86) return { label: "良好", color: "#4CAF50" };
    if (score >= 70) return { label: "中等", color: "#1976D2" };
    if (score >= 20) return { label: "预警", color: "#F57C00" };
    return { label: "高危", color: "#D32F2F" };
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as RadarDataPoint;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-slate-800">
          {data.fullLabel}
        </p>

        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const orgName = entry.name;
            const score = entry.value;
            const rawValue = data.rawValues[orgName];
            const level = data.levels[orgName];
            const color = data.colors[orgName];

            return (
              <div key={orgName} className="flex items-center gap-3 text-xs">
                {/* 颜色点 */}
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.stroke }}
                />

                {/* 机构名 */}
                <span className="w-12 font-medium text-slate-700">
                  {orgName}
                </span>

                {/* 评分 */}
                <span className="font-bold text-slate-900">
                  {formatNumber(score, 1)}
                </span>

                {/* 原始值 */}
                {rawValue !== undefined && (
                  <span className="text-slate-500">
                    ({formatPercent(rawValue, 1)})
                  </span>
                )}

                {/* 等级 */}
                <span className="font-medium" style={{ color }}>
                  {level}
                </span>
              </div>
            );
          })}
        </div>

        {/* 最优机构 */}
        <div className="mt-2 border-t border-slate-200 pt-2">
          <p className="text-xs text-slate-500">
            最优: {getBestOrgForDimension(data)} 🏆
          </p>
        </div>
      </div>
    );
  };

  // 获取某维度的最优机构
  const getBestOrgForDimension = (data: RadarDataPoint): string => {
    let bestOrg = "";
    let bestScore = -1;

    selectedOrganizations.forEach((orgName) => {
      const score = data[orgName] as number;
      if (score > bestScore) {
        bestScore = score;
        bestOrg = orgName;
      }
    });

    return bestOrg || "-";
  };

  // 空状态
  if (selectedOrganizations.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <OrganizationSelector
          selectedOrganizations={selectedOrganizations}
          onChange={setSelectedOrganizations}
          quickFilters={quickFilters}
        />

        <div className="rounded-2xl border border-slate-200 bg-white/60 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-500">请选择要对比的机构</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 机构选择器 */}
      <OrganizationSelector
        selectedOrganizations={selectedOrganizations}
        onChange={setSelectedOrganizations}
        quickFilters={quickFilters}
      />

      {/* 雷达图主体 */}
      <div className="rounded-2xl border border-white/50 bg-white/40 shadow-lg backdrop-blur-xl">
        {/* 标题栏 */}
        <div className="border-b border-slate-200/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                多维健康度雷达图 - 机构对比
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                综合对比{selectedOrganizations.length}
                个机构在5个核心维度的业务健康状况
              </p>
            </div>

            {/* 综合排名（前3名） */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">
                综合排名
              </p>
              {Object.entries(overallScores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([orgName, score], index) => {
                  const level = getOverallLevel(score);
                  const medals = ["🥇", "🥈", "🥉"];
                  const orgIndex = selectedOrganizations.indexOf(orgName);
                  const color = getOrganizationColor(orgIndex);

                  return (
                    <div
                      key={orgName}
                      className="mb-1.5 flex items-center gap-2 last:mb-0"
                    >
                      <span className="text-sm">{medals[index]}</span>
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {orgName}
                      </span>
                      <span
                        className="ml-auto text-sm font-bold"
                        style={{ color: level.color }}
                      >
                        {score}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="p-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{
                    fill: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickCount={6}
                />

                {/* 为每个机构渲染一条Radar折线 */}
                {selectedOrganizations.map((orgName, index) => {
                  const color = getOrganizationColor(index);

                  return (
                    <Radar
                      key={orgName}
                      name={orgName}
                      dataKey={orgName}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.08}
                      strokeWidth={2.5}
                      dot={{
                        r: 5,
                        fill: color,
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 7,
                        fill: color,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      onMouseEnter={(data: any) =>
                        setHoveredDimension(data.dimensionKey)
                      }
                      onMouseLeave={() => setHoveredDimension(null)}
                    />
                  );
                })}

                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                  }}
                  iconType="line"
                  formatter={(value: string) => (
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      {value}
                    </span>
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 说明文本 */}
        <div className="border-t border-slate-200/50 bg-slate-50/50 px-6 py-3">
          <p className="text-xs text-slate-500">
            💡 提示：评分基于业务规则自动计算，范围为 0-100
            分。卓越（95-100）、良好（86-94）、中等（70-85）、预警（20-69）、高危（0-19）
          </p>
        </div>
      </div>
    </div>
  );
}
