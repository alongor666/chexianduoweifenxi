/**
 * 目标管理领域 Store
 * 专注于保费目标的管理和版本控制
 *
 * @responsibility 单一职责：只管理目标数据和版本
 * @migration 从 use-app-store.ts 拆分出目标管理部分
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  PremiumTargets,
  DimensionTargetMap,
  TargetVersionSnapshot,
} from "@/types/insurance";
import { TARGET_DIMENSIONS } from "@/types/insurance";
import { normalizeChineseText } from "@/lib/utils";

interface TargetStore {
  // ==================== 状态 ====================
  /**
   * 保费目标数据
   */
  premiumTargets: PremiumTargets;

  // ==================== 操作方法 ====================

  /**
   * 设置保费目标
   * @param targets 目标数据
   */
  setPremiumTargets: (targets: PremiumTargets) => void;

  /**
   * 更新总目标
   * @param overall 总目标金额
   */
  updateOverallTarget: (overall: number) => void;

  /**
   * 更新业务类型目标（向后兼容）
   * @param byBusinessType 业务类型目标映射
   */
  updateBusinessTypeTargets: (byBusinessType: Record<string, number>) => void;

  /**
   * 更新维度目标
   * @param dimension 维度键
   * @param entries 目标条目
   */
  updateDimensionTargets: (
    dimension: keyof DimensionTargetMap,
    entries: Record<string, number>,
  ) => void;

  /**
   * 保存当前目标为版本快照
   * @param dimension 维度键
   * @param label 版本标签
   * @param note 备注信息
   */
  saveTargetVersion: (
    dimension: keyof DimensionTargetMap,
    label: string,
    note?: string,
  ) => void;

  /**
   * 恢复指定版本的目标
   * @param dimension 维度键
   * @param versionId 版本ID
   */
  restoreTargetVersion: (
    dimension: keyof DimensionTargetMap,
    versionId: string,
  ) => void;

  /**
   * 删除指定版本
   * @param dimension 维度键
   * @param versionId 版本ID
   */
  deleteTargetVersion: (
    dimension: keyof DimensionTargetMap,
    versionId: string,
  ) => void;

  /**
   * 设置目标年份
   * @param year 年份
   */
  setTargetYear: (year: number) => void;

  /**
   * 清空所有目标
   */
  clearAllTargets: () => void;

  /**
   * 从本地存储加载目标数据
   */
  loadFromStorage: () => void;

  // ==================== 计算属性 ====================

  /**
   * 获取指定维度的目标
   * @param dimension 维度键
   */
  getDimensionTargets: (
    dimension: keyof DimensionTargetMap,
  ) => Record<string, number>;

  /**
   * 获取指定维度的版本历史
   * @param dimension 维度键
   */
  getDimensionVersions: (
    dimension: keyof DimensionTargetMap,
  ) => TargetVersionSnapshot[];

  /**
   * 检查是否有目标数据
   */
  hasTargets: () => boolean;

  /**
   * 获取所有维度的目标总和
   */
  getTotalTargets: () => number;
}

/**
 * 辅助函数：创建空的维度目标映射
 */
function createEmptyDimensionTargets(): DimensionTargetMap {
  return TARGET_DIMENSIONS.reduce((acc, key) => {
    acc[key] = {
      entries: {},
      updatedAt: null,
      versions: [],
    };
    return acc;
  }, {} as DimensionTargetMap);
}

/**
 * 辅助函数：规范化目标值
 */
function normalizeTargetValue(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
}

/**
 * 辅助函数：规范化目标条目
 */
function normalizeTargetEntries(
  entries?: Record<string, number>,
): Record<string, number> {
  if (!entries || typeof entries !== "object") return {};
  const normalized: Record<string, number> = {};
  Object.entries(entries).forEach(([rawKey, rawValue]) => {
    const key = normalizeChineseText(rawKey);
    if (!key) return;
    normalized[key] = normalizeTargetValue(rawValue);
  });
  return normalized;
}

