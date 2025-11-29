/**
 * 机构配置常量
 * 用于多维雷达图的机构对比功能
 */

/**
 * Tableau 风格配色方案 - 7种高对比度颜色
 * 用于区分不同机构的雷达图折线
 */
export const ORG_COLORS = [
  "#1F77B4", // 1. 深蓝色 — 稳重、专业
  "#FF7F0E", // 2. 橙色 — 活力、突出
  "#2CA02C", // 3. 绿色 — 平衡、易于接受
  "#D62728", // 4. 深红色 — 强烈对比
  "#9467BD", // 5. 紫色 — 独特、清晰
  "#8C564B", // 6. 棕红色 — 柔和、明显对比
  "#E377C2", // 7. 粉紫色 — 柔和、突出
] as const;

/**
 * 所有三级机构列表（本部除外）
 */
export const ALL_ORGANIZATIONS = [
  "天府",
  "高新",
  "新都",
  "青羊",
  "宜宾",
  "武侯",
  "泸州",
  "德阳",
  "乐山",
  "资阳",
  "自贡",
  "达州",
] as const;

/**
 * 机构类型
 */
export type OrganizationName = (typeof ALL_ORGANIZATIONS)[number];

/**
 * 最大可选机构数量
 */
export const MAX_ORGANIZATIONS = 7;

/**
 * 最小可选机构数量
 */
export const MIN_ORGANIZATIONS = 1;

/**
 * 快捷筛选类型定义
 */
export interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  description: string;
  organizations: readonly string[];
}

/**
 * 静态快捷筛选配置（地域）
 */
export const STATIC_QUICK_FILTERS: QuickFilter[] = [
  {
    id: "chengdu",
    label: "成都",
    icon: "📍",
    description: "成都地区机构",
    organizations: ["天府", "高新", "新都", "青羊"],
  },
  {
    id: "yidi",
    label: "异地",
    icon: "🌏",
    description: "成都以外机构",
    organizations: [
      "宜宾",
      "武侯",
      "泸州",
      "德阳",
      "乐山",
      "资阳",
      "自贡",
      "达州",
    ],
  },
];

/**
 * 获取机构的颜色
 * @param index 机构在已选列表中的索引
 * @returns 颜色代码
 */
export function getOrganizationColor(index: number): string {
  return ORG_COLORS[index % ORG_COLORS.length];
}

/**
 * 获取机构的颜色（根据机构名）
 * @param orgName 机构名称
 * @param selectedOrgs 已选机构列表
 * @returns 颜色代码
 */
export function getOrganizationColorByName(
  orgName: string,
  selectedOrgs: string[],
): string {
  const index = selectedOrgs.indexOf(orgName);
  return index >= 0 ? getOrganizationColor(index) : ORG_COLORS[0];
}

/**
 * 验证是否可以添加更多机构
 * @param currentCount 当前已选数量
 * @returns 是否可以添加
 */
export function canAddMoreOrganizations(currentCount: number): boolean {
  return currentCount < MAX_ORGANIZATIONS;
}

/**
 * 验证机构选择是否有效
 * @param organizations 机构列表
 * @returns 验证结果
 */
export function validateOrganizationSelection(organizations: string[]): {
  valid: boolean;
  error?: string;
} {
  if (organizations.length < MIN_ORGANIZATIONS) {
    return {
      valid: false,
      error: `至少选择 ${MIN_ORGANIZATIONS} 个机构`,
    };
  }

  if (organizations.length > MAX_ORGANIZATIONS) {
    return {
      valid: false,
      error: `最多选择 ${MAX_ORGANIZATIONS} 个机构`,
    };
  }

  // 验证机构名称是否有效
  const invalidOrgs = organizations.filter(
    (org) => !ALL_ORGANIZATIONS.includes(org as OrganizationName),
  );
  if (invalidOrgs.length > 0) {
    return {
      valid: false,
      error: `无效的机构名称: ${invalidOrgs.join(", ")}`,
    };
  }

  return { valid: true };
}
