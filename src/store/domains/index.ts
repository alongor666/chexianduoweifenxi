/**
 * 领域 Stores 统一导出
 * 提供所有领域 Store 的集中访问入口
 */

export { useDataStore } from './dataStore'
export { useFilterStore } from './filterStore'
export { useCacheStore } from './cacheStore'
export { useUIStore } from './uiStore'
export { useTargetStore } from './targetStore'

/**
 * 组合 Hook：同时使用多个 Store
 * 适用于需要访问多个 Store 的复杂组件
 */
export const useStores = () => {
  return {
    data: useDataStore(),
    filter: useFilterStore(),
    cache: useCacheStore(),
    ui: useUIStore(),
    target: useTargetStore(),
  }
}
