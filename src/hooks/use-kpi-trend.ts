/**
 * KPI 趋势数据 Hook
 * 用于获取KPI指标的历史趋势，供Sparkline使用
 */

import { useMemo, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { calculateKPIs } from "@/lib/calculations/kpi-engine";
import type { InsuranceRecord, FilterState } from "@/types/insurance";

/**
 * KPI趋势数据点
 */
export interface KPITrendPoint {
  week: number;
  year: number;
  value: number | null;
}

// 缓存机制
const trendCache = new Map<string, (number | null)[]>();
const CACHE_SIZE_LIMIT = 100;

/**
 * 生成缓存键
 */
function generateCacheKey(
  dataLength: number,
  kpiKey: string,
  limit: number,
  filtersHash: string,
): string {
  return `${dataLength}-${kpiKey}-${limit}-${filtersHash}`;
}

/**
 * 生成筛选器哈希
 */
function generateFiltersHash(filters: FilterState): string {
  const sortValues = <T>(values: T[]): T[] => [...values].sort();

  return JSON.stringify({
    years: sortValues(filters.years),
    weeks: sortValues(filters.weeks),
    organizations: sortValues(filters.organizations),
    insuranceTypes: sortValues(filters.insuranceTypes),
    businessTypes: sortValues(filters.businessTypes),
    coverageTypes: sortValues(filters.coverageTypes),
    customerCategories: sortValues(filters.customerCategories),
    vehicleGrades: sortValues(filters.vehicleGrades),
    terminalSources: sortValues(filters.terminalSources),
    isNewEnergy: filters.isNewEnergy,
    renewalStatuses: sortValues(filters.renewalStatuses),
  });
}

/**
 * 按周计算KPI趋势 - 性能优化版
 * @param data 保险数据
 * @param kpiKey KPI键名
 * @param limit 返回最近几周的数据（默认12周）
 * @returns 趋势数据数组，null表示该周无数据（断点）
 */
function calculateKPITrend(
  data: InsuranceRecord[],
  kpiKey: keyof ReturnType<typeof calculateKPIs>,
  limit = 12,
): (number | null)[] {
  if (!data || data.length === 0) {
    return [];
  }

  // 性能优化：限制最大处理周数
  const MAX_WEEKS_TO_PROCESS = 52;
  const effectiveLimit = Math.min(limit, MAX_WEEKS_TO_PROCESS);

  // 按年度和周次分组 - 优化版：避免重复创建数组
  const weeklyData = new Map<string, InsuranceRecord[]>();

  // 优化：使用传统for循环代替forEach，性能更好
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    const key = `${record.policy_start_year}-${record.week_number}`;
    const existing = weeklyData.get(key);
    if (existing) {
      existing.push(record);
    } else {
      weeklyData.set(key, [record]);
    }
  }

  // 获取所有周次并排序
  const weeks = Array.from(weeklyData.keys()).sort();

  // 取最近N周
  const recentWeeks = weeks.slice(-effectiveLimit);

  // 计算每周的KPI值
  // 优化：预分配数组大小，避免动态扩容
  const trendData: (number | null)[] = new Array(recentWeeks.length);

  // 优化：使用for循环代替map，减少函数调用开销
  for (let i = 0; i < recentWeeks.length; i++) {
    const weekKey = recentWeeks[i];
    const weekRecords = weeklyData.get(weekKey);

    if (!weekRecords || weekRecords.length === 0) {
      trendData[i] = null; // 该周无数据
      continue;
    }

    try {
      const kpi = calculateKPIs(weekRecords);
      const value = kpi[kpiKey];
      trendData[i] = typeof value === "number" ? value : null;
    } catch (error) {
      console.warn(`计算第 ${weekKey} 周的KPI时出错:`, error);
      trendData[i] = null;
    }
  }

  return trendData;
}

/**
 * 应用筛选条件 - 性能优化版
 */
