/**
 * 文件解析器接口（File Parser Port）
 *
 * 定义文件解析和验证的抽象接口。
 * 具体实现可以是：CSV Parser、Excel Parser 等。
 *
 * @layer Application
 * @depends Domain (InsuranceRecord, RawInsuranceData)
 */

import type { InsuranceRecord, RawInsuranceData } from '../../domain'

/**
 * 文件解析器接口
 *
 * 负责将上传的文件解析为业务实体。
 */
export interface IFileParser {
  /**
   * 解析文件
   * @param file - 上传的文件对象
   * @returns Promise<RawInsuranceData[]> - 原始保险数据数组
   */
  parse(file: File): Promise<RawInsuranceData[]>

  /**
   * 验证文件格式和内容
   * @param file - 上传的文件对象
   * @returns Promise<ValidationResult> - 验证结果
   */
  validate(file: File): Promise<ValidationResult>

  /**
   * 获取支持的文件类型
   * @returns string[] - 支持的文件扩展名列表
   */
  getSupportedFileTypes(): string[]
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean

  /** 错误信息列表 */
  errors: ValidationError[]

  /** 警告信息列表 */
  warnings: ValidationWarning[]

  /** 验证的总行数 */
  totalRows?: number

  /** 有效行数 */
  validRows?: number
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误类型 */
  type: ValidationErrorType

  /** 错误消息 */
  message: string

  /** 错误所在行号（如果适用） */
  row?: number

  /** 错误所在字段（如果适用） */
  field?: string

  /** 错误的值（如果适用） */
  value?: unknown
}

/**
 * 验证错误类型
 */
export enum ValidationErrorType {
  /** 文件格式错误 */
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',

  /** 缺少必需字段 */
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  /** 字段类型错误 */
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',

  /** 字段值超出范围 */
  VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',

  /** 重复数据 */
  DUPLICATE_DATA = 'DUPLICATE_DATA',

  /** 文件为空 */
  EMPTY_FILE = 'EMPTY_FILE',

  /** 文件过大 */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告类型 */
  type: ValidationWarningType

  /** 警告消息 */
  message: string

  /** 警告所在行号 */
  row?: number

  /** 警告所在字段 */
  field?: string
}

/**
 * 验证警告类型
 */
export enum ValidationWarningType {
  /** 可疑数据 */
  SUSPICIOUS_DATA = 'SUSPICIOUS_DATA',

  /** 数据已自动修正 */
  AUTO_CORRECTED = 'AUTO_CORRECTED',

  /** 使用默认值 */
  DEFAULT_VALUE_USED = 'DEFAULT_VALUE_USED',
}