/**
 * 辅助函数：规范化版本快照
 */
function normalizeVersionSnapshots(
  versions: TargetVersionSnapshot[] | undefined,
): TargetVersionSnapshot[] {
  if (!Array.isArray(versions)) return [];
  const sanitized = versions
    .map((version) => {
      if (!version) return null;
      const id =
        version.id ||
        `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const baseSnapshot = {
        id,
        label: version.label || id,
        createdAt: version.createdAt || new Date().toISOString(),
        overall: normalizeTargetValue(version.overall),
        entries: normalizeTargetEntries(version.entries),
      };
      return version.note
        ? { ...baseSnapshot, note: version.note }
        : baseSnapshot;
    })
    .filter((snapshot): snapshot is TargetVersionSnapshot => snapshot !== null);
  return sanitized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * 辅助函数：升级保费目标数据结构
 */
function upgradePremiumTargets(raw?: Partial<PremiumTargets>): PremiumTargets {
  if (!raw) {
    return {
      year: new Date().getFullYear(),
      overall: 0,
      byBusinessType: {},
      dimensions: createEmptyDimensionTargets(),
      updatedAt: null,
    };
  }

  const year = raw.year || new Date().getFullYear();
  const overall = normalizeTargetValue(raw.overall);
  const baseUpdatedAt = raw.updatedAt ?? null;

  const normalizedDimensions: DimensionTargetMap =
    createEmptyDimensionTargets();

  const legacyBusinessEntries = normalizeTargetEntries(raw.byBusinessType);
  TARGET_DIMENSIONS.forEach((dimensionKey) => {
    const rawDimension = raw.dimensions?.[dimensionKey];
    const entries = (() => {
      if (dimensionKey === "businessType") {
        if (Object.keys(legacyBusinessEntries).length > 0) {
          return legacyBusinessEntries;
        }
      }
      return normalizeTargetEntries(rawDimension?.entries);
    })();

    normalizedDimensions[dimensionKey] = {
      entries,
      updatedAt:
        rawDimension?.updatedAt ??
        (dimensionKey === "businessType"
          ? baseUpdatedAt
          : (rawDimension?.updatedAt ?? null)),
      versions: normalizeVersionSnapshots(rawDimension?.versions),
    };
  });

  return {
    year,
    overall,
    byBusinessType: normalizedDimensions.businessType.entries,
    dimensions: normalizedDimensions,
    updatedAt: baseUpdatedAt,
  };
}

/**
 * 默认保费目标
 */
const defaultPremiumTargets: PremiumTargets = {
  year: new Date().getFullYear(),
  overall: 0,
  byBusinessType: {},
  dimensions: createEmptyDimensionTargets(),
  updatedAt: null,
};

/**
 * 本地存储键名
 */
const PREMIUM_TARGET_STORAGE_KEY = "insurDashPremiumTargets";

/**
 * 创建目标 Store
 */
export const useTargetStore = create<TargetStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ==================== 初始状态 ====================
        premiumTargets: defaultPremiumTargets,

        // ==================== 操作方法 ====================

        setPremiumTargets: (targets) => {
          const timestamp = targets.updatedAt ?? new Date().toISOString();
          const year = targets.year || new Date().getFullYear();
          const overall = normalizeTargetValue(targets.overall);

          const normalizedDimensions: DimensionTargetMap =
            createEmptyDimensionTargets();
          TARGET_DIMENSIONS.forEach((dimensionKey) => {
            const incomingDimension = targets.dimensions?.[dimensionKey];
            const fallbackEntries =
              dimensionKey === "businessType"
                ? targets.byBusinessType
                : undefined;

            const entries = normalizeTargetEntries(
              incomingDimension?.entries ?? fallbackEntries,
            );

            const hasMeaningfulPayload =
              incomingDimension?.entries !== undefined ||
              (dimensionKey === "businessType" &&
                Object.keys(entries).length > 0);

            normalizedDimensions[dimensionKey] = {
              entries,
              updatedAt:
                incomingDimension?.updatedAt ??
                (hasMeaningfulPayload ? timestamp : null),
              versions: normalizeVersionSnapshots(incomingDimension?.versions),
            };
          });

          const nextTargets: PremiumTargets = {
            year,
            overall,
            byBusinessType: normalizedDimensions.businessType.entries,
            dimensions: normalizedDimensions,
            updatedAt: timestamp,
          };

          set({ premiumTargets: nextTargets }, false, "setPremiumTargets");

          console.log("[TargetStore] 保费目标已更新");
        },

        updateOverallTarget: (overall) => {
          set(
            (state) => ({
              premiumTargets: {
                ...state.premiumTargets,
                overall: normalizeTargetValue(overall),
                updatedAt: new Date().toISOString(),
              },
            }),
            false,
            "updateOverallTarget",
          );
        },

        updateBusinessTypeTargets: (byBusinessType) => {
          set(
            (state) => {
              const normalizedEntries = normalizeTargetEntries(byBusinessType);
              return {
                premiumTargets: {
                  ...state.premiumTargets,
                  byBusinessType: normalizedEntries,
                  dimensions: {
                    ...state.premiumTargets.dimensions,
                    businessType: {
                      ...state.premiumTargets.dimensions.businessType,
                      entries: normalizedEntries,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                  updatedAt: new Date().toISOString(),
                },
              };
            },
            false,
            "updateBusinessTypeTargets",
          );
        },

        updateDimensionTargets: (dimension, entries) => {
          set(
            (state) => {
              const normalizedEntries = normalizeTargetEntries(entries);
              const newDimensions = {
                ...state.premiumTargets.dimensions,
                [dimension]: {
                  ...state.premiumTargets.dimensions[dimension],
                  entries: normalizedEntries,
                  updatedAt: new Date().toISOString(),
                },
              };

              return {
                premiumTargets: {
                  ...state.premiumTargets,
                  dimensions: newDimensions,
                  // 如果是业务类型维度，同时更新向后兼容字段
                  byBusinessType:
                    dimension === "businessType"
                      ? normalizedEntries
                      : state.premiumTargets.byBusinessType,
                  updatedAt: new Date().toISOString(),
                },
              };
            },
            false,
            "updateDimensionTargets",
          );
        },

        saveTargetVersion: (dimension, label, note) => {
          set(
            (state) => {
              const currentDimension =
                state.premiumTargets.dimensions[dimension];
              const newVersion: TargetVersionSnapshot = {
                id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                label,
                createdAt: new Date().toISOString(),
                overall: state.premiumTargets.overall,
                entries: { ...currentDimension.entries },
                note,
              };

              const updatedVersions = [
                newVersion,
                ...(currentDimension.versions || []),
              ];

              return {
                premiumTargets: {
                  ...state.premiumTargets,
                  dimensions: {
                    ...state.premiumTargets.dimensions,
                    [dimension]: {
                      ...currentDimension,
                      versions: updatedVersions,
                    },
                  },
                },
              };
            },
            false,
            "saveTargetVersion",
          );

          console.log(`[TargetStore] 版本已保存: ${label}`);
        },

        restoreTargetVersion: (dimension, versionId) => {
          const state = get();
          const dimensionData = state.premiumTargets.dimensions[dimension];
          const version = dimensionData.versions?.find(
            (v) => v.id === versionId,
          );

          if (!version) {
            console.warn(`[TargetStore] 版本不存在: ${versionId}`);
            return;
          }

          set(
            (state) => ({
              premiumTargets: {
                ...state.premiumTargets,
                overall: version.overall,
                dimensions: {
                  ...state.premiumTargets.dimensions,
                  [dimension]: {
                    ...dimensionData,
                    entries: { ...version.entries },
                    updatedAt: new Date().toISOString(),
                  },
                },
                // 如果是业务类型维度，同时更新向后兼容字段
                byBusinessType:
                  dimension === "businessType"
                    ? { ...version.entries }
                    : state.premiumTargets.byBusinessType,
                updatedAt: new Date().toISOString(),
              },
            }),
            false,
            "restoreTargetVersion",
          );

          console.log(`[TargetStore] 版本已恢复: ${version.label}`);
        },

        deleteTargetVersion: (dimension, versionId) => {
          set(
            (state) => {
              const dimensionData = state.premiumTargets.dimensions[dimension];
              const updatedVersions = (dimensionData.versions || []).filter(
                (v) => v.id !== versionId,
              );

              return {
                premiumTargets: {
                  ...state.premiumTargets,
                  dimensions: {
                    ...state.premiumTargets.dimensions,
                    [dimension]: {
                      ...dimensionData,
                      versions: updatedVersions,
                    },
                  },
                },
              };
            },
            false,
            "deleteTargetVersion",
          );

          console.log(`[TargetStore] 版本已删除: ${versionId}`);
        },

        setTargetYear: (year) => {
          set(
            (state) => ({
              premiumTargets: {
                ...state.premiumTargets,
                year,
                updatedAt: new Date().toISOString(),
              },
            }),
            false,
            "setTargetYear",
          );
        },

        clearAllTargets: () => {
          set(
            {
              premiumTargets: {
                ...defaultPremiumTargets,
                year: new Date().getFullYear(),
              },
            },
            false,
            "clearAllTargets",
          );
          console.log("[TargetStore] 所有目标已清空");
        },

        loadFromStorage: () => {
          if (typeof window === "undefined") return;

          try {
            const stored = window.localStorage.getItem(
              PREMIUM_TARGET_STORAGE_KEY,
            );
            if (stored) {
              const parsed = JSON.parse(stored) as Partial<PremiumTargets>;
              const upgraded = upgradePremiumTargets(parsed);
              set({ premiumTargets: upgraded }, false, "loadFromStorage");
              console.log("[TargetStore] 从本地存储加载目标数据成功");
            }
          } catch (error) {
            console.warn(
              "[TargetStore] 读取保费目标数据失败，已回退默认值",
              error,
            );
          }
        },

        // ==================== 计算属性 ====================

        getDimensionTargets: (dimension) => {
          return get().premiumTargets.dimensions[dimension]?.entries || {};
        },

        getDimensionVersions: (dimension) => {
          return get().premiumTargets.dimensions[dimension]?.versions || [];
        },

        hasTargets: () => {
          const { premiumTargets } = get();
          return (
            premiumTargets.overall > 0 ||
            Object.keys(premiumTargets.byBusinessType).length > 0 ||
            TARGET_DIMENSIONS.some(
              (dim) =>
                Object.keys(premiumTargets.dimensions[dim]?.entries || {})
                  .length > 0,
            )
          );
        },

        getTotalTargets: () => {
          const { premiumTargets } = get();
          if (premiumTargets.overall > 0) {
            return premiumTargets.overall;
          }

          // 如果没有总目标，则汇总所有维度目标
          let total = 0;
          TARGET_DIMENSIONS.forEach((dim) => {
            const entries = premiumTargets.dimensions[dim]?.entries || {};
            total += Object.values(entries).reduce((sum, val) => sum + val, 0);
          });
          return total;
        },
      }),
      {
        name: "target-store",
        // 持久化到localStorage
        storage: {
          getItem: (name) => {
            const value = window.localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            window.localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            window.localStorage.removeItem(name);
          },
        },
        // 只持久化premiumTargets
        partialize: (state) =>
          ({ premiumTargets: state.premiumTargets }) as any,
        // 自定义合并逻辑，确保数据结构升级
        merge: (persistedState: any, currentState) => {
          const upgraded = upgradePremiumTargets(
            persistedState?.premiumTargets,
          );
          return {
            ...currentState,
            premiumTargets: upgraded,
          };
        },
      },
    ),
    {
      name: "target-store",
    },
  ),
);