function applyFilters(
  data: InsuranceRecord[],
  filters: FilterState,
): InsuranceRecord[] {
  // 性能优化：预先转换为Set以加速查找（O(1) vs O(n)）
  const yearsSet = filters.years.length > 0 ? new Set(filters.years) : null;
  const weeksSet = filters.weeks.length > 0 ? new Set(filters.weeks) : null;
  const orgsSet =
    filters.organizations.length > 0 ? new Set(filters.organizations) : null;
  const insTypesSet =
    filters.insuranceTypes.length > 0 ? new Set(filters.insuranceTypes) : null;
  const bizTypesSet =
    filters.businessTypes.length > 0 ? new Set(filters.businessTypes) : null;
  const covTypesSet =
    filters.coverageTypes.length > 0 ? new Set(filters.coverageTypes) : null;
  const custCatsSet =
    filters.customerCategories.length > 0
      ? new Set(filters.customerCategories)
      : null;
  const vehGradesSet =
    filters.vehicleGrades.length > 0 ? new Set(filters.vehicleGrades) : null;
  const termSourcesSet =
    filters.terminalSources.length > 0
      ? new Set(filters.terminalSources)
      : null;
  const renewalStatusesSet =
    filters.renewalStatuses.length > 0
      ? new Set(filters.renewalStatuses)
      : null;

  return data.filter((record) => {
    // 年度筛选
    if (yearsSet && !yearsSet.has(record.policy_start_year)) {
      return false;
    }

    // 周次筛选
    if (weeksSet && !weeksSet.has(record.week_number)) {
      return false;
    }

    // 机构筛选
    if (orgsSet && !orgsSet.has(record.third_level_organization)) {
      return false;
    }

    // 险种筛选
    if (insTypesSet && !insTypesSet.has(record.insurance_type)) {
      return false;
    }

    // 业务类型筛选
    if (bizTypesSet && !bizTypesSet.has(record.business_type_category)) {
      return false;
    }

    // 险别筛选
    if (covTypesSet && !covTypesSet.has(record.coverage_type)) {
      return false;
    }

    // 客户分类筛选
    if (custCatsSet && !custCatsSet.has(record.customer_category_3)) {
      return false;
    }

    // 车险评级筛选
    if (
      vehGradesSet &&
      record.vehicle_insurance_grade &&
      !vehGradesSet.has(record.vehicle_insurance_grade)
    ) {
      return false;
    }

    // 终端来源筛选
    if (termSourcesSet && !termSourcesSet.has(record.terminal_source)) {
      return false;
    }

    // 新能源车筛选
    if (
      filters.isNewEnergy !== null &&
      record.is_new_energy_vehicle !== filters.isNewEnergy
    ) {
      return false;
    }

    // 续保状态筛选
    if (renewalStatusesSet && !renewalStatusesSet.has(record.renewal_status)) {
      return false;
    }

    return true;
  });
}

/**
 * 使用KPI趋势数据的Hook
 * @param kpiKey KPI键名
 * @param options 选项
 */
export function useKPITrend(
  kpiKey: keyof ReturnType<typeof calculateKPIs>,
  options: {
    /**
     * 显示最近几周的数据
     */
    weeks?: number;
    /**
     * 是否只使用筛选后的数据
     */
    useFilteredData?: boolean;
  } = {},
) {
  const { weeks = 12, useFilteredData = true } = options;

  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);

  // 使用 ref 来存储上一次的计算结果，避免不必要的重新计算
  const lastResultRef = useRef<{ key: string; data: (number | null)[] } | null>(
    null,
  );

  const trendData = useMemo(() => {
    // 生成筛选器哈希
    const filtersHash = generateFiltersHash(filters);
    const cacheKey = generateCacheKey(
      rawData.length,
      kpiKey as string,
      weeks,
      filtersHash,
    );

    // 检查是否与上次计算相同
    if (lastResultRef.current && lastResultRef.current.key === cacheKey) {
      return lastResultRef.current.data;
    }

    // 检查缓存
    if (trendCache.has(cacheKey)) {
      const cachedResult = trendCache.get(cacheKey)!;
      lastResultRef.current = { key: cacheKey, data: cachedResult };
      return cachedResult;
    }

    let dataToUse = rawData;

    // 如果启用了筛选，应用筛选条件
    if (useFilteredData) {
      dataToUse = applyFilters(rawData, filters);
    }

    const result = calculateKPITrend(dataToUse, kpiKey, weeks);

    // 缓存结果（限制缓存大小）
    if (trendCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = trendCache.keys().next().value;
      if (firstKey) {
        trendCache.delete(firstKey);
      }
    }
    trendCache.set(cacheKey, result);

    // 更新 ref
    lastResultRef.current = { key: cacheKey, data: result };

    return result;
  }, [rawData, filters, kpiKey, weeks, useFilteredData]);

  return trendData;
}

/**
 * 批量获取多个KPI的趋势数据
 * 优化版本：避免重复计算筛选后的数据
 */
export function useMultipleKPITrends(
  kpiKeys: Array<keyof ReturnType<typeof calculateKPIs>>,
  options: {
    weeks?: number;
    useFilteredData?: boolean;
  } = {},
) {
  const { weeks = 12, useFilteredData = true } = options;
  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);

  const trends = useMemo(() => {
    const result: Record<string, number[]> = {};

    // 只计算一次筛选后的数据
    let dataToUse = rawData;
    if (useFilteredData) {
      dataToUse = applyFilters(rawData, filters);
    }

    // 为每个KPI计算趋势
    kpiKeys.forEach((kpiKey: keyof ReturnType<typeof calculateKPIs>) => {
      result[kpiKey as string] = calculateKPITrend(
        dataToUse,
        kpiKey,
        weeks,
      ) as number[];
    });

    return result;
  }, [rawData, filters, kpiKeys, weeks, useFilteredData]);

  return trends;
}
