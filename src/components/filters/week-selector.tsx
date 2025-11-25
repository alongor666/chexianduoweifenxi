'use client'

import { useState } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { useUIStore } from '@/store/domains/uiStore'
import { useFilterStore } from '@/store/domains/filterStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface WeekOption {
  label: string
  value: string
  week: number
}

interface WeekSelectorProps {
  availableWeeks: WeekOption[]
}

/**
 * 周序号选择器组件
 * 根据视图模式自动切换单选/多选模式
 */
export function WeekSelector({ availableWeeks }: WeekSelectorProps) {
  const viewMode = useUIStore(state => state.viewMode)
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const [isOpen, setIsOpen] = useState(false)

  // 更新筛选器
  const handleUpdateFilters = (newFilters: any) => {
    updateFilters(newFilters)
  }

  const isSingleMode = viewMode === 'single'
  const selectedWeeks = isSingleMode
    ? filters.singleModeWeek != null
      ? [filters.singleModeWeek]
      : []
    : filters.trendModeWeeks

  // 单周模式：选择单个周
  const handleSingleWeekSelect = (week: number) => {
    handleUpdateFilters({
      singleModeWeek: week,
      weeks: [week],
    })
    setIsOpen(false)
  }

  // 多周模式：切换周的选择状态
  const handleMultiWeekToggle = (week: number) => {
    const isSelected = filters.trendModeWeeks.includes(week)
    const nextWeeks = isSelected
      ? filters.trendModeWeeks.filter(w => w !== week)
      : [...filters.trendModeWeeks, week].sort((a, b) => a - b)
    if (isSelected) {
      handleUpdateFilters({
        trendModeWeeks: nextWeeks,
        weeks: nextWeeks,
      })
      return
    }
    handleUpdateFilters({
      trendModeWeeks: nextWeeks,
      weeks: nextWeeks,
    })
  }

  // 批量操作
  const handleSelectAll = () => {
    const allWeeks = availableWeeks.map(w => w.week)
    handleUpdateFilters({
      trendModeWeeks: allWeeks,
      weeks: allWeeks,
    })
  }

  const handleSelectNone = () => {
    handleUpdateFilters({
      trendModeWeeks: [],
      weeks: [],
    })
  }

  const handleInvertSelection = () => {
    const allWeeks = availableWeeks.map(w => w.week)
    const unselected = allWeeks.filter(w => !filters.trendModeWeeks.includes(w))
    handleUpdateFilters({
      trendModeWeeks: unselected,
      weeks: unselected,
    })
  }

  // 显示文本
  const getDisplayText = () => {
    if (selectedWeeks.length === 0) {
      return isSingleMode ? '选择分析周' : '选择分析周（多选）'
    }

    if (isSingleMode) {
      return `W${selectedWeeks[0]}`
    }

    if (selectedWeeks.length === 1) {
      return `W${selectedWeeks[0]}`
    }

    if (selectedWeeks.length === availableWeeks.length) {
      return '全部周次'
    }

    return `已选 ${selectedWeeks.length} / ${availableWeeks.length} 周`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-600">
          周序号 {isSingleMode ? '(单选)' : '(多选)'}
        </label>
        {selectedWeeks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleUpdateFilters(
                isSingleMode
                  ? { singleModeWeek: null, weeks: [] }
                  : { trendModeWeeks: [], weeks: [] }
              )
            }
            className="h-auto p-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            清空
          </Button>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          {/* 多周模式的批量操作 */}
          {!isSingleMode && (
            <div className="border-b border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>
                  已选 {selectedWeeks.length} / {availableWeeks.length} 周
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  全选
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInvertSelection}
                  className="h-7 px-2 text-xs"
                >
                  反选
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectNone}
                  className="h-7 px-2 text-xs"
                >
                  清空
                </Button>
              </div>
            </div>
          )}

          {/* 周次选项 */}
          <div className="max-h-60 overflow-y-auto">
            {isSingleMode ? (
              // 单周模式：按钮式选择
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  {availableWeeks.map(week => (
                    <Button
                      key={week.week}
                      variant={
                        selectedWeeks.includes(week.week)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => handleSingleWeekSelect(week.week)}
                      className="h-8 text-xs"
                    >
                      {week.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // 多周模式：复选框列表
              <div className="p-1">
                {availableWeeks.map(week => {
                  const isSelected = selectedWeeks.includes(week.week)
                  return (
                    <div
                      key={week.week}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 rounded-md',
                        isSelected && 'bg-blue-50 text-blue-900'
                      )}
                      onClick={() => handleMultiWeekToggle(week.week)}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 border rounded flex items-center justify-center',
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="flex-1">{week.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 模式说明 */}
          <div className="border-t border-slate-200 p-3 bg-slate-50">
            <div className="text-xs text-slate-600">
              {isSingleMode ? (
                <span>💡 单周模式：选择一个周进行深度分析</span>
              ) : (
                <span>💡 多周模式：选择多个周观察趋势变化</span>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
