---
id: 01_features_f001_data_import_readme
title: 数据上传与解析模块
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

# 数据上传与解析模块

> **状态**: ✅ stable
> **优先级**: P0
> **完整度**: 98%
> **版本**: v2.3.0
> **最后验证**: 2025-10-20

## 功能概述

提供CSV文件上传、解析、验证和预处理能力，确保数据严格符合26个字段的规范，支持批量导入和智能纠错。

## 核心能力

- ✅ **文件上传**: 支持拖拽和点击上传，最大200MB。
- ✅ **多批次追加上传**: 在分析页面通过顶部工具栏「继续上传」按钮唤起弹窗，无需清空即可追加周次数据并自动去重。
- ✅ **CSV流式解析**: 使用Papa Parse分块处理，避免内存溢出。
- ✅ **严格数据验证**: 内置于解析器，对26个字段的**结构、顺序、类型和枚举值**进行严格验证。
- ✅ **智能纠错**: 对已知的枚举值变体进行模糊匹配和自动修正。
- ✅ **错误详情展示**: 提供友好的错误列表和修复建议。
- ✅ **批量导入并行处理**: UI 支持 2~3 路并行上传，队列调度确保进度与错误反馈不丢失（indicator: batch_upload）。

## 实现文件

### 核心文件 (3/3)

- ✅ [`src/components/features/file-upload.tsx`](../../../src/components/features/file-upload.tsx)
- ✅ [`src/lib/parsers/csv-parser.ts`](../../../src/lib/parsers/csv-parser.ts) (内置验证逻辑)
- ✅ [`src/hooks/use-file-upload.ts`](../../../src/hooks/use-file-upload.ts)

### 增强功能

- ✅ fuzzy_match
- ✅ batch_upload（并行调度 + 队列回放进度）
- ✅ error_handling

## 相关决策

- [ADR-002: CSV解析策略-流式处理](../../02_decisions/ADR-002_CSV解析策略-流式处理.md)

## 相关文档

- [CSV导入规范](../../archive/CSV导入规范.md)

## 测试覆盖

- ✅ **单元/集成测试**: 见 `archive` 目录下的各类测试记录。
- [测试记录-2025-10-20-最终.md](../../archive/测试记录-2025-10-20-最终.md)

## 技术栈

- **CSV解析**: Papa Parse 5.x
- **数据验证**: Zod 4.x
- **模糊匹配**: Levenshtein距离算法

---

_本文档基于代码分析自动生成_
_生成时间: 2025-10-20T16:03:18.875Z_
