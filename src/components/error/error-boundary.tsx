/**
 * React 错误边界组件
 * 捕获并处理 React 组件树中的错误
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { globalErrorHandler, createAppError, ErrorType, ErrorSeverity } from '@/lib/errors/error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 创建应用错误
    const appError = createAppError(
      ErrorType.UNKNOWN,
      `React Error Boundary: ${error.message}`,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    // 处理错误
    globalErrorHandler.handle(appError, 'React Error Boundary');

    // 调用自定义错误处理器
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>出现了一些问题</CardTitle>
              <CardDescription>
                应用程序遇到了意外错误。请尝试刷新页面或稍后再试。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>

              {this.props.showErrorDetails && this.state.error && (
                <details className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <summary className="cursor-pointer font-medium">错误详情</summary>
                  <pre className="mt-2 overflow-auto text-xs text-gray-600">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 用于特定功能的错误边界
 */
interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export function FeatureErrorBoundary({
  children,
  featureName,
  fallback,
}: FeatureErrorBoundaryProps) {
  const handleFeatureError = (error: Error, errorInfo: ErrorInfo) => {
    const appError = createAppError(
      ErrorType.UNKNOWN,
      `Feature Error (${featureName}): ${error.message}`,
      ErrorSeverity.MEDIUM,
      {
        featureName,
        componentStack: errorInfo.componentStack,
      }
    );

    globalErrorHandler.handle(appError, `Feature: ${featureName}`);
  };

  const defaultFallback = (error: Error, reset: () => void) => (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-medium text-red-800">
          {featureName} 组件出现错误
        </h3>
      </div>
      <p className="mt-2 text-sm text-red-700">
        {error.message}
      </p>
      <Button
        onClick={reset}
        size="sm"
        variant="outline"
        className="mt-3"
      >
        重试
      </Button>
    </div>
  );

  return (
    <ErrorBoundary
      onError={handleFeatureError}
      fallback={fallback ? undefined : <div />}
    >
      {({ error, resetErrorBoundary }) => {
        if (error) {
          return fallback ? fallback(error, resetErrorBoundary) : defaultFallback(error, resetErrorBoundary);
        }
        return children;
      }}
    </ErrorBoundary>
  );
}