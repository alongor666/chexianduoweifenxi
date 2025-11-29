/**
 * 图表交互管理器
 * 处理图表间的联动和交互逻辑
 */

import React from 'react';

export type FilterType = 'businessType' | 'vehicleEnergy' | 'organization' | 'weekNumber' | 'riskType' | 'custom';

export interface FilterConfig {
  type: FilterType;
  value: any;
  label?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
}

export interface ChartInteractionEvent {
  source: string; // 触发交互的图表ID
  action: 'click' | 'hover' | 'select' | 'filter';
  filters: FilterConfig[];
  data?: any; // 相关数据
}

export interface ChartInteractionHandler {
  id: string;
  name: string;
  handleInteraction: (event: ChartInteractionEvent) => void;
  canHandle?: (event: ChartInteractionEvent) => boolean; // 可选的过滤函数
}

class ChartInteractionManager {
  private handlers: Map<string, ChartInteractionHandler> = new Map();
  private listeners: ((event: ChartInteractionEvent) => void)[] = [];
  private history: ChartInteractionEvent[] = [];
  private maxHistorySize = 50;

  /**
   * 注册图表交互处理器
   */
  register(handler: ChartInteractionHandler) {
    this.handlers.set(handler.id, handler);
    console.log(`[InteractionManager] 注册处理器: ${handler.name} (${handler.id})`);
  }

  /**
   * 取消注册图表交互处理器
   */
  unregister(id: string) {
    const handler = this.handlers.get(id);
    if (handler) {
      this.handlers.delete(id);
      console.log(`[InteractionManager] 取消注册处理器: ${handler.name} (${id})`);
    }
  }

  /**
   * 触发交互事件
   */
  trigger(event: ChartInteractionEvent) {
    // 记录历史
    this.history.push({ ...event, source: event.source });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    console.log(`[InteractionManager] 触发交互:`, {
      source: event.source,
      action: event.action,
      filters: event.filters,
    });

    // 通知所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[InteractionManager] 监听器错误:', error);
      }
    });

    // 通知相关处理器
    this.handlers.forEach(handler => {
      // 跳过触发源自身
      if (handler.id === event.source) return;

      // 检查是否可以处理该事件
      if (handler.canHandle && !handler.canHandle(event)) return;

      try {
        handler.handleInteraction(event);
      } catch (error) {
        console.error(`[InteractionManager] 处理器 ${handler.name} 错误:`, error);
      }
    });
  }

  /**
   * 添加全局事件监听器
   */
  addListener(listener: (event: ChartInteractionEvent) => void) {
    this.listeners.push(listener);
  }

  /**
   * 移除全局事件监听器
   */
  removeListener(listener: (event: ChartInteractionEvent) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 清除所有过滤器
   */
  clearFilters(source: string = 'global') {
    this.trigger({
      source,
      action: 'filter',
      filters: [],
    });
  }

  /**
   * 应用过滤器
   */
  applyFilters(source: string, filters: FilterConfig[]) {
    this.trigger({
      source,
      action: 'filter',
      filters,
    });
  }

  /**
   * 获取交互历史
   */
  getHistory(): ChartInteractionEvent[] {
    return [...this.history];
  }

  /**
   * 根据过滤器生成数据过滤函数
   */
  createFilterFunction(filters: FilterConfig[]) {
    return (data: any) => {
      if (!filters || filters.length === 0) return true;

      return filters.every(filter => {
        const value = this.getNestedValue(data, filter.type);
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
    };
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.handlers.clear();
    this.listeners.length = 0;
    this.history.length = 0;
  }
}

// 全局实例
export const chartInteractionManager = new ChartInteractionManager();

/**
 * React Hook for chart interactions
 */
export function useChartInteraction(
  chartId: string,
  chartName: string,
  onInteraction?: (event: ChartInteractionEvent) => void,
  canHandle?: (event: ChartInteractionEvent) => boolean
) {
  const trigger = (action: ChartInteractionEvent['action'], filters: FilterConfig[], data?: any) => {
    chartInteractionManager.trigger({
      source: chartId,
      action,
      filters,
      data,
    });
  };

  const applyFilter = (type: FilterType, value: any, operator?: FilterConfig['operator'], label?: string) => {
    trigger('filter', [{ type, value, operator, label }]);
  };

  const clearFilters = () => {
    trigger('filter', []);
  };

  const handleClick = (filters: FilterConfig[], data?: any) => {
    trigger('click', filters, data);
  };

  // 自动注册和清理
  React.useEffect(() => {
    if (onInteraction) {
      chartInteractionManager.register({
        id: chartId,
        name: chartName,
        handleInteraction: onInteraction,
        canHandle,
      });

      return () => {
        chartInteractionManager.unregister(chartId);
      };
    }
  }, [chartId, chartName, onInteraction, canHandle]);

  return {
    trigger,
    applyFilter,
    clearFilters,
    handleClick,
    manager: chartInteractionManager,
  };
}