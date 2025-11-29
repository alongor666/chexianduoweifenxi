"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/store/use-app-store";
import { useFilteredData } from "@/hooks/use-filtered-data";

/**
 * 筛选器反馈组件
 * 提供智能的用户提示和操作建议
 */
export function FilterFeedback() {
  const filters = useAppStore((state) => state.filters);
  const rawData = useAppStore((state) => state.rawData);
  const filteredData = useFilteredData();
  const [feedback, setFeedback] = useState<{
    type: "info" | "warning" | "success" | "tip";
    message: string;
    show: boolean;
  }>({ type: "info", message: "", show: false });

  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      setFeedback({ type: "info", message: "", show: false });
      return;
    }

    const totalRecords = rawData.length;
    const filteredRecords = filteredData.length;
    const filterRatio = filteredRecords / totalRecords;

    // 生成智能反馈
    let newFeedback: {
      type: "info" | "warning" | "success" | "tip";
      message: string;
      show: boolean;
    } = { type: "info", message: "", show: false };

    // 1. 数据过滤结果反馈
    if (filteredRecords === 0) {
      newFeedback = {
        type: "warning",
        message: "当前筛选条件未找到匹配数据，请尝试调整筛选条件",
        show: true,
      };
    } else if (filterRatio < 0.01) {
      newFeedback = {
        type: "warning",
        message: `筛选结果仅占总数据的 ${(filterRatio * 100).toFixed(1)}%，数据样本较小，分析结果可能不够全面`,
        show: true,
      };
    } else if (filterRatio > 0.9) {
      newFeedback = {
        type: "tip",
        message:
          "当前筛选条件较宽泛，可以尝试添加更多筛选条件以获得更精准的分析",
        show: true,
      };
    }

    // 2. 视图模式相关反馈
    if (filters.viewMode === "trend" && filters.weeks.length < 2) {
      newFeedback = {
        type: "tip",
        message: "趋势分析模式建议选择多个周期，以便观察数据变化趋势",
        show: true,
      };
    }

    // 3. 数据视图类型反馈
    if (filters.dataViewType === "increment" && filters.weeks.length < 2) {
      newFeedback = {
        type: "warning",
        message: "周增量分析需要选择至少2个周期才能计算增量变化",
        show: true,
      };
    }

    // 4. 年份跨度反馈
    if (filters.years.length > 1) {
      const maxYear = filters.years.reduce(
        (max, y) => Math.max(max, y),
        -Infinity,
      );
      const minYear = filters.years.reduce(
        (min, y) => Math.min(min, y),
        Infinity,
      );
      const yearSpan = maxYear - minYear;
      if (yearSpan > 2) {
        newFeedback = {
          type: "tip",
          message: `当前选择了跨度 ${yearSpan + 1} 年的数据，建议关注年度间的业务变化趋势`,
          show: true,
        };
      }
    }

    // 5. 成功状态反馈
    if (newFeedback.show === false && filteredRecords > 0) {
      newFeedback = {
        type: "success",
        message: `已筛选出 ${filteredRecords.toLocaleString()} 条数据记录，占总数据的 ${(filterRatio * 100).toFixed(1)}%`,
        show: true,
      };
    }

    setFeedback(newFeedback);

    // 自动隐藏成功和提示消息
    if (newFeedback.type === "success" || newFeedback.type === "tip") {
      const timer = setTimeout(() => {
        setFeedback((prev) => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [rawData, filteredData, filters]);

  if (!feedback.show) return null;

  const getIcon = () => {
    switch (feedback.type) {
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "tip":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getAlertClass = () => {
    switch (feedback.type) {
      case "warning":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "success":
        return "border-green-200 bg-green-50 text-green-800";
      case "tip":
        return "border-blue-200 bg-blue-50 text-blue-800";
      default:
        return "border-slate-200 bg-slate-50 text-slate-800";
    }
  };

  return (
    <Alert className={`mb-4 ${getAlertClass()}`}>
      {getIcon()}
      <AlertDescription className="ml-2">{feedback.message}</AlertDescription>
    </Alert>
  );
}

/**
 * 筛选器统计信息组件
 * 显示当前筛选状态的详细统计
 */
export function FilterStats() {
  const filters = useAppStore((state) => state.filters);
  const rawData = useAppStore((state) => state.rawData);
  const filteredData = useFilteredData();

  if (!rawData || rawData.length === 0) return null;

  const totalRecords = rawData.length;
  const filteredRecords = filteredData.length;
  const filterRatio = ((filteredRecords / totalRecords) * 100).toFixed(1);

  // 计算活跃筛选器数量
  const activeFilters = [
    filters.years.length > 0 ? "年份" : null,
    filters.weeks.length > 0 ? "周期" : null,
    filters.organizations.length > 0 ? "组织" : null,
    filters.insuranceTypes.length > 0 ? "险种" : null,
    filters.businessTypes.length > 0 ? "业务类型" : null,
    filters.coverageTypes.length > 0 ? "保障类型" : null,
    filters.customerCategories.length > 0 ? "客户类别" : null,
    filters.vehicleGrades.length > 0 ? "车辆等级" : null,
    filters.terminalSources.length > 0 ? "终端来源" : null,
    filters.isNewEnergy !== null ? "新能源" : null,
    filters.renewalStatuses.length > 0 ? "续保状态" : null,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">筛选结果:</span>
        <span className="text-blue-600 font-semibold">
          {filteredRecords.toLocaleString()}
        </span>
        <span>条记录</span>
        <span className="text-slate-400">({filterRatio}%)</span>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span>活跃筛选器:</span>
          <span className="text-green-600 font-medium">
            {activeFilters.length}
          </span>
          <span className="text-slate-400">({activeFilters.join(", ")})</span>
        </div>
      )}
    </div>
  );
}
