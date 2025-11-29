/**
 * 多维雷达图评分转换工具
 * 将各业务指标的实际值转换为 0-100 的标准化评分
 *
 * 评分等级定义：
 * - 卓越/优秀：95-100 分
 * - 健康/良好：86-94 分
 * - 中等：70-85 分
 * - 预警/一般/较差：20-69 分
 * - 危险/高危/严重：0-20 分
 */

export interface RadarScoreResult {
  /** 标准化评分（0-100） */
  score: number;
  /** 原始数值 */
  rawValue: number;
  /** 评级等级 */
  level: "excellent" | "good" | "medium" | "warning" | "danger";
  /** 等级标签 */
  label: string;
  /** 色彩方案 */
  color: string;
}

/**
 * 满期边际贡献率评分转换（越大越好）
 *
 * 阈值规则：
 * - 优秀（>12%）：95-100分
 * - 良好（8-12%）：86-94分
 * - 中等（6-8%）：70-85分
 * - 一般（4-6%）：40-69分
 * - 较差（0-4%）：20-39分
 * - 严重（<0%）：0-19分
 */
export function convertContributionMarginToScore(
  ratio: number | null | undefined,
): RadarScoreResult | null {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return null;
  }

  let score: number;
  let level: RadarScoreResult["level"];
  let label: string;
  let color: string;

  if (ratio > 12) {
    // 优秀：95-100分，线性映射 12%-20% -> 95-100
    score = Math.min(100, 95 + ((ratio - 12) / 8) * 5);
    level = "excellent";
    label = "优秀";
    color = "#2E7D32";
  } else if (ratio >= 8) {
    // 良好：86-94分，线性映射 8%-12% -> 86-94
    score = 86 + ((ratio - 8) / 4) * 8;
    level = "good";
    label = "良好";
    color = "#4CAF50";
  } else if (ratio >= 6) {
    // 中等：70-85分，线性映射 6%-8% -> 70-85
    score = 70 + ((ratio - 6) / 2) * 15;
    level = "medium";
    label = "中等";
    color = "#1976D2";
  } else if (ratio >= 4) {
    // 一般：40-69分，线性映射 4%-6% -> 40-69
    score = 40 + ((ratio - 4) / 2) * 29;
    level = "warning";
    label = "一般";
    color = "#FBC02D";
  } else if (ratio >= 0) {
    // 较差：20-39分，线性映射 0%-4% -> 20-39
    score = 20 + (ratio / 4) * 19;
    level = "warning";
    label = "较差";
    color = "#F57C00";
  } else {
    // 严重：0-19分，线性映射 -5%-0% -> 0-19
    score = Math.max(0, 20 + (ratio / 5) * 20);
    level = "danger";
    label = "严重";
    color = "#D32F2F";
  }

  return {
    score: Math.round(score * 10) / 10,
    rawValue: ratio,
    level,
    label,
    color,
  };
}

/**
 * 时间进度达成率评分转换（越接近100%越好，超前也是好的）
 *
 * 阈值规则：
 * - 卓越（≥110%）：95-100分
 * - 健康（100-110%）：86-94分
 * - 预警（90-100%）：70-85分
 * - 危险（80-90%）：40-69分
 * - 高危（<80%）：0-39分
 */
export function convertTimeProgressToScore(
  rate: number | null | undefined,
): RadarScoreResult | null {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return null;
  }

  let score: number;
  let level: RadarScoreResult["level"];
  let label: string;
  let color: string;

  if (rate >= 110) {
    // 卓越：95-100分，线性映射 110%-120% -> 95-100
    score = Math.min(100, 95 + ((rate - 110) / 10) * 5);
    level = "excellent";
    label = "卓越";
    color = "#2E7D32";
  } else if (rate >= 100) {
    // 健康：86-94分，线性映射 100%-110% -> 86-94
    score = 86 + ((rate - 100) / 10) * 8;
    level = "good";
    label = "健康";
    color = "#4CAF50";
  } else if (rate >= 90) {
    // 预警：70-85分，线性映射 90%-100% -> 70-85
    score = 70 + ((rate - 90) / 10) * 15;
    level = "medium";
    label = "预警";
    color = "#FBC02D";
  } else if (rate >= 80) {
    // 危险：40-69分，线性映射 80%-90% -> 40-69
    score = 40 + ((rate - 80) / 10) * 29;
    level = "warning";
    label = "危险";
    color = "#F57C00";
  } else {
    // 高危：0-39分，线性映射 50%-80% -> 0-39
    score = Math.max(0, ((rate - 50) / 30) * 39);
    level = "danger";
    label = "高危";
    color = "#D32F2F";
  }

  return {
    score: Math.round(score * 10) / 10,
    rawValue: rate,
    level,
    label,
    color,
  };
}

