---
---
name: git-sync-checker-enhanced
description: 智能检查本地代码与远程仓库的同步状态，支持多分支、多仓库、批量检查，提供AI驱动的冲突预测和智能建议。当用户提到'检查同步状态'、'Git同步'、'推送代码'、'pull代码'、'下班前检查'、'准备下班'、'拉取最新代码'、'批量检查仓库'、'git status'、'冲突预测'、'gitignore优化'或需要Git状态分析时自动使用此技能。
allowed-tools: Bash, Read, Grep
---
# Instructions

## 核心职责

本技能是增强版的 Git 同步状态检查工具，提供智能分析和情境感知的操作建议。

**核心功能**：

- ✅ 自动检测分支和远程仓库配置
- ✅ 支持单个或批量检查多个仓库
- ✅ AI 驱动的冲突预测和风险评估
- ✅ 智能 .gitignore 检查和优化建议
- ✅ 项目类型感知的个性化建议
- ✅ 生成详细的同步报告（支持多种格式）
- ❌ 不自动执行危险操作（需用户确认）

## 可用工具脚本

本技能包含三个辅助脚本，可在需要时调用：

1. **batch-checker.sh** - 批量检查多个仓库

   ```bash
   bash batch-checker.sh /path/to/projects
   ```
2. **conflict-predictor.sh** - 运行冲突预测算法

   ```bash
   bash conflict-predictor.sh
   ```
3. **gitignore-checker.sh** - 检查和优化 .gitignore

   ```bash
   bash gitignore-checker.sh
   ```

## 执行流程

### 阶段 1：环境检测与配置识别

#### 1.1 检测仓库信息

```bash
# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)

# 获取远程仓库名称
REMOTE_NAME=$(git remote | head -n 1)

# 获取远程 URL
git remote -v

# 检测上游分支
git rev-parse --abbrev-ref @{upstream} 2>/dev/null
```

**识别内容**：

- 当前分支名
- 远程仓库名（origin/upstream/其他）
- 是否有上游分支配置
- 远程仓库类型（GitHub/GitLab/Bitbucket/自建）

#### 1.2 检测项目类型

```bash
# 检查项目配置文件
ls -la | grep -E "package.json|requirements.txt|go.mod|Cargo.toml|pom.xml|build.gradle"

# 检查框架标识
[ -f "package.json" ] && cat package.json | grep -E "react|vue|angular|next|nuxt"
```

**识别项目类型**：

- 前端（React/Vue/Angular）
- 后端（Node/Python/Go/Java）
- 全栈（Next.js/Nuxt）
- 移动端（React Native/Flutter）

### 阶段 2：状态检查与分析

#### 2.1 工作区状态

```bash
# 详细状态
git status --porcelain

# 未跟踪文件
git ls-files --others --exclude-standard

# 已修改但未暂存
git diff --name-only

# 已暂存但未提交
git diff --cached --name-only
```

#### 2.2 本地与远程对比

```bash
# 获取远程更新（不拉取代码）
git fetch $REMOTE_NAME

# 本地领先的提交
git log $REMOTE_NAME/$CURRENT_BRANCH..$CURRENT_BRANCH --oneline

# 远程领先的提交
git log $CURRENT_BRANCH..$REMOTE_NAME/$CURRENT_BRANCH --oneline

# 检查分叉
git rev-list --left-right --count $CURRENT_BRANCH...$REMOTE_NAME/$CURRENT_BRANCH
```

#### 2.3 智能冲突预测

使用 `conflict-predictor.sh` 脚本或执行以下命令：

```bash
# 获取本地和远程修改的文件列表
LOCAL_FILES=$(git diff --name-only $REMOTE_NAME/$CURRENT_BRANCH..$CURRENT_BRANCH)
REMOTE_FILES=$(git diff --name-only $CURRENT_BRANCH..$REMOTE_NAME/$CURRENT_BRANCH)

# 找出可能冲突的文件（两边都修改了）
echo "$LOCAL_FILES" | sort > /tmp/local_files
echo "$REMOTE_FILES" | sort > /tmp/remote_files
comm -12 /tmp/local_files /tmp/remote_files
```

**冲突风险评级**：

- 🟢 低风险：无共同修改文件
- 🟡 中风险：1-3 个共同修改文件
- 🔴 高风险：>3 个共同修改文件或关键文件冲突

### 阶段 3：.gitignore 检查

使用 `gitignore-checker.sh` 脚本或执行：

```bash
# 检查是否有不该提交的文件
git status --porcelain | grep -E "\.env|\.key|\.pem|node_modules|\.DS_Store|\.vscode"
```

根据项目类型推荐 .gitignore 规则（详见 reference.md）。

### 阶段 4：批量检查支持

使用 `batch-checker.sh` 脚本批量检查多个仓库：

