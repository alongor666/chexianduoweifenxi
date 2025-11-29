/**
 * 类型守卫和空值检查工具
 * 应用 DRY 原则，统一处理重复的空值检查逻辑
 */

/**
 * 检查值是否为有效数字
 * @param value 待检查的值
 * @returns 是否为有效数字
 */
export function isValidNumber(
  value: number | null | undefined,
): value is number {
  return value !== null && value !== undefined && !isNaN(value);
}

/**
 * 安全获取数字值，无效时返回默认值
 * @param value 数字值
 * @param defaultValue 默认值（默认为 0）
 * @returns 有效数字或默认值
 */
export function safeNumber(
  value: number | null | undefined,
  defaultValue = 0,
): number {
  return isValidNumber(value) ? value : defaultValue;
}

/**
 * 安全获取数字值用于显示，无效时返回占位符
 * @param value 数字值
 * @param placeholder 占位符（默认为 "-"）
 * @returns 有效数字或占位符
 */
export function safeDisplayNumber(
  value: number | null | undefined,
  placeholder = "-",
): number | string {
  return isValidNumber(value) ? value : placeholder;
}

/**
 * 检查值是否为 null 或 undefined
 * @param value 待检查的值
 * @returns 是否为 null 或 undefined
 */
export function isNullish<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 提供默认值（如果值为 null 或 undefined）
 * @param value 原始值
 * @param defaultValue 默认值
 * @returns 原始值或默认值
 */
export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return isNullish(value) ? defaultValue : value;
}

/**
 * 检查字符串是否为空（null、undefined 或空字符串）
 * @param value 字符串值
 * @returns 是否为空
 */
export function isEmptyString(value: string | null | undefined): boolean {
  return isNullish(value) || value.trim() === "";
}

/**
 * 检查数组是否为空
 * @param arr 数组
 * @returns 是否为空数组
 */
export function isEmptyArray<T>(arr: T[] | null | undefined): boolean {
  return isNullish(arr) || arr.length === 0;
}
