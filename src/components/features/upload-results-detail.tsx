/**
 * 上传结果详情组件
 * 显示详细的数据验证结果，包括失败记录的具体原因
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Info,
  Download,
  Search,
  BarChart3,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BatchUploadResult } from '@/hooks/use-file-upload'
import { DataQualityReport } from './data-quality-report'
import { DataRepairSuggestions } from './data-repair-suggestions'

interface UploadResultsDetailProps {
  batchResult: BatchUploadResult
  onReset: () => void
}

/**
 * 错误分类统计
 */
interface ErrorStats {
  totalErrors: number
  fieldErrors: Record<string, number>
  errorTypes: Record<string, number>
  severityStats: {
    error: number
    warning: number
    info: number
  }
}

/**
 * 错误详情项
 */
interface ErrorDetail {
  row: number
  field?: string
  message: string
  severity: 'error' | 'warning' | 'info'
  fileName: string
}

export function UploadResultsDetail({
  batchResult,
  onReset,
}: UploadResultsDetailProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<
    'all' | 'error' | 'warning' | 'info'
  >('all')
  const [selectedField, setSelectedField] = useState<string>('all')

  /**
   * 处理文件展开/收起
   */
  const toggleFileExpansion = (index: number) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedFiles(newExpanded)
  }

  /**
   * 收集所有错误详情
   */
  const allErrorDetails = useMemo((): ErrorDetail[] => {
    const details: ErrorDetail[] = []

    batchResult.results.forEach(result => {
      // 处理成功解析但有错误的文件
      if (result.result?.errors) {
        result.result.errors.forEach(error => {
          // 从错误消息中提取字段名（如果可能）
          let field: string | undefined = undefined
          const fieldMatch = error.message.match(/^([^:：]+)[：:]/)
          if (fieldMatch) {
            field = fieldMatch[1].trim()
          }

          details.push({
            row: error.row,
            field: field,
            message: error.message,
            severity: error.severity,
            fileName: result.file.name,
          })
        })
      }

      // 处理完全失败的文件
      if (!result.success && result.error) {
        details.push({
          row: 1,
          field: undefined,
          message: result.error,
          severity: 'error',
          fileName: result.file.name,
        })
      }
    })

    return details
  }, [batchResult])

  /**
   * 错误统计分析
   */
  const errorStats = useMemo((): ErrorStats => {
    const fieldErrors: Record<string, number> = {}
    const errorTypes: Record<string, number> = {}
    const severityStats = { error: 0, warning: 0, info: 0 }

    allErrorDetails.forEach(detail => {
      // 字段错误统计
      if (detail.field) {
        fieldErrors[detail.field] = (fieldErrors[detail.field] || 0) + 1
      }

      // 错误类型统计 - 改进分类逻辑
      let errorType = '其他错误'
      const message = detail.message.toLowerCase()

      if (
        message.includes('required') ||
        message.includes('必填') ||
        message.includes('不能为空')
      ) {
        errorType = '必填字段缺失'
      } else if (
        message.includes('invalid') ||
        message.includes('格式') ||
        message.includes('无效')
      ) {
        errorType = '格式错误'
      } else if (
        message.includes('number') ||
        message.includes('数字') ||
        message.includes('数值')
      ) {
        errorType = '数值类型错误'
      } else if (
        message.includes('date') ||
        message.includes('时间') ||
        message.includes('日期')
      ) {
        errorType = '日期时间错误'
      } else if (
        message.includes('enum') ||
        message.includes('枚举') ||
        message.includes('选项')
      ) {
        errorType = '枚举值错误'
      } else if (
        message.includes('length') ||
        message.includes('长度') ||
        message.includes('范围')
      ) {
        errorType = '长度范围错误'
      } else if (message.includes('duplicate') || message.includes('重复')) {
        errorType = '重复数据'
      } else {
        // 尝试从错误消息开头提取错误类型
        const colonIndex = detail.message.indexOf(':')
        if (colonIndex > 0 && colonIndex < 30) {
          errorType = detail.message.substring(0, colonIndex).trim()
        }
      }

      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1

      // 严重程度统计
      severityStats[detail.severity]++
    })

    return {
      totalErrors: allErrorDetails.length,
      fieldErrors,
      errorTypes,
      severityStats,
    }
  }, [allErrorDetails])

  /**
   * 过滤后的错误详情
   */
  const filteredErrors = useMemo(() => {
    return allErrorDetails.filter(error => {
      // 搜索过滤
      if (
        searchTerm &&
        !error.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !error.fileName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(
          error.field &&
          error.field.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false
      }

      // 严重程度过滤
      if (selectedSeverity !== 'all' && error.severity !== selectedSeverity) {
        return false
      }

      // 字段过滤
      if (selectedField !== 'all' && error.field !== selectedField) {
        return false
      }

      return true
    })
  }, [allErrorDetails, searchTerm, selectedSeverity, selectedField])

  /**
   * 导出错误报告
   */
  const exportErrorReport = () => {
    const csvContent = [
      ['文件名', '行号', '字段', '错误信息', '严重程度'].join(','),
      ...filteredErrors.map(error =>
        [
          error.fileName,
          error.row,
          error.field || '',
          `"${error.message.replace(/"/g, '""')}"`,
          error.severity,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `数据验证错误报告_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const isAllSuccess =
    batchResult.failureCount === 0 && errorStats.severityStats.error === 0

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 总体结果概览 */}
      <div
        className={cn(
          'p-6 rounded-2xl border-2',
          isAllSuccess
            ? 'bg-green-50/80 border-green-200'
            : 'bg-orange-50/80 border-orange-200'
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {isAllSuccess ? '数据导入成功' : '数据导入完成（存在问题）'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-600">总文件数：</span>
                <span className="font-medium">{batchResult.totalFiles}</span>
              </div>
              <div>
                <span className="text-slate-600">成功文件：</span>
                <span className="font-medium text-green-600">
                  {batchResult.successCount}
                </span>
              </div>
              <div>
                <span className="text-slate-600">有效记录：</span>
                <span className="font-medium text-blue-600">
                  {batchResult.validRecords}
                </span>
              </div>
              <div>
                <span className="text-slate-600">问题记录：</span>
                <span className="font-medium text-orange-600">
                  {batchResult.invalidRecords}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            继续导入
          </button>
        </div>

        {/* 错误统计概览 */}
        {errorStats.totalErrors > 0 && (
          <div className="mt-4 p-4 bg-white/60 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h4 className="font-medium text-slate-800">问题统计</h4>
            </div>

            {/* 严重程度统计 */}
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>错误: {errorStats.severityStats.error}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>警告: {errorStats.severityStats.warning}</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span>提示: {errorStats.severityStats.info}</span>
              </div>
            </div>

            {/* 错误类型统计 */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-slate-700 mb-2">
                错误类型分布
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(errorStats.errorTypes)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center bg-white/80 px-2 py-1 rounded"
                    >
                      <span className="text-slate-600 truncate">{type}</span>
                      <span className="font-medium text-slate-800 ml-1">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 字段错误统计 */}
            {Object.keys(errorStats.fieldErrors).length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">
                  问题字段分布
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(errorStats.fieldErrors)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([field, count]) => (
                      <div
                        key={field}
                        className="flex justify-between items-center bg-white/80 px-2 py-1 rounded"
                      >
                        <span className="text-slate-600 truncate">{field}</span>
                        <span className="font-medium text-slate-800 ml-1">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 
      // 周次导入统计 - [已禁用] weekAnalysis 属性已在重构中移除
      {batchResult.weekAnalysis && batchResult.weekAnalysis.totalWeeks > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800">
              周次导入统计
            </h4>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
              <div className="text-sm text-slate-600 mb-1">总周次数</div>
              <div className="text-2xl font-semibold text-slate-800">
                {batchResult.weekAnalysis.totalWeeks}
              </div>
            </div>

            <div className="bg-green-50/80 backdrop-blur-sm p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <div className="text-sm text-green-700">新导入周次</div>
              </div>
              <div className="text-2xl font-semibold text-green-600">
                {batchResult.weekAnalysis.newWeeks}
              </div>
            </div>

            <div className="bg-yellow-50/80 backdrop-blur-sm p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <div className="text-sm text-yellow-700">跳过周次</div>
              </div>
              <div className="text-2xl font-semibold text-yellow-600">
                {batchResult.weekAnalysis.skippedWeeks}
              </div>
            </div>
          </div>

          
          {batchResult.weekAnalysis.weekResults.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <h5 className="text-sm font-medium text-slate-700 mb-3">
                周次详情
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {batchResult.weekAnalysis.weekResults.map(
                  (weekResult, index) => (
                    <div
                      key={index}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between',
                        weekResult.status === 'success' &&
                          'bg-green-100 text-green-700 border border-green-200',
                        weekResult.status === 'skipped' &&
                          'bg-yellow-100 text-yellow-700 border border-yellow-200',
                        weekResult.status === 'failed' &&
                          'bg-red-100 text-red-700 border border-red-200'
                      )}
                    >
                      <span>
                        {weekResult.year}年第{weekResult.weekNumber}周
                      </span>
                      {weekResult.status === 'success' && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {weekResult.status === 'skipped' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {weekResult.status === 'failed' && (
                        <XCircle className="w-3 h-3" />
                      )}
                    </div>
                  )
                )}
              </div>

              
              {batchResult.weekAnalysis.skippedWeeks > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>跳过原因：</strong>
                      这些周次的数据已存在于系统中，为避免重复导入，已自动跳过。
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      */}

      {/* 错误详情分析 */}
      {errorStats.totalErrors > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-800">
                问题详情分析
              </h4>
              <button
                onClick={exportErrorReport}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                导出报告
              </button>
            </div>

            {/* 过滤器 */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索错误信息..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedSeverity}
                onChange={e =>
                  setSelectedSeverity(
                    e.target.value as 'all' | 'error' | 'warning' | 'info'
                  )
                }
                className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有级别</option>
                <option value="error">错误</option>
                <option value="warning">警告</option>
                <option value="info">提示</option>
              </select>

              <select
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有字段</option>
                {Object.keys(errorStats.fieldErrors)
                  .sort()
                  .map(field => (
                    <option key={field} value={field}>
                      {field} ({errorStats.fieldErrors[field]})
                    </option>
                  ))}
              </select>
            </div>

            <div className="text-sm text-slate-600">
              显示 {filteredErrors.length} / {errorStats.totalErrors} 个问题
            </div>
          </div>

          {/* 错误列表 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredErrors.map((error, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-4 border-b border-slate-100 hover:bg-slate-50',
                  error.severity === 'error' && 'border-l-4 border-l-red-500',
                  error.severity === 'warning' &&
                    'border-l-4 border-l-orange-500',
                  error.severity === 'info' && 'border-l-4 border-l-blue-500'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {error.severity === 'error' && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  {error.severity === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  {error.severity === 'info' && (
                    <Info className="w-4 h-4 text-blue-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800">
                      {error.fileName}
                    </span>
                    <span className="text-xs text-slate-500">
                      第 {error.row} 行
                    </span>
                    {error.field && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {error.field}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据质量报告 */}
      {batchResult.totalRecords > 0 && (
        <DataQualityReport
          totalRecords={batchResult.totalRecords}
          validRecords={batchResult.validRecords}
          invalidRecords={batchResult.invalidRecords}
          errorStats={errorStats}
          fileName={batchResult.results[0]?.file.name}
        />
      )}

      {/* 数据修复建议 */}
      {errorStats.totalErrors > 0 && (
        <DataRepairSuggestions
          errorStats={errorStats}
          totalRecords={batchResult.totalRecords}
        />
      )}

      {/* 文件详情列表 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-lg font-semibold text-slate-800">文件处理详情</h4>
        </div>

        <div className="divide-y divide-slate-100">
          {batchResult.results.map((result, index) => (
            <div key={index} className="p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleFileExpansion(index)}
              >
                <div className="flex items-center gap-3">
                  {expandedFiles.has(index) ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}

                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <span className="font-medium text-slate-800">
                      {result.file.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600">
                  {result.success && result.result && (
                    <>
                      <span>{result.result.successRecords} 条有效</span>
                      <span>{result.result.failedRecords} 条无效</span>
                    </>
                  )}
                  <span>{Math.round(result.file.size / 1024)} KB</span>
                </div>
              </div>

              {expandedFiles.has(index) && (
                <div className="mt-4 ml-7 space-y-3">
                  {result.success && result.result ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">总记录数：</span>
                          <span className="font-medium">
                            {result.result.processedRecords}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">有效记录：</span>
                          <span className="font-medium text-green-600">
                            {result.result.successRecords}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">无效记录：</span>
                          <span className="font-medium text-red-600">
                            {result.result.failedRecords}
                          </span>
                        </div>
                      </div>

                      {/*
                      // 周次信息 - [已禁用] weekInfo 属性已在重构中移除
                      {result.weekInfo &&
                        result.weekInfo.detectedWeeks.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <h6 className="text-sm font-medium text-blue-900">
                                周次信息
                              </h6>
                            </div>
                            <div className="space-y-2 text-sm">
                              {result.weekInfo.newWeeks.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  <span className="text-green-700">
                                    新导入 {result.weekInfo.newWeeks.length}{' '}
                                    个周次：
                                    {result.weekInfo.newWeeks
                                      .map(
                                        w => `${w.year}年第${w.weekNumber}周`
                                      )
                                      .join('、')}
                                  </span>
                                </div>
                              )}
                              {result.weekInfo.conflictWeeks.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                  <span className="text-yellow-700">
                                    跳过 {result.weekInfo.conflictWeeks.length}{' '}
                                    个周次：
                                    {result.weekInfo.conflictWeeks
                                      .map(
                                        w => `${w.year}年第${w.weekNumber}周`
                                      )
                                      .join('、')}
                                    （已存在）
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      */}

                      {result.result.errors &&
                        result.result.errors.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-slate-800 mb-2">
                              错误详情 ({result.result.errors.length} 个)
                            </h5>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {result.result.errors
                                .slice(0, 10)
                                .map((error, errorIndex) => (
                                  <div
                                    key={errorIndex}
                                    className="text-xs text-slate-600 bg-slate-50 p-2 rounded"
                                  >
                                    第 {error.row} 行
                                    {error.field && ` (${error.field})`}:{' '}
                                    {error.message}
                                  </div>
                                ))}
                              {result.result.errors.length > 10 && (
                                <div className="text-xs text-slate-500 italic">
                                  还有 {result.result.errors.length - 10}{' '}
                                  个错误...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      <strong>处理失败：</strong>
                      {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
