# 核心KPI看板模块

> **状态**: 🚧 in_progress
> **优先级**: P0
> **完整度**: 10%
> **版本**: v2.3.0
> **最后验证**: 2025-12-13

## 功能概述

展示8个核心KPI和5个补充指标,支持动态计算、颜色编码和趋势展示

## 核心能力

- ✅ **KPI计算引擎**: 聚合优先的高性能计算,支持10万+数据
- ✅ **4x4网格布局**: 响应式卡片布局,适配桌面和平板
- ✅ **紧凑模式**: 精简版看板,适用于趋势分析页
- 🚧 **公式展示**: 工具提示显示计算公式和详细值
- ✅ **微型趋势图**: 悬浮显示最近12周KPI趋势
- ✅ **颜色编码**: 满期边际贡献率5级色谱

## 实现文件

### 核心文件 (0/4)

- ❌ [`src/components/features/kpi-dashboard.tsx`](../../../src/components/features/kpi-dashboard.tsx)
- ❌ [`src/components/features/compact-kpi-dashboard.tsx`](../../../src/components/features/compact-kpi-dashboard.tsx)
- ❌ [`src/lib/calculations/kpi-engine.ts`](../../../src/lib/calculations/kpi-engine.ts)
- ❌ [`src/lib/calculations/kpi-formulas.ts`](../../../src/lib/calculations/kpi-formulas.ts)

### 增强功能

- ⏳ formula_display
- ✅ sparkline
- ⏳ compact_mode

## 相关决策

- [ADR-001](../../02_decisions/ADR-001.md)
- [ADR-004](../../02_decisions/ADR-004.md)

## 测试覆盖

- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试

## 技术栈

- **UI组件**: React 18 + Tailwind CSS
- **图表库**: Recharts 3.x (Sparklines)
- **工具提示**: Radix UI Tooltip

---

*本文档基于代码分析自动生成*
*生成时间: 2025-12-13T11:45:54.575Z*
