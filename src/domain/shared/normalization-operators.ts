/**
 * Domain 层 - 数据归一化算子抽象
 *
 * 核心功能：
 * - 提供通用的数据清洗和规范化算法
 * - 支持多种数据类型的转换
 * - 统一的验证和错误处理
 * - 可配置的规范化规则
 */

/**
 * 规范化结果接口
 */
export interface NormalizationResult<T> {
  /** 规范化后的值 */
  value: T
  /** 是否成功 */
  success: boolean
  /** 原始值 */
  originalValue: unknown
  /** 错误信息（如果失败） */
  error?: string
}

/**
 * 验证规则接口
 */
export interface ValidationRule<T = any> {
  /** 验证函数 */
  validate: (value: T) => boolean | string
  /** 错误消息 */
  message?: string
}

/**
 * 规范化配置接口
 */
export interface NormalizationConfig<T> {
  /** 默认值 */
  defaultValue: T
  /** 验证规则列表 */
  validationRules?: ValidationRule<T>[]
  /** 是否允许空值 */
  allowNull?: boolean
  /** 自定义转换函数 */
  transformer?: (value: unknown) => T
}

/**
 * 文本规范化配置
 */
export interface TextNormalizationConfig extends NormalizationConfig<string> {
  /** 是否移除零宽字符 */
  removeZeroWidth?: boolean
  /** 是否将全角空格转为半角 */
  normalizeSpaces?: boolean
  /** 是否移除首尾空格 */
  trim?: boolean
  /** 是否合并连续空格 */
  collapseSpaces?: boolean
  /** 是否转为小写 */
  toLowerCase?: boolean
  /** 是否转为大写 */
  toUpperCase?: boolean
}

/**
 * 数字规范化配置
 */
export interface NumberNormalizationConfig extends NormalizationConfig<number> {
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 小数位数 */
  decimals?: number
  /** 是否允许负数 */
  allowNegative?: boolean
}

/**
 * 日期规范化配置
 */
export interface DateNormalizationConfig extends NormalizationConfig<string> {
  /** 目标格式 */
  format?: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'
  /** 是否自动修复常见格式错误 */
  autoFix?: boolean
}

/**
 * 通用规范化算子
 *
 * @param value - 原始值
 * @param config - 规范化配置
 * @returns 规范化结果
 */
