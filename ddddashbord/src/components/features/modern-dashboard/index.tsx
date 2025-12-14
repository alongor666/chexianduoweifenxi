'use client'

import React from 'react'
import { CockpitSection, type CockpitSectionProps } from './cockpit-section'
import { PanoramaSection } from './panorama-section'
import { DeepDiveSection } from './deep-dive-section'

export function ModernDashboard(props: CockpitSectionProps) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-12 pb-24">
      {/* 1. 驾驶舱层 (Cockpit Layer) */}
      <section>
        <CockpitSection {...props} />
      </section>

      {/* 2. 全景监控层 (Panorama Layer) */}
      <section className="relative">
        <div className="absolute inset-0 -mx-4 bg-slate-50/50 sm:-mx-8" />
        <div className="relative pt-8">
          <PanoramaSection />
        </div>
      </section>

      {/* 3. 深度诊断层 (Deep Dive Layer) */}
      <section>
        <div className="mb-8 border-t border-slate-200" />
        <DeepDiveSection />
      </section>
    </div>
  )
}
