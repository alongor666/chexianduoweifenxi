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
- ✅ **机构级联**: 三级机构选择变化时，自动收敛产品、客户与渠道筛选值到该机构实际存在的选项，避免空数据口径。
- ✅ **客户维度筛选**: 按客户类型、评级、新续转等属性筛选。
  - 客户分类：基于 `CANONICAL_CUSTOMER_CATEGORIES`（11种，严格符合CSV规范）
  - 车险评级：从数据中动态提取（排除X和空值）
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

## 相关文档

- [全局筛选器重构总结.md](../../archive/全局筛选器重构总结.md)
- [维度字典与枚举值](../../03_technical_design/dimensions_dictionary.md)
- [CSV导入规范](../../archive/CSV导入规范.md)

## 变更日志

### v3.1.0 (2025-11-02)

- **修复**: 业务类型筛选器现在使用 `CANONICAL_BUSINESS_TYPES` 常量，确保仅显示符合CSV规范的16种业务类型
- **修复**: 客户分类筛选器现在使用 `CANONICAL_CUSTOMER_CATEGORIES` 常量，确保仅显示符合CSV规范的11种客户分类
- **改进**: 统一所有筛选器的枚举值处理逻辑，与保险类型、险别组合等筛选器保持一致
- **改进**: 添加中文排序支持，确保筛选选项按中文拼音正确排序

## 测试覆盖

- ✅ **100% 通过**: 所有筛选器功能，包括全局和业务维度，均已通过端到端测试。
- [测试记录-2025-10-20-最终.md](../../archive/测试记录-2025-10-20-最终.md)

## 技术栈

- **状态管理**: Zustand 5.x
- **UI组件**: Shadcn/ui + Radix UI
- **持久化**: localStorage

---

_最后更新: 2025-11-02_
_更新内容: 修复业务类型和客户分类筛选器的枚举值规范化问题_
