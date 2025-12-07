/**
 * 图表联动与下钻机制
 *
 * 提供统一的图表交互事件管理和数据联动能力
 */

import type { ECharts } from 'echarts'
import type { FilterState } from '@/types/insurance'

/**
 * 下钻路径类型
 */
export type DrillDownPath =
  | 'organization->vehicle'      // 机构 → 车型
  | 'organization->business'     // 机构 → 业务类型
  | 'vehicle->organization'      // 车型 → 机构
  | 'business->organization'     // 业务类型 → 机构
  | 'week->organization'         // 周 → 机构
  | 'week->business'             // 周 → 业务类型

/**
 * 下钻事件数据
 */
export interface DrillDownData {
  /** 下钻路径 */
  path: DrillDownPath
  /** 源维度 */
  sourceDimension: string
  /** 源维度值 */
  sourceValue: string | number
  /** 目标维度（可选，自动推断） */
  targetDimension?: string
  /** 原始数据点 */
  rawData?: any
}

/**
 * 联动事件数据
 */
export interface LinkageData {
  /** 联动类型 */
  type: 'highlight' | 'filter' | 'brush'
  /** 联动源图表 ID */
  sourceChartId: string
  /** 联动目标图表 ID */
  targetChartIds: string[]
  /** 联动数据 */
  data: any
}

/**
 * 图表事件管理器
 */
export class ChartEventManager {
  private charts: Map<string, ECharts> = new Map()
  private drillDownHandlers: Map<string, (data: DrillDownData) => void> = new Map()
  private linkageHandlers: Map<string, (data: LinkageData) => void> = new Map()

  /**
   * 注册图表实例
   */
  registerChart(id: string, chart: ECharts): void {
    this.charts.set(id, chart)
  }

  /**
   * 注销图表实例
   */
  unregisterChart(id: string): void {
    this.charts.delete(id)
    this.drillDownHandlers.delete(id)
    this.linkageHandlers.delete(id)
  }

  /**
   * 注册下钻事件处理器
   */
  onDrillDown(chartId: string, handler: (data: DrillDownData) => void): void {
    this.drillDownHandlers.set(chartId, handler)
  }

  /**
   * 触发下钻事件
   */
  triggerDrillDown(chartId: string, data: DrillDownData): void {
    const handler = this.drillDownHandlers.get(chartId)
    if (handler) {
      handler(data)
    }
  }

  /**
   * 注册联动事件处理器
   */
  onLinkage(chartId: string, handler: (data: LinkageData) => void): void {
    this.linkageHandlers.set(chartId, handler)
  }

  /**
   * 触发联动事件
   */
  triggerLinkage(data: LinkageData): void {
    data.targetChartIds.forEach(targetId => {
      const handler = this.linkageHandlers.get(targetId)
      if (handler) {
        handler(data)
      }
    })
  }

  /**
   * 高亮指定图表的数据
   */
  highlight(chartId: string, seriesName: string, dataIndex: number): void {
    const chart = this.charts.get(chartId)
    if (chart) {
      chart.dispatchAction({
        type: 'highlight',
        seriesName,
        dataIndex,
      })
    }
  }

  /**
   * 取消高亮
   */
  downplay(chartId: string, seriesName?: string, dataIndex?: number): void {
    const chart = this.charts.get(chartId)
    if (chart) {
      chart.dispatchAction({
        type: 'downplay',
        seriesName,
        dataIndex,
      })
    }
  }

  /**
   * 清除所有图表
   */
  clear(): void {
    this.charts.clear()
    this.drillDownHandlers.clear()
    this.linkageHandlers.clear()
  }
}

/**
 * 全局图表事件管理器实例
 */
export const globalChartEventManager = new ChartEventManager()

/**
 * 下钻辅助函数：从点击事件构建下钻数据
 */
export function buildDrillDownData(
  params: any,
  path: DrillDownPath
): DrillDownData {
  const [sourceDim, targetDim] = path.split('->') as [string, string]

  return {
    path,
    sourceDimension: sourceDim,
    sourceValue: params.name || params.value,
    targetDimension: targetDim,
    rawData: params.data,
  }
}

