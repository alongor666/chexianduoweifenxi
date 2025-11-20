/**
 * 主题分析模块 - 常量定义
 */

import type { PremiumDimensionKey } from '@/hooks/use-premium-dimension-analysis'
import type { LossDimensionKey } from '@/hooks/use-loss-dimension-analysis'

/**
 * 保费维度选项
 */
export const PREMIUM_DIMENSION_OPTIONS: Array<{
  value: PremiumDimensionKey
  label: string
}> = [
  { value: 'customer_category_3', label: '客户类别' },
  { value: 'business_type_category', label: '业务类型' },
  { value: 'third_level_organization', label: '三级机构' },
  { value: 'insurance_type', label: '险种类型' },
  { value: 'is_new_energy_vehicle', label: '能源类型' },
  { value: 'is_transferred_vehicle', label: '过户车状态' },
  { value: 'renewal_status', label: '新续转状态' },
]

/**
 * 默认保费维度
 */
export const DEFAULT_PREMIUM_DIMENSION: PremiumDimensionKey = 'customer_category_3'

/**
 * 赔付维度选项
 */
export const LOSS_DIMENSION_OPTIONS: Array<{
  value: LossDimensionKey
  label: string
}> = [
  { value: 'customer_category_3', label: '客户类别' },
  { value: 'business_type_category', label: '业务类型' },
  { value: 'third_level_organization', label: '三级机构' },
  { value: 'insurance_type', label: '险种类型' },
  { value: 'is_new_energy_vehicle', label: '能源类型' },
  { value: 'is_transferred_vehicle', label: '过户车状态' },
  { value: 'renewal_status', label: '新转续状态' },
]

/**
 * 默认赔付维度
 */
export const DEFAULT_LOSS_DIMENSION: LossDimensionKey = 'customer_category_3'
