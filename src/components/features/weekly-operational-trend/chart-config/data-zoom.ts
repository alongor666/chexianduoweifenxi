import type * as echarts from 'echarts'

export function createDataZoom(length: number): echarts.DataZoomComponentOption[] {
  const start = length > 26 ? ((length - 26) / length) * 100 : 0

  return [
    {
      type: 'slider',
      show: true,
      xAxisIndex: 0,
      start,
      end: 100,
      height: 20,
      bottom: '5%',
      handleSize: '80%',
      textStyle: {
        fontSize: 10,
      },
    },
    {
      type: 'inside',
      xAxisIndex: 0,
      start,
      end: 100,
    },
  ]
}
