# 代码库结构详解

## 目录树概览

```
chexianduoweifenxi/
├── .claude/              # Claude AI 配置和技能
│   └── skills/          # 自定义技能定义
├── .cursor/             # Cursor 编辑器配置
├── .github/             # GitHub 工作流和配置
├── .next/               # Next.js 构建输出（临时）
├── .serena/             # Serena MCP 服务器配置
├── configs/             # 配置文件目录
├── data/                # 测试数据文件
├── docs/                # 额外文档
├── node_modules/        # npm 依赖（忽略）
├── out/                 # 静态导出输出
├── public/              # 静态资源
├── scripts/             # 脚本文件
├── src/                 # 源代码主目录 ⭐
├── test-results/        # 测试结果输出
├── tests/               # 测试文件
├── tools/               # 工具脚本
├── 开发文档/             # 项目知识库 ⭐
├── package.json         # 项目配置和依赖
├── tsconfig.json        # TypeScript 配置
├── .prettierrc          # Prettier 配置
├── .eslintrc.json       # ESLint 配置
├── next.config.mjs      # Next.js 配置
├── tailwind.config.ts   # Tailwind CSS 配置
├── CLAUDE.md            # AI 协作指南
└── README.md            # 项目说明
```

## src/ 目录详细结构

### app/ - Next.js App Router

```
src/app/
├── page.tsx           # 首页（主仪表盘）
├── layout.tsx         # 根布局
├── globals.css        # 全局样式
└── api/              # API 路由
    ├── kpi/          # KPI 计算 API
    ├── etl/          # ETL 处理 API
    └── ingest-file/  # 文件导入 API
```

### components/ - React 组件

```
src/components/
├── features/          # 功能组件（业务逻辑）
│   ├── file-upload.tsx              # 文件上传
│   ├── kpi-card-with-drilldown.tsx  # KPI 卡片
│   ├── weekly-operational-trend.tsx # 周趋势图
│   ├── drill-down/                  # 下钻分析组件
│   └── ...
├── ui/               # 基础 UI 组件（Shadcn/ui）
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── charts/           # 图表组件
│   ├── bar-chart.tsx
│   ├── line-chart.tsx
│   └── ...
├── filters/          # 筛选组件
│   ├── date-range-filter.tsx
│   ├── organization-filter.tsx
│   └── ...
├── layout/           # 布局组件
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── ...
└── examples/         # 示例组件（开发参考）
```

### hooks/ - 自定义 Hooks

```
src/hooks/
├── domains/          # 领域特定 Hooks
│   ├── useKPICalculation.ts        # KPI 计算
│   ├── useTrendAnalysis.ts         # 趋势分析
│   └── ...
├── utils/            # 工具 Hooks
│   └── ...
├── use-kpi.ts                       # KPI 数据 Hook
├── use-filtered-data.ts             # 筛选数据 Hook
├── use-trend.ts                     # 趋势数据 Hook
├── use-file-upload.ts               # 文件上传 Hook
├── use-smart-comparison.ts          # 智能环比 Hook
└── ...
```

### lib/ - 库和工具

```
src/lib/
├── calculations/     # 业务计算逻辑
│   ├── kpi-calculator.ts           # KPI 计算器
│   ├── trend-analyzer.ts           # 趋势分析器
│   └── ...
├── parsers/          # 数据解析器
│   ├── csv-parser.ts               # CSV 解析
│   └── ...
├── storage/          # 存储管理
│   ├── data-persistence.ts         # 数据持久化
│   └── ...
├── validations/      # 数据验证
│   ├── insurance-schema.ts         # 保险数据 Schema
│   └── ...
├── database/         # 数据库相关
│   └── duckdb-client.ts            # DuckDB 客户端
├── export/           # 导出功能
│   ├── pdf-exporter.ts
│   ├── csv-exporter.ts
│   └── ...
├── charts/           # 图表配置
├── analytics/        # 分析工具
└── utils.ts          # 通用工具函数
```

### store/ - 状态管理

```
src/store/
├── use-app-store.ts        # 主应用状态（Zustand）
├── drill-down-store.ts     # 下钻分析状态
└── ...
```

### types/ - TypeScript 类型定义

```
src/types/
├── insurance.ts            # 保险数据类型
├── kpi.ts                  # KPI 相关类型
├── filters.ts              # 筛选器类型
├── drill-down.ts           # 下钻分析类型
└── ...
```

### 其他目录

```
src/
├── config/           # 配置文件
│   └── constants.ts  # 常量配置
├── constants/        # 常量定义
├── domain/           # 领域模型（DDD）
├── application/      # 应用层（DDD）
├── infrastructure/   # 基础设施层（DDD）
└── services/         # 服务层
```

## 开发文档/ 目录结构

```
开发文档/
├── 00_conventions.md         # 协作约定和原则
├── README.md                 # 项目总览仪表盘
├── 01_features/              # 功能卡片
│   ├── F001_data_import/     # 数据导入
│   ├── F002_kpi_dashboard/   # KPI看板
│   ├── F003_trend_analysis/  # 趋势分析
│   ├── F004_filters/         # 多维筛选
│   ├── F005_structure_analysis/  # 结构分析
│   ├── F006_data_export/     # 数据导出
│   └── F007_calculation_verification/ # 计算验证
├── 02_decisions/             # 架构决策记录
│   ├── ADR-001_状态管理选型-Zustand.md
│   ├── ADR-002_CSV解析策略-流式处理.md
│   └── ...
├── 03_technical_design/      # 技术设计文档
│   ├── tech_stack.md         # 技术栈详解
│   ├── data_architecture.md  # 数据架构
│   └── core_calculations.md  # 核心计算逻辑
└── archive/                  # 历史文档归档
    ├── PRD-best.md           # 原始需求文档
    ├── PROGRESS.md           # 开发进度记录
    └── ...
```

## 关键文件说明

### 配置文件

- `package.json`: 项目依赖和脚本定义
- `tsconfig.json`: TypeScript 编译配置
- `next.config.mjs`: Next.js 框架配置
- `tailwind.config.ts`: Tailwind CSS 样式配置
- `.prettierrc`: 代码格式化规则
- `.eslintrc.json`: 代码检查规则

### 入口文件

- `src/app/page.tsx`: 应用主页面入口
- `src/app/layout.tsx`: 根布局组件
- `src/store/use-app-store.ts`: 全局状态管理

### 核心业务文件

- `src/lib/validations/insurance-schema.ts`: 数据验证 Schema
- `src/lib/calculations/kpi-calculator.ts`: KPI 计算逻辑
- `src/hooks/use-kpi.ts`: KPI 数据 Hook
- `src/components/features/file-upload.tsx`: 文件上传组件

## 文件组织原则

1. **按功能分组**: 功能相关的组件放在 `components/features/`
2. **可复用性**: 通用组件放在 `components/ui/`
3. **关注点分离**: 业务逻辑在 `lib/`, UI 在 `components/`
4. **类型集中**: 所有类型定义在 `types/`
5. **状态管理**: Zustand store 在 `store/`
6. **自定义逻辑**: Hooks 在 `hooks/`

## 导入路径规范

使用路径别名 `@/` 引用 `src/` 目录：

```typescript
// ✅ 推荐
import { Button } from '@/components/ui/button'
import { useKPI } from '@/hooks/use-kpi'
import { InsuranceRecord } from '@/types/insurance'

// ❌ 避免
import { Button } from '../../components/ui/button'
```
