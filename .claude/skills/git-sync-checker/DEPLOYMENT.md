# Git Sync Checker Enhanced - 部署指南

## 快速部署

### 1. 作为 Claude Code Skill 使用

#### 个人 Skill 安装（推荐）

适合个人在所有项目中使用此技能：

```bash
# 方法 A：直接克隆到 skills 目录
git clone https://github.com/alongor666/git-sync-checker-enhanced.git \
    ~/.claude/skills/git-sync-checker-enhanced

# 方法 B：如果已下载，复制整个目录
cp -r /path/to/git-sync-checker-enhanced ~/.claude/skills/

# 验证安装
ls -la ~/.claude/skills/git-sync-checker-enhanced/
```

**文件结构验证**：
```
~/.claude/skills/git-sync-checker-enhanced/
├── SKILL.md              # ✅ 必需
├── examples.md           # ✅ 建议
├── reference.md          # ✅ 建议
├── README.md
├── batch-checker.sh      # ✅ 脚本工具
├── conflict-predictor.sh # ✅ 脚本工具
└── gitignore-checker.sh  # ✅ 脚本工具
```

#### 项目 Skill 安装

适合团队项目共享此技能：

```bash
# 在项目根目录
cd /path/to/your/project

# 克隆到项目 skills 目录
git clone https://github.com/alongor666/git-sync-checker-enhanced.git \
    .claude/skills/git-sync-checker-enhanced

# 提交到版本控制
git add .claude/skills/git-sync-checker-enhanced
git commit -m "feat: 添加 Git 同步检查 Skill"
git push
```

团队成员执行 `git pull` 后会自动获得此 Skill。

#### 验证 Skill 加载

安装后，在 Claude Code 中测试触发词：

```
检查同步状态
准备下班
开始工作
检查所有项目
我要合并代码，会有冲突吗？
```

如果 Claude Code 开始执行相应操作，说明 Skill 已成功加载！

### 2. 作为命令行工具使用

将脚本添加到系统 PATH：

```bash
# 创建工具目录
mkdir -p ~/bin/git-sync-tools

# 复制脚本
cp conflict-predictor.sh ~/bin/git-sync-tools/
cp batch-checker.sh ~/bin/git-sync-tools/
cp gitignore-checker.sh ~/bin/git-sync-tools/

# 添加执行权限
chmod +x ~/bin/git-sync-tools/*.sh

# 添加到 PATH（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export PATH="$HOME/bin/git-sync-tools:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 创建别名
echo 'alias git-conflicts="conflict-predictor.sh"' >> ~/.zshrc
echo 'alias git-batch="batch-checker.sh"' >> ~/.zshrc
echo 'alias git-ignore="gitignore-checker.sh"' >> ~/.zshrc
source ~/.zshrc
```

**使用示例**：
```bash
# 冲突预测
git-conflicts

# 批量检查
git-batch ~/projects

# 检查 .gitignore
git-ignore
```

### 3. 集成到 Git Hooks

#### Pre-push Hook（推送前检查）

```bash
# .git/hooks/pre-push
#!/bin/bash

echo "🔍 推送前检查..."

# 运行冲突预测
bash ~/bin/git-sync-tools/conflict-predictor.sh

# 检查敏感文件
bash ~/bin/git-sync-tools/gitignore-checker.sh

echo ""
echo "✅ 检查完成，继续推送..."
```

```bash
# 安装脚本
cat > install-hooks.sh <<'EOF'
#!/bin/bash

# 在每个仓库中安装 hooks
for repo in ~/projects/*/.git; do
    repo_dir=$(dirname "$repo")
    echo "安装 hooks 到: $repo_dir"
    
    cp pre-push.sh "$repo_dir/.git/hooks/pre-push"
    chmod +x "$repo_dir/.git/hooks/pre-push"
done

echo "✅ Hooks 安装完成"
EOF

chmod +x install-hooks.sh
./install-hooks.sh
```

#### Post-merge Hook（合并后检查）

```bash
# .git/hooks/post-merge
#!/bin/bash

echo "🔍 合并后检查..."

# 检查依赖更新
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -q "package.json"; then
    echo "⚠️ package.json 有更新，建议运行: pnpm install"
fi

if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -q "requirements.txt"; then
    echo "⚠️ requirements.txt 有更新，建议运行: pip install -r requirements.txt"
fi
```

