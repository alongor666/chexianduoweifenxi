/**
 * 评级筛选器可见性逻辑
 * 根据客户类别和业务类型判断应该显示哪些评级筛选器
 */

import type { FilterState } from '@/types/insurance'

/**
 * 客车相关的客户类别
 */
export const PASSENGER_CUSTOMER_CATEGORIES = [
  '非营业个人客车',
  '非营业企业客车',
  '非营业机关客车',
  '营业出租租赁',
  '营业公路客运',
  '营业城市公交',
] as const

/**
 * 客车相关的业务类型
 */
export const PASSENGER_BUSINESS_TYPES = [
  '非营业客车新车',
  '非营业客车旧车非过户',
  '非营业客车旧车过户车',
  '出租车',
  '网约车',
] as const

/**
 * 小货车相关的业务类型（9吨以下）
 */
export const SMALL_TRUCK_BUSINESS_TYPES = [
  '2吨以下营业货车',
  '2-9吨营业货车',
  '非营业货车新车',
  '非营业货车旧车',
] as const

/**
 * 大货车相关的业务类型（9吨以上）
 */
export const LARGE_TRUCK_BUSINESS_TYPES = [
  '9-10吨营业货车',
  '10吨以上-普货',
  '10吨以上-牵引',
  '自卸',
] as const

/**
 * 评级筛选器可见性配置
 */
export interface RatingVisibility {
  /** 是否显示车险分等级（客车） */
  showVehicleGrade: boolean
  /** 是否显示高速风险等级（客车） */
  showHighwayRisk: boolean
  /** 是否显示小货车评分（9吨以下货车） */
  showSmallTruck: boolean
  /** 是否显示大货车评分（9吨以上货车） */
  showLargeTruck: boolean
}

/**
 * 判断当前筛选条件是否包含客车类型
 * @param filters - 当前筛选器状态
 * @returns 是否应显示客车相关评级（车险分等级、高速风险等级）
 */
export function shouldShowPassengerRatings(
  filters: Pick<FilterState, 'customerCategories' | 'businessTypes'>
): boolean {
  const hasCustomerFilter = filters.customerCategories.length > 0
  const hasBusinessTypeFilter = filters.businessTypes.length > 0

  // 如果没有选择任何客户类别或业务类型，默认显示
  if (!hasCustomerFilter && !hasBusinessTypeFilter) {
    return true
  }

  // 检查是否选择了客车相关的客户类别
  const hasPassengerCustomer = filters.customerCategories.some(cat =>
    PASSENGER_CUSTOMER_CATEGORIES.includes(
      cat as (typeof PASSENGER_CUSTOMER_CATEGORIES)[number]
    )
  )

  // 检查是否选择了客车相关的业务类型
  const hasPassengerBusiness = filters.businessTypes.some(type =>
    PASSENGER_BUSINESS_TYPES.includes(
      type as (typeof PASSENGER_BUSINESS_TYPES)[number]
    )
  )

  return hasPassengerCustomer || hasPassengerBusiness
}

/**
 * 判断当前筛选条件是否包含小货车类型（9吨以下）
 * @param filters - 当前筛选器状态
 * @returns 是否应显示小货车评分
 */
export function shouldShowSmallTruckRating(
  filters: Pick<FilterState, 'businessTypes'>
): boolean {
  const hasBusinessTypeFilter = filters.businessTypes.length > 0

  // 如果没有选择业务类型，默认显示
  if (!hasBusinessTypeFilter) {
    return true
  }

  // 检查是否选择了小货车相关的业务类型
  return filters.businessTypes.some(type =>
    SMALL_TRUCK_BUSINESS_TYPES.includes(
      type as (typeof SMALL_TRUCK_BUSINESS_TYPES)[number]
    )
  )
}

/**
 * 判断当前筛选条件是否包含大货车类型（9吨以上）
 * @param filters - 当前筛选器状态
 * @returns 是否应显示大货车评分
 */
export function shouldShowLargeTruckRating(
  filters: Pick<FilterState, 'businessTypes'>
): boolean {
  const hasBusinessTypeFilter = filters.businessTypes.length > 0

  // 如果没有选择业务类型，默认显示
  if (!hasBusinessTypeFilter) {
    return true
  }

  // 检查是否选择了大货车相关的业务类型
  return filters.businessTypes.some(type =>
    LARGE_TRUCK_BUSINESS_TYPES.includes(
      type as (typeof LARGE_TRUCK_BUSINESS_TYPES)[number]
    )
  )
}

/**
 * 获取所有评级筛选器的可见性配置
 * @param filters - 当前筛选器状态
 * @returns 评级筛选器可见性配置对象
 */
export function getRatingVisibility(
  filters: Pick<FilterState, 'customerCategories' | 'businessTypes'>
): RatingVisibility {
  const showPassenger = shouldShowPassengerRatings(filters)

  return {
    showVehicleGrade: showPassenger,
    showHighwayRisk: showPassenger,
    showSmallTruck: shouldShowSmallTruckRating(filters),
    showLargeTruck: shouldShowLargeTruckRating(filters),
  }
}
