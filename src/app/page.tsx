/**
 * 主页面 - 服务器组件
 * 负责在服务器端获取初始数据，并将其传递给客户端组件进行渲染
 */

import { DataService } from '@/services/DataService'
import { DashboardClient } from '@/components/dashboard-client'
import { getDataSource } from '@/lib/supabase/client'
import type { InsuranceRecord } from '@/types/insurance'
import { logger } from '@/lib/logger'

const log = logger.create('HomePage')

export default async function HomePage() {
  let initialData: InsuranceRecord[] = []
  const dataSource = getDataSource()

  // 仅在使用 Supabase 数据源时尝试从服务器端获取数据
  if (dataSource === 'supabase') {
    try {
      log.info('尝试从 Supabase 获取初始数据')
      initialData = await DataService.fetchAllData()
      log.info('成功获取初始数据', { recordCount: initialData.length })
    } catch (e) {
      log.warn('Supabase 数据获取失败，降级到本地模式', e)
      // 不显示错误页面，而是继续加载应用，让用户使用本地上传功能
      initialData = []
    }
  } else {
    log.info('当前使用本地数据模式')
  }

  // 渲染客户端组件，并将初始数据作为 prop 传递
  // 即使没有初始数据，也正常渲染页面，让用户可以上传 CSV 文件
  return <DashboardClient initialData={initialData} />
}
