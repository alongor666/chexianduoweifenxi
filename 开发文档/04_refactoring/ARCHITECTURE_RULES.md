# 🏛️ 软件架构规则体系（完整版）

> **适用范围**：任何前端项目，任何规模，任何技术栈
> **核心理念**：通过规则和约束降低复杂度，而非通过抽象
> **版本**：v1.0 | 2025-01-13

---

## 📚 目录

1. [底层规律（不可违反的物理定律）](#第一部分底层规律不可违反的物理定律)
2. [架构原则（战术层面的指导方针）](#第二部分架构原则战术层面的指导方针)
3. [分层规则（Clean Architecture + FSD）](#第三部分分层规则clean-architecture--fsd)
4. [阶段规则（按项目规模）](#第四部分阶段规则按项目规模)
5. [检查清单（可执行的检查项）](#第五部分检查清单可执行的检查项)
6. [AI 协作约定](#第六部分ai-协作约定)

---

## 第一部分：底层规律（不可违反的"物理定律"）

> 这些规则来自计算机科学的基础原理，违反必导致系统崩溃。

### 规律 1：依赖方向法则（The Dependency Rule）

**定义**：依赖只能从外向内，内层永远不能知道外层的存在。

```
┌─────────────────────────────────────┐
│  Infrastructure Layer (外层)        │  ← 框架、UI、数据库
│  • React 组件                        │
│  • API 调用                          │
│  • LocalStorage                      │
├─────────────────────────────────────┤
│  Application Layer (中间层)         │  ← 用例、编排
│  • Use Cases                         │
│  • Services                          │
│  • Ports (接口定义)                  │
├─────────────────────────────────────┤
│  Domain Layer (核心层)               │  ← 业务逻辑、实体
│  • Entities                          │
│  • Business Rules                    │
│  • Pure Functions                    │
└─────────────────────────────────────┘

✅ Infrastructure 可以导入 Application
✅ Application 可以导入 Domain
❌ Domain 不能导入 Application
❌ Application 不能导入 Infrastructure
```

**违反的后果**：

- 业务逻辑无法复用（绑死在 UI 框架上）
- 无法测试（依赖外部系统）
- 技术栈迁移成本巨大（改 UI 框架要重写所有逻辑）

**检测方法**：

```bash
# 检查 Domain 层是否导入了 React
grep -r "from 'react'" src/domain/
# 如果有任何结果 → 违反规则

# 检查 Domain 层是否导入了 API 客户端
grep -r "fetch\|axios\|supabase" src/domain/
# 如果有任何结果 → 违反规则
```

---

### 规律 2：单一职责原则（Single Responsibility Principle）

**定义**：一个模块只有一个改变的理由（一个变化点）。

**判断公式**：

```
如果你能用"和"来描述一个模块的功能 → 违反 SRP

示例：
❌ "这个 Store 管理数据**和**处理筛选**和**管理缓存"  → 3个职责
✅ "这个 Store 管理数据"  → 1个职责
```

**实践规则**：

- 一个文件 < 300 行（超过需要拆分）
- 一个函数 < 50 行（超过需要拆分）
- 一个类/模块的 import 数量 < 10（超过可能职责过多）

**检测方法**：

```bash
# 统计文件行数
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -10

# 统计 import 数量
grep -c "^import" src/store/use-app-store.ts
```

---

### 规律 3：关注点分离（Separation of Concerns）

**定义**：不同性质的逻辑必须物理隔离，不能混合在一起。

**三个必须分离的关注点**：

| 关注点               | 职责                   | 不允许包含          |
| -------------------- | ---------------------- | ------------------- |
| **数据层（Data）**   | 获取、存储、序列化数据 | 业务规则、UI 状态   |
| **业务层（Domain）** | 业务规则、计算逻辑     | HTTP 请求、DOM 操作 |
| **展示层（View）**   | 渲染 UI、处理交互      | 业务计算、数据存储  |

**反模式识别**：

```typescript
// ❌ 反模式：UI 组件包含业务逻辑
function ProductList() {
  const calculateDiscount = (price: number) => price * 0.8  // 业务逻辑
  const saveToLocalStorage = () => {...}  // 数据逻辑
  return <div>...</div>  // UI 逻辑
}

// ✅ 正确：分离关注点
function ProductList() {
  const products = useProducts()  // 数据层
  const { calculateDiscount } = useDiscountRules()  // 业务层
  return <div>...</div>  // 展示层
}
```

---

### 规律 4：高内聚，低耦合（Cohesion & Coupling）

**定义**：

- **内聚**：模块内部的元素关联程度（越高越好）
- **耦合**：模块之间的依赖程度（越低越好）

**测量标准**：

```typescript
// 内聚度测试：如果删除模块中的一个函数，其他函数是否还有意义？
// ❌ 低内聚
export const utils = {
  formatDate, // 时间相关
  validateEmail, // 校验相关
  calculateKPI, // 业务相关
}

// ✅ 高内聚
export const dateUtils = { formatDate, parseDate, addDays }
export const validators = { validateEmail, validatePhone }
export const kpiCalculators = { calculateKPI, calculateROI }
```

```typescript
// 耦合度测试：修改模块 A 是否需要修改模块 B？
// ❌ 高耦合
class OrderService {
  sendEmail() {
    // 直接依赖具体实现
    const mailer = new SendGridMailer()
    mailer.send(...)
  }
}

// ✅ 低耦合
class OrderService {
  constructor(private mailer: IMailer) {}  // 依赖抽象
  sendEmail() {
    this.mailer.send(...)
  }
}
```

**定量测量**：

- **扇入（Fan-in）**：有多少模块依赖这个模块（越高越好，说明复用度高）
- **扇出（Fan-out）**：这个模块依赖多少其他模块（越低越好，说明独立性强）

---

## 第二部分：架构原则（战术层面的指导方针）

> 这些原则是从底层规律推导出的实践方法。

### 原则 1：DRY（Don't Repeat Yourself）

**定义**：每个知识点在系统中只有一个权威的、明确的表示。

**三种重复类型**：

1. **知识重复**（最危险）

   ```typescript
   // ❌ 业务规则散落各处
   // 文件 A
   if (premium > 10000) { ... }

   // 文件 B
   if (premium > 10000) { ... }

   // ✅ 集中定义
   const isHighValuePolicy = (premium: number) => premium > 10000
   ```

2. **结构重复**

   ```typescript
   // ❌ 相似的数据转换逻辑
   function transformUserData(data) { ... }
   function transformProductData(data) { ... }

   // ✅ 泛型/高阶函数
   function transformData<T>(data: T, schema: Schema<T>) { ... }
   ```

3. **实现重复**（可以容忍）
   ```typescript
   // ✅ 允许：两个不同场景恰好实现相同
   const formatCurrency = n => `¥${n.toFixed(2)}` // 用于展示
   const serializeMoney = n => n.toFixed(2) // 用于存储
   ```

**执行标准**：

- 复制粘贴代码 **超过 3 行** → 必须提取
- 相同逻辑出现 **超过 2 次** → 必须抽象
- **例外**：单元测试允许重复（可读性优先）

---

### 原则 2：YAGNI（You Aren't Gonna Need It）

**定义**：只实现当前需要的功能，不要为未来可能的需求预留。

**反模式识别**：

```typescript
// ❌ 过度设计
interface IDataSource {
  fetchFromDatabase(): Data
  fetchFromAPI(): Data
  fetchFromCache(): Data
  fetchFromFile(): Data // 当前不需要
  fetchFromBlockchain(): Data // 完全不需要
}

// ✅ 按需设计
interface IDataSource {
  fetch(): Data // 简单清晰
}
```

**执行规则**：

- 如果功能在 **下一个迭代** 中不会用到 → 不要实现
- 如果抽象层在 **当前代码** 中没有 2 个以上的实现 → 不要抽象
- 如果配置项在 **现有场景** 中只有一个值 → 不要做成配置

---

### 原则 3：KISS（Keep It Simple, Stupid）

**定义**：简单的方案优于复杂的方案，除非复杂性带来明确收益。

**简单性度量**：

| 维度         | 简单          | 复杂           |
| ------------ | ------------- | -------------- |
| **理解时间** | < 5分钟读懂   | > 30分钟才理解 |
| **依赖数量** | < 3个外部依赖 | > 10个依赖     |
| **抽象层级** | < 3层调用     | > 5层嵌套      |
| **配置项**   | < 5个参数     | > 10个配置     |

**示例**：

```typescript
// ❌ 过度复杂
class DataProcessor<T, U, V> {
  constructor(
    private transformer: ITransformer<T, U>,
    private validator: IValidator<U>,
    private serializer: ISerializer<U, V>,
    private logger: ILogger,
    private metrics: IMetrics
  ) {}
}

// ✅ 简单直接
function processData(input: Data): ProcessedData {
  const validated = validate(input)
  const transformed = transform(validated)
  return transformed
}
```

---

### 原则 4：接口隔离原则（Interface Segregation）

**定义**：客户端不应该依赖它不需要的接口。

**实践方法**：

```typescript
// ❌ 胖接口
interface IAppStore {
  // 数据相关（组件 A 需要）
  rawData: Data[]
  setRawData: (data: Data[]) => void

  // 筛选相关（组件 B 需要）
  filters: Filters
  updateFilters: (f: Filters) => void

  // 导出相关（组件 C 需要）
  exportToCSV: () => void
  exportToPDF: () => void
}

// ✅ 接口隔离
interface IDataReader {
  getData(): Data[]
}

interface IFilterManager {
  getFilters(): Filters
  updateFilters(f: Filters): void
}

interface IDataExporter {
  exportToCSV(): void
  exportToPDF(): void
}
```

**检测方法**：

- 如果你的组件只用到接口的 **< 30%** 方法 → 接口过大
- 如果你需要写 `// @ts-ignore` 来忽略某些属性 → 接口设计错误

---

### 原则 5：开闭原则（Open/Closed Principle）

**定义**：对扩展开放，对修改封闭。

**实现策略**：

**策略 1：策略模式**

```typescript
// ❌ 每次新增类型都要改 if-else
function calculatePrice(type: string, base: number) {
  if (type === 'vip') return base * 0.8
  if (type === 'new') return base * 0.9
  if (type === 'regular') return base
}

// ✅ 新增类型不修改原代码
interface IPriceStrategy {
  calculate(base: number): number
}

const strategies = {
  vip: base => base * 0.8,
  new: base => base * 0.9,
  regular: base => base,
}

function calculatePrice(type: string, base: number) {
  return strategies[type](base)
}
```

**策略 2：插件系统**

```typescript
// ✅ 通过插件扩展功能
interface IPlugin {
  name: string
  execute(data: Data): Data
}

class DataPipeline {
  private plugins: IPlugin[] = []

  use(plugin: IPlugin) {
    this.plugins.push(plugin)
  }

  process(data: Data) {
    return this.plugins.reduce((d, p) => p.execute(d), data)
  }
}
```

---

## 第三部分：分层规则（Clean Architecture + FSD）

> 结合 Clean Architecture 的依赖规则和 Feature-Sliced Design 的组织方式。

### 3.1 Clean Architecture 三层模型

```
src/
├── domain/           ← 核心层（Domain Layer）
│   ├── entities/     ← 业务实体
│   ├── rules/        ← 业务规则
│   └── types/        ← 类型定义
│
├── application/      ← 应用层（Application Layer）
│   ├── use-cases/    ← 用例（Use Cases）
│   ├── ports/        ← 端口（接口定义）
│   └── services/     ← 应用服务
│
└── infrastructure/   ← 基础设施层（Infrastructure Layer）
    ├── ui/           ← UI 组件
    ├── adapters/     ← 适配器（实现 ports）
    ├── api/          ← API 客户端
    └── storage/      ← 存储实现
```

### 3.2 Feature-Sliced Design 组织

在 Infrastructure 层按功能切片：

```
src/
├── domain/           ← 跨功能的业务核心
│
├── application/      ← 跨功能的用例
│
└── features/         ← 按业务功能垂直切分
    ├── insurance-management/
    │   ├── ui/       ← 该功能的 UI 组件
    │   ├── model/    ← 该功能的状态管理
    │   ├── api/      ← 该功能的 API 调用
    │   └── index.ts  ← 公开接口（Public API）
    │
    ├── analytics/
    │   ├── ui/
    │   ├── model/
    │   └── index.ts
    │
    └── data-export/
        ├── ui/
        ├── model/
        └── index.ts
```

### 3.3 FSD 核心规则

#### 规则 1：公开接口（Public API）

**定义**：每个 feature 必须通过 `index.ts` 明确声明对外接口。

```typescript
// ✅ features/insurance-management/index.ts
export { InsuranceList } from './ui/InsuranceList'
export { useInsuranceData } from './model/useInsuranceData'
export type { Insurance } from './types'

// ❌ 禁止从内部路径导入
import { InsuranceCard } from '@/features/insurance-management/ui/InsuranceCard'

// ✅ 必须从公开接口导入
import { InsuranceList } from '@/features/insurance-management'
```

#### 规则 2：水平隔离（Isolation）

**定义**：同层的 feature 之间不能相互依赖。

```typescript
// ❌ 禁止：analytics 直接依赖 insurance-management
// features/analytics/model/useAnalytics.ts
import { useInsuranceData } from '@/features/insurance-management'

// ✅ 正确：通过 shared 或 application 层通信
// features/analytics/model/useAnalytics.ts
import { useDataStore } from '@/application/stores' // 共享状态
```

#### 规则 3：需求驱动（Needs Driven）

**定义**：只有真实的业务需求才创建新的 feature。

**创建 feature 的标准**：

- [ ] 是否是一个完整的用户故事？
- [ ] 是否可以独立交付？
- [ ] 是否有明确的业务边界？
- [ ] 是否会被多个页面/流程使用？

---

### 3.4 目录结构完整示例

```
src/
├── domain/                     ← 核心业务层（不依赖任何框架）
│   ├── entities/
│   │   ├── Insurance.ts        ← 保险实体
│   │   ├── KPI.ts              ← KPI 实体
│   │   └── Filter.ts           ← 筛选实体
│   │
│   ├── rules/
│   │   ├── kpi-calculator.ts   ← KPI 计算规则（纯函数）
│   │   ├── premium-rules.ts    ← 保费规则
│   │   └── filter-rules.ts     ← 筛选规则
│   │
│   └── types/
│       ├── insurance.types.ts  ← 类型定义
│       └── index.ts
│
├── application/                ← 应用层（编排业务逻辑）
│   ├── use-cases/
│   │   ├── calculate-kpi.ts    ← 计算 KPI 用例
│   │   ├── upload-data.ts      ← 上传数据用例
│   │   └── export-report.ts    ← 导出报告用例
│   │
│   ├── ports/                  ← 接口定义（抽象）
│   │   ├── IDataRepository.ts  ← 数据仓储接口
│   │   ├── IFileParser.ts      ← 文件解析接口
│   │   └── IExporter.ts        ← 导出接口
│   │
│   └── services/
│       ├── DataService.ts      ← 数据服务
│       └── ValidationService.ts
│
├── infrastructure/             ← 基础设施层（实现细节）
│   ├── adapters/               ← 适配器（实现 ports）
│   │   ├── DuckDBRepository.ts
│   │   ├── CSVParser.ts
│   │   └── PDFExporter.ts
│   │
│   ├── api/
│   │   └── supabase-client.ts
│   │
│   └── storage/
│       ├── indexed-db.ts
│       └── local-storage.ts
│
├── features/                   ← 功能切片（FSD）
│   ├── data-upload/
│   │   ├── ui/
│   │   │   ├── FileUpload.tsx
│   │   │   └── UploadProgress.tsx
│   │   ├── model/
│   │   │   ├── useFileUpload.ts
│   │   │   └── uploadStore.ts
│   │   └── index.ts            ← 公开接口
│   │
│   ├── kpi-dashboard/
│   │   ├── ui/
│   │   │   ├── KPICard.tsx
│   │   │   └── KPIDashboard.tsx
│   │   ├── model/
│   │   │   └── useKPIData.ts
│   │   └── index.ts
│   │
│   ├── data-filter/
│   │   ├── ui/
│   │   │   ├── FilterPanel.tsx
│   │   │   └── FilterChip.tsx
│   │   ├── model/
│   │   │   └── filterStore.ts
│   │   └── index.ts
│   │
│   └── data-export/
│       ├── ui/
│       ├── model/
│       └── index.ts
│
├── shared/                     ← 共享资源
│   ├── ui/                     ← 共享 UI 组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   │
│   ├── hooks/                  ← 共享 Hooks
│   │   ├── useDebounce.ts
│   │   └── useAsync.ts
│   │
│   ├── utils/                  ← 工具函数
│   │   ├── date-utils.ts
│   │   ├── array-utils.ts
│   │   └── string-utils.ts
│   │
│   └── config/                 ← 配置
│       └── constants.ts
│
└── app/                        ← Next.js App Router
    ├── page.tsx                ← 页面组装（只负责组装 features）
    └── layout.tsx
```

---

## 第四部分：阶段规则（按项目规模）

> 不同规模的项目，架构策略不同。

### 阶段 1：原型期（0-5K 行代码）

**目标**：快速验证产品方向

**允许的"坏习惯"**：

- ✅ 所有逻辑写在组件里
- ✅ 没有类型定义
- ✅ 没有测试
- ✅ 重复代码

**必须做的**：

- ✅ Git 提交记录清晰
- ✅ 文件夹按功能分组
- ✅ 关键业务逻辑加注释

**何时进入下一阶段**：产品方向验证通过，准备长期迭代。

---

### 阶段 2：增长期（5K-20K 行代码）**← 你的项目现在这里**

**目标**：建立可维护的架构基础

**必须完成的重构**：

- ✅ 分离 Domain、Application、Infrastructure 三层
- ✅ 提取所有业务逻辑到 Domain 层
- ✅ 建立 Repository 模式
- ✅ 组件只负责渲染
- ✅ 引入 TypeScript 严格模式
- ✅ 核心业务逻辑有单元测试

**目录结构**：

```
src/
├── domain/           ← 必须有
├── application/      ← 必须有
├── infrastructure/   ← 必须有
└── features/         ← 可选（如果功能 > 5 个则必须）
```

**检查清单**：

- [ ] 所有业务计算都在 `domain/rules/` 中
- [ ] 所有外部调用都在 `infrastructure/` 中
- [ ] 没有组件直接调用 API
- [ ] Store 只负责状态存储，不包含业务逻辑
- [ ] 单个文件 < 300 行

---

### 阶段 3：规模化期（20K-50K 行代码）

**目标**：支持多团队并行开发

**架构升级**：

- ✅ 完整采用 Feature-Sliced Design
- ✅ 每个 feature 有独立的 Store
- ✅ 引入 Event Bus 解耦 feature 间通信
- ✅ 建立 Design System（Storybook）
- ✅ E2E 测试覆盖核心流程

**目录结构**：

```
src/
├── domain/
├── application/
└── features/
    ├── feature-a/    ← 团队 A 负责
    ├── feature-b/    ← 团队 B 负责
    └── feature-c/    ← 团队 C 负责
```

**协作规则**：

- Feature 之间通过 Event 通信
- 共享代码必须经过 Code Review
- 每个 feature 有独立的测试覆盖率要求

---

### 阶段 4：企业级（50K+ 行代码）

**目标**：模块化、可独立部署

**架构升级**：

- ✅ Monorepo（pnpm workspace）
- ✅ 微前端架构（Module Federation）
- ✅ 独立的 npm 包
- ✅ CI/CD 流水线
- ✅ 性能监控和告警

**目录结构**：

```
packages/
├── core/             ← 核心库
├── feature-a/        ← 可独立部署的功能
├── feature-b/
└── design-system/    ← 设计系统
```

---

## 第五部分：检查清单（可执行的检查项）

> 每次提交代码前必须检查的规则。

### 检查清单 1：文件级检查

在创建/修改文件时，逐项检查：

```markdown
## 文件职责检查

- [ ] 这个文件能用一句话描述职责吗？
- [ ] 这个文件的 import 数量 < 10 吗？
- [ ] 这个文件的代码行数 < 300 吗？
- [ ] 这个文件的函数数量 < 10 吗？

## 依赖方向检查

- [ ] 如果在 domain/ 层，没有 import React 吗？
- [ ] 如果在 domain/ 层，没有 import API 客户端吗？
- [ ] 如果在 application/ 层，没有 import UI 组件吗？

## 命名规范检查

- [ ] 文件名是 kebab-case 吗？（data-service.ts）
- [ ] 类型名是 PascalCase 吗？（InsuranceRecord）
- [ ] 函数名是 camelCase 吗？（calculateKPI）
- [ ] 常量名是 UPPER_SNAKE_CASE 吗？（MAX_RETRY）

## 导出检查

- [ ] 只导出必要的符号吗？
- [ ] 有明确的 Public API 吗？（index.ts）
```

---

### 检查清单 2：功能级检查

在实现功能时，逐项检查：

```markdown
## 业务逻辑检查

- [ ] 所有计算逻辑都在 domain/rules/ 中吗？
- [ ] 业务规则是纯函数吗？（无副作用）
- [ ] 业务规则有单元测试吗？

## 数据流检查

- [ ] UI 组件通过 Hook 获取数据吗？
- [ ] 数据修改通过 Use Case 吗？
- [ ] 没有组件直接调用 API 吗？

## 状态管理检查

- [ ] Store 只负责存储状态吗？（不包含业务逻辑）
- [ ] 状态修改有明确的 Action 吗？
- [ ] 状态是 immutable 的吗？

## 错误处理检查

- [ ] 关键路径有错误处理吗？
- [ ] 错误信息对用户友好吗？
- [ ] 错误有日志记录吗？
```

---

### 检查清单 3：提交前检查

在 git commit 前，执行自动化检查：

```bash
#!/bin/bash
# 保存为 .git/hooks/pre-commit

echo "🔍 执行架构规则检查..."

# 1. 检查 domain 层是否依赖 React
echo "检查 domain 层依赖..."
if grep -r "from 'react'" src/domain/; then
  echo "❌ 错误：domain 层不能依赖 React"
  exit 1
fi

# 2. 检查文件大小
echo "检查文件大小..."
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 300 ]; then
    echo "❌ 警告：$file 有 $lines 行，超过 300 行限制"
  fi
done

# 3. 检查 TODO 注释
echo "检查 TODO..."
if grep -r "TODO" src/; then
  echo "⚠️  警告：代码中存在 TODO，请处理后再提交"
fi

# 4. 运行类型检查
echo "运行 TypeScript 检查..."
pnpm typecheck || exit 1

# 5. 运行单元测试
echo "运行单元测试..."
pnpm test || exit 1

echo "✅ 所有检查通过！"
```

---

### 检查清单 4：Code Review 检查

在 Code Review 时，检查：

```markdown
## 架构一致性

- [ ] 新代码符合现有分层结构吗？
- [ ] 依赖方向正确吗？
- [ ] 没有引入循环依赖吗？

## 代码质量

- [ ] 有重复代码吗？（DRY）
- [ ] 函数职责单一吗？（SRP）
- [ ] 变量命名清晰吗？

## 测试覆盖

- [ ] 新增的业务逻辑有单元测试吗？
- [ ] 关键路径有集成测试吗？

## 文档

- [ ] 复杂逻辑有注释吗？
- [ ] 公开接口有 JSDoc 吗？
- [ ] README 更新了吗？
```

---

## 第六部分：AI 协作约定

> 如何让 AI 助手遵守这些架构规则。

### 6.1 架构上下文注入

在每次对话开始时，提供架构上下文：

```markdown
## 项目架构约定

你正在协助一个遵循 Clean Architecture + Feature-Sliced Design 的项目。

**核心规则**：

1. 依赖只能从外向内（Infrastructure → Application → Domain）
2. Domain 层不能依赖任何框架（包括 React）
3. 每个 feature 通过 index.ts 暴露公开接口
4. 同层 feature 之间不能相互依赖

**目录结构**：

- `src/domain/` - 业务实体和规则（纯 TypeScript）
- `src/application/` - 用例和接口定义
- `src/infrastructure/` - 框架相关实现
- `src/features/` - 功能切片（按业务划分）

**在编写代码前，请先说明**：

1. 这段代码属于哪一层？
2. 会依赖哪些模块？
3. 是否符合依赖方向规则？
```

---

### 6.2 代码生成约定

当让 AI 生成代码时，使用明确的指令：

```markdown
## 指令模板

请按照以下架构规则生成代码：

**任务**：[描述具体任务]

**架构约束**：

- 层级：[domain/application/infrastructure]
- 依赖规则：[只能依赖 xxx 层]
- 职责：[单一职责描述]

**质量要求**：

- [ ] 函数 < 50 行
- [ ] 文件 < 300 行
- [ ] 包含单元测试
- [ ] 包含 JSDoc 注释

**示例**：

请在 domain/rules/ 中创建 KPI 计算函数：

- 层级：domain
- 依赖规则：只能依赖 domain/entities
- 职责：根据保险记录计算满期赔付率
- 质量要求：纯函数、有单元测试
```

---

### 6.3 重构指导约定

当让 AI 重构代码时：

```markdown
## 重构指令模板

请按照以下步骤重构代码：

**第一步：分析现状**

- 识别违反的架构规则
- 列出职责混乱的模块
- 找出重复代码

**第二步：制定计划**

- 确定目标架构（哪些代码应该在哪一层）
- 规划重构步骤（先后顺序）
- 评估风险（是否需要测试保护）

**第三步：执行重构**

- 一次只重构一个模块
- 每个步骤保持代码可运行
- 提交前运行测试

**第四步：验证结果**

- 检查依赖方向是否正确
- 确认单元测试通过
- 更新文档
```

---

### 6.4 架构决策记录（ADR）

每次重大架构决策，使用 ADR 记录：

```markdown
# ADR-001: 采用 Clean Architecture 三层模型

## 状态

已接受

## 上下文

当前项目代码规模达到 38K 行，面临以下问题：

- 状态管理混乱（新旧 Store 并存）
- 业务逻辑散落在 UI 组件中
- 重复代码多（normalizeChineseText 调用 10+ 次）

## 决策

采用 Clean Architecture 三层模型重构项目：

- Domain 层：纯业务逻辑（不依赖框架）
- Application 层：用例和接口定义
- Infrastructure 层：React 组件、API、存储

## 后果

### 正面影响

- 业务逻辑可复用（不绑定 React）
- 易于测试（纯函数）
- 技术栈迁移成本低

### 负面影响

- 初期重构成本高（约 1-2 周）
- 代码量增加约 20%（抽象层增加）
- 团队需要学习新模式

## 合规性

遵循的原则：

- ✅ 依赖方向法则
- ✅ 单一职责原则
- ✅ 关注点分离

## 替代方案

1. 保持现状（不重构） - 拒绝原因：技术债务累积
2. 微前端架构 - 拒绝原因：过度设计
```

---

## 附录：工具和资源

### 自动化工具

1. **ESLint 规则**

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["../../../*"],
            "message": "不要跨层导入，使用 Public API"
          },
          {
            "group": ["react"],
            "message": "domain 层不能依赖 React",
            "paths": ["src/domain/**"]
          }
        ]
      }
    ]
  }
}
```

2. **Dependency Cruiser**（检查循环依赖）

```bash
pnpm add -D dependency-cruiser
depcruise --validate .dependency-cruiser.js src
```

3. **SonarQube**（代码质量检查）

```yaml
# sonar-project.properties
sonar.projectKey=insurance-analytics
sonar.sources=src
sonar.exclusions=**/*.test.ts
```

---

### 学习资源

1. **Clean Architecture** - Robert C. Martin
2. **Domain-Driven Design** - Eric Evans
3. **Feature-Sliced Design** - https://feature-sliced.design/
4. **Refactoring** - Martin Fowler

---

## 版本历史

- v1.0 (2025-01-13) - 初始版本
  - 定义底层规律、架构原则、分层规则
  - 建立阶段规则和检查清单
  - 制定 AI 协作约定

---

## 许可证

本文档采用 CC BY-SA 4.0 许可证。
