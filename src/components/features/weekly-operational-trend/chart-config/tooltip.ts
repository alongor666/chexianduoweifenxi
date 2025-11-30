import type * as echarts from 'echarts'
import { LOSS_RISK_THRESHOLD } from '../constants'
import type { ChartDataPoint } from '../types'
import { formatNumber, formatPercent } from '@/utils/formatters'

export function createTooltip(displayData: ChartDataPoint[]): echarts.TooltipComponentOption {
  return {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
      },
    },
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: {
      color: '#334155',
      fontSize: 12,
    },
    padding: 12,
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return ''

      const dataIndex = params[0].dataIndex
      const point = displayData[dataIndex]

      if (!point) return ''

      const thresholdDiff =
        point.lossRatio !== null ? point.lossRatio - LOSS_RISK_THRESHOLD : null

      let html = `<div style="min-width: 260px;">\n          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${point.week}</div>\n          <div style="margin-bottom: 4px;">\n            <span style="color: #64748b;">签单保费：</span>\n            <span style="font-weight: 600;">${formatNumber(point.signedPremium, 1)} 万元</span>\n          </div>\n          <div style="margin-bottom: 4px;">\n            <span style="color: #64748b;">赔付率（累计）：</span>\n            <span style="font-weight: 600; color: ${point.isRisk ? '#ef4444' : '#334155'};">\n              ${point.lossRatio !== null ? formatPercent(point.lossRatio, 2) : '—'}\n            </span>\n          </div>\n          <div style="margin-bottom: 8px; font-size: 10px; color: #94a3b8;">\n            💡 赔付率 = 年初至今累计赔款 / 累计保费\n          </div>`

      if (thresholdDiff !== null) {
        html += `<div style="margin-bottom: 8px;">\n            <span style="color: #64748b;">与阈值差值：</span>\n            <span style="font-weight: 600; color: ${thresholdDiff >= 0 ? '#ef4444' : '#10b981'};">\n            ${thresholdDiff >= 0 ? '+' : ''}${thresholdDiff.toFixed(1)}pp\n            </span>\n          </div>`
      }

      html += `</div>`

      return html
    },
  }
}
