/**
 * 数据持久化管理模块
 * 负责数据的本地存储、恢复和历史记录管理
 */

import type { InsuranceRecord } from '@/types/insurance'
import type { FileUploadResult, BatchUploadResult } from '@/hooks/use-file-upload'
import { safeMin, safeMax } from '@/lib/utils/array-utils'

/**
 * 周次信息
 */
export interface WeekInfo {
  weekNumber: number              // 周次号
  year: number                    // 年份
  recordCount: number             // 该周记录数
  isConflict: boolean            // 是否与已有数据冲突
  source: 'existing' | 'new'     // 数据来源
}

/**
 * 上传历史记录
 */
export interface UploadHistoryRecord {
  id: string
  timestamp: string
  files: {
    name: string
    size: number
    hash: string
    recordCount: number
    validRecords: number
    invalidRecords: number
    weekRange?: string            // 周次范围，例如 "2025年第11-12周"
    newWeekCount?: number         // 新导入的周次数
    skippedWeekCount?: number     // 跳过的周次数
  }[]
  totalRecords: number
  validRecords: number
  invalidRecords: number
  status: 'success' | 'partial' | 'failed'
  error?: string
  weekInfo?: {                    // 周次统计信息
    totalWeeks: number            // 总周次数
    newWeeks: number[]           // 新导入的周次号列表
    skippedWeeks: number[]       // 跳过的周次号列表
    yearRange: number[]          // 年份范围
  }
}

/**
 * 数据存储信息
 */
export interface DataStorageInfo {
  lastUpdated: string
  totalRecords: number
  dataHash: string
  uploadHistory: UploadHistoryRecord[]
}

const STORAGE_KEYS = {
  DATA: 'insuralytics_data',
  STORAGE_INFO: 'insuralytics_storage_info',
  UPLOAD_HISTORY: 'insuralytics_upload_history',
} as const

/**
 * 计算数据哈希值（简单实现）
 */
function calculateDataHash(data: InsuranceRecord[]): string {
  const content = JSON.stringify(data.map(r => ({
    week: r.week_number,
    year: r.policy_start_year,
    organization: r.third_level_organization,
    premium: r.signed_premium_yuan,
    policy_count: r.policy_count,
  })))
  
  // 简单的哈希算法
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString(36)
}

/**
 * 计算文件哈希值
 */
function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      let hash = 0
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      resolve(Math.abs(hash).toString(36))
    }
    reader.readAsText(file)
  })
}

/**
 * 保存数据到本地存储
 */
export async function saveDataToStorage(data: InsuranceRecord[]): Promise<void> {
  try {
    const dataHash = calculateDataHash(data)
    const storageInfo: DataStorageInfo = {
      lastUpdated: new Date().toISOString(),
      totalRecords: data.length,
      dataHash,
      uploadHistory: getUploadHistory(),
    }

    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data))
    localStorage.setItem(STORAGE_KEYS.STORAGE_INFO, JSON.stringify(storageInfo))
    
    console.log(`[Data Persistence] 数据已保存到本地存储，共 ${data.length} 条记录`)
  } catch (error) {
    console.error('[Data Persistence] 保存数据失败:', error)
    throw new Error('保存数据到本地存储失败')
  }
}

/**
 * 从本地存储加载数据
 */
export function loadDataFromStorage(): InsuranceRecord[] | null {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEYS.DATA)
    if (!dataStr) return null

    const data = JSON.parse(dataStr) as InsuranceRecord[]
    console.log(`[Data Persistence] 从本地存储加载数据，共 ${data.length} 条记录`)
    return data
  } catch (error) {
    console.error('[Data Persistence] 加载数据失败:', error)
    return null
  }
}

/**
 * 获取存储信息
 */
export function getStorageInfo(): DataStorageInfo | null {
  try {
    const infoStr = localStorage.getItem(STORAGE_KEYS.STORAGE_INFO)
    if (!infoStr) return null

    return JSON.parse(infoStr) as DataStorageInfo
  } catch (error) {
    console.error('[Data Persistence] 获取存储信息失败:', error)
    return null
  }
}

/**
 * 清除所有存储的数据
 */
export function clearStoredData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DATA)
    localStorage.removeItem(STORAGE_KEYS.STORAGE_INFO)
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY)
    console.log('[Data Persistence] 已清除所有存储的数据')
  } catch (error) {
    console.error('[Data Persistence] 清除数据失败:', error)
    throw new Error('清除存储数据失败')
  }
}

/**
 * 获取上传历史记录
 */
export function getUploadHistory(): UploadHistoryRecord[] {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY)
    if (!historyStr) return []

    return JSON.parse(historyStr) as UploadHistoryRecord[]
  } catch (error) {
    console.error('[Data Persistence] 获取上传历史失败:', error)
    return []
  }
}

/**
 * 添加上传历史记录
 */
export async function addUploadHistory(
  batchResult: BatchUploadResult,
  files: File[]
): Promise<void> {
  try {
    const history = getUploadHistory()
    
    // 计算文件哈希
    const fileInfos = await Promise.all(
      files.map(async (file, index) => {
        const result = batchResult.results[index]
        const hash = await calculateFileHash(file)
        
        return {
          name: file.name,
          size: file.size,
          hash,
          recordCount: result?.result?.stats.totalRows || 0,
          validRecords: result?.result?.stats.validRows || 0,
          invalidRecords: result?.result?.stats.invalidRows || 0,
        }
      })
    )

    const record: UploadHistoryRecord = {
      id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      files: fileInfos,
      totalRecords: batchResult.totalRecords,
      validRecords: batchResult.validRecords,
      invalidRecords: batchResult.invalidRecords,
      status: batchResult.failureCount === 0 ? 'success' : 
              batchResult.successCount > 0 ? 'partial' : 'failed',
    }

    history.unshift(record) // 最新的记录在前面
    
    // 只保留最近50条记录
    if (history.length > 50) {
      history.splice(50)
    }

    localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(history))
    console.log(`[Data Persistence] 已添加上传历史记录: ${record.id}`)
  } catch (error) {
    console.error('[Data Persistence] 添加上传历史失败:', error)
  }
}

