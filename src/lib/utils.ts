import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 中文文本规范化：去除替换字符、统一空白、修复常见“车”类乱码
export function normalizeChineseText(input: string | null | undefined): string {
  const raw = String(input ?? '').trim()
  if (!raw) return ''

  // Unicode 规范化
  let s = raw.normalize('NFC')

  // 修复常见模式：将 "客�"/"货�" 纠正为 "客车"/"货车"
  s = s.replace(/客\uFFFD+/g, '客车').replace(/货\uFFFD+/g, '货车')

  // 特例：旧车过户类把中间乱码移除
  s = s.replace(/旧车\uFFFD+过户/g, '旧车过户')

  // 如果结尾是“客”或“货”，且存在过乱码痕迹，补“车”
  if (/客$/.test(s)) s = s + '车'
  if (/货$/.test(s)) s = s + '车'

  // 去掉任何剩余的替换字符
  s = s.replace(/\uFFFD+/g, '')

  // 合并多余空白
  s = s.replace(/\s+/g, ' ')

  return s
}

// 记录文本字段规范化（仅对易乱码的中文维度）
export function normalizeRecordTextFields<
  T extends {
    customer_category_3?: string
    business_type_category?: string
    third_level_organization?: string
    terminal_source?: string
  },
>(record: T): T {
  return {
    ...record,
    customer_category_3: normalizeChineseText(record.customer_category_3 ?? ''),
    business_type_category: normalizeChineseText(
      record.business_type_category ?? ''
    ),
    third_level_organization: normalizeChineseText(
      record.third_level_organization ?? ''
    ),
    terminal_source: normalizeChineseText(record.terminal_source ?? ''),
  }
}
