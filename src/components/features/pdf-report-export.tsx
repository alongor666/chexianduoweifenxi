"use client";

/**
 * PDF 报告导出组件 (简化按钮版本)
 *
 * 功能描述：
 * - 根据视图模式智能导出不同内容的PDF报告
 * - 单周模式：导出KPI看板 + 静态图表
 * - 多周模式：导出趋势图表
 *
 * PRD位置：2.2.6 数据导出与分享模块 - 分析报告导出（P2）
 */

import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useKPI } from "@/hooks/use-kpi";
import { exportPDFReport, PDFReportConfig } from "@/lib/export/pdf-exporter";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface Props {
  className?: string;
}

export function PDFReportExport({ className }: Props) {
  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);
  const viewMode = useAppStore((state) => state.viewMode);
  const kpis = useKPI();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);

  // 根据视图模式生成配置
  const getReportConfig = (): PDFReportConfig => {
    if (viewMode === "single") {
      return {
        title: "车险业务分析报告 - 单周表现",
        subtitle: `${new Date().toLocaleDateString()} 单周详细分析`,
        author: "",
        includeKPI: true,
        includeCharts: true,
        includeInsights: true,
        chartElements: [
          "kpi-dashboard",
          "structure-bar-chart",
          "distribution-pie-chart",
          "customer-bubble-chart",
          "expense-heatmap",
        ],
      };
    } else {
      return {
        title: "车险业务分析报告 - 周趋势分析",
        subtitle: `${new Date().toLocaleDateString()} 趋势分析`,
        author: "",
        includeKPI: false,
        includeCharts: true,
        includeInsights: true,
        chartElements: ["trend-chart"],
      };
    }
  };

  // 智能洞察示例（实际应从分析引擎获取）
  const sampleInsights = [
    "本周签单保费环比增长12.5%，主要由高新分公司贡献",
    "满期赔付率为64.67%，处于合理区间，同比下降3.2个百分点",
    "费用率为18.3%，建议重点关注达州、资阳两地的费用管控",
    "非营业客车新车业务表现优异，单均保费高且赔付率低",
    "建议加大新能源车业务拓展，该细分市场具有高增长潜力",
  ];

  const handleExport = async () => {
    if (rawData.length === 0) {
      toast({
        title: "无法导出",
        description: "请先上传数据文件",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const config = getReportConfig();
      await exportPDFReport({
        config,
        kpis: kpis || undefined,
        filters,
        insights: config.includeInsights ? sampleInsights : undefined,
      });

      toast({
        title: "导出成功",
        description: `PDF报告已成功生成并下载`,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || rawData.length === 0}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={
        viewMode === "single"
          ? "导出单周分析报告(包含KPI和静态图表)"
          : "导出周趋势分析报告(包含趋势图表)"
      }
    >
      {isExporting ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          导出中...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          导出PDF
        </>
      )}
    </button>
  );
}
