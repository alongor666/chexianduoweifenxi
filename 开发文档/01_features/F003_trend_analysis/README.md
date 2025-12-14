---
id: 01_features_f003_trend_analysis_readme
title: 趋势分析图表模块
author: AI_Refactor
status: draft
type: feature
domain: product
tags:
- feature
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 趋势分析图表模块

> **状态**: ✅ beta  
> **优先级**: P0  
> **完整度**: 95%  
> **版本**: v2.0.0  
> **最后验证**: 2025-10-21

## 功能概述

提供“顶级数据分析师”级别的周度趋势洞察：单视图融合签单/满期保费体量、赔付率波动、异常点识别与趋势线推演。新增的指标看板、风险区域提示和智能洞察标签，可帮助业务、精算与运营团队在秒级定位问题周次和趋势拐点。

## 核心能力

- ✅ **多层视图融合**: 复合图表同时呈现签单/满期保费面积、赔付率折线、平均基线与风险区间。
- ✅ **智能指标看板**: 最新周关键指标卡片内置环比/同比双维对比，并根据指标正逆属性自动着色。
- ✅ **专家级 Tooltip**: 自定义提示窗汇总趋势线、异常评分、4 周滑动平均与环比增幅，满足深度复盘。
- ✅ **洞察提示胶囊**: 动态生成峰值、风险周次、异常波动等洞察标签，指引进一步分析。
- ✅ **高级交互控制**: 图例显隐高亮、Brush 区间联动筛选、异常检测算法与趋势拟合方法实时切换。
- ✅ **灵活周次模式**: 顶部时间筛选支持单周与多周即时切换，保留多周批量操作以便对比趋势。

## 实现文件

- ✅ [`src/components/features/trend-chart.tsx`](../../../src/components/features/trend-chart.tsx)
- ✅ [`src/lib/analytics/anomaly-detection.ts`](../../../src/lib/analytics/anomaly-detection.ts)
- ✅ [`src/lib/analytics/trend-fitting.ts`](../../../src/lib/analytics/trend-fitting.ts)
- ✅ [`src/hooks/use-trend.ts`](../../../src/hooks/use-trend.ts)

## 相关决策

- [ADR-004](../../02_decisions/ADR-004.md)

## 测试覆盖

- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试

## 技术栈

- **图表库**: Recharts 3.x（`ComposedChart`, `Area`, `ReferenceArea`）
- **算法**: Z-Score, IQR, MAD, Linear Regression, Moving Average, Exponential Smoothing

---

_本文档基于代码分析自动生成_  
_生成时间: 2025-10-21T00:00:00.000Z_
