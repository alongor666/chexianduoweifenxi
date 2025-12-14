'use client'

import { useState } from 'react'
import { loadDuckDBFile } from '@/lib/database/duckdb-loader'
import { useAppStore } from '@/store/use-app-store'
import { Upload, Loader2 } from 'lucide-react'

export function SimpleUpload() {
  const [loading, setLoading] = useState(false)
  const setRawData = useAppStore(state => state.setRawData)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.duckdb')) {
        alert('请上传 .duckdb 文件');
        return;
    }

    try {
        setLoading(true)
        const data = await loadDuckDBFile(file)
        console.log('Loaded data:', data.length)
        // 简单映射，确保字段名匹配
        // 如果 ETL 脚本生成的字段名是 snake_case，且与前端一致，则无需转换
        setRawData(data as any)
    } catch (err) {
        console.error(err)
        alert('导入失败: ' + String(err))
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
        <div className="mb-4 bg-white p-4 rounded-full shadow-sm">
            {loading ? <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> : <Upload className="w-8 h-8 text-slate-400" />}
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">上传数据文件</h3>
        <p className="text-sm text-slate-500 mb-6">仅支持 .duckdb 格式</p>
        
        <label className="cursor-pointer px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
            选择文件
            <input type="file" className="hidden" accept=".duckdb" onChange={handleFileChange} disabled={loading} />
        </label>
    </div>
  )
}
