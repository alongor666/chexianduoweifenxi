# 数据同步修复说明

## 问题描述

导入CSV数据后，主页面没有显示数据，停留在"上传数据文件以开始分析"界面。

## 根本原因

在架构迁移过程中，主页面已经迁移到新架构，使用 `useInsuranceData()` 从新的 `DataStore` 获取数据。但是数据上传组件仍然只更新旧的 `useAppStore`，导致新旧 Store 数据不同步。

### 数据流程分析

**迁移前**：

```
CSV上传 → useAppStore.setRawData → rawData 更新 → 页面显示数据 ✅
```

**迁移后（问题状态）**：

```
CSV上传 → useAppStore.setRawData → 旧Store.rawData 更新
                                    ↓
                               新Store.rawData 未更新 ❌
                                    ↓
                          页面从新Store读取 → 无数据
```

## 解决方案

修改 `src/store/use-app-store.ts`，在数据更新时同步到新的 `DataStore`：

### 1. 导入新架构的 Store

```typescript
// src/store/use-app-store.ts
import { useDataStore } from '@/store/domains/dataStore'
```

### 2. 修改 `setRawData` 方法

```typescript
setRawData: data =>
  set(
    state => {
      const normalizedData = data.map(r => ({
        ...r,
        customer_category_3: normalizeChineseText(r.customer_category_3),
        business_type_category: normalizeChineseText(r.business_type_category),
        third_level_organization: normalizeChineseText(r.third_level_organization),
        terminal_source: normalizeChineseText(r.terminal_source),
      }))

      // ✅ 新增：同步数据到新架构的 DataStore
      useDataStore.getState().setRawData(normalizedData)

      // ... 其余逻辑
    },
    false,
    'setRawData'
  ),
```

### 3. 修改 `appendRawData` 方法

```typescript
appendRawData: data =>
  set(
    state => {
      // ... 数据规范化和去重逻辑
      const mergedData = [...state.rawData, ...uniqueNewData]

      // ✅ 新增：同步数据到新架构的 DataStore
      useDataStore.getState().setRawData(mergedData)

      // ... 其余逻辑
    },
    false,
    'appendRawData'
  ),
```

### 4. 修改 `clearData` 方法

```typescript
clearData: () => {
  // ✅ 新增：同步清除新架构的 DataStore
  useDataStore.getState().clearData()

  set(
    {
      rawData: [],
      computedKPIs: new Map(),
      error: null,
    },
    false,
    'clearData'
  )
},
```

## 修复后的数据流程

```
CSV上传 → useAppStore.setRawData → 旧Store.rawData 更新
                                    ↓
                          同步 → 新Store.rawData 更新 ✅
                                    ↓
                          页面从新Store读取 → 显示数据 ✅
```

## 验证步骤

1. ✅ 启动开发服务器：`npm run dev`
2. ✅ TypeScript 编译无错误
3. ⏳ 上传CSV文件
4. ⏳ 验证主页面显示数据
5. ⏳ 验证新架构的 `useInsuranceData()` 返回正确数据

## 关键代码位置

- **修改文件**: `src/store/use-app-store.ts`
- **关键行数**:
  - 第30行: 导入 DataStore
  - 第289行: setRawData 同步
  - 第357行: appendRawData 同步
  - 第397行: clearData 同步

## 向后兼容性

此修复保持100%向后兼容：

- ✅ 旧组件仍然可以使用 `useAppStore`
- ✅ 新组件可以使用新架构 Hooks
- ✅ 数据在两个 Store 中保持同步
- ✅ 无需修改任何组件代码

## 后续计划

在完成所有组件迁移后，可以：

1. 移除旧的 `useAppStore` 中的数据存储逻辑
2. 将其作为 `DataStore` 的代理层
3. 最终完全废弃 `useAppStore`

---

**修复时间**: 2025-10-23
**修复人员**: AI助手
**验证状态**: 待用户测试
