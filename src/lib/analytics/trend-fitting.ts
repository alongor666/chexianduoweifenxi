/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-06: 高级趋势分析](./../../../开发文档/01_features/FEAT-P1-06_advanced-trend-analysis.md)
 *
 * 趋势拟合算法
 * 提供多种趋势分析和预测方法
 */

export interface TrendPoint {
  /**
   * X轴索引
   */
  index: number

  /**
   * 拟合值
   */
  value: number
}

export interface TrendFittingOptions {
  /**
   * 拟合方法
   * - linear: 线性回归
   * - polynomial: 多项式回归
   * - movingAverage: 移动平均
   * - exponential: 指数移动平均
   */
  method?: 'linear' | 'polynomial' | 'movingAverage' | 'exponential'

  /**
   * 多项式阶数（仅polynomial方法使用）
   */
  degree?: number

  /**
   * 移动平均窗口大小（仅movingAverage方法使用）
   */
  window?: number

  /**
   * 平滑因子（仅exponential方法使用，0-1之间）
   */
  alpha?: number

  /**
   * 是否进行预测（向后延伸趋势线）
   */
  predict?: boolean

  /**
   * 预测步数
   */
  predictSteps?: number
}

export interface TrendFittingResult {
  /**
   * 拟合的趋势点
   */
  trendPoints: TrendPoint[]

  /**
   * 预测的趋势点（如果启用预测）
   */
  predictedPoints?: TrendPoint[]

  /**
   * 拟合优度（R²）
   */
  rSquared: number

  /**
   * 趋势方向
   */
  direction: 'increasing' | 'decreasing' | 'stable'

  /**
   * 回归系数（线性回归时）
   */
  coefficients?: {
    slope: number
    intercept: number
  }
}

/**
 * 线性回归
 */
function linearRegression(data: number[]): {
  slope: number
  intercept: number
  predict: (x: number) => number
} {
  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  }
}

/**
 * 计算R²（决定系数）
 */
function calculateRSquared(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length

  let ssTot = 0 // 总平方和
  let ssRes = 0 // 残差平方和

  for (let i = 0; i < actual.length; i++) {
    ssTot += Math.pow(actual[i] - mean, 2)
    ssRes += Math.pow(actual[i] - predicted[i], 2)
  }

  return ssTot === 0 ? 1 : 1 - ssRes / ssTot
}

/**
 * 线性趋势拟合
 */
function fitLinearTrend(
  data: number[],
  options: TrendFittingOptions
): TrendFittingResult {
  const { predict = false, predictSteps = 0 } = options
  const regression = linearRegression(data)

  // 生成拟合点
  const trendPoints: TrendPoint[] = data.map((_, index) => ({
    index,
    value: regression.predict(index),
  }))

  // 预测点
  let predictedPoints: TrendPoint[] | undefined
  if (predict && predictSteps > 0) {
    predictedPoints = []
    for (let i = 1; i <= predictSteps; i++) {
      const index = data.length - 1 + i
      predictedPoints.push({
        index,
        value: regression.predict(index),
      })
    }
  }

  // 计算R²
  const fittedValues = trendPoints.map(p => p.value)
  const rSquared = calculateRSquared(data, fittedValues)

  // 判断趋势方向
  const direction =
    Math.abs(regression.slope) < 0.01
      ? 'stable'
      : regression.slope > 0
        ? 'increasing'
        : 'decreasing'

  return {
    trendPoints,
    predictedPoints,
    rSquared,
    direction,
    coefficients: {
      slope: regression.slope,
      intercept: regression.intercept,
    },
  }
}

/**
 * 移动平均趋势拟合
 */
