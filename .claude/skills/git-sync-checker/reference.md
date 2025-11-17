# Git Sync Checker - 技术参考文档

本文档包含高级功能、算法实现细节和项目类型特定的 .gitignore 规则。

## 目录

1. [高级功能](#高级功能)
   - [智能冲突预测算法](#智能冲突预测算法)
   - [大文件检测](#大文件检测)
   - [多格式报告导出](#多格式报告导出)
2. [项目类型特定 .gitignore 规则](#项目类型特定-gitignore-规则)
3. [危险情况处理](#危险情况处理)
4. [性能优化](#性能优化)
5. [版本历史](#版本历史)

---

## 高级功能

### 智能冲突预测算法

完整的冲突预测算法实现，基于多个因素计算冲突风险评分。

```bash
#!/bin/bash
# conflict_predictor.sh

predict_conflicts() {
    local base_commit=$(git merge-base HEAD origin/$CURRENT_BRANCH)

    # 获取两边修改的行数
    local local_changes=$(git diff $base_commit HEAD --numstat | awk '{sum+=$1+$2} END {print sum}')
    local remote_changes=$(git diff $base_commit origin/$CURRENT_BRANCH --numstat | awk '{sum+=$1+$2} END {print sum}')

    # 计算冲突概率
    local conflict_score=0

    # 共同修改文件 +30 分
    local common_files=$(comm -12 <(git diff --name-only $base_commit HEAD | sort) \
                                   <(git diff --name-only $base_commit origin/$CURRENT_BRANCH | sort) | wc -l)
    conflict_score=$((conflict_score + common_files * 30))

    # 修改行数 >100 +20 分
    [ $local_changes -gt 100 ] && conflict_score=$((conflict_score + 20))
    [ $remote_changes -gt 100 ] && conflict_score=$((conflict_score + 20))

    # 输出风险等级
    if [ $conflict_score -lt 30 ]; then
        echo "🟢 低风险 (${conflict_score}分)"
    elif [ $conflict_score -lt 70 ]; then
        echo "🟡 中风险 (${conflict_score}分)"
    else
        echo "🔴 高风险 (${conflict_score}分)"
    fi
}
```

**评分规则详解**：

| 因素 | 评分 | 说明 |
|------|------|------|
| 每个共同修改文件 | +30 分 | 两边都修改了同一文件 |
| 本地修改 >100 行 | +20 分 | 大规模修改增加冲突概率 |
| 远程修改 >100 行 | +20 分 | 大规模修改增加冲突概率 |
| 关键文件修改 | +10 分 | package.json, go.mod 等 |

**风险等级**：
- **0-29 分**：🟢 低风险 - 可以安全合并
- **30-69 分**：🟡 中风险 - 建议先备份
- **70+ 分**：🔴 高风险 - 必须谨慎处理

### 大文件检测

检测仓库中的大文件，防止将大文件提交到 Git。

```bash
#!/bin/bash
# 检查大于 5MB 的文件

check_large_files() {
    local threshold=$((5 * 1024 * 1024))  # 5MB
    local found_large=false

    git ls-files -z | while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            # macOS 使用 stat -f%z，Linux 使用 stat -c%s
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

            if [ $size -gt $threshold ]; then
                found_large=true
                # 转换为人类可读格式
                size_mb=$(echo "scale=2; $size / 1024 / 1024" | bc)
                echo "⚠️ 大文件: $file (${size_mb}MB)"

                # 提供建议
                echo "   建议: 使用 Git LFS 或添加到 .gitignore"
            fi
        fi
    done

    if [ "$found_large" = false ]; then
        echo "✅ 未发现大文件"
    fi
}
```

**建议操作**：

```bash
# 1. 添加到 .gitignore
echo "large_file.zip" >> .gitignore

# 2. 如果已提交，从历史中移除
git filter-branch --tree-filter 'rm -f large_file.zip' HEAD

# 3. 或使用 Git LFS
git lfs install
git lfs track "*.zip"
git add .gitattributes
```

### 多格式报告导出

支持导出 Markdown、HTML、JSON 等多种格式的报告。

#### Markdown 格式

```bash
generate_markdown_report() {
    cat > sync-report.md <<EOF
# Git 同步状态报告
生成时间: $(date +"%Y-%m-%d %H:%M:%S")

## 📊 基本信息
- 仓库: $(basename $(git rev-parse --show-toplevel))
- 分支: $(git branch --show-current)
- 远程: $(git remote | head -n 1)

## 🔍 状态概览
- 未暂存: $(git diff --name-only | wc -l) 个文件
- 已暂存: $(git diff --cached --name-only | wc -l) 个文件
- 未推送: $(git log @{u}.. --oneline 2>/dev/null | wc -l) 个提交
- 未拉取: $(git log ..@{u} --oneline 2>/dev/null | wc -l) 个提交
EOF
}
```

#### HTML 格式（带样式）

```bash
generate_html_report() {
    cat > sync-report.html <<'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git 同步状态报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .status-ok {
            color: #4CAF50;
            font-weight: bold;
        }
        .status-warn {
            color: #FF9800;
            font-weight: bold;
        }
        .status-error {
            color: #f44336;
            font-weight: bold;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
        }
        .command {
            background: #263238;
            color: #aed581;
            padding: 15px;
            border-radius: 4px;
            font-family: "Monaco", "Courier New", monospace;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Git 同步状态报告</h1>
        <p>生成时间: <strong>TIMESTAMP</strong></p>

        <div class="section">
            <h2>基本信息</h2>
            <ul>
                <li>仓库: <code>REPO_NAME</code></li>
                <li>分支: <code>BRANCH_NAME</code></li>
                <li>远程: <code>REMOTE_NAME</code></li>
            </ul>
        </div>

        <div class="section">
            <h2>状态概览</h2>
            <ul>
                <li>工作区: <span class="status-warn">MODIFIED_COUNT 个文件有修改</span></li>
                <li>暂存区: <span class="status-ok">STAGED_COUNT 个文件已暂存</span></li>
                <li>本地提交: <span class="status-warn">UNPUSHED_COUNT 个未推送</span></li>
            </ul>
        </div>

        <div class="section">
            <h2>建议操作</h2>
            <div class="command">
git add .<br>
git commit -m "feat: 完成新功能"<br>
git push origin main
            </div>
        </div>
    </div>
</body>
</html>
EOF
}
```

#### JSON 格式（供其他工具使用）

```bash
generate_json_report() {
    cat > sync-report.json <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "repository": {
    "name": "$(basename $(git rev-parse --show-toplevel))",
    "path": "$(git rev-parse --show-toplevel)",
    "branch": "$(git branch --show-current)",
    "remote": "$(git remote | head -n 1)"
  },
  "status": {
    "uncommitted": $(git diff --name-only | wc -l | tr -d ' '),
    "staged": $(git diff --cached --name-only | wc -l | tr -d ' '),
    "unpushed": $(git log @{u}.. --oneline 2>/dev/null | wc -l | tr -d ' '),
    "unpulled": $(git log ..@{u} --oneline 2>/dev/null | wc -l | tr -d ' ')
  },
  "conflict_risk": "low",
  "large_files": [],
  "sensitive_files": []
}
EOF
}
```

---

## 项目类型特定 .gitignore 规则

### 前端项目

#### React / Next.js

```gitignore
# 依赖
node_modules/
.pnp/
.pnp.js

# 测试
coverage/
.nyc_output/

# Next.js
.next/
out/
build/
dist/

# 环境变量
.env
.env*.local

# Vercel
.vercel/

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器
.vscode/
.idea/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 其他
.cache/
.turbo/
```

#### Vue / Nuxt

```gitignore
# 依赖
node_modules/

# Nuxt
.nuxt/
.output/
.cache/
dist/

# 环境变量
.env
.env*.local

# 日志
*.log

# 编辑器
.vscode/
.idea/

# 操作系统
.DS_Store
```

### 后端项目

#### Python / Django

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so

# 虚拟环境
venv/
env/
ENV/
.venv/

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# 环境变量
.env
.env.local

# 测试
.pytest_cache/
.coverage
htmlcov/
.tox/

# IDE
.vscode/
.idea/
*.swp

# 操作系统
.DS_Store
```

#### Node.js / Express

```gitignore
# 依赖
node_modules/

# 环境变量
.env
.env*.local

# 日志
logs/
*.log
npm-debug.log*

# 运行时数据
pids/
*.pid
*.seed
*.pid.lock

# 测试
coverage/
.nyc_output/

# 构建产物
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# 操作系统
.DS_Store
```

#### Go

```gitignore
# 二进制文件
*.exe
*.exe~
*.dll
*.so
*.dylib

# 测试
*.test
*.out

# Go 工作区
/vendor/
go.work

# 环境变量
.env
.env.local

# 构建产物
/bin/
/dist/

# IDE
.vscode/
.idea/
*.swp

# 操作系统
.DS_Store
```

### 移动端项目

#### React Native

```gitignore
# 依赖
node_modules/

# Metro
.metro-health-check*

# Expo
.expo/
dist/

# Android
/android/app/build/
/android/app/release/
/android/.gradle/
local.properties

# iOS
/ios/Pods/
/ios/build/
*.xcworkspace
!default.xcworkspace

# 环境变量
.env
.env*.local

# 日志
*.log

# IDE
.vscode/
.idea/
*.swp

# 操作系统
.DS_Store
```

#### Flutter

```gitignore
# Flutter
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/

# Android
*.jks
local.properties

# iOS
*.mode1v3
*.mode2v3
*.moved-aside
*.pbxuser
*.perspectivev3
Pods/
.symlinks/

# 环境变量
.env
.env*.local

# IDE
.vscode/
.idea/
*.swp

# 操作系统
.DS_Store
```

---

## 危险情况处理

### 情况 1：即将强制推送

当检测到本地历史与远程不一致，可能需要强制推送时：

```markdown
🔴 危险操作警告

检测到本地历史与远程不一致，可能需要强制推送。

❌ 不建议: git push --force

✅ 建议:
1. 确认远程代码是否重要
2. 使用 git push --force-with-lease (更安全)
3. 或者创建新分支: git checkout -b recovery-branch

## 为什么 --force-with-lease 更安全？

--force-with-lease 只有在远程分支没有其他人推送新提交时才会成功，
避免了覆盖他人工作的风险。
```

**安全操作步骤**：

```bash
# 1. 先检查远程是否有新提交
git fetch origin

# 2. 查看差异
git log origin/main..HEAD

# 3. 使用 --force-with-lease
git push --force-with-lease origin main

# 4. 如果失败，说明远程有更新，先拉取
git pull --rebase origin main
```

### 情况 2：敏感文件即将提交

当检测到 .env、密钥文件等敏感信息时：

```markdown
🔴 敏感文件警告

检测到以下文件包含敏感信息：
- .env (包含 API 密钥)
- config/database.yml (包含数据库密码)
- private.key (私钥文件)

## 建议操作

### 1. 立即添加到 .gitignore
\`\`\`bash
echo ".env" >> .gitignore
echo "config/database.yml" >> .gitignore
echo "*.key" >> .gitignore
\`\`\`

### 2. 从暂存区移除（如果已暂存）
\`\`\`bash
git reset HEAD .env config/database.yml private.key
\`\`\`

### 3. 如果已提交，从历史中移除
⚠️ 警告：这会改写 Git 历史，需要团队协调

\`\`\`bash
# 使用 git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 或使用 BFG Repo-Cleaner（推荐）
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
\`\`\`

### 4. 使用环境变量管理工具
- dotenv (Node.js)
- python-decouple (Python)
- Vault (多语言)
```

### 情况 3：发现分支分叉

当本地分支和远程分支分叉时：

```markdown
⚠️ 分支分叉警告

检测到本地分支和远程分支已分叉：
- 本地领先: 3 个提交
- 远程领先: 2 个提交

## 解决方案

### 方案 1：Rebase（推荐，保持线性历史）
\`\`\`bash
git pull --rebase origin main
# 如果有冲突，解决后：
git add .
git rebase --continue
\`\`\`

### 方案 2：Merge（保留分支历史）
\`\`\`bash
git pull origin main
# 解决冲突后提交
\`\`\`

### 方案 3：重置到远程（放弃本地修改）
⚠️ 注意：这会丢失本地提交

\`\`\`bash
# 先备份
git branch backup-$(date +%Y%m%d)

# 重置到远程
git reset --hard origin/main
\`\`\`
```

---

## 性能优化

### 1. 批量检查优化

对于大量仓库的批量检查，使用并行处理：

```bash
#!/bin/bash
# 并行检查多个仓库

check_repo_parallel() {
    local repo_path=$1
    (
        cd "$repo_path" || return

        # 快速检查
        local status=$(git status --porcelain 2>/dev/null | wc -l)
        local unpushed=$(git log @{u}.. --oneline 2>/dev/null | wc -l)

        if [ $status -eq 0 ] && [ $unpushed -eq 0 ]; then
            echo "✅ $(basename $repo_path): 已同步"
        else
            echo "⚠️ $(basename $repo_path): $status 个修改, $unpushed 个未推送"
        fi
    ) &
}

# 使用方法
for repo in ~/projects/*/.git; do
    check_repo_parallel "$(dirname $repo)"
done

# 等待所有后台进程完成
wait
```

### 2. 大仓库优化

对于大型仓库，使用 shallow clone 和 sparse checkout：

```bash
# Shallow clone（只克隆最近的提交）
git clone --depth 1 <url>

# Sparse checkout（只检出需要的文件）
git sparse-checkout init --cone
git sparse-checkout set <directory>
```

### 3. 缓存优化

缓存 git fetch 结果，避免频繁网络请求：

```bash
#!/bin/bash
CACHE_FILE="/tmp/git_fetch_cache_$(pwd | md5)"
CACHE_TIMEOUT=300  # 5分钟

if [ -f "$CACHE_FILE" ]; then
    age=$(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE")))
    if [ $age -lt $CACHE_TIMEOUT ]; then
        echo "使用缓存的 fetch 结果"
        exit 0
    fi
fi

git fetch origin
touch "$CACHE_FILE"
```

---

## 版本历史

### v2.0 (2025-11-17)

#### 🚀 新功能
- ✅ 自动检测分支和远程仓库名称
- ✅ 支持批量检查多个仓库
- ✅ AI 驱动的冲突预测算法
- ✅ 智能 .gitignore 检查和优化
- ✅ 项目类型感知建议（前端/后端/全栈）
- ✅ 大文件检测和警告
- ✅ 多格式报告导出（Markdown/HTML/JSON）
- ✅ 时间感知的情境建议（下班/上班）

#### 🔧 改进
- 从硬编码 `main` 改为动态检测当前分支
- 从假设 `origin` 改为自动识别远程仓库
- 增强错误处理和边界情况
- 优化批量检查性能

#### 📚 文档
- 新增 6 个详细使用示例
- 添加项目类型特定指南
- 补充安全限制说明
- 拆分文档结构（SKILL.md / examples.md / reference.md）

### v1.0 (2025-11-17)
- 初始版本

---

## 相关资源

- 返回 [SKILL.md](SKILL.md) 查看核心指令
- 查看 [examples.md](examples.md) 了解详细示例
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解安装说明
- 查看 [CHANGELOG.md](CHANGELOG.md) 了解版本历史
