# 结构分析与对比模块

> **状态**: 🚧 partial
> **优先级**: P1
> **完整度**: 70%
> **版本**: v1.2.0
> **最后验证**: 2025-12-13

## 功能概述

提供机构对比、险种结构、客户分群和费用热力图等多维度分析

## 核心能力

- ✅ **机构对比**: Top10机构表格+柱状图
- ✅ **险种结构**: 饼图+详细卡片
- ✅ **结构柱状图**: 机构/产品Top排序
- ✅ **分布饼图**: 客户/渠道占比
- ✅ **客户分群气泡图**: 单均保费×赔付率×保单数
- ✅ **费用热力图**: 13机构×3指标热力矩阵

## 实现文件

### 核心文件 (4/4)

- ✅ [`src/components/features/comparison-analysis.tsx`](../../../src/components/features/comparison-analysis.tsx)
- ✅ [`src/components/features/structure-bar-chart.tsx`](../../../src/components/features/structure-bar-chart.tsx)
- ✅ [`src/components/features/distribution-pie-chart.tsx`](../../../src/components/features/distribution-pie-chart.tsx)
- ✅ [`src/components/features/thematic-analysis.tsx`](../../../src/components/features/thematic-analysis.tsx)

### 增强功能

- ⏳ bubble_chart
- ⏳ heatmap

## 相关决策

- [ADR-004](../../02_decisions/ADR-004.md)

## 测试覆盖

- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试

## 技术栈


---

*本文档基于代码分析自动生成*
*生成时间: 2025-12-13T11:45:54.575Z*