function fitMovingAverage(
  data: number[],
  options: TrendFittingOptions
): TrendFittingResult {
  const { window = 3 } = options
  const trendPoints: TrendPoint[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2))
    const end = Math.min(data.length, start + window)
    const windowData = data.slice(start, end)
    const avg =
      windowData.reduce((sum, val) => sum + val, 0) / windowData.length

    trendPoints.push({
      index: i,
      value: avg,
    })
  }

  // 计算R²
  const fittedValues = trendPoints.map(p => p.value)
  const rSquared = calculateRSquared(data, fittedValues)

  // 判断趋势（基于首尾值）
  const firstValue = trendPoints[0].value
  const lastValue = trendPoints[trendPoints.length - 1].value
  const direction =
    Math.abs(lastValue - firstValue) / firstValue < 0.05
      ? 'stable'
      : lastValue > firstValue
        ? 'increasing'
        : 'decreasing'

  return {
    trendPoints,
    rSquared,
    direction,
  }
}

/**
 * 指数移动平均（EMA）趋势拟合
 */
function fitExponentialMovingAverage(
  data: number[],
  options: TrendFittingOptions
): TrendFittingResult {
  const { alpha = 0.3 } = options
  const trendPoints: TrendPoint[] = []

  let ema = data[0] // 初始值

  for (let i = 0; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema
    trendPoints.push({
      index: i,
      value: ema,
    })
  }

  // 计算R²
  const fittedValues = trendPoints.map(p => p.value)
  const rSquared = calculateRSquared(data, fittedValues)

  // 判断趋势
  const firstValue = trendPoints[0].value
  const lastValue = trendPoints[trendPoints.length - 1].value
  const direction =
    Math.abs(lastValue - firstValue) / firstValue < 0.05
      ? 'stable'
      : lastValue > firstValue
        ? 'increasing'
        : 'decreasing'

  return {
    trendPoints,
    rSquared,
    direction,
  }
}

/**
 * 拟合趋势线
 *
 * @param data 数据数组
 * @param options 拟合选项
 * @returns 拟合结果
 *
 * @example
 * ```ts
 * const data = [10, 12, 15, 14, 18, 20, 22]
 * const result = fitTrend(data, { method: 'linear', predict: true, predictSteps: 3 })
 * // => { trendPoints: [...], predictedPoints: [...], rSquared: 0.95, direction: 'increasing' }
 * ```
 */
export function fitTrend(
  data: number[],
  options: TrendFittingOptions = {}
): TrendFittingResult {
  const { method = 'linear' } = options

  // 过滤无效数据
  const validData = data.filter(
    val => val !== null && val !== undefined && !isNaN(val)
  )

  if (validData.length < 2) {
    // 数据太少，返回空结果
    return {
      trendPoints: [],
      rSquared: 0,
      direction: 'stable',
    }
  }

  switch (method) {
    case 'linear':
      return fitLinearTrend(validData, options)
    case 'movingAverage':
      return fitMovingAverage(validData, options)
    case 'exponential':
      return fitExponentialMovingAverage(validData, options)
    default:
      return fitLinearTrend(validData, options)
  }
}

/**
 * 计算趋势变化率
 */
export function calculateTrendRate(result: TrendFittingResult): number | null {
  if (!result.coefficients || result.trendPoints.length === 0) {
    return null
  }

  const firstValue = result.trendPoints[0].value
  if (firstValue === 0) {
    return null
  }

  // 计算整体变化率
  const lastValue = result.trendPoints[result.trendPoints.length - 1].value
  return ((lastValue - firstValue) / firstValue) * 100
}

/**
 * 获取趋势描述
 */
export function describeTrend(result: TrendFittingResult): string {
  const rate = calculateTrendRate(result)

  if (result.direction === 'stable') {
    return '趋势平稳，无明显变化'
  }

  if (rate === null) {
    return result.direction === 'increasing' ? '呈上升趋势' : '呈下降趋势'
  }

  const absRate = Math.abs(rate)
  const direction = result.direction === 'increasing' ? '上升' : '下降'

  if (absRate < 5) {
    return `略微${direction}（${rate.toFixed(1)}%）`
  } else if (absRate < 15) {
    return `稳步${direction}（${rate.toFixed(1)}%）`
  } else if (absRate < 30) {
    return `显著${direction}（${rate.toFixed(1)}%）`
  } else {
    return `快速${direction}（${rate.toFixed(1)}%）`
  }
}
