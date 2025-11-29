/**
 * 数组工具函数
 * 提供安全的数组操作，避免栈溢出
 */

/**
 * 安全地获取数组中的最大值
 *
 * 与 Math.max(...array) 的区别：
 * - Math.max(...array) 会在数组很大时导致栈溢出（因为展开运算符的限制）
 * - 本函数使用循环遍历，不受数组大小限制
 *
 * @param array 数字数组
 * @returns 最大值，如果数组为空返回 -Infinity
 *
 * @example
 * ```typescript
 * // 小数组 - 两种方式都可以
 * Math.max(...[1, 2, 3]) // 3
 * safeMax([1, 2, 3]) // 3
 *
 * // 大数组 - 只有 safeMax 可以工作
 * const largeArray = Array.from({ length: 100000 }, (_, i) => i)
 * // Math.max(...largeArray) ❌ RangeError: Maximum call stack size exceeded
 * safeMax(largeArray) // ✅ 99999
 * ```
 */
export function safeMax(array: number[]): number {
  if (array.length === 0) {
    return -Infinity;
  }

  let max = array[0];
  for (let i = 1; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
    }
  }
  return max;
}

/**
 * 安全地获取数组中的最小值
 *
 * 与 Math.min(...array) 的区别：
 * - Math.min(...array) 会在数组很大时导致栈溢出（因为展开运算符的限制）
 * - 本函数使用循环遍历，不受数组大小限制
 *
 * @param array 数字数组
 * @returns 最小值，如果数组为空返回 Infinity
 *
 * @example
 * ```typescript
 * // 小数组 - 两种方式都可以
 * Math.min(...[1, 2, 3]) // 1
 * safeMin([1, 2, 3]) // 1
 *
 * // 大数组 - 只有 safeMin 可以工作
 * const largeArray = Array.from({ length: 100000 }, (_, i) => i)
 * // Math.min(...largeArray) ❌ RangeError: Maximum call stack size exceeded
 * safeMin(largeArray) // ✅ 0
 * ```
 */
export function safeMin(array: number[]): number {
  if (array.length === 0) {
    return Infinity;
  }

  let min = array[0];
  for (let i = 1; i < array.length; i++) {
    if (array[i] < min) {
      min = array[i];
    }
  }
  return min;
}

/**
 * 安全地获取数组的最小值和最大值
 *
 * 只需要一次遍历，比分别调用 safeMin 和 safeMax 更高效
 *
 * @param array 数字数组
 * @returns { min: number, max: number } 对象，如果数组为空返回 { min: Infinity, max: -Infinity }
 *
 * @example
 * ```typescript
 * const { min, max } = safeMinMax([3, 1, 4, 1, 5, 9, 2, 6])
 * console.log(min) // 1
 * console.log(max) // 9
 *
 * // 用于范围显示
 * const weekRange = `${min}-${max}周`
 * ```
 */
export function safeMinMax(array: number[]): { min: number; max: number } {
  if (array.length === 0) {
    return { min: Infinity, max: -Infinity };
  }

  let min = array[0];
  let max = array[0];

  for (let i = 1; i < array.length; i++) {
    const value = array[i];
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  return { min, max };
}
