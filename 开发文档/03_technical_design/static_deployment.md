# 纯静态部署指南

本文档说明如何将车险分析平台配置为纯静态部署模式，实现零服务器成本、快速访问的静态网站部署。

## 概述

车险分析平台采用 **LocalStorage + DuckDB WASM** 架构，天然支持纯静态部署：

- ✅ 所有数据处理在浏览器中完成（DuckDB WASM）
- ✅ 数据持久化使用 LocalStorage
- ✅ 无需后端服务器或数据库
- ✅ 可部署到任何静态托管服务

## 架构说明

### 数据流架构

```
用户上传CSV文件
    ↓
浏览器内解析（PapaParse）
    ↓
数据验证（Zod Schema）
    ↓
存储到 LocalStorage
    ↓
DuckDB WASM 查询和计算
    ↓
可视化展示（ECharts/Recharts）
```

### 静态 vs 服务器模式对比

| 功能                   | 静态模式                 | 服务器模式               |
| ---------------------- | ------------------------ | ------------------------ |
| CSV 数据上传           | ✅ 客户端处理            | ✅ 客户端处理            |
| 数据持久化             | ✅ LocalStorage          | ✅ LocalStorage 或数据库 |
| KPI 计算               | ✅ 客户端（DuckDB WASM） | ✅ 客户端或 API          |
| 数据可视化             | ✅ 完整支持              | ✅ 完整支持              |
| PDF 报告导出           | ✅ 客户端生成            | ✅ 客户端生成            |
| 数据加工（Python ETL） | ❌ 不支持                | ✅ API Routes            |
| Supabase 集成          | ❌ 不支持                | ✅ 支持                  |

## 配置步骤

### 1. 环境变量配置

创建或修改 `.env.local` 文件：

```bash
# ================================
# 部署模式配置
# ================================

# 设置为静态部署模式
NEXT_PUBLIC_DEPLOY_MODE=static

# 使用本地数据源（不依赖 Supabase）
NEXT_PUBLIC_DATA_SOURCE=local

# 禁用 Next.js 遥测
NEXT_TELEMETRY_DISABLED=1
```

### 2. Next.js 配置

项目已配置静态导出模式（`next.config.js`）：

```javascript
const nextConfig = {
  // 启用静态导出
  output: 'export',

  // 禁用图片优化（静态导出要求）
  images: {
    unoptimized: true,
  },

  // ... 其他配置
}
```

### 3. 构建静态文件

运行构建命令生成静态文件：

```bash
# 安装依赖
pnpm install

# 构建静态文件
pnpm build

# 输出目录: ./out/
```

构建完成后，静态文件会生成在 `out/` 目录中。

### 4. 本地预览

使用任何静态服务器预览构建结果：

```bash
# 使用 Python
python3 -m http.server 8000 -d out

# 使用 Node.js serve
npx serve out

# 使用 pnpm 的 start 命令（需要先 build）
# 注意: next start 不适用于 output: 'export'
```

访问 `http://localhost:8000` 查看效果。

## 部署选项

### 选项 1: GitHub Pages（推荐）

**优点**: 免费、自动部署、支持自定义域名

**步骤**:

1. 在 GitHub 仓库中启用 Pages
2. 配置构建工作流（`.github/workflows/deploy.yml`）:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_DEPLOY_MODE: static
          NEXT_PUBLIC_DATA_SOURCE: local

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

3. 配置 Pages 从 `gh-pages` 分支部署

#### GitHub Pages 路径配置（重要）

当使用 `output: 'export'` 静态导出并部署到 GitHub Pages 的“子路径”（`https://{user}.github.io/{repo}/`）时，必须配置 `basePath/assetPrefix` 与仓库名一致。

当前项目在生产环境固定为：

- `basePath`: `/chexianduoweifenxi`
- `assetPrefix`: `/chexianduoweifenxi/`

对应实现见 `next.config.mjs`。如果仓库名发生变化，需同步调整这两个值，否则会出现静态资源 404。

#### 常见故障排查

- 页面 404：检查 GitHub Pages 的 Source 分支是否为 `gh-pages`，并确认工作流产物发布目录为 `out/`
- 资源加载失败：检查 `basePath/assetPrefix` 是否与仓库名一致（尤其是更换仓库名后）
- 本地预览正常但线上异常：对比线上 URL 前缀是否包含仓库名路径

### 选项 2: Vercel 静态部署

**优点**: 零配置、自动 HTTPS、全球 CDN