export function normalize<T>(
  value: unknown,
  config: NormalizationConfig<T>
): NormalizationResult<T> {
  try {
    // 处理空值
    if (value === null || value === undefined) {
      if (config.allowNull) {
        return {
          value: value as T,
          success: true,
          originalValue: value,
        }
      } else {
        return {
          value: config.defaultValue,
          success: true,
          originalValue: value,
        }
      }
    }

    // 自定义转换
    let normalizedValue: T
    if (config.transformer) {
      normalizedValue = config.transformer(value)
    } else {
      // 默认类型转换
      normalizedValue = value as T
    }

    // 验证规则
    if (config.validationRules) {
      for (const rule of config.validationRules) {
        const result = rule.validate(normalizedValue)
        if (result === false) {
          return {
            value: config.defaultValue,
            success: false,
            originalValue: value,
            error: rule.message || '验证失败',
          }
        } else if (typeof result === 'string') {
          return {
            value: config.defaultValue,
            success: false,
            originalValue: value,
            error: result,
          }
        }
      }
    }

    return {
      value: normalizedValue,
      success: true,
      originalValue: value,
    }
  } catch (error) {
    return {
      value: config.defaultValue,
      success: false,
      originalValue: value,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 文本规范化算子
 *
 * @param text - 原始文本
 * @param config - 文本规范化配置
 * @returns 规范化结果
 */
export function normalizeText(
  text: unknown,
  config: Partial<TextNormalizationConfig> = {}
): NormalizationResult<string> {
  const defaultConfig: TextNormalizationConfig = {
    defaultValue: '',
    removeZeroWidth: true,
    normalizeSpaces: true,
    trim: true,
    collapseSpaces: true,
    allowNull: false,
  }

  const finalConfig = { ...defaultConfig, ...config }

  return normalize(text, {
    defaultValue: finalConfig.defaultValue,
    allowNull: finalConfig.allowNull,
    transformer: (value: unknown): string => {
      if (typeof value !== 'string') {
        return finalConfig.defaultValue
      }

      let result = value

      // 移除零宽字符
      if (finalConfig.removeZeroWidth) {
        result = result.replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '')
      }

      // 规范化空格
      if (finalConfig.normalizeSpaces) {
        result = result.replace(/\u3000/g, ' ')
      }

      // 移除首尾空格
      if (finalConfig.trim) {
        result = result.trim()
      }

      // 合并连续空格
      if (finalConfig.collapseSpaces) {
        result = result.replace(/\s+/g, ' ')
      }

      // 大小写转换
      if (finalConfig.toLowerCase) {
        result = result.toLowerCase()
      } else if (finalConfig.toUpperCase) {
        result = result.toUpperCase()
      }

      return result
    },
  })
}

/**
 * 数字规范化算子
 *
 * @param value - 原始值
 * @param config - 数字规范化配置
 * @returns 规范化结果
 */
export function normalizeNumber(
  value: unknown,
  config: Partial<NumberNormalizationConfig> = {}
): NormalizationResult<number> {
  const defaultConfig: NumberNormalizationConfig = {
    defaultValue: 0,
    allowNegative: true,
    allowNull: false,
  }

  const finalConfig = { ...defaultConfig, ...config }

  return normalize(value, {
    defaultValue: finalConfig.defaultValue,
    allowNull: finalConfig.allowNull,
    transformer: (value: unknown): number => {
      let result: number

      // 如果已经是有效数字，直接返回
      if (typeof value === 'number' && Number.isFinite(value)) {
        result = value
      } else if (typeof value === 'string') {
        // 尝试将字符串转换为数字
        const trimmed = value.trim()
        if (trimmed === '') {
          return finalConfig.defaultValue
        }
        const parsed = Number(trimmed)
        if (Number.isFinite(parsed)) {
          result = parsed
        } else {
          return finalConfig.defaultValue
        }
      } else if (typeof value === 'boolean') {
        // 布尔值转数字
        result = value ? 1 : 0
      } else {
        return finalConfig.defaultValue
      }

      // 处理小数位数
      if (finalConfig.decimals !== undefined && typeof result === 'number') {
        const precision = Math.pow(10, finalConfig.decimals)
        result = Math.round(result * precision) / precision
      }

      return result
    },
    validationRules:
      finalConfig.min !== undefined || finalConfig.max !== undefined
        ? [
            {
              validate: (num: number) => {
                if (finalConfig.min !== undefined && num < finalConfig.min) {
                  return false
                }
                if (finalConfig.max !== undefined && num > finalConfig.max) {
                  return false
                }
                if (!finalConfig.allowNegative && num < 0) {
                  return false
                }
                return true
              },
              message: `数字必须在${finalConfig.min ?? '-∞'}到${finalConfig.max ?? '∞'}之间`,
            },
          ]
        : undefined,
  })
}

/**
 * 布尔值规范化算子
 *
 * @param value - 原始值
 * @param config - 规范化配置
 * @returns 规范化结果
 */
export function normalizeBoolean(
  value: unknown,
  config: Partial<NormalizationConfig<boolean>> = {}
): NormalizationResult<boolean> {
  const defaultConfig: NormalizationConfig<boolean> = {
    defaultValue: false,
    allowNull: false,
  }

  const finalConfig = { ...defaultConfig, ...config }

  return normalize(value, {
    defaultValue: finalConfig.defaultValue,
    allowNull: finalConfig.allowNull,
    transformer: (value: unknown): boolean => {
      if (typeof value === 'boolean') {
        return value
      }

      if (typeof value === 'number') {
        return value !== 0
      }

      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim()
        const trueValues = ['true', '是', 'yes', '1', 'on', 'enabled']
        const falseValues = ['false', '否', 'no', '0', 'off', 'disabled']

        if (trueValues.includes(lower)) {
          return true
        }
        if (falseValues.includes(lower)) {
          return false
        }
      }

      return finalConfig.defaultValue
    },
  })
}

/**
 * 日期规范化算子
 *
 * @param value - 原始值
 * @param config - 日期规范化配置
 * @returns 规范化结果
 */
export function normalizeDate(
  value: unknown,
  config: Partial<DateNormalizationConfig> = {}
): NormalizationResult<string> {
  const defaultConfig: DateNormalizationConfig = {
    defaultValue: '',
    format: 'YYYY-MM-DD',
    autoFix: true,
    allowNull: false,
  }

  const finalConfig = { ...defaultConfig, ...config }

  return normalize(value, {
    defaultValue: finalConfig.defaultValue,
    allowNull: finalConfig.allowNull,
    transformer: (value: unknown): string => {
      if (typeof value !== 'string') {
        return finalConfig.defaultValue
      }

      const trimmed = value.trim()

      // 已经是目标格式
      if (
        finalConfig.format === 'YYYY-MM-DD' &&
        /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ) {
        return trimmed
      }
      if (
        finalConfig.format === 'YYYY/MM/DD' &&
        /^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)
      ) {
        return trimmed
      }

      // 自动修复常见格式
      if (finalConfig.autoFix) {
        // 转换 YYYY/MM/DD 或 YYYY.MM.DD 格式
        if (/^\d{4}[\/\.]\d{2}[\/\.]\d{2}$/.test(trimmed)) {
          const normalized = trimmed.replace(/[\/\.]/g, '-')
          if (finalConfig.format === 'YYYY-MM-DD') {
            return normalized
          }
        }

        // 转换 YYYY-MM-DD 到 YYYY/MM/DD
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(trimmed) &&
          finalConfig.format === 'YYYY/MM/DD'
        ) {
          return trimmed.replace(/-/g, '/')
        }
      }

      return finalConfig.defaultValue
    },
  })
}

/**
 * 批量规范化算子
 *
 * @param values - 原始值数组
 * @param config - 规范化配置
 * @returns 规范化结果数组
 */
export function normalizeBatch<T>(
  values: unknown[],
  config: NormalizationConfig<T>
): NormalizationResult<T>[] {
  return values.map(value => normalize(value, config))
}

/**
 * 对象规范化算子
 *
 * 对对象的指定属性进行规范化。
 *
 * @param obj - 原始对象
 * @param fieldConfigs - 字段规范化配置映射
 * @returns 规范化后的对象
 */
export function normalizeObject<T extends Record<string, any>>(
  obj: T,
  fieldConfigs: Record<keyof T, NormalizationConfig<any>>
): T {
  const result = { ...obj }

  for (const [field, config] of Object.entries(fieldConfigs)) {
    const fieldName = field as keyof T
    const normalizationResult = normalize(obj[fieldName], config)

    if (normalizationResult.success) {
      result[fieldName] = normalizationResult.value
    } else {
      // 验证失败时使用默认值
      result[fieldName] = config.defaultValue
    }
  }

  return result
}
