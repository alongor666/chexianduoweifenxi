/**
 * 新架构示例组件
 * 演示如何使用新的领域Store和聚合Hooks
 *
 * @example 对比旧架构和新架构的代码差异
 */

'use client'

import { useInsuranceData } from '@/hooks/domains/useInsuranceData'
import { useKPICalculation } from '@/hooks/domains/useKPICalculation'
import { useFiltering } from '@/hooks/domains/useFiltering'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * 【新架构示例】简洁的KPI仪表盘
 *
 * 对比旧架构的优势：
 * 1. ✅ 组件只关注展示，无业务逻辑
 * 2. ✅ Hooks提供清晰的业务接口
 * 3. ✅ 所有计算逻辑在Service层，可测试
 * 4. ✅ 不直接依赖Store，通过Hooks隔离
 */
export function NewArchitectureExample() {
  // 1. 使用聚合Hooks获取数据和状态
  const { filteredData, stats, hasData, filterPercentage, isLoading } =
    useInsuranceData()

  const { currentKpi } = useKPICalculation()

  const {
    filters,
    activeFilterCount,
    resetFilters,
    setSingleModeWeek,
    switchViewMode,
    viewMode,
  } = useFiltering()

  // 2. 渲染（纯展示逻辑）
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-slate-600">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-slate-600">
            暂无数据，请先上传数据文件
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 数据统计卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>数据概览（新架构示例）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">总记录数</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.totalRecords.toLocaleString()}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 mb-1">签单保费</div>
              <div className="text-2xl font-bold text-green-900">
                {(stats.totalPremium / 10000).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{' '}
                万元
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">保单数量</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.totalPolicyCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <p>
              可用周次：{stats.uniqueWeeks.join(', ')} （共{' '}
              {stats.uniqueWeeks.length} 周）
            </p>
            <p>
              组织机构：{stats.uniqueOrganizations.length} 个，筛选覆盖率：
              {filterPercentage}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI卡片 */}
      {currentKpi && (
        <Card>
          <CardHeader>
            <CardTitle>当前KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600">签单保费</div>
                <div className="text-xl font-bold">
                  {(currentKpi.signed_premium / 10000).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )}{' '}
                  万元
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600">保单数量</div>
                <div className="text-xl font-bold">
                  {currentKpi.policy_count.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600">平均保费</div>
                <div className="text-xl font-bold">
                  {(currentKpi.average_premium ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  元
                </div>
              </div>

              {currentKpi.premium_progress !== null && (
                <div>
                  <div className="text-sm text-slate-600">目标达成率</div>
                  <div className="text-xl font-bold">
                    {(currentKpi.premium_progress * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选控制卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选控制</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                激活筛选器：{activeFilterCount} 个
              </span>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                重置筛选
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">视图模式：</span>
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchViewMode('single')}
              >
                单周视图
              </Button>
              <Button
                variant={viewMode === 'trend' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchViewMode('trend')}
              >
                趋势视图
              </Button>
            </div>

            {viewMode === 'single' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">选择周次：</span>
                {stats.uniqueWeeks.slice(-5).map(week => (
                  <Button
                    key={week}
                    variant={
                      filters.singleModeWeek === week ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSingleModeWeek(week)}
                  >
                    第 {week} 周
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 架构说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🎯 新架构优势</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            ✅ <strong>组件简洁</strong>：只有 {/* 计算组件行数 */}
            约100行，专注展示逻辑
          </p>
          <p>
            ✅ <strong>逻辑复用</strong>：DataService、KPIService
            可在任何地方调用
          </p>
          <p>
            ✅ <strong>易于测试</strong>：Service层是纯函数，可独立测试
          </p>
          <p>
            ✅ <strong>解耦合</strong>：组件不直接依赖Store，通过Hooks隔离
          </p>
          <p>
            ✅ <strong>可维护</strong>：职责分明，每层只做一件事
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 【旧架构对比】
 *
 * 如果使用旧架构，同样的功能需要：
 *
 * ```tsx
 * function OldArchitectureExample() {
 *   // 直接依赖Store（耦合度高）
 *   const rawData = useAppStore(s => s.rawData)
 *   const filters = useAppStore(s => s.filters)
 *   const updateFilters = useAppStore(s => s.updateFilters)
 *
 *   // 使用复杂的Hook（内部重复实现筛选逻辑）
 *   const filteredData = useFilteredData() // 150行筛选逻辑
 *   const kpiData = useKPI() // 又是150行筛选逻辑 + 计算逻辑
 *
 *   // 手动计算统计信息（逻辑分散）
 *   const stats = useMemo(() => {
 *     // 又是一遍统计逻辑
 *   }, [filteredData])
 *
 *   // ... 更多重复逻辑
 * }
 * ```
 *
 * 问题：
 * - ❌ 筛选逻辑重复3次（Store、useFilteredData、useKPI）
 * - ❌ 直接依赖Store，难以替换
 * - ❌ 业务逻辑散落各处，难以测试
 * - ❌ 组件职责不清，既负责展示又负责计算
 */
