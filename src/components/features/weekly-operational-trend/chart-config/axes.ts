import type * as echarts from 'echarts'
import { formatNumber } from '@/utils/formatters'

export function createAxes(weeks: string[]): {
  xAxis: echarts.XAXisComponentOption[]
  yAxis: echarts.YAXisComponentOption[]
} {
  return {
    xAxis: [
      {
        type: 'category',
        data: weeks,
        axisPointer: {
          type: 'shadow',
        },
        axisLabel: {
          fontSize: 11,
          rotate: 45,
          color: '#64748b',
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '签单保费（万元）',
        position: 'left',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => formatNumber(value, 0),
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
          },
        },
      },
      {
        type: 'value',
        name: '赔付率（%）',
        position: 'right',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => `${value.toFixed(0)}%`,
          fontSize: 11,
          color: '#64748b',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          show: false,
        },
        min: (value: any) => Math.floor(value.min / 10) * 10,
        max: (value: any) => Math.ceil(value.max / 10) * 10,
      },
    ],
  }
}
