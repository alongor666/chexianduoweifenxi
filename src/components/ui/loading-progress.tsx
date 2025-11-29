/**
 * 优雅的数据加载进度条组件
 * 提供美观的进度指示和详细的加载状态
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText, Database, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProgressProps {
  /**
   * 加载进度信息
   */
  progress: {
    loaded: number;
    total: number;
    percentage: number;
  };

  /**
   * 是否正在加载
   */
  loading: boolean;

  /**
   * 加载阶段描述
   */
  stage?: string;

  /**
   * 是否显示详细信息
   */
  showDetails?: boolean;

  /**
   * 自定义样式类名
   */
  className?: string;
}

const loadingStages = [
  { key: 'init', icon: Loader2, text: '初始化数据加载器...' },
  { key: 'connecting', icon: Database, text: '连接数据源...' },
  { key: 'reading', icon: FileText, text: '读取数据文件...' },
  { key: 'parsing', icon: FileText, text: '解析数据格式...' },
  { key: 'processing', icon: Database, text: '处理数据记录...' },
  { key: 'validating', icon: CheckCircle, text: '验证数据完整性...' },
  { key: 'completed', icon: CheckCircle, text: '加载完成！' },
];

export function LoadingProgress({
  progress,
  loading,
  stage,
  showDetails = true,
  className,
}: LoadingProgressProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // 根据进度计算当前阶段
  useEffect(() => {
    if (!loading) {
      setCurrentStageIndex(loadingStages.length - 1);
      return;
    }

    const stageIndex = Math.min(
      Math.floor((progress.percentage / 100) * (loadingStages.length - 1)),
      loadingStages.length - 2
    );
    setCurrentStageIndex(stageIndex);
  }, [progress.percentage, loading]);

  // 平滑动画百分比
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(progress.percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress.percentage]);

  // 如果没有在加载且进度为0，不显示组件
  if (!loading && progress.percentage === 0) {
    return null;
  }

  const CurrentIcon = loadingStages[currentStageIndex].icon;
  const currentStageText = stage || loadingStages[currentStageIndex].text;

  return (
    <div className={cn(
      "w-full max-w-md mx-auto p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50",
      className
    )}>
      {/* 主进度指示器 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <CurrentIcon className={cn(
            "h-5 w-5 transition-colors duration-300",
            loading ? "text-blue-600 animate-spin" : "text-green-600"
          )} />
          {loading && (
            <div className="absolute -inset-1 h-5 w-5 bg-blue-100 rounded-full opacity-30 animate-ping" />
          )}
        </div>
        <span className="text-sm font-medium text-slate-700">
          {currentStageText}
        </span>
      </div>

      {/* 进度条容器 */}
      <div className="relative mb-3">
        {/* 背景轨道 */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          {/* 进度条 */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out relative",
              loading ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-green-500 to-green-600"
            )}
            style={{ width: `${animatedPercentage}%` }}
          >
            {/* 光泽效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full" />
          </div>
        </div>

        {/* 百分比标签 */}
        <div className="absolute -top-6 right-0">
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            loading ? "text-blue-600" : "text-green-600"
          )}>
            {animatedPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      {showDetails && (loading || progress.total > 0) && (
        <div className="space-y-2">
          {/* 数据统计 */}
          <div className="flex justify-between text-xs text-slate-600">
            <span>已加载数据</span>
            <span className="font-mono font-semibold">
              {progress.loaded.toLocaleString('zh-CN')} / {progress.total.toLocaleString('zh-CN')} 条
            </span>
          </div>

          {/* 进度阶段指示器 */}
          <div className="flex items-center gap-1 pt-1">
            {loadingStages.slice(0, -1).map((stage, index) => (
              <div
                key={stage.key}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-300",
                  index <= currentStageIndex
                    ? index < currentStageIndex
                      ? "bg-green-500"
                      : loading
                        ? "bg-blue-500"
                        : "bg-green-500"
                    : "bg-slate-200"
                )}
              />
            ))}
          </div>

          {/* 当前处理速度（如果有的话） */}
          {loading && progress.loaded > 0 && progress.total > 0 && (
            <div className="text-xs text-slate-500">
              预计还需加载 {Math.ceil(((progress.total - progress.loaded) / progress.loaded) * 10)} 秒...
            </div>
          )}
        </div>
      )}

      {/* 完成状态 */}
      {!loading && progress.percentage === 100 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">数据加载完成！</span>
        </div>
      )}
    </div>
  );
}

/**
 * 简化版进度条 - 用于空间有限的场景
 */
export function CompactLoadingProgress({
  progress,
  loading,
  className,
}: Pick<LoadingProgressProps, 'progress' | 'loading' | 'className'>) {
  if (!loading && progress.percentage === 0) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Loader2 className={cn(
        "h-4 w-4 text-blue-600",
        loading && "animate-spin"
      )} />
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 min-w-[3rem] text-right">
        {progress.percentage.toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * 悬浮式加载提示 - 用于不影响主界面的加载状态
 */
export function FloatingLoadingProgress({
  progress,
  loading,
  stage,
}: Pick<LoadingProgressProps, 'progress' | 'loading' | 'stage'>) {
  if (!loading && progress.percentage === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-xs font-medium text-slate-700 truncate">
            {stage || "正在加载数据..."}
          </span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}