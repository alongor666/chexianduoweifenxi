# 技术栈与开发环境

本文档概述了车险分析平台所采用的技术栈、关键库以及本地开发环境的配置指南。

## 核心技术栈

- **前端**: Next.js 14.2.33 (React 18 框架)
  - **UI 库**: shadcn/ui (基于 Radix UI 和 Tailwind CSS 3.4.1)
  - **图表**: ECharts 6.0.0 + echarts-for-react 3.0.5 【已对齐当前代码事实】
  - **状态管理**: Zustand 5.0.8
  - **数据请求**: 原生 `fetch` API

- **后端/运行时**: Node.js 20.x LTS
  - **部署模式**: 静态导出（Static Export）+ 可选 API Routes
  - **核心框架**: Next.js App Router（无独立后端框架）

- **数据存储**（分层架构）:
  - **主要**: IndexedDB + LocalStorage (客户端浏览器存储)
  - **查询引擎**: DuckDB-WASM 1.30.0 (内存列式数据库，支持 SQL 查询)
  - **可选**: Supabase PostgreSQL (远程备份/多设备同步)

- **部署**:
  - **推荐**: Vercel (静态托管)
  - **备选**: Cloudflare Pages, Netlify, GitHub Pages

- **开发语言**: TypeScript 5.9.3

## 关键第三方库

### 数据处理
- **`papaparse` 5.5.3**: 用于在前端解析 CSV 文件，实现客户端数据预览与初步验证。
- **`zod` 4.1.12**: 用于定义数据结构（Schema）并执行严格的数据验证，确保进入系统的数据符合预设格式。
- **`@duckdb/duckdb-wasm` 1.30.0**: WebAssembly 编译的列式数据库，支持大数据量的高性能 SQL 查询。
【已对齐当前代码事实】

### 可视化与导出
- **`echarts` 6.0.0**: 百度开源的专业级数据可视化库，用于雷达图、热力图等高级图表。 【已对齐当前代码事实】
- **`echarts-for-react` 3.0.5**: ECharts 的 React 封装。 【已对齐当前代码事实】
- **`jspdf` 3.0.3**: 在浏览器端生成 PDF 文档，用于导出报告。
- **`html2canvas` 1.4.1**: 将 HTML 元素转换为 Canvas 图像，配合 jsPDF 实现图表导出。

### UI组件库
- **`@radix-ui/*`**: 无头UI组件库（Headless UI），提供可访问性优秀的底层组件。
- **`tailwindcss` 3.4.1**: 实用优先的 CSS 框架。
- **`tailwindcss-animate` 1.0.7**: Tailwind CSS 动画插件。
- **`class-variance-authority` 0.7.2**: 类型安全的样式变体管理。

## 数据持久化技术

### LocalStorage 存储策略
- **存储引擎**: 浏览器原生 LocalStorage API
- **存储容量**: 通常 5-10MB，适合中等规模数据集
- **数据完整性**: 使用 SHA-256 哈希值验证数据完整性
- **存储结构**: 分层存储（主数据 + 元信息），优化读写性能

### 核心功能模块
- **数据持久化**: `src/lib/storage/data-persistence.ts`
  - 自动保存上传数据到本地存储
  - 页面刷新时自动恢复数据状态
  - 智能容量管理和错误处理
  
- **上传历史**: `src/components/features/upload-history.tsx`
  - 记录每次文件上传的详细信息
  - 可视化展示上传状态和统计数据
  - 支持时间倒序浏览和状态筛选
  
- **重复检测**: 基于文件内容哈希的重复文件检测
  - 使用 Web Crypto API 生成 SHA-256 哈希
  - 上传前自动检测重复文件
  - 提供用户友好的重复文件处理选项

## 本地开发环境

### 环境设置

1.  **安装 Node.js**: 确保已安装 Node.js 18.x 或更高版本。
2.  **安装 pnpm**: 使用 `npm install -g pnpm` 安装 pnpm 包管理器。
3.  **安装依赖**: 在项目根目录下运行 `pnpm install`。
4.  **配置环境变量**: 
    - 复制 `.env.example` 文件为 `.env.local`。
    - 填入 Supabase 数据库连接字符串 (`DATABASE_URL`)。

### 常用命令

- **启动开发服务器**: `pnpm dev`

### 本地验证流程

1.  **准备测试数据**: 将待上传的 CSV 文件放置在 `public/` 目录下。
2.  **执行上传**: 在应用前端页面选择文件并点击上传。
3.  **观察输出**: 在浏览器开发者工具的控制台和运行 `pnpm dev` 的终端中查看详细的验证日志和错误信息。

## 性能优化策略

### 大数据量文件处理优化

**问题背景**: 当上传大数据量文件（如 16 万+行、30MB+）时，会触发堆栈溢出错误（`RangeError: Maximum call stack size exceeded`），导致应用崩溃。

