# 代码风格和约定

## 代码格式化配置（Prettier）

### 基本规则
- **分号**: 不使用分号（`semi: false`）
- **引号**: 单引号（`singleQuote: true`）
- **缩进**: 2空格（`tabWidth: 2`）
- **行宽**: 80字符（`printWidth: 80`）
- **尾逗号**: ES5标准（`trailingComma: "es5"`）
- **箭头函数括号**: 尽可能省略（`arrowParens: "avoid"`）
- **换行符**: LF（`endOfLine: "lf"`）

## ESLint 规则

### 继承配置
- `next/core-web-vitals`
- `next/typescript`
- `plugin:prettier/recommended`

### 自定义规则
- `prettier/prettier`: warn（格式警告而非错误）
- `@typescript-eslint/no-unused-vars`: warn（未使用变量警告）
- `@typescript-eslint/no-explicit-any`: warn（any类型警告）

## TypeScript 配置

### 编译选项
- **目标**: ES2017
- **模块系统**: ESNext
- **严格模式**: 关闭（`strict: false`）
- **JSX**: preserve（由 Next.js 处理）
- **路径映射**: `@/*` → `./src/*`

### 排除目录
- `node_modules`
- 测试文件：`**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`
- 示例目录：`**/__examples__/**`, `**/__tests__/**`

## 命名约定

### 文件命名
- **组件文件**: kebab-case（如 `file-upload.tsx`）
- **Hook文件**: kebab-case，以 `use-` 开头（如 `use-kpi.ts`）
- **工具函数**: kebab-case（如 `data-parser.ts`）
- **类型文件**: kebab-case（如 `insurance-types.ts`）

### 代码命名
- **组件**: PascalCase（如 `FileUpload`, `KPICard`）
- **Hook**: camelCase，以 `use` 开头（如 `useKPI`, `useFilteredData`）
- **函数**: camelCase（如 `calculateKPI`, `filterData`）
- **常量**: UPPER_SNAKE_CASE（如 `MAX_FILE_SIZE`, `DEFAULT_FILTERS`）
- **类型/接口**: PascalCase（如 `InsuranceRecord`, `FilterOptions`）

## 项目结构约定

### 目录组织
```
src/
├── app/              # Next.js App Router 页面
├── components/       # React 组件
│   ├── features/    # 功能组件
│   ├── ui/          # UI基础组件
│   ├── charts/      # 图表组件
│   ├── filters/     # 筛选组件
│   └── layout/      # 布局组件
├── hooks/           # 自定义 Hooks
│   ├── domains/     # 领域相关 Hooks
│   └── utils/       # 工具 Hooks
├── lib/             # 库和工具
│   ├── calculations/  # 计算逻辑
│   ├── parsers/      # 数据解析
│   ├── storage/      # 存储管理
│   ├── validations/  # 数据验证
│   └── utils/        # 通用工具
├── store/           # 状态管理
├── types/           # TypeScript 类型定义
├── config/          # 配置文件
└── constants/       # 常量定义
```

## 最佳实践

### 性能优化
- 使用**细粒度选择器**从 Zustand store 中选择数据
- 避免在大数组上使用展开运算符（`...`）
- 使用 `reduce()` 替代 `Math.max(...array)`
- 合理使用 `useMemo` 和 `useCallback`

### 数据处理
- 所有数据必须通过 Zod Schema 验证
- 使用 DuckDB-WASM 处理大数据集（10万+行）
- CSV 解析使用 Papa Parse 的流式处理

### 组件开发
- 功能组件放在 `components/features/`
- 可复用 UI 组件放在 `components/ui/`
- 使用 Shadcn/ui 组件作为基础

### 状态管理
- 使用 Zustand 进行全局状态管理
- 避免依赖整个 `filters` 对象，使用细粒度选择
- 在 `useMemo` 依赖项中列出所有细粒度变量

## 注释规范
- 所有注释必须使用**中文**
- 复杂逻辑必须添加注释说明
- 公式计算必须注释业务含义
