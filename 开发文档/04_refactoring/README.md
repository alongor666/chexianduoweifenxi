---
id: 04_refactoring_readme
title: 重构文档目录
author: AI_Refactor
status: stable
type: refactoring
domain: product
tags:
- refactoring
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 重构文档目录

> **重构项目**：Clean Architecture + FSD 架构重构
> **时间**：2025-01-13 开始
> **状态**：进行中（第 1 周 / 共 3 周）

---

## 📚 文档索引

### 1. 架构设计文档

#### [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md) ⭐⭐⭐⭐⭐

**必读 - 架构规则体系**

这是整个重构项目的核心文档，定义了项目的架构原则和规则。

**包含内容**：

- 底层规律（依赖方向、单一职责、关注点分离）
- 架构原则（DRY、YAGNI、KISS）
- 分层规则（Clean Architecture + FSD）
- 阶段规则（按项目规模）
- 检查清单（可执行）
- AI 协作约定

**何时阅读**：

- 开始任何重构任务前
- 需要做架构决策时
- Code Review 时
- 遇到架构疑问时

---

#### [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) ⭐⭐⭐⭐

**重构详细计划**

3 周详细路线图，包含每天的具体任务和代码示例。

**包含内容**：

- 现状分析（当前痛点和违反的规则）
- 重构目标（目标架构和质量指标）
- 3 周路线图（每天的具体任务）
- 代码示例（每个阶段的参考代码）
- 验证方法（自动化检查和手动检查）

**何时阅读**：

- 了解当前进度
- 规划下一步工作
- 需要参考代码示例时

---

#### [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) ⭐⭐⭐⭐

**重构检查清单**

提交代码前的 9 层详细检查项和自动化脚本。

**包含内容**：

- 提交前检查清单（9 层检查）
- 自动化检查脚本
- 常见问题和解决方案

**何时使用**：

- 提交代码前（必须）
- Code Review 时
- CI/CD 流程中

---

#### [AI_COLLABORATION.md](./AI_COLLABORATION.md) ⭐⭐⭐⭐

**AI 协作约定**

如何让 AI 助手遵守架构规则，包含标准提示词和自检机制。

**包含内容**：

- 架构上下文注入
- 代码生成约定
- 重构指导约定
- 标准提示词模板

**何时阅读**：

- 使用 AI 辅助开发时
- 需要 AI 生成代码时
- 需要 AI 进行重构时

---

## ✨ 实用指南（导航 / 维护 / 索引）

- **快速导航**：优先通过 `开发文档/KNOWLEDGE_INDEX.md` 跳转；本目录内核心入口依次为 `ARCHITECTURE_RULES.md` → `REFACTORING_PLAN.md` → `REFACTORING_CHECKLIST.md`。
- **文档维护规范**：修改代码涉及架构/数据/流程时，必须同步更新对应技术设计/重构文档；所有注释与文档保持中文；新增能力需补充到知识库索引。
- **索引更新命令**：`pnpm docs:index`（等同 `python3 scripts/generate_docs_index.py 开发文档`）；在合并前或发布前必跑一次，保持索引最新。
- **流程建议**：开始任务前看规则与计划，结束前跑测试 + 更新文档 + 生成索引；在 AGENT 提示或流程文档中引用索引路径，便于导航。

---

### 2. 实现总结文档

#### [APPLICATION_LAYER_SUMMARY.md](./APPLICATION_LAYER_SUMMARY.md) ⭐⭐⭐⭐

**Application 层实现总结** ✅ 已完成

Day 3-4 的 Application 层实现详细总结。

**包含内容**：

- 实现内容（Ports、Use Cases、Services）
- 单元测试（22 个测试全部通过）
- 架构规则验证结果
- 设计亮点和最佳实践
- 目录结构
- 下一步工作

**何时阅读**：

- 了解 Application 层设计
- 实现 Infrastructure 层前
- 需要参考实现模式时

---

## 📋 重构进度

### ✅ 已完成

- **阶段 0：准备工作** (2025-01-13)
  - 架构规则文档
  - 重构计划
  - 检查清单
  - AI 协作约定

- **Day 1-2：Domain 层** (2025-01-14)
  - 保险实体 `InsuranceRecord`
  - 业务规则（KPI 计算、数据规范化）
  - 单元测试

- **Day 3-4：Application 层** (2025-11-14) ⭐ 刚完成
  - 3 个端口接口
  - 3 个用例
  - 1 个应用服务
  - 22 个单元测试
  - 架构验证

### 🔄 进行中

- **Day 6-7：Infrastructure 层**（下一步）
  - DuckDBRepository
  - CSVParser
  - PDFExporter

### 📅 待完成

详见 [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

---

## 🎯 快速开始

### 1. 开始新任务前

```markdown
1. 阅读 [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)
2. 查看 [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) 了解当前任务
3. 参考已完成的实现（如 APPLICATION_LAYER_SUMMARY.md）
```

### 2. 编写代码时

```markdown
1. 遵循 [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md) 的规则
2. 参考 [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) 的代码示例
3. 使用 [AI_COLLABORATION.md](./AI_COLLABORATION.md) 的提示词模板
```

### 3. 提交代码前

```markdown
1. 运行 [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) 的检查脚本
2. 手动检查清单中的所有项
3. 确保所有测试通过
```

---

## 🔗 相关文档

- **项目状态**：[PROJECT_STATUS.md](../../PROJECT_STATUS.md)
- **技术设计**：[开发文档/03_technical_design/](../03_technical_design/)
- **功能文档**：[开发文档/01_features/](../01_features/)
- **决策记录**：[开发文档/02_decisions/](../02_decisions/)

---

## 📞 联系方式

**项目负责人**：开发者本人
**重构分支**：`refactor/clean-architecture`

---

**最后更新**：2025-11-14 by Claude
