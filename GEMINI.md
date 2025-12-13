本文档是与 AI 协作者 Claude Code 进行高效协作的核心指南，旨在通过提供高级原则、关键入口和统一的知识库链接，确保开发过程的连贯性与高质量。

## 使用Chrome DevTools 插件直接看问题

## 核心原则：五条黄金法则

1. **优先修改，而非新建**：尽可能在现有代码和文件结构上进行迭代，避免不必要的文件增删。
2. **小步快跑，持续验证**：每次只做一个小功能或修复，完成后立即在本地运行 `pnpm dev` 进行验证，确保每一步都稳固可靠。
3. **文档同步，保持鲜活**：代码的任何变更，尤其是数据结构、核心逻辑或开发流程的调整，都必须同步更新到 `开发文档/` 目录下的相关文档中。
4. **保持代码质量**：在所有修改中，保持代码的质量和可维护性。避免引入新的错误或问题。
5. **中文沟通**：使用中文与用户沟通，且在所有文档中保持中文。代码中所有的注释等都必须使用中文。

## AI 协作约束

### 代码修复强制流程

#### 1. 修复 ESLint 问题时

```bash
# ❌ 错误：看到 unused-vars 就加下划线
const _data = getData()  # 声明
data.map(...)           # 使用（TypeScript 会报错）

# ✅ 正确：先判断是否真的未使用
# 场景 A：确实未使用 → 删除或加下划线
const _unusedData = getData()  # 完全不使用

# 场景 B：实际使用 → 保持原名
const data = getData()
data.map(...)
```

#### 2. 强制验证顺序

```bash
# 修复任何代码问题后，必须按顺序执行：
pnpm lint && pnpm tsc --noEmit && pnpm build

# 任何一步失败，必须继续修复，不得声称“已完成”
```

#### 3. 变量命名检查清单

修改变量名称前，必须回答以下问题：

- 该变量在代码中是否被实际使用？
- 修改后的名称与使用处是否一致？
- 是否会导致其他检查项（tsc/build）失败？

#### 4. 禁止的修复模式

- ❌ 为消除 lint 告警而给实际使用的变量加 `_` 前缀
- ❌ 修复 lint 后不验证 TypeScript 类型检查
- ❌ 修复类型问题后不验证构建
- ❌ 只修复报错行，不理解报错原因

#### 5. AI 必须遵守的工作流

遇到问题
↓
读取完整错误信息（不要只看第一行）
↓
定位到具体代码 + 上下文（不要只看报错行）
↓
理解问题根源（不要做表面修复）
↓
提出修复方案（说明修复理由）
↓
执行修复
↓
运行完整验证链（lint + tsc + build）
↓
确认所有检查通过

## 开发新功能前的强制检查清单 ⚠️

**在开始任何新功能开发之前，必须按顺序完成以下检查：**

### 1️⃣ 阅读架构规范（强制）

```bash
# 必读文档顺序：
1. 开发文档/03_technical_design/core_calculations.md  # KPI计算规则
2. 开发文档/03_technical_design/architecture_refactoring.md  # 分层架构
3. 开发文档/03_technical_design/data_architecture.md  # 数据模型
```

### 2️⃣ 确认遵循分层架构

- ✅ **Hook层**：只能调用Domain层函数，不得直接进行数学计算
- ✅ **组件层**：只能调用Hook，不得包含业务逻辑
- ✅ **Domain层**：所有KPI计算必须在 `src/domain/rules/kpi-calculator-enhanced.ts`
- ❌ **禁止**：在Hook或组件中直接写 `(a / b) * 100` 等计算公式

### 3️⃣ 检查是否需要新增指标

如果需要计算新的指标：

1. 先在 `core_calculations.md` 中定义指标的计算公式和业务含义
2. 在Domain层的 `kpi-calculator-enhanced.ts` 中实现计算函数
3. 导出函数供Hook和组件使用
4. **禁止**在多个文件中重复实现相同的计算逻辑

### 4️⃣ 命名规范检查

- Domain层使用 `camelCase`（例如：`lossRatio`）
- Types/数据库层使用 `snake_case`（例如：`loss_ratio`）
- 使用映射工具进行双向转换，不要手动重命名

