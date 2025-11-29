/**
 * Dashboard Client V2 - 重构版本
 * 使用组件拆分和优化的状态管理
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { FeatureErrorBoundary } from '@/components/error/error-boundary';
import { LoadingProgress, FloatingLoadingProgress } from '@/components/ui/loading-progress';
import { DashboardHeader } from './dashboard-header';
import { DashboardKPITab } from './dashboard-kpi-tab';
import { TrendAnalysisTab } from './dashboard-trend-tab';
import { MultidimensionalTab } from './dashboard-multidimensional-tab';
import { TargetsTab } from './dashboard-targets-tab';
import { ModelsTab } from './dashboard-models-tab';
import { TopToolbar } from '@/components/layout/top-toolbar';
import { usePersistData } from '@/hooks/use-persist-data';
import { useOptimizedDataLoader } from '@/hooks/use-optimized-data-loader';
import type { InsuranceRecord, UploadRecord } from '@/types';
import type { AnalysisTabValue } from '@/types';

const initialTab: AnalysisTabValue = 'upload';

interface DashboardClientV2Props {
  initialData: InsuranceRecord[];
}

export function DashboardClientV2({ initialData }: DashboardClientV2Props) {
  // 状态管理
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTabValue>(
    initialTab === 'targets' ? 'kpi' : initialTab
  );

  // 使用优化的数据加载器（当没有初始数据时）
  const {
    data: loadedData,
    loading,
    error,
    progress,
    reload,
  } = useOptimizedDataLoader({
    autoLoad: initialData.length === 0,
    onProgress: (loaded, total) => {
      console.log(`加载进度: ${loaded}/${total} (${Math.round((loaded / total) * 100)}%)`);
    },
  });

  // 持久化数据和上传历史
  const {
    data,
    setData,
    uploadHistory,
    addUploadRecord,
    clearData,
    clearHistory,
  } = usePersistData(initialData.length > 0 ? initialData : loadedData);

  // 防止服务端渲染hydration错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 处理数据更新
  const handleDataUpdate = useCallback((newData: InsuranceRecord[]) => {
    setData(newData);
    if (newData.length > data.length) {
      addUploadRecord({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        fileName: '批量上传',
        recordCount: newData.length - data.length,
        totalRows: newData.length,
        validRows: newData.length,
        invalidRows: 0,
      });
    }
  }, [data.length, setData, addUploadRecord]);

  // 计算保费目标
  const premiumTargetsOverall = useMemo(() => {
    const weeklyTargets = {
      '1': 1800000, '2': 3800000, '3': 5800000, '4': 7800000,
      '5': 9800000, '6': 11800000, '7': 13800000, '8': 15800000,
      '9': 17800000, '10': 19800000, '11': 21800000, '12': 23800000,
      '13': 25800000, '14': 27800000, '15': 29800000, '16': 31800000,
      '17': 33800000, '18': 35800000, '19': 37800000, '20': 39800000,
      '21': 41800000, '22': 43800000, '23': 45800000, '24': 47800000,
      '25': 49800000, '26': 51800000, '27': 53800000, '28': 55800000,
      '29': 57800000, '30': 59800000, '31': 61800000, '32': 63800000,
      '33': 65800000, '34': 67800000, '35': 69800000, '36': 71800000,
      '37': 73800000, '38': 75800000, '39': 77800000, '40': 79800000,
      '41': 81800000, '42': 83800000, '43': 85800000, '44': 87800000,
      '45': 89800000, '46': 91800000, '47': 93800000, '48': 95800000,
      '49': 97800000, '50': 99800000, '51': 101800000, '52': 103800000,
    };

    const currentWeek = Math.max(...data.map(d => d.week_number || 0));
    return weeklyTargets[currentWeek as keyof typeof weeklyTargets] || null;
  }, [data]);

  // 渲染标签页内容
  const renderTabContent = () => {
    // 如果正在加载数据且没有现有数据，显示加载进度
    if (loading && data.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[600px]">
          <LoadingProgress
            progress={progress}
            loading={loading}
            stage="正在加载数据文件..."
            showDetails={true}
          />
        </div>
      );
    }

    if (!mounted) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-muted-foreground">初始化中...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'kpi':
        return (
          <DashboardKPITab
            data={data}
            premiumTargetsOverall={premiumTargetsOverall}
          />
        );

      case 'trends':
        return <TrendAnalysisTab data={data} />;

      case 'multidimensional':
        return <MultidimensionalTab data={data} />;

      case 'targets':
        return (
          <TargetsTab
            data={data}
            annualTarget={premiumTargetsOverall}
          />
        );

      case 'models':
        return <ModelsTab data={data} />;

      default:
        return null;
    }
  };

  // 防止服务端渲染和客户端不匹配
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">初始化中...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* 悬浮加载进度条 - 用于后台数据加载 */}
        {loading && data.length > 0 && (
          <FloatingLoadingProgress
            progress={progress}
            loading={loading}
            stage="正在刷新数据..."
          />
        )}

        <FeatureErrorBoundary featureName="TopToolbar">
          <TopToolbar
            data={data}
            onClearData={clearData}
            onClearHistory={clearHistory}
          />
        </FeatureErrorBoundary>

        <div className="container mx-auto p-6 max-w-7xl">
          <FeatureErrorBoundary featureName="DashboardHeader">
            <DashboardHeader
              data={data}
              isLoading={false}
              uploadHistory={uploadHistory}
              selectedTab={activeTab}
              setSelectedTab={setActiveTab}
              onDataUpdate={handleDataUpdate}
              premiumTargetsOverall={premiumTargetsOverall}
            />
          </FeatureErrorBoundary>

          {activeTab !== 'upload' && (
            <div className="mt-6">
              <FeatureErrorBoundary featureName={`Tab-${activeTab}`}>
                {renderTabContent()}
              </FeatureErrorBoundary>
            </div>
          )}
        </div>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}