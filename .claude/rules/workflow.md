# 工作流规则

## 开发流程

### 1. 需求阶段

```
1. 在 BACKLOG.md 登记需求
2. 状态设为 PROPOSED
3. 分析影响范围（核心目录?）
4. 确认是否需要更新文档索引
```

### 2. 规划阶段

```
1. 使用 /plan 命令创建实施计划
2. 识别风险和依赖
3. 获得确认后状态改为 IN_PROGRESS
4. 使用 /checkpoint create 创建起点
```

### 3. 实施阶段

```
1. 按计划逐步实施
2. 修改核心目录时更新 INDEX.md
3. 定期运行 /governance 检查
4. 完成阶段性里程碑时 /checkpoint create
```

### 4. 验证阶段

```
1. 运行 /verify 全面检查
2. 运行 /code-review 代码审查
3. 确保所有检查通过
4. 创建 PR 或提交
```

### 5. 收尾阶段

```
1. 更新 PROGRESS.md 记录
2. BACKLOG 状态改为 DONE
3. 提供验收证据
4. 同步更新相关索引
```

## Git 工作流

### 分支命名

```
feature/xxx - 新功能
fix/xxx     - 缺陷修复
refactor/xxx - 重构
docs/xxx    - 文档更新
```

### 提交信息

```
feat: 新功能描述
fix: 修复描述
refactor: 重构描述
docs: 文档更新描述
chore: 维护任务描述
```

### 提交前检查

```bash
# 必须执行
node scripts/check-governance.mjs

# 推荐执行
/verify pre-commit
/code-review staged
```

## 文档更新流程

### 新增文档

```
1. 创建文档文件
2. 更新 DOC_INDEX.md 添加链接
3. 如在特定目录，更新该目录 INDEX.md
4. 提交时说明新增文档
```

### 修改核心文档

```
1. 确认是追加操作
2. 准备变更证据/来源
3. 在 BACKLOG 登记
4. 修改后更新 PROGRESS
```

## 快捷命令速查

| 命令 | 用途 |
|------|------|
| `/plan` | 创建实施计划 |
| `/verify` | 运行验证检查 |
| `/code-review` | 代码审查 |
| `/checkpoint` | 创建/验证检查点 |
| `/learn` | 提取可复用模式 |
| `/kpi` | 计算 KPI 指标 |
| `/weekly-report` | 生成周报 PPT |
| `/governance` | 运行治理检查 |

## 会话最佳实践

1. **开始时**: 查看 BACKLOG 了解当前任务
2. **实施中**: 使用 TodoWrite 追踪进度
3. **完成时**: 更新 PROGRESS 和相关索引
4. **学到东西时**: 使用 /learn 保存模式
