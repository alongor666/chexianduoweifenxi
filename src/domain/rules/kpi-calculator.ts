/**
 * Domain 层 - KPI 计算规则（统一版本）
 *
 * 核心规则：
 * - 纯函数（无副作用）
 * - 不依赖任何外部框架
 * - 业务逻辑集中且透明
 * - 统一所有散落的KPI计算逻辑
 *
 * 这个模块合并了来自以下文件的逻辑：
 * - src/lib/calculations/kpi-engine.ts
 * - src/services/KPIService.ts
 * - 原版 src/domain/rules/kpi-calculator.ts
 *
 * 现在作为 KPI 计算的唯一真相源
 */

// 重新导出统一版本的所有功能
export {
  // 类型定义
  type KPIResult,
  type KPICalculationOptions,

  // 常量
  WORKING_WEEKS_PER_YEAR,

  // 聚合函数
  aggregateInsuranceRecords,

  // 率值指标计算
  calculateLossRatio,
  calculateExpenseRatio,
  calculateMaturityRatio,
  calculateContributionMarginRatio,
  calculateVariableCostRatio,
  calculateMaturedClaimRatio,
  calculateAutonomyCoefficient,
  calculatePremiumProgress,

  // 均值指标计算
  calculateAveragePremium,
  calculateAverageClaim,
  calculateAverageExpense,
  calculateAverageContribution,

  // 核心计算函数
  calculateKPIs,
  calculateIncrementKPIs,
  getEmptyKPIResult,

  // KPI 引擎类（带缓存）
  KPIEngine,
  kpiEngine,
  calculateKPIsWithEngine,
} from './kpi-calculator-enhanced'
