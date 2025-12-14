/**
 * 全局下钻状态管理
 * 使用 Zustand 管理全局下钻路径
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  DrillDownState,
  DrillDownStep,
  DrillDownDimensionKey,
} from '@/types/drill-down'

/**
 * 下钻状态管理 Store
 */
export const useDrillDownStore = create<DrillDownState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        steps: [],
        pendingSteps: null,

        // 添加下钻步骤（进入待确认状态）
        addDrillDownStep: (step: DrillDownStep) => {
          set(state => {
            // 如果没有待确认步骤，则基于当前已确认步骤开始
            const currentPending = state.pendingSteps ?? state.steps

            // 检查是否已经存在该维度的下钻（避免重复）
            const exists = currentPending.some(
              s => s.dimensionKey === step.dimensionKey
            )

            if (exists) {
              // 如果已存在，替换它（或者保持不变？通常下钻是逐级的，所以替换当前层级或添加新层级）
              // 这里的逻辑是：如果是同一维度，替换值；如果是新维度，追加
              // 但通常下钻是：点击 A -> 点击 B -> 点击 C
              // 如果用户点击了同一个维度的不同值，应该替换该维度及之后的所有步骤？
              // 简化逻辑：追加。如果维度已存在，则截断到该维度并替换值
              const index = currentPending.findIndex(
                s => s.dimensionKey === step.dimensionKey
              )

              if (index !== -1) {
                // 截断到该维度，并替换为新值
                const newSteps = currentPending.slice(0, index)
                return {
                  pendingSteps: [...newSteps, step],
                }
              }
            }

            return {
              pendingSteps: [...currentPending, step],
            }
          })
        },

        // 移除指定步骤及之后的所有步骤
        removeDrillDownStepsFrom: (stepIndex: number, fromPending = false) => {
          set(state => {
            if (fromPending) {
              // 从待确认列表中移除
              const currentPending = state.pendingSteps ?? state.steps
              if (stepIndex === 0) {
                return { pendingSteps: [] } // 清空待确认
              }
              return {
                pendingSteps: currentPending.slice(0, stepIndex),
              }
            } else {
              // 从已确认列表中移除（这通常意味着直接修改生效状态，或者进入待确认模式？）
              // 根据需求“用户确认即可运用”，修改已生效的步骤应该也需要确认吗？
              // 假设：点击面包屑导航回退是立即生效的，或者也进入 pending？
              // 为了简化交互，回退通常是立即的。但如果为了统一“确认”体验，也可以进入 pending。
              // 鉴于用户强调“确认即可运用”，建议所有变更都走 pending。

              const currentSteps = state.steps
              const newPending = currentSteps.slice(0, stepIndex)

              // 如果没有任何变化，就不进入 pending
              if (newPending.length === currentSteps.length) return {}

              return {
                pendingSteps: newPending,
              }
            }
          })
        },

        // 清除所有下钻步骤
        clearDrillDown: () => {
          set({ pendingSteps: [] })
        },

        // 确认应用待确认的步骤
        applyDrillDown: () => {
          set(state => {
            if (state.pendingSteps === null) return {}
            return {
              steps: state.pendingSteps,
              pendingSteps: null,
            }
          })
        },

        // 取消待确认的步骤
        cancelDrillDown: () => {
          set({ pendingSteps: null })
        },

        // 检查维度是否已使用
        isDimensionUsed: (key: DrillDownDimensionKey) => {
          const state = get()
          // 检查 pending 或 steps
          const currentSteps = state.pendingSteps ?? state.steps
          return currentSteps.some(step => step.dimensionKey === key)
        },

        // 重置所有状态
        resetAll: () => {
          set({
            steps: [],
            pendingSteps: null,
          })
        },
      }),
      {
        name: 'drill-down-storage',
      }
    )
  )
)
