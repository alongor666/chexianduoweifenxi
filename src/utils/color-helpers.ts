/**
 * 颜色映射辅助函数
 * 应用 DRY 原则，统一处理颜色类名的生成逻辑
 */

import { isValidNumber } from "./guards";

/**
 * 阈值配置
 */
export interface ThresholdConfig {
  value: number;
  color: string;
}

/**
 * 基于阈值范围返回颜色
 * @param value 数值
 * @param thresholds 阈值配置数组（从高到低排序）
 * @param defaultColor 默认颜色
 * @returns 颜色类名
 */
export function getColorByThresholds(
  value: number | null | undefined,
  thresholds: ThresholdConfig[],
  defaultColor = "text-slate-500",
): string {
  if (!isValidNumber(value)) {
    return defaultColor;
  }

  // 从高到低遍历阈值
  for (const threshold of thresholds) {
    if (value >= threshold.value) {
      return threshold.color;
    }
  }

  return defaultColor;
}

/**
 * 基于单一阈值判断好坏返回颜色
 * @param value 当前值
 * @param threshold 阈值
 * @param isHigherBetter 是否数值越高越好
 * @param goodColor 好的颜色
 * @param badColor 坏的颜色
 * @param defaultColor 默认颜色
 * @returns 颜色类名
 */
export function getStatusColor(
  value: number | null | undefined,
  threshold: number,
  isHigherBetter = true,
  goodColor = "text-green-600",
  badColor = "text-red-600",
  defaultColor = "text-slate-500",
): string {
  if (!isValidNumber(value)) {
    return defaultColor;
  }

  const isGood = isHigherBetter ? value >= threshold : value <= threshold;
  return isGood ? goodColor : badColor;
}

/**
 * 基于变化方向和好坏判断返回颜色
 * @param absoluteChange 绝对变化值
 * @param isBetter 是否变好
 * @param isWorsened 是否变差
 * @param betterColor 变好颜色
 * @param worsenedColor 变差颜色
 * @param neutralColor 中性颜色
 * @param defaultColor 默认颜色
 * @returns 颜色类名
 */
export function getChangeColor(
  absoluteChange: number | null | undefined,
  isBetter: boolean,
  isWorsened: boolean,
  betterColor = "text-green-600",
  worsenedColor = "text-red-600",
  neutralColor = "text-slate-600",
  defaultColor = "text-slate-500",
): string {
  if (!isValidNumber(absoluteChange)) {
    return defaultColor;
  }

  if (isBetter) return betterColor;
  if (isWorsened) return worsenedColor;
  return neutralColor;
}

/**
 * 满期边际贡献率颜色阈值（预定义）
 */
export const CONTRIBUTION_MARGIN_THRESHOLDS: ThresholdConfig[] = [
  { value: 12, color: "text-green-700" }, // 优秀：深绿
  { value: 8, color: "text-green-600" }, // 良好：浅绿
  { value: 4, color: "text-yellow-600" }, // 一般：黄色
  { value: 0, color: "text-orange-600" }, // 较差：橙色
];

/**
 * 满期边际贡献率背景色阈值（预定义）
 */
export const CONTRIBUTION_MARGIN_BG_THRESHOLDS: ThresholdConfig[] = [
  { value: 12, color: "bg-green-100" }, // 优秀
  { value: 8, color: "bg-green-50" }, // 良好
  { value: 4, color: "bg-yellow-50" }, // 一般
  { value: 0, color: "bg-orange-50" }, // 较差
];

/**
 * 获取满期边际贡献率文本颜色
 * @param ratio 满期边际贡献率（%）
 * @returns 颜色类名
 */
export function getContributionMarginColor(
  ratio: number | null | undefined,
): string {
  return getColorByThresholds(
    ratio,
    CONTRIBUTION_MARGIN_THRESHOLDS,
    "text-slate-500",
  );
}

/**
 * 获取满期边际贡献率背景颜色
 * @param ratio 满期边际贡献率（%）
 * @returns 背景颜色类名
 */
export function getContributionMarginBgColor(
  ratio: number | null | undefined,
): string {
  // 负值特殊处理
  if (isValidNumber(ratio) && ratio < 0) {
    return "bg-red-50";
  }

  return getColorByThresholds(
    ratio,
    CONTRIBUTION_MARGIN_BG_THRESHOLDS,
    "bg-slate-100",
  );
}