/**
 * 下钻辅助函数：将下钻数据转换为筛选条件
 */
export function drillDownToFilters(
  drillData: DrillDownData,
  currentFilters: FilterState
): FilterState {
  const newFilters: FilterState = { ...currentFilters }

  // 根据源维度更新筛选条件
  switch (drillData.sourceDimension) {
    case 'organization':
      newFilters.organizations = [String(drillData.sourceValue)]
      break

    case 'business':
      newFilters.businessTypes = [String(drillData.sourceValue)]
      break

    case 'vehicle':
      // 车型需要拆解为车险评级
      newFilters.vehicleGrades = [String(drillData.sourceValue)]
      break

    case 'week':
      // 周次下钻
      if (typeof drillData.sourceValue === 'number') {
        newFilters.weeks = [drillData.sourceValue]
      }
      break

    default:
      console.warn(`未知的下钻维度: ${drillData.sourceDimension}`)
  }

  return newFilters
}

/**
 * 刷选辅助函数：处理框选事件
 */
export function handleBrushSelection(
  params: any,
  onSelection: (selectedData: any[]) => void
): void {
  if (!params.batch || params.batch.length === 0) return

  const selected = params.batch[0].selected

  if (!selected || selected.length === 0) {
    onSelection([])
    return
  }

  // 收集所有被选中的数据点
  const selectedData: any[] = []

  selected.forEach((item: any) => {
    if (item.dataIndex && item.dataIndex.length > 0) {
      item.dataIndex.forEach((idx: number) => {
        // 这里需要从图表的 series 中获取实际数据
        // 具体实现取决于图表的数据结构
        selectedData.push({ seriesIndex: item.seriesIndex, dataIndex: idx })
      })
    }
  })

  onSelection(selectedData)
}

/**
 * 构建通用的图表点击处理器
 */
export function buildClickHandler(
  chartId: string,
  drillPath: DrillDownPath,
  onDrillDown: (data: DrillDownData) => void
) {
  return (params: any, chart: ECharts) => {
    // 只处理数据点击击事件
    if (params.componentType !== 'series') return

    const drillData = buildDrillDownData(params, drillPath)
    onDrillDown(drillData)
  }
}

/**
 * 构建图表联动配置
 */
export function buildLinkageConfig(config: {
  /** 源图表 ID */
  sourceId: string
  /** 目标图表 ID 列表 */
  targetIds: string[]
  /** 联动类型 */
  type: 'highlight' | 'filter'
}): any {
  const { sourceId, targetIds, type } = config

  if (type === 'highlight') {
    // 悬停高亮联动
    return {
      onMouseOver: (params: any) => {
        globalChartEventManager.triggerLinkage({
          type: 'highlight',
          sourceChartId: sourceId,
          targetChartIds: targetIds,
          data: {
            seriesName: params.seriesName,
            dataIndex: params.dataIndex,
          },
        })
      },
      onMouseOut: () => {
        targetIds.forEach(targetId => {
          globalChartEventManager.downplay(targetId)
        })
      },
    }
  }

  // filter 类型的联动通过外部状态管理处理
  return {}
}

/**
 * 批量下钻辅助函数（用于刷选批量下钻）
 */
export function batchDrillDown(
  selectedData: any[],
  path: DrillDownPath,
  currentFilters: FilterState
): FilterState {
  if (selectedData.length === 0) return currentFilters

  const newFilters: FilterState = { ...currentFilters }
  const [sourceDim] = path.split('->') as [string, string]

  // 提取所有选中数据的维度值
  const values = selectedData
    .map(item => item.name || item.value)
    .filter(Boolean)

  // 根据维度类型更新筛选条件
  switch (sourceDim) {
    case 'organization':
      newFilters.organizations = values.map(String)
      break

    case 'business':
      newFilters.businessTypes = values.map(String)
      break

    case 'vehicle':
      newFilters.vehicleGrades = values.map(String)
      break

    case 'week':
      newFilters.weeks = values.filter(v => typeof v === 'number') as number[]
      break

    default:
      console.warn(`未知的批量下钻维度: ${sourceDim}`)
  }

  return newFilters
}
