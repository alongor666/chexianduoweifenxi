'use client'

import React, { useState, useEffect } from 'react'
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Calendar } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { UploadHistoryRecord } from '@/lib/storage/data-persistence'
import { logger } from '@/lib/logger'

const log = logger.create('UploadHistory')

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
 * 格式化时间
 */
const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 获取状态图标和颜色
 */
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: '成功'
      }
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: '失败'
      }
    case 'partial':
      return {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: '部分成功'
      }
    default:
      return {
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: '未知'
      }
  }
}

export function UploadHistory() {
  const [history, setHistory] = useState<UploadHistoryRecord[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const getUploadHistoryRecords = useAppStore(state => state.getUploadHistoryRecords)

  // 加载上传历史
  const loadHistory = async () => {
    setLoading(true)
    try {
      const records = await getUploadHistoryRecords()
      setHistory(records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())) // 按时间倒序
    } catch (error) {
      log.error('加载上传历史失败', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载历史
  useEffect(() => {
    loadHistory()
  }, [])

  // 切换显示状态时重新加载
  useEffect(() => {
    if (isVisible) {
      loadHistory()
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Eye className="h-4 w-4" />
          查看上传历史
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          上传历史
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <EyeOff className="h-4 w-4" />
          隐藏
        </button>
      </div>

      {loading ? (
        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">加载中...</span>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 text-center">
          <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">暂无上传历史</p>
          <p className="text-sm text-slate-500 mt-1">上传文件后将在此显示历史记录</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((record, index) => {
            const statusDisplay = getStatusDisplay(record.status)
            const StatusIcon = statusDisplay.icon

            return (
              <div
                key={index}
                className={`p-4 bg-white/80 backdrop-blur-sm rounded-lg border ${statusDisplay.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${statusDisplay.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-800 truncate">
                        {record.files.length > 0 ? record.files[0].name : '未知文件'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="text-slate-500">文件大小：</span>
                        {record.files.length > 0 ? formatFileSize(record.files[0].size) : '未知'}
                      </div>
                      <div>
                        <span className="text-slate-500">上传时间：</span>
                        {formatDateTime(record.timestamp)}
                      </div>
                      <div>
                        <span className="text-slate-500">总记录数：</span>
                        {record.totalRecords.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-slate-500">有效记录：</span>
                        {record.validRecords.toLocaleString()}
                      </div>
                    </div>

                    {/* 周次信息 */}
                    {record.weekInfo && record.weekInfo.totalWeeks > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">周次信息</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-slate-600">总周次：</span>
                            <span className="font-medium text-slate-800">
                              {record.weekInfo.totalWeeks}
                            </span>
                          </div>
                          {record.weekInfo.newWeeks && record.weekInfo.newWeeks.length > 0 && (
                            <div>
                              <span className="text-green-700">新导入：</span>
                              <span className="font-medium text-green-600">
                                {record.weekInfo.newWeeks.length} 个周次
                              </span>
                            </div>
                          )}
                          {record.weekInfo.skippedWeeks && record.weekInfo.skippedWeeks.length > 0 && (
                            <div>
                              <span className="text-yellow-700">已跳过：</span>
                              <span className="font-medium text-yellow-600">
                                {record.weekInfo.skippedWeeks.length} 个周次
                              </span>
                            </div>
                          )}
                        </div>
                        {record.weekInfo.newWeeks && record.weekInfo.newWeeks.length > 0 && (
                          <div className="mt-2 text-xs text-slate-600">
                            <span className="text-slate-500">导入周次：</span>
                            {record.weekInfo.newWeeks
                              .map(w => `第${w}周`)
                              .join('、')}
                          </div>
                        )}
                      </div>
                    )}

                    {record.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">错误信息：</span>
                        {record.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}