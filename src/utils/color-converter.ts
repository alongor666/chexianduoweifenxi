/**
 * 颜色转换工具
 */

/**
 * Tailwind颜色类名到HEX颜色的映射
 */
const TAILWIND_COLOR_MAP: Record<string, string> = {
  "text-red-600": "#dc2626",
  "text-orange-600": "#ea580c",
  "text-green-600": "#16a34a",
  "text-blue-600": "#2563eb",
  "text-purple-600": "#9333ea",
  "text-slate-600": "#475569",
  "text-slate-700": "#334155",
  "text-slate-800": "#1e293b",
};

/**
 * 将Tailwind颜色类名转换为HEX颜色值
 * @param colorClass Tailwind颜色类名（如 'text-blue-600'）
 * @param fallback 默认颜色（默认蓝色）
 * @returns HEX颜色值
 */
export function tailwindToHex(
  colorClass: string | undefined,
  fallback = "#3b82f6",
): string {
  if (!colorClass) return fallback;
  return TAILWIND_COLOR_MAP[colorClass] || fallback;
}
