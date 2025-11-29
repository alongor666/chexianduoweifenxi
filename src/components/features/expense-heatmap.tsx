"use client";

/**
 * 费用结构热力图 (P2功能)
 *
 * 功能描述：
 * - 行：三级机构（third_level_organization）
 * - 列：费用类型（费用率、单均费用等维度）
 * - 颜色深浅：费用率高低
 * - 快速识别费用管控的薄弱环节
 *
 * PRD位置：2.2.5 结构分析与对比模块 - 费用结构热力图（P1）
 */

import { useMemo } from "react";
import { useFilteredData } from "@/hooks/use-filtered-data";
import { InsuranceRecord } from "@/types/insurance";
import { formatPercent, formatCurrency, formatNumber } from "@/utils/format";

interface HeatmapCell {
  organization: string;
  metric: string;
  value: number;
  displayValue: string;
  color: string;
  level: "excellent" | "good" | "warning" | "danger";
}

interface OrganizationMetrics {
  organization: string;
  expenseRatio: number; // 费用率 (%)
  averageExpense: number; // 单均费用 (元)
  expenseAmount: number; // 费用金额 (万元)
  totalPremium: number; // 签单保费 (万元)
}

interface Props {
  className?: string;
}

// 根据费用率获取颜色和等级
function getColorByExpenseRatio(ratio: number): {
  color: string;
  level: HeatmapCell["level"];
} {
  if (ratio <= 15) return { color: "#10b981", level: "excellent" }; // 绿色 - 优秀
  if (ratio <= 20) return { color: "#3b82f6", level: "good" }; // 蓝色 - 良好
  if (ratio <= 25) return { color: "#f59e0b", level: "warning" }; // 橙色 - 警告
  return { color: "#ef4444", level: "danger" }; // 红色 - 危险
}

// 根据单均费用获取颜色和等级
function getColorByAverageExpense(expense: number): {
  color: string;
  level: HeatmapCell["level"];
} {
  if (expense <= 300) return { color: "#10b981", level: "excellent" };
  if (expense <= 500) return { color: "#3b82f6", level: "good" };
  if (expense <= 700) return { color: "#f59e0b", level: "warning" };
  return { color: "#ef4444", level: "danger" };
}

