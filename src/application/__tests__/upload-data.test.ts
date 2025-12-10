/**
 * 上传数据用例单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UploadDataUseCase, UploadError } from '../use-cases/upload-data'
import type { IFileParser } from '../ports/IFileParser'
import type { IDataRepository } from '../ports/IDataRepository'
import type { RawInsuranceData, InsuranceRecord } from '../../domain'
import { createTestRawData } from './test-helpers'

// Mock 实现
class MockFileParser implements IFileParser {
  async parse(file: File): Promise<RawInsuranceData[]> {
    // 模拟解析结果
    return [createTestRawData()]
  }

  async validate(file: File) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      totalRows: 1,
      validRows: 1,
    }
  }

  getSupportedFileTypes(): string[] {
    return ['csv', 'xlsx']
  }
}

class MockDataRepository implements IDataRepository {
  private data: InsuranceRecord[] = []

  async save(records: InsuranceRecord[]): Promise<void> {
    this.data = records
  }

  async findAll(): Promise<InsuranceRecord[]> {
    return this.data
  }

  async findByWeek(weekNumber: number): Promise<InsuranceRecord[]> {
    return this.data.filter(r => r.weekNumber === weekNumber)
  }

  async findByYear(year: number): Promise<InsuranceRecord[]> {
    return this.data.filter(r => r.policyStartYear === year)
  }

  async findByFilters(filters: any): Promise<InsuranceRecord[]> {
    return this.data
  }

  async clear(): Promise<void> {
    this.data = []
  }

  async getStats(): Promise<any> {
    return {
      totalRecords: this.data.length,
      availableYears: [],
      weekRange: { min: 1, max: 52 },
      lastUpdated: new Date(),
    }
  }
}

describe('UploadDataUseCase', () => {
  let useCase: UploadDataUseCase
  let mockParser: MockFileParser
  let mockRepository: MockDataRepository

  beforeEach(() => {
    mockParser = new MockFileParser()
    mockRepository = new MockDataRepository()
    useCase = new UploadDataUseCase(mockParser, mockRepository)
  })

  it('应该成功上传有效的文件', async () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    const result = await useCase.execute(file)

    expect(result.success).toBe(true)
    expect(result.totalRecords).toBe(1)
    expect(result.validRecords).toBe(1)
    expect(result.invalidRecords).toBe(0)
  })

  it('当文件验证失败时应该抛出错误', async () => {
    // 修改 mock 使验证失败
    mockParser.validate = vi.fn().mockResolvedValue({
      isValid: false,
      errors: [
        {
          type: 'INVALID_FILE_FORMAT',
          message: '文件格式错误',
        },
      ],
      warnings: [],
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    await expect(useCase.execute(file)).rejects.toThrow(UploadError)
    await expect(useCase.execute(file)).rejects.toThrow('文件验证失败')
  })

  it('当文件为空时应该抛出错误', async () => {
    // 修改 mock 使解析返回空数组
    mockParser.parse = vi.fn().mockResolvedValue([])

    const file = new File([''], 'empty.csv', { type: 'text/csv' })

    await expect(useCase.execute(file)).rejects.toThrow(UploadError)
    await expect(useCase.execute(file)).rejects.toThrow('文件中没有有效数据')
  })

  it('当文件类型不支持时应该抛出错误', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    await expect(useCase.execute(file)).rejects.toThrow(UploadError)
  })

  it('应该调用仓储保存数据', async () => {
    const saveSpy = vi.spyOn(mockRepository, 'save')
    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    await useCase.execute(file)

    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Object)])
    )
  })
})
