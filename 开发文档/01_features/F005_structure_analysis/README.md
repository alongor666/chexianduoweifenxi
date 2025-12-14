---
id: 01_features_f005_structure_analysis_readme
title: 结构分析与对比模块
author: AI_Refactor
status: stable
type: feature
domain: product
tags:
- feature
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 结构分析与对比模块

> **状态**: ✅ stable
> **优先级**: P0
> **完整度**: 100%
> **版本**: v3.1.0
> **最后验证**: 2025-10-20

## 功能概述

提供按业务类型维度展示的完整盈利能力诊断体系，是整个仪表盘分析逻辑的顶峰。它超越了对收入和成本的孤立考察，直击业务的最终核心——**“我们到底赚不赚钱？每笔业务的盈利质量如何？”**

## 核心能力

通过四张分析卡片，构建了一个从“利润率”到“利润额”、再到“单位利润质量”的完整诊断体系。

- ✅ **满期边贡率 (盈利能力结果)**: 衡量最终的盈利空间，是衡量盈利能力最重要的结果指标。
- ✅ **变动成本率 (成本控制能力)**: 诊断成本控制能力，作为“边贡率”的直接补充，展示成本端的整体表现。
- ✅ **满期边贡额 (利润绝对值)**: 定位利润的绝对值贡献，在了解“利润率”后，进一步审视“利润额”的绝对贡献来源。
- ✅ **单均边贡额 (盈利质量)**: 诊断业务的“盈利质量”，回答“增长是否高质量”这一深刻问题。

## 实现文件

- ✅ [`src/hooks/use-marginal-contribution-analysis.ts`](../../../src/hooks/use-marginal-contribution-analysis.ts) (核心分析逻辑)
- ✅ [`src/components/features/marginal-contribution/margin-ratio-grid-card.tsx`](../../../src/components/features/marginal-contribution/margin-ratio-grid-card.tsx) (比率卡片)
- ✅ [`src/components/features/marginal-contribution/margin-amount-grid-card.tsx`](../../../src/components/features/marginal-contribution/margin-amount-grid-card.tsx) (金额卡片)

## 相关文档

- [边贡分析模块改造测试记录.md](../../archive/边贡分析模块改造测试记录.md)
- [核心指标计算引擎 V2.0](../../03_technical_design/core_calculations.md)

## 测试覆盖

- ✅ **100% 通过**: 所有边贡分析维度的计算和展示均已通过详细测试。
- [测试记录-2025-10-20-最终.md](../../archive/测试记录-2025-10-20-最终.md)

## 技术栈

---

_本文档基于代码分析自动生成_
_生成时间: 2025-10-20T16:03:18.876Z_
