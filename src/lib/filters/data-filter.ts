/**
 * 数据筛选工具
 * 统一数据筛选逻辑
 */

import type { InsuranceRecord } from '@/types/insurance';

export interface FilterOptions {
  // 时间筛选
  weekNumbers?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  policyYearRange?: {
    start: number;
    end: number;
  };

  // 业务类型筛选
  businessTypes?: string[];
  insuranceTypes?: ('商业险' | '交强险')[];

  // 车辆属性筛选
  vehicleTypes?: string[];
  vehicleMakes?: string[];
  isNewEnergy?: boolean | null;
  isTransferred?: boolean | null;
  vehicleAgeRange?: {
    min: number;
    max: number;
  };

  // 金额筛选
  premiumRange?: {
    min: number;
    max: number;
  };
  claimAmountRange?: {
    min: number;
    max: number;
  };

  // 渠道筛选
  salesChannels?: string[];
  branches?: {
    one?: string[];
    two?: string[];
    three?: string[];
  };

  // 文本搜索
  searchText?: string;
  searchFields?: (keyof InsuranceRecord)[];
}

/**
 * 创建筛选函数
 */
export function createFilterFunction(options: FilterOptions) {
  return (record: InsuranceRecord): boolean => {
    // 周次筛选
    if (options.weekNumbers && options.weekNumbers.length > 0) {
      if (!record.week_number || !options.weekNumbers.includes(record.week_number)) {
        return false;
      }
    }

    // 日期范围筛选
    if (options.dateRange) {
      const recordDate = new Date(record.snapshot_date);
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      if (recordDate < startDate || recordDate > endDate) {
        return false;
      }
    }

    // 保单年份筛选
    if (options.policyYearRange) {
      const { start, end } = options.policyYearRange;
      if (record.policy_start_year < start || record.policy_start_year > end) {
        return false;
      }
    }

    // 业务类型筛选
    if (options.businessTypes && options.businessTypes.length > 0) {
      if (!record.business_type || !options.businessTypes.includes(record.business_type)) {
        return false;
      }
    }

    // 保险类型筛选
    if (options.insuranceTypes && options.insuranceTypes.length > 0) {
      if (!record.insurance_type || !options.insuranceTypes.includes(record.insurance_type)) {
        return false;
      }
    }

    // 车辆类型筛选
    if (options.vehicleTypes && options.vehicleTypes.length > 0) {
      if (!record.vehicle_type || !options.vehicleTypes.includes(record.vehicle_type)) {
        return false;
      }
    }

    // 品牌筛选
    if (options.vehicleMakes && options.vehicleMakes.length > 0) {
      if (!record.vehicle_make || !options.vehicleMakes.includes(record.vehicle_make)) {
        return false;
      }
    }

    // 新能源车筛选
    if (options.isNewEnergy !== undefined && options.isNewEnergy !== null) {
      if (record.is_new_energy_vehicle !== options.isNewEnergy) {
        return false;
      }
    }

    // 过户车筛选
    if (options.isTransferred !== undefined && options.isTransferred !== null) {
      if (record.is_transferred_vehicle !== options.isTransferred) {
        return false;
      }
    }

    // 车龄筛选
    if (options.vehicleAgeRange) {
      const { min, max } = options.vehicleAgeRange;
      if (record.vehicle_age < min || record.vehicle_age > max) {
        return false;
      }
    }

    // 保费范围筛选
    if (options.premiumRange) {
      const { min, max } = options.premiumRange;
      if ((record.total_premium || 0) < min || (record.total_premium || 0) > max) {
        return false;
      }
    }

    // 理赔金额筛选
    if (options.claimAmountRange) {
      const { min, max } = options.claimAmountRange;
      if ((record.claim_amount || 0) < min || (record.claim_amount || 0) > max) {
        return false;
      }
    }

    // 销售渠道筛选
    if (options.salesChannels && options.salesChannels.length > 0) {
      if (!record.sales_channel || !options.salesChannels.includes(record.sales_channel)) {
        return false;
      }
    }

    // 机构筛选
    if (options.branches) {
      if (options.branches.one && options.branches.one.length > 0) {
        if (!record.one_level_branch || !options.branches.one.includes(record.one_level_branch)) {
          return false;
        }
      }
      if (options.branches.two && options.branches.two.length > 0) {
        if (!record.two_level_branch || !options.branches.two.includes(record.two_level_branch)) {
          return false;
        }
      }
      if (options.branches.three && options.branches.three.length > 0) {
        if (!record.three_level_branch || !options.branches.three.includes(record.three_level_branch)) {
          return false;
        }
      }
    }

    // 文本搜索
    if (options.searchText && options.searchText.trim()) {
      const searchLower = options.searchText.toLowerCase().trim();
      const fields = options.searchFields || [
        'policyholder',
        'policy_number',
        'license_plate',
        'vehicle_make',
        'vehicle_model',
        'insurance_company',
      ];

      const matched = fields.some(field => {
        const value = record[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(searchLower);
      });

      if (!matched) {
        return false;
      }
    }

    return true;
  };
}

/**
 * 应用筛选
 */
export function applyFilter(
  records: InsuranceRecord[],
  options: FilterOptions
): InsuranceRecord[] {
  const filterFn = createFilterFunction(options);
  return records.filter(filterFn);
}

/**
 * 获取筛选摘要
 */
export function getFilterSummary(
  records: InsuranceRecord[],
  filteredRecords: InsuranceRecord[],
  options: FilterOptions
): {
  totalRecords: number;
  filteredRecords: number;
  filterRate: number;
  activeFilters: string[];
} {
  const totalRecords = records.length;
  const filteredCount = filteredRecords.length;
  const filterRate = totalRecords > 0 ? (filteredCount / totalRecords) * 100 : 0;

  const activeFilters: string[] = [];

  if (options.weekNumbers && options.weekNumbers.length > 0) {
    activeFilters.push(`周次 (${options.weekNumbers.length})`);
  }
  if (options.businessTypes && options.businessTypes.length > 0) {
    activeFilters.push(`业务类型 (${options.businessTypes.length})`);
  }
  if (options.vehicleTypes && options.vehicleTypes.length > 0) {
    activeFilters.push(`车辆类型 (${options.vehicleTypes.length})`);
  }
  if (options.salesChannels && options.salesChannels.length > 0) {
    activeFilters.push(`销售渠道 (${options.salesChannels.length})`);
  }
  if (options.searchText) {
    activeFilters.push(`搜索: "${options.searchText}"`);
  }

  return {
    totalRecords,
    filteredRecords: filteredCount,
    filterRate,
    activeFilters,
  };
}

/**
 * 获取筛选选项
 */
export function getFilterOptions(records: InsuranceRecord[]) {
  const businessTypes = [...new Set(records.map(r => r.business_type).filter(Boolean))];
  const vehicleTypes = [...new Set(records.map(r => r.vehicle_type).filter(Boolean))];
  const vehicleMakes = [...new Set(records.map(r => r.vehicle_make).filter(Boolean))];
  const salesChannels = [...new Set(records.map(r => r.sales_channel).filter(Boolean))];
  const weekNumbers = [...new Set(records.map(r => r.week_number).filter(Boolean))].sort((a, b) => a - b);
  const oneLevelBranches = [...new Set(records.map(r => r.one_level_branch).filter(Boolean))];
  const twoLevelBranches = [...new Set(records.map(r => r.two_level_branch).filter(Boolean))];
  const threeLevelBranches = [...new Set(records.map(r => r.three_level_branch).filter(Boolean))];

  return {
    businessTypes,
    vehicleTypes,
    vehicleMakes,
    salesChannels,
    weekNumbers,
    branches: {
      one: oneLevelBranches,
      two: twoLevelBranches,
      three: threeLevelBranches,
    },
  };
}