# 🎯 项目当前状态

> **最后更新**：2025-11-14
> **当前阶段**：架构重构中（第 1 周 / 共 3 周）
> **优先级**：🔴 最高优先级

---

## 📌 当前正在做什么？

**正在执行：Clean Architecture + FSD 架构重构**

我们正在将一个 38K 行的车险数据分析平台从"意大利面条式代码"重构为符合工业标准的清晰架构。

---

## 🎯 重构目标

### 核心问题

- ❌ 状态管理混乱（新旧 Store 并存）
- ❌ 业务逻辑散落在 UI 组件中
- ❌ 重复代码严重（`normalizeChineseText` 调用 10+ 次）
- ❌ 单个文件过大（`use-app-store.ts` 1007 行）

### 目标架构

```
src/
├── domain/              ← 业务核心层（纯 TypeScript，无框架依赖）
│   ├── entities/        ← 业务实体（InsuranceRecord, KPI）
│   ├── rules/           ← 业务规则（纯函数：计算、验证、转换）
│   └── types/           ← 类型定义
│
├── application/         ← 应用层（用例编排）
│   ├── use-cases/       ← 用例（UploadData, CalculateKPI, ExportReport）
│   ├── ports/           ← 接口定义（IDataRepository, IFileParser）
│   └── services/        ← 应用服务
│
├── infrastructure/      ← 基础设施层（技术实现）
│   ├── adapters/        ← 适配器（DuckDB, CSV, PDF）
│   ├── api/             ← API 客户端（Supabase）
│   └── storage/         ← 存储实现（IndexedDB, LocalStorage）
│
├── features/            ← 功能切片（Feature-Sliced Design）
│   ├── data-upload/     ← 文件上传功能
│   ├── kpi-dashboard/   ← KPI 看板
│   ├── data-filter/     ← 数据筛选
│   └── data-export/     ← 数据导出
│
└── shared/              ← 共享资源
    ├── ui/              ← UI 组件库
    ├── hooks/           ← 通用 Hooks
    └── utils/           ← 工具函数
```

---

## 📅 当前进度

### ✅ 已完成

**阶段 0：准备工作**

- [x] 创建架构规则文档（`ARCHITECTURE_RULES.md`）
- [x] 创建重构计划（`REFACTORING_PLAN.md`）
- [x] 创建检查清单（`REFACTORING_CHECKLIST.md`）
- [x] 创建 AI 协作约定（`AI_COLLABORATION.md`）

**Day 1-2：Domain 层**

- [x] 创建 Domain 层目录结构
- [x] 提取保险实体（`InsuranceRecord`）
- [x] 提取业务规则（KPI 计算、数据规范化）
- [x] 编写单元测试

**Day 3-4：Application 层** ⭐ 刚完成

- [x] 定义端口接口（`IDataRepository`, `IFileParser`, `IExporter`）
- [x] 实现用例（`UploadDataUseCase`, `CalculateKPIUseCase`, `ExportReportUseCase`）
- [x] 创建应用服务（`DataService`）
- [x] 编写 22 个单元测试（全部通过）
- [x] 验证架构规则（依赖方向、文件大小、单一职责）

### 🔄 进行中（第 1 周：建立核心层）

**下一步任务**：Day 6-7 - 实现 Infrastructure 层适配器

- [ ] 实现 `DuckDBRepository`（数据仓储适配器）
- [ ] 实现 `CSVParser`（文件解析器适配器）
- [ ] 实现 `PDFExporter`（导出器适配器）
- [ ] 编写适配器测试

---

## 🚨 重要约束（AI 必须遵守）

### 核心架构规则

#### 1. 依赖方向法则（最重要！）

```
Infrastructure → Application → Domain
    (外层)          (中间层)      (核心层)

✅ Infrastructure 可以依赖 Application
✅ Application 可以依赖 Domain
❌ Domain 不能依赖 Application
❌ Domain 不能依赖 Infrastructure
❌ Domain 不能依赖 React
```

**检测方法**：

```bash
# 如果这个命令有输出 = 违反规则
grep -r "from 'react'" src/domain/
grep -r "fetch\|axios\|supabase" src/domain/
```

#### 2. 单一职责原则

- 一个文件 < 300 行
- 一个函数 < 50 行
- 能用一句话描述职责（不能用"和"连接）

#### 3. DRY 原则

- 复制粘贴代码 > 3 行 → 必须提取
- 相同逻辑出现 > 2 次 → 必须抽象

#### 4. 命名规范

