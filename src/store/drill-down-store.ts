/**
 * KPI下钻状态管理
 * 使用 Zustand 管理每个KPI的下钻路径
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type {
  DrillDownState,
  KPIDrillDownPath,
  DrillDownStep,
  DrillDownDimensionKey,
  DrillDownDimension,
} from '@/types/drill-down'
import { DRILL_DOWN_DIMENSIONS } from '@/types/drill-down'

interface DrillDownStoreState extends DrillDownState {
  /**
   * 重置所有下钻状态
   */
  resetAll: () => void
}

/**
 * 下钻状态管理 Store
 */
export const useDrillDownStore = create<DrillDownStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        paths: {},

        // 添加下钻步骤
        addDrillDownStep: (kpiKey: string, step: DrillDownStep) => {
          set((state) => {
            const existingPath = state.paths[kpiKey]
            const newPath: KPIDrillDownPath = {
              kpiKey,
              steps: existingPath
                ? [...existingPath.steps, step]
                : [step],
            }

            return {
              paths: {
                ...state.paths,
                [kpiKey]: newPath,
              },
            }
          })
        },

        // 移除指定步骤及之后的所有步骤
        removeDrillDownStepsFrom: (kpiKey: string, stepIndex: number) => {
          set((state) => {
            const existingPath = state.paths[kpiKey]
            if (!existingPath) return state

            // 如果索引为0，表示清空整个路径
            if (stepIndex === 0) {
              const { [kpiKey]: _, ...remainingPaths } = state.paths
              return {
                paths: remainingPaths,
              }
            }

            // 否则，保留前面的步骤
            const newSteps = existingPath.steps.slice(0, stepIndex)
            return {
              paths: {
                ...state.paths,
                [kpiKey]: {
                  ...existingPath,
                  steps: newSteps,
                },
              },
            }
          })
        },

        // 清空指定KPI的下钻路径
        clearDrillDownPath: (kpiKey: string) => {
          set((state) => {
            const { [kpiKey]: _, ...remainingPaths } = state.paths
            return {
              paths: remainingPaths,
            }
          })
        },

        // 获取指定KPI已使用的维度键
        getUsedDimensions: (kpiKey: string): DrillDownDimensionKey[] => {
          const path = get().paths[kpiKey]
          if (!path) return []
          return path.steps.map((step) => step.dimensionKey)
        },

        // 获取指定KPI可用的维度列表（排除已使用的）
        getAvailableDimensions: (kpiKey: string): DrillDownDimension[] => {
          const usedDimensions = get().getUsedDimensions(kpiKey)
          return DRILL_DOWN_DIMENSIONS.filter(
            (dim) => !usedDimensions.includes(dim.key)
          )
        },

        // 重置所有下钻状态
        resetAll: () => {
          set({ paths: {} })
        },
      }),
      {
        name: 'drill-down-storage',
        version: 1,
      }
    ),
    {
      name: 'DrillDownStore',
    }
  )
)

/**
 * 获取指定KPI的下钻路径
 */
export function useKPIDrillDownPath(
  kpiKey: string
): KPIDrillDownPath | undefined {
  return useDrillDownStore((state) => state.paths[kpiKey])
}

/**
 * 获取指定KPI的下钻步骤数组
 */
export function useKPIDrillDownSteps(kpiKey: string): DrillDownStep[] {
  return useDrillDownStore(
    useShallow((state) => state.paths[kpiKey]?.steps ?? [])
  )
}

/**
 * 获取指定KPI可用的维度列表
 */
export function useAvailableDimensions(
  kpiKey: string
): DrillDownDimension[] {
  return useDrillDownStore(
    useShallow((state) => state.getAvailableDimensions(kpiKey))
  )
}