**步骤**:

1. 在 Vercel 导入项目
2. 设置环境变量:
   - `NEXT_PUBLIC_DEPLOY_MODE=static`
   - `NEXT_PUBLIC_DATA_SOURCE=local`
3. 部署（自动检测 Next.js 配置）

### 选项 3: Netlify

**优点**: 免费层支持、简单配置

**步骤**:

1. 创建 `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "out"

[build.environment]
  NEXT_PUBLIC_DEPLOY_MODE = "static"
  NEXT_PUBLIC_DATA_SOURCE = "local"
```

2. 连接 GitHub 仓库并部署

### 选项 4: Cloudflare Pages

**优点**: 全球 CDN、无限带宽

**步骤**:

1. 连接 GitHub 仓库
2. 配置构建设置:
   - 构建命令: `pnpm build`
   - 输出目录: `out`
3. 设置环境变量并部署

### 选项 5: 自托管（Nginx/Apache）

**步骤**:

1. 构建静态文件: `pnpm build`
2. 将 `out/` 目录内容复制到 Web 服务器
3. 配置 Nginx 示例:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/insurance-analytics;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

## 功能限制

### 静态模式下不可用的功能

1. **数据加工（ETL）**: 需要 Python 脚本和服务器端 API
   - 解决方案：在本地运行 ETL，然后上传处理后的 CSV

2. **Supabase 集成**: 需要服务器端数据库连接
   - 解决方案：使用 CSV 上传和 LocalStorage

### 数据存储限制

- **LocalStorage 容量**: 通常 5-10MB
  - 适合存储中等规模数据集（数万条记录）
  - 大数据集建议分批上传或筛选后上传

## 性能优化

### 1. 减小包体积

```bash
# 分析包体积
pnpm build
# 查看 .next/analyze/ 目录（需要配置 @next/bundle-analyzer）
```

### 2. 启用压缩

所有主流静态托管服务都会自动启用 Brotli/Gzip 压缩。

### 3. CDN 缓存

推荐配置缓存策略：

- HTML: `Cache-Control: no-cache`
- JS/CSS: `Cache-Control: public, max-age=31536000, immutable`
- 其他静态资源: `Cache-Control: public, max-age=31536000`

## 常见问题

### Q1: 部署后页面空白？

**原因**: 可能是基础路径配置问题

**解决**:

1. 检查 `next.config.js` 中的 `basePath`（如果部署到子路径）
2. 确保环境变量正确设置

### Q2: 刷新页面后 404？

**原因**: SPA 路由需要服务器配置

**解决**:

- **Vercel/Netlify**: 自动处理
- **GitHub Pages**: 添加 `out/404.html`（复制 `index.html`）
- **Nginx**: 使用 `try_files` 配置

### Q3: LocalStorage 数据丢失？

**原因**:

- 浏览器隐私模式
- 用户清除缓存
- 跨域问题

**解决**:

1. 提示用户定期导出数据
2. 提供数据恢复功能
3. 文档中说明数据存储机制

### Q4: WASM 加载失败？

**原因**: MIME 类型配置或 CORS 问题

**解决**:

- 确保服务器配置正确的 WASM MIME 类型
- 检查 CDN 配置

## 回滚到服务器模式

如果需要恢复服务器端功能：

1. 修改环境变量:

```bash
NEXT_PUBLIC_DEPLOY_MODE=server
NEXT_PUBLIC_DATA_SOURCE=supabase
```

2. 修改 `next.config.js`:

```javascript
const nextConfig = {
  // 移除 output: 'export'
  images: {
    // 移除 unoptimized: true
  },
  // ... 其他配置
}
```

3. 重新部署到支持 SSR 的平台（Vercel、Netlify Functions 等）

## 维护和更新

### 更新流程

1. 修改代码
2. 本地测试: `pnpm dev`
3. 构建: `pnpm build`
4. 本地预览: `npx serve out`
5. 提交代码并推送（触发自动部署）

### 监控建议

- 使用 Vercel Analytics 或 Google Analytics 监控访问
- 定期检查用户反馈
- 监控 LocalStorage 使用情况

## 总结

静态部署模式提供了：

- ✅ 零服务器成本
- ✅ 快速访问（全球 CDN）
- ✅ 高可用性（无服务器宕机）
- ✅ 简单维护（Git push 即部署）
- ✅ 数据隐私（所有数据在用户浏览器中）

对于大多数使用场景，纯静态部署是最优选择！
