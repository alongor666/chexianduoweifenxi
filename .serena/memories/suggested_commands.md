# 建议命令清单

## 日常开发命令

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
# 访问 http://localhost:3000
```

### 构建项目

#### 开发构建

```bash
pnpm build
```

#### 静态导出构建（用于部署）

```bash
pnpm build:static
# 输出到 out/ 目录
```

### 预览生产构建

```bash
# 启动 Next.js 服务器
pnpm start

# 或预览静态构建
pnpm preview
```

## 代码质量命令

### Linting

```bash
pnpm lint
# 运行 ESLint 检查代码质量
```

### 格式化

```bash
# 使用 Prettier 格式化代码（通过 ESLint 集成）
pnpm lint --fix
```

## 测试命令

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 或使用别名
pnpm test:unit
```

### E2E 测试

```bash
pnpm test:e2e
# 使用 Playwright 运行端到端测试
```

### 测试上传功能

```bash
pnpm test:upload
# 运行上传功能测试脚本
```

## 部署命令

### 完整部署流程

```bash
pnpm deploy
# 执行: build:static + 创建 .nojekyll 文件
```

### 部署预览

```bash
pnpm deploy:preview
# 执行: deploy + preview
```

## 代码分析命令

### 分析代码库

```bash
node analyze-codebase.js
# 生成 codebase-analysis.json 报告
```

### 生成功能卡片

```bash
node generate-feature-cards.js
# 基于分析报告生成/更新功能文档
```

## 系统工具命令（macOS/Darwin）

### Git 操作

```bash
git status          # 查看状态
git add .          # 添加所有变更
git commit -m ""   # 提交变更
git push           # 推送到远程
```

### 文件操作

```bash
ls -la             # 列出文件（包含隐藏文件）
find . -name ""    # 查找文件
grep -r "" .       # 搜索内容
```

### 进程管理

```bash
ps aux | grep node  # 查看 Node 进程
kill -9 <PID>      # 终止进程
```

## 常见工作流

### 新功能开发

1. 创建功能分支：`git checkout -b feature/新功能名`
2. 开发并测试：`pnpm dev`
3. 运行测试：`pnpm test`
4. 代码检查：`pnpm lint`
5. 提交代码：`git add . && git commit -m "描述"`
6. 推送分支：`git push origin feature/新功能名`

### Bug 修复

1. 重现问题：`pnpm dev`
2. 修复代码
3. 验证修复：`pnpm test`
4. 更新文档：编辑相关功能卡片
5. 提交变更

### 发布前检查

1. 运行所有测试：`pnpm test && pnpm test:e2e`
2. 代码检查：`pnpm lint`
3. 生产构建：`pnpm build`
4. 本地预览：`pnpm start`
5. 代码分析：`node analyze-codebase.js`
6. 更新文档：检查并更新 `开发文档/`
