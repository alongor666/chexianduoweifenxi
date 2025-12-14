/**
 * Logger 使用示例
 *
 * 这个文件展示了如何在项目中使用统一的日志工具
 */

import { logger } from '@/lib/logger'

// ============================================
// 1. 基本使用：替换 console 调用
// ============================================

// ❌ 旧代码
// console.log('[DataService] 开始加载数据...')
// console.warn('[DataService] 数据不完整')
// console.error('[DataService] 加载失败:', error)

// ✅ 新代码
const log = logger.create('DataService')
log.info('开始加载数据...')
log.warn('数据不完整')
log.error('加载失败', error)

// ============================================
// 2. 结构化日志：传递额外数据
// ============================================

// ❌ 旧代码
// console.log(`上传成功，文件名: ${file.name}, 大小: ${file.size}`)

// ✅ 新代码
log.info('上传成功', {
  fileName: file.name,
  fileSize: file.size,
})

// ============================================
// 3. 开发环境调试日志
// ============================================

// ❌ 旧代码
// if (process.env.NODE_ENV === 'development') {
//   console.log('Debug info:', data)
// }

// ✅ 新代码
log.debug('Debug info', { data }) // 生产环境自动过滤

// ============================================
// 4. 性能测量
// ============================================

// ❌ 旧代码
// console.time('处理数据')
// // ... 处理逻辑
// console.timeEnd('处理数据')

// ✅ 新代码
log.time('处理数据')
// ... 处理逻辑
log.timeEnd('处理数据')

// ============================================
// 5. 分组日志
// ============================================

// ❌ 旧代码
// console.group('上传详情')
// console.log('文件1:', file1)
// console.log('文件2:', file2)
// console.groupEnd()

// ✅ 新代码
log.group('上传详情')
log.info('文件1', { file: file1 })
log.info('文件2', { file: file2 })
log.groupEnd()

// ============================================
// 6. 表格输出
// ============================================

// ❌ 旧代码
// console.table(records)

// ✅ 新代码
log.table(records)

// ============================================
// 完整示例：数据服务
// ============================================

export class ExampleDataService {
  private log = logger.create('ExampleDataService')

  async loadData(_filters: unknown): Promise<unknown[]> {
    this.log.time('loadData')
    this.log.info('开始加载数据', { filters: _filters })

    try {
      // 模拟数据加载
      const data = await this.fetchFromAPI(_filters)

      this.log.debug('原始数据', { count: data.length })

      // 数据处理
      const processed = this.processData(data)

      this.log.info('数据加载成功', {
        originalCount: data.length,
        processedCount: processed.length,
      })

      this.log.timeEnd('loadData')
      return processed
    } catch (error) {
      this.log.error('数据加载失败', error)
      this.log.timeEnd('loadData')
      throw error
    }
  }

  private async fetchFromAPI(_filters: unknown): Promise<unknown[]> {
    // 实现细节...
    return []
  }

  private processData(data: unknown[]): unknown[] {
    this.log.debug('开始处理数据', { count: data.length })

    // 数据处理逻辑...
    if (data.length === 0) {
      this.log.warn('数据为空，跳过处理')
      return []
    }

    return data
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public filterLogs(_filters: Record<string, unknown>): void {
    // 过滤逻辑实现
    console.log('Filtering logs...')
  }
}

// ============================================
// 迁移指南：console.* -> logger.*
// ============================================

/**
 * 快速替换映射：
 *
 * console.log(...)     -> log.info(...)     或 log.debug(...)
 * console.info(...)    -> log.info(...)
 * console.warn(...)    -> log.warn(...)
 * console.error(...)   -> log.error(...)
 * console.debug(...)   -> log.debug(...)
 * console.time(...)    -> log.time(...)
 * console.timeEnd(...) -> log.timeEnd(...)
 * console.group(...)   -> log.group(...)
 * console.groupEnd()   -> log.groupEnd()
 * console.table(...)   -> log.table(...)
 *
 * 选择 info 还是 debug？
 * - info：重要的业务事件（加载成功、操作完成、状态变化）
 * - debug：开发调试信息（中间变量、详细流程、性能测试）
 */
