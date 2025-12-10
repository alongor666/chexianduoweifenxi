/**
 * 多维健康度雷达图组件 - 机构对比版本
 * 综合展示5个核心维度的健康评分，支持多个机构（最多7个）的对比分析
 */

'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { Info } from 'lucide-react'
import {
  RADAR_DIMENSIONS,
  convertKPIToRadarScores,
  type RadarScoreResult,
} from '@/utils/radar-score'
import { formatPercent, formatNumber } from '@/utils/format'
import { cn } from '@/lib/utils'
import { getOrganizationColor } from '@/utils/organization-config'
import { OrganizationSelector } from './organization-selector'
import { useMultipleOrganizationKPIs } from '@/hooks/use-organization-kpi'
import { getAllQuickFilters } from '@/utils/quick-filters'
import type { KPIResult } from '@/types/insurance'
import { ALL_ORGANIZATIONS } from '@/utils/organization-config'

interface MultiDimensionRadarProps {
  /** 自定义类名 */
  className?: string
}

/**
 * 雷达数据点（支持多个机构）
 */
interface RadarDataPoint {
  dimension: string // 维度简称
  fullLabel: string // 维度全称
  dimensionKey: string // 维度key
  unit: string
  description: string

  // 动态机构评分字段（使用索引签名）
  [key: string]: string | number | Record<string, any>

  // 辅助数据
  rawValues: Record<string, number>
  levels: Record<string, string>
  colors: Record<string, string>
}

/**
 * 多维健康度雷达图 - 机构对比
 */
