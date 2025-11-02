# 技术栈与开发环境

本文档概述了车险分析平台所采用的技术栈、关键库以及本地开发环境的配置指南。

## 核心技术栈

- **前端**: Next.js (React 框架)
  - **UI 库**: shadcn/ui (基于 Radix UI 和 Tailwind CSS)
  - **图表**: Recharts
  - **状态管理**: Zustand
  - **数据请求**: 原生 `fetch` API

- **后端**: Node.js
  - **核心框架**: 无特定框架，使用原生 Node.js API
  - **数据库 ORM**: Prisma

- **数据库**: Supabase (PostgreSQL)

- **部署**: Vercel

- **开发语言**: TypeScript

## 关键第三方库

- **`papaparse`**: 用于在前端解析 CSV 文件，实现客户端数据预览与初步验证。
- **`zod`**: 用于定义数据结构（Schema）并执行严格的数据验证，确保进入系统的数据符合预设格式。
- **`date-fns`**: 提供可靠的日期处理功能，用于处理 `snapshot_date` 等时间序列数据。

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
    - 填入 Supabase 数据库连接字符串 (`DATABASE_URL`) 和 Prisma 加速器地址 (`DATABASE_URL_WITH_ACCELERATE`)。

### 常用命令

- **启动开发服务器**: `pnpm dev`
- **生成 Prisma Client**: `pnpm prisma generate`
- **启动 Prisma Studio**: `pnpm prisma studio` (用于本地查看和编辑数据库)

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