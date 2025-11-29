/**
 * Dashboard Header Component
 * 顶部标题和操作栏
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingProgress } from '@/components/ui/loading-progress';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/features/file-upload';
import { UploadHistory } from '@/components/features/upload-history';
import { UploadWeekPreview } from '@/components/features/upload-week-preview';
import { UploadResultsDetail } from '@/components/features/upload-results-detail';
import { parseCSVFileV2 } from '@/lib/parsers/csv-parser-v2';
import type {
  ParseResult,
  UploadRecord,
  DataSummary,
  SmartComparisonOptions
} from '@/types';

interface DashboardHeaderProps {
  data: any[];
  isLoading: boolean;
  uploadHistory: UploadRecord[];
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  onDataUpdate: (newData: any[]) => void;
  premiumTargetsOverall?: number | null;
}

export function DashboardHeader({
  data,
  isLoading,
  uploadHistory,
  selectedTab,
  setSelectedTab,
  onDataUpdate,
  premiumTargetsOverall,
}: DashboardHeaderProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    isUploading: boolean;
    uploadProgress: number;
    currentFileName: string;
  }>({
    isUploading: false,
    uploadProgress: 0,
    currentFileName: '',
  });

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // 计算数据摘要
  const dataSummary = useMemo((): DataSummary => {
    const totalRecords = data.length;
    const totalPremium = data.reduce((sum, record) => sum + (record.total_premium || 0), 0);
    const avgPremium = totalRecords > 0 ? totalPremium / totalRecords : 0;
    const lastDate = data.length > 0 ?
      data.map(r => r.snapshot_date).sort().pop() : '';

    const weekGroups = data.reduce((acc, record) => {
      const week = record.week_number || 0;
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalRecords,
      totalPremium,
      avgPremium,
      lastDate,
      weekGroups,
      weekCount: Object.keys(weekGroups).length,
    };
  }, [data]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!files.length) return;

    setUploadStatus({
      isUploading: true,
      uploadProgress: 0,
      currentFileName: files[0]?.name || '',
    });

    try {
      const allResults: ParseResult[] = [];
      let totalProcessed = 0;
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(prev => ({
          ...prev,
          currentFileName: file.name,
        }));

        const result = await parseCSVFileV2(file, (progress) => {
          const fileProgress = (i + progress.percentage / 100) / totalFiles * 100;
          setUploadStatus(prev => ({
            ...prev,
            uploadProgress: fileProgress,
          }));
        });

        allResults.push(result);
        totalProcessed += result.stats.totalRows;
      }

      // 合并所有数据
      const mergedData = data.concat(
        ...allResults.map(r => r.data).flat()
      );
      onDataUpdate(mergedData);

      // 设置最后一个结果用于预览
      setParseResult(allResults[allResults.length - 1]);

      setUploadStatus({
        isUploading: false,
        uploadProgress: 100,
        currentFileName: '',
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({
        isUploading: false,
        uploadProgress: 0,
        currentFileName: '',
      });
    }
  }, [data, onDataUpdate]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">车险多维数据分析平台</CardTitle>
            <CardDescription className="mt-2">
              上传并分析车险数据，获取多维度业务洞察
            </CardDescription>
          </div>
          {data.length > 0 && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">当前数据量</div>
              <div className="text-3xl font-bold">{dataSummary.totalRecords.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">条记录</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload">数据上传</TabsTrigger>
            <TabsTrigger value="kpi">KPI指标</TabsTrigger>
            <TabsTrigger value="trends">趋势分析</TabsTrigger>
            <TabsTrigger value="multidimensional">多维分析</TabsTrigger>
            <TabsTrigger value="targets">目标对比</TabsTrigger>
            <TabsTrigger value="models">预测模型</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <div className="grid gap-6">
              {uploadStatus.isUploading && (
                <LoadingProgress
                  progress={{
                    loaded: Math.floor((uploadStatus.uploadProgress / 100) * dataSummary.totalRecords),
                    total: dataSummary.totalRecords || 1000,
                    percentage: uploadStatus.uploadProgress,
                  }}
                  loading={uploadStatus.isUploading}
                  stage={`正在处理 ${uploadStatus.currentFileName}...`}
                  showDetails={true}
                />
              )}

              <FileUpload onUpload={handleFileUpload} disabled={uploadStatus.isUploading} />

              {parseResult && (
                <div className="grid gap-4">
                  <UploadWeekPreview
                    parseResult={parseResult}
                    premiumTargetsOverall={premiumTargetsOverall}
                  />
                  <UploadResultsDetail parseResult={parseResult} />
                </div>
              )}

              <UploadHistory uploads={uploadHistory} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}