### 4. 集成到 VS Code

#### 创建任务配置

`.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Git: 检查同步状态",
      "type": "shell",
      "command": "bash",
      "args": ["${workspaceFolder}/scripts/conflict-predictor.sh"],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "Git: 批量检查项目",
      "type": "shell",
      "command": "bash",
      "args": [
        "${workspaceFolder}/scripts/batch-checker.sh",
        "${workspaceFolder}/..",
        "markdown"
      ],
      "presentation": {
        "reveal": "always"
      }
    },
    {
      "label": "Git: 优化 .gitignore",
      "type": "shell",
      "command": "bash",
      "args": ["${workspaceFolder}/scripts/gitignore-checker.sh"],
      "presentation": {
        "reveal": "always"
      }
    }
  ]
}
```

#### 创建快捷键

`.vscode/keybindings.json`:
```json
[
  {
    "key": "ctrl+shift+g s",
    "command": "workbench.action.tasks.runTask",
    "args": "Git: 检查同步状态"
  },
  {
    "key": "ctrl+shift+g b",
    "command": "workbench.action.tasks.runTask",
    "args": "Git: 批量检查项目"
  }
]
```

### 5. 集成到 CI/CD

#### GitHub Actions

`.github/workflows/git-sync-check.yml`:
```yaml
name: Git Sync Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  check-conflicts:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # 获取完整历史
      
      - name: 运行冲突预测
        run: |
          bash scripts/conflict-predictor.sh
      
      - name: 检查敏感文件
        run: |
          bash scripts/gitignore-checker.sh
      
      - name: 上传报告
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: sync-check-report
          path: |
            sync-report.md
            gitignore-report-*.md
```

#### GitLab CI

`.gitlab-ci.yml`:
```yaml
stages:
  - check

git-sync-check:
  stage: check
  script:
    - bash scripts/conflict-predictor.sh
    - bash scripts/gitignore-checker.sh
  artifacts:
    paths:
      - "*.md"
    expire_in: 1 week
  only:
    - merge_requests
```

## 高级配置

### 1. 自定义检查规则

创建配置文件 `.git-sync-config.json`:
```json
{
  "sensitive_patterns": [
    "\\.env$",
    "\\.key$",
    "\\.pem$",
    "id_rsa",
    "config/database\\.yml"
  ],
  "large_file_threshold": 5242880,
  "conflict_thresholds": {
    "low": 30,
    "medium": 70
  },
  "auto_fetch": true,
  "notifications": {
    "slack_webhook": "https://hooks.slack.com/...",
    "email": "dev@example.com"
  }
}
```

### 2. 多团队配置

为不同团队创建不同的配置文件：

```bash
# 前端团队
cp .git-sync-config.json .git-sync-frontend.json

# 后端团队
cp .git-sync-config.json .git-sync-backend.json

# 使用指定配置
export GIT_SYNC_CONFIG=.git-sync-frontend.json
bash conflict-predictor.sh
```

### 3. 通知集成

#### Slack 通知

```bash
#!/bin/bash
# notify-slack.sh

send_slack_notification() {
    local message=$1
    local webhook_url=$2
    
    curl -X POST "$webhook_url" \
         -H 'Content-Type: application/json' \
         -d "{\"text\":\"$message\"}"
}

# 使用示例
if [ $CONFLICT_SCORE -gt 70 ]; then
    send_slack_notification \
        "⚠️ 高风险冲突检测: $REPO_NAME ($CONFLICT_SCORE 分)" \
        "$SLACK_WEBHOOK_URL"
fi
```

#### 邮件通知

```bash
#!/bin/bash
# notify-email.sh

send_email_notification() {
    local subject=$1
    local body=$2
    local to=$3
    
    echo "$body" | mail -s "$subject" "$to"
}

# 使用示例
if [ $ERROR_COUNT -gt 0 ]; then
    send_email_notification \
        "Git 同步检查: $ERROR_COUNT 个错误" \
        "$(cat sync-report.md)" \
        "dev@example.com"
fi
```

## 性能优化

### 1. 缓存优化

```bash
# 启用 Git 文件系统缓存
git config --global core.fscache true

# 启用并行处理
git config --global fetch.parallel 8
```

