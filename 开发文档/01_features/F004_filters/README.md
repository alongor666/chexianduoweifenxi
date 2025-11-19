# 多维度数据筛选与切片模块

> **状态**: ✅ stable
> **优先级**: P0
> **完整度**: 100%
> **版本**: v3.1.0
> **最后验证**: 2025-11-02

## 功能概述

提供全局与业务维度相结合的混合筛选架构。全局筛选器（时间、机构）位于顶部工具栏，提供统一的数据上下文；业务维度筛选器位于左侧面板，用于对当前数据视图进行深度钻取。

## 核心能力

### 全局工具栏筛选器

- ✅ **紧凑化时间筛选**: 弹出式面板，年度筛选恒定可多选；周序号会根据当前板块自动切换——KPI看板与专题分析锁定单周，周趋势分析与多维图表支持在单选/多选间切换，并提供全选、反选、清空等批量操作；进入“周趋势分析”标签时自动切换为多选并默认全选全部可用周次，确保周增量分析即时可用。
- ✅ **紧凑化机构筛选**: 弹出式面板，支持多选、实时搜索、批量操作和智能提示。
- ✅ **数据视图切换**: 在“KPI看板”和“趋势分析”两种视图间切换。

### 业务维度筛选面板

- ✅ **产品维度筛选**: 按险种、业务类型、险别进行组合筛选。
  - 保险类型：基于 `CANONICAL_INSURANCE_TYPES`（2种：商业险、交强险）
  - 业务类型：基于 `CANONICAL_BUSINESS_TYPES`（16种，严格符合CSV规范）
  - 险别组合：基于 `CANONICAL_COVERAGE_TYPES`（3种：主全、交三、单交）
- ✅ **客户维度筛选**: 按客户类型、评级、新续转等属性筛选。
  - 客户分类：基于 `CANONICAL_CUSTOMER_CATEGORIES`（11种，严格符合CSV规范）
  - 评级筛选（条件显示）：根据车辆类型智能显示对应评级项
    - **车险分等级**：仅客车类型可选（客车相关客户类别或业务类型）
    - **高速风险等级**：仅客车类型可选（客车相关客户类别或业务类型）
    - **小货车评分**：仅9吨以下货车可选（对应业务类型）
    - **大货车评分**：仅9吨以上货车可选（对应业务类型）
  - 新续转状态：基于 `CANONICAL_RENEWAL_STATUSES`（3种：新保、续保、转保）
- ✅ **筛选预设**: 支持保存和加载常用的筛选组合。
- ✅ **状态重置**: 一键清空所有业务维度筛选条件。

### 枚举值规范化

所有筛选器选项均遵循以下原则：
1. **规范值优先**：业务类型、客户分类等关键维度使用预定义的 CANONICAL 常量集合
2. **数据联动**：仅显示当前数据中实际存在的值（CANONICAL 集合与实际数据的交集）
3. **中文排序**：使用 `localeCompare(b, 'zh-CN')` 确保中文字符正确排序
4. **一致性保证**：确保筛选器选项与 CSV 导入规范、目标管理等模块完全一致

## 实现文件

### 全局筛选器 (Toolbar)

- ✅ [`src/components/filters/compact-time-filter.tsx`](../../../src/components/filters/compact-time-filter.tsx)
- ✅ [`src/components/filters/compact-organization-filter.tsx`](../../../src/components/filters/compact-organization-filter.tsx)
- ✅ [`src/components/layout/header.tsx`](../../../src/components/layout/header.tsx) (集成位置)

### 业务维度筛选器 (Side Panel)

- ✅ [`src/components/filters/filter-panel.tsx`](../../../src/components/filters/filter-panel.tsx) (容器)
- ✅ [`src/components/filters/product-filter.tsx`](../../../src/components/filters/product-filter.tsx)
- ✅ [`src/components/filters/customer-filter.tsx`](../../../src/components/filters/customer-filter.tsx)

### 工具模块

