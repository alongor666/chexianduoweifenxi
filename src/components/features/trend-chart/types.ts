/**
 * 趋势图表类型定义
 *
 * 包含趋势图表组件使用的所有类型定义，包括：
 * - SeriesKey: 数据系列键类型
 * - BrushRange: 区间选择范围
 * - PointAnalytics: 数据点分析指标
 * - CustomTooltipPayload: 自定义提示框数据
 * - Insight: 洞察信息
 */

/**
 * 数据系列键类型
 * - signed: 签单保费
 * - matured: 满期保费
 * - loss: 赔付率
 */
export type SeriesKey = 'signed' | 'matured' | 'loss'

/**
 * 区间选择范围
 */
export interface BrushRange {
  /** 起始索引 */
  startIndex?: number
  /** 结束索引 */
  endIndex?: number
}

/**
 * 数据点分析指标
 * 包含环比、同比、滑动平均等多维度分析数据
 */
export interface PointAnalytics {
  /** 环比签单增长率 */
  wowSignedRate: number | null
  /** 同比签单增长率 */
  yoySignedRate: number | null
  /** 环比满期增长率 */
  wowMaturedRate: number | null
  /** 同比满期增长率 */
  yoyMaturedRate: number | null
  /** 环比赔付率差值 */
  wowLossDelta: number | null
  /** 同比赔付率差值 */
  yoyLossDelta: number | null
  /** 滑动平均赔付率 */
  rollingLossAvg: number | null
  /** 满期保费占签单保费比例 */
  maturedShare: number | null
}

/**
 * 自定义提示框数据
 */
export interface CustomTooltipPayload {
  /** 数据点唯一键 */
  key: string
  /** 签单保费（万元） */
  signed_premium_10k: number
  /** 满期保费（万元） */
  matured_premium_10k: number
  /** 赔付率（%） */
  loss_ratio: number | null
  /** 异常评分 */
  anomalyScore?: number
  /** 异常类型 */
  anomalyType?: string
}

/**
 * 洞察信息
 */
export interface Insight {
  /** 洞察唯一标识 */
  id: string
  /** 洞察文本内容 */
  text: string
}
