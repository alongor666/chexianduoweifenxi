/**
 * 领域 Stores 统一导出
 * 提供所有领域 Store 的集中访问入口
 */

import { useDataStore as _useDataStore } from "./dataStore";
import { useFilterStore as _useFilterStore } from "./filterStore";
import { useCacheStore as _useCacheStore } from "./cacheStore";
import { useUIStore as _useUIStore } from "./uiStore";
import { useTargetStore as _useTargetStore } from "./targetStore";

export { _useDataStore as useDataStore };
export { _useFilterStore as useFilterStore };
export { _useCacheStore as useCacheStore };
export { _useUIStore as useUIStore };
export { _useTargetStore as useTargetStore };

/**
 * 组合 Hook：同时使用多个 Store
 * 适用于需要访问多个 Store 的复杂组件
 */
export const useStores = () => {
  return {
    data: _useDataStore(),
    filter: _useFilterStore(),
    cache: _useCacheStore(),
    ui: _useUIStore(),
    target: _useTargetStore(),
  };
};