/**
 * 满期赔付率评分转换（越小越好）
 *
 * 阈值规则：
 * - 优秀（<50%）：95-100分
 * - 良好（50-60%）：86-94分
 * - 中等（60-70%）：70-85分
 * - 预警（70-80%）：40-69分
 * - 高危（>80%）：0-39分
 */
export function convertLossRatioToScore(
  ratio: number | null | undefined,
): RadarScoreResult | null {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return null;
  }

  let score: number;
  let level: RadarScoreResult["level"];
  let label: string;
  let color: string;

  if (ratio < 50) {
    // 优秀：95-100分，线性映射 0%-50% -> 100-95（反向）
    score = 100 - (ratio / 50) * 5;
    level = "excellent";
    label = "优秀";
    color = "#2E7D32";
  } else if (ratio < 60) {
    // 良好：86-94分，线性映射 50%-60% -> 94-86（反向）
    score = 94 - ((ratio - 50) / 10) * 8;
    level = "good";
    label = "良好";
    color = "#4CAF50";
  } else if (ratio < 70) {
    // 中等：70-85分，线性映射 60%-70% -> 85-70（反向）
    score = 85 - ((ratio - 60) / 10) * 15;
    level = "medium";
    label = "中等";
    color = "#1976D2";
  } else if (ratio < 80) {
    // 预警：40-69分，线性映射 70%-80% -> 69-40（反向）
    score = 69 - ((ratio - 70) / 10) * 29;
    level = "warning";
    label = "预警";
    color = "#FBC02D";
  } else {
    // 高危：0-39分，线性映射 80%-120% -> 39-0（反向）
    score = Math.max(0, 39 - ((ratio - 80) / 40) * 39);
    level = "danger";
    label = "高危";
    color = "#D32F2F";
  }

  return {
    score: Math.round(score * 10) / 10,
    rawValue: ratio,
    level,
    label,
    color,
  };
}

/**
 * 费用率评分转换（越小越好）
 *
 * 阈值规则：
 * - 优秀（0-7.5%）：95-100分
 * - 良好（7.6-12.5%）：86-94分
 * - 中等（12.6-17.5%）：70-85分
 * - 一般（17.6-22.5%）：40-69分
 * - 较差（>22.5%）：0-39分
 */
export function convertExpenseRatioToScore(
  ratio: number | null | undefined,
): RadarScoreResult | null {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return null;
  }

  let score: number;
  let level: RadarScoreResult["level"];
  let label: string;
  let color: string;

  if (ratio <= 7.5) {
    // 优秀：95-100分，线性映射 0%-7.5% -> 100-95（反向）
    score = 100 - (ratio / 7.5) * 5;
    level = "excellent";
    label = "优秀";
    color = "#2E7D32";
  } else if (ratio <= 12.5) {
    // 良好：86-94分，线性映射 7.6%-12.5% -> 94-86（反向）
    score = 94 - ((ratio - 7.5) / 5) * 8;
    level = "good";
    label = "良好";
    color = "#4CAF50";
  } else if (ratio <= 17.5) {
    // 中等：70-85分，线性映射 12.6%-17.5% -> 85-70（反向）
    score = 85 - ((ratio - 12.5) / 5) * 15;
    level = "medium";
    label = "中等";
    color = "#1976D2";
  } else if (ratio <= 22.5) {
    // 一般：40-69分，线性映射 17.6%-22.5% -> 69-40（反向）
    score = 69 - ((ratio - 17.5) / 5) * 29;
    level = "warning";
    label = "一般";
    color = "#FBC02D";
  } else {
    // 较差：0-39分，线性映射 22.5%-35% -> 39-0（反向）
    score = Math.max(0, 39 - ((ratio - 22.5) / 12.5) * 39);
    level = "danger";
    label = "较差";
    color = "#D32F2F";
  }

  return {
    score: Math.round(score * 10) / 10,
    rawValue: ratio,
    level,
    label,
    color,
  };
}

