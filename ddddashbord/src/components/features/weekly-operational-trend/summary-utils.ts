import { formatNumber } from '@/utils/format'
import type { ChartDataPoint, DimensionHighlight } from './types'
import { formatWeekList } from './format-utils'

/**
 * 生成行动建议
 */
export function generateActionLines(
  businessHighlights: DimensionHighlight[],
  organizationHighlights: DimensionHighlight[],
  coverageHotspots: string,
  businessHotspots: string,
  organizationHotspots: string,
  hasHighlights: boolean
): string[] {
  const actionLines: string[] = []
  if (hasHighlights) {
    const coverageDisplay =
      coverageHotspots === '—' ? '重点险别' : coverageHotspots
    const businessDisplay =
      businessHotspots === '—' ? '重点业务类型' : businessHotspots
    const organizationDisplay =
      organizationHotspots === '—' ? '重点机构' : organizationHotspots

    if (organizationHotspots !== '—') {
      actionLines.push(
        `渠道：聚焦 ${organizationDisplay} 等机构，核查代理与直销渠道质量并梳理承保准入。`
      )
    } else {
      actionLines.push('渠道：保持重点机构渠道巡查频次，确保异常及时上报。')
    }
    actionLines.push(
      `产品：针对 ${coverageDisplay} 与 ${businessDisplay}，复盘费率及赔付条款，评估是否需调整承保策略。`
    )
    const primaryBusiness =
      businessHighlights[0]?.label ??
      (businessHotspots !== '—'
        ? businessHotspots.replace(/等$/, '')
        : '重点业务')
    const primaryCoverage =
      businessHighlights[0]?.topCoverage ??
      (coverageHotspots !== '—'
        ? coverageHotspots.replace(/等$/, '')
        : '重点险别')
    const primaryOrganization =
      organizationHighlights[0]?.label ??
      (organizationHotspots !== '—'
        ? organizationHotspots.replace(/等$/, '')
        : '重点机构')
    actionLines.push(
      `作业：构建“${primaryBusiness}—${primaryCoverage}—${primaryOrganization}”风险热力图，纳入周度经营例会跟踪。`
    )
  } else {
    actionLines.push('渠道：当前未发现异常波动，维持现有巡检节奏即可。')
    actionLines.push('流程：持续关注赔付率趋势，如触及阈值及时启动专项排查。')
  }
  return actionLines
}

/**
 * 生成经营摘要
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

  const totalRiskWeeks = data.filter(d => d.isRisk).length

  if (mode === 'increment') {
    const previousPoint = data.length > 1 ? data[data.length - 2] : null
    const latestPremiumWan = formatNumber(latestPremium, 0)
    const premiumChange =
      previousPoint != null ? latestPremium - previousPoint.signedPremium : null
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
              item =>
                `第${item.week}周较前一周下降 ${formatNumber(
                  Math.abs(item.diff),
                  0
                )} 万元`
            )
            .join('、')}，需尽快排查渠道与获客效率`
        : '保费周增量总体保持平稳'

    const riskWeeks = data.filter(d => d.isRisk).map(d => d.weekNumber)
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
