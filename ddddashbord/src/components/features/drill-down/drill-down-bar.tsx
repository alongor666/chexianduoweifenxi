'use client'

import { useMemo } from 'react'
import { Plus, X, ChevronRight, Home, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore } from '@/store/use-app-store'
import { useDrillDownStore } from '@/store/drill-down-store'
import { DimensionSelector } from './dimension-selector'
import {
  DRILL_DOWN_DIMENSIONS,
  type DrillDownDimensionKey,
  type DrillDownStep,
  formatBooleanValue,
} from '@/types/drill-down'
import { filterDrillDownData } from './utils'
import { cn } from '@/lib/utils'

export function DrillDownBar() {
  const steps = useDrillDownStore(state => state.steps)
  const pendingSteps = useDrillDownStore(state => state.pendingSteps)
  const addDrillDownStep = useDrillDownStore(state => state.addDrillDownStep)
  const removeDrillDownStepsFrom = useDrillDownStore(
    state => state.removeDrillDownStepsFrom
  )
  const clearDrillDown = useDrillDownStore(state => state.clearDrillDown)
  const applyDrillDown = useDrillDownStore(state => state.applyDrillDown)
  const cancelDrillDown = useDrillDownStore(state => state.cancelDrillDown)

  const rawData = useAppStore(state => state.rawData)
  const filters = useAppStore(state => state.filters)

  // Determine which steps to display (pending takes precedence for preview)
  const displaySteps = pendingSteps ?? steps
  const isPending = pendingSteps !== null

  // Calculate available dimensions (exclude used ones)
  // Note: We should check against the currently displayed steps
  const availableDimensions = useMemo(() => {
    return DRILL_DOWN_DIMENSIONS.filter(
      dim => !displaySteps.some(step => step.dimensionKey === dim.key)
    )
  }, [displaySteps])

  // Calculate filtered data based on current steps (to show correct counts in selector)
  const filteredData = useMemo(() => {
    // We start with raw data filtered by global filters
    // Then apply the drill-down steps up to the current point
    // This logic is handled by filterDrillDownData which likely takes all steps
    // But for the selector, we want data filtered by *current* steps

    // Note: filterDrillDownData needs to be updated or we use it as is if it accepts DrillDownStep[]
    return filterDrillDownData({
      rawData,
      filters,
      drillDownSteps: displaySteps, // Use display steps for the context of adding *next* step
    })
  }, [rawData, filters, displaySteps])

  // Handle navigation (removing steps)
  const handleNavigate = (stepIndex: number) => {
    // If we are in pending mode, we remove from pending
    // If we are in confirmed mode, we remove from confirmed (which implicitly creates a pending state?
    // User requirement: "用户确认即可运用".
    // If I remove a step from confirmed list, does it require confirmation?
    // Let's assume ANY change requires confirmation to be safe and consistent.
    // So we call removeDrillDownStepsFrom with fromPending=true if pending, or false if not.
    // Wait, if I remove from confirmed steps, I should probably enter pending state with the new shorter list.

    // Actually the store handles this. If I call remove on confirmed steps, it *should* probably
    // update pendingSteps to be the shorter list, so user can confirm.
    // My store implementation for `removeDrillDownStepsFrom` handles `fromPending` flag.
    // If `fromPending` is false (default), it updates `pendingSteps` to be a slice of `steps`.

    removeDrillDownStepsFrom(stepIndex, isPending)
  }

  // Handle selecting a new dimension value
  const handleSelectValue = (
    dimensionKey: DrillDownDimensionKey,
    dimensionLabel: string,
    value: string | boolean,
    displayLabel: string
  ) => {
    const step: DrillDownStep = {
      dimensionKey,
      dimensionLabel,
      value,
      displayLabel,
    }
    addDrillDownStep(step)
  }

  // Helper to truncate text
  const truncate = (str: string, max: number) => {
    if (!str) return ''
    return str.length > max ? str.substring(0, max) + '...' : str
  }

  // Helper to format value
  const formatValue = (val: string | boolean) => {
    const str = typeof val === 'boolean' ? formatBooleanValue(val) : String(val)
    return truncate(str, 6)
  }

  // If no steps and no pending changes, we might still want to show the bar to allow adding the first step?
  // User said "下钻栏应固定". So yes.

  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white/90 p-2 shadow-sm backdrop-blur-md transition-all duration-200">
      <div className="flex flex-1 items-center gap-2 overflow-x-auto px-2 no-scrollbar">
        {/* Root Node */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-1 px-2 text-slate-600 hover:bg-slate-100',
            displaySteps.length === 0 &&
              'font-semibold text-blue-600 bg-blue-50'
          )}
          onClick={() => handleNavigate(0)}
        >
          <Home className="h-4 w-4" />
          <span>全量数据</span>
        </Button>

        {/* Steps */}
        {displaySteps.map((step, index) => (
          <div
            key={step.dimensionKey}
            className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <Button
              variant={
                isPending && index >= steps.length ? 'secondary' : 'ghost'
              }
              // If it's a new pending step, highlight it?
              // Actually pendingSteps replaces steps in display.
              // We can visually distinguish if it's "new" by comparing with `steps`.
              size="sm"
              className={cn(
                'h-7 px-3 text-sm font-medium transition-colors',
                // Highlight logic: if this step is not in original steps or different
                isPending &&
                  (index >= steps.length || steps[index]?.value !== step.value)
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              )}
              onClick={() => handleNavigate(index + 1)}
              title={`${step.dimensionLabel}: ${typeof step.value === 'boolean' ? formatBooleanValue(step.value) : step.value}`}
            >
              {formatValue(step.value)}
            </Button>
          </div>
        ))}

        {/* Add Button (only if not confirming) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-7 w-7 rounded-full border border-dashed border-slate-300 p-0 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              title="添加下钻维度"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[280px] p-0">
            <DimensionSelector
              availableDimensions={availableDimensions}
              filteredData={filteredData}
              onSelectValue={handleSelectValue}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
        {isPending ? (
          <>
            <div className="mr-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>待应用变更</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelDrillDown}
              className="h-8 text-slate-600 hover:text-slate-900"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={applyDrillDown}
              className="h-8 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              确认应用
            </Button>
          </>
        ) : (
          displaySteps.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDrillDown}
              className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              清空
            </Button>
          )
        )}
      </div>
    </div>
  )
}
