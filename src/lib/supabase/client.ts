import { createClient } from '@supabase/supabase-js'

// 从环境变量中获取 Supabase 的 URL 和 anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查是否启用 Supabase 数据源
const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local'
export const isSupabaseEnabled = dataSource === 'supabase' && !!supabaseUrl && !!supabaseAnonKey

// 创建并导出 Supabase 客户端实例（仅在启用时）
export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

/**
 * 获取数据源类型
 */
export function getDataSource(): 'supabase' | 'local' {
  return isSupabaseEnabled ? 'supabase' : 'local'
}