### 2. 批量检查优化

```bash
# 使用并行处理
find ~/projects -name ".git" | parallel -j 4 'cd {//} && git status'

# 限制检查深度
find ~/projects -maxdepth 2 -name ".git"

# 跳过特定目录
find ~/projects -name ".git" -not -path "*/node_modules/*"
```

### 3. 大仓库优化

```bash
# 启用部分克隆
git config --global fetch.writeCommitGraph true
git config --global index.version 4

# 使用浅克隆
git clone --depth 1 <repo-url>
```

## 监控和日志

### 1. 启用详细日志

```bash
# 设置日志级别
export GIT_SYNC_LOG_LEVEL=debug

# 日志输出到文件
bash conflict-predictor.sh 2>&1 | tee git-sync.log
```

### 2. 统计分析

```bash
#!/bin/bash
# analyze-logs.sh

# 统计检查次数
grep "正在分析" git-sync.log | wc -l

# 统计冲突次数
grep "高风险" git-sync.log | wc -l

# 生成统计报告
cat > stats-report.md <<EOF
# Git Sync 统计报告

- 总检查次数: $(grep "正在分析" git-sync.log | wc -l)
- 高风险冲突: $(grep "高风险" git-sync.log | wc -l)
- 中风险冲突: $(grep "中风险" git-sync.log | wc -l)
- 平均冲突分数: $(grep "冲突分数" git-sync.log | awk '{sum+=$3} END {print sum/NR}')
EOF
```

## 故障排除

### 1. 权限问题

```bash
# 检查脚本权限
ls -la ~/bin/git-sync-tools/

# 修复权限
chmod +x ~/bin/git-sync-tools/*.sh
chmod 755 ~/bin/git-sync-tools/
```

### 2. 依赖检查

```bash
#!/bin/bash
# check-dependencies.sh

echo "检查依赖..."

# 检查 Git
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装"
    exit 1
fi

# 检查 Git 版本
GIT_VERSION=$(git --version | awk '{print $3}')
echo "✅ Git 版本: $GIT_VERSION"

# 检查其他工具
for tool in awk sed grep find; do
    if command -v $tool &> /dev/null; then
        echo "✅ $tool 已安装"
    else
        echo "❌ $tool 未安装"
    fi
done
```

### 3. 常见错误

```bash
# 错误: fatal: not a git repository
# 解决: 确保在 Git 仓库目录中运行

# 错误: remote: origin does not appear to be a git repository
# 解决: 检查远程配置
git remote -v
git remote add origin <url>

# 错误: Permission denied (publickey)
# 解决: 配置 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"
```

## 卸载

```bash
# 移除脚本
rm -rf ~/bin/git-sync-tools/

# 移除配置
sed -i '/git-sync-tools/d' ~/.zshrc

# 移除 hooks
find ~/projects -name "pre-push" -path "*/.git/hooks/*" -delete
```

## 更新

```bash
#!/bin/bash
# update.sh

echo "更新 Git Sync Checker..."

# 备份当前版本
cp -r ~/bin/git-sync-tools ~/bin/git-sync-tools.backup

# 下载最新版本
# git pull origin main

# 安装新版本
bash install.sh

echo "✅ 更新完成"
```

## 技术支持

如有问题，请：
1. 查看详细日志 (`--verbose`)
2. 运行依赖检查脚本
3. 查看 GitHub Issues
4. 联系技术支持

## 分享和发布

### 方式 1：通过 Git 仓库分享（当前方式）

这是最简单的分享方式，适合团队内部或开源项目：

#### 作为个人 Skill 分享

用户可以直接从 GitHub 安装：

```bash
# 其他用户安装
git clone https://github.com/alongor666/git-sync-checker-enhanced.git \
    ~/.claude/skills/git-sync-checker-enhanced
```

#### 作为项目 Skill 分享

将 Skill 包含在项目中：

```bash
# 项目维护者
cd your-project
git submodule add https://github.com/alongor666/git-sync-checker-enhanced.git \
    .claude/skills/git-sync-checker-enhanced

# 或者直接复制并提交
git clone https://github.com/alongor666/git-sync-checker-enhanced.git \
    .claude/skills/git-sync-checker-enhanced
rm -rf .claude/skills/git-sync-checker-enhanced/.git
git add .claude/skills/git-sync-checker-enhanced
git commit -m "feat: 添加 Git 同步检查 Skill"
git push
```

