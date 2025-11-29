/**
 * KPI 计算工具
 * 统一所有 KPI 计算逻辑，避免重复代码
 */

import type { InsuranceRecord } from '@/types/insurance';

export interface KPIData {
  totalPremium: number;
  totalCommercialPremium: number;
  totalCompulsoryPremium: number;
  totalVehicleTax: number;
  totalRecords: number;
  avgPremium: number;
  claimAmount: number;
  claimRatio: number;
  renewalRate: number;
  newVehicleRate: number;
  transferredVehicleRate: number;
  newEnergyRate: number;
}

export interface KPITargets {
  annualTargetYuan?: number | null;
  weeklyTargets?: Record<number, number>;
}

export interface KPICalculationOptions {
  weekNumber?: number;
  includeWeeks?: number[];
  excludeWeeks?: number[];
  businessType?: string;
  isNewEnergy?: boolean;
  isTransferred?: boolean;
}

/**
 * 计算基础 KPI 数据
 */
export function calculateKPI(
  records: InsuranceRecord[],
  options: KPICalculationOptions = {}
): KPIData {
  let filteredRecords = records;

  // 按周次筛选
  if (options.weekNumber) {
    filteredRecords = filteredRecords.filter(r => r.week_number === options.weekNumber);
  }

  if (options.includeWeeks && options.includeWeeks.length > 0) {
    filteredRecords = filteredRecords.filter(r =>
      options.includeWeeks!.includes(r.week_number || 0)
    );
  }

  if (options.excludeWeeks && options.excludeWeeks.length > 0) {
    filteredRecords = filteredRecords.filter(r =>
      !options.excludeWeeks!.includes(r.week_number || 0)
    );
  }

  // 按业务类型筛选
  if (options.businessType) {
    filteredRecords = filteredRecords.filter(r => r.business_type === options.businessType);
  }

  // 按新能源车筛选
  if (options.isNewEnergy !== undefined) {
    filteredRecords = filteredRecords.filter(r => r.is_new_energy_vehicle === options.isNewEnergy);
  }

  // 按过户车筛选
  if (options.isTransferred !== undefined) {
    filteredRecords = filteredRecords.filter(r => r.is_transferred_vehicle === options.isTransferred);
  }

  const totalRecords = filteredRecords.length;

  if (totalRecords === 0) {
    return {
      totalPremium: 0,
      totalCommercialPremium: 0,
      totalCompulsoryPremium: 0,
      totalVehicleTax: 0,
      totalRecords: 0,
      avgPremium: 0,
      claimAmount: 0,
      claimRatio: 0,
      renewalRate: 0,
      newVehicleRate: 0,
      transferredVehicleRate: 0,
      newEnergyRate: 0,
    };
  }

  // 计算基础指标
  const totalPremium = filteredRecords.reduce((sum, r) => sum + (r.total_premium || 0), 0);
  const totalCommercialPremium = filteredRecords.reduce((sum, r) => sum + (r.commercial_insurance_premium || 0), 0);
  const totalCompulsoryPremium = filteredRecords.reduce((sum, r) => sum + (r.compulsory_insurance_premium || 0), 0);
  const totalVehicleTax = filteredRecords.reduce((sum, r) => sum + (r.vehicle_tax || 0), 0);
  const avgPremium = totalPremium / totalRecords;

  // 计算理赔相关指标
  const claimAmount = filteredRecords.reduce((sum, r) => sum + (r.claim_amount || 0), 0);
  const claimRatio = totalPremium > 0 ? claimAmount / totalPremium : 0;

  // 计算续保率
  const renewalRecords = filteredRecords.filter(r => r.renewal_type === '续保');
  const renewalRate = renewalRecords.length / totalRecords;

  // 计算新车比率
  const currentYear = new Date().getFullYear();
  const newVehicleRecords = filteredRecords.filter(r =>
    r.policy_start_year === currentYear
  );
  const newVehicleRate = newVehicleRecords.length / totalRecords;

  // 计算过户车比率
  const transferredRecords = filteredRecords.filter(r => r.is_transferred_vehicle);
  const transferredVehicleRate = transferredRecords.length / totalRecords;

  // 计算新能源车比率
  const newEnergyRecords = filteredRecords.filter(r => r.is_new_energy_vehicle);
  const newEnergyRate = newEnergyRecords.length / totalRecords;

  return {
    totalPremium,
    totalCommercialPremium,
    totalCompulsoryPremium,
    totalVehicleTax,
    totalRecords,
    avgPremium,
    claimAmount,
    claimRatio,
    renewalRate,
    newVehicleRate,
    transferredVehicleRate,
    newEnergyRate,
  };
}

/**
 * 计算目标完成率
 */
export function calculateTargetCompletion(
  actual: number,
  target: number | null | undefined
): {
  completed: number;
  remaining: number;
  completionRate: number;
  isCompleted: boolean;
} {
  if (!target || target <= 0) {
    return {
      completed: actual,
      remaining: 0,
      completionRate: 0,
      isCompleted: false,
    };
  }

  const completionRate = Math.min((actual / target) * 100, 100);
  const remaining = Math.max(target - actual, 0);

  return {
    completed: actual,
    remaining,
    completionRate,
    isCompleted: actual >= target,
  };
}

/**
 * 计算周度目标
 */
export function getWeeklyTarget(weekNumber: number, targets?: KPITargets): number {
  if (targets?.weeklyTargets) {
    return targets.weeklyTargets[weekNumber] || 0;
  }

  // 默认周度目标（如果没有提供）
  const defaultWeeklyTargets: Record<number, number> = {
    1: 1800000, 2: 3800000, 3: 5800000, 4: 7800000,
    5: 9800000, 6: 11800000, 7: 13800000, 8: 15800000,
    9: 17800000, 10: 19800000, 11: 21800000, 12: 23800000,
    13: 25800000, 14: 27800000, 15: 29800000, 16: 31800000,
    17: 33800000, 18: 35800000, 19: 37800000, 20: 39800000,
    21: 41800000, 22: 43800000, 23: 45800000, 24: 47800000,
    25: 49800000, 26: 51800000, 27: 53800000, 28: 55800000,
    29: 57800000, 30: 59800000, 31: 61800000, 32: 63800000,
    33: 65800000, 34: 67800000, 35: 69800000, 36: 71800000,
    37: 73800000, 38: 75800000, 39: 77800000, 40: 79800000,
    41: 81800000, 42: 83800000, 43: 85800000, 44: 87800000,
    45: 89800000, 46: 91800000, 47: 93800000, 48: 95800000,
    49: 97800000, 50: 99800000, 51: 101800000, 52: 103800000,
  };

  return defaultWeeklyTargets[weekNumber] || 0;
}

/**
 * 计算同比/环比增长率
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): {
  absolute: number;
  percentage: number;
  isGrowth: boolean;
} {
  if (previous === 0) {
    return {
      absolute: current,
      percentage: current > 0 ? 100 : 0,
      isGrowth: current > 0,
    };
  }

  const absolute = current - previous;
  const percentage = (absolute / previous) * 100;

  return {
    absolute,
    percentage,
    isGrowth: absolute > 0,
  };
}