export const CANONICAL_CUSTOMER_CATEGORIES: string[] = [
  '挂车',
  '摩托车',
  '特种车',
  '营业公路客运',
  '营业出租租赁',
  '营业城市公交',
  '营业货车',
  '非营业个人客车',
  '非营业企业客车',
  '非营业机关客车',
  '非营业货车',
]

export const CANONICAL_BUSINESS_TYPES: string[] = [
  '非营业客车新车',
  '非营业客车旧车非过户',
  '非营业客车旧车过户',
  '1吨以下非营业货车',
  '1–2吨非营业货车',
  '2吨以下营业货车',
  '2–9吨营业货车',
  '9–10吨营业货车',
  '10吨以上营业货车（普货）',
  '10吨以上营业货车（牵引）',
  '自卸车',
  '特种车',
  '其他营业货车',
  '摩托车',
  '出租车',
  '网约车',
]

// 新增：险种、险别组合、新续转状态的 Canonical 集合
export const CANONICAL_INSURANCE_TYPES: string[] = ['商业险', '交强险']

export const CANONICAL_COVERAGE_TYPES: string[] = ['主全', '交三', '单交']

export const CANONICAL_RENEWAL_STATUSES: string[] = ['新保', '续保', '转保']

// 新增：终端来源 Canonical 集合（8项）
export const CANONICAL_TERMINAL_SOURCES: string[] = [
  '0101柜面',
  '0106移动展业(App)',
  '0107B2B',
  '0110融合销售',
  '0112AI出单',
  '0201PC',
  '0202APP',
  '0301电销',
]

// 新增：三级机构 Canonical 集合（13项）
export const CANONICAL_THIRD_LEVEL_ORGANIZATIONS: string[] = [
  '本部',
  '达州',
  '德阳',
  '高新',
  '乐山',
  '泸州',
  '青羊',
  '天府',
  '武侯',
  '新都',
  '宜宾',
  '资阳',
  '自贡',
]

// ============= 业务类型UI短标签 =============
/**
 * 业务类型短标签映射
 * 针对规范集合中的常见值进行一一映射；其余值按照“去车+保留核心字段”的规则自动压缩。
 */
export const BUSINESS_TYPE_SHORT_LABELS: Record<string, string> = {
  // 非营业客车
  非营业客车新车: '非营客-新',
  非营业客车旧车非过户: '非营客-旧',
  非营业客车旧车过户: '非营客-过户',
  非营业客车旧车过户车: '非营客-过户',
  // 非营业货车（吨位档）
  '1吨以下非营业货车': '非营货-<1t',
  '1–2吨非营业货车': '非营货-1–2t',
  // 兼容旧分类（新/旧）
  非营业货车新车: '非营货-1–2t',
  非营业货车旧车: '非营货-1–2t',
  // 营业货车分档
  '2吨以下营业货车': '营货-<2t',
  '2-9吨营业货车': '营货-2–9t',
  '2–9吨营业货车': '营货-2–9t',
  '9-10吨营业货车': '营货-9–10t',
  '9–10吨营业货车': '营货-9–10t',
  '10吨以上营业货车（普货）': '营货-≥10t普',
  '10吨以上-普货': '营货-≥10t普',
  '10吨以上普货': '营货-≥10t普',
  '10吨以上营业货车（牵引）': '营货-≥10t牵',
  '10吨以上-牵引': '营货-≥10t牵',
  '10吨以上牵引': '营货-≥10t牵',
  自卸车: '营货-≥10t卸',
  自卸: '营货-≥10t卸',
  特种车: '营货-≥10t特',
  其他营业货车: '营货-其他',
  // 乘用车与其他
  摩托车: '摩托',
  出租车: '营客-出租',
  网约车: '营客-网约',
  车险整体: '车险整体',
  其他: '营货-其他',
}

/**
 * 生成业务类型的短标签（仅影响UI展示，不改变原始值）
 * 规则：
 * 1) 优先命中 BUSINESS_TYPE_SHORT_LABELS 映射
 * 2) 未命中时，执行通用压缩：去“车”、缩写“营业/非营业”为“营/非营”、
 *    将吨位表达统一为 t，并保留“新/旧/过户”等核心语义
 */
