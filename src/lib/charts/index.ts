/**
 * ECharts 统一图表库导出
 *
 * 提供统一的图表组件、主题、配置构建函数和模板
 */

// 主题配置
export * from './theme'

// 配置构建函数
export * from './builders'

// 图表模板
export * from './templates/trend'
export * from './templates/scatter'
export * from './templates/heatmap'

// 交互机制
export * from './interactions'

// 基础组件通过独立导入
// import { BaseEChart } from '@/components/charts/BaseEChart'
