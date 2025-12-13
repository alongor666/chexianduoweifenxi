# 开发指南和特殊注意事项

## 核心开发原则

### 1. 代码优先原则

- **定义**: 代码是唯一事实来源（Code is the Single Source of Truth）
- **实践**:
  - 优先修改现有代码，而非新建文件
  - 代码变更后立即更新文档
  - 使用 `node analyze-codebase.js` 验证实现状态

### 2. 小步快跑，持续验证

- 每次只做一个小功能或修复
- 完成后立即运行 `pnpm dev` 验证
- 确保每一步都稳固可靠

### 3. 文档同步，保持鲜活

- 代码变更必须同步更新 `开发文档/`
- 特别是数据结构、核心逻辑、开发流程的调整

### 4. 中文优先

- 所有代码注释使用中文
- 文档和用户界面使用中文
- 与用户沟通使用中文

## 性能优化关键点

### 大数据处理优化

#### 问题背景

处理 16万+ 行、30MB+ 文件时可能触发堆栈溢出（`RangeError: Maximum call stack size exceeded`）

#### 核心原则

1. **禁止在大数组上使用展开运算符**

```typescript
// ❌ 错误：超过调用栈限制（约10万参数）
const maxWeek = Math.max(...filteredData.map(r => r.week_number))

// ✅ 正确：使用 reduce（线性复杂度，无调用栈限制）
const maxWeek = filteredData.reduce((max, r) => Math.max(max, r.week_number), 0)
```

2. **使用细粒度选择器模式**

```typescript
// ❌ 错误：依赖整个对象
const filters = useAppStore(state => state.filters)

// ✅ 正确：使用细粒度选择
const years = useAppStore(state => state.filters.years)
const organizations = useAppStore(state => state.filters.organizations)
const insuranceTypes = useAppStore(state => state.filters.insuranceTypes)
```

3. **正确配置 useMemo 依赖项**

```typescript
// 在 useMemo 依赖项中列出所有细粒度变量
const kpiData = useMemo(() => {
  // 计算逻辑
}, [years, organizations, insuranceTypes, ...]) // 所有细粒度变量
```

### 已应用优化的模块

- `src/hooks/use-kpi.ts`
- `src/hooks/use-smart-comparison.ts`
- `src/store/use-app-store.ts`

## 数据处理规范

### CSV 上传处理

1. 使用 Papa Parse 流式解析
2. 通过 Zod Schema 严格验证
3. 存储到 IndexedDB/LocalStorage
4. 可选同步到 Supabase

### 数据验证

- 所有输入数据必须通过 Zod 验证
- 验证失败提供清晰的错误信息
- 关键字段：
  - `snapshot_date`: 周末日期（每周六）
  - `organization_name`: 机构名称
  - `customer_category`: 客户类别
  - `insurance_type`: 险种类型

### 缺失数据处理

- 智能跳过缺失的周次（最多5周）
- 自动查找最近的有效数据周
- 详细日志输出便于排查

## 状态管理最佳实践

### Zustand Store 使用

1. 避免依赖整个 store 对象
2. 使用细粒度选择器
3. 在组件中正确配置 `useMemo` 依赖
4. 避免不必要的重渲染

### 示例

```typescript
// 在 Hook 中
const useMyHook = () => {
  // 细粒度选择
  const years = useAppStore(state => state.filters.years)
  const orgs = useAppStore(state => state.filters.organizations)

  const result = useMemo(() => {
    // 计算逻辑
  }, [years, orgs]) // 依赖所有细粒度变量

  return result
}
```

## UI 组件开发

### 组件分类

1. **功能组件** (`components/features/`): 包含业务逻辑
2. **UI 组件** (`components/ui/`): 纯展示组件
3. **图表组件** (`components/charts/`): 数据可视化
4. **筛选组件** (`components/filters/`): 数据筛选

### 组件开发规范

- 使用 TypeScript 定义 props 类型
- 功能组件提取业务逻辑到 Hook
- 使用 Shadcn/ui 作为基础组件
- 响应式设计，支持多设备

## 测试要求

### 单元测试（Vitest）

- Hook 必须有单元测试
- 计算逻辑必须有测试覆盖
- 使用 `pnpm test` 运行

### E2E 测试（Playwright）

- 关键用户流程必须有 E2E 测试
- 使用 `pnpm test:e2e` 运行

### 手动测试

- 大数据文件测试（10万+ 行）
- 多浏览器兼容性测试
- 响应式布局测试

## 部署注意事项

### 环境配置

1. **本地开发**: 使用 IndexedDB/LocalStorage
2. **生产部署**: 静态导出模式
3. **可选 Supabase**: 配置环境变量

### 构建优化

- 设置 Node.js 内存限制：`--max-old-space-size=2048`
- 使用 `pnpm build:static` 生成静态文件
- 输出到 `out/` 目录

### 部署平台

- 推荐：Vercel（自动部署）
- 备选：Cloudflare Pages, GitHub Pages, Netlify

## 常见问题和解决方案

### 1. 堆栈溢出错误

- **症状**: `RangeError: Maximum call stack size exceeded`
- **原因**: 大数组使用展开运算符
- **解决**: 使用 `reduce()` 或循环

### 2. 无限重渲染

- **症状**: 组件频繁刷新，浏览器卡顿
- **原因**: `useMemo` 依赖项配置错误
- **解决**: 使用细粒度选择器

### 3. 数据验证失败

- **症状**: CSV 上传失败
- **原因**: 数据格式不符合 Schema
- **解决**: 检查 `insurance-schema.ts` 验证规则

### 4. TypeScript 类型错误

- **症状**: 编译失败
- **原因**: 类型定义不匹配
- **解决**: 检查并更新类型定义

## 开发工作流建议

### 日常开发

1. 拉取最新代码：`git pull`
2. 启动开发服务器：`pnpm dev`
3. 开发功能并测试
4. 运行 lint：`pnpm lint`
5. 提交代码：`git commit`

### 重大变更

1. 创建功能分支
2. 开发并测试
3. 运行完整测试：`pnpm test && pnpm test:e2e`
4. 代码分析：`node analyze-codebase.js`
5. 更新文档
6. 提交 PR

### 文档维护

1. 代码变更后立即更新功能卡片
2. 重大决策创建 ADR 文档
3. 每周运行一次代码分析工具
4. 保持文档与代码一致

## macOS/Darwin 特定注意事项

### 系统命令

- 使用 `ls -la` 而非 `ll`
- 文件路径区分大小写
- 换行符使用 LF（`endOfLine: "lf"`）

### 性能监控

```bash
# 查看 Node 进程
ps aux | grep node

# 监控内存使用
top -pid <PID>
```

## 资源链接

### 官方文档

- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Zustand: https://docs.pmnd.rs/zustand
- Tailwind CSS: https://tailwindcss.com/docs

### 项目文档

- 协作约定: `开发文档/00_conventions.md`
- 功能清单: `开发文档/01_features/`
- 技术决策: `开发文档/02_decisions/`
- 技术栈: `开发文档/03_technical_design/tech_stack.md`
