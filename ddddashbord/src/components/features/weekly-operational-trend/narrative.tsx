import React from 'react'
import { AlertTriangle, ArrowDownToLine } from 'lucide-react'
import type { NarrativeSummary } from './types'

interface AnalysisNarrativeProps {
  narrative: NarrativeSummary | null
}

export const AnalysisNarrative = React.memo(function AnalysisNarrative({
  narrative,
}: AnalysisNarrativeProps) {
  if (!narrative) return null

  return (
    <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
      <h4 className="flex items-center gap-2 font-bold text-indigo-900">
        <ArrowDownToLine className="h-4 w-4" />
        深度经营复盘
      </h4>

      <div className="space-y-3 text-slate-700">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <div className="mb-2 font-medium text-indigo-700">📌 核心结论</div>
          <p className="leading-relaxed">{narrative.overview}</p>
          <p className="mt-2 leading-relaxed">{narrative.lossTrend}</p>
        </div>

        {narrative.insight && (
          <div className="rounded-lg bg-red-50 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              风险归因
            </div>
            <p className="leading-relaxed text-red-800">{narrative.insight}</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 font-medium text-slate-800">
              🏢 机构维度异常
            </div>
            {narrative.organizationLines.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                {narrative.organizationLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">无明显异常</p>
            )}
          </div>

          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 font-medium text-slate-800">
              🚙 业务维度异常
            </div>
            {narrative.businessLines.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                {narrative.businessLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">无明显异常</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-white p-3 shadow-sm">
          <div className="mb-2 font-medium text-indigo-700">🚀 行动建议</div>
          <ul className="list-decimal space-y-1 pl-4 text-xs text-slate-600">
            {narrative.actionLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <div className="mt-3 border-t border-slate-100 pt-2 text-xs font-medium text-slate-500">
            {narrative.followUp}
          </div>
        </div>
      </div>
    </div>
  )
})
