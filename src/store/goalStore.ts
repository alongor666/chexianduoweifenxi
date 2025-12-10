/**
 * 目标管理 Store
 * 支持多维度目标数据管理
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  GoalCsvRow,
  GoalSnapshot,
  GoalState,
  GoalVersion,
} from '@/types/goal'
import type { DimensionType } from '@/components/dimension-selector'
import {
  CANONICAL_BUSINESS_TYPES,
  CANONICAL_THIRD_LEVEL_ORGANIZATIONS,
  CANONICAL_CUSTOMER_CATEGORIES,
  CANONICAL_INSURANCE_TYPES,
} from '@/constants/dimensions'

interface GoalStore extends GoalState {
  history: GoalSnapshot[]
  getInitialVersion: () => GoalVersion
  getCurrentVersion: () => GoalVersion
  setAchievedMap: (achieved: Record<string, number>) => void
  updateAchievedValue: (bizType: string, value: number) => void
  switchVersion: (versionId: string) => void
  createTunedVersion: (
    rows: GoalCsvRow[],
    importedAt?: Date
  ) => {
    versionId: string
  }
  exportVersionCsv: (versionId: string) => string
  exportCurrentVersionCsv: () => string
  undo: () => void
  // 新增：多维度管理方法
  switchDimension: (dimension: DimensionType) => void
  getDimensionItems: (dimension: DimensionType) => string[]
}

const BASE_YEAR = 2025

// 车险子业务类型的初始目标数据（不包含车险整体）
const SUB_BUSINESS_TARGETS: Array<{ bizType: string; annualTarget: number }> = [
  { bizType: '10吨以上-普货', annualTarget: 450 },
  { bizType: '10吨以上-牵引', annualTarget: 2100 },
  { bizType: '1吨以上非营业货车', annualTarget: 1000 },
  { bizType: '1吨以下非营业货车', annualTarget: 1600 },
  { bizType: '2-9吨营业货车', annualTarget: 600 },
  { bizType: '2吨以下营业货车', annualTarget: 1500 },
  { bizType: '9-10吨营业货车', annualTarget: 250 },
  { bizType: '出租车', annualTarget: 100 },
  { bizType: '非营业客车旧车非过户', annualTarget: 27000 },
  { bizType: '非营业客车旧车过户车', annualTarget: 4000 },
  { bizType: '非营业客车新车', annualTarget: 1400 },
  { bizType: '摩托车', annualTarget: 1700 },
  { bizType: '其他', annualTarget: 100 },
  { bizType: '特种车', annualTarget: 100 },
  { bizType: '网约车', annualTarget: 300 },
  { bizType: '自卸', annualTarget: 900 },
]

// 业务类型的初始目标（仅包含子业务类型，车险整体通过计算得出）
const INITIAL_TARGETS: Array<{ bizType: string; annualTarget: number }> = [
  ...SUB_BUSINESS_TARGETS,
]

// 为不同维度生成初始目标数据
const generateDimensionTargets = (
  dimension: DimensionType
): Array<{ bizType: string; annualTarget: number }> => {
  const items = getDimensionItemsStatic(dimension)
  const baseTarget = 1000 // 基础目标值

  return items.map(item => ({
    bizType: item,
    annualTarget: baseTarget,
  }))
}

// 静态方法获取维度项目
const getDimensionItemsStatic = (dimension: DimensionType): string[] => {
  switch (dimension) {
    case 'businessType':
      return ['车险整体', ...CANONICAL_BUSINESS_TYPES]
    case 'thirdLevelOrganization':
      return CANONICAL_THIRD_LEVEL_ORGANIZATIONS
    case 'customerCategory':
      return CANONICAL_CUSTOMER_CATEGORIES
    case 'insuranceType':
      return CANONICAL_INSURANCE_TYPES
    default:
      return []
  }
}

const INITIAL_VERSION_ID = `${BASE_YEAR}-年初目标`

const createInitialVersion = (
  dimension: DimensionType = 'businessType'
): GoalVersion => {
  const targets =
    dimension === 'businessType'
      ? INITIAL_TARGETS
      : generateDimensionTargets(dimension)

  return {
    id: INITIAL_VERSION_ID,
    type: 'INIT',
    createdAt: new Date(`${BASE_YEAR}-01-01T00:00:00.000Z`).toISOString(),
    locked: true,
    rows: targets.map(target => ({
      bizType: target.bizType,
      annualTargetInit: target.annualTarget,
      annualTargetTuned: target.annualTarget,
    })),
  }
}

const buildInitialAchievedMap = (
  version: GoalVersion
): Record<string, number> => {
  const achievedMap: Record<string, number> = {}
  version.rows.forEach(row => {
    achievedMap[row.bizType] = 0
  })
  return achievedMap
}

const createInitialState = (): GoalState => {
  const initialVersion = createInitialVersion('businessType')

  // 为所有维度创建初始数据
  const dimensionData: Record<
    DimensionType,
    {
      versions: GoalVersion[]
      currentVersionId: string
      achievedMap: Record<string, number>
    }
  > = {
    businessType: {
      versions: [initialVersion],
      currentVersionId: INITIAL_VERSION_ID,
      achievedMap: buildInitialAchievedMap(initialVersion),
    },
    thirdLevelOrganization: {
      versions: [createInitialVersion('thirdLevelOrganization')],
      currentVersionId: INITIAL_VERSION_ID,
      achievedMap: buildInitialAchievedMap(
        createInitialVersion('thirdLevelOrganization')
      ),
    },
    customerCategory: {
      versions: [createInitialVersion('customerCategory')],
      currentVersionId: INITIAL_VERSION_ID,
      achievedMap: buildInitialAchievedMap(
        createInitialVersion('customerCategory')
      ),
    },
    insuranceType: {
      versions: [createInitialVersion('insuranceType')],
      currentVersionId: INITIAL_VERSION_ID,
      achievedMap: buildInitialAchievedMap(
        createInitialVersion('insuranceType')
      ),
    },
  }

  return {
    baseYear: BASE_YEAR,
    versions: [initialVersion],
    currentVersionId: INITIAL_VERSION_ID,
    achievedMap: buildInitialAchievedMap(initialVersion),
    currentDimension: 'businessType',
    dimensionData,
  }
}

const cloneSnapshot = (snapshot: GoalSnapshot): GoalSnapshot => ({
  currentVersionId: snapshot.currentVersionId,
  versions: snapshot.versions.map(version => ({
    ...version,
    rows: version.rows.map(row => ({ ...row })),
  })),
  currentDimension: snapshot.currentDimension,
  dimensionData: Object.fromEntries(
    Object.entries(snapshot.dimensionData).map(([dim, data]) => [
      dim,
      {
        ...data,
        versions: data.versions.map(version => ({
          ...version,
          rows: version.rows.map(row => ({ ...row })),
        })),
      },
    ])
  ) as Record<
    DimensionType,
    {
      versions: GoalVersion[]
      currentVersionId: string
      achievedMap: Record<string, number>
    }
  >,
})

const buildSnapshot = (state: GoalState): GoalSnapshot => ({
  currentVersionId: state.currentVersionId,
  versions: state.versions.map(version => ({
    ...version,
    rows: version.rows.map(row => ({ ...row })),
  })),
  currentDimension: state.currentDimension,
  dimensionData: Object.fromEntries(
    Object.entries(state.dimensionData).map(([dim, data]) => [
      dim,
      {
        ...data,
        versions: data.versions.map(version => ({
          ...version,
          rows: version.rows.map(row => ({ ...row })),
        })),
      },
    ])
  ) as Record<
    DimensionType,
    {
      versions: GoalVersion[]
      currentVersionId: string
      achievedMap: Record<string, number>
    }
  >,
})

const generateVersionName = (
  existing: GoalVersion[],
  baseYear: number,
  importedAt: Date
): string => {
  const dateLabel = `${importedAt.getFullYear()}${`${importedAt.getMonth() + 1}`.padStart(2, '0')}${`${importedAt.getDate()}`.padStart(2, '0')}`
  const baseName = `${baseYear}-微调目标-${dateLabel}`
  let candidate = baseName
  let counter = 2
  while (existing.some(version => version.id === candidate)) {
    candidate = `${baseName}_#${counter}`
    counter += 1
  }
  return candidate
}

const serializeVersionToCsv = (version: GoalVersion): string => {
  const lines = ['业务类型,年度目标（万）']
  version.rows.forEach(row => {
    const value =
      version.type === 'INIT' ? row.annualTargetInit : row.annualTargetTuned
    lines.push(`${row.bizType},${value}`)
  })
  return `${lines.join('\n')}\n`
}

export const KNOWN_BUSINESS_TYPES = INITIAL_TARGETS.map(item => item.bizType)

export const useGoalStore = create<GoalStore>()(
  devtools((set, get) => ({
    ...createInitialState(),

    getInitialVersion: () => {
      const { versions } = get()
      const initVersion = versions.find(version => version.type === 'INIT')
      if (!initVersion) {
        throw new Error('缺少年初目标版本，请检查初始化数据')
      }
      return initVersion
    },

    getCurrentVersion: () => {
      const { versions, currentVersionId } = get()
      const version = versions.find(item => item.id === currentVersionId)
      if (!version) {
        throw new Error('当前版本不存在，请重新选择版本')
      }
      return version
    },

    setAchievedMap: achieved => {
      set(state => ({
        achievedMap: {
          ...state.achievedMap,
          ...achieved,
        },
      }))
    },

    updateAchievedValue: (bizType, value) => {
      set(state => ({
        achievedMap: {
          ...state.achievedMap,
          [bizType]: value,
        },
      }))
    },

    switchVersion: versionId => {
      set(state => {
        if (!state.versions.some(version => version.id === versionId)) {
          return state
        }
        return {
          ...state,
          currentVersionId: versionId,
        }
      })
    },

    createTunedVersion: (rows, importedAt = new Date()) => {
      const state = get()
      const initVersion = state.versions.find(
        version => version.type === 'INIT'
      )
      if (!initVersion) {
        throw new Error('缺少年初目标版本，无法创建微调目标')
      }

      const importedMap = new Map(
        rows.map(row => [row.bizType, row.annualTarget])
      )
      const missingBizTypes = initVersion.rows
        .filter(row => !importedMap.has(row.bizType))
        .map(row => row.bizType)

      if (missingBizTypes.length > 0) {
        throw new Error(
          `导入失败，缺少以下业务类型：${missingBizTypes.join('、')}`
        )
      }

      // 计算子业务类型的目标总和
      const subBusinessSum = rows
        .filter(row => row.bizType !== '车险整体')
        .reduce((sum, row) => sum + row.annualTarget, 0)

      // 自动更新车险整体目标为子业务类型之和
      const updatedRows = rows.map(row => {
        if (row.bizType === '车险整体') {
          return { ...row, annualTarget: subBusinessSum }
        }
        return row
      })

      const newRows = initVersion.rows.map(row => {
        const updatedRow = updatedRows.find(r => r.bizType === row.bizType)
        return {
          bizType: row.bizType,
          annualTargetInit: row.annualTargetInit,
          annualTargetTuned: updatedRow
            ? updatedRow.annualTarget
            : row.annualTargetTuned,
        }
      })

      const snapshot = buildSnapshot(state)
      const versionId = generateVersionName(
        state.versions,
        state.baseYear,
        importedAt
      )

      const newVersion: GoalVersion = {
        id: versionId,
        type: 'TUNED',
        createdAt: importedAt.toISOString(),
        locked: false,
        rows: newRows,
      }

      set({
        versions: [...state.versions, newVersion],
        currentVersionId: versionId,
        achievedMap: { ...state.achievedMap },
        history: [...state.history, cloneSnapshot(snapshot)],
      })

      return { versionId }
    },

    exportVersionCsv: versionId => {
      const { versions } = get()
      const version = versions.find(item => item.id === versionId)
      if (!version) {
        throw new Error(`未找到指定版本：${versionId}`)
      }
      return serializeVersionToCsv(version)
    },

    exportCurrentVersionCsv: () => {
      const { currentVersionId } = get()
      return get().exportVersionCsv(currentVersionId)
    },

    undo: () => {
      set(state => {
        if (state.history.length === 0) {
          return state
        }
        const lastSnapshot = state.history[state.history.length - 1]
        return {
          ...state,
          ...lastSnapshot,
          history: state.history.slice(0, -1),
        }
      })
    },

    // 新增：多维度管理方法
    switchDimension: (dimension: DimensionType) => {
      set(state => {
        const dimensionState = state.dimensionData[dimension]
        return {
          ...state,
          currentDimension: dimension,
          versions: dimensionState.versions,
          currentVersionId: dimensionState.currentVersionId,
          achievedMap: dimensionState.achievedMap,
        }
      })
    },

    getDimensionItems: (dimension: DimensionType) => {
      return getDimensionItemsStatic(dimension)
    },
  }))
)

export const resetGoalStore = () => {
  const initialVersion = createInitialVersion()
  useGoalStore.setState({
    baseYear: BASE_YEAR,
    versions: [initialVersion],
    currentVersionId: INITIAL_VERSION_ID,
    achievedMap: buildInitialAchievedMap(initialVersion),
    history: [],
  })
}
