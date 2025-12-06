# 静态部署快速开始

## 概述

项目已配置为**纯静态部署模式**，使用 LocalStorage + DuckDB WASM 架构，无需服务器即可运行。

## 快速开始

### 1. 本地构建

```bash
# 安装依赖
pnpm install

# 静态构建
pnpm run build:static

# 本地预览
pnpm run preview
```

### 2. 部署到 GitHub Pages

直接推送到 `main` 分支，GitHub Actions 会自动构建和部署：

```bash
git add .
git commit -m "feat: 配置静态部署"
git push origin main
```

## 已完成的配置

### ✅ Next.js 配置（`next.config.js`）
- 启用 `output: 'export'` 静态导出
- 禁用图片优化（`images.unoptimized: true`）
- 配置 DuckDB WASM 支持

### ✅ 环境变量（`.env.local`）
```bash
NEXT_PUBLIC_DEPLOY_MODE=static
NEXT_PUBLIC_DATA_SOURCE=local
```

### ✅ 页面组件
- 首页改为客户端组件（移除服务器端数据获取）
- 数据加工面板在静态模式下自动隐藏

### ✅ TypeScript 配置
- 设置 `target: "ES2017"`
- 启用 `downlevelIteration`
- 修复类型错误

### ✅ GitHub Actions（`.github/workflows/deploy.yml`）
- 使用 pnpm
- 设置静态部署环境变量
- 自动部署到 GitHub Pages

## 项目脚本

```json
{
  "build:static": "静态构建（设置环境变量）",
  "preview": "本地预览构建结果",
  "deploy": "构建 + 添加 .nojekyll",
  "deploy:preview": "构建 + 预览"
}
```

## 功能说明

### ✅ 完全支持的功能
- CSV 文件上传和解析
- LocalStorage 数据持久化
- KPI 计算和分析
- 数据可视化（图表）
- PDF 报告导出
- 数据筛选和过滤

### ❌ 静态模式下不可用
- 数据加工（需要 Python + 服务器）
- Supabase 数据库集成

## 部署平台

### GitHub Pages（推荐）
- **成本**: 免费
- **部署**: 自动（推送到 main 分支）
- **访问**: https://[username].github.io/[repo-name]

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=out
```

### Cloudflare Pages
通过 Cloudflare Dashboard 连接 GitHub 仓库

## 故障排除

### 问题 1: 构建失败
**解决**: 检查 TypeScript 错误，运行 `pnpm run build:static` 查看详细错误

### 问题 2: 页面刷新后 404
**GitHub Pages**: 自动处理
**其他平台**: 配置服务器将所有路由重定向到 `index.html`

### 问题 3: WASM 加载失败
**解决**: 确保服务器配置正确的 MIME 类型（`application/wasm`）

## 详细文档

完整的静态部署文档请查看：
- `开发文档/03_technical_design/static_deployment.md`

## 支持和反馈

如有问题，请在 GitHub Issues 中反馈。
