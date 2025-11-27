'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logger } from '@/lib/logger'

const log = logger.create('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * 错误边界组件
 * 捕获子组件树中的JavaScript错误,记录错误并显示备用UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    log.error('捕获到错误', { error, errorInfo })

    this.setState({
      error,
      errorInfo,
    })

    // 这里可以将错误信息发送到错误监控服务
    // 例如: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback,则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认的错误UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            {/* 错误图标 */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">
              糟糕! 出现了一些问题
            </h1>

            {/* 错误描述 */}
            <p className="text-slate-600 text-center mb-6">
              应用程序遇到了意外错误。您可以尝试刷新页面,如果问题持续存在,请联系技术支持。
            </p>

            {/* 错误详情(仅在开发环境显示) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  错误详情:
                </h3>
                <p className="text-xs text-red-600 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-800">
                      查看错误堆栈
                    </summary>
                    <pre className="mt-2 text-xs text-slate-600 overflow-auto max-h-64 p-2 bg-white rounded border border-slate-200">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                刷新页面
              </button>
            </div>

            {/* 帮助提示 */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                常见解决方法:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>清除浏览器缓存后重试</li>
                <li>检查数据文件格式是否正确</li>
                <li>确保上传的CSV文件编码为UTF-8</li>
                <li>尝试使用较小的数据集测试</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 高阶组件:为任何组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
