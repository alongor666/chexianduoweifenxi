'use client'

import { useState, useId } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MultiSelectFilterProps {
  options: { label: string; value: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** 唯一标识符，用于生成唯一的表单ID */
  id?: string
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onChange,
  placeholder = '选择选项',
  searchPlaceholder = '搜索...',
  emptyText = '未找到选项',
  id,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  // 使用 React 的 useId 生成唯一ID，如果没有传入 id 则自动生成
  const autoId = useId()
  const uniqueId = id || autoId
  const optionValues = options.map(opt => opt.value)
  const isAllSelected =
    optionValues.length > 0 && selectedValues.length === optionValues.length
  const showBulkActions = options.length > 3
  const isSimpleFilter = options.length >= 2 && options.length <= 3

  const handleSelect = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  const handleSelectAll = () => {
    if (optionValues.length === 0) return
    onChange(optionValues)
  }

  const handleInvertSelection = () => {
    if (optionValues.length === 0) return
    const inverted = optionValues.filter(
      value => !selectedValues.includes(value)
    )
    onChange(inverted)
  }

  const handleClear = () => {
    if (selectedValues.length === 0) return
    onChange([])
  }

  const displayText =
    selectedValues.length === 0
      ? placeholder
      : isAllSelected
        ? '全部'
        : `已选 ${selectedValues.length} 项`

  // 2-3个选项时使用并列点选方式 - 使用grid布局自适应
  if (isSimpleFilter) {
    return (
      <div
        className={cn(
          'grid gap-2',
          options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        )}
      >
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                'border-2 active:scale-95 whitespace-normal text-center',
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-50'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  // 超过3个选项时使用下拉多选方式
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-11 rounded-xl border-2 font-medium transition-all',
            selectedValues.length > 0
              ? 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'border-slate-200 text-slate-700 hover:border-slate-300'
          )}
        >
          <span
            className={cn(
              'truncate',
              selectedValues.length > 0 && 'text-blue-600 font-semibold'
            )}
          >
            {displayText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 rounded-2xl shadow-xl border-2"
        align="start"
      >
        <Command className="rounded-2xl">
          <CommandInput
            id={`${uniqueId}-search`}
            name={`${uniqueId}-search`}
            placeholder={searchPlaceholder}
            className="h-12 text-base"
          />
          {/* 批量操作按钮 - 单行横向滚动 */}
          {showBulkActions && (
            <div className="border-b border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-1">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    'border-2 active:scale-95',
                    isAllSelected
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600'
                  )}
                >
                  全选
                </button>
                <button
                  onClick={handleInvertSelection}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 active:scale-95"
                >
                  反选
                </button>
                <button
                  onClick={handleClear}
                  disabled={selectedValues.length === 0}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all border-2 active:scale-95',
                    selectedValues.length > 0
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-600'
                      : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  清空
                </button>
              </div>
            </div>
          )}

          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              {emptyText}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {options.map(option => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      'cursor-pointer rounded-lg px-3 py-2.5 mb-1 transition-all',
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div
                      className={cn(
                        'mr-3 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all flex-shrink-0',
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300'
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'break-words',
                        isSelected && 'text-blue-700'
                      )}
                    >
                      {option.label}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