**根本原因**:
1. **Math.max 展开运算符问题**（主要原因）:
   - 代码使用 `Math.max(...filteredData.map(r => r.week_number))`
   - 对 16万+ 行数据创建临时数组，然后使用展开运算符 `...`
   - 展开运算符会将数组作为独立参数传递，超过 JavaScript 调用栈限制（约10万参数）
   - 触发 `RangeError: Maximum call stack size exceeded`

2. **对象引用不稳定**（次要原因）:
   - Zustand store 中 `filters` 对象在每次更新时创建新的引用
   - Hook 中直接依赖整个 `filters` 对象，导致 `useMemo` 依赖项失效
   - 连锁反应：大数据量导致计算耗时 → 触发重渲染 → 再次计算

**解决方案**:

1. **替换 Math.max 展开运算符为 reduce**（核心修复）:
   ```typescript
   // ❌ 错误：使用展开运算符（调用栈限制约10万参数）
   const maxWeek = Math.max(...filteredData.map(r => r.week_number))

   // ✅ 正确：使用 reduce（线性复杂度，无调用栈限制）
   const maxWeek = filteredData.reduce((max, r) => Math.max(max, r.week_number), 0)
   ```

2. **细粒度选择器模式**（性能优化）:
   所有 Hooks 必须采用**细粒度选择器**模式，避免依赖整个 store 对象：
   ```typescript
   // ❌ 错误示例：依赖整个对象
   const filters = useAppStore(state => state.filters)

   // ✅ 正确示例：使用细粒度选择器
   const years = useAppStore(state => state.filters.years)
   const organizations = useAppStore(state => state.filters.organizations)
   const insuranceTypes = useAppStore(state => state.filters.insuranceTypes)
   // ... 其他字段依次选择
   ```

**已应用优化的模块**:
- `src/hooks/use-kpi.ts` - KPI 计算 Hook
- `src/hooks/use-smart-comparison.ts` - 智能环比 Hook
- `src/store/use-app-store.ts` - 状态管理（`useFilteredData` 选择器）

**优化效果**:
- ✅ 支持 16 万+行数据文件上传
- ✅ 避免堆栈溢出错误
- ✅ 减少不必要的重渲染
- ✅ 提升应用响应性能
- ✅ 自动处理缺失周次（智能跳过）
- ✅ 自动初始化周次筛选（选中最新周）
- ✅ 性能监控和日志输出

**额外优化措施**:

### 1. 缺失周次处理（智能跳跃）
处理数据中缺失的周次（如第32周、38周），确保环比计算正确：
- 自动查找最近的有数据周次
- 检查跳跃范围是否在允许范围内（默认5周）
- 详细日志输出，便于排查问题

示例：数据包含 28-31, 33-37, 39-41 周（缺32和38）
- 当前周 = 39 → 环比周 = 37（自动跳过38）
- 当前周 = 33 → 环比周 = 31（自动跳过32）

### 2. 自动初始化周次筛选
上传数据后自动选中最新周次，避免 `singleModeWeek = null` 导致的性能问题：
- `setRawData`：首次上传自动选中最新周
- `appendRawData`：追加数据时智能更新周次
- 避免初始加载时处理全量数据

### 3. 性能监控与日志
添加详细的性能监控和日志输出：
- 计算耗时统计（`performance.now()`）
- 数据量提示
- 缺失周次警告
- 便于性能优化和问题排查

**最佳实践**:
1. **禁止在大数组上使用展开运算符**：
   - ❌ 避免 `Math.max(...largeArray)`
   - ❌ 避免 `fn(...largeArray.map())`
   - ✅ 使用 `reduce()` 或循环替代

2. **细粒度选择器**：
   - 所有新增 Hook 必须采用细粒度选择器
   - 在 `useMemo` 依赖项中列出所有细粒度变量
   - 如需使用完整 `filters` 对象，需在 Hook 内部通过 `useMemo` 重建

3. **性能监控**：
   - 定期检查依赖项数组，确保没有遗漏
   - 使用 React DevTools Profiler 监控重渲染
   - 测试大数据量场景（10万+行）
   - 查看控制台性能日志，发现瓶颈

4. **数据上传规范**：
   - 优先上传最新周次数据
   - 缺失周次不影响功能（自动跳过）
   - 支持追加上传（自动去重）

---

## API端点设计

### POST /api/ingest-file

**状态**: 🚧 框架完成，业务逻辑待实现

**用途**: 接收前端上传的已解析数据并持久化到数据库

**请求格式**:
```typescript
POST /api/ingest-file
Content-Type: application/json

{
  "data": InsuranceRecord[]
}
```

**响应格式**:
```typescript
// 成功 (200)
{
  "message": "数据归档成功",
  "processedRecords": number
}

// 失败 (400/500)
{
  "error": "错误信息"
}
```

**实现文件**: `src/app/api/ingest-file/route.ts`

