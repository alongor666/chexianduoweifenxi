/**
 * IndexedDB 存储封装
 * 用于持久化大体量原始数据，避免每次刷新都需重新上传
 */

import type { InsuranceRecord } from '@/types/insurance'

const DB_NAME = 'insurance_analytics_db'
const DB_VERSION = 1
const RAW_STORE = 'raw_data_store'
const RAW_KEY = 'raw_data'

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(RAW_STORE)) {
          db.createObjectStore(RAW_STORE)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export async function saveRawData(
  data: InsuranceRecord[]
): Promise<{ success: boolean; error?: string }> {
  if (!isIndexedDBAvailable())
    return { success: false, error: 'IndexedDB 不可用' }

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(RAW_STORE, 'readwrite')
      const store = tx.objectStore(RAW_STORE)
      const req = store.put(data, RAW_KEY)

      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    console.warn('[IndexedDB] 保存原始数据失败:', msg)
    return { success: false, error: msg }
  }
}

export async function loadRawData(): Promise<InsuranceRecord[] | null> {
  if (!isIndexedDBAvailable()) return null

  try {
    const db = await openDB()
    const result = await new Promise<InsuranceRecord[] | null>(
      (resolve, reject) => {
        const tx = db.transaction(RAW_STORE, 'readonly')
        const store = tx.objectStore(RAW_STORE)
        const req = store.get(RAW_KEY)

        req.onsuccess = () => resolve((req.result as InsuranceRecord[]) || null)
        req.onerror = () => reject(req.error)
      }
    )
    db.close()
    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    console.warn('[IndexedDB] 读取原始数据失败:', msg)
    return null
  }
}

export async function clearRawData(): Promise<void> {
  if (!isIndexedDBAvailable()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(RAW_STORE, 'readwrite')
      const store = tx.objectStore(RAW_STORE)
      const req = store.delete(RAW_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    db.close()
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    console.warn('[IndexedDB] 清除原始数据失败:', msg)
  }
}
