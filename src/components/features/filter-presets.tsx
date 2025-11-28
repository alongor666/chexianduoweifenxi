/**
 * @owner 飞友
 * @status 完成
 * @doc See [FEAT-P1-02: 筛选条件组合保存与管理](./../../../开发文档/01_features/FEAT-P1-02_filter-presets.md)
 */
'use client'

import { useState } from 'react'
import { Save, FolderOpen, Star, Clock, Trash2, Download } from 'lucide-react'
import { useFilterPresets, type FilterPreset } from '@/hooks/use-filter-presets'
import { useAppStore, type AppState } from '@/store/use-app-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function FilterPresets() {
  const filters = useAppStore((state: AppState) => state.filters)
  const updateFilters = useAppStore((state: AppState) => state.updateFilters)
  const {
    presets,
    createPreset,
    deletePreset,
    applyPreset,
    getMostUsedPresets,
    getRecentPresets,
    exportPresets,
  } = useFilterPresets()

  const [isOpen, setIsOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'frequent' | 'recent'>(
    'all'
  )

  // 保存当前筛选条件为预设
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      return
    }

    createPreset(
      newPresetName.trim(),
      filters,
      newPresetDescription.trim() || undefined
    )

    setNewPresetName('')
    setNewPresetDescription('')
    setIsSaveDialogOpen(false)
  }

  // 应用预设
  const handleApplyPreset = (preset: FilterPreset) => {
    const filters = applyPreset(preset.id)
    if (filters) {
      updateFilters(filters)
      setIsOpen(false)
    }
  }

  // 删除预设
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个筛选预设吗？')) {
      deletePreset(id)
    }
  }

  // 获取要显示的预设列表
  const getDisplayPresets = () => {
    switch (activeTab) {
      case 'frequent':
        return getMostUsedPresets()
      case 'recent':
        return getRecentPresets()
      default:
        return presets
    }
  }

  const displayPresets = getDisplayPresets()

  // 检查当前是否有筛选条件
  const hasActiveFilters =
    filters.years.length > 0 ||
    filters.weeks.length > 0 ||
    filters.organizations.length > 0 ||
    filters.insuranceTypes.length > 0 ||
    filters.businessTypes.length > 0 ||
    filters.coverageTypes.length > 0 ||
    filters.customerCategories.length > 0 ||
    filters.vehicleGrades.length > 0 ||
    filters.terminalSources.length > 0 ||
    filters.renewalStatuses.length > 0 ||
    filters.isNewEnergy !== null

  return (
    <div className="flex items-center gap-2">
      {/* 保存当前筛选 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
              hasActiveFilters
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
            )}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? '保存当前筛选条件' : '当前没有筛选条件'}
          >
            <Save className="h-4 w-4" />
            保存筛选
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存筛选预设</DialogTitle>
            <DialogDescription>
              为当前筛选条件创建一个预设，方便下次快速使用
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                预设名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="例如：2024年高新区商业险"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                maxLength={50}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                描述（可选）
              </label>
              <textarea
                value={newPresetDescription}
                onChange={e => setNewPresetDescription(e.target.value)}
                placeholder="简要描述这个筛选条件的用途..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* 当前筛选条件预览 */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">
                当前筛选条件：
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                {filters.years.length > 0 && (
                  <div>• 年度: {filters.years.join(', ')}</div>
                )}
                {filters.weeks.length > 0 && (
                  <div>• 周次: {filters.weeks.join(', ')}</div>
                )}
                {filters.organizations.length > 0 && (
                  <div>• 机构: {filters.organizations.join(', ')}</div>
                )}
                {filters.insuranceTypes.length > 0 && (
                  <div>• 险种: {filters.insuranceTypes.join(', ')}</div>
                )}
                {/* 可以添加更多筛选条件显示 */}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsSaveDialogOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleSavePreset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存预设
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 加载筛选预设 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
              presets.length > 0
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
            )}
            disabled={presets.length === 0}
            title={
              presets.length > 0 ? '加载已保存的筛选预设' : '暂无保存的预设'
            }
          >
            <FolderOpen className="h-4 w-4" />
            加载预设
            {presets.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {presets.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>筛选预设管理</DialogTitle>
            <DialogDescription>
              选择一个预设快速应用筛选条件，或管理已保存的预设
            </DialogDescription>
          </DialogHeader>

          {/* 标签页 */}
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              全部 ({presets.length})
            </button>
            <button
              onClick={() => setActiveTab('frequent')}
              className={cn(
                'inline-flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'frequent'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Star className="h-4 w-4" />
              常用
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={cn(
                'inline-flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'recent'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Clock className="h-4 w-4" />
              最近
            </button>
          </div>

          {/* 预设列表 */}
          <div className="max-h-[400px] space-y-2 overflow-y-auto py-4">
            {displayPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="mb-3 h-12 w-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">
                  {activeTab === 'all'
                    ? '暂无保存的筛选预设'
                    : activeTab === 'frequent'
                      ? '暂无常用预设'
                      : '暂无最近使用的预设'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  点击&ldquo;保存筛选&rdquo;按钮创建第一个预设
                </p>
              </div>
            ) : (
              displayPresets.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800">
                        {preset.name}
                      </h4>
                      <button
                        onClick={e => handleDeletePreset(preset.id, e)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="删除预设"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                      </button>
                    </div>

                    {preset.description && (
                      <p className="mt-1 text-xs text-slate-600">
                        {preset.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      {preset.useCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          使用{preset.useCount}次
                        </span>
                      )}
                      {preset.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(preset.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 底部操作 */}
          {presets.length > 0 && (
            <div className="flex justify-between border-t border-slate-200 pt-4">
              <button
                onClick={exportPresets}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Download className="h-4 w-4" />
                导出预设
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                关闭
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
