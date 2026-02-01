# 项目护栏规则

## 核心业务文档保护 (严重)

以下文档**仅可追加且需证据**，禁止修改已有内容:

- `开发文档/03_technical_design/core_calculations.md` - 核心计算公式
- `开发文档/03_technical_design/data_architecture.md` - 数据架构定义

### 允许的操作

- ✅ 追加新的计算公式（需提供证据/来源）
- ✅ 追加新的数据字段定义（需提供证据）
- ✅ 修正明显的文档错误（需说明原因）

### 禁止的操作

- ❌ 修改已有的 KPI 计算公式
- ❌ 修改数据字段的业务含义
- ❌ 删除已有的业务定义

## 核心目录变更 (高)

修改以下目录需先登记 BACKLOG:

```
src/domain/      - 业务领域层
src/application/ - 应用层
src/app/         - 应用入口
```

### 变更流程

1. 在 BACKLOG.md 登记变更需求
2. 状态设为 PROPOSED 或 TRIAGED
3. 更新对应目录的 INDEX.md
4. 完成后状态改为 DONE 并提供验收证据

## 状态机规则 (高)

BACKLOG 中的任务状态必须遵循:

```
PROPOSED → TRIAGED → IN_PROGRESS → DONE
                 ↘
                  BLOCKED → 解除后继续
                 ↘
                  DEPRECATED (废弃)
```

### 状态定义

- **PROPOSED**: 已提出，待评审
- **TRIAGED**: 已分类，待排期
- **IN_PROGRESS**: 进行中
- **BLOCKED**: 被阻塞，需等待依赖
- **DONE**: 已完成，必须有验收证据
- **DEPRECATED**: 已废弃，需说明原因

## 文档同步规则 (中)

### 必须同步的情况

1. 新增文档 → 更新 DOC_INDEX.md
2. 新增代码文件 → 更新 CODE_INDEX.md
3. 任务状态变更 → 更新 PROGRESS.md
4. 目录结构变更 → 更新对应 INDEX.md

### 检查命令

```bash
node scripts/check-governance.mjs
```

## 数据安全规则 (严重)

- ❌ 禁止提交敏感数据 (.env, 凭据, API 密钥)
- ❌ 禁止提交原始业务数据 (Excel, CSV 源文件)
- ✅ 使用环境变量管理配置
- ✅ 使用 .gitignore 排除敏感文件

## 代码质量规则 (中)

### 提交前检查

- [ ] 运行 `node scripts/check-governance.mjs`
- [ ] 确保无 console.log 语句
- [ ] 确保代码格式化
- [ ] 确保类型检查通过（如适用）

### 避免的模式

- ❌ 硬编码配置值
- ❌ 过深的嵌套（>4层）
- ❌ 过长的函数（>50行）
- ❌ 过大的文件（>800行）