- 文件：`kebab-case.ts`
- 组件：`PascalCase.tsx`
- 函数：`camelCase()`
- 常量：`UPPER_SNAKE_CASE`

---

## 📖 核心文档（AI 必读）

### 主文档（按优先级）

1. **[ARCHITECTURE_RULES.md](开发文档/04_refactoring/ARCHITECTURE_RULES.md)** ⭐⭐⭐⭐⭐
   - 底层规律（依赖方向、单一职责、关注点分离）
   - 架构原则（DRY、YAGNI、KISS）
   - 分层规则（完整目录结构）

2. **[REFACTORING_PLAN.md](开发文档/04_refactoring/REFACTORING_PLAN.md)** ⭐⭐⭐⭐
   - 3 周详细路线图
   - 每天的具体任务
   - 代码示例

3. **[REFACTORING_CHECKLIST.md](开发文档/04_refactoring/REFACTORING_CHECKLIST.md)** ⭐⭐⭐⭐
   - 提交前检查清单
   - 9 层详细检查项
   - 自动化检查脚本

4. **[AI_COLLABORATION.md](开发文档/04_refactoring/AI_COLLABORATION.md)** ⭐⭐⭐⭐
   - AI 如何遵守规则
   - 标准提示词模板
   - 自检机制

5. **[APPLICATION_LAYER_SUMMARY.md](开发文档/04_refactoring/APPLICATION_LAYER_SUMMARY.md)** ⭐⭐⭐⭐
   - Application 层实现总结
   - 架构验证结果
   - 单元测试报告

### 参考文档

- `开发文档/03_technical_design/duckdb_integration.md` - DuckDB 集成技术文档
- `开发文档/01_features/` - 各功能的详细文档

---

## 🤖 AI 协作指南

### 每次对话开始时，AI 必须：

1. **阅读这个文件**（`PROJECT_STATUS.md`）了解当前状态
2. **阅读架构规则**（`ARCHITECTURE_RULES.md`）了解约束
3. **确认当前任务**（见上面"进行中"部分）

### 生成代码前，AI 必须回答：

```markdown
## 代码生成前检查

1. **这段代码属于哪一层？**
   - [ ] Domain 层（业务核心）
   - [ ] Application 层（用例编排）
   - [ ] Infrastructure 层（技术实现）
   - [ ] Features 层（功能切片）

2. **会依赖哪些模块？**
   - 列出所有 import
   - 确认依赖方向正确（外→内）

3. **是否符合单一职责？**
   - 用一句话描述职责：******\_\_\_******

4. **是否有重复代码？**
   - 检查项目中是否已有类似代码
   - 如果有，复用而非重写
```

### 生成代码后，AI 必须自检：

```markdown
## 代码自检清单

- [ ] 依赖方向正确（外→内）
- [ ] 文件 < 300 行
- [ ] 函数 < 50 行
- [ ] 命名清晰一致
- [ ] 有必要的注释
- [ ] 有单元测试（Domain/Application 层）
```

---

## 🔍 快速参考

### 当前技术栈

- **框架**：Next.js 14 (App Router) + React 18
- **状态管理**：Zustand
- **数据库**：DuckDB (WASM)
- **类型**：TypeScript 5（严格模式）
- **测试**：Vitest + Playwright
- **样式**：Tailwind CSS

### 核心业务领域

- **保险记录**：26 个字段（保单号、保费、周次、机构等）
- **KPI 计算**：16 个核心指标（满期边际贡献率、赔付率等）
- **数据筛选**：多维度筛选（时间、空间、产品、客户、渠道）
- **数据导出**：CSV、PDF 格式

### 重构原则优先级

1. **依赖方向法则** ← 违反 = 立即拒绝
2. **单一职责** ← 文件/函数过大 = 必须拆分
3. **DRY** ← 重复代码 = 必须提取
4. **命名规范** ← 命名不清晰 = 必须改名

---

## 📞 联系方式

**项目负责人**：开发者本人
**Git 分支**：`feature/duckdb-integration`（当前分支）
**重构分支**：`refactor/clean-architecture`（即将创建）

---

## 🔄 状态更新记录

| 日期       | 状态            | 备注                         |
| ---------- | --------------- | ---------------------------- |
| 2025-01-14 | 🟡 准备阶段完成 | 已创建所有文档，准备开始重构 |
| 2025-01-13 | 🔴 规划中       | 头脑风暴架构方案             |

---

**最后更新**：2025-01-14 by Claude
**下次更新**：完成 Day 1-2 任务后