export function getBusinessTypeLabel(original: string): string {
  const src = String(original || '').trim()
  if (!src) return ''

  const mapped = BUSINESS_TYPE_SHORT_LABELS[src]
  if (mapped) return mapped

  // 通用压缩处理
  let s = src
  // 缩写营业/非营业
  s = s.replace(/非营业/g, '非营').replace(/营业/g, '营')
  // 去除“车”字
  s = s.replace(/车/g, '')
  // 新/旧/过户压缩
  s = s
    .replace(/新车/g, '新')
    .replace(/旧车/g, '旧')
    .replace(/过户车/g, '过户')
  // 吨位表达统一
  s = s.replace(/吨/g, 't')
  s = s.replace(/以上/g, '＞')
  s = s.replace(/以下/g, '＜')
  // 连接符与特殊形式
  s = s.replace(/＞10t-普货/g, '＞10t普')
  s = s.replace(/＞10t-牵引/g, '＞10t牵')
  s = s.replace(/2-9t营货/g, '营货2-9t')

  return s
}

// ============= 业务类型代码（英文简称） =============
/**
 * 业务类型代码枚举（英文简称，作为代码端统一Key，避免重复/歧义）
 * 说明：所有代码值保证唯一、稳定；UI端仅使用中文短标签展示
 */
export type BusinessTypeCode =
  | 'non_pc_new' // 非营业客车新车
  | 'non_pc_used' // 非营业客车旧车非过户
  | 'non_pc_transfer' // 非营业客车旧车过户
  | 'non_truck_lt1' // 1吨以下非营业货车
  | 'non_truck_1_2' // 1–2吨非营业货车
  | 'biz_truck_lt2' // 2吨以下营业货车
  | 'biz_truck_2_9' // 2–9吨营业货车
  | 'biz_truck_9_10' // 9–10吨营业货车
  | 'biz_truck_10_plus' // 10吨以上营业货车（普货）
  | 'biz_truck_10_plus_trac' // 10吨以上营业货车（牵引）
  | 'biz_truck_10_plus_dump' // 自卸车
  | 'biz_truck_10_plus_special' // 特种车
  | 'biz_truck_other' // 其他营业货车
  | 'motorcycle' // 摩托车
  | 'biz_pc_taxi' // 出租车
  | 'biz_pc_ridehailing' // 网约车
  | 'OTHER' // 其他/未知类型

/**
 * Canonical 业务类型代码列表（与 CANONICAL_BUSINESS_TYPES 对应）
 */
export const CANONICAL_BUSINESS_CODES: BusinessTypeCode[] = [
  'non_pc_new',
  'non_pc_used',
  'non_pc_transfer',
  'non_truck_lt1',
  'non_truck_1_2',
  'biz_truck_lt2',
  'biz_truck_2_9',
  'biz_truck_9_10',
  'biz_truck_10_plus',
  'biz_truck_10_plus_trac',
  'biz_truck_10_plus_dump',
  'biz_truck_10_plus_special',
  'biz_truck_other',
  'motorcycle',
  'biz_pc_taxi',
  'biz_pc_ridehailing',
]

/**
 * 中文全称 → 英文代码 映射
 */
export const BUSINESS_TYPE_CODE_FROM_CN: Record<string, BusinessTypeCode> = {
  // 非营业客车
  非营业客车新车: 'non_pc_new',
  非营业客车旧车非过户: 'non_pc_used',
  非营业客车旧车过户: 'non_pc_transfer',
  非营业客车旧车过户车: 'non_pc_transfer', // 兼容旧文案

  // 非营业货车（按吨位分档；数据暂不含吨位时需另行规则）
  '1吨以下非营业货车': 'non_truck_lt1',
  '1–2吨非营业货车': 'non_truck_1_2',
  // 兼容旧分类（新/旧）暂映射到 1–2t 档，待数据补充后细化
  非营业货车新车: 'non_truck_1_2',
  非营业货车旧车: 'non_truck_1_2',

  // 营业货车分档
  '2吨以下营业货车': 'biz_truck_lt2',
  '2-9吨营业货车': 'biz_truck_2_9',
  '2–9吨营业货车': 'biz_truck_2_9',
  '9-10吨营业货车': 'biz_truck_9_10',
  '9–10吨营业货车': 'biz_truck_9_10',
  '10吨以上营业货车（普货）': 'biz_truck_10_plus',
  '10吨以上-普货': 'biz_truck_10_plus',
  '10吨以上普货': 'biz_truck_10_plus',
  '10吨以上营业货车（牵引）': 'biz_truck_10_plus_trac',
  '10吨以上-牵引': 'biz_truck_10_plus_trac',
  '10吨以上牵引': 'biz_truck_10_plus_trac',
  自卸车: 'biz_truck_10_plus_dump',
  自卸: 'biz_truck_10_plus_dump',
  特种车: 'biz_truck_10_plus_special',
  其他营业货车: 'biz_truck_other',

  // 乘用车与其他
  摩托车: 'motorcycle',
  出租车: 'biz_pc_taxi',
  网约车: 'biz_pc_ridehailing',
  其他: 'biz_truck_other',
}