/**
 * 检查文件是否已经上传过（基于哈希值）
 */
export async function checkFileExists(file: File): Promise<{
  exists: boolean
  uploadRecord?: UploadHistoryRecord
  fileInfo?: UploadHistoryRecord['files'][0]
}> {
  try {
    const fileHash = await calculateFileHash(file)
    const history = getUploadHistory()

    for (const record of history) {
      const fileInfo = record.files.find(f => f.hash === fileHash && f.name === file.name)
      if (fileInfo) {
        return {
          exists: true,
          uploadRecord: record,
          fileInfo,
        }
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('[Data Persistence] 检查文件是否存在失败:', error)
    return { exists: false }
  }
}

/**
 * 获取数据统计信息
 */
export function getDataStats(): {
  hasData: boolean
  totalRecords: number
  lastUpdated: string | null
  uploadCount: number
} {
  const storageInfo = getStorageInfo()
  const history = getUploadHistory()

  return {
    hasData: storageInfo !== null && storageInfo.totalRecords > 0,
    totalRecords: storageInfo?.totalRecords || 0,
    lastUpdated: storageInfo?.lastUpdated || null,
    uploadCount: history.length,
  }
}

/**
 * 从记录中提取周次信息
 */
export function extractWeeksFromRecords(records: InsuranceRecord[]): WeekInfo[] {
  const weekMap = new Map<string, WeekInfo>()

  records.forEach(record => {
    const key = `${record.policy_start_year}-${record.week_number}`

    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekNumber: record.week_number,
        year: record.policy_start_year,
        recordCount: 0,
        isConflict: false,
        source: 'new'
      })
    }

    const weekInfo = weekMap.get(key)!
    weekInfo.recordCount++
  })

  return Array.from(weekMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.weekNumber - b.weekNumber
  })
}

/**
 * 获取已存在的周次集合
 */
export function getExistingWeeks(existingData: InsuranceRecord[]): Set<string> {
  const weeks = new Set<string>()

  existingData.forEach(record => {
    const key = `${record.policy_start_year}-${record.week_number}`
    weeks.add(key)
  })

  return weeks
}

/**
 * 分析周次冲突
 * @param detectedWeeks 待导入的周次
 * @param existingData 已有数据
 * @returns 新周次和冲突周次
 */
export function analyzeWeekConflicts(
  detectedWeeks: WeekInfo[],
  existingData: InsuranceRecord[]
): { newWeeks: WeekInfo[], conflictWeeks: WeekInfo[] } {
  const existingWeeks = getExistingWeeks(existingData)

  const newWeeks: WeekInfo[] = []
  const conflictWeeks: WeekInfo[] = []

  detectedWeeks.forEach(week => {
    const key = `${week.year}-${week.weekNumber}`

    if (existingWeeks.has(key)) {
      conflictWeeks.push({ ...week, isConflict: true, source: 'existing' })
    } else {
      newWeeks.push({ ...week, isConflict: false, source: 'new' })
    }
  })

  return { newWeeks, conflictWeeks }
}

/**
 * 按周次过滤记录（只保留新周次的数据）
 * @param records 所有记录
 * @param newWeeks 允许导入的新周次列表
 * @returns 过滤后的记录
 */
export function filterRecordsByNewWeeks(
  records: InsuranceRecord[],
  newWeeks: WeekInfo[]
): InsuranceRecord[] {
  const allowedWeeks = new Set<string>()
  newWeeks.forEach(week => {
    const key = `${week.year}-${week.weekNumber}`
    allowedWeeks.add(key)
  })

  return records.filter(record => {
    const key = `${record.policy_start_year}-${record.week_number}`
    return allowedWeeks.has(key)
  })
}

/**
 * 格式化周次范围为字符串
 * @param weeks 周次列表
 * @returns 格式化的字符串，例如 "2025年第11-12周"
 */
export function formatWeekRange(weeks: WeekInfo[]): string {
  if (weeks.length === 0) return ''

  const sortedWeeks = [...weeks].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.weekNumber - b.weekNumber
  })

  const years = Array.from(new Set(sortedWeeks.map(w => w.year)))

  if (years.length === 1) {
    const weekNumbers = sortedWeeks.map(w => w.weekNumber)
    const minWeek = safeMin(weekNumbers)
    const maxWeek = safeMax(weekNumbers)

    if (minWeek === maxWeek) {
      return `${years[0]}年第${minWeek}周`
    } else {
      return `${years[0]}年第${minWeek}-${maxWeek}周`
    }
  } else {
    // 多年份的情况
    return years.map(year => {
      const yearWeeks = sortedWeeks.filter(w => w.year === year)
      const weekNumbers = yearWeeks.map(w => w.weekNumber)
      const minWeek = safeMin(weekNumbers)
      const maxWeek = safeMax(weekNumbers)

      if (minWeek === maxWeek) {
        return `${year}年第${minWeek}周`
      } else {
        return `${year}年第${minWeek}-${maxWeek}周`
      }
    }).join(', ')
  }
}