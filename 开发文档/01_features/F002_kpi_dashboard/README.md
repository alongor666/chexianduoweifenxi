# 核心KPI看板模块

> **状态**: ✅ stable
> **优先级**: P0
> **完整度**: 100%
> **版本**: v3.1.0
> **最后验证**: 2025-10-24

## 功能概述

以4x4网格布局展示16个核心KPI，提供全面的业务健康度概览。支持动态计算、环比分析、颜色编码和紧凑模式，旨在提供“苹果发布会”级别的视觉体验和信息密度。

## 核心能力

- ✅ **16个核心KPI**: 全面覆盖比率、金额、结构和单均质量四个维度。
- ✅ **4x4网格布局**: 响应式卡片布局，信息结构清晰，适配多种屏幕尺寸。
- ✅ **环比分析**: 所有KPI均显示与上期对比的**绝对增量**和**变化幅度箭头**。
- ✅ **智能颜色编码**: 根据指标的正向/逆向属性，使用红/绿颜色体系直观反映业务表现。
- ✅ **紧凑模式**: 为其他分析页面提供精简版KPI展示。
- ✅ **单周深度模式**: 与顶部时间筛选联动，始终锁定单周选择，保证所有指标口径一致。
- ✅ **公式详情展示**: 悬浮提示显示完整的计算公式、分子分母数值、计算结果、业务含义和示例。

## 实现文件

- ✅ [`src/components/features/kpi-dashboard.tsx`](../../../src/components/features/kpi-dashboard.tsx)
- ✅ [`src/components/features/compact-kpi-dashboard.tsx`](../../../src/components/features/compact-kpi-dashboard.tsx)
- ✅ [`src/hooks/use-kpi.ts`](../../../src/hooks/use-kpi.ts) (核心计算逻辑)
- ✅ [`src/utils/comparison.ts`](../../../src/utils/comparison.ts) (环比计算逻辑)

## 相关文档

- [核心指标计算引擎 V2.0](../../03_technical_design/core_calculations.md)
- [KPI看板-4x4网格布局-测试记录.md](../../archive/KPI看板-4x4网格布局-测试记录.md)

## 测试覆盖

- ✅ **100% 通过**: 所有功能点和显示规则均已通过详细测试。
- [测试记录-2025-10-20-最终.md](../../archive/测试记录-2025-10-20-最终.md)

## 技术栈

- **UI组件**: React 18 + Tailwind CSS
- **图表库**: Recharts 3.x (Sparklines)
- **工具提示**: Radix UI Tooltip

---

*本文档基于代码分析自动生成*
*生成时间: 2025-10-20T16:03:18.876Z*