```bash
# 扫描指定目录下的所有 Git 仓库
bash batch-checker.sh ~/projects
```

**批量检查输出示例**：

```
📦 批量检查结果 (3 个仓库)

✅ project-a: 已同步
⚠️ project-b: 2 个未推送提交
🔴 project-c: 有未提交修改 + 远程领先
```

### 阶段 5：智能报告生成

#### 标准报告格式

```markdown
# Git 同步状态报告
生成时间: 2025-11-17 14:30:00

## 📊 基本信息
- 仓库: my-project
- 分支: feature/new-feature
- 远程: origin (github.com)
- 项目类型: React 前端项目

## 🔍 状态概览
- 工作区: 3 个文件有修改
- 暂存区: 1 个文件已暂存
- 本地提交: 2 个未推送
- 远程更新: 0 个未拉取

## ⚠️ 风险评估
- 冲突风险: 🟢 低风险
- 敏感文件: ⚠️ 发现 .env 文件未忽略

## 💡 操作建议
1. 添加 .env 到 .gitignore
2. 提交当前修改
3. 推送到远程

## 📝 详细命令
\`\`\`bash
echo ".env" >> .gitignore
git add .gitignore src/
git commit -m "feat: 完成新功能"
git push origin feature/new-feature
\`\`\`
```

#### 简洁模式（适合快速查看）

```
✅ main | ↑2 | 干净
⚠️ feature | ↑1 ↓3 | 2 个修改
🔴 hotfix | ↑0 ↓1 | 有冲突
```

### 阶段 6：情境感知建议

#### 时间感知

根据当前时间提供不同优先级建议：

- **下班前（17:00-19:00）**：优先检查"推送代码"、"清理工作区"
- **上班后（9:00-11:00）**：优先检查"拉取更新"、"检查依赖"
- **其他时间**：常规检查

#### 项目类型感知

**前端项目**：

- 检查 node_modules 是否被忽略
- 提醒运行 `npm install` 或 `pnpm install`
- 建议检查 package-lock.json 冲突

**后端项目**：

- 检查虚拟环境是否被忽略
- 提醒运行数据库迁移
- 建议检查 API 版本兼容性

**全栈项目**：

- 检查前后端同步状态
- 提醒环境变量配置
- 建议测试端到端功能

## 使用场景快速参考

| 场景            | 触发词示例                 | 重点检查               |
| --------------- | -------------------------- | ---------------------- |
| 下班前检查      | "准备下班"、"检查同步"     | 所有修改已提交、已推送 |
| 上班后检查      | "开始工作"、"拉取最新代码" | 拉取远程更新、检查依赖 |
| 批量检查        | "检查所有项目"             | 多仓库状态概览         |
| 冲突预测        | "会有冲突吗"               | 分析共同修改文件       |
| .gitignore 优化 | "检查 gitignore"           | 敏感文件、项目规则     |

## 安全限制与边界

### 安全限制

- ❌ 永不执行强制推送（`--force`）
- ❌ 永不修改已推送的提交历史
- ❌ 永不自动删除分支
- ⚠️ 危险操作必须明确警告

### 功能边界

- ✅ 只检查和建议，不自动执行修改操作
- ✅ 所有 Git 命令需用户手动确认
- ✅ 冲突解决提供方案，不自动处理
- ✅ 敏感信息检测后立即警告

### 性能考虑

- 批量检查时限制仓库数量（建议 ≤20）
- 大仓库检查时显示进度
- 超时保护（单个仓库检查 <30 秒）

## 报告格式选项

用户可以指定报告格式：

```
# 默认格式（带颜色的终端输出）
检查同步状态

# Markdown 报告
检查同步状态，生成 markdown 报告

# JSON 格式（供脚本使用）
检查同步状态，输出 json

# HTML 报告（可在浏览器查看）
检查同步状态，生成 html 报告
```

## 参考文档

- **examples.md** - 6个详细使用场景示例
- **reference.md** - 高级功能、算法详解和完整 .gitignore 规则
- **DEPLOYMENT.md** - 部署和安装指南
- **CHANGELOG.md** - 版本历史

## 快速示例

### 示例 1：基本检查

**用户输入**：检查同步状态

**执行**：

1. 检测当前分支和远程仓库
2. 对比本地与远程提交
3. 生成状态报告
4. 提供操作建议

### 示例 2：冲突预测

**用户输入**：我要合并最新代码，会有冲突吗？

**执行**：

1. 运行 `conflict-predictor.sh`
2. 分析共同修改文件
3. 计算冲突风险评分
4. 提供安全合并步骤

### 示例 3：批量检查

**用户输入**：检查 ~/projects 下所有仓库

**执行**：

1. 运行 `batch-checker.sh ~/projects`
2. 扫描所有 Git 仓库
3. 生成批量报告
4. 突出显示需要处理的项目

完整示例请参考 examples.md 文件。

---
