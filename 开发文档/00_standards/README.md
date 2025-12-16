---
id: standards_index
title: 知识库规范与模板索引
author: AI_Refactor
status: stable
type: standard
domain: tech
tags:
  - standard
  - documentation
  - templates
created_at: '2025-12-16'
updated_at: '2025-12-16'
---

# 知识库规范与模板索引

> **目的**: 统一文档标准,提升AI协作效率,建立可复用的知识资产

## 📚 核心规范文档

### [conventions.md](./conventions.md) - 协作约定
**最高准则**: 代码是唯一事实 (Code is the Single Source of Truth)

核心内容:
- 🔑 三大核心原则(代码优先、原子化文档、可追溯性)
- 📊 功能状态定义
- 📝 文档规范
- ✅ 代码质量修复准则
- 📊 可视化全局规范(排序统一规则)
- 🔄 工作流程

**适用场景**: 所有开发人员和AI协作必读

### [ai_knowledge_methodology.md](./ai_knowledge_methodology.md) - AI协作方法论
AI友好型知识管理体系的核心理念与实践模式。

核心内容:
- 灵魂: 知识即代码、AI原生上下文
- 规律: 唯一标识律、显式关联律、自描述律
- 原理与模式: 自动化守卫、渐进式增强、结构化索引
- 新项目启动清单

**适用场景**: 新项目启动、知识库设计、AI协作优化

### [doc_meta_standard.md](./doc_meta_standard.md) - 文档元数据规范
支持AI渐进式掌握项目上下文的标准化YAML Frontmatter规范。

核心字段:
- **必填**: id, title, author, status, domain, tags, updated_at
- **强烈推荐**: related_code (代码关联)
- **可选**: complexity, version, dependencies

**适用场景**: 所有新建或更新的Markdown文档

## 📋 文档模板

### [templates/feature_template.md](./templates/feature_template.md)
功能卡片标准模板,用于01_features目录。

包含章节:
- 功能概述
- 核心能力清单
- 实现文件列表
- 相关决策链接
- 测试覆盖情况
- 已知问题和技术债务

### [templates/adr_template.md](./templates/adr_template.md)
架构决策记录(ADR)标准模板,用于02_decisions目录。

包含章节:
- 上下文(Context)
- 决策(Decision)
- 理由(Rationale)
- 替代方案(Alternatives)
- 后果(Consequences)
- 代码证据(Code Evidence)

### [templates/technical_design_template.md](./templates/technical_design_template.md)
技术设计文档标准模板,用于03_technical_design目录。

包含章节:
- 设计目标
- 架构概览
- 关键组件
- 数据流和数据模型
- 技术选型
- 实现细节
- 测试策略

## 🎯 使用指南

### 新建功能文档

```bash
# 1. 复制模板
cp 开发文档/00_standards/templates/feature_template.md \
   开发文档/01_features/F{序号}_{功能ID}/README.md

# 2. 填写内容
# 3. 更新元数据(id, status, tags, related_code等)
# 4. 运行文档索引生成
pnpm docs:index
```

### 新建ADR文档

```bash
# 1. 复制模板
cp 开发文档/00_standards/templates/adr_template.md \
   开发文档/02_decisions/ADR-{序号}_{简短描述}.md

# 2. 填写决策内容
# 3. 更新状态(proposed -> accepted)
# 4. 在相关功能卡片中引用此ADR
```

### 新建技术设计文档

```bash
# 1. 复制模板
cp 开发文档/00_standards/templates/technical_design_template.md \
   开发文档/03_technical_design/{设计名称}.md

# 2. 填写设计内容
# 3. 关联代码文件(related_code字段)
# 4. 更新相关决策链接
```

## 🔄 维护流程

### 文档生命周期

```
draft (草稿)
  ↓
review (审查中)
  ↓
stable (稳定) ← 可信赖的单一事实源
  ↓
deprecated (废弃) → 不要删除,保留历史上下文
```

### 代码与文档同步

当代码发生变更时:

1. ✅ 更新 `related_code` 字段中的文件路径
2. ✅ 更新 `updated_at` 字段
3. ✅ 如果影响功能状态,更新功能卡片的 `status` 和 `completeness`
4. ✅ 运行 `node scripts/analyze-codebase.js` 验证一致性
5. ✅ 运行 `pnpm docs:index` 更新知识库索引

## 🛠️ 自动化工具

### 代码分析工具
```bash
node scripts/analyze-codebase.js
```
生成功能完整度报告,识别文档与代码差异。

### 文档索引生成
```bash
pnpm docs:index
```
自动生成 [KNOWLEDGE_INDEX.md](../KNOWLEDGE_INDEX.md),包含:
- 📊 知识库概览统计
- 🔥 最近30天更新的文档
- 🏷️ 标签索引
- 🔗 文档依赖关系图

### 归档清理工具
```bash
# 分析归档文档
pnpm docs:archive:analyze

# 交互式清理
pnpm docs:archive:clean

# 自动清理预览
pnpm docs:archive:auto-clean
```

## 📖 最佳实践

### ✅ DO (推荐做法)

1. **新建文档使用模板** - 确保结构一致性
2. **填写完整元数据** - 特别是 `related_code` 字段
3. **代码变更同步文档** - 保持文档与代码一致
4. **定期运行分析工具** - 每周至少一次
5. **使用标签提高可发现性** - 至少添加2-3个相关标签
6. **建立文档间链接** - 在 `dependencies` 字段中声明依赖关系

### ❌ DON'T (避免做法)

1. **不要删除废弃文档** - 改为标记 `status: deprecated`
2. **不要基于记忆判断状态** - 使用分析工具验证
3. **不要创建孤岛文档** - 必须与代码或其他文档关联
4. **不要保留过时信息** - 及时更新或归档
5. **不要跳过元数据** - AI依赖元数据构建上下文

## 🔗 相关资源

- [项目总览](../README.md) - 动态仪表盘
- [知识库索引](../KNOWLEDGE_INDEX.md) - 自动生成的完整导航
- [功能清单](../01_features/) - 所有功能模块
- [技术决策](../02_decisions/) - ADR记录
- [技术设计](../03_technical_design/) - 架构设计文档

## 📞 问题与反馈

如果发现文档规范问题或有改进建议:

1. 运行分析工具确认问题
2. 在 [开发记录表](../logs/开发记录表.md) 中记录
3. 提出改进建议

---

**版本**: v1.0.0
**最后更新**: 2025-12-16
**维护者**: 开发团队
