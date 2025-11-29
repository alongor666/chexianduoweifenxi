/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-06: 高级趋势分析](./../../../开发文档/01_features/FEAT-P1-06_advanced-trend-analysis.md)
 *
 * 异常检测算法
 * 支持多种统计方法检测数据异常点
 */

export interface AnomalyPoint {
  /**
   * 数据点索引
   */
  index: number;

  /**
   * 原始值
   */
  value: number;

  /**
   * 异常分数（越高越异常）
   */
  score: number;

  /**
   * 异常类型
   */
  type: "high" | "low";

  /**
   * 检测方法
   */
  method: "zscore" | "iqr" | "mad";
}

export interface AnomalyDetectionOptions {
  /**
   * 检测方法
   * - zscore: Z分数法（适用于正态分布）
   * - iqr: 四分位距法（适用于有偏分布）
   * - mad: 中位数绝对偏差法（对极值更鲁棒）
   */
  method?: "zscore" | "iqr" | "mad";

  /**
   * 敏感度阈值
   * - zscore: 默认3（3倍标准差）
   * - iqr: 默认1.5（1.5倍IQR）
   * - mad: 默认3（3倍MAD）
   */
  threshold?: number;

  /**
   * 最小数据点数量（少于此数量不进行检测）
   */
  minDataPoints?: number;
}

/**
 * 计算基础统计量
 */
function calculateStats(data: number[]) {
  const n = data.length;
  if (n === 0) {
    return { mean: 0, median: 0, stdDev: 0, q1: 0, q3: 0, iqr: 0, mad: 0 };
  }

  // 均值
  const mean = data.reduce((sum, val) => sum + val, 0) / n;

  // 标准差
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // 中位数和四分位数
  const sorted = [...data].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // MAD (Median Absolute Deviation)
  const absDeviations = data.map((val) => Math.abs(val - median));
  const mad = absDeviations.sort((a, b) => a - b)[
    Math.floor(absDeviations.length / 2)
  ];

  return { mean, median, stdDev, q1, q3, iqr, mad };
}

/**
 * Z-Score 方法检测异常
 */
function detectByZScore(data: number[], threshold = 3): AnomalyPoint[] {
  const stats = calculateStats(data);
  const anomalies: AnomalyPoint[] = [];

  if (stats.stdDev === 0) {
    return anomalies; // 数据无变化，无异常
  }

  data.forEach((value, index) => {
    const zScore = Math.abs((value - stats.mean) / stats.stdDev);

    if (zScore > threshold) {
      anomalies.push({
        index,
        value,
        score: zScore,
        type: value > stats.mean ? "high" : "low",
        method: "zscore",
      });
    }
  });

  return anomalies;
}

/**
 * IQR (Interquartile Range) 方法检测异常
 */
function detectByIQR(data: number[], threshold = 1.5): AnomalyPoint[] {
  const stats = calculateStats(data);
  const anomalies: AnomalyPoint[] = [];

  if (stats.iqr === 0) {
    return anomalies; // 数据无变化，无异常
  }

  const lowerBound = stats.q1 - threshold * stats.iqr;
  const upperBound = stats.q3 + threshold * stats.iqr;

  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      // 计算相对IQR的偏离程度
      const deviation =
        value < lowerBound
          ? (stats.q1 - value) / stats.iqr
          : (value - stats.q3) / stats.iqr;

      anomalies.push({
        index,
        value,
        score: deviation,
        type: value > upperBound ? "high" : "low",
        method: "iqr",
      });
    }
  });

  return anomalies;
}

/**
 * MAD (Median Absolute Deviation) 方法检测异常
 */
function detectByMAD(data: number[], threshold = 3): AnomalyPoint[] {
  const stats = calculateStats(data);
  const anomalies: AnomalyPoint[] = [];

  if (stats.mad === 0) {
    return anomalies; // 数据无变化，无异常
  }

  // 修正因子（使MAD与标准差可比）
  const consistencyConstant = 1.4826;

  data.forEach((value, index) => {
    const modifiedZScore =
      (consistencyConstant * Math.abs(value - stats.median)) / stats.mad;

    if (modifiedZScore > threshold) {
      anomalies.push({
        index,
        value,
        score: modifiedZScore,
        type: value > stats.median ? "high" : "low",
        method: "mad",
      });
    }
  });

  return anomalies;
}

/**
 * 检测数据中的异常点
 *
 * @param data 数据数组
 * @param options 检测选项
 * @returns 异常点列表
 *
 * @example
 * ```ts
 * const data = [1, 2, 3, 2.5, 2.8, 100, 2.1] // 100是异常点
 * const anomalies = detectAnomalies(data, { method: 'zscore', threshold: 3 })
 * // => [{ index: 5, value: 100, score: 15.2, type: 'high', method: 'zscore' }]
 * ```
 */
export function detectAnomalies(
  data: number[],
  options: AnomalyDetectionOptions = {},
): AnomalyPoint[] {
  const { method = "zscore", threshold, minDataPoints = 5 } = options;

  // 数据点太少，不进行检测
  if (data.length < minDataPoints) {
    return [];
  }

  // 过滤掉null/undefined/NaN
  const validData = data.filter(
    (val) => val !== null && val !== undefined && !isNaN(val),
  );

  if (validData.length < minDataPoints) {
    return [];
  }

  // 根据方法选择检测算法
  switch (method) {
    case "zscore":
      return detectByZScore(validData, threshold ?? 3);
    case "iqr":
      return detectByIQR(validData, threshold ?? 1.5);
    case "mad":
      return detectByMAD(validData, threshold ?? 3);
    default:
      return detectByZScore(validData, threshold ?? 3);
  }
}

/**
 * 获取异常检测的统计摘要
 */
export function getAnomalyStats(data: number[], anomalies: AnomalyPoint[]) {
  const stats = calculateStats(data);

  return {
    totalPoints: data.length,
    anomalyCount: anomalies.length,
    anomalyRate: (anomalies.length / data.length) * 100,
    highAnomalies: anomalies.filter((a) => a.type === "high").length,
    lowAnomalies: anomalies.filter((a) => a.type === "low").length,
    stats,
  };
}
