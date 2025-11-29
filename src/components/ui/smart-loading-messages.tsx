/**
 * 智能加载消息组件
 * 显示动态生成的加载提示
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { generateLoadingMessage, LoadingMessage } from '@/lib/utils/loading-message-generator';

interface SmartLoadingMessagesProps {
  /**
   * 加载进度
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
   * 当前阶段
   */
  stage?: string;

  /**
   * 数据类型
   */
  dataType?: 'csv' | 'json' | 'excel' | 'api' | 'database' | 'local';

  /**
   * 文件名或数据源
   */
  sourceName?: string;

  /**
   * 周数（用于周数据）
   */
  weekNumber?: number;

  /**
   * 是否显示详细信息
   */
  verbose?: boolean;

  /**
   * 自定义样式类名
   */
  className?: string;

  /**
   * 动画类型
   */
  animation?: 'fade' | 'slide' | 'none';
}

export function SmartLoadingMessages({
  progress,
  loading,
  stage = '',
  dataType = 'local',
  sourceName,
  weekNumber,
  verbose = false,
  className,
  animation = 'fade',
}: SmartLoadingMessagesProps) {
  const [message, setMessage] = useState<LoadingMessage | null>(null);
  const [previousStage, setPreviousStage] = useState<string>('');

  // 推断当前阶段
  const inferStage = () => {
    if (!loading) return 'completed';
    if (progress.percentage === 0) return 'init';
    if (progress.percentage < 10) return 'connecting';
    if (progress.percentage < 30) return 'reading';
    if (progress.percentage < 60) return 'parsing';
    if (progress.percentage < 90) return 'processing';
    return 'validating';
  };

  // 生成消息
  useEffect(() => {
    const currentStage = inferStage();

    // 更新消息
    const newMessage = generateLoadingMessage({
      stage: currentStage as any,
      dataType,
      progress: progress.percentage,
      loaded: progress.loaded,
      total: progress.total,
      sourceName,
      weekNumber,
      verbose,
    });

    // 只有在阶段变化或进度有明显变化时才更新
    if (currentStage !== previousStage || Math.abs(progress.percentage - (message?.primary?.match(/(\d+\.\d+)%/)?.[1] ? parseFloat(message.primary.match(/(\d+\.\d+)%/)![1]) : 0)) > 1) {
      setMessage(newMessage);
      setPreviousStage(currentStage);
    }
  }, [progress, loading, stage, dataType, sourceName, weekNumber, verbose, previousStage]);

  if (!loading || !message) return null;

  const animationClass = {
    fade: 'animate-fade-in',
    slide: 'animate-slide-in',
    none: '',
  }[animation];

  return (
    <div className={cn(
      "space-y-2",
      className,
      animationClass
    )}>
      {/* 主要消息 */}
      <div className="text-base font-medium text-slate-700">
        {message.primary}
      </div>

      {/* 次要消息 */}
      {message.secondary && (
        <div className="text-sm text-slate-600">
          {message.secondary}
        </div>
      )}

      {/* 详细消息 */}
      {message.detail && (
        <div className="text-xs text-slate-500">
          {message.detail}
        </div>
      )}

      {/* 进度可视化 */}
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse" />
          </div>
        </div>
        <span className="text-sm font-semibold text-slate-600 min-w-[3rem] text-right">
          {progress.percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * 简化版加载消息组件
 */
export function CompactLoadingMessage({
  progress,
  loading,
  stage,
  className,
}: Pick<SmartLoadingMessagesProps, 'progress' | 'loading' | 'stage' | 'className'>) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (loading) {
      const msg = generateLoadingMessage({
        stage: 'processing' as any,
        progress: progress.percentage,
        loaded: progress.loaded,
        total: progress.total,
      });
      setMessage(msg.primary);
    }
  }, [progress, loading]);

  if (!loading) return null;

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-slate-600">{message || '正在处理...'}</span>
    </div>
  );
}

/**
 * 悬浮式智能消息提示
 */
export function FloatingSmartLoadingMessage({
  progress,
  loading,
  stage,
  dataType = 'local',
  sourceName,
}: Pick<SmartLoadingMessagesProps, 'progress' | 'loading' | 'stage' | 'dataType' | 'sourceName'>) {
  if (!loading) return null;

  const message = generateLoadingMessage({
    stage: 'processing' as any,
    dataType,
    progress: progress.percentage,
    loaded: progress.loaded,
    total: progress.total,
    sourceName,
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium text-slate-700">
              {message.primary}
            </div>
            {message.secondary && (
              <div className="text-xs text-slate-500">
                {message.secondary}
              </div>
            )}
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}