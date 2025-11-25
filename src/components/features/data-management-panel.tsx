/**
 * 数据管理面板 - 包含数据导入、导出、清空功能和业务维度筛选
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from './file-upload'
import { DataExport } from './data-export'
import { PDFReportExport } from './pdf-report-export'

import { useDataStore } from '@/store/domains/dataStore'
import { usePersistData } from '@/hooks/use-persist-data'
import { Database, Download, Trash2, Filter } from 'lucide-react'

export function DataManagementPanel() {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'export'>('upload')
  const { clearPersistedData } = usePersistData()
  const rawData = useDataStore(state => state.rawData)

  const handleClearData = async () => {
    if (
      confirm('确定要清空当前数据并重新开始吗?此操作将清除所有缓存的数据。')
    ) {
      await useDataStore.getState().clearData()
      clearPersistedData()
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-800">导入导出</h2>
            <p className="text-sm text-slate-600 mt-1">
              管理数据导入和导出
            </p>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-3">
          {rawData.length > 0 && (
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空数据
            </button>
          )}
        </div>
      </div>

      {/* 主内容区 - 子标签页 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'upload' | 'export')}>
          <div className="border-b border-slate-200 px-6 pt-4">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="upload" className="gap-2">
                <Database className="w-4 h-4" />
                导入数据
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="w-4 h-4" />
                导出数据
              </TabsTrigger>

            </TabsList>
          </div>

          <TabsContent value="upload" className="p-6 m-0">
            <FileUpload />
          </TabsContent>

          <TabsContent value="export" className="p-6 m-0">
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">导出结构化数据</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      将当前工作区的数据按需导出为 CSV 文件，支持全部数据或筛选结果。
                    </p>
                  </div>
                  <div className="shrink-0">
                    <DataExport />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">导出可视化报告</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      一键生成 PDF 报告，包含看板指标和核心图表，便于团队共享。
                    </p>
                  </div>
                  <PDFReportExport className="shrink-0" />
                </div>
              </div>
            </div>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  )
}
