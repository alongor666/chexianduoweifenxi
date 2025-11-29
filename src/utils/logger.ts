/**
 * 统一日志工具
 * 应用 DRY 原则，统一管理所有 console 输出
 * 提供命名空间、日志级别控制和格式化输出
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  /**
   * 是否启用日志（生产环境可以禁用）
   */
  enabled?: boolean;

  /**
   * 最小日志级别
   */
  minLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 创建带命名空间的日志记录器
 * @param namespace 命名空间（如 "DataStore"、"FilterStore"）
 * @param options 日志选项
 * @returns 日志记录器
 */
export function createLogger(namespace: string, options: LoggerOptions = {}) {
  const { enabled = true, minLevel = "debug" } = options;
  const minLevelValue = LOG_LEVELS[minLevel];

  const shouldLog = (level: LogLevel) => {
    return enabled && LOG_LEVELS[level] >= minLevelValue;
  };

  const formatMessage = (level: LogLevel, message: string) => {
    const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    return `[${timestamp}] [${namespace}] ${message}`;
  };

  return {
    /**
     * 调试日志
     */
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog("debug")) {
        // eslint-disable-next-line no-console
        console.log(formatMessage("debug", message), ...args);
      }
    },

    /**
     * 信息日志
     */
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog("info")) {
        // eslint-disable-next-line no-console
        console.log(formatMessage("info", message), ...args);
      }
    },

    /**
     * 警告日志
     */
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog("warn")) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage("warn", message), ...args);
      }
    },

    /**
     * 错误日志
     */
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog("error")) {
        // eslint-disable-next-line no-console
        console.error(formatMessage("error", message), ...args);
      }
    },

    /**
     * 性能测量
     */
    time: (label: string) => {
      if (shouldLog("debug")) {
        // eslint-disable-next-line no-console
        console.time(formatMessage("debug", label));
      }
    },

    /**
     * 结束性能测量
     */
    timeEnd: (label: string) => {
      if (shouldLog("debug")) {
        // eslint-disable-next-line no-console
        console.timeEnd(formatMessage("debug", label));
      }
    },
  };
}

/**
 * 全局日志实例（用于非 Store 场景）
 */
export const logger = createLogger("App");
