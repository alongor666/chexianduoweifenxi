# Git Sync Checker - 详细使用示例

本文档包含 6 个详细的使用场景示例，展示 Git 同步检查工具在实际工作中的应用。

## 目录

1. [自动检测分支和远程仓库](#示例-1自动检测分支和远程仓库)
2. [智能冲突预测](#示例-2智能冲突预测)
3. [批量检查多个项目](#示例-3批量检查多个项目)
4. [下班前智能检查](#示例-4下班前智能检查)
5. [.gitignore 优化建议](#示例-5gitignore-优化建议)
6. [项目类型感知建议](#示例-6项目类型感知建议)

---

## 示例 1：自动检测分支和远程仓库

### 用户输入
> 检查同步状态

### 正确处理流程

#### 1. 自动检测环境
```bash
$ git branch --show-current
feature/user-auth

$ git remote -v
origin  https://github.com/user/my-project.git (fetch)
upstream https://github.com/org/my-project.git (fetch)
```

#### 2. 生成智能报告
```markdown
📊 同步状态检查

## 基本信息
- 分支: feature/user-auth
- 远程: origin (GitHub)
- 上游: upstream (组织仓库)
- 项目类型: React + TypeScript

## 状态
- 本地提交: 3 个未推送到 origin
- 上游更新: 5 个新提交在 upstream/main
- 工作区: 2 个文件有修改

## 建议操作
1. 提交当前修改
2. 推送到个人仓库: git push origin feature/user-auth
3. 同步上游更新: git fetch upstream && git merge upstream/main
```

---

## 示例 2：智能冲突预测

### 用户输入
> 我要合并最新代码，会有冲突吗？

### 正确处理流程

#### 1. 运行冲突预测算法
```bash
# 分析共同修改文件
共同修改: src/utils/api.ts, src/components/UserList.tsx

# 计算冲突概率
- 共同文件: 2 个 (+60 分)
- 本地修改: 150 行 (+20 分)
- 远程修改: 80 行
- 总分: 80 分
```

#### 2. 生成风险报告
```markdown
🔍 冲突风险分析

## 风险等级: 🔴 高风险 (80分)

## 可能冲突的文件
1. src/utils/api.ts
   - 本地: 修改了 fetchUser 函数
   - 远程: 修改了 fetchUser 函数
   - 冲突概率: 85%

2. src/components/UserList.tsx
   - 本地: 添加了新的 props
   - 远程: 重构了组件结构
   - 冲突概率: 60%

## 建议
1. 先备份当前分支: git branch backup-feature
2. 使用交互式 rebase: git rebase -i origin/main
3. 准备手动解决冲突（预计 10-15 分钟）

## 安全操作步骤
git fetch origin
git branch backup-$(date +%Y%m%d-%H%M)
git rebase origin/main
# 如果有冲突，逐个解决后：
git rebase --continue
```

---

## 示例 3：批量检查多个项目

### 用户输入
> 检查 ~/work 目录下所有项目的同步状态

### 正确处理流程

#### 1. 扫描目录
```bash
找到 4 个 Git 仓库：
- ~/work/frontend-app
- ~/work/backend-api
- ~/work/mobile-app
- ~/work/docs
```

#### 2. 生成批量报告
```markdown
📦 批量同步检查报告
检查时间: 2025-11-17 18:45

## 概览
- 总计: 4 个仓库
- 已同步: 1 个 ✅
- 需要处理: 3 个 ⚠️

---

### 1. frontend-app (React)
- 分支: main
- 状态: ⚠️ 需要处理
- 问题:
  - 2 个未提交文件
  - 1 个未推送提交
- 建议:
  ```bash
  cd ~/work/frontend-app
  git add .
  git commit -m "feat: 更新用户界面"
  git push origin main
  ```

### 2. backend-api (Node.js)
- 分支: develop
- 状态: 🔴 需要立即处理
- 问题:
  - 远程领先 3 个提交
  - 本地有 2 个未推送提交
  - 冲突风险: 🟡 中等
- 建议:
  ```bash
  cd ~/work/backend-api
  git fetch origin
  git rebase origin/develop
  ```

### 3. mobile-app (React Native)
- 分支: feature/push-notification
- 状态: ✅ 已同步
- 备注: 一切正常

### 4. docs (Markdown)
- 分支: main
- 状态: ⚠️ 建议优化
- 问题:
  - 发现 .DS_Store 文件
- 建议:
  ```bash
  cd ~/work/docs
  echo ".DS_Store" >> .gitignore
  git rm --cached .DS_Store
  git commit -m "chore: 忽略系统文件"
  ```

## 快速操作脚本
一键处理所有问题（需手动确认每步）:
```bash
# 保存为 sync-all.sh
cd ~/work/frontend-app && git add . && git commit -m "update" && git push
cd ~/work/backend-api && git fetch && git rebase origin/develop
cd ~/work/docs && echo ".DS_Store" >> .gitignore && git add .gitignore && git commit -m "chore"
```
```

---

## 示例 4：下班前智能检查

### 用户输入（18:30）
> 准备下班了

### 正确处理流程

检测到下班时间，自动启用下班模式：

```markdown
🌆 下班前检查清单

检测到当前时间: 18:30
项目: my-saas-platform (Next.js 全栈)

## ✅ 检查项
- [x] 工作区干净
- [x] 所有提交已推送
- [ ] ⚠️ package-lock.json 有更新但未提交
- [x] 无敏感文件泄露
- [ ] ⚠️ 环境变量文件需要更新

## 需要处理
1. package-lock.json 更新
   - 原因: 今天安装了新依赖 (react-query)
   - 影响: 其他电脑需要同步依赖
   - 操作:
     ```bash
     git add package-lock.json
     git commit -m "chore: 更新依赖锁文件"
     git push origin main
     ```

2. .env.example 需要同步
   - 发现: .env 中有新变量 NEXT_PUBLIC_API_URL
   - 建议: 更新 .env.example 供团队参考
   - 操作:
     ```bash
     # 添加新环境变量到示例文件
     echo "NEXT_PUBLIC_API_URL=https://api.example.com" >> .env.example
     git add .env.example
     git commit -m "docs: 添加新环境变量说明"
     git push origin main
     ```

## 预计耗时: 2 分钟

处理完成后即可安心下班 🎉
```

---

## 示例 5：.gitignore 优化建议

### 用户输入
> 检查一下我的 gitignore 配置

### 正确处理流程

#### 1. 分析项目和当前 .gitignore
```bash
# 检测项目类型
发现: package.json, next.config.js → Next.js 项目

# 检查当前 .gitignore
当前规则:
- node_modules/
- .next/
```

#### 2. 生成优化建议
```markdown
🔍 .gitignore 优化建议

## 当前配置
✅ 已忽略: node_modules/, .next/

## 🟡 建议添加的规则

### 开发工具
.DS_Store          # macOS 系统文件
.vscode/           # VS Code 配置
.idea/             # WebStorm 配置
*.swp              # Vim 临时文件

### Next.js 相关
.next/
out/
.vercel/
.env*.local        # 本地环境变量

### 依赖和缓存
node_modules/
.pnpm-store/
.npm/
.yarn/

### 日志和临时文件
*.log
npm-debug.log*
.cache/

### 测试覆盖率
coverage/
.nyc_output/

## 一键应用优化
```bash
cat >> .gitignore <<'EOF'

# 系统文件
.DS_Store
.vscode/
.idea/
*.swp

# Next.js
out/
.vercel/
.env*.local

# 依赖
.pnpm-store/
.npm/
.yarn/

# 日志
*.log
npm-debug.log*

# 测试
coverage/
.nyc_output/
EOF

git add .gitignore
git commit -m "chore: 优化 gitignore 配置"
```

## 🚨 警告: 已跟踪的不该提交的文件
检测到以下文件应该被忽略但已被跟踪:
- .env.local (包含敏感信息)

清理步骤:
```bash
# 从 Git 移除但保留本地文件
git rm --cached .env.local
git commit -m "chore: 移除敏感文件"

# 添加到 .gitignore
echo ".env*.local" >> .gitignore
git add .gitignore
git commit -m "chore: 忽略本地环境变量"
```
```

---

## 示例 6：项目类型感知建议

### 用户输入
> 刚拉取了最新代码，需要做什么？

### 场景 A：Python Django 项目

#### 1. 检测项目类型和变更
```bash
# 检测到 Python Django 项目
项目文件: requirements.txt, manage.py, settings.py

# 检查变更
git diff HEAD@{1} HEAD --name-only
- requirements.txt (依赖更新)
- migrations/0005_add_user_profile.py (数据库迁移)
- .env.example (环境变量示例)
```

#### 2. 生成项目特定建议
```markdown
🐍 Python Django 项目 - 更新后操作清单

## 检测到的变更
1. ✅ 依赖更新 (requirements.txt)
2. ✅ 数据库迁移文件
3. ✅ 环境变量配置更新

## 必须执行的操作

### 1. 更新 Python 依赖
```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装新依赖
pip install -r requirements.txt
```

### 2. 运行数据库迁移
```bash
# 检查迁移状态
python manage.py showmigrations

# 执行迁移
python manage.py migrate

# 验证迁移成功
python manage.py dbshell  # 可选：检查数据库
```

### 3. 更新环境变量
```bash
# 对比新旧配置
diff .env .env.example

# 添加新的环境变量到 .env
# 新增变量: EMAIL_BACKEND, EMAIL_HOST
```

### 4. 验证更新
```bash
# 运行测试
python manage.py test

# 启动开发服务器
python manage.py runserver

# 检查后台管理
open http://localhost:8000/admin
```

## ⚠️ 注意事项
- 数据库迁移不可逆，建议先备份数据
- 如果是生产环境，谨慎执行迁移
- 新依赖可能需要重启服务

## 预计耗时: 5-10 分钟
```

### 场景 B：React 项目

```markdown
⚛️ React 项目 - 更新后操作清单

## 必须执行
```bash
# 安装新依赖
pnpm install

# 检查是否有破坏性更新
git log HEAD@{1}..HEAD --oneline | grep -i "breaking"

# 重启开发服务器
pnpm dev
```

## 建议检查
- [ ] Tailwind 配置是否有更新
- [ ] ESLint 规则是否有变化
- [ ] TypeScript 类型是否需要更新
```

---

## 使用场景对照表

| 场景 | 触发词 | 关键检查点 | 预期输出 |
|------|--------|-----------|---------|
| 基本检查 | "检查同步状态" | 分支、远程、提交状态 | 完整状态报告 |
| 冲突预测 | "会有冲突吗" | 共同修改文件 | 风险评分 + 建议 |
| 批量检查 | "检查所有项目" | 多仓库扫描 | 批量报告 |
| 下班检查 | "准备下班" | 时间感知 + 完整性 | 检查清单 |
| gitignore | "检查 gitignore" | 敏感文件 + 规则 | 优化建议 |
| 拉取后 | "刚拉取代码" | 项目类型 + 变更 | 特定步骤 |

---

## 故障排除

### 问题 1：检测不到远程仓库
```bash
# 检查远程配置
git remote -v

# 如果为空，添加远程仓库
git remote add origin <url>
```

### 问题 2：无法获取远程更新
```bash
# 检查网络连接
git fetch --dry-run

# 检查认证
git config --list | grep credential
```

### 问题 3：冲突预测不准确
```bash
# 确保已获取最新远程信息
git fetch --all

# 手动检查差异
git log --left-right --graph --oneline main...origin/main
```

---

## 更多资源

- 返回 [SKILL.md](SKILL.md) 查看核心指令
- 查看 [reference.md](reference.md) 了解高级功能
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解安装说明
