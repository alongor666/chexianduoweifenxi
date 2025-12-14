'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterContainerProps {
  title: string
  children: ReactNode
  onReset?: () => void
}

export function FilterContainer({
  title,
  children,
  onReset,
}: FilterContainerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            清除
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}