**待完成事项**:
- [ ] 连接 DataService 实现数据持久化
- [ ] 实现数据验证和去重逻辑
- [ ] 添加错误处理和日志记录

---

### POST /api/etl

**状态**: 🚧 框架完成，DuckDB处理逻辑待实现

**用途**: 批量ETL处理多个CSV文件，合并后输出单个文件

**请求格式**:
```typescript
POST /api/etl
Content-Type: multipart/form-data

files: File[]
outputFileName: string
```

**响应格式**:
```typescript
// 成功 (200)
{
  "success": true,
  "message": "ETL处理完成",
  "logs": "处理日志...",
  "downloadUrl": "http://..."
}

// 失败 (400/500)
{
  "success": false,
  "message": "错误信息",
  "logs": "错误日志..."
}
```

**实现文件**: `src/app/api/etl/route.ts`

**待完成事项**:
- [ ] 集成 DuckDB-WASM 进行 SQL 聚合
- [ ] 实现多文件合并逻辑
- [ ] 优化大文件处理性能

---

## 完整存储架构

### 三层存储架构

```
┌─────────────────────────────────────────────────┐
│           应用层 (Application Layer)             │
│      ├─ React Components                        │
│      ├─ Hooks (useFilteredData, useKPI...)      │
│      └─ Zustand Store (状态管理)                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         服务层 (Service Layer)                   │
│      ├─ DataService (数据查询)                   │
│      ├─ KPIService (指标计算)                    │
│      └─ PersistenceService (持久化管理)          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│    第一层: 内存查询引擎 (Query Engine)            │
│    ┌─────────────────────────────────┐          │
│    │   DuckDB-WASM (列式存储)         │          │
│    │   ├─ SQL查询支持                  │          │
│    │   ├─ 自动索引优化                 │          │
│    │   └─ Web Worker并行处理          │          │
│    └─────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│   第二层: 客户端持久化 (Client Storage)          │
│    ┌─────────────────┬─────────────────┐        │
│    │   IndexedDB     │  LocalStorage   │        │
│    │   (主要存储)     │   (备用存储)     │        │
│    │   ├─ 大容量      │   ├─ 5-10MB     │        │
│    │   ├─ 结构化数据  │   ├─ 简单键值    │        │
│    │   └─ 事务支持    │   └─ 快速访问    │        │
│    └─────────────────┴─────────────────┘        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  第三层: 远程存储 (Remote Storage, 可选)         │
│    ┌──────────────────────────────────┐         │
│    │   Supabase PostgreSQL            │         │
│    │   ├─ 多设备同步                   │         │
│    │   ├─ 历史数据备份                 │         │
│    │   └─ 跨浏览器数据共享             │         │
│    └──────────────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

### 存储方案选择

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| **个人单机使用** | IndexedDB + LocalStorage | 无需配置，离线可用 |
| **多设备同步** | + Supabase | 需要配置环境变量 |
| **大数据查询** | + DuckDB-WASM | 自动启用，支持百万行数据 SQL 查询 |
| **数据备份** | 导出CSV/PDF | 通过导出功能实现 |

### 数据流程

#### 上传流程
```
CSV文件 → Papa Parse解析
       → Zod验证
       → 存入IndexedDB/LocalStorage
       → [可选] 同步到Supabase
```

#### 查询流程
```
用户筛选 → Zustand Store
        → DuckDB SQL查询（大数据集）
        → 或直接内存过滤（小数据集）
        → 返回结果
```

---

## 开发环境配置更新

由于项目不再使用Prisma，环境配置已简化：

### 必需配置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm start
```

### 可选配置（Supabase远程存储）

如需启用Supabase远程存储，创建 `.env.local`:

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 数据源选择（local 或 supabase）
NEXT_PUBLIC_DATA_SOURCE=local
```

**注意**:
- 默认使用本地存储（`NEXT_PUBLIC_DATA_SOURCE=local`）
- Supabase为可选功能，不影响核心功能使用
- 无需配置数据库连接字符串（已移除Prisma依赖）

---

## 测试框架

```bash
# 单元测试
pnpm test

# E2E测试
pnpm test:e2e
```

**测试工具**:
- **单元测试**: Vitest 2.1.4
- **E2E测试**: Playwright 1.49.0

**配置文件**:
- `configs/vitest.config.mts` - Vitest 主配置（ESM 格式）
- `configs/vitest.setup.mts` - 测试环境初始化脚本
- `configs/playwright.config.ts` - Playwright E2E 测试配置

**重要说明**:
- Vitest 配置使用 `.mts` 扩展名以强制 ESM 模块格式
- 这避免了 Vite CJS Node API 废弃警告（`The CJS build of Vite's Node API is deprecated`）
- 根目录的 `vitest.config.mts` 为备用配置，实际使用 `configs/vitest.config.mts`

---

*最后更新: 2025-12-12*
*与代码一致性: ✅ 已验证*
