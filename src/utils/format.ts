/**
 * 数值格式化工具函数
 * 应用 DRY 原则，使用统一的类型守卫
 */

import { isValidNumber, safeDisplayNumber } from "./guards";
import {
  getContributionMarginColor,
  getContributionMarginBgColor,
  getStatusColor,
} from "./color-helpers";

/**
 * 格式化数字为千分位格式
 * @param value 数值
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (!isValidNumber(value)) {
    return "-";
  }

  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化百分比
 * @param value 数值（0-100）
 * @param decimals 小数位数（默认2）
 * @returns 格式化后的字符串（带%符号）
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (!isValidNumber(value)) {
    return "-";
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化金额（万元）
 * @param value 金额（万元）
 * @param decimals 小数位数（默认0）
 * @returns 格式化后的字符串（带"万元"单位）
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (!isValidNumber(value)) {
    return "-";
  }

  return `${formatNumber(value, decimals)} 万元`;
}

/**
 * 格式化整数
 * @param value 数值
 * @returns 格式化后的字符串（千分位）
 */
export function formatInteger(value: number | null | undefined): string {
  return formatNumber(value, 0);
}

/**
 * 格式化小数
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatDecimal(
  value: number | null | undefined,
  decimals = 3,
): string {
  return formatNumber(value, decimals);
}

/**
 * 格式化变化值（带正负号和颜色）
 * @param value 变化值
 * @param isPercentage 是否为百分比
 * @returns { text: string, color: string, direction: 'up' | 'down' | 'flat' }
 */
export function formatChange(
  value: number | null | undefined,
  isPercentage = false,
): {
  text: string;
  color: string;
  direction: "up" | "down" | "flat";
} {
  if (!isValidNumber(value)) {
    return { text: "-", color: "text-slate-500", direction: "flat" };
  }

  const absValue = Math.abs(value);
  const integerValue = Math.round(absValue);
  const formattedValue = isPercentage
    ? `${absValue.toFixed(2)}%`
    : formatNumber(integerValue, 0);

  if (value > 0) {
    return {
      text: `+${formattedValue}`,
      color: "text-green-600",
      direction: "up",
    };
  } else if (value < 0) {
    return {
      text: `-${formattedValue}`,
      color: "text-red-600",
      direction: "down",
    };
  } else {
    return {
      text: formattedValue,
      color: "text-slate-500",
      direction: "flat",
    };
  }
}

// 重新导出颜色工具函数（向后兼容）
export {
  getContributionMarginColor,
  getContributionMarginBgColor,
} from "./color-helpers";

/**
 * 获取 KPI 状态颜色（通用）
 * @param value 当前值
 * @param threshold 阈值
 * @param isHigherBetter 是否数值越高越好
 * @returns 颜色类名
 */
export function getKPIStatusColor(
  value: number | null | undefined,
  threshold: number,
  isHigherBetter = true,
): string {
  return getStatusColor(value, threshold, isHigherBetter);
}
