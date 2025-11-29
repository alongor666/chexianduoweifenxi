"use client";

import React, { useMemo } from "react";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataQualityReportProps {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errorStats: {
    totalErrors: number;
    fieldErrors: Record<string, number>;
    errorTypes: Record<string, number>;
    severityStats: {
      error: number;
      warning: number;
      info: number;
    };
  };
  fileName?: string;
}

interface QualityMetric {
  name: string;
  value: number;
  percentage: number;
  status: "excellent" | "good" | "warning" | "poor";
  description: string;
}

/**
 * 数据质量报告组件
 * 提供全面的数据质量分析和可视化展示
 */
export function DataQualityReport({
  totalRecords,
  validRecords,
  invalidRecords,
  errorStats,
  fileName,
}: DataQualityReportProps) {
  /**
   * 计算数据质量指标
   */
  const qualityMetrics = useMemo((): QualityMetric[] => {
    const completenessRate =
      totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;
    const criticalErrorRate =
      totalRecords > 0
        ? (errorStats.severityStats.error / totalRecords) * 100
        : 0;

    // 字段完整性评分（基于字段错误分布）
    const fieldCount = Object.keys(errorStats.fieldErrors).length;
    const fieldIntegrityScore =
      fieldCount > 0 ? Math.max(0, 100 - fieldCount * 5) : 100;

    // 数据一致性评分（基于错误类型分布）
    const consistencyIssues = Object.entries(errorStats.errorTypes)
      .filter(
        ([type]) =>
          type.includes("格式") ||
          type.includes("枚举") ||
          type.includes("范围"),
      )
      .reduce((sum, [, count]) => sum + count, 0);
    const consistencyScore =
      totalRecords > 0
        ? Math.max(0, 100 - (consistencyIssues / totalRecords) * 100)
        : 100;

    const getStatus = (percentage: number): QualityMetric["status"] => {
      if (percentage >= 95) return "excellent";
      if (percentage >= 85) return "good";
      if (percentage >= 70) return "warning";
      return "poor";
    };

    return [
      {
        name: "数据完整性",
        value: completenessRate,
        percentage: completenessRate,
        status: getStatus(completenessRate),
        description: "有效记录占总记录的比例",
      },
      {
        name: "数据准确性",
        value: 100 - criticalErrorRate,
        percentage: 100 - criticalErrorRate,
        status: getStatus(100 - criticalErrorRate),
        description: "无严重错误记录的比例",
      },
      {
        name: "字段完整性",
        value: fieldIntegrityScore,
        percentage: fieldIntegrityScore,
        status: getStatus(fieldIntegrityScore),
        description: "字段数据的完整程度",
      },
      {
        name: "数据一致性",
        value: consistencyScore,
        percentage: consistencyScore,
        status: getStatus(consistencyScore),
        description: "数据格式和规范的一致性",
      },
    ];
  }, [totalRecords, validRecords, errorStats]);

  /**
   * 计算总体质量评分
   */
  const overallScore = useMemo(() => {
    const avgScore =
      qualityMetrics.reduce((sum, metric) => sum + metric.value, 0) /
      qualityMetrics.length;
    return Math.round(avgScore);
  }, [qualityMetrics]);

  /**
   * 获取质量等级
   */
  const getQualityGrade = (score: number) => {
    if (score >= 95)
      return { grade: "A+", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 90)
      return { grade: "A", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 85)
      return { grade: "B+", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 80)
      return { grade: "B", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 70)
      return { grade: "C", color: "text-orange-600", bg: "bg-orange-50" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-50" };
  };

  const qualityGrade = getQualityGrade(overallScore);

  /**
   * 导出质量报告
   */
  const exportQualityReport = () => {
    const reportData = [
      ["数据质量报告"],
      ["文件名", fileName || "未知"],
      ["生成时间", new Date().toLocaleString("zh-CN")],
      [""],
      ["总体评分", `${overallScore}分 (${qualityGrade.grade})`],
      [""],
      ["基础统计"],
      ["总记录数", totalRecords],
      ["有效记录数", validRecords],
      ["无效记录数", invalidRecords],
      ["错误总数", errorStats.totalErrors],
      [""],
      ["质量指标"],
      ...qualityMetrics.map((metric) => [
        metric.name,
        `${metric.value.toFixed(1)}%`,
        metric.description,
      ]),
      [""],
      ["错误分布"],
      ["严重错误", errorStats.severityStats.error],
      ["警告", errorStats.severityStats.warning],
      ["提示", errorStats.severityStats.info],
      [""],
      ["错误类型统计"],
      ...Object.entries(errorStats.errorTypes).map(([type, count]) => [
        type,
        count,
      ]),
      [""],
      ["字段错误统计"],
      ...Object.entries(errorStats.fieldErrors).map(([field, count]) => [
        field,
        count,
      ]),
    ];

    const csvContent = reportData
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `数据质量报告_${fileName || "未知文件"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                数据质量报告
              </h3>
              {fileName && <p className="text-sm text-slate-600">{fileName}</p>}
            </div>
          </div>

          <button
            onClick={exportQualityReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 总体评分 */}
        <div
          className={cn(
            "p-6 rounded-xl border-2",
            qualityGrade.bg,
            qualityGrade.color === "text-green-600"
              ? "border-green-200"
              : qualityGrade.color === "text-blue-600"
                ? "border-blue-200"
                : qualityGrade.color === "text-orange-600"
                  ? "border-orange-200"
                  : "border-red-200",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-1">
                总体质量评分
              </h4>
              <p className="text-sm text-slate-600">
                基于完整性、准确性、一致性等维度综合评估
              </p>
            </div>
            <div className="text-right">
              <div className={cn("text-4xl font-bold", qualityGrade.color)}>
                {overallScore}
              </div>
              <div className={cn("text-lg font-semibold", qualityGrade.color)}>
                {qualityGrade.grade}
              </div>
            </div>
          </div>
        </div>

        {/* 质量指标 */}
        <div>
          <h4 className="text-lg font-semibold text-slate-800 mb-4">
            质量指标详情
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800">
                    {metric.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {metric.status === "excellent" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {metric.status === "good" && (
                      <Target className="w-4 h-4 text-blue-500" />
                    )}
                    {metric.status === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    {metric.status === "poor" && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        "font-semibold",
                        metric.status === "excellent"
                          ? "text-green-600"
                          : metric.status === "good"
                            ? "text-blue-600"
                            : metric.status === "warning"
                              ? "text-orange-600"
                              : "text-red-600",
                      )}
                    >
                      {metric.value.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      metric.status === "excellent"
                        ? "bg-green-500"
                        : metric.status === "good"
                          ? "bg-blue-500"
                          : metric.status === "warning"
                            ? "bg-orange-500"
                            : "bg-red-500",
                    )}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 数据统计概览 */}
        <div>
          <h4 className="text-lg font-semibold text-slate-800 mb-4">
            数据统计概览
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  总记录数
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {totalRecords.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  有效记录
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {validRecords.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  无效记录
                </span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {invalidRecords.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  错误总数
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {errorStats.totalErrors.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 改进建议 */}
        {overallScore < 90 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800 mb-2">
                  数据质量改进建议
                </h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {qualityMetrics
                    .filter(
                      (metric) =>
                        metric.status === "warning" || metric.status === "poor",
                    )
                    .map((metric, index) => (
                      <li key={index}>
                        • 关注 {metric.name}：当前 {metric.value.toFixed(1)}
                        %，建议提升至 90% 以上
                      </li>
                    ))}
                  {errorStats.severityStats.error > 0 && (
                    <li>
                      • 优先处理 {errorStats.severityStats.error} 个严重错误
                    </li>
                  )}
                  {Object.keys(errorStats.fieldErrors).length > 5 && (
                    <li>• 检查数据源质量，减少字段错误数量</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
