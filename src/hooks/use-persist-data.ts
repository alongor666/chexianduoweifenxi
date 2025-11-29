import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  StorageKeys,
} from "@/lib/storage/local-storage";
import {
  loadRawData,
  saveRawData,
  clearRawData,
  isIndexedDBAvailable,
} from "@/lib/storage/indexed-db";
import type { InsuranceRecord, FilterState } from "@/types/insurance";

/**
 * 数据持久化 Hook
 * 自动保存和恢复数据到 localStorage / IndexedDB
 */
export function usePersistData(initialData: InsuranceRecord[] = []) {
  const rawData = useAppStore((state) => state.rawData);
  const filters = useAppStore((state) => state.filters);
  const setRawData = useAppStore((state) => state.setRawData);
  const updateFilters = useAppStore((state) => state.updateFilters);

  // 从 localStorage / IndexedDB 恢复数据 (仅在组件挂载时执行一次)
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      // 如果 store 中已有数据，则不执行任何操作
      if (useAppStore.getState().rawData.length > 0) {
        console.log("[Persist] Store 已有数据，跳过恢复操作。");
        return;
      }

      const savedData = getStorageItem<InsuranceRecord[]>(StorageKeys.RAW_DATA);
      const savedFilters = getStorageItem<FilterState>(StorageKeys.FILTERS);

      if (savedData && savedData.length > 0) {
        console.log(
          `[Persist] 恢复了 ${savedData.length} 条数据 (localStorage)`,
        );
        setRawData(savedData);
      } else if (isIndexedDBAvailable()) {
        const idbData = await loadRawData();
        if (!cancelled && idbData && idbData.length > 0) {
          console.log(`[Persist] 从 IndexedDB 恢复了 ${idbData.length} 条数据`);
          setRawData(idbData);
        }
      } else if (initialData && initialData.length > 0) {
        // 如果本地没有数据，则使用从服务器获取的初始数据
        console.log(`[Persist] 从服务器初始了 ${initialData.length} 条数据`);
        setRawData(initialData);
      }

      if (savedFilters) {
        console.log(`[Persist] 恢复筛选条件`);
        updateFilters(savedFilters);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [initialData, setRawData, updateFilters]);

  // 保存数据到 IndexedDB / localStorage (当数据变化时)
  useEffect(() => {
    if (rawData.length > 0) {
      // 优先保存到 IndexedDB（支持大数据）
      if (isIndexedDBAvailable()) {
        saveRawData(rawData).then((res) => {
          if (res.success) {
            console.log(`[Persist] IndexedDB 已保存 ${rawData.length} 条数据`);
          } else {
            console.warn(`[Persist] IndexedDB 保存失败: ${res.error}`);
          }
        });
      }

      // 只在数据量较小时才尝试保存到 localStorage（避免配额耗尽）
      // 估算：每条记录约 500 字节，1000 条约 500KB，远小于 5MB 限制
      const MAX_RECORDS_FOR_LOCALSTORAGE = 1000;

      if (rawData.length <= MAX_RECORDS_FOR_LOCALSTORAGE) {
        const result = setStorageItem(
          StorageKeys.RAW_DATA,
          rawData,
          7 * 24 * 60 * 60 * 1000, // 7天过期
        );

        if (!result.success) {
          console.warn(`[Persist] localStorage 保存失败: ${result.error}`);
        } else {
          console.log(`[Persist] localStorage 已保存 ${rawData.length} 条数据`);
        }
      } else {
        // 数据量过大，清除 localStorage 中的旧数据，仅依赖 IndexedDB
        removeStorageItem(StorageKeys.RAW_DATA);
        console.log(
          `[Persist] 数据量 (${rawData.length} 条) 超过 localStorage 限制，仅使用 IndexedDB 存储`,
        );
      }
    } else {
      // 如果数据被清空,也清空缓存
      removeStorageItem(StorageKeys.RAW_DATA);
      clearRawData();
      console.log("[Persist] 已清空缓存数据");
    }
  }, [rawData]);

  // 保存筛选条件到 localStorage (当筛选条件变化时)
  // 使用 JSON 序列化进行深度比较，避免对象引用导致无限循环
  const filtersJsonRef = useRef<string>("");

  useEffect(() => {
    if (filters) {
      const filtersJson = JSON.stringify(filters);
      if (filtersJson !== filtersJsonRef.current) {
        filtersJsonRef.current = filtersJson;
        setStorageItem(
          StorageKeys.FILTERS,
          filters,
          7 * 24 * 60 * 60 * 1000, // 7天过期
        );
        console.log("[Persist] 已保存筛选条件");
      }
    }
  }, [filters]);

  // 保存最后上传时间
  const saveUploadTime = () => {
    setStorageItem(StorageKeys.LAST_UPLOAD_TIME, Date.now());
  };

  return {
    saveUploadTime,
    clearPersistedData: () => {
      removeStorageItem(StorageKeys.RAW_DATA);
      removeStorageItem(StorageKeys.FILTERS);
      clearRawData();
      console.log("[Persist] 已清除所有持久化数据");
    },
  };
}
