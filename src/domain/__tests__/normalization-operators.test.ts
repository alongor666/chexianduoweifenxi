/**
 * Domain 层测试 - 数据规范化算子
 *
 * 测试各种数据类型的规范化场景
 */

import { describe, it, expect } from 'vitest'
import {
  normalize,
  normalizeText,
  normalizeNumber,
  normalizeBoolean,
  normalizeDate,
  normalizeBatch,
  normalizeObject,
  type _NormalizationResult,
} from '../shared/normalization-operators'

describe('数据规范化算子', () => {
  describe('normalize', () => {
    it('应该规范化字符串', () => {
      const config = {
        defaultValue: 'default',
        transformer: (value: unknown) => String(value).toUpperCase(),
      }

      const result = normalize('hello', config)

      expect(result.success).toBe(true)
      expect(result.value).toBe('HELLO')
      expect(result.originalValue).toBe('hello')
    })

    it('应该处理null值', () => {
      const config = {
        defaultValue: 'default',
        allowNull: false,
      }

      const result = normalize(null, config)

      expect(result.success).toBe(true)
      expect(result.value).toBe('default')
    })

    it('应该允许null值（当配置允许时）', () => {
      const config = {
        defaultValue: 'default',
        allowNull: true,
      }

      const result = normalize(null, config)

      expect(result.success).toBe(true)
      expect(result.value).toBe(null)
    })

    it('应该处理验证失败', () => {
      const config = {
        defaultValue: 0,
        validationRules: [
          {
            validate: (value: number) => value > 0,
            message: '值必须大于0',
          },
        ],
      }

      const result = normalize(-1, config)

      expect(result.success).toBe(false)
      expect(result.value).toBe(0)
      expect(result.error).toBe('值必须大于0')
    })
  })

  describe('normalizeText', () => {
    it('应该规范化中文文本', () => {
      const result = normalizeText('  成都 \u200B\u3000测试  ', {
        removeZeroWidth: true,
        normalizeSpaces: true,
        trim: true,
        collapseSpaces: true,
      })

      expect(result.success).toBe(true)
      expect(result.value).toBe('成都 测试')
    })

    it('应该处理空字符串', () => {
      const result = normalizeText('', { defaultValue: '默认值' })

      expect(result.success).toBe(true)
      expect(result.value).toBe('') // 空字符串经过规范化后仍然是空字符串
    })

    it('应该转换大小写', () => {
      const upperResult = normalizeText('hello', { toUpperCase: true })
      expect(upperResult.value).toBe('HELLO')

      const lowerResult = normalizeText('WORLD', { toLowerCase: true })
      expect(lowerResult.value).toBe('world')
    })
  })

  describe('normalizeNumber', () => {
    it('应该规范化数字字符串', () => {
      const result = normalizeNumber('123.45', { defaultValue: 0 })

      expect(result.success).toBe(true)
      expect(result.value).toBe(123.45)
    })

    it('应该处理无效数字', () => {
      const result = normalizeNumber('abc', { defaultValue: 0 })

      expect(result.success).toBe(true)
      expect(result.value).toBe(0)
    })

    it('应该验证范围', () => {
      const result = normalizeNumber(150, {
        defaultValue: 0,
        min: 0,
        max: 100,
      })

      expect(result.success).toBe(false)
      expect(result.value).toBe(0)
      expect(result.error).toContain('必须在0到100之间')
    })

    it('应该处理负数限制', () => {
      const result = normalizeNumber(-10, {
        defaultValue: 0,
        allowNegative: false,
        min: 0,
        max: 100,
      })

      expect(result.success).toBe(false)
      expect(result.value).toBe(0)
      expect(result.error).toContain('必须在0到100之间')
    })

    it('应该处理小数位数', () => {
      const result = normalizeNumber(123.456789, {
        defaultValue: 0,
        decimals: 2,
      })

      expect(result.success).toBe(true)
      expect(result.value).toBe(123.46)
    })
  })

  describe('normalizeBoolean', () => {
    it('应该规范化布尔字符串', () => {
      const trueResult = normalizeBoolean('true')
      expect(trueResult.success).toBe(true)
      expect(trueResult.value).toBe(true)

      const falseResult = normalizeBoolean('false')
      expect(falseResult.success).toBe(true)
      expect(falseResult.value).toBe(false)
    })

    it('应该规范化中文布尔值', () => {
      const yesResult = normalizeBoolean('是')
      expect(yesResult.success).toBe(true)
      expect(yesResult.value).toBe(true)

      const noResult = normalizeBoolean('否')
      expect(noResult.success).toBe(true)
      expect(noResult.value).toBe(false)
    })

    it('应该规范化数字布尔值', () => {
      const trueResult = normalizeBoolean(1)
      expect(trueResult.success).toBe(true)
      expect(trueResult.value).toBe(true)

      const falseResult = normalizeBoolean(0)
      expect(falseResult.success).toBe(true)
      expect(falseResult.value).toBe(false)
    })

    it('应该处理无效布尔值', () => {
      const result = normalizeBoolean('maybe', { defaultValue: false })

      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })
  })

  describe('normalizeDate', () => {
    it('应该规范化标准日期格式', () => {
      const result = normalizeDate('2025-01-14', {
        format: 'YYYY-MM-DD',
      })

      expect(result.success).toBe(true)
      expect(result.value).toBe('2025-01-14')
    })

    it('应该转换分隔符格式', () => {
      const result = normalizeDate('2025/01/14', {
        format: 'YYYY-MM-DD',
        autoFix: true,
      })

      expect(result.success).toBe(true)
      expect(result.value).toBe('2025-01-14')
    })

    it('应该处理无效日期', () => {
      const result = normalizeDate('invalid-date', { defaultValue: '' })

      expect(result.success).toBe(true)
      expect(result.value).toBe('')
    })
  })

  describe('normalizeBatch', () => {
    it('应该批量规范化', () => {
      const config = {
        defaultValue: 0,
        transformer: (value: unknown) => Number(value) || 0,
      }

      const results = normalizeBatch(['1', '2', 'invalid', '4'], config)

      expect(results).toHaveLength(4)
      expect(results[0].value).toBe(1)
      expect(results[1].value).toBe(2)
      expect(results[2].value).toBe(0)
      expect(results[3].value).toBe(4)
    })
  })

  describe('normalizeObject', () => {
    it('应该规范化对象属性', () => {
      const obj = {
        name: '  test  ',
        age: '25',
        active: 'true',
        score: 85.5,
      }

      const fieldConfigs = {
        name: {
          defaultValue: '',
          transformer: (value: unknown) => normalizeText(value).value,
        },
        age: {
          defaultValue: 0,
          transformer: (value: unknown) => normalizeNumber(value).value,
        },
        active: {
          defaultValue: false,
          transformer: (value: unknown) => normalizeBoolean(value).value,
        },
        score: {
          defaultValue: 0,
          transformer: (value: unknown) => normalizeNumber(value).value,
        },
      }

      const result = normalizeObject(obj, fieldConfigs)

      expect(result.name).toBe('test')
      expect(result.age).toBe(25)
      expect(result.active).toBe(true)
      expect(result.score).toBe(85.5)
    })
  })
})
