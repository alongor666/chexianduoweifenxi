'use client'

import { FilterContainer } from './filter-container'
import { MultiSelectFilter } from './multi-select-filter'
import { useFilterStore } from '@/store/domains/filterStore'
import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { DataService } from '@/services/DataService'
import { normalizeChineseText, cn } from '@/lib/utils'
import { CANONICAL_TERMINAL_SOURCES } from '@/constants/dimensions'

export function ChannelFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const { rawData } = useInsuranceData()

  // 联动：根据其他筛选条件提取唯一的终端来源
  const recordsForTerminalSource = DataService.filter(
    rawData,
    filters,
    ['terminalSources']
  )

  // 使用 Canonical 集合并按数据出现过滤
  const presentTerminalSources = new Set(
    recordsForTerminalSource
      .map(record => normalizeChineseText(record.terminal_source))
      .filter((v): v is string => Boolean(v))
  )
  const availableTerminalSources = CANONICAL_TERMINAL_SOURCES.filter(s =>
    presentTerminalSources.has(s)
  )
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(s => ({ label: s, value: s }))

  const handleTerminalSourceChange = (sources: string[]) => {
    updateFilters({ terminalSources: sources })
  }

  const handleIsNewEnergyChange = (value: boolean | null) => {
    updateFilters({ isNewEnergy: value })
  }

  const handleReset = () => {
    updateFilters({
      terminalSources: [],
      isNewEnergy: null,
    })
  }

  const hasFilters =
    filters.terminalSources.length > 0 || filters.isNewEnergy !== null

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <FilterContainer
        title="渠道维度"
        onReset={hasFilters ? handleReset : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              终端来源
            </label>
            <MultiSelectFilter
              id="channel-filter-terminal-source"
              options={availableTerminalSources}
              selectedValues={filters.terminalSources}
              onChange={handleTerminalSourceChange}
              placeholder="选择终端来源"
              searchPlaceholder="搜索终端来源..."
              emptyText="未找到终端来源"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              新能源车状态
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleIsNewEnergyChange(null)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  'border-2 active:scale-95 whitespace-normal text-center',
                  filters.isNewEnergy === null
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-50'
                )}
              >
                全部
              </button>
              <button
                onClick={() => handleIsNewEnergyChange(true)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  'border-2 active:scale-95 whitespace-normal text-center',
                  filters.isNewEnergy === true
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-50'
                )}
              >
                新能源车
              </button>
              <button
                onClick={() => handleIsNewEnergyChange(false)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  'border-2 active:scale-95 whitespace-normal text-center',
                  filters.isNewEnergy === false
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-50'
                )}
              >
                非新能源车
              </button>
            </div>
          </div>
        </div>
      </FilterContainer>
    </div>
  )
}
