/**
 * 功能开关配置
 * 用于控制实验性功能的启用/禁用
 */

/**
 * 功能标志配置
 */
export const FEATURE_FLAGS = {
  /**
   * 启用 DuckDB 数据库支持
   * - true: 允许上传 .duckdb 文件
   * - false: 仅支持 CSV 文件
   */
  useDuckDB: process.env.NEXT_PUBLIC_USE_DUCKDB === "true" || true, // 默认启用

  /**
   * 允许在开发环境手动切换数据库
   */
  allowDatabaseSwitch: process.env.NODE_ENV === "development",

  /**
   * 显示性能调试信息
   */
  showPerformanceMetrics: process.env.NODE_ENV === "development",
} as const;

/**
 * 获取当前启用的功能列表
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
