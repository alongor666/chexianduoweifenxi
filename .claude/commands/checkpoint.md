---
description: 创建或验证工作流检查点
---

# 检查点命令 (/checkpoint)

创建或验证工作流中的检查点，用于追踪和回溯。

## 用法

`/checkpoint [create|verify|list] [name]`

## 创建检查点

创建检查点时:

1. 运行 `/verify quick` 确保当前状态干净
2. 创建包含检查点名称的 git stash 或 commit
3. 记录检查点到 `.claude/checkpoints.log`:

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. 报告检查点已创建

## 验证检查点

验证时对比检查点:

1. 从日志读取检查点
2. 比较当前状态与检查点:
   - 自检查点以来添加的文件
   - 自检查点以来修改的文件
   - 验证通过率对比

3. 报告:
```
检查点对比: $NAME
===================
文件变更: X
新增文件: Y
修改文件: Z
治理检查: [通过/失败]
```

## 列出检查点

显示所有检查点:
- 名称
- 时间戳
- Git SHA
- 状态 (当前/落后/领先)

## 典型工作流

```
[开始] --> /checkpoint create "feature-start"
   |
[实现] --> /checkpoint create "core-done"
   |
[测试] --> /checkpoint verify "core-done"
   |
[重构] --> /checkpoint create "refactor-done"
   |
[PR] --> /checkpoint verify "feature-start"
```

## 参数

$ARGUMENTS:
- `create <name>` - 创建命名检查点
- `verify <name>` - 验证命名检查点
- `list` - 显示所有检查点
- `clear` - 移除旧检查点 (保留最近 5 个)

## 与 BACKLOG 集成

检查点可以对应 BACKLOG 中的任务状态:
- `feature-start` → IN_PROGRESS
- `core-done` → 核心功能完成
- `final` → DONE (待验收)
