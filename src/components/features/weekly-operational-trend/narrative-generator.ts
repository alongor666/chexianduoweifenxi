/**
 * 周度经营趋势分析 - 经营摘要生成器
 *
 * 根据周度趋势数据自动生成结构化的经营分析报告文本。
 */

import { formatNumber } from '@/utils/formatters'
import type { ChartDataPoint } from './types'
import { formatWeekList } from './utils'

/**
 * 生成经营摘要
 *
 * 根据图表数据和数据视图模式，自动生成经营摘要文本。
 * 摘要内容会根据数据模式（当周值/周增量）调整描述重点。
 *
 * @param data - 图表数据点数组
 * @param mode - 数据视图模式
 *   - 'current': 当周值模式（年度累计）
 *   - 'increment': 周增量模式（环比增长）
 * @returns 经营摘要文本
 */
export function generateOperationalSummary(
  data: ChartDataPoint[],
  mode: 'current' | 'increment'
): string {
  if (data.length === 0) return ''

  const latestPoint = data[data.length - 1]
  // 修正：当前周值下，年度累计签单保费就是第42周的当前周值，而不是多周的合计值
  const latestPremium = latestPoint.signedPremium

  // 计算连续高风险周数
  let consecutiveRiskWeeks = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].isRisk) {
      consecutiveRiskWeeks++
    } else {
      break
    }
  }

  const totalRiskWeeks = data.filter((d) => d.isRisk).length

  if (mode === 'increment') {
    const previousPoint =
      data.length > 1 ? data[data.length - 2] : null
    const latestPremiumWan = formatNumber(latestPremium, 0)
    const premiumChange =
      previousPoint != null
        ? latestPremium - previousPoint.signedPremium
        : null
    const premiumChangeText =
      premiumChange != null
        ? `，较上周${premiumChange >= 0 ? '增加' : '下降'} ${formatNumber(
            Math.abs(premiumChange),
            0
          )} 万元`
        : ''

    const recentWindowStart = Math.max(1, data.length - 6)
    const premiumDrops: Array<{ week: number; diff: number }> = []
    for (let i = recentWindowStart; i < data.length; i++) {
      const prev = data[i - 1]
      const curr = data[i]
      if (curr.signedPremium < prev.signedPremium) {
        premiumDrops.push({
          week: curr.weekNumber,
          diff: curr.signedPremium - prev.signedPremium,
        })
      }
    }

    const premiumIssueText =
      premiumDrops.length > 0
        ? `保费周增量在${premiumDrops
            .slice(-2)
            .map(
              (item) =>
                `第${item.week}周较前一周下降 ${formatNumber(
                  Math.abs(item.diff),
                  0
                )} 万元`
            )
            .join('、')}，需尽快排查渠道与获客效率`
        : '保费周增量总体保持平稳'

    const riskWeeks = data
      .filter((d) => d.isRisk)
      .map((d) => d.weekNumber)
    const riskWeekText =
      riskWeeks.length > 0
        ? `赔付率预警集中在 ${formatWeekList(
            riskWeeks.slice(-4)
          )}，赔付压力明显上行`
        : '赔付率暂未触发预警'

    const trendWindow = data.slice(-Math.min(5, data.length))
    const trendChange =
      trendWindow.length >= 2
        ? trendWindow[trendWindow.length - 1].signedPremium -
          trendWindow[0].signedPremium
        : 0
    let consecutiveDecline = 0
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i].signedPremium < data[i - 1].signedPremium) {
        consecutiveDecline += 1
      } else {
        break
      }
    }

    let trendText = '趋势暂未出现明显恶化'
    if (trendChange < 0) {
      const declineRemark =
        consecutiveDecline >= 2
          ? `已连续 ${consecutiveDecline} 周回落`
          : '近几周动能转弱'
      trendText = `趋势正在恶化，${declineRemark}，累计回落 ${formatNumber(
        Math.abs(trendChange),
        0
      )} 万元`
    }

    let summary = `截至${latestPoint.year}年第${latestPoint.weekNumber}周，本周签单保费周增量 ${latestPremiumWan} 万元${premiumChangeText}。`
    summary += `${premiumIssueText}。`
    summary += `${riskWeekText}。`
    summary += `${trendText}。`
    return summary.trim()
  }

  let summary = `截至${latestPoint.year}年第${latestPoint.weekNumber}周，`
  summary += `年度累计签单保费 ${formatNumber(latestPremium, 0)} 万元`

  // 修正：赔付率不用均值，直接说多少周处于预警区
  if (consecutiveRiskWeeks > 0) {
    summary += `，连续 ${consecutiveRiskWeeks} 周处于预警区`
  } else if (totalRiskWeeks > 0) {
    summary += `，${totalRiskWeeks} 周处于预警区`
  } else {
    summary += `，经营状况良好`
  }

  return summary
}
