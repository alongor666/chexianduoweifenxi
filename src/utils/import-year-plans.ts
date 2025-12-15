/**
 * 年度计划导入工具
 *
 * 提供浏览器控制台函数,用于将 year-plans.json 导入到系统目标中
 */

import { loadYearPlans } from '@/config/load-year-plans'
import { processAndSavePremiumTargets } from '@/store/utils/target-utils'
import type { PremiumTargets } from '@/types/insurance'

/**
 * 将年度计划导入到保费目标系统
 *
 * 使用方法（在浏览器控制台中执行）:
 * ```javascript
 * import('/utils/import-year-plans').then(m => m.importYearPlansToTargets())
 * ```
 *
 * @param year - 目标年份,默认为当前年份
 * @returns 导入后的目标对象
 */
export function importYearPlansToTargets(year?: number): PremiumTargets {
  try {
    // 加载年度计划
    const targets = loadYearPlans(year)

    // 保存到 LocalStorage
    processAndSavePremiumTargets(targets)

    console.log('✅ 年度计划已成功导入到系统目标')
    console.log('📊 导入数据概览:', {
      年份: targets.year,
      全公司总目标: `${(targets.overall / 10000).toFixed(2)}万元`,
      机构数量: Object.keys(targets.dimensions.thirdLevelOrganization.entries)
        .length,
      机构明细: targets.dimensions.thirdLevelOrganization.entries,
    })
    console.log('💡 请刷新页面以查看更新后的目标')

    return targets
  } catch (error) {
    console.error('❌ 导入年度计划失败:', error)
    throw error
  }
}

/**
 * 查看当前系统中的保费目标
 *
 * 使用方法（在浏览器控制台中执行）:
 * ```javascript
 * import('/utils/import-year-plans').then(m => m.viewCurrentTargets())
 * ```
 */
export function viewCurrentTargets(): void {
  try {
    const stored = window.localStorage.getItem('insurDashPremiumTargets')
    if (!stored) {
      console.log('📭 当前系统中没有保费目标数据')
      return
    }

    const targets = JSON.parse(stored) as PremiumTargets
    console.log('📊 当前系统目标:', {
      年份: targets.year,
      全公司总目标: `${(targets.overall / 10000).toFixed(2)}万元`,
      更新时间: targets.updatedAt,
      三级机构目标: targets.dimensions?.thirdLevelOrganization?.entries || {},
      业务类型目标: targets.byBusinessType || {},
    })
  } catch (error) {
    console.error('❌ 读取目标数据失败:', error)
  }
}

/**
 * 清除系统中的保费目标
 *
 * 使用方法（在浏览器控制台中执行）:
 * ```javascript
 * import('/utils/import-year-plans').then(m => m.clearTargets())
 * ```
 */
export function clearTargets(): void {
  if (
    confirm('确定要清除所有保费目标数据吗?此操作不可恢复。刷新页面后生效。')
  ) {
    window.localStorage.removeItem('insurDashPremiumTargets')
    console.log('✅ 保费目标数据已清除,请刷新页面')
  }
}

// 将函数挂载到全局 window 对象,方便在控制台中直接调用
if (typeof window !== 'undefined') {
  ;(window as any).importYearPlans = importYearPlansToTargets
  ;(window as any).viewTargets = viewCurrentTargets
  ;(window as any).clearTargets = clearTargets

  console.log(`
📦 年度计划导入工具已加载
可用命令:
  - importYearPlans()   # 导入年度计划到系统
  - viewTargets()       # 查看当前系统目标
  - clearTargets()      # 清除所有目标数据
  `)
}
