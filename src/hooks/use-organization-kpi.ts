/**
 * 机构 KPI Hook
 * 用于获取特定机构的 KPI 数据
 */

import { useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { kpiEngine } from "@/lib/calculations/kpi-engine";
import type { KPIResult, InsuranceRecord } from "@/types/insurance";
import { safeMax } from "@/lib/utils/array-utils";

/**
 * 获取指定机构的KPI数据
 * @param organizationName 机构名称
 * @returns KPI计算结果
 */
export function useOrganizationKPI(organizationName: string): KPIResult | null {
  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);
  const premiumTargets = useAppStore((state) => state.premiumTargets);

  const kpiResult = useMemo(() => {
    // 筛选该机构的数据，同时应用其他筛选条件（除了机构筛选）
    const orgData = rawData.filter((record: InsuranceRecord) => {
      // 机构筛选 - 仅该机构
      if (record.third_level_organization !== organizationName) {
        return false;
      }

      // 应用年份筛选
      if (
        filters.years.length > 0 &&
        !filters.years.includes(record.policy_start_year)
      ) {
        return false;
      }

      // 应用周次筛选（单周模式）
      if (
        filters.viewMode === "single" &&
        filters.singleModeWeek !== null &&
        record.week_number !== filters.singleModeWeek
      ) {
        return false;
      }

      // 趋势模式不需要额外的周次筛选，直接使用所有数据

      // 应用保险类型筛选
      if (
        filters.insuranceTypes.length > 0 &&
        !filters.insuranceTypes.includes(record.insurance_type)
      ) {
        return false;
      }

      // 应用业务类型筛选
      if (
        filters.businessTypes.length > 0 &&
        !filters.businessTypes.includes(record.business_type_category)
      ) {
        return false;
      }

      // 应用承保类型筛选
      if (
        filters.coverageTypes.length > 0 &&
        !filters.coverageTypes.includes(record.coverage_type)
      ) {
        return false;
      }

      // 应用客户分类筛选
      if (
        filters.customerCategories.length > 0 &&
        !filters.customerCategories.includes(record.customer_category_3)
      ) {
        return false;
      }

      // 应用车级筛选
      if (
        filters.vehicleGrades.length > 0 &&
        record.vehicle_insurance_grade &&
        !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
      ) {
        return false;
      }

      // 应用终端来源筛选
      if (
        filters.terminalSources.length > 0 &&
        !filters.terminalSources.includes(record.terminal_source)
      ) {
        return false;
      }

      // 应用新能源筛选
      if (
        filters.isNewEnergy !== null &&
        record.is_new_energy_vehicle !== filters.isNewEnergy
      ) {
        return false;
      }

      // 应用续保状态筛选
      if (
        filters.renewalStatuses.length > 0 &&
        !filters.renewalStatuses.includes(record.renewal_status)
      ) {
        return false;
      }

      return true;
    });

    // 如果没有数据，返回null
    if (orgData.length === 0) {
      return null;
    }

    // 获取该机构的目标值
    const orgTarget =
      premiumTargets?.dimensions.thirdLevelOrganization.entries[
        organizationName
      ];

    // 计算当前年份
    const currentYear =
      filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear();

    // 获取当前周次
    const currentWeek =
      filters.viewMode === "single" ? filters.singleModeWeek : null;

    // 计算KPI
    return kpiEngine.calculate(orgData, {
      annualTargetYuan: orgTarget ?? undefined,
      mode: "current",
      currentWeekNumber: currentWeek ?? undefined,
      year: currentYear,
    });
  }, [
    rawData,
    organizationName,
    filters.years,
    filters.viewMode,
    filters.singleModeWeek,
    filters.insuranceTypes,
    filters.businessTypes,
    filters.coverageTypes,
    filters.customerCategories,
    filters.vehicleGrades,
    filters.terminalSources,
    filters.isNewEnergy,
    filters.renewalStatuses,
    premiumTargets,
  ]);

  return kpiResult;
}

/**
 * 批量获取多个机构的KPI数据
 * @param organizationNames 机构名称列表
 * @returns 机构名称到KPI的映射
 */
export function useMultipleOrganizationKPIs(
  organizationNames: string[],
): Map<string, KPIResult | null> {
  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);
  const premiumTargets = useAppStore((state) => state.premiumTargets);

  const kpiMap = useMemo(() => {
    const resultMap = new Map<string, KPIResult | null>();

    // 计算当前年份
    const currentYear =
      filters.years.length > 0
        ? safeMax(filters.years)
        : new Date().getFullYear();

    // 获取当前周次
    const currentWeek =
      filters.viewMode === "single" ? filters.singleModeWeek : null;

    // 为每个机构计算KPI
    organizationNames.forEach((orgName) => {
      // 筛选该机构的数据
      const orgData = rawData.filter((record: InsuranceRecord) => {
        // 机构筛选
        if (record.third_level_organization !== orgName) {
          return false;
        }

        // 应用其他筛选条件（同上）
        if (
          filters.years.length > 0 &&
          !filters.years.includes(record.policy_start_year)
        ) {
          return false;
        }

        if (
          filters.viewMode === "single" &&
          filters.singleModeWeek !== null &&
          record.week_number !== filters.singleModeWeek
        ) {
          return false;
        }

        // 趋势模式不需要额外的周次筛选，直接使用所有数据

        if (
          filters.insuranceTypes.length > 0 &&
          !filters.insuranceTypes.includes(record.insurance_type)
        ) {
          return false;
        }

        if (
          filters.businessTypes.length > 0 &&
          !filters.businessTypes.includes(record.business_type_category)
        ) {
          return false;
        }

        if (
          filters.coverageTypes.length > 0 &&
          !filters.coverageTypes.includes(record.coverage_type)
        ) {
          return false;
        }

        if (
          filters.customerCategories.length > 0 &&
          !filters.customerCategories.includes(record.customer_category_3)
        ) {
          return false;
        }

        if (
          filters.vehicleGrades.length > 0 &&
          record.vehicle_insurance_grade &&
          !filters.vehicleGrades.includes(record.vehicle_insurance_grade)
        ) {
          return false;
        }

        if (
          filters.terminalSources.length > 0 &&
          !filters.terminalSources.includes(record.terminal_source)
        ) {
          return false;
        }

        if (
          filters.isNewEnergy !== null &&
          record.is_new_energy_vehicle !== filters.isNewEnergy
        ) {
          return false;
        }

        if (
          filters.renewalStatuses.length > 0 &&
          !filters.renewalStatuses.includes(record.renewal_status)
        ) {
          return false;
        }

        return true;
      });

      // 如果没有数据，设置为null
      if (orgData.length === 0) {
        resultMap.set(orgName, null);
        return;
      }

      // 获取该机构的目标值
      const orgTarget =
        premiumTargets?.dimensions.thirdLevelOrganization.entries[orgName];

      // 计算KPI
      const kpi = kpiEngine.calculate(orgData, {
        annualTargetYuan: orgTarget ?? undefined,
        mode: "current",
        currentWeekNumber: currentWeek ?? undefined,
        year: currentYear,
      });

      resultMap.set(orgName, kpi);
    });

    return resultMap;
  }, [
    rawData,
    organizationNames,
    filters.years,
    filters.viewMode,
    filters.singleModeWeek,
    filters.insuranceTypes,
    filters.businessTypes,
    filters.coverageTypes,
    filters.customerCategories,
    filters.vehicleGrades,
    filters.terminalSources,
    filters.isNewEnergy,
    filters.renewalStatuses,
    premiumTargets,
  ]);

  return kpiMap;
}