export function MultiDimensionRadar({ className }: MultiDimensionRadarProps) {
  // 机构选择状态（默认选择前3个）
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([
    '天府',
    '高新',
    '宜宾',
  ])

  // 悬停状态
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)

  // 图表引用
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 获取所有机构的KPI（用于快捷筛选）
  const allOrgKPIs = useMultipleOrganizationKPIs(Array.from(ALL_ORGANIZATIONS))

  // 获取已选机构的KPI
  const selectedOrgKPIs = useMultipleOrganizationKPIs(selectedOrganizations)

  // 生成快捷筛选列表
  const quickFilters = useMemo(() => {
    return getAllQuickFilters(allOrgKPIs)
  }, [allOrgKPIs])

  // 转换为雷达图数据
  const radarData = useMemo((): RadarDataPoint[] => {
    // 为每个维度创建数据点
    return RADAR_DIMENSIONS.map(dim => {
      const dataPoint: RadarDataPoint = {
        dimension: dim.shortLabel,
        fullLabel: dim.label,
        dimensionKey: dim.key,
        unit: dim.unit,
        description: dim.description,
        rawValues: {},
        levels: {},
        colors: {},
      }

      // 为每个已选机构添加评分
      selectedOrganizations.forEach(orgName => {
        const kpi = selectedOrgKPIs.get(orgName)
        const scores = kpi ? convertKPIToRadarScores(kpi) : new Map()
        const scoreResult = scores.get(dim.key)

        // 添加评分（使用机构名作为key）
        dataPoint[orgName] = scoreResult?.score ?? 0

        // 添加辅助数据
        dataPoint.rawValues[orgName] = scoreResult?.rawValue ?? 0
        dataPoint.levels[orgName] = scoreResult?.label ?? '-'
        dataPoint.colors[orgName] = scoreResult?.color ?? '#94a3b8'
      })

      return dataPoint
    })
  }, [selectedOrganizations, selectedOrgKPIs])

  // 计算每个机构的综合评分
  const overallScores = useMemo(() => {
    const scores: Record<string, number> = {}

    selectedOrganizations.forEach(orgName => {
      const validScores = radarData
        .map(d => d[orgName] as number)
        .filter(s => s > 0)

      if (validScores.length > 0) {
        scores[orgName] = Math.round(
          validScores.reduce((sum, s) => sum + s, 0) / validScores.length
        )
      } else {
        scores[orgName] = 0
      }
    })

    return scores
  }, [selectedOrganizations, radarData])

  // 获取综合评分等级
  const getOverallLevel = (score: number) => {
    if (score >= 95) return { label: '卓越', color: '#2E7D32' }
    if (score >= 86) return { label: '良好', color: '#4CAF50' }
    if (score >= 70) return { label: '中等', color: '#1976D2' }
    if (score >= 20) return { label: '预警', color: '#F57C00' }
    return { label: '高危', color: '#D32F2F' }
  }

  // 获取某维度的最优机构
  const getBestOrgForDimension = (dimensionKey: string): string => {
    let bestOrg = ''
    let bestScore = -1

    const dimData = radarData.find(d => d.dimensionKey === dimensionKey)
    if (!dimData) return '-'

    selectedOrganizations.forEach(orgName => {
      const score = dimData[orgName] as number
      if (score > bestScore) {
        bestScore = score
        bestOrg = orgName
      }
    })

    return bestOrg || '-'
  }

  // 初始化和更新图表
  useEffect(() => {
    if (
      !chartRef.current ||
      !radarData ||
      radarData.length === 0 ||
      selectedOrganizations.length === 0
    )
      return

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const chart = chartInstanceRef.current

    // 准备雷达图指标（维度）
    const indicators = radarData.map(d => ({
      name: d.dimension,
      max: 100,
    }))

    // 准备系列数据（每个机构一个系列）
    const seriesData = selectedOrganizations.map((orgName, index) => {
      const values = radarData.map(d => d[orgName] as number)
      const color = getOrganizationColor(index)

      return {
        name: orgName,
        value: values,
        itemStyle: {
          color: color,
        },
        lineStyle: {
          color: color,
          width: 2.5,
        },
        areaStyle: {
          color: color,
          opacity: 0.08,
        },
      }
    })

    // ECharts 配置
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155',
          fontSize: 12,
        },
        padding: 12,
        formatter: (params: any) => {
          const seriesIndex = params.seriesIndex
          const dataIndex = params.dataIndex
          const orgName = selectedOrganizations[seriesIndex]
          const dimData = radarData[dataIndex]

          if (!dimData) return ''

          const score = dimData[orgName] as number
          const rawValue = dimData.rawValues[orgName]
          const level = dimData.levels[orgName]
          const color = dimData.colors[orgName]
          const bestOrg = getBestOrgForDimension(dimData.dimensionKey)

          let html = `<div style="min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${dimData.fullLabel}</div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${getOrganizationColor(seriesIndex)};"></div>
                <span style="font-weight: 500; color: #475569;">${orgName}</span>
              </div>
              <div style="margin-left: 20px;">
                <span style="color: #64748b;">评分：</span>
                <span style="font-weight: 600; color: #1e293b;">${formatNumber(score, 1)}</span>
              </div>`

          if (rawValue !== undefined) {
            html += `<div style="margin-left: 20px;">
              <span style="color: #64748b;">原始值：</span>
              <span style="color: #64748b;">${formatPercent(rawValue, 1)}</span>
            </div>`
          }

          html += `<div style="margin-left: 20px;">
            <span style="color: #64748b;">等级：</span>
            <span style="font-weight: 600; color: ${color};">${level}</span>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <span style="font-size: 11px; color: #64748b;">最优: ${bestOrg} 🏆</span>
        </div>
      </div>`

          return html
        },
      },
      legend: {
        data: selectedOrganizations,
        bottom: '5%',
        textStyle: {
          fontSize: 13,
          fontWeight: 500,
        },
        itemWidth: 20,
        itemHeight: 8,
      },
      radar: {
        indicator: indicators,
        center: ['50%', '52%'],
        radius: '60%',
        splitNumber: 5,
        shape: 'polygon',
        axisName: {
          color: '#475569',
          fontSize: 13,
          fontWeight: 600,
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#cbd5e1',
            width: 1,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.05)', 'rgba(148, 163, 184, 0.05)'],
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: seriesData,
          symbol: 'circle',
          symbolSize: 5,
          emphasis: {
            lineStyle: {
              width: 3,
            },
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
            },
          },
        },
      ],
    }

    chart.setOption(option, true)

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [radarData, selectedOrganizations])

  // 清理
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [])

  // 空状态
  if (selectedOrganizations.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <OrganizationSelector
          selectedOrganizations={selectedOrganizations}
          onChange={setSelectedOrganizations}
          quickFilters={quickFilters}
        />

        <div className="rounded-2xl border border-slate-200 bg-white/60 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-500">请选择要对比的机构</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 机构选择器 */}
      <OrganizationSelector
        selectedOrganizations={selectedOrganizations}
        onChange={setSelectedOrganizations}
        quickFilters={quickFilters}
      />

      {/* 雷达图主体 */}
      <div className="rounded-2xl border border-white/50 bg-white/40 shadow-lg backdrop-blur-xl">
        {/* 标题栏 */}
        <div className="border-b border-slate-200/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                多维健康度雷达图 - 机构对比
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                综合对比{selectedOrganizations.length}
                个机构在5个核心维度的业务健康状况
              </p>
            </div>

            {/* 综合排名（前3名） */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">
                综合排名
              </p>
              {Object.entries(overallScores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([orgName, score], index) => {
                  const level = getOverallLevel(score)
                  const medals = ['🥇', '🥈', '🥉']
                  const orgIndex = selectedOrganizations.indexOf(orgName)
                  const color = getOrganizationColor(orgIndex)

                  return (
                    <div
                      key={orgName}
                      className="mb-1.5 flex items-center gap-2 last:mb-0"
                    >
                      <span className="text-sm">{medals[index]}</span>
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-slate-700">
                        {orgName}
                      </span>
                      <span
                        className="ml-auto text-sm font-bold"
                        style={{ color: level.color }}
                      >
                        {score}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="p-6">
          <div ref={chartRef} className="h-96 w-full" />
        </div>

        {/* 说明文本 */}
        <div className="border-t border-slate-200/50 bg-slate-50/50 px-6 py-3">
          <p className="text-xs text-slate-500">
            💡 提示：评分基于业务规则自动计算，范围为 0-100
            分。卓越（95-100）、良好（86-94）、中等（70-85）、预警（20-69）、高危（0-19）
          </p>
        </div>
      </div>
    </div>
  )
}
