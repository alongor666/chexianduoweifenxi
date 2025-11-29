/**
 * 性能监控仪表板组件
 * 实时展示新架构的性能指标
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCacheStore } from "@/store/domains/cacheStore";
import { useDataStore } from "@/store/domains/dataStore";
import { useFilterStore } from "@/store/domains/filterStore";
import {
  Database,
  Zap,
  Filter,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export function PerformanceMonitor() {
  const [renderTime, setRenderTime] = useState(0);
  const cacheStats = useCacheStore((state) => state.getCacheStats());
  const rawData = useDataStore((state) => state.rawData);
  const activeFilterCount = useFilterStore((state) =>
    state.getActiveFilterCount(),
  );

  // 监控渲染性能
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    };
  }, []);

  // 计算缓存命中率
  const hitRate =
    cacheStats.hits + cacheStats.misses > 0
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
      : 0;

  // 性能评分（0-100）
  const performanceScore = Math.min(
    100,
    Math.round(
      hitRate * 0.4 + // 缓存命中率占40%
        (rawData.length > 0 ? 30 : 0) + // 有数据占30%
        (renderTime < 100 ? 30 : renderTime < 500 ? 20 : 10), // 渲染速度占30%
    ),
  );

  const getPerformanceLevel = (
    score: number,
  ): { level: string; color: string; icon: typeof Zap } => {
    if (score >= 80)
      return { level: "优秀", color: "text-green-600", icon: CheckCircle };
    if (score >= 60)
      return { level: "良好", color: "text-blue-600", icon: TrendingUp };
    if (score >= 40)
      return { level: "一般", color: "text-yellow-600", icon: Clock };
    return { level: "需优化", color: "text-red-600", icon: Zap };
  };

  const perf = getPerformanceLevel(performanceScore);
  const PerformanceIcon = perf.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              性能监控仪表板
            </CardTitle>
            <CardDescription>实时监控新架构性能指标</CardDescription>
          </div>
          <Badge
            variant={
              performanceScore >= 80
                ? "default"
                : performanceScore >= 60
                  ? "secondary"
                  : "destructive"
            }
          >
            <PerformanceIcon className="h-3 w-3 mr-1" />
            {perf.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 性能评分 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">综合性能评分</span>
            <span className={`text-2xl font-bold ${perf.color}`}>
              {performanceScore}
            </span>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>

        {/* 性能指标网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 缓存性能 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                缓存性能
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {hitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-700">
              命中: {cacheStats.hits} / 未命中: {cacheStats.misses}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              缓存大小: {cacheStats.size}
            </div>
          </div>

          {/* 数据统计 */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                数据统计
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {rawData.length.toLocaleString()}
            </div>
            <div className="text-xs text-green-700">总记录数</div>
            <div className="text-xs text-green-600 mt-1">
              {rawData.length > 0 && `数据已加载`}
            </div>
          </div>

          {/* 筛选状态 */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                筛选状态
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {activeFilterCount}
            </div>
            <div className="text-xs text-purple-700">激活的筛选器</div>
            <div className="text-xs text-purple-600 mt-1">
              {activeFilterCount === 0 ? "查看全部数据" : "已应用筛选"}
            </div>
          </div>

          {/* 渲染性能 */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                渲染性能
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {renderTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-orange-700">组件渲染时间</div>
            <div className="text-xs text-orange-600 mt-1">
              {renderTime < 100
                ? "⚡ 极速"
                : renderTime < 500
                  ? "✓ 正常"
                  : "⚠ 较慢"}
            </div>
          </div>
        </div>

        {/* 架构优势展示 */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            新架构优势
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-900">
                  模块化设计
                </div>
                <div className="text-xs text-slate-600">
                  5个独立Store，职责清晰
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-900">
                  智能缓存
                </div>
                <div className="text-xs text-slate-600">
                  KPI计算结果自动缓存
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-900">
                  性能优化
                </div>
                <div className="text-xs text-slate-600">
                  消除重复逻辑，提升计算效率
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 缓存详情（可选） */}
        {cacheStats.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">
              缓存状态详情
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-blue-600">总请求:</span>
                <span className="ml-1 font-semibold">
                  {cacheStats.hits + cacheStats.misses}
                </span>
              </div>
              <div>
                <span className="text-blue-600">缓存命中:</span>
                <span className="ml-1 font-semibold">{cacheStats.hits}</span>
              </div>
              <div>
                <span className="text-blue-600">缓存未命中:</span>
                <span className="ml-1 font-semibold">{cacheStats.misses}</span>
              </div>
              <div>
                <span className="text-blue-600">命中率:</span>
                <span className="ml-1 font-semibold">
                  {hitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