### 5️⃣ 参考正确的代码模式

**✅ 正确示例**（Hook调用Domain层）：

```typescript
import { calculateLossRatio } from '@/domain/rules/kpi-calculator-enhanced'

const lossRatio = calculateLossRatio(reportedClaim, maturedPremium)
```

**❌ 错误示例**（直接计算）：

```typescript
const lossRatio = maturedPremium > 0
  ? (reportedClaim / maturedPremium) * 100
  : null
```

## 最小化工作流

`阅读架构文档` -> `阅读代码` -> `提议修改` -> `执行修改` -> `本地验证` -> `更新文档`

1. **阅读架构文档**：先阅读上述强制检查清单中的架构规范文档。
2. **阅读代码**：在开始修改之前，先彻底理解代码的功能、上下文和潜在影响。
3. **提议修改**：根据理解，提出具体的修改建议，包括代码变更、架构调整或文档更新。
4. **执行修改**：将 AI 建议的修改直接应用到代码中，确保符合项目的编码规范和最佳实践。
5. **本地验证**：在本地运行项目，验证修改后的功能是否按预期工作，没有引入新的错误或问题。
6. **更新文档**：根据修改内容，同步更新 `开发文档/` 目录下的相关文档，确保文档与代码保持一致。

## 关键入口点

- **数据模型与验证规则**:

  - `prisma/schema.prisma`: 数据库表结构的唯一真实来源。
  - `src/lib/schema/insurance.ts`: Zod 定义的数据验证 schema。
  - `开发文档/03_technical_design/data_architecture.md`: 数据架构、字段定义和CSV导入规范的详细文档。
- **核心业务逻辑**:

  - `src/app/api/kpi/route.ts`: 后端 KPI 计算的核心 API 端点。
  - `开发文档/03_technical_design/core_calculations.md`: 所有核心KPI的计算公式与业务逻辑。
- **前端页面与组件**:

  - `src/app/page.tsx`: 应用主页面，包含布局和核心组件集成。
  - `src/components/data-table.tsx`: 核心数据展示表格。
- **技术栈与环境**:

  - `开发文档/03_technical_design/tech_stack.md`: 包含项目技术选型、关键库和本地开发环境设置的完整指南。

## 知识库导航

- **📖 知识库索引**: `开发文档/KNOWLEDGE_INDEX.md` - 自动生成的完整文档导航
  - 📊 知识库概览统计（功能模块、技术决策、技术设计、重构文档）
  - 🔥 最近30天更新的文档快速访问
  - 🎯 13个功能模块详细索引（按优先级组织）
  - 🏗️ 3个技术决策记录（ADR）
  - ⚙️ 10个技术设计文档
  - 🔧 8个重构文档
  - 🏷️ **NEW: 标签索引** - 按标签快速查找相关文档
  - 🔗 **NEW: 文档依赖关系图** - 显示文档之间的引用关系和核心文档
  - **更新命令**: `pnpm docs:index` - 文档变更后运行此命令更新索引

## 文档管理工具

### 📚 知识库索引生成

```bash
# 扫描开发文档并生成索引（包含标签索引和依赖关系图）
pnpm docs:index
```

### 🗂️ 归档清理工具

```bash
# 分析归档文档（仅报告）
pnpm docs:archive:analyze

# 交互式清理归档
pnpm docs:archive:clean

# 自动清理预览（dry-run）
pnpm docs:archive:auto-clean
```

### 🤖 CI/CD 集成

- **检查索引**: PR 创建时自动检查文档索引是否最新
- **自动更新**: PR 中文档变更时自动更新索引并提交

## 文档约束

- **除非用户明确要求，否则不要直接修改本文件**（以及同类协作导航文件：`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`）。所有项目相关的知识、设计和流程都应归档至 `开发文档/` 目录中，这些协作导航文件只作为高级指引和链接入口。
- **将 `开发文档/` 视为活文档**，与代码和功能保持同步更新。
- **使用标签**: 在文档 frontmatter 中添加 `tags: [tag1, tag2]` 或在内容中使用 `#标签` 来提高文档可发现性。
- **维护引用**: 文档间使用相对路径链接，工具会自动分析依赖关系。
