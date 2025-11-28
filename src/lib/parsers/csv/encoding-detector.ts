/**
 * CSV 文件编码检测器
 * 自动检测并转换非 UTF-8 编码的文件
 */

import { logger } from '@/lib/logger'

const log = logger.create('EncodingDetector')

export type SupportedEncoding = 'utf-8' | 'gb18030' | 'gbk' | 'gb2312'
const FALLBACK_ENCODINGS: SupportedEncoding[] = ['gb18030', 'gbk', 'gb2312']

/**
 * 使用指定编码解码缓冲区
 */
function decodeBufferWithEncoding(
  buffer: ArrayBuffer,
  encoding: SupportedEncoding
): string | null {
  try {
    const decoder = new TextDecoder(encoding, { fatal: false })
    return decoder.decode(buffer)
  } catch (error) {
    log.warn('当前环境不支持编码', { encoding, error })
    return null
  }
}

/**
 * 评估解码文本的质量分数
 * @returns 分数越高表示质量越好
 */
function evaluateDecodedTextQuality(text: string): number {
  const sample = text.slice(0, 20000)
  let cjkCount = 0
  let replacementCount = 0
  let latinExtendedCount = 0

  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i)
    if (code === 0xfffd) {
      replacementCount++
      continue
    }
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // 基本中日韩统一表意文字
      (code >= 0x3400 && code <= 0x4dbf) // 扩展A
    ) {
      cjkCount++
      continue
    }
    if (code >= 0x00c0 && code <= 0x024f) {
      latinExtendedCount++
    }
  }

  return cjkCount * 5 - replacementCount * 20 - latinExtendedCount
}

/**
 * 规范化文件编码为 UTF-8
 * 自动检测原始编码并转换
 */
export async function normalizeFileEncoding(file: File): Promise<{
  file: File
  encoding: SupportedEncoding
}> {
  // 先采样前 256KB 数据用于编码判断，避免一次性读取超大文件
  const sampleSize = Math.min(file.size, 256 * 1024)
  const sampleBuffer = await file.slice(0, sampleSize).arrayBuffer()

  const candidateEncodings: SupportedEncoding[] = [
    'utf-8',
    ...FALLBACK_ENCODINGS,
  ]

  const candidates = candidateEncodings
    .map(encoding => {
      const sampleText = decodeBufferWithEncoding(sampleBuffer, encoding)
      if (sampleText === null) {
        return null
      }

      const score = evaluateDecodedTextQuality(sampleText)
      return { encoding, score }
    })
    .filter(
      (item): item is { encoding: SupportedEncoding; score: number } =>
        item !== null
    )

  if (candidates.length === 0) {
    return { file, encoding: 'utf-8' }
  }

  const bestCandidate = candidates.reduce((best, current) =>
    current.score > best.score ? current : best
  )

  if (bestCandidate.encoding === 'utf-8') {
    return { file, encoding: 'utf-8' }
  }

  log.info('检测到可能的非 UTF-8 编码，开始转换', {
    encoding: bestCandidate.encoding,
  })

  const fullBuffer = await file.arrayBuffer()
  const decodedText =
    decodeBufferWithEncoding(fullBuffer, bestCandidate.encoding) ??
    decodeBufferWithEncoding(fullBuffer, 'utf-8') ??
    ''

  const normalizedFile = new File([decodedText], file.name, {
    type: 'text/csv;charset=utf-8',
  })

  return {
    file: normalizedFile,
    encoding: bestCandidate.encoding,
  }
}