export function ExpenseHeatmap({ className }: Props) {
  const filteredData = useFilteredData();

  // 计算每个机构的费用指标
  const organizationMetrics = useMemo(() => {
    if (filteredData.length === 0) return [];

    const orgMap = new Map<string, InsuranceRecord[]>();

    // 按机构分组
    filteredData.forEach((record) => {
      const org = record.third_level_organization;
      if (!orgMap.has(org)) {
        orgMap.set(org, []);
      }
      orgMap.get(org)!.push(record);
    });

    // 计算每个机构的指标
    const metrics: OrganizationMetrics[] = [];

    orgMap.forEach((records, org) => {
      const totalExpense = records.reduce(
        (sum, r) => sum + r.expense_amount_yuan,
        0,
      );
      const totalPremium = records.reduce(
        (sum, r) => sum + r.signed_premium_yuan,
        0,
      );
      const totalPolicyCount = records.reduce(
        (sum, r) => sum + r.policy_count,
        0,
      );

      const expenseRatio =
        totalPremium > 0 ? (totalExpense / totalPremium) * 100 : 0;
      const averageExpense =
        totalPolicyCount > 0 ? Math.round(totalExpense / totalPolicyCount) : 0;

      metrics.push({
        organization: org,
        expenseRatio,
        averageExpense,
        expenseAmount: Math.round(totalExpense / 10000), // 转万元
        totalPremium: Math.round(totalPremium / 10000), // 转万元
      });
    });

    // 按费用率降序排序，突出问题机构
    return metrics.sort((a, b) => b.expenseRatio - a.expenseRatio);
  }, [filteredData]);

  // 转换为热力图数据格式
  const heatmapData = useMemo(() => {
    const cells: HeatmapCell[] = [];

    organizationMetrics.forEach((org) => {
      // 费用率
      const expenseRatioColor = getColorByExpenseRatio(org.expenseRatio);
      cells.push({
        organization: org.organization,
        metric: "费用率",
        value: org.expenseRatio,
        displayValue: formatPercent(org.expenseRatio / 100),
        color: expenseRatioColor.color,
        level: expenseRatioColor.level,
      });

      // 单均费用
      const avgExpenseColor = getColorByAverageExpense(org.averageExpense);
      cells.push({
        organization: org.organization,
        metric: "单均费用",
        value: org.averageExpense,
        displayValue: `${formatNumber(org.averageExpense)} 元`,
        color: avgExpenseColor.color,
        level: avgExpenseColor.level,
      });

      // 费用金额（使用相对值着色）
      const maxExpense = organizationMetrics.reduce(
        (max, m) => Math.max(max, m.expenseAmount),
        0,
      );
      const expenseRatioRelative = (org.expenseAmount / maxExpense) * 100;
      const expenseAmountColor = getColorByExpenseRatio(
        expenseRatioRelative * 0.3,
      ); // 缩放到合理范围
      cells.push({
        organization: org.organization,
        metric: "费用金额",
        value: org.expenseAmount,
        displayValue: formatCurrency(org.expenseAmount),
        color: expenseAmountColor.color,
        level: expenseAmountColor.level,
      });
    });

    return cells;
  }, [organizationMetrics]);

  // 指标列表
  const metrics = ["费用率", "单均费用", "费用金额"];

  // 获取指定机构和指标的单元格
  const getCell = (org: string, metric: string): HeatmapCell | undefined => {
    return heatmapData.find(
      (cell) => cell.organization === org && cell.metric === metric,
    );
  };

  // 统计分析
  const analysis = useMemo(() => {
    if (organizationMetrics.length === 0) return null;

    const avgExpenseRatio =
      organizationMetrics.reduce((sum, m) => sum + m.expenseRatio, 0) /
      organizationMetrics.length;
    const maxExpenseRatioOrg = organizationMetrics.reduce((max, m) =>
      m.expenseRatio > max.expenseRatio ? m : max,
    );
    const minExpenseRatioOrg = organizationMetrics.reduce((min, m) =>
      m.expenseRatio < min.expenseRatio ? m : min,
    );

    const dangerOrgs = organizationMetrics.filter((m) => m.expenseRatio > 25);
    const excellentOrgs = organizationMetrics.filter(
      (m) => m.expenseRatio <= 15,
    );

    return {
      avgExpenseRatio,
      maxExpenseRatioOrg,
      minExpenseRatioOrg,
      dangerOrgs,
      excellentOrgs,
    };
  }, [organizationMetrics]);

  if (filteredData.length === 0) {
    return (
      <div className={`bg-white rounded-lg border p-8 ${className}`}>
        <div className="text-center text-gray-500">
          暂无数据，请先上传数据文件
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">费用结构热力图</h3>
        <p className="text-sm text-gray-500 mt-1">
          行：三级机构 | 列：费用指标 | 颜色：费用水平（绿色优秀，红色警告）
        </p>
      </div>

      {/* 热力图 */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 z-10">
                机构
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric}
                  className="border bg-gray-50 px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]"
                >
                  {metric}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organizationMetrics.map((org, idx) => (
              <tr
                key={org.organization}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="border px-4 py-3 font-medium text-gray-900 sticky left-0 z-10 bg-inherit">
                  {org.organization}
                </td>
                {metrics.map((metric) => {
                  const cell = getCell(org.organization, metric);
                  if (!cell) return <td key={metric} className="border"></td>;

                  return (
                    <td
                      key={metric}
                      className="border px-4 py-3 text-center transition-all hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: cell.color + "20", // 20% opacity
                        borderLeftColor: cell.color,
                        borderLeftWidth: "4px",
                      }}
                      title={`${org.organization} - ${metric}: ${cell.displayValue}`}
                    >
                      <div
                        className="font-semibold"
                        style={{ color: cell.color }}
                      >
                        {cell.displayValue}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {cell.level === "excellent" && "✓ 优秀"}
                        {cell.level === "good" && "○ 良好"}
                        {cell.level === "warning" && "△ 警告"}
                        {cell.level === "danger" && "✕ 危险"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 智能洞察 */}
      {analysis && (
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900 mb-2">📊 智能洞察</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 整体水平 */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600 mb-1">平均费用率</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(analysis.avgExpenseRatio / 100)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis.avgExpenseRatio <= 20
                  ? "✓ 整体控制良好"
                  : "△ 需加强管控"}
              </div>
            </div>

            {/* 最佳机构 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-800 mb-1">💎 费用管控最佳</div>
              <div className="text-lg font-bold text-green-900">
                {analysis.minExpenseRatioOrg.organization}
              </div>
              <div className="text-sm text-green-700">
                费用率{" "}
                {formatPercent(analysis.minExpenseRatioOrg.expenseRatio / 100)}
              </div>
            </div>

            {/* 需改进机构 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-800 mb-1">⚠️ 需重点关注</div>
              <div className="text-lg font-bold text-red-900">
                {analysis.maxExpenseRatioOrg.organization}
              </div>
              <div className="text-sm text-red-700">
                费用率{" "}
                {formatPercent(analysis.maxExpenseRatioOrg.expenseRatio / 100)}
              </div>
            </div>
          </div>

          {/* 危险机构列表 */}
          {analysis.dangerOrgs.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-900 mb-2">
                🚨 高费用率机构（超过25%）：
              </div>
              <div className="text-sm text-red-800">
                {analysis.dangerOrgs
                  .map(
                    (org) =>
                      `${org.organization}(${formatPercent(org.expenseRatio / 100)})`,
                  )
                  .join("、")}
              </div>
              <div className="text-xs text-red-700 mt-2">
                建议：加强费用管控，优化费用结构，对标优秀机构
              </div>
            </div>
          )}

          {/* 优秀机构列表 */}
          {analysis.excellentOrgs.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-900 mb-2">
                ✓ 费用管控优秀机构（低于15%）：
              </div>
              <div className="text-sm text-green-800">
                {analysis.excellentOrgs
                  .map(
                    (org) =>
                      `${org.organization}(${formatPercent(org.expenseRatio / 100)})`,
                  )
                  .join("、")}
              </div>
              <div className="text-xs text-green-700 mt-2">
                可提炼最佳实践，在其他机构推广
              </div>
            </div>
          )}

          {/* 图例 */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="font-medium text-gray-700">颜色图例：</div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#10b981" }}
              ></div>
              <span className="text-gray-600">优秀 (≤15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#3b82f6" }}
              ></div>
              <span className="text-gray-600">良好 (15-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#f59e0b" }}
              ></div>
              <span className="text-gray-600">警告 (20-25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#ef4444" }}
              ></div>
              <span className="text-gray-600">危险 (&gt;25%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
