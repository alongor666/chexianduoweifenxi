'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Download,
  UploadCloud,
  FileText,
  History,
  Save,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { parseGoalCsvFile } from '@/utils/csvParser'
import { useGoalStore, KNOWN_BUSINESS_TYPES } from '@/store/goalStore'
import { GoalCsvParseError, CsvIssue } from '@/types/goal'
import { cn } from '@/lib/utils'

/**
 * 目标管理操作面板
 * 整合保存、确认、导入、导出、修改记录管理功能
 */
export function TargetManagementPanel() {
  const [isImporting, setIsImporting] = useState(false)
  const [issues, setIssues] = useState<CsvIssue[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [ignoredUnknownCount, setIgnoredUnknownCount] = useState(0)

  const createTunedVersion = useGoalStore(state => state.createTunedVersion)
  const exportCurrentVersionCsv = useGoalStore(
    state => state.exportCurrentVersionCsv
  )
  const getCurrentVersion = useGoalStore(state => state.getCurrentVersion)
  const baseYear = useGoalStore(state => state.baseYear)
  const versions = useGoalStore(state => state.versions)
  const currentVersionId = useGoalStore(state => state.currentVersionId)
  const switchVersion = useGoalStore(state => state.switchVersion)

  const { toast } = useToast()

  // 生成CSV模板
  const generateTemplate = useCallback(() => {
    const templateData = KNOWN_BUSINESS_TYPES.map(bizType => `${bizType},0`)
    const csvContent = `业务类型,年度目标（万）\n${templateData.join('\n')}\n`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `目标导入模板_${baseYear}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: '模板下载成功',
      description: `已生成模板文件：目标导入模板_${baseYear}.csv`,
    })
  }, [baseYear, toast])

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
        const { rows, ignoredUnknownCount: ignored } = await parseGoalCsvFile(
          file,
          {
            knownBusinessTypes: KNOWN_BUSINESS_TYPES,
            unknownBusinessStrategy: 'block',
          }
        )

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
        } else {
          toast({
            title: '导入失败',
            description: error instanceof Error ? error.message : '未知错误',
            variant: 'destructive',
          })
        }
      } finally {
        setIsImporting(false)
      }
    },
    [createTunedVersion, toast]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.csv'],
      },
      maxFiles: 1,
      disabled: isImporting,
    })

  const rejectionAlert = useMemo(() => {
    if (fileRejections.length === 0) return null
    const rejection = fileRejections[0]
    return (
      <Alert className="mt-3" variant="destructive">
        <AlertTitle>文件格式错误</AlertTitle>
        <AlertDescription>
          {rejection.errors.map(error => error.message).join('，')}
        </AlertDescription>
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

  const handleSave = () => {
    toast({
      title: '保存成功',
      description: '目标数据已保存到本地存储',
    })
  }

  const handleConfirm = () => {
    toast({
      title: '确认成功',
      description: '当前目标版本已确认',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            目标管理操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 导入导出区域 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">数据导入导出</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 导入区域 */}
              <div className="space-y-3">
                <div
                  {...getRootProps({
                    className: cn(
                      'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center transition-colors cursor-pointer',
                      isDragActive && 'border-primary bg-primary/5',
                      isImporting && 'pointer-events-none opacity-60'
                    ),
                  })}
                >
                  <input {...getInputProps()} aria-label="上传 CSV 文件" />
                  <UploadCloud
                    className="mb-2 h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">拖拽或点击上传 CSV 文件</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    支持业务类型、年度目标数据导入
                  </p>
                </div>
                {rejectionAlert}
                <Button
                  onClick={generateTemplate}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载导入模板
                </Button>
              </div>

              {/* 导出区域 */}
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center rounded-lg border border-muted-foreground/30 p-4 text-center bg-muted/20">
                  <Download className="mb-2 h-6 w-6 text-primary" />
                  <p className="text-sm font-medium">导出当前目标数据</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    导出为 CSV 格式文件
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出当前版本
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4" />

          {/* 操作按钮区域 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">目标管理操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={handleSave} variant="default" size="sm">
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
              <Button onClick={handleConfirm} variant="default" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                确认
              </Button>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                修改记录
              </Button>
              <Button variant="outline" size="sm">
                版本管理
              </Button>
            </div>
          </div>

          {/* 版本历史 */}
          {versions.length > 1 && (
            <>
              <div className="border-t pt-4" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">版本历史</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {versions.map(version => (
                    <div
                      key={version.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded border text-sm',
                        version.id === currentVersionId
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/20 border-muted-foreground/20'
                      )}
                    >
                      <div>
                        <span className="font-medium">
                          {version.type === 'INIT' ? '初始' : '调整'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {version.id !== currentVersionId && (
                        <Button
                          onClick={() => switchVersion(version.id)}
                          variant="ghost"
                          size="sm"
                        >
                          切换
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 错误对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV 导入错误</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              发现 {issues.length} 个问题，请修正后重新导入：
            </p>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    {issue.rowIndex && `第 ${issue.rowIndex} 行：`}
                    {issue.message}
                    {issue.bizType && ` (业务类型: ${issue.bizType})`}
                    {issue.rawValue && ` (原始值: ${issue.rawValue})`}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
