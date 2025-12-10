'use client'

import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * 全局 Provider 组件
 * 包含所有需要在应用顶层提供的 Context
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
}
