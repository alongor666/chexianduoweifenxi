'use client'

import { useAppStore } from '@/store/use-app-store'
import { SimpleUpload } from '@/components/simple-upload'
import { EnterpriseCockpit } from '@/components/features/enterprise-cockpit'
import { FilterInteractionManager } from '@/components/filters/filter-interaction-manager'
import { TopToolbar } from '@/components/layout/top-toolbar'

export default function HomePage() {
  const hasData = useAppStore(state => state.rawData.length > 0)
  const rawCount = useAppStore(state => state.rawData.length)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* 筛选器逻辑 */}
      <FilterInteractionManager />
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">DDDDashbord</h1>
        {hasData && <TopToolbar rawCount={rawCount} activeTab="cockpit" />}
      </header>

      <main className="max-w-7xl mx-auto">
        {!hasData ? (
          <SimpleUpload />
        ) : (
          <EnterpriseCockpit />
        )}
      </main>
    </div>
  )
}