/**
 * 交互式趋势图组件
 * 支持点击联动、缩放、高亮等交互功能
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChartInteraction, FilterConfig } from '@/lib/managers/chart-interaction-manager';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';

interface InteractiveTrendChartProps {
  /**
   * 图表ID
   */
  chartId: string;

  /**
   * 图表标题
   */
  title: string;

  /**
   * 数据数组
   */
  data: any[];

  /**
   * X轴数据键
   */
  xAxisKey: string;

  /**
   * Y轴数据键列表
   */
  yAxisKeys: Array<{
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    type?: 'monotone' | 'linear' | 'step';
  }>;

  /**
   * 激活的过滤器
   */
  activeFilters?: FilterConfig[];

  /**
   * 高亮的数据点
   */
  highlightPoints?: Array<{
    x: any;
    y: number;
    label: string;
  }>;

  /**
   * 参考线
   */
  referenceLines?: Array<{
    y: number;
    label: string;
    color: string;
    strokeDasharray?: string;
  }>;

  /**
   * 是否显示缩放控件
   */
  showZoomControls?: boolean;

  /**
   * 是否显示 Brush
   */
  showBrush?: boolean;

  /**
   * 高度
   */
  height?: number;

  /**
   * 类名
   */
  className?: string;
}

export function InteractiveTrendChart({
  chartId,
  title,
  data,
  xAxisKey,
  yAxisKeys,
  activeFilters = [],
  highlightPoints = [],
  referenceLines = [],
  showZoomControls = true,
  showBrush = false,
  height = 400,
  className,
}: InteractiveTrendChartProps) {
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const chartRef = useRef<any>(null);

  // 使用交互管理器
  const { applyFilter, clearFilters, trigger } = useChartInteraction(
    chartId,
    title,
    (event) => {
      // 处理来自其他图表的交互
      if (event.action === 'filter' && event.source !== chartId) {
        console.log(`[${chartId}] 收到过滤器更新:`, event.filters);
      }
    }
  );

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!activeFilters || activeFilters.length === 0) return data;

    return data.filter(item => {
      return activeFilters.every(filter => {
        const value = item[filter.type];
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          default:
            return value === filter.value;
        }
      });
    });
  }, [data, activeFilters]);

  // 处理图表点击
  const handleChartClick = (data: any) => {
    if (data && data.activeLabel) {
      const clickedData = filteredData.find(d => d[xAxisKey] === data.activeLabel);
      if (clickedData) {
        setHoveredPoint(clickedData);

        // 触发交互事件
        trigger('click', [
          {
            type: xAxisKey as any,
            value: data.activeLabel,
            operator: 'eq',
            label: `${title}: ${data.activeLabel}`
          }
        ], clickedData);
      }
    }
  };

  // 处理线条点击
  const handleLineClick = (lineKey: string) => {
    setSelectedLine(selectedLine === lineKey ? null : lineKey);
  };

  // 缩放控制
  const handleZoomIn = () => {
    if (data.length > 10) {
      const mid = Math.floor(data.length / 2);
      const range = Math.floor(data.length / 4);
      setZoomDomain([mid - range, mid + range]);
    }
  };

  const handleZoomOut = () => {
    setZoomDomain([0, data.length - 1]);
  };

  const handleResetZoom = () => {
    setZoomDomain(null);
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{`${xAxisKey}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {entry.value?.toLocaleString?.() || entry.value}
              </span>
            </div>
          ))}
          {hoveredPoint && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  applyFilter(xAxisKey as any, label, 'eq');
                }}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                筛选此数据
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 渲染激活的过滤器标签
  const renderFilterTags = () => {
    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.map((filter, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="pr-2 cursor-pointer hover:bg-slate-100"
            onClick={() => clearFilters()}
          >
            {filter.label || `${filter.type}: ${filter.value}`}
            <span className="ml-1 text-xs">✕</span>
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showZoomControls && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={!!zoomDomain}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={!zoomDomain}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetZoom}
                disabled={!zoomDomain}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {renderFilterTags()}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              ref={chartRef}
              data={filteredData}
              onClick={handleChartClick}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* 参考线 */}
              {referenceLines.map((line, index) => (
                <ReferenceLine
                  key={index}
                  y={line.y}
                  label={line.label}
                  stroke={line.color}
                  strokeDasharray={line.strokeDasharray || "5 5"}
                  strokeWidth={1}
                />
              ))}

              {/* 数据线 */}
              {yAxisKeys.map((line) => {
                const isSelected = selectedLine === line.key;
                const isDeselected = selectedLine && selectedLine !== line.key;

                return (
                  <Line
                    key={line.key}
                    type={line.type || "monotone"}
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={isSelected ? (line.strokeWidth || 3) + 1 : line.strokeWidth || 3}
                    strokeDasharray={line.strokeDasharray}
                    opacity={isDeselected ? 0.2 : 1}
                    dot={{ r: isSelected ? 5 : 3, fill: line.color }}
                    activeDot={{ r: 7, fill: line.color, onClick: () => handleLineClick(line.key) }}
                    name={line.name}
                    connectNulls={false}
                  />
                );
              })}

              {/* 高亮点 */}
              {highlightPoints.map((point, index) => (
                <ReferenceLine
                  key={index}
                  x={point.x}
                  label={point.label}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              ))}

              {/* 缩放刷子 */}
              {showBrush && (
                <Brush
                  dataKey={xAxisKey}
                  height={30}
                  stroke="#3b82f6"
                  fill="#eff6ff"
                  startIndex={zoomDomain?.[0]}
                  endIndex={zoomDomain?.[1]}
                  onChange={(domain: any) => {
                    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
                      setZoomDomain([domain.startIndex, domain.endIndex]);
                    }
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 图例 */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {yAxisKeys.map((line) => {
            const isSelected = selectedLine === line.key;
            const isDeselected = selectedLine && selectedLine !== line.key;

            return (
              <button
                key={line.key}
                onClick={() => handleLineClick(line.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all",
                  isSelected ? "bg-slate-100 shadow-sm" : "hover:bg-slate-50",
                  isDeselected && "opacity-30"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                <span className={cn(
                  isSelected ? "font-semibold" : "font-medium"
                )}>
                  {line.name}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}