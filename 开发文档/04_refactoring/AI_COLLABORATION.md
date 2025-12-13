# 🤖 AI 协作约定

> **目标**：让 AI 助手严格遵守项目的架构规则
> **适用于**：Claude、ChatGPT、Cursor、GitHub Copilot 等所有 AI 工具

---

## 📋 目录

1. [为什么需要 AI 协作约定](#为什么需要-ai-协作约定)
2. [上下文注入模板](#上下文注入模板)
3. [提示词工程（Prompt Engineering）](#提示词工程)
4. [常见场景的标准提示词](#常见场景的标准提示词)
5. [AI 自检机制](#ai-自检机制)
6. [错误纠正流程](#错误纠正流程)

---

## 为什么需要 AI 协作约定？

### AI 的常见问题

```
❌ AI 不知道你的架构规则
   → 生成的代码不符合分层结构

❌ AI 倾向于"快速解决问题"
   → 忽视长期可维护性

❌ AI 可能生成"过度设计"的代码
   → 违反 YAGNI 原则

❌ AI 不知道项目历史
   → 重复造轮子，不复用现有代码
```

### 解决方案

**通过明确的约定和提示词，让 AI**：

- ✅ 理解项目架构
- ✅ 遵守代码规范
- ✅ 生成可维护的代码
- ✅ 主动检查架构违规

---

## 上下文注入模板

### 每次对话开始时使用

将以下内容复制到 AI 对话的**第一条消息**中：

```markdown
# 项目架构上下文

你正在协助一个遵循 **Clean Architecture + Feature-Sliced Design** 的车险数据分析平台项目。

## 核心架构规则（不可违反）

1. **依赖方向法则**：依赖只能从外向内
   - Infrastructure → Application → Domain
   - Domain 层不能依赖任何框架（包括 React）
   - Application 层不能依赖具体实现（只依赖接口）

2. **单一职责原则**：一个模块只有一个改变的理由
   - 文件 < 300 行
   - 函数 < 50 行
   - 能用一句话描述职责

3. **关注点分离**：不同性质的逻辑必须物理隔离
   - 数据层：获取、存储数据
   - 业务层：业务规则、计算
   - 展示层：UI 渲染

4. **DRY 原则**：不要重复自己
   - 复制粘贴代码 > 3 行 → 必须提取
   - 相同逻辑出现 > 2 次 → 必须抽象

## 项目目录结构
```

src/
├── domain/ ← 业务核心层（纯 TypeScript，无框架依赖）
│ ├── entities/ ← 业务实体（InsuranceRecord, KPI）
│ ├── rules/ ← 业务规则（纯函数）
│ └── types/ ← 类型定义
│
├── application/ ← 应用层（用例编排）
│ ├── use-cases/ ← 用例（UploadData, CalculateKPI）
│ ├── ports/ ← 接口定义（IDataRepository, IFileParser）
│ └── services/ ← 应用服务
│
├── infrastructure/ ← 基础设施层（技术实现）
│ ├── adapters/ ← 适配器（DuckDB, CSV, PDF）
│ ├── api/ ← API 客户端
│ └── storage/ ← 存储实现
│
├── features/ ← 功能切片（FSD）
│ ├── data-upload/ ← 文件上传功能
│ ├── kpi-dashboard/ ← KPI 看板
│ └── data-filter/ ← 数据筛选
│
└── shared/ ← 共享资源
├── ui/ ← UI 组件库
├── hooks/ ← 通用 Hooks
└── utils/ ← 工具函数

```

## 技术栈

- **框架**：Next.js 14 (App Router) + React 18
- **状态管理**：Zustand
- **数据库**：DuckDB (WASM)
- **类型**：TypeScript（严格模式）
- **测试**：Vitest + Playwright

## 在生成代码前，请先回答：

1. **这段代码属于哪一层？**（Domain / Application / Infrastructure）
2. **会依赖哪些模块？**（确保依赖方向正确）
3. **是否符合单一职责原则？**（能用一句话描述职责吗？）
4. **是否有重复代码？**（是否可以复用现有代码？）

## 生成代码后，请自检：

- [ ] 依赖方向正确（外→内）
- [ ] 文件 < 300 行
- [ ] 函数 < 50 行
- [ ] 命名清晰一致
- [ ] 有必要的注释
- [ ] 有单元测试（如果是 Domain/Application 层）

---

**理解以上内容后，请回复"已理解项目架构规则"，然后我们开始工作。**
```

---

## 提示词工程

### 结构化提示词模板

#### 模板 1：生成新代码

```markdown
## 任务

[清晰描述要做什么]

## 架构约束

- **目标层级**：[Domain / Application / Infrastructure / Features]
- **依赖规则**：只能依赖 [具体层级]
- **职责**：[用一句话描述单一职责]

## 质量要求

- [ ] 文件 < 300 行
- [ ] 函数 < 50 行
- [ ] 包含单元测试（如果是 Domain/Application 层）
- [ ] 包含 JSDoc 注释
- [ ] 命名清晰一致

## 参考现有代码

[如果有类似的代码，指出位置]

## 示例

请在 `src/domain/rules/kpi-calculator.ts` 中创建计算函数：

**任务**：计算满期边际贡献率

**架构约束**：

- 目标层级：Domain 层
- 依赖规则：只能依赖 `domain/entities/Insurance.ts`
- 职责：根据保险记录计算满期边际贡献率

**质量要求**：

- 纯函数（无副作用）
- 有单元测试
- 有 JSDoc 注释

**公式**：
满期边际贡献率 = 满期保费 / 总保费
```

---

#### 模板 2：重构现有代码

```markdown
## 重构任务

重构文件：[文件路径]

## 当前问题

- [ ] 违反了哪些架构规则？
- [ ] 职责是否混乱？
- [ ] 是否有重复代码？

## 重构目标

- [ ] 符合哪个架构规则？
- [ ] 拆分成哪些模块？
- [ ] 预期文件行数？

## 重构步骤

请按以下步骤进行：

1. **分析现状**：列出当前代码的问题
2. **制定计划**：说明重构策略
3. **执行重构**：提供重构后的代码
4. **验证结果**：检查是否符合架构规则

## 保留功能

重构后必须保持以下功能不变：

- [功能 1]
- [功能 2]

## 示例

重构 `src/store/use-app-store.ts`（当前 1007 行）：

**当前问题**：

- 违反单一职责原则（包含数据、筛选、缓存、持久化 4 个职责）
- 文件过大（1007 行）

**重构目标**：

- 拆分为 4 个独立的 Store
- 每个 Store < 200 行
- 职责单一

**重构步骤**：

1. 分析现状：识别 4 个职责
2. 制定计划：创建 dataStore、filterStore、cacheStore、persistStore
3. 执行重构：提供拆分后的代码
4. 验证结果：检查依赖关系
```

---

#### 模板 3：功能开发

```markdown
## 功能需求

[用户故事或功能描述]

## 架构设计

在开始编码前，请先设计：

1. **哪些层会被修改？**
   - Domain: [是/否]，修改内容：
   - Application: [是/否]，修改内容：
   - Infrastructure: [是/否]，修改内容：
   - Features: [是/否]，修改内容：

2. **会创建哪些新文件？**
   - 文件路径
   - 职责描述
   - 预期行数

3. **会修改哪些现有文件？**
   - 文件路径
   - 修改原因
   - 风险评估

4. **依赖关系是否正确？**
   - 画出依赖图
   - 确保符合依赖方向法则

## 开发步骤

1. **Domain 层**（如需要）：业务实体和规则
2. **Application 层**（如需要）：用例和接口
3. **Infrastructure 层**（如需要）：具体实现
4. **Features 层**：UI 和交互
5. **测试**：单元测试 + 集成测试

## 示例

功能：支持导出 PDF 报告

**架构设计**：

1. **哪些层会被修改？**
   - Domain: 否
   - Application: 是，新增 `ExportReportUseCase`
   - Infrastructure: 是，新增 `PDFExporter` 适配器
   - Features: 是，新增 `data-export` 功能

2. **新文件**：
   - `src/application/use-cases/export-report.ts` (100 行)
   - `src/infrastructure/adapters/PDFExporter.ts` (200 行)
   - `src/features/data-export/ui/ExportButton.tsx` (80 行)

3. **依赖关系**：
   ExportButton → ExportReportUseCase → IExporter ← PDFExporter
```

---

## 常见场景的标准提示词

### 场景 1：创建新的业务规则

````markdown
请在 Domain 层创建新的业务规则函数：

**文件路径**：`src/domain/rules/[规则名称].ts`

**函数签名**：

```typescript
/**
 * [函数描述]
 * @param [参数] - [参数描述]
 * @returns [返回值描述]
 */
export function [函数名]([参数列表]): [返回类型] {
  // 实现
}
```
````

**要求**：

- 纯函数（无副作用）
- 有完整的 JSDoc 注释
- 包含单元测试
- 函数 < 50 行

**示例数据**：
[提供测试数据]

````

---

### 场景 2：创建新的 Use Case

```markdown
请在 Application 层创建新的用例：

**文件路径**：`src/application/use-cases/[用例名称].ts`

**用例类结构**：
```typescript
export class [用例名]UseCase {
  constructor(
    private [依赖1]: [接口类型],
    private [依赖2]: [接口类型]
  ) {}

  async execute([参数]): Promise<[结果类型]> {
    // 1. 验证输入
    // 2. 调用 Domain 层业务规则
    // 3. 调用 Port 接口
    // 4. 返回结果
  }
}
````

**要求**：

- 依赖通过构造函数注入
- 不包含业务逻辑（业务逻辑在 Domain 层）
- 只负责编排
- 有单元测试（使用 Mock）

````

---

### 场景 3：创建新的 Feature

```markdown
请按照 Feature-Sliced Design 创建新功能：

**功能名称**：[功能名]
**目录结构**：
````

src/features/[feature-name]/
├── ui/
│ ├── [MainComponent].tsx ← 主组件
│ └── [SubComponent].tsx ← 子组件
├── model/
│ ├── use[FeatureName].ts ← 自定义 Hook
│ └── [feature]Store.ts ← 状态管理
├── lib/
│ └── [helpers].ts ← 工具函数
└── index.ts ← 公开接口

````

**要求**：
- 通过 `index.ts` 暴露公开接口
- UI 组件不包含业务逻辑
- Hook 调用 Application 层的 Use Case
- 每个文件 < 200 行

**公开接口示例**：
```typescript
// src/features/[feature-name]/index.ts
export { [MainComponent] } from './ui/[MainComponent]'
export { use[FeatureName] } from './model/use[FeatureName]'
export type { [FeatureTypes] } from './types'
````

````

---

### 场景 4：重构大文件

```markdown
请重构以下大文件：

**文件路径**：[文件路径]
**当前行数**：[行数]
**问题**：[列出问题]

**重构策略**：

1. **职责分析**
   - 识别该文件包含的所有职责
   - 每个职责的代码行数

2. **拆分方案**
   - 拆分成哪几个文件
   - 每个文件的职责
   - 文件之间的依赖关系

3. **迁移路径**
   - 第一步：拆分什么
   - 第二步：拆分什么
   - ...

**示例**：

重构 `use-app-store.ts`（1007 行）

**职责分析**：
- 数据管理（300 行）
- 筛选管理（200 行）
- 缓存管理（150 行）
- 持久化管理（150 行）
- 目标管理（207 行）

**拆分方案**：
1. `dataStore.ts` - 数据管理
2. `filterStore.ts` - 筛选管理
3. `cacheStore.ts` - 缓存管理
4. `persistStore.ts` - 持久化管理
5. `targetStore.ts` - 目标管理

**迁移路径**：
1. 创建 5 个新文件
2. 逐个迁移功能（保持可运行）
3. 更新引用
4. 删除旧文件
````

---

## AI 自检机制

### 生成代码后的自检提示

```markdown
## 请按照以下清单自检生成的代码：

### 架构合规性

- [ ] 依赖方向正确（外→内）？
- [ ] 没有跨层导入？
- [ ] 符合所在层的职责？

### 代码质量

- [ ] 文件 < 300 行？
- [ ] 函数 < 50 行？
- [ ] 没有重复代码？
- [ ] 命名清晰一致？

### 单一职责

- [ ] 能用一句话描述职责？
- [ ] 只有一个改变的理由？

### 测试覆盖

- [ ] Domain/Application 层有单元测试？
- [ ] 测试覆盖关键路径？

### 文档

- [ ] 复杂逻辑有注释？
- [ ] 公开接口有 JSDoc？

---

**如果有任何一项未通过，请说明原因并提供改进方案。**
```

---

### 强制自检提示词

在生成代码的提示词末尾加上：

````markdown
---

**生成代码后，请按照 [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) 进行自检。**

**自检格式**：

```markdown
## 自检结果

### ✅ 通过的检查项

- [x] 依赖方向正确
- [x] 文件 < 300 行
- ...

### ❌ 未通过的检查项

- [ ] 函数 > 50 行（`calculateTotal` 函数有 65 行）

### 🔧 改进方案

- 将 `calculateTotal` 拆分为 `calculateSubtotal` 和 `calculateTax`
```
````

---

## 错误纠正流程

### 当 AI 生成的代码违反规则时

#### Step 1：明确指出违规

```markdown
❌ 你生成的代码违反了以下规则：

**违规 1**：依赖方向错误

- 位置：`src/domain/rules/kpi-calculator.ts:15`
- 问题：Domain 层导入了 React（`import { useMemo } from 'react'`）
- 规则：Domain 层不能依赖任何框架

**违规 2**：单一职责违反

- 位置：`src/features/data-upload/ui/FileUpload.tsx`
- 问题：组件包含业务逻辑（KPI 计算）
- 规则：UI 组件只负责渲染

请修正这些问题。
```

---

#### Step 2：提供正确示例

````markdown
## 正确的做法：

**违规 1 的正确做法**：

```typescript
// ✅ 正确：Domain 层不使用 React hooks
export function calculateKPI(records: InsuranceRecord[]): KPIResult {
  // 纯函数实现，无副作用
  return {...}
}

// 在 Infrastructure 层（Hook 中）使用 useMemo
export function useKPIData() {
  const records = useDataStore(state => state.records)
  const kpi = useMemo(() => calculateKPI(records), [records])
  return kpi
}
```
````

**违规 2 的正确做法**：

```typescript
// ✅ 正确：UI 组件只负责渲染
function FileUpload() {
  const { uploadFile } = useFileUpload()  // Hook 调用 Use Case
  return <button onClick={uploadFile}>上传</button>
}

// 业务逻辑在 Application 层
class UploadDataUseCase {
  execute(file: File) {
    // 业务逻辑
  }
}
```

---

#### Step 3：要求重新生成

```markdown
请按照正确的做法重新生成代码，并确保：

1. 通过所有自检项
2. 说明修改了什么
3. 解释为什么这样修改
```

---

## 高级技巧：角色扮演

### 让 AI 扮演架构审查员

````markdown
## 角色设定

你现在是一个严格的架构审查员，负责审查代码是否符合 Clean Architecture 规则。

## 审查标准

使用 [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) 作为审查清单。

## 审查模式

**严格模式**：任何违规都必须拒绝
**建议模式**：可以给出警告和改进建议

## 审查输出格式

```markdown
## 代码审查报告

### 📊 评分：[0-100]

### ✅ 通过的检查项（[X]/[Y]）

- [x] 依赖方向正确
- [x] 文件大小合理
- ...

### ❌ 违规项（[X]项）

1. **严重违规**：[描述]
   - 位置：[文件:行号]
   - 影响：[影响说明]
   - 必须修复

2. **警告**：[描述]
   - 位置：[文件:行号]
   - 影响：[影响说明]
   - 建议修复

### 💡 改进建议

- [建议 1]
- [建议 2]

### 🎯 总体评价

[总体评价，是否可以通过审查]
```
````

---

现在，请审查以下代码：

[粘贴代码]

````

---

## 最佳实践总结

### ✅ 做这些

1. **始终提供上下文**
   - 每次对话开始时注入架构上下文
   - 说明当前项目的阶段和目标

2. **使用结构化提示词**
   - 明确任务、约束、要求
   - 提供示例和参考代码

3. **要求 AI 自检**
   - 生成代码后要求按检查清单自检
   - 发现问题时要求改进方案

4. **分步进行**
   - 先设计，再编码
   - 先分析，再重构
   - 一次只做一件事

5. **保存有效的提示词**
   - 把有效的提示词保存为模板
   - 不断优化和迭代

---

### ❌ 不要做这些

1. **不要省略上下文**
   - 不要假设 AI 记得之前的规则
   - 每次对话都要重新注入

2. **不要模糊的指令**
   - ❌ "帮我重构这段代码"
   - ✅ "按照 Clean Architecture 规则重构这段代码，将业务逻辑移到 Domain 层"

3. **不要盲目接受 AI 的输出**
   - 必须人工审查
   - 必须运行测试验证

4. **不要一次做太多**
   - 不要让 AI 一次重构整个项目
   - 分阶段、分模块进行

5. **不要忽视 AI 的警告**
   - 如果 AI 提示"这可能违反规则"
   - 必须仔细检查

---

## 附录：快速参考

### 常用提示词片段

```markdown
# 依赖检查
请确保这段代码没有违反依赖方向法则（外→内）。

# 单一职责检查
请用一句话描述这个模块的职责。如果需要用"和"连接，说明违反了单一职责原则。

# 重复代码检查
请检查这段代码是否与项目中已有代码重复。如果重复，请复用现有代码。

# 命名检查
请检查所有命名是否清晰、一致、符合约定：
- 文件：kebab-case
- 组件：PascalCase
- 函数：camelCase
- 常量：UPPER_SNAKE_CASE

# 测试覆盖检查
这段代码属于 [Domain/Application] 层，请生成对应的单元测试。
````

---

**版本**：v1.0 | 2025-01-13
**维护者**：架构团队
