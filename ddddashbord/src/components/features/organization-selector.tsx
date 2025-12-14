/**
 * 机构选择器组件
 * 支持快捷筛选和自定义选择
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ALL_ORGANIZATIONS,
  MAX_ORGANIZATIONS,
  getOrganizationColor,
  canAddMoreOrganizations,
} from '@/utils/organization-config'
import type { QuickFilter } from '@/utils/organization-config'

interface OrganizationSelectorProps {
  /** 已选机构列表 */
  selectedOrganizations: string[]
  /** 机构选择变更回调 */
  onChange: (organizations: string[]) => void
  /** 快捷筛选列表 */
  quickFilters: QuickFilter[]
  /** 自定义类名 */
  className?: string
}

/**
 * 机构选择器
 */
export function OrganizationSelector({
  selectedOrganizations,
  onChange,
  quickFilters,
  className,
}: OrganizationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // 过滤后的机构列表
  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return ALL_ORGANIZATIONS
    return ALL_ORGANIZATIONS.filter(org =>
      org.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  // 是否可以添加更多机构
  const canAddMore = canAddMoreOrganizations(selectedOrganizations.length)

  // 处理快捷筛选点击
  const handleQuickFilterClick = (filter: QuickFilter) => {
    const orgs = Array.from(filter.organizations)
    // 如果超过7个，取前7个
    const selected = orgs.slice(0, MAX_ORGANIZATIONS)
    onChange(selected)
  }

  // 处理机构勾选/取消
  const handleToggleOrg = (org: string) => {
    if (selectedOrganizations.includes(org)) {
      // 取消勾选
      onChange(selectedOrganizations.filter(o => o !== org))
    } else {
      // 勾选
      if (canAddMore) {
        onChange([...selectedOrganizations, org])
      }
    }
  }

  // 全选
  const handleSelectAll = () => {
    const allOrgs = Array.from(ALL_ORGANIZATIONS)
    const selected = allOrgs.slice(0, MAX_ORGANIZATIONS)
    onChange(selected)
  }

  // 清空
  const handleClearAll = () => {
    onChange([])
  }

  // 移除单个机构
  const handleRemoveOrg = (org: string) => {
    onChange(selectedOrganizations.filter(o => o !== org))
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6',
        className
      )}
    >
      {/* 快捷筛选 */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            🎯 快捷筛选
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleQuickFilterClick(filter)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              title={filter.description}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              <span className="text-xs text-slate-500">
                ({filter.organizations.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义选择 */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            ⚙️ 自定义选择
          </span>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索机构名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 机构列表 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {filteredOrgs.map(org => {
            const isSelected = selectedOrganizations.includes(org)
            const isDisabled = !isSelected && !canAddMore

            return (
              <button
                key={org}
                onClick={() => handleToggleOrg(org)}
                disabled={isDisabled}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : isDisabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                )}
                title={
                  isDisabled
                    ? `最多选择 ${MAX_ORGANIZATIONS} 个机构`
                    : isSelected
                      ? '点击取消选择'
                      : '点击选择'
                }
              >
                <span className="mr-1.5">{isSelected ? '☑' : '☐'}</span>
                {org}
              </button>
            )
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50"
          >
            全选
          </button>
          <button
            onClick={handleClearAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50"
          >
            清空
          </button>
        </div>
      </div>

      {/* 已选机构展示 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            已选择: {selectedOrganizations.length}/{MAX_ORGANIZATIONS}
          </span>
          {selectedOrganizations.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              清空全部
            </button>
          )}
        </div>

        {selectedOrganizations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedOrganizations.map((org, index) => {
              const color = getOrganizationColor(index)

              return (
                <div
                  key={org}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5"
                  style={{ borderColor: color }}
                >
                  {/* 颜色条 */}
                  <div
                    className="h-3 w-8 rounded"
                    style={{ backgroundColor: color }}
                  />

                  {/* 机构名 */}
                  <span className="text-sm font-medium text-slate-800">
                    {org}
                  </span>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleRemoveOrg(org)}
                    className="ml-1 text-slate-500 hover:text-slate-700"
                    title="移除"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">请选择要对比的机构</p>
          </div>
        )}

        {/* 超限提示 */}
        {!canAddMore && (
          <div className="mt-3 rounded-lg bg-orange-50 p-2 text-xs text-orange-700">
            ⚠️ 已达到最大选择数量（{MAX_ORGANIZATIONS}个机构）
          </div>
        )}
      </div>
    </div>
  )
}
