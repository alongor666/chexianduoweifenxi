# 技术栈详情

## 运行时环境

- **Node.js**: 20.x LTS
- **包管理器**: pnpm

## 前端框架

- **框架**: Next.js 14.2.33 (App Router)
- **UI库**: React 18
- **语言**: TypeScript 5.9.3
- **路径别名**: `@/*` 映射到 `./src/*`

## 状态管理

- **主要方案**: Zustand 5.0.8
- **特点**: 轻量级、细粒度选择器模式

## UI 组件库

- **样式框架**: Tailwind CSS 3.4.1
- **组件库**: Shadcn/ui（基于 Radix UI）
- **图标**: Lucide React
- **动画**: tailwindcss-animate

## 图表库

- **主要图表**: Recharts 3.3.0（React 原生）
- **高级图表**: ECharts 6.0.0（雷达图、热力图）

## 数据处理

- **CSV 解析**: Papa Parse 5.5.3
- **数据验证**: Zod 4.1.12
- **日期处理**: date-fns 4.2.1
- **查询引擎**: DuckDB-WASM 1.30.0（内存列式数据库）

## 数据存储

- **主要存储**: IndexedDB + LocalStorage
- **可选远程**: Supabase PostgreSQL

## 导出功能

- **PDF 生成**: jsPDF 3.0.3
- **HTML转图片**: html2canvas 1.4.1

## 测试框架

- **单元测试**: Vitest 2.1.4
- **E2E测试**: Playwright 1.49.0
- **测试环境**: jsdom 27.0.1

## 代码质量工具

- **Linter**: ESLint 8.x（next/core-web-vitals, next/typescript）
- **格式化**: Prettier 3.6.2
- **类型检查**: TypeScript 5.9.3（strict: false）

## 构建和部署

- **部署模式**: 静态导出（Static Export）
- **推荐平台**: Vercel, Cloudflare Pages, GitHub Pages
- **内存配置**: --max-old-space-size=2048（处理大数据文件）
