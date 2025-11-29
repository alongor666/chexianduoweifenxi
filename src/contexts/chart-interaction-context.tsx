/**
 * 图表交互上下文
 * 提供全局的图表交互状态管理
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { chartInteractionManager, FilterConfig, ChartInteractionEvent } from '@/lib/managers/chart-interaction-manager';

interface ChartInteractionContextType {
  /**
   * 全局激活的过滤器
   */
  globalFilters: FilterConfig[];

  /**
   * 激活的源图表ID
   */
  activeSource: string | null;

  /**
   * 应用全局过滤器
   */
  applyGlobalFilters: (source: string, filters: FilterConfig[]) => void;

  /**
   * 清除全局过滤器
   */
  clearGlobalFilters: (source?: string) => void;

  /**
   * 添加过滤器
   */
  addFilter: (filter: FilterConfig) => void;

  /**
   * 移除过滤器
   */
  removeFilter: (index: number) => void;

  /**
   * 更新过滤器
   */
  updateFilter: (index: number, filter: FilterConfig) => void;

  /**
   * 交互历史
   */
  interactionHistory: ChartInteractionEvent[];

  /**
   * 清除历史
   */
  clearHistory: () => void;
}

const ChartInteractionContext = createContext<ChartInteractionContextType | undefined>(undefined);

export function ChartInteractionProvider({ children }: { children: React.ReactNode }) {
  const [globalFilters, setGlobalFilters] = useState<FilterConfig[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<ChartInteractionEvent[]>([]);

  // 监听交互管理器的事件
  useEffect(() => {
    const handleInteraction = (event: ChartInteractionEvent) => {
      setInteractionHistory(prev => [...prev.slice(-49), event]);

      // 更新全局过滤器（如果是filter动作）
      if (event.action === 'filter') {
        setGlobalFilters(event.filters);
        setActiveSource(event.source === 'global' ? null : event.source);
      }
    };

    chartInteractionManager.addListener(handleInteraction);

    return () => {
      chartInteractionManager.removeListener(handleInteraction);
    };
  }, []);

  const applyGlobalFilters = useCallback((source: string, filters: FilterConfig[]) => {
    setGlobalFilters(filters);
    setActiveSource(source === 'global' ? null : source);
    chartInteractionManager.applyFilters(source, filters);
  }, []);

  const clearGlobalFilters = useCallback((source?: string) => {
    setGlobalFilters([]);
    setActiveSource(null);
    chartInteractionManager.clearFilters(source || 'global');
  }, []);

  const addFilter = useCallback((filter: FilterConfig) => {
    const newFilters = [...globalFilters, filter];
    applyGlobalFilters('context', newFilters);
  }, [globalFilters, applyGlobalFilters]);

  const removeFilter = useCallback((index: number) => {
    const newFilters = globalFilters.filter((_, i) => i !== index);
    applyGlobalFilters('context', newFilters);
  }, [globalFilters, applyGlobalFilters]);

  const updateFilter = useCallback((index: number, filter: FilterConfig) => {
    const newFilters = [...globalFilters];
    newFilters[index] = filter;
    applyGlobalFilters('context', newFilters);
  }, [globalFilters, applyGlobalFilters]);

  const clearHistory = useCallback(() => {
    setInteractionHistory([]);
  }, []);

  const value: ChartInteractionContextType = {
    globalFilters,
    activeSource,
    applyGlobalFilters,
    clearGlobalFilters,
    addFilter,
    removeFilter,
    updateFilter,
    interactionHistory,
    clearHistory,
  };

  return (
    <ChartInteractionContext.Provider value={value}>
      {children}
    </ChartInteractionContext.Provider>
  );
}

export function useChartInteractionContext() {
  const context = useContext(ChartInteractionContext);
  if (!context) {
    throw new Error('useChartInteractionContext must be used within ChartInteractionProvider');
  }
  return context;
}

/**
 * Hook for filtering data based on global filters
 */
export function useGlobalFilteredData(data: any[]) {
  const { globalFilters } = useChartInteractionContext();

  return React.useMemo(() => {
    if (!globalFilters || globalFilters.length === 0) return data;

    return data.filter(item => {
      return globalFilters.every(filter => {
        const value = getNestedValue(item, filter.type);
        const filterValue = filter.value;

        switch (filter.operator || 'eq') {
          case 'eq':
            return value === filterValue;
          case 'ne':
            return value !== filterValue;
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'gte':
            return Number(value) >= Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          case 'lte':
            return Number(value) <= Number(filterValue);
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(value);
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          default:
            return value === filterValue;
        }
      });
    });
  }, [data, globalFilters]);
}

/**
 * Helper function to get nested value
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}