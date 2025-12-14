/**
 * 上传周次预览组件
 * 显示待导入文件的周次信息和冲突提示
 */

'use client'

import React from 'react'
import { Calendar, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import type { WeekInfo } from '@/lib/storage/data-persistence'

interface FileWeekPreview {
  fileName: string
  fileSize: number
  detectedWeeks: WeekInfo[]
  newWeeks: WeekInfo[]
  conflictWeeks: WeekInfo[]
}

interface UploadWeekPreviewProps {
  filesPreviews: FileWeekPreview[]
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化周次列表
 */
const formatWeekList = (weeks: WeekInfo[]): string => {
  if (weeks.length === 0) return ''

  const sorted = [...weeks].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.weekNumber - b.weekNumber
  })

  const years = Array.from(new Set(sorted.map(w => w.year)))

  if (years.length === 1) {
    const weekNumbers = sorted.map(w => w.weekNumber)
    return `${years[0]}年第${weekNumbers.join(', ')}周`
  } else {
    return years
      .map(year => {
        const yearWeeks = sorted.filter(w => w.year === year)
        const weekNumbers = yearWeeks.map(w => w.weekNumber)
        return `${year}年第${weekNumbers.join(', ')}周`
      })
      .join('; ')
  }
}

export function UploadWeekPreview({
  filesPreviews,
  onConfirm,
  onCancel,
}: UploadWeekPreviewProps) {
  // 计算总体统计
  const totalNewWeeks = filesPreviews.reduce(
    (sum, f) => sum + f.newWeeks.length,
    0
  )
  const totalConflictWeeks = filesPreviews.reduce(
    (sum, f) => sum + f.conflictWeeks.length,
    0
  )
  const _totalRecords = filesPreviews.reduce(
    (sum, f) => sum + f.detectedWeeks.reduce((s, w) => s + w.recordCount, 0),
    0
  )
  const newRecords = filesPreviews.reduce(
    (sum, f) => sum + f.newWeeks.reduce((s, w) => s + w.recordCount, 0),
    0
  )

  const hasConflicts = totalConflictWeeks > 0
  const canImport = totalNewWeeks > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 标题栏 */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                导入预览
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                检测到 {filesPreviews.length} 个文件，共{' '}
                {totalNewWeeks + totalConflictWeeks} 个周次
              </p>
            </div>
          </div>
        </div>

        {/* 总体统计卡片 */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">总周次数</div>
              <div className="text-2xl font-semibold text-slate-800">
                {totalNewWeeks + totalConflictWeeks}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">新导入周次</div>
              <div className="text-2xl font-semibold text-green-600">
                {totalNewWeeks}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">跳过周次</div>
              <div className="text-2xl font-semibold text-yellow-600">
                {totalConflictWeeks}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">预计导入记录</div>
              <div className="text-2xl font-semibold text-blue-600">
                {newRecords.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filesPreviews.map((preview, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-blue-300 transition-colors"
              >
                {/* 文件标题 */}
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {preview.fileName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatFileSize(preview.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 周次信息 */}
                <div className="p-4 space-y-3">
                  {/* 新周次 */}
                  {preview.newWeeks.length > 0 && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-green-900 mb-1">
                          新周次 ({preview.newWeeks.length}个)
                        </div>
                        <div className="text-sm text-green-700">
                          {formatWeekList(preview.newWeeks)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          约{' '}
                          {preview.newWeeks
                            .reduce((sum, w) => sum + w.recordCount, 0)
                            .toLocaleString()}{' '}
                          条记录
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 冲突周次 */}
                  {preview.conflictWeeks.length > 0 && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-yellow-900 mb-1">
                          跳过周次 ({preview.conflictWeeks.length}个) - 已存在
                        </div>
                        <div className="text-sm text-yellow-700">
                          {formatWeekList(preview.conflictWeeks)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        {hasConflicts && (
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900">
                  检测到周次冲突
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  {totalConflictWeeks}{' '}
                  个周次的数据已存在，这些周次将被自动跳过，只导入新周次的数据。
                </div>
              </div>
            </div>
          </div>
        )}

        {!canImport && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900">无法导入</div>
                <div className="text-sm text-red-700 mt-1">
                  所有文件中的周次都已存在于系统中，没有新数据可以导入。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={!canImport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {canImport
                ? `确认导入 (${totalNewWeeks} 个新周次)`
                : '无新数据可导入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
