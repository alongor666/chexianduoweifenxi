'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Download, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { parseGoalCsvFile } from '@/utils/csvParser'
import { useGoalStore, KNOWN_BUSINESS_TYPES } from '@/store/goalStore'
import { GoalCsvParseError, CsvIssue } from '@/types/goal'
import { cn } from '@/lib/utils'

/**
 * 目标导入与导出组件
 * 提供 CSV（逗号分隔值）文件的导入、校验与导出能力
 */
export function GoalImportExport() {
  const [isImporting, setIsImporting] = useState(false)
  const [issues, setIssues] = useState<CsvIssue[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [ignoredUnknownCount, setIgnoredUnknownCount] = useState(0)

  const createTunedVersion = useGoalStore(state => state.createTunedVersion)
  const exportCurrentVersionCsv = useGoalStore(state => state.exportCurrentVersionCsv)
  const getCurrentVersion = useGoalStore(state => state.getCurrentVersion)
  const baseYear = useGoalStore(state => state.baseYear)

  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return
      }
      setIsImporting(true)
      setIssues([])
      setIgnoredUnknownCount(0)

      const file = acceptedFiles[0]
      try {
        const { rows, ignoredUnknownCount: ignored } = await parseGoalCsvFile(file, {
          knownBusinessTypes: KNOWN_BUSINESS_TYPES,
          unknownBusinessStrategy: 'block',
        })

        const { versionId } = createTunedVersion(rows || [])
        setIgnoredUnknownCount(ignored || 0)
        toast({
          title: '导入成功',
          description: `已创建新版本：${versionId}`,
        })
      } catch (error) {
        if (error instanceof GoalCsvParseError) {
          setIssues(error.issues)
          setIsDialogOpen(true)
        } else if (error instanceof Error) {
          toast({
            title: '导入失败',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({
            title: '导入失败',
            description: '未知错误，请稍后重试',
            variant: 'destructive',
          })
        }
      } finally {
        setIsImporting(false)
      }
    },
    [createTunedVersion, toast]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
    },
  })

  const rejectionAlert = useMemo(() => {
    if (fileRejections.length === 0) {
      return null
    }
    return (
      <Alert variant="destructive" className="mt-3">
        <AlertTitle>文件格式错误</AlertTitle>
        <AlertDescription>仅支持 CSV（逗号分隔值）文件，请重新选择</AlertDescription>
      </Alert>
    )
  }, [fileRejections])

  const handleExport = () => {
    try {
      const csvContent = exportCurrentVersionCsv()
      const version = getCurrentVersion()
      const today = new Date()
      const formattedDate = `${today.getFullYear()}${`${today.getMonth() + 1}`.padStart(2, '0')}${`${today.getDate()}`.padStart(2, '0')}`
      const fileName = `${version.id}_${formattedDate}.csv`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: '导出成功',
        description: `文件已生成：${fileName}`,
      })
    } catch (error) {
      toast({
        title: '导出失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>目标导入 / 导出</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps({
              className: cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center transition-colors',
                isDragActive && 'border-primary bg-primary/5',
                isImporting && 'pointer-events-none opacity-60'
              ),
            })}
          >
            <input {...getInputProps()} aria-label="上传 CSV 文件" />
            <UploadCloud className="mb-3 h-8 w-8 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">拖拽或点击上传 CSV（逗号分隔值）文件</p>
            <p className="mt-1 text-xs text-muted-foreground">
              模板列：业务类型、年度目标（万）。导入后仅更新微调目标版本。
            </p>
            <Button type="button" className="mt-4" disabled={isImporting}>
              {isImporting ? '正在导入…' : '选择文件'}
            </Button>
          </div>
          {rejectionAlert}
          {ignoredUnknownCount > 0 ? (
            <Alert className="mt-3" variant="default">
              <AlertTitle>部分记录已忽略</AlertTitle>
              <AlertDescription>
                {`共有 ${ignoredUnknownCount} 条未知业务类型被忽略，年初目标不会受到影响。`}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              年度：{baseYear} ｜ 年初目标固定，不支持覆盖。
            </div>
            <Button type="button" variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" aria-hidden="true" />
              导出当前版本
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>导入失败，发现以下问题</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto pr-1">
            <ul className="space-y-2 text-sm leading-relaxed">
              {issues.map((issue, index) => (
                <li key={`${issue.type}-${issue.rowIndex ?? index}`} className="rounded-md bg-muted px-3 py-2">
                  <span className="font-medium">{index + 1}.</span> {issue.message}
                  {issue.rowIndex ? <span className="text-xs text-muted-foreground">（第 {issue.rowIndex} 行）</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
