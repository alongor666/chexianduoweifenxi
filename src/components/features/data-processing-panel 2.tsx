'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, Download, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function DataProcessingPanel() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [outputFileName, setOutputFileName] = useState<string>('insurance_data.duckdb')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [logs, setLogs] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(filesArray);
      setLogs(prev => prev + `已选择 ${filesArray.length} 个文件。\n`);
      setDownloadUrl(null); // Clear previous download URL
      setError(null); // Clear previous error
    }
  }

  const handleOutputFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOutputFileName(event.target.value);
  }

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "错误",
        description: "请选择至少一个文件进行加工。",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setLogs('');
    setError(null);
    setDownloadUrl(null);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('outputFileName', outputFileName);

    setLogs(prev => prev + '开始上传文件并进行数据加工...\n');

    try {
      const response = await fetch('/api/etl', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '数据加工失败');
      }

      const result = await response.json();
      setLogs(prev => prev + result.logs + '\n');

      if (result.success) {
        setDownloadUrl(result.downloadUrl);
        toast({
          title: "成功",
          description: "数据加工完成，可以下载数据库文件了。",
        });
      } else {
        setError(result.message || '数据加工失败');
        toast({
          title: "错误",
          description: result.message || '数据加工失败',
          variant: "destructive",
        });
      }

    } catch (err: any) {
      setLogs(prev => prev + `错误: ${err.message}\n`);
      setError(err.message);
      toast({
        title: "错误",
        description: `数据加工过程中发生错误: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
      setSelectedFiles([]); // Clear selected files state
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">数据加工设置</h3>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="files">选择源数据文件 (.xlsx, .xls, .csv)</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isProcessing}
            />
            {selectedFiles.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                已选择: {selectedFiles.map(f => f.name).join(', ')}
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="outputFileName">输出数据库文件名 (.duckdb)</Label>
            <Input
              id="outputFileName"
              type="text"
              value={outputFileName}
              onChange={handleOutputFileNameChange}
              placeholder="例如: my_data.duckdb"
              disabled={isProcessing}
            />
          </div>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || selectedFiles.length === 0}
            className="w-full flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加工...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                开始数据加工
              </>
            )}
          </Button>
        </div>
      </div>

      {downloadUrl && (
        <div className="rounded-xl border border-green-200 bg-green-50/60 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">
              数据加工成功！
            </p>
          </div>
          <a href={downloadUrl} download className="flex items-center gap-2 text-green-700 hover:underline">
            <Download className="h-4 w-4" />
            下载 {outputFileName}
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-6">
          <p className="text-red-800 font-medium">错误: {error}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">加工日志</h3>
        <Textarea
          value={logs}
          readOnly
          rows={10}
          className="font-mono text-sm bg-white border-slate-300"
          placeholder="数据加工日志将显示在这里..."
        />
      </div>
    </div>
  )
}
