/**
 * 分析区段包装组件
 * 用于主题分析中的各个分析小节，提供统一的标题和描述样式
 */

import React from 'react'

export interface AnalysisSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AnalysisSection({
  title,
  description,
  children,
}: AnalysisSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}
