'use client'

import React from 'react'
import { History } from 'lucide-react'
import { useGoalStore } from '@/store/goalStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * 目标版本切换器
 * 展示年初目标的锁定状态，并提供版本切换与撤销操作
 */
export function GoalVersionSwitcher() {
  const versions = useGoalStore(state => state.versions)
  const currentVersionId = useGoalStore(state => state.currentVersionId)
  const switchVersion = useGoalStore(state => state.switchVersion)
  const undo = useGoalStore(state => state.undo)
  const historyLength = useGoalStore(state => state.history.length)

  const handleChange = (value: string) => {
    switchVersion(value)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor="goal-version-select"
        >
          目标版本
        </label>
        <Select value={currentVersionId} onValueChange={handleChange}>
          <SelectTrigger
            id="goal-version-select"
            className="w-72"
            aria-label="目标版本切换"
          >
            <SelectValue placeholder="选择目标版本" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.id} value={version.id}>
                <span className="flex items-center gap-2">
                  {version.locked ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-amber-600">
                          <span role="img" aria-label="锁定状态">
                            🔒
                          </span>
                          {version.id}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>年初目标，不可修改或删除</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span>{version.id}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(version.createdAt).toISOString().slice(0, 10)}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'gap-2',
          historyLength === 0 && 'cursor-not-allowed opacity-50'
        )}
        onClick={() => undo()}
        disabled={historyLength === 0}
        aria-label="撤销最近一次变更"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        撤销
      </Button>
    </div>
  )
}
