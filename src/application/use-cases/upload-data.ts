/**
 * 上传数据用例（Upload Data Use Case）
 *
 * 负责处理文件上传的完整流程：
 * 1. 验证文件
 * 2. 解析数据
 * 3. 规范化数据
 * 4. 保存到仓储
 *
 * @layer Application
 * @depends Domain (normalizeInsuranceRecordsBatch)
 * @depends Ports (IFileParser, IDataRepository)
 */

import type { IFileParser, ValidationResult } from '../ports/IFileParser'
import type { IDataRepository } from '../ports/IDataRepository'
import { normalizeInsuranceRecordsBatch } from '../../domain'

/**
 * 上传数据用例
 *
 * 采用依赖注入模式，通过构造函数注入依赖。
 */
export class UploadDataUseCase {
  constructor(
    private readonly parser: IFileParser,
    private readonly repository: IDataRepository
  ) {}

  /**
   * 执行上传数据流程
   *
   * @param file - 上传的文件对象
   * @returns Promise<UploadResult> - 上传结果
   * @throws UploadError - 上传过程中的错误
   */
  async execute(file: File): Promise<UploadResult> {
    try {
      // 步骤 1: 验证文件
      const validation = await this.validateFile(file)
      if (!validation.isValid) {
        throw new UploadError(
          'FILE_VALIDATION_FAILED',
          '文件验证失败',
          validation.errors
        )
      }

      // 步骤 2: 解析文件
      const rawRecords = await this.parser.parse(file)
      if (rawRecords.length === 0) {
        throw new UploadError('EMPTY_FILE', '文件中没有有效数据')
      }

      // 步骤 3: 规范化数据（调用 Domain 层）
      const normalizationResult = normalizeInsuranceRecordsBatch(rawRecords)

      // 步骤 4: 保存到仓储（只保存成功的记录）
      if (normalizationResult.success.length > 0) {
        await this.repository.save(normalizationResult.success)
      }

      // 返回结果
      return {
        success: true,
        totalRecords: rawRecords.length,
        validRecords: normalizationResult.success.length,
        invalidRecords: normalizationResult.failed.length,
        warnings: validation.warnings,
        errors: normalizationResult.failed.map(f => ({
          message: f.error.message,
          row: f.index,
        })),
      }
    } catch (error) {
      if (error instanceof UploadError) {
        throw error
      }
      throw new UploadError(
        'UNKNOWN_ERROR',
        '上传过程中发生未知错误',
        undefined,
        error
      )
    }
  }

  /**
   * 验证文件
   *
   * @param file - 上传的文件对象
   * @returns Promise<ValidationResult> - 验证结果
   */
  private async validateFile(file: File): Promise<ValidationResult> {
    // 验证文件类型
    const supportedTypes = this.parser.getSupportedFileTypes()
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !supportedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        errors: [
          {
            type: 'INVALID_FILE_FORMAT' as any,
            message: `不支持的文件格式。支持的格式：${supportedTypes.join(', ')}`,
          },
        ],
        warnings: [],
      }
    }

    // 使用解析器验证文件内容
    return await this.parser.validate(file)
  }
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 是否成功 */
  success: boolean

  /** 总记录数 */
  totalRecords: number

  /** 有效记录数 */
  validRecords: number

  /** 无效记录数 */
  invalidRecords: number

  /** 警告信息 */
  warnings: Array<{ message: string; row?: number }>

  /** 错误信息 */
  errors?: Array<{ message: string; row?: number }>
}

/**
 * 上传错误
 */
export class UploadError extends Error {
  constructor(
    public readonly code: UploadErrorCode,
    message: string,
    public readonly validationErrors?: Array<{ message: string }>,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'UploadError'
  }
}

/**
 * 上传错误代码
 */
export type UploadErrorCode =
  | 'FILE_VALIDATION_FAILED'
  | 'EMPTY_FILE'
  | 'PARSE_ERROR'
  | 'SAVE_ERROR'
  | 'UNKNOWN_ERROR'
