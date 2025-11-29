/**
 * 主页面 - 服务器组件
 * 负责在服务器端获取初始数据，并将其传递给客户端组件进行渲染
 */

import { DataService } from "@/services/DataService";
import { DashboardClient } from "@/components/dashboard-client";
import { getDataSource } from "@/lib/supabase/client";
import type { InsuranceRecord } from "@/types/insurance";
import { loadAllLocalData } from "@/lib/utils/local-data-loader";

export default async function HomePage() {
  let initialData: InsuranceRecord[] = [];
  const dataSource = getDataSource();

  // 根据数据源模式加载数据
  if (dataSource === "supabase") {
    try {
      console.log("[HomePage] 尝试从 Supabase 获取初始数据...");
      initialData = await DataService.fetchAllData();
      console.log(`[HomePage] 成功获取 ${initialData.length} 条初始数据`);
    } catch (e) {
      console.warn("[HomePage] Supabase 数据获取失败，降级到本地模式:", e);
      initialData = [];
    }
  } else {
    console.log("[HomePage] 当前使用本地数据模式，开始加载本地文件...");
    try {
      initialData = await loadAllLocalData();
      console.log(`[HomePage] 成功加载 ${initialData.length} 条本地数据`);
    } catch (e) {
      console.error("[HomePage] 加载本地数据失败:", e);
      initialData = [];
    }
  }

  // 渲染客户端组件，并将初始数据作为 prop 传递
  // 即使没有初始数据，也正常渲染页面，让用户可以上传 CSV 文件
  return <DashboardClient initialData={initialData} />;
}
