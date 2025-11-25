'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { MultiSelectFilter } from './multi-select-filter'
import { useFilterStore } from '@/store/domains/filterStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import { cn, normalizeChineseText } from '@/lib/utils'
import { CANONICAL_TERMINAL_SOURCES } from '@/constants/dimensions'

/**
 * 更多筛选面板
 * 包含业务维度的详细筛选
 */
export function MoreFiltersPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  const { rawData } = useInsuranceData()
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)

  // 更新筛选器
  const handleUpdateFilters = (newFilters: any) => {
    updateFilters(newFilters)
  }

  // 切换展开状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // 获取终端来源选项（使用 Canonical 并按数据出现过滤）
  const getTerminalSourceOptions = () => {
    const filtered = DataService.filter(rawData, filters, [
      'terminalSources',
    ])
    const present = new Set(
      filtered
        .map(record => normalizeChineseText(record.terminal_source))
        .filter((v): v is string => Boolean(v))
    )
    const sources = CANONICAL_TERMINAL_SOURCES.filter(s => present.has(s)).sort(
      (a, b) => a.localeCompare(b, 'zh-CN')
    )
    return sources.map(source => ({ label: source, value: source }))
  }

  // 检查是否有活动的筛选器
  const hasActiveMoreFilters =
    filters.terminalSources.length > 0 || filters.isNewEnergy !== null

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      {/* 头部 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <div>
            <h3 className="font-medium text-slate-900">更多筛选</h3>
            <p className="text-xs text-slate-500">
              {hasActiveMoreFilters
                ? '已应用高级筛选条件'
                : '业务维度的详细筛选'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveMoreFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          <div className="p-4 space-y-4">
            {/* 新能源车筛选 - iPhone 风格 */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-600">
                新能源车状态
              </label>
              <div className="flex gap-2">
                {[
                  { label: '全部', value: null },
                  { label: '新能源车', value: true },
                  { label: '非新能源车', value: false },
                ].map(option => {
                  const isSelected = filters.isNewEnergy === option.value
                  return (
                    <button
                      key={String(option.value)}
                      onClick={() =>
                        handleUpdateFilters({ isNewEnergy: option.value })
                      }
                      className={cn(
                        'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                        'border-2 active:scale-95',
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
            </div>

            {/* 终端来源筛选 */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-slate-600">
                终端来源
              </label>
              <MultiSelectFilter
                options={getTerminalSourceOptions()}
                selectedValues={filters.terminalSources}
                onChange={values =>
                  handleUpdateFilters({
                    terminalSources: values.map(normalizeChineseText),
                  })
                }
                placeholder="选择终端来源"
                searchPlaceholder="搜索终端来源..."
                emptyText="未找到终端来源"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