/**
 * 英文代码 → 中文全称 映射（用于与历史目标、原始数据Key对齐）
 */
export const BUSINESS_TYPE_CN_BY_CODE: Record<BusinessTypeCode, string> = {
  non_pc_new: '非营业客车新车',
  non_pc_used: '非营业客车旧车非过户',
  non_pc_transfer: '非营业客车旧车过户',
  non_truck_lt1: '1吨以下非营业货车',
  non_truck_1_2: '1–2吨非营业货车',
  biz_truck_lt2: '2吨以下营业货车',
  biz_truck_2_9: '2–9吨营业货车',
  biz_truck_9_10: '9–10吨营业货车',
  biz_truck_10_plus: '10吨以上营业货车（普货）',
  biz_truck_10_plus_trac: '10吨以上营业货车（牵引）',
  biz_truck_10_plus_dump: '自卸车',
  biz_truck_10_plus_special: '特种车',
  biz_truck_other: '其他营业货车',
  motorcycle: '摩托车',
  biz_pc_taxi: '出租车',
  biz_pc_ridehailing: '网约车',
  OTHER: '其他',
}

/**
 * 英文代码 → 中文短标签 映射（UI端展示）
 */
export const BUSINESS_TYPE_SHORT_BY_CODE: Record<BusinessTypeCode, string> = {
  non_pc_new: '非营客-新',
  non_pc_used: '非营客-旧',
  non_pc_transfer: '非营客-过户',
  non_truck_lt1: '非营货-<1t',
  non_truck_1_2: '非营货-1–2t',
  biz_truck_lt2: '营货-<2t',
  biz_truck_2_9: '营货-2–9t',
  biz_truck_9_10: '营货-9–10t',
  biz_truck_10_plus: '营货-≥10t普',
  biz_truck_10_plus_trac: '营货-≥10t牵',
  biz_truck_10_plus_dump: '营货-≥10t卸',
  biz_truck_10_plus_special: '营货-≥10t特',
  biz_truck_other: '营货-其他',
  motorcycle: '摩托',
  biz_pc_taxi: '营客-出租',
  biz_pc_ridehailing: '营客-网约',
  OTHER: '其他',
}

/**
 * 将中文业务类型转换为英文代码（容错处理）
 */
export function getBusinessTypeCode(original: string): BusinessTypeCode {
  const src = String(original || '').trim()
  if (!src) return 'OTHER'
  const direct = BUSINESS_TYPE_CODE_FROM_CN[src]
  if (direct) return direct
  // 轻度归一化后再匹配
  const normalized = src.replace(/\s+/g, '').replace(/车/g, '车') // 保留“车”以兼容现有Key
  const mapped = BUSINESS_TYPE_CODE_FROM_CN[normalized]
  return mapped || 'OTHER'
}

/**
 * 根据英文代码获取中文短标签（UI展示）
 */
export function getBusinessTypeShortLabelByCode(
  code: BusinessTypeCode
): string {
  return BUSINESS_TYPE_SHORT_BY_CODE[code] || '其他'
}

/**
 * 根据英文代码获取中文全称（用于与历史目标、原始数据Key对齐）
 */
export function getBusinessTypeFullCNByCode(code: BusinessTypeCode): string {
  return BUSINESS_TYPE_CN_BY_CODE[code] || '其他'
}
