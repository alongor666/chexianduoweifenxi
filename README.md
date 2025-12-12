# 车险多维分析平台（Insuralytics）

Insuralytics 是一个面向车险经营分析的“静态优先 / 本地优先”多维分析应用：默认以浏览器本地数据（CSV / DuckDB 文件）完成导入、持久化与计算；可选接入 Supabase 作为远程数据源/同步层。

## 功能概览

- **数据导入**：支持上传 `.csv`；支持上传 `.duckdb/.db` 作为高性能查询源（DuckDB-WASM）。
- **本地持久化**：上传数据自动写入浏览器 `localStorage`，刷新后可恢复（含上传历史）。
- **多维筛选与下钻**：按周次/年度/机构/险种/渠道等维度筛选，支持下钻分析。
- **核心看板与分析**：KPI 看板、周度趋势、专题分析、多图联动等。
- **目标管理**：支持年度目标与按维度拆分配置（本地保存）。
- **可选远程数据源**：`NEXT_PUBLIC_DATA_SOURCE=supabase` 时从 Supabase 拉取数据（未配置则自动降级本地模式）。

## 技术栈（以代码为准）

- **前端**：Next.js 14（App Router）+ React 18 + TypeScript
- **UI**：shadcn/ui + Tailwind CSS
- **可视化**：ECharts
- **状态管理**：Zustand
- **数据处理**：Zod（校验）+ DuckDB-WASM（SQL/列式查询）
- **可选远程**：Supabase（`@supabase/supabase-js`）
- **部署**：静态导出（`next.config.mjs` 中 `output: 'export'`），支持 GitHub Pages

## 快速开始

### 环境准备

- Node.js：建议 `>=18.17`（CI 使用 Node 20）
- pnpm：建议 `>=8`

### 安装与启动

```bash
pnpm install
cp ".env.example" ".env.local"
pnpm dev
```

## 常用命令

<!-- AUTO-GENERATED:pnpm-scripts:start -->
| 命令 | 实际执行 | 说明 |
|---|---|---|
| `pnpm dev` | `NODE_OPTIONS='--max-old-space-size=2048' next dev` | 启动开发服务器 |
| `pnpm build` | `NODE_OPTIONS='--max-old-space-size=2048' next build` | 构建（静态导出到 out/） |
| `pnpm deploy` | `pnpm run build:static && touch out/.nojekyll` | 生成 out/（用于静态托管） |
| `pnpm deploy:preview` | `pnpm run deploy && pnpm run preview` | 本地预览 out/（静态） |
| `pnpm validate` | `pnpm lint && pnpm tsc --noEmit && pnpm build` | 基础校验（lint + tsc + build） |
| `pnpm test:unit` | `vitest -c configs/vitest.config.mts` | 单元测试（Vitest） |
| `pnpm test:e2e` | `playwright test` | 端到端测试（Playwright） |
| `pnpm docs:index` | `python3 scripts/generate_docs_index.py 开发文档` | 更新知识库索引（开发文档/） |
<!-- AUTO-GENERATED:pnpm-scripts:end -->

## 数据与部署模式

- **数据源**：`NEXT_PUBLIC_DATA_SOURCE=local|supabase`（默认 `local`，详见 `.env.example`）。
- **部署模式**：项目当前以静态导出为主（`out/`），适合 GitHub Pages/静态托管；若需要依赖 `src/app/api/*` 的服务端能力，请不要使用静态导出（需要调整 `next.config.mjs`）。
- **GitHub Pages**：仓库已包含 `.github/workflows/deploy.yml`，push 到 `main` 会构建并发布 `out/`。
  - 当前 `basePath/assetPrefix` 固定为 `/chexianduoweifenxi`（见 `next.config.mjs`），仓库名变化时需要同步调整。

## 关键入口（定位代码用）

- 页面入口：`src/app/page.tsx`
- 主界面组合：`src/components/dashboard-client.tsx`
- KPI 计算：`src/hooks/use-kpi.ts` 与 `src/domain/`
- CSV 校验 Schema：`src/lib/validations/insurance-schema.ts`
- 本地持久化：`src/lib/storage/data-persistence.ts`
- DuckDB 适配：`src/infrastructure/adapters/DuckDBRepository.ts`
- Supabase 开关与客户端：`src/lib/supabase/client.ts`
- 可选 API Routes（静态导出不生效）：`src/app/api/etl/route.ts`、`src/app/api/ingest-file/route.ts`

## 文档（推荐从索引进入）

- 知识库索引（自动生成）：`开发文档/KNOWLEDGE_INDEX.md`
- 知识库说明：`开发文档/README.md`
- 技术栈细节：`开发文档/03_technical_design/tech_stack.md`
- 数据架构与 CSV 规范：`开发文档/03_technical_design/data_architecture.md`

## 自动同步（让 README/索引“自动变新”）

- **文档索引**：运行 `pnpm docs:index` 更新 `开发文档/KNOWLEDGE_INDEX.md`（仓库已配置 PR 自动更新/校验工作流）。
- **README 命令段**：运行 `pnpm readme:sync` 重新生成“常用命令”段落（见下文脚本与 CI 校验配置）。