/**
 * 满期出险率评分转换（越小越好）
 *
 * 阈值规则：
 * - 优秀（<15%）：95-100分
 * - 良好（15-25%）：86-94分
 * - 中等（25-35%）：70-85分
 * - 预警（35-50%）：40-69分
 * - 高危（>50%）：0-39分
 */
export function convertClaimFrequencyToScore(
  ratio: number | null | undefined,
): RadarScoreResult | null {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return null;
  }

  let score: number;
  let level: RadarScoreResult["level"];
  let label: string;
  let color: string;

  if (ratio < 15) {
    // 优秀：95-100分，线性映射 0%-15% -> 100-95（反向）
    score = 100 - (ratio / 15) * 5;
    level = "excellent";
    label = "优秀";
    color = "#2E7D32";
  } else if (ratio < 25) {
    // 良好：86-94分，线性映射 15%-25% -> 94-86（反向）
    score = 94 - ((ratio - 15) / 10) * 8;
    level = "good";
    label = "良好";
    color = "#4CAF50";
  } else if (ratio < 35) {
    // 中等：70-85分，线性映射 25%-35% -> 85-70（反向）
    score = 85 - ((ratio - 25) / 10) * 15;
    level = "medium";
    label = "中等";
    color = "#1976D2";
  } else if (ratio < 50) {
    // 预警：40-69分，线性映射 35%-50% -> 69-40（反向）
    score = 69 - ((ratio - 35) / 15) * 29;
    level = "warning";
    label = "预警";
    color = "#FBC02D";
  } else {
    // 高危：0-39分，线性映射 50%-80% -> 39-0（反向）
    score = Math.max(0, 39 - ((ratio - 50) / 30) * 39);
    level = "danger";
    label = "高危";
    color = "#D32F2F";
  }

  return {
    score: Math.round(score * 10) / 10,
    rawValue: ratio,
    level,
    label,
    color,
  };
}

/**
 * 维度定义
 */
export interface RadarDimension {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  unit: string;
  converter: (value: number | null | undefined) => RadarScoreResult | null;
}

/**
 * 五大维度配置
 */
export const RADAR_DIMENSIONS: RadarDimension[] = [
  {
    key: "contribution_margin_ratio",
    label: "满期边际贡献率",
    shortLabel: "边贡率",
    description: "反映业务盈利能力的核心指标",
    unit: "%",
    converter: convertContributionMarginToScore,
  },
  {
    key: "premium_time_progress_achievement_rate",
    label: "时间进度达成率",
    shortLabel: "进度达成",
    description: "保费目标完成进度与时间进度的匹配度",
    unit: "%",
    converter: convertTimeProgressToScore,
  },
  {
    key: "loss_ratio",
    label: "满期赔付率",
    shortLabel: "赔付率",
    description: "赔款支出占保费收入的比例",
    unit: "%",
    converter: convertLossRatioToScore,
  },
  {
    key: "matured_claim_ratio",
    label: "满期出险率",
    shortLabel: "出险率",
    description: "出险保单占总保单的比例",
    unit: "%",
    converter: convertClaimFrequencyToScore,
  },
  {
    key: "expense_ratio",
    label: "费用率",
    shortLabel: "费用率",
    description: "费用支出占保费收入的比例",
    unit: "%",
    converter: convertExpenseRatioToScore,
  },
];

/**
 * 批量转换 KPI 数据为雷达图评分
 */
export function convertKPIToRadarScores(
  kpiData: any,
): Map<string, RadarScoreResult | null> {
  const scores = new Map<string, RadarScoreResult | null>();

  RADAR_DIMENSIONS.forEach((dim) => {
    const rawValue = kpiData?.[dim.key];
    const scoreResult = dim.converter(rawValue);
    scores.set(dim.key, scoreResult);
  });

  return scores;
}