- ✅ [`src/utils/rating-visibility.ts`](../../../src/utils/rating-visibility.ts) (评级筛选器可见性逻辑)

## 相关文档

- [全局筛选器重构总结.md](../../archive/全局筛选器重构总结.md)
- [维度字典与枚举值](../../03_technical_design/dimensions_dictionary.md)
- [CSV导入规范](../../archive/CSV导入规范.md)

## 变更日志

### v3.2.0 (2025-11-19)
- **重构**: 评级筛选器从单一字段拆分为四种评级类型
  - 新增 `highwayRiskGrades`（高速风险等级）筛选器
  - 新增 `smallTruckScores`（小货车评分）筛选器
  - 新增 `largeTruckScores`（大货车评分）筛选器
  - 保留 `vehicleGrades`（车险分等级）筛选器
- **新增**: 智能条件显示逻辑
  - 根据已选择的客户类别或业务类型，动态显示对应的评级筛选项
  - 客车类型显示车险分等级和高速风险等级
  - 9吨以下货车显示小货车评分
  - 9吨以上货车显示大货车评分
  - 未选择时默认显示所有评级选项
- **修复**: "更多筛选"对话框重复关闭按钮问题
  - 移除了手动添加的关闭按钮，使用 DialogContent 组件自带的关闭按钮
- **重构**: 抽取评级显示逻辑为独立工具模块 `src/utils/rating-visibility.ts`
  - 提供可复用的工具函数：`shouldShowPassengerRatings`, `shouldShowSmallTruckRating`, `shouldShowLargeTruckRating`, `getRatingVisibility`
  - 定义车辆类型常量：`PASSENGER_CUSTOMER_CATEGORIES`, `PASSENGER_BUSINESS_TYPES`, `SMALL_TRUCK_BUSINESS_TYPES`, `LARGE_TRUCK_BUSINESS_TYPES`
  - 提高代码可维护性和可测试性
- **测试**: 新增完整的单元测试和 E2E 测试
  - 单元测试：31 个测试用例，100% 通过 (`src/utils/__tests__/rating-visibility.test.ts`)
  - E2E 测试：7 个场景测试 (`tests/e2e/filter-conditional-display.spec.ts`)
  - 覆盖所有条件显示逻辑和边界情况

### v3.1.0 (2025-11-02)
- **修复**: 业务类型筛选器现在使用 `CANONICAL_BUSINESS_TYPES` 常量，确保仅显示符合CSV规范的16种业务类型
- **修复**: 客户分类筛选器现在使用 `CANONICAL_CUSTOMER_CATEGORIES` 常量，确保仅显示符合CSV规范的11种客户分类
- **改进**: 统一所有筛选器的枚举值处理逻辑，与保险类型、险别组合等筛选器保持一致
- **改进**: 添加中文排序支持，确保筛选选项按中文拼音正确排序

## 测试覆盖

### 单元测试
- ✅ **评级可见性逻辑测试** (`src/utils/__tests__/rating-visibility.test.ts`)
  - 31 个测试用例，100% 通过
  - 覆盖客车、小货车、大货车评级显示逻辑
  - 包含边界情况和组合场景测试

### E2E 测试
- ✅ **评级筛选器条件显示测试** (`tests/e2e/filter-conditional-display.spec.ts`)
  - 7 个场景测试
  - 验证用户交互流程和UI响应
  - 测试关闭按钮唯一性
- ✅ **其他筛选器功能测试**
  - 所有筛选器功能，包括全局和业务维度，均已通过端到端测试
  - [测试记录-2025-10-20-最终.md](../../archive/测试记录-2025-10-20-最终.md)

## 技术栈

- **状态管理**: Zustand 5.x
- **UI组件**: Shadcn/ui + Radix UI
- **持久化**: localStorage

---

*最后更新: 2025-11-19*
*更新内容: 评级筛选器重构，实现四种评级类型的条件显示，修复更多筛选对话框UI问题*
