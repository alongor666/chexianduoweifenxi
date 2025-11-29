"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

export interface SparklineProps {
  /**
   * 数据点数组（null值表示数据缺失，将显示为断点）
   */
  data: (number | null)[];

  /**
   * 线条颜色
   */
  color?: string;

  /**
   * 高度（像素）
   */
  height?: number;

  /**
   * 宽度（像素或百分比）
   */
  width?: number | string;

  /**
   * 是否显示为平滑曲线
   */
  smooth?: boolean;

  /**
   * 线条粗细
   */
  strokeWidth?: number;

  /**
   * 是否填充区域
   */
  filled?: boolean;

  /**
   * 填充颜色（需要设置filled=true）
   */
  fillColor?: string;

  /**
   * 填充透明度
   */
  fillOpacity?: number;

  /**
   * 是否连接null值（false时null值会造成线条断裂）
   */
  connectNulls?: boolean;
}

/**
 * Sparkline 微型趋势图组件
 * 用于在KPI卡片中显示简洁的趋势线
 */
export function Sparkline({
  data,
  color = "#3b82f6",
  height = 40,
  width = "100%",
  smooth = true,
  strokeWidth = 2,
  filled = false,
  fillColor,
  fillOpacity = 0.2,
  connectNulls = false,
}: SparklineProps) {
  // 将数据转换为Recharts需要的格式
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width={width as number | `${number}%`} height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <Line
          type={smooth ? "monotone" : "linear"}
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          fill={filled ? fillColor || color : "none"}
          fillOpacity={fillOpacity}
          isAnimationActive={false}
          connectNulls={connectNulls}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * 带填充的Sparkline变体
 */
export function SparklineArea({
  data,
  color = "#3b82f6",
  height = 40,
  width = "100%",
  fillOpacity = 0.2,
}: Omit<SparklineProps, "filled" | "fillColor" | "smooth">) {
  return (
    <Sparkline
      data={data}
      color={color}
      height={height}
      width={width}
      smooth={true}
      filled={true}
      fillColor={color}
      fillOpacity={fillOpacity}
    />
  );
}

/**
 * 条形Sparkline（使用简单的div实现）
 */
export interface SparklineBarsProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | string;
  barWidth?: number;
  gap?: number;
}

export function SparklineBars({
  data,
  color = "#3b82f6",
  height = 40,
  width = "100%",
  barWidth = 3,
  gap = 1,
}: SparklineBarsProps) {
  if (!data || data.length === 0) return null;

  const max = data.reduce((max, val) => Math.max(max, val), -Infinity);
  const min = data.reduce((min, val) => Math.min(min, val), Infinity);
  const range = max - min || 1;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "flex-end",
        gap: `${gap}px`,
        overflow: "hidden",
      }}
    >
      {data.map((value, index) => {
        const normalizedHeight = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            style={{
              flex: 1,
              minWidth: `${barWidth}px`,
              height: `${normalizedHeight}%`,
              backgroundColor: color,
              borderRadius: "1px",
              transition: "height 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}
