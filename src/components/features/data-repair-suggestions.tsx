"use client";

import React, { useMemo } from "react";
import {
  Wrench,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Copy,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataRepairSuggestionsProps {
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
  totalRecords: number;
}

interface RepairSuggestion {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "data_source" | "format" | "validation" | "process";
  impact: string;
  steps: string[];
  examples?: string[];
  relatedFields?: string[];
}

/**
 * 数据修复建议组件
 * 基于错误分析提供具体的修复建议和操作指导
 */
export function DataRepairSuggestions({
  errorStats,
  totalRecords,
}: DataRepairSuggestionsProps) {
  /**
   * 生成修复建议
   */
  const repairSuggestions = useMemo((): RepairSuggestion[] => {
    const suggestions: RepairSuggestion[] = [];

    // 分析错误类型并生成对应建议
    Object.entries(errorStats.errorTypes).forEach(([errorType, count]) => {
      const errorRate = (count / totalRecords) * 100;

      if (errorType === "必填字段缺失" && count > 0) {
        suggestions.push({
          id: "missing-required-fields",
          title: "修复必填字段缺失问题",
          description: `发现 ${count} 个必填字段缺失错误，占总记录的 ${errorRate.toFixed(1)}%`,
          priority: "high",
          category: "data_source",
          impact: "提升数据完整性，确保关键信息不丢失",
          steps: [
            "检查数据源系统，确保必填字段在导出时包含数据",
            "设置数据验证规则，在源头防止空值产生",
            "对于历史数据，可以设置合理的默认值或标记为待补充",
            "建立数据质量监控，及时发现缺失字段问题",
          ],
          examples: [
            "保单号不能为空 → 检查保单生成流程",
            "投保人姓名缺失 → 完善客户信息录入",
          ],
        });
      }

      if (errorType === "格式错误" && count > 0) {
        suggestions.push({
          id: "format-errors",
          title: "统一数据格式规范",
          description: `发现 ${count} 个格式错误，占总记录的 ${errorRate.toFixed(1)}%`,
          priority: "high",
          category: "format",
          impact: "提高数据一致性，减少处理错误",
          steps: [
            "制定统一的数据格式标准文档",
            "在数据录入界面添加格式验证",
            "使用数据清洗工具批量修正格式问题",
            "培训数据录入人员，确保格式规范",
          ],
          examples: [
            "日期格式：统一使用 YYYY-MM-DD",
            "电话号码：统一使用 11 位手机号格式",
            "金额格式：统一保留两位小数",
          ],
        });
      }

      if (errorType === "数值类型错误" && count > 0) {
        suggestions.push({
          id: "numeric-type-errors",
          title: "修正数值类型问题",
          description: `发现 ${count} 个数值类型错误，占总记录的 ${errorRate.toFixed(1)}%`,
          priority: "medium",
          category: "validation",
          impact: "确保数值计算准确性",
          steps: [
            "检查数据源中的数值字段定义",
            "清理非数值字符（如货币符号、千分位符号）",
            "设置数值范围验证规则",
            "对异常数值进行人工审核",
          ],
          examples: [
            "保费金额包含货币符号 → 移除 ¥ 符号",
            "年龄字段包含文字 → 提取纯数字",
          ],
        });
      }

      if (errorType === "枚举值错误" && count > 0) {
        suggestions.push({
          id: "enum-value-errors",
          title: "规范枚举值选项",
          description: `发现 ${count} 个枚举值错误，占总记录的 ${errorRate.toFixed(1)}%`,
          priority: "medium",
          category: "validation",
          impact: "确保分类统计准确性",
          steps: [
            "建立标准的枚举值字典",
            "在录入界面使用下拉选择而非手工输入",
            "建立枚举值映射表，处理历史数据",
            "定期审查和更新枚举值列表",
          ],
          examples: [
            '性别字段：统一使用"男"、"女"',
            "车辆类型：建立标准分类体系",
          ],
        });
      }

      if (errorType === "日期时间错误" && count > 0) {
        suggestions.push({
          id: "datetime-errors",
          title: "标准化日期时间格式",
          description: `发现 ${count} 个日期时间错误，占总记录的 ${errorRate.toFixed(1)}%`,
          priority: "medium",
          category: "format",
          impact: "确保时间序列分析准确性",
          steps: [
            "统一日期时间格式标准",
            "验证日期的合理性（如生效日期不能早于投保日期）",
            "处理时区问题，确保时间一致性",
            "建立日期范围验证规则",
          ],
          examples: [
            "统一使用 ISO 8601 格式：2024-01-15",
            "验证保单生效日期的合理性",
          ],
        });
      }
    });

    // 基于字段错误生成建议
    const fieldErrorCount = Object.keys(errorStats.fieldErrors).length;
    if (fieldErrorCount > 5) {
      suggestions.push({
        id: "multiple-field-errors",
        title: "优化数据源质量",
        description: `${fieldErrorCount} 个字段存在错误，建议从源头改善数据质量`,
        priority: "high",
        category: "data_source",
        impact: "全面提升数据质量，减少后续处理成本",
        steps: [
          "分析数据源系统的数据质量问题",
          "建立数据质量评估体系",
          "在数据产生环节增加验证规则",
          "定期进行数据质量审计",
        ],
        relatedFields: Object.keys(errorStats.fieldErrors).slice(0, 5),
      });
    }

    // 基于错误严重程度生成建议
    if (errorStats.severityStats.error > totalRecords * 0.1) {
      suggestions.push({
        id: "high-error-rate",
        title: "紧急处理严重错误",
        description: `严重错误率过高（${((errorStats.severityStats.error / totalRecords) * 100).toFixed(1)}%），需要立即处理`,
        priority: "high",
        category: "process",
        impact: "避免错误数据影响业务决策",
        steps: [
          "暂停使用有严重错误的数据",
          "建立错误数据隔离机制",
          "优先修复影响业务的关键错误",
          "建立数据质量监控告警",
        ],
      });
    }

    // 通用改进建议
    if (suggestions.length > 0) {
      suggestions.push({
        id: "general-improvements",
        title: "建立数据质量管理体系",
        description: "从流程和制度层面提升数据质量",
        priority: "low",
        category: "process",
        impact: "长期保障数据质量稳定性",
        steps: [
          "制定数据质量标准和规范",
          "建立数据质量监控仪表板",
          "定期进行数据质量培训",
          "建立数据质量问题反馈机制",
          "设立数据质量责任人制度",
        ],
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [errorStats, totalRecords]);

  /**
   * 复制建议内容
   */
  const copySuggestion = (suggestion: RepairSuggestion) => {
    const content = [
      `# ${suggestion.title}`,
      "",
      `**描述：** ${suggestion.description}`,
      `**影响：** ${suggestion.impact}`,
      "",
      "**修复步骤：**",
      ...suggestion.steps.map((step, index) => `${index + 1}. ${step}`),
      "",
      ...(suggestion.examples
        ? [
            "**示例：**",
            ...suggestion.examples.map((example) => `- ${example}`),
            "",
          ]
        : []),
      ...(suggestion.relatedFields
        ? ["**相关字段：**", suggestion.relatedFields.join(", "), ""]
        : []),
    ].join("\n");

    navigator.clipboard.writeText(content);
  };

  const getPriorityColor = (priority: RepairSuggestion["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getCategoryIcon = (category: RepairSuggestion["category"]) => {
    switch (category) {
      case "data_source":
        return <Target className="w-4 h-4" />;
      case "format":
        return <Wrench className="w-4 h-4" />;
      case "validation":
        return <CheckCircle className="w-4 h-4" />;
      case "process":
        return <Zap className="w-4 h-4" />;
    }
  };

  if (repairSuggestions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              数据质量良好
            </h3>
            <p className="text-green-700">
              当前数据质量较高，无需特殊修复措施。建议继续保持现有的数据管理流程。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              数据修复建议
            </h3>
            <p className="text-sm text-slate-600">
              基于错误分析生成的具体修复指导
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {repairSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">
                        {suggestion.title}
                      </h4>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded border",
                          getPriorityColor(suggestion.priority),
                        )}
                      >
                        {suggestion.priority === "high"
                          ? "高优先级"
                          : suggestion.priority === "medium"
                            ? "中优先级"
                            : "低优先级"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ArrowRight className="w-3 h-3" />
                      <span>{suggestion.impact}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copySuggestion(suggestion)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors"
                  title="复制建议内容"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
              </div>
            </div>

            <div className="p-4">
              <h5 className="font-medium text-slate-800 mb-3">修复步骤</h5>
              <ol className="space-y-2">
                {suggestion.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex items-center justify-center mt-0.5">
                      {stepIndex + 1}
                    </span>
                    <span className="text-sm text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>

              {suggestion.examples && (
                <div className="mt-4">
                  <h6 className="font-medium text-slate-800 mb-2">示例</h6>
                  <div className="space-y-1">
                    {suggestion.examples.map((example, exampleIndex) => (
                      <div
                        key={exampleIndex}
                        className="text-sm text-slate-600 bg-slate-50 p-2 rounded"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.relatedFields && (
                <div className="mt-4">
                  <h6 className="font-medium text-slate-800 mb-2">相关字段</h6>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.relatedFields.map((field, fieldIndex) => (
                      <span
                        key={fieldIndex}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 额外资源 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800 mb-2">相关资源</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 数据质量管理最佳实践指南</li>
                <li>• 保险行业数据标准规范</li>
                <li>• 数据清洗工具使用手册</li>
                <li>• 数据验证规则配置说明</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
