'use client'

import { Building2, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { filterRecordsWithExclusions } from '@/store/use-app-store'
import { cn } from '@/lib/utils'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

/**
 * 紧凑版机构筛选器（用于全局筛选区）
 * 支持三级机构的弹出式选择
 */
export function CompactOrganizationFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filters = useAppStore(state => state.filters)
  const updateFilters = useAppStore(state => state.updateFilters)
  const rawData = useAppStore(state => state.rawData)

  // 联动：根据其他筛选条件提取唯一的机构（规范化去重）
  const recordsForOrganizations = filterRecordsWithExclusions(
    rawData,
    filters,
    ['organizations']
  )
  const availableOrganizations = Array.from(
    new Set(
      recordsForOrganizations.map(record =>
        normalizeChineseText(record.third_level_organization)
      )
    )
  )
    .filter(org => org) // 过滤掉空值
    .sort()

  // 搜索过滤
  const filteredOrganizations = searchTerm
    ? availableOrganizations.filter(org =>
        org.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableOrganizations

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleOrgToggle = (org: string) => {
    const normalized = normalizeChineseText(org)
    const newOrgs = filters.organizations.includes(normalized)
      ? filters.organizations.filter(o => o !== normalized)
      : [...filters.organizations, normalized]
    updateFilters({ organizations: newOrgs })
  }

  const handleReset = () => {
    updateFilters({ organizations: [] })
    setSearchTerm('')
  }

  const handleSelectAll = () => {
    updateFilters({ organizations: [...availableOrganizations] })
  }

  const handleInvertSelection = () => {
    if (availableOrganizations.length === 0) return
    const inverted = availableOrganizations.filter(
      org => !filters.organizations.includes(org)
    )
    updateFilters({ organizations: inverted })
  }

  const showBulkActions = availableOrganizations.length > 3

  const hasSelection = filters.organizations.length > 0

  // 生成标签文本
  const _getLabel = () => {
    if (!hasSelection) return '机构'

    if (filters.organizations.length === 1) {
      return filters.organizations[0]
    }
    return `${filters.organizations.length}个机构`
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 触发按钮 - 次级按钮样式，响应式设计 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200',
          'border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'shadow-sm hover:shadow-md',
          isOpen && 'bg-slate-100 border-slate-400',
          filters.organizations.length > 0 &&
            'border-blue-300 bg-blue-50 text-blue-700'
        )}
      >
        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="truncate max-w-[80px] sm:max-w-none">
          {filters.organizations.length > 0
            ? `已选 ${filters.organizations.length} 个`
            : '选择机构'}
        </span>
        {filters.organizations.length > 0 && (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0" />
        )}
        {filters.organizations.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <div className="h-1 w-1 rounded-full bg-blue-500" />
          </div>
        )}
      </button>

      {/* 弹出面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="font-medium text-slate-900">三级机构筛选</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasSelection && (
                <button
                  onClick={handleReset}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                >
                  清空
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="p-3 border-b border-slate-200">
            <input
              type="text"
              placeholder="搜索机构名称..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 快捷操作 */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {availableOrganizations.length} 个机构可选
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
              >
                全选
              </button>
              {showBulkActions && (
                <>
                  <button
                    onClick={handleInvertSelection}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    反选
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    清空
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 机构列表 */}
          <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
            {filteredOrganizations.length > 0 ? (
              filteredOrganizations.map(org => (
                <button
                  key={org}
                  onClick={() => handleOrgToggle(org)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition-colors',
                    filters.organizations.includes(org)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <span>{org}</span>
                  {filters.organizations.includes(org) && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                {searchTerm ? '未找到匹配的机构' : '暂无可选机构'}
              </div>
            )}
          </div>

          {/* 底部统计 */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            {hasSelection ? (
              <span>
                已选择{' '}
                <span className="font-medium text-slate-700">
                  {filters.organizations.length}
                </span>{' '}
                个机构
              </span>
            ) : (
              <span>未选择任何机构</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
