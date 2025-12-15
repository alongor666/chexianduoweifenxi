/**
 * 年度计划导入面板
 *
 * 功能:
 * 1. UI导入界面
 * 2. 导入前差异对比
 * 3. 导入历史记录
 * 4. 机构名称数据验证
 */

'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { loadYearPlans, getRawYearPlans } from '@/config/load-year-plans'
import {
  processAndSavePremiumTargets,
  loadPremiumTargetsFromStorage,
} from '@/store/utils/target-utils'
import { useAppStore } from '@/store/use-app-store'
import {
  Upload,
  RefreshCw,
  History,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { normalizeChineseText } from '@/domain/rules/data-normalization'

interface ImportHistoryItem {
  id: string
  timestamp: string
  year: number
  overall: number
  organizationCount: number
}

interface DiffItem {
  organization: string
  oldValue: number
  newValue: number
  change: number
  changePercent: number
}

interface ValidationResult {
  validOrgs: string[]
  unmatchedOrgs: string[]
  hasDataOrgs: string[]
}

const IMPORT_HISTORY_KEY = 'insurDash_yearPlanImportHistory'

export function YearPlanImportPanel() {
  const { toast } = useToast()
  const rawData = useAppStore(state => state.rawData)
  const [isLoading, setIsLoading] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(
    () => {
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem(IMPORT_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    }
  )

  // 获取当前目标
  const currentTargets = useMemo(() => {
    return loadPremiumTargetsFromStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiff])

  // 加载新的年度计划
  const newTargets = useMemo(() => {
    return loadYearPlans()
  }, [])

  // 数据验证: 检查机构名称是否在实际数据中存在
  const validation = useMemo((): ValidationResult => {
    const rawPlan = getRawYearPlans()
    const planOrgs = Object.keys(rawPlan).map(normalizeChineseText)

    // 从实际数据中提取所有机构名称
    const dataOrgs = new Set(
      rawData
        .map(r => normalizeChineseText(r.third_level_organization || ''))
        .filter(Boolean)
    )

    const validOrgs = planOrgs.filter(org => dataOrgs.has(org))
    const unmatchedOrgs = planOrgs.filter(org => !dataOrgs.has(org))

    return {
      validOrgs,
      unmatchedOrgs,
      hasDataOrgs: Array.from(dataOrgs),
    }
  }, [rawData])

  // 计算差异
  const diff = useMemo((): DiffItem[] => {
    const newEntries = newTargets.dimensions.thirdLevelOrganization.entries
    const oldEntries =
      currentTargets.dimensions?.thirdLevelOrganization?.entries || {}

    const allOrgs = new Set([
      ...Object.keys(newEntries),
      ...Object.keys(oldEntries),
    ])

    const items: DiffItem[] = []
    allOrgs.forEach(org => {
      const newValue = newEntries[org] || 0
      const oldValue = oldEntries[org] || 0

      if (newValue !== oldValue) {
        const change = newValue - oldValue
        const changePercent = oldValue > 0 ? (change / oldValue) * 100 : 100

        items.push({
          organization: org,
          oldValue,
          newValue,
          change,
          changePercent,
        })
      }
    })

    return items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [newTargets, currentTargets])

  // 执行导入
  const handleImport = () => {
    setIsLoading(true)
    try {
      // 保存到 LocalStorage
      processAndSavePremiumTargets(newTargets)

      // 记录导入历史
      const historyItem: ImportHistoryItem = {
        id: `import-${Date.now()}`,
        timestamp: new Date().toISOString(),
        year: newTargets.year,
        overall: newTargets.overall,
        organizationCount: Object.keys(
          newTargets.dimensions.thirdLevelOrganization.entries
        ).length,
      }

      const newHistory = [historyItem, ...importHistory].slice(0, 10) // 保留最近10条
      setImportHistory(newHistory)
      localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(newHistory))

      toast({
        title: '✅ 导入成功',
        description: `已导入 ${newTargets.year} 年度计划，全公司目标 ${(newTargets.overall / 10000).toFixed(2)} 万元`,
      })

      // 1秒后刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast({
        title: '❌ 导入失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `${(value / 10000).toFixed(2)} 万元`
  }

  return (
    <div className="space-y-6">
      {/* 数据验证结果 */}
      {validation.unmatchedOrgs.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>机构名称验证警告</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              以下 {validation.unmatchedOrgs.length}{' '}
              个机构在年度计划中配置，但未在当前数据中找到匹配记录:
            </p>
            <div className="text-xs bg-red-50 p-2 rounded max-h-32 overflow-auto">
              {validation.unmatchedOrgs.join(', ')}
            </div>
            <p className="mt-2 text-xs">
              建议: 检查机构名称拼写或先导入对应机构的数据
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* 导入概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            年度计划导入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">年份</div>
              <div className="text-2xl font-bold">{newTargets.year}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">全公司目标</div>
              <div className="text-xl font-semibold text-blue-600">
                {formatCurrency(newTargets.overall)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">机构数量</div>
              <div className="text-2xl font-bold">
                {
                  Object.keys(
                    newTargets.dimensions.thirdLevelOrganization.entries
                  ).length
                }
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">验证通过</div>
              <div
                className={`text-2xl font-bold ${validation.unmatchedOrgs.length > 0 ? 'text-orange-600' : 'text-green-600'}`}
              >
                {validation.validOrgs.length}/
                {validation.validOrgs.length + validation.unmatchedOrgs.length}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  确认导入
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDiff(!showDiff)}
              className="flex-1"
            >
              <Info className="w-4 h-4 mr-2" />
              {showDiff ? '隐藏' : '查看'}差异对比
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              导入历史
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 差异对比 */}
      {showDiff && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">差异对比</CardTitle>
          </CardHeader>
          <CardContent>
            {diff.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>无差异</AlertTitle>
                <AlertDescription>
                  新的年度计划与当前目标完全一致
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">
                  发现 {diff.length} 个机构目标有变化
                </div>
                <div className="max-h-96 overflow-auto space-y-2">
                  {diff.map(item => (
                    <div
                      key={item.organization}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.organization}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.oldValue)} →{' '}
                          {formatCurrency(item.newValue)}
                        </div>
                      </div>
                      <div
                        className={`text-right ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        <div className="font-semibold">
                          {item.change > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(item.change))}
                        </div>
                        <div className="text-xs">
                          {item.changePercent > 0 ? '+' : ''}
                          {item.changePercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 导入历史 */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">导入历史</CardTitle>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>暂无历史</AlertTitle>
                <AlertDescription>尚未进行过年度计划导入</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {importHistory.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{item.year} 年度计划</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(item.overall)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.organizationCount} 个机构
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