**优点**：
- ✅ 简单直接，无需额外工具
- ✅ 版本控制友好
- ✅ 团队成员自动获取更新
- ✅ 开源社区易于贡献

**缺点**：
- ⚠️ 需要手动更新
- ⚠️ 无中心化的市场发现机制

### 方式 2：通过 Claude Code 插件分享（未来）

> **注意**：目前 Claude Code 暂无官方插件市场。以下是未来可能的分发方式。

当 Claude Code 插件生态成熟后，可以：

1. **创建插件项目**：
```
my-plugin/
├── plugin.json          # 插件元数据
├── skills/
│   └── git-sync-checker-enhanced/
│       ├── SKILL.md
│       └── ...
└── README.md
```

2. **发布到插件市场**（假设未来有）：
```bash
# 未来可能的命令
claude plugin publish my-plugin
```

3. **用户安装**：
```bash
# 未来可能的命令
claude plugin install git-sync-checker-enhanced
```

### 方式 3：NPM 包分发（社区方案）

虽然不是官方方式，但可以通过 NPM 分发：

```json
// package.json
{
  "name": "@yourname/claude-skill-git-sync-checker",
  "version": "2.0.0",
  "description": "Git Sync Checker Skill for Claude Code",
  "files": [
    "SKILL.md",
    "examples.md",
    "reference.md",
    "*.sh"
  ],
  "bin": {
    "install-skill": "./install.sh"
  }
}
```

```bash
# 发布
npm publish --access public

# 用户安装
npx @yourname/claude-skill-git-sync-checker
```

### 推广 Skill

#### 在 GitHub 优化可发现性

1. **添加主题标签**：
   - `claude-code`
   - `claude-skill`
   - `git-tools`
   - `developer-tools`

2. **完善 README.md**：
   - ✅ 清晰的安装说明
   - ✅ 使用示例
   - ✅ 截图或演示视频
   - ✅ 徽章（stars, forks, license）

3. **创建发布**：
```bash
# 创建标签
git tag -a v2.0.0 -m "Release v2.0.0: 优化文档结构"
git push origin v2.0.0

# 在 GitHub 创建 Release
# 附上 CHANGELOG.md 内容
```

#### 在社区分享

1. **Claude 官方社区**（如果有）
2. **开发者论坛**：
   - Reddit (r/ClaudeAI, r/devtools)
   - Hacker News
   - Dev.to
3. **社交媒体**：
   - Twitter/X
   - LinkedIn
4. **博客文章**：
   - 介绍 Skill 的功能
   - 使用教程
   - 最佳实践

### 维护和更新

#### 版本管理

使用语义化版本：

```bash
# 补丁版本（bug 修复）
git tag v2.0.1

# 次要版本（新功能）
git tag v2.1.0

# 主要版本（破坏性更改）
git tag v3.0.0
```

#### 用户更新

**个人 Skill**：
```bash
# 用户手动更新
cd ~/.claude/skills/git-sync-checker-enhanced
git pull origin main
```

**项目 Skill**：
```bash
# 团队成员自动获取更新
git pull
```

#### 自动更新脚本

为用户提供更新脚本：

```bash
#!/bin/bash
# update-skill.sh

SKILL_DIR="$HOME/.claude/skills/git-sync-checker-enhanced"

if [ -d "$SKILL_DIR" ]; then
    echo "🔄 更新 Git Sync Checker Skill..."
    cd "$SKILL_DIR"
    git pull origin main
    echo "✅ 更新完成！"
else
    echo "❌ Skill 未安装，请先运行安装脚本"
fi
```

### 收集反馈

1. **GitHub Issues**：收集 bug 报告和功能请求
2. **GitHub Discussions**：用户交流和问答
3. **投票功能**：让用户投票选择下一个功能
4. **使用统计**：
   - GitHub Stars/Forks
   - Clone 数量（通过 GitHub API）
   - 用户反馈和评价

## 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitLab CI/CD](https://docs.gitlab.com/ee/ci/)
- [Claude Code 文档](https://code.claude.com/docs)
- [语义化版本](https://semver.org/lang/zh-CN/)
