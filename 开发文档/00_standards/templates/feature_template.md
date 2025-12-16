---
id: F{序号}_{功能ID}
title: {功能名称}
author: {作者名}
status: draft
type: feature
domain: {业务域}
tags:
  - {标签1}
  - {标签2}
created_at: '{YYYY-MM-DD}'
updated_at: '{YYYY-MM-DD}'
---

# F{序号}: {功能名称}

> **状态**: {状态图标} {状态描述}
> **优先级**: P{0-2}
> **完整度**: {百分比}%
> **最后验证**: {日期}

## 功能概述

[1-2句话描述功能目的和核心价值]

## 核心能力

- [ ] 能力1 (状态: 待实现/开发中/已实现)
- [ ] 能力2 (状态: 待实现/开发中/已实现)
- [ ] 能力3 (状态: 待实现/开发中/已实现)

## 实现文件

**核心组件**:
- `src/components/xxx.tsx` - 组件描述
- `src/hooks/use-xxx.ts` - Hook描述

**业务逻辑**:
- `src/domain/rules/xxx.ts` - 领域规则描述

**工具函数**:
- `src/lib/utils/xxx.ts` - 工具函数描述

## 相关决策

- [ADR-001](../../02_decisions/ADR-001_xxx.md) - 决策标题

## 数据结构

```typescript
// 关键类型定义
interface XxxData {
  // ...
}
```

## 测试覆盖

- [ ] 单元测试: `src/__tests__/xxx.test.ts`
- [ ] 集成测试: {测试场景}
- [ ] E2E测试: {测试场景}

## 已知问题

- [ISSUE-001](../../archive/问题记录表.md#issue-001) - 问题描述

## 技术债务

- [ ] 技术债务项1
- [ ] 技术债务项2

## 使用示例

```typescript
// 代码使用示例
```

## 参考资料

- [相关文档链接]
