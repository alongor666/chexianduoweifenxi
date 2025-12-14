/**
 * 统一日志管理工具
 *
 * 特性：
 * - 支持多种日志级别（debug, info, warn, error）
 * - 环境变量控制日志输出
 * - 生产环境自动过滤 debug 日志
 * - 支持模块命名空间
 * - 结构化日志输出
 *
 * 使用示例：
 * ```ts
 * import { logger } from '@/lib/logger'
 *
 * // 创建带命名空间的日志器
 * const log = logger.create('DataService')
 *
 * log.debug('加载数据', { count: 100 })
 * log.info('上传成功', { fileId: 'abc123' })
 * log.warn('数据缺失', { field: 'premium' })
 * log.error('请求失败', { error: err })
 * ```
 */

/** 日志级别枚举 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/** 日志级别映射 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
}

/** 日志颜色（仅在开发环境） */
const LOG_COLORS = {
  [LogLevel.DEBUG]: '#6366f1', // indigo
  [LogLevel.INFO]: '#3b82f6', // blue
  [LogLevel.WARN]: '#f59e0b', // amber
  [LogLevel.ERROR]: '#ef4444', // red
}

/**
 * 获取当前环境的日志级别
 * 优先级：环境变量 > 生产环境默认 > 开发环境默认
 */
function getLogLevel(): LogLevel {
  // 从环境变量读取
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase()

  if (envLevel) {
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      case 'NONE':
        return LogLevel.NONE
    }
  }

  // 生产环境默认只记录警告和错误
  if (process.env.NODE_ENV === 'production') {
    return LogLevel.WARN
  }

  // 开发环境默认记录所有日志
  return LogLevel.DEBUG
}

/** 全局日志级别 */
const CURRENT_LOG_LEVEL = getLogLevel()

/** 日志格式化选项 */
interface LogOptions {
  /** 模块/命名空间 */
  namespace?: string
  /** 附加数据 */
  data?: unknown
  /** 时间戳 */
  timestamp?: boolean
}

/**
 * 格式化日志消息
 */
function formatMessage(
  level: LogLevel,
  message: string,
  options: LogOptions = {}
): string {
  const parts: string[] = []

  // 时间戳（默认启用）
  if (options.timestamp !== false) {
    const now = new Date()
    const time = now.toTimeString().split(' ')[0]
    parts.push(`[${time}]`)
  }

  // 日志级别
  parts.push(`[${LOG_LEVEL_NAMES[level]}]`)

  // 命名空间
  if (options.namespace) {
    parts.push(`[${options.namespace}]`)
  }

  // 消息
  parts.push(message)

  return parts.join(' ')
}

/**
 * 日志记录器类
 */
class Logger {
  private namespace?: string

  constructor(namespace?: string) {
    this.namespace = namespace
  }

  /**
   * 判断是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= CURRENT_LOG_LEVEL
  }

  /**
   * 内部日志方法
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return
    }

    const formatted = formatMessage(level, message, {
      namespace: this.namespace,
      data,
    })

    // 在浏览器中使用彩色输出
    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      const color = LOG_COLORS[level]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args: any[] = [
        `%c${formatted}`,
        `color: ${color}; font-weight: bold`,
      ]

      if (data !== undefined) {
        args.push('\n', data)
      }

      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(...args)
          break
        case LogLevel.WARN:
          console.warn(...args)
          break
        case LogLevel.ERROR:
          console.error(...args)
          break
      }
    } else {
      // Node.js 环境或生产环境：简单输出
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(formatted, data !== undefined ? data : '')
          break
        case LogLevel.WARN:
          console.warn(formatted, data !== undefined ? data : '')
          break
        case LogLevel.ERROR:
          console.error(formatted, data !== undefined ? data : '')
          break
      }
    }
  }

  /**
   * Debug 级别日志（开发环境专用）
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Warning 级别日志
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Error 级别日志
   */
  error(message: string, error?: unknown): void {
    // 如果是 Error 对象，提取堆栈信息
    let errorData = error
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    }

    this.log(LogLevel.ERROR, message, errorData)
  }

  /**
   * 创建带命名空间的日志器
   */
  create(namespace: string): Logger {
    return new Logger(namespace)
  }

  /**
   * 性能计时开始
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(`[${this.namespace || 'ROOT'}] ${label}`)
    }
  }

  /**
   * 性能计时结束
   */
  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(`[${this.namespace || 'ROOT'}] ${label}`)
    }
  }

  /**
   * 分组日志开始
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(`[${this.namespace || 'ROOT'}] ${label}`)
    }
  }

  /**
   * 分组日志结束
   */
  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd()
    }
  }

  /**
   * 表格输出（用于数组和对象）
   */
  table(data: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.table(data)
    }
  }
}

/**
 * 默认日志器实例
 */
export const logger = new Logger()

/**
 * 导出日志级别枚举供外部使用
 */
export { LogLevel as Level }

/**
 * 获取当前日志级别（用于调试）
 */
export function getCurrentLogLevel(): LogLevel {
  return CURRENT_LOG_LEVEL
}

/**
 * 获取日志级别名称
 */
export function getLogLevelName(level: LogLevel): string {
  return LOG_LEVEL_NAMES[level]
}
