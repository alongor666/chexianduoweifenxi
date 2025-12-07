/**
 * 统一图表组件导出
 *
 * 所有基于 ECharts 的图表组件统一从这里导出
 */

// 基础组件
export { BaseEChart, type BaseEChartProps } from './BaseEChart'

// 微型图表
export {
  Sparkline,
  SparklineArea,
  SparklineBars,
  type SparklineProps,
  type SparklineBarsProps,
} from './Sparkline'

// TODO: 后续添加更多图表组件导出
// export { DistributionPieChart } from './DistributionPieChart'
// export { DimensionBarChart } from './DimensionBarChart'
// export { CustomerSegmentationBubble } from './CustomerSegmentationBubble'
