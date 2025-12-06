/**
 * 主页面 - 客户端组件（静态导出模式）
 * 纯静态部署，所有数据通过客户端加载（LocalStorage + CSV 上传）
 */

'use client'

import { Suspense } from 'react'
import { DashboardClient } from '@/components/dashboard-client'

export default function HomePage() {
  // 静态导出模式：不需要服务器端数据，完全依赖客户端 LocalStorage
  // DashboardClient 会自动从 LocalStorage 加载持久化数据
  // 使用 Suspense 包裹以支持 useSearchParams
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <DashboardClient initialData={[]} />
    </Suspense>
  )
}