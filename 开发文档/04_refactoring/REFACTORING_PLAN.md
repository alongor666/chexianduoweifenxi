---
id: 04_refactoring_refactoring_plan
title: 🔧 车险分析平台重构计划
author: AI_Refactor
status: stable
type: refactoring
domain: product
tags:
- refactoring
- product
created_at: '2025-12-13'
updated_at: '2025-12-13'
---

# 🔧 车险分析平台重构计划

> **基于**：[架构规则体系](./ARCHITECTURE_RULES.md)
> **当前状态**：增长期（38K 行代码）
> **目标状态**：符合 Clean Architecture + FSD 的可维护架构
> **预计工期**：2-3 周全职工作（或 4-6 周兼职）

---

## 📊 现状分析

### 当前痛点

| 问题         | 严重程度 | 影响                         |
| ------------ | -------- | ---------------------------- |
| 状态管理混乱 | 🔴 高    | 数据流不可预测，难以调试     |
| 重复代码多   | 🔴 高    | 修改一处需要改多处，容易遗漏 |
| 业务逻辑散落 | 🟡 中    | 无法复用，无法测试           |
| 组件过大     | 🟡 中    | 难以理解，修改风险高         |
| 缺乏测试     | 🟢 低    | 重构缺乏安全网               |

### 违反的架构规则

```
❌ 依赖方向法则
- Store 导入 React hooks（内层依赖外层）
- UI 组件包含业务计算（展示层包含业务层）

❌ 单一职责原则
- use-app-store.ts (1007行) 职责过多
- file-upload.tsx (548行) 职责过多

❌ 关注点分离
- normalizeChineseText 散落 10+ 处
- 筛选逻辑在 Store、Hook、Component 重复实现

❌ DRY 原则
- 数据规范化逻辑重复
- 筛选逻辑重复
- 数据验证逻辑重复
```

---

## 🎯 重构目标

### 架构目标

```
目标架构：Clean Architecture (3层) + Feature-Sliced Design

src/
├── domain/              ← 业务核心（纯 TypeScript）
│   ├── entities/        ← 保险实体、KPI 实体
│   ├── rules/           ← 计算规则、验证规则
│   └── types/           ← 类型定义
│
├── application/         ← 用例编排
│   ├── use-cases/       ← 上传数据、计算KPI、导出报告
│   ├── ports/           ← 接口定义（仓储、解析器、导出器）
│   └── services/        ← 应用服务
│
├── infrastructure/      ← 技术实现
│   ├── adapters/        ← DuckDB、CSV、PDF 适配器
│   ├── api/             ← Supabase 客户端
│   └── storage/         ← IndexedDB、LocalStorage
│
├── features/            ← 功能切片（FSD）
│   ├── data-upload/     ← 文件上传功能
│   ├── kpi-dashboard/   ← KPI 看板
│   ├── data-filter/     ← 数据筛选
│   ├── data-export/     ← 数据导出
│   └── analytics/       ← 数据分析
│
└── shared/              ← 共享资源
    ├── ui/              ← UI 组件库
    ├── hooks/           ← 通用 Hooks
    └── utils/           ← 工具函数
```

### 质量目标

| 指标                 | 当前 | 目标  |
| -------------------- | ---- | ----- |
| **单个文件最大行数** | 1007 | < 300 |
| **组件最大行数**     | 548  | < 200 |
| **函数最大行数**     | 150+ | < 50  |
| **代码重复率**       | ~15% | < 5%  |
| **单元测试覆盖率**   | 0%   | > 60% |
| **依赖方向违规**     | 多处 | 0     |

---

## 🧭 Domain-only 收敛计划（禁止 Supabase）

> 目标：以 Domain 为单一真相源，去除 Supabase 依赖，保持鲁棒且极简。

### 原则

- Domain 层为唯一业务公式/规范化/DTO 来源；禁止直接依赖 UI/Infra。
- 应用层只经由 Port 调用 Domain；Infra 仅实现 Port；UI 只调用应用层/Hook。
- 优先清理重复实现，先合并后替换调用，避免双轨并存。

### 分阶段待办（状态：⬜ 待办｜🔄 进行中｜✅ 完成）

1. 领域计算与规范化
   - ⬜ 合并 `src/lib/calculations/kpi-engine.ts` 与 `src/domain/rules/kpi-calculator.ts` 的算子/公式注册表
   - ⬜ 将雷达评分与归一化/权重抽象为公共算子，统一入口 `src/domain/rules/*`
   - ⬜ 清理/迁移调用方：`use-kpi*`、`use-smart-comparison`、图表/表格等全部指向 Domain API
   - ⬜ 增补单元测试覆盖计算与增量模式

2. 数据导入链（上传→解析→规范化→存储）
   - ⬜ 统一 CSV 解析与校验：合并 `src/lib/parsers/csv-parser.ts` 与 `src/infrastructure/adapters/CSVParser.ts`，保留 Port 实现
   - ⬜ `use-file-upload.ts` 精简为 UI 状态/反馈，校验/周次分析/错误模型下沉复用模块
   - ⬜ 应用层 `UploadDataUseCase` 作为唯一入口，前端 Hook 只调用 Use Case；补齐周次冲突/历史记录的接口
   - ⬜ 测试：解析 + 校验 + 周次分析的集成测试（沿用 `RealDataTest`/上传测试）

3. 存储与导出
   - ⬜ 选定仓储实现（DuckDB/LocalStorage），废弃旧 `src/lib/database/duckdb-adapter.ts` 双轨；对齐 Port `IDataRepository`
   - ⬜ PDF/CSV 导出：保留 `IExporter` 接口，合并 `PDFExporter` 数据组装与 UI 映射的重复逻辑，输出 DTO 即可
   - ⬜ 持久化与上传历史：统一走 `PersistenceService`，淘汰 `src/lib/storage/data-persistence.ts` 的业务逻辑部分
   - ⬜ 测试：PDF/CSV 导出单元 +快照，仓储读写冒烟

4. UI 与可视化瘦身
   - ⬜ `targets-data-table.tsx` 拆分列配置/格式化、业务计算 Hook、纯渲染组件，复用格式化工具
   - ⬜ ECharts 统一主题/交互策略，模板各自文件仅依赖 builder + 主题；移除重复阈值/配色定义
   - ⬜ 状态流迁移：`DashboardClient`/目标管理切到新 Store & 应用服务，移除对 `use-app-store` 的依赖
   - ⬜ 回归：关键交互（筛选/分页/导出）与渲染一致性检查

### 交付与同步

- 每阶段完成：更新对应文档（本计划 + 技术设计）、运行 `pnpm docs:index` 生成索引。
- 默认测试：`pnpm test`（单元）、`pnpm test:upload`（上传链）、必要时 Playwright 冒烟。

---

## 📅 重构路线图（3 周计划）

### 第 1 周：建立核心层（Domain + Application）

#### Day 1-2：提取 Domain 层

**任务 1.1：创建实体（Entities）**

```typescript
// src/domain/entities/Insurance.ts
export class InsuranceRecord {
  constructor(
    public readonly id: string,
    public readonly policyNumber: string,
    public readonly premium: number,
    public readonly weekNumber: number
    // ... 其他 26 个字段
  ) {}

  // 领域方法（而非 getter/setter）
  isHighValuePolicy(): boolean {
    return this.premium > 10000
  }

  isNewEnergyVehicle(): boolean {
    return this.isNewEnergy === true
  }
}
```

**任务 1.2：提取业务规则（Rules）**

```typescript
// src/domain/rules/kpi-calculator.ts
export function calculateMaturityContributionRate(
  records: InsuranceRecord[]
): number {
  // 纯函数实现
  const maturityPremium = records
    .filter(r => r.isMatured())
    .reduce((sum, r) => sum + r.premium, 0)

  const totalPremium = records.reduce((sum, r) => sum + r.premium, 0)

  return totalPremium === 0 ? 0 : maturityPremium / totalPremium
}
```

**任务 1.3：提取数据规范化规则**

```typescript
// src/domain/rules/data-normalization.ts
export function normalizeChineseText(text: string): string {
  // 统一的中文文本规范化逻辑
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
    .trim()
}

export function normalizeInsuranceRecord(
  raw: RawInsuranceData
): InsuranceRecord {
  return new InsuranceRecord(
    raw.id,
    raw.policy_number,
    raw.premium,
    raw.week_number,
    // 统一在入口处规范化
    normalizeChineseText(raw.customer_category_3),
    normalizeChineseText(raw.business_type_category)
    // ...
  )
}
```

**检查清单**：

- [ ] 所有业务计算移到 `domain/rules/`
- [ ] 所有实体定义移到 `domain/entities/`
- [ ] Domain 层没有任何 React 导入
- [ ] Domain 层没有任何 API 调用
- [ ] 所有函数都是纯函数（可测试）

---

#### Day 3-4：创建 Application 层

**任务 2.1：定义端口（Ports）**

```typescript
// src/application/ports/IDataRepository.ts
export interface IDataRepository {
  save(records: InsuranceRecord[]): Promise<void>
  findAll(): Promise<InsuranceRecord[]>
  findByWeek(weekNumber: number): Promise<InsuranceRecord[]>
  clear(): Promise<void>
}

// src/application/ports/IFileParser.ts
export interface IFileParser {
  parse(file: File): Promise<InsuranceRecord[]>
  validate(file: File): Promise<ValidationResult>
}

// src/application/ports/IExporter.ts
export interface IExporter {
  exportToCSV(data: InsuranceRecord[]): Promise<Blob>
  exportToPDF(data: InsuranceRecord[]): Promise<Blob>
}
```

**任务 2.2：实现用例（Use Cases）**

```typescript
// src/application/use-cases/upload-data.ts
export class UploadDataUseCase {
  constructor(
    private parser: IFileParser,
    private repository: IDataRepository,
    private validator: IDataValidator
  ) {}

  async execute(file: File): Promise<UploadResult> {
    // 1. 验证文件
    const validation = await this.validator.validate(file)
    if (!validation.isValid) {
      throw new ValidationError(validation.errors)
    }

    // 2. 解析数据
    const rawRecords = await this.parser.parse(file)

    // 3. 规范化数据（调用 Domain 层）
    const normalizedRecords = rawRecords.map(normalizeInsuranceRecord)

    // 4. 保存到仓储
    await this.repository.save(normalizedRecords)

    return {
      totalRecords: normalizedRecords.length,
      validRecords: normalizedRecords.length,
    }
  }
}
```

**任务 2.3：创建数据服务**

```typescript
// src/application/services/DataService.ts
export class DataService {
  constructor(private repository: IDataRepository) {}

  async getData(filters: FilterOptions): Promise<InsuranceRecord[]> {
    const allData = await this.repository.findAll()
    return this.applyFilters(allData, filters)
  }

  private applyFilters(
    data: InsuranceRecord[],
    filters: FilterOptions
  ): InsuranceRecord[] {
    // 调用 Domain 层的筛选规则
    return filterRecords(data, filters)
  }
}
```

**检查清单**：

- [ ] 所有 Use Case 编排清晰
- [ ] 依赖通过构造函数注入（DI）
- [ ] Application 层不依赖具体实现
- [ ] 每个 Use Case 职责单一

---

#### Day 5：编写单元测试

```typescript
// src/domain/rules/__tests__/kpi-calculator.test.ts
describe('calculateMaturityContributionRate', () => {
  it('应该正确计算满期边际贡献率', () => {
    const records = [
      createMockRecord({ premium: 1000, isMatured: true }),
      createMockRecord({ premium: 2000, isMatured: false }),
    ]

    const result = calculateMaturityContributionRate(records)

    expect(result).toBeCloseTo(0.333, 2)
  })

  it('当总保费为0时应该返回0', () => {
    const result = calculateMaturityContributionRate([])
    expect(result).toBe(0)
  })
})
```

**检查清单**：

- [ ] Domain 层所有业务规则有测试
- [ ] Application 层所有 Use Case 有测试
- [ ] 测试覆盖率 > 80%

---

### 第 2 周：重构基础设施层（Infrastructure）

#### Day 6-7：实现适配器（Adapters）

**任务 3.1：数据仓储适配器**

```typescript
// src/infrastructure/adapters/DuckDBRepository.ts
export class DuckDBRepository implements IDataRepository {
  constructor(private db: DuckDBConnection) {}

  async save(records: InsuranceRecord[]): Promise<void> {
    // DuckDB 具体实现
    const conn = await this.db.connect()
    await conn.insertJSONObjects('insurance', records)
  }

  async findAll(): Promise<InsuranceRecord[]> {
    const conn = await this.db.connect()
    const result = await conn.query('SELECT * FROM insurance')
    return result.toArray().map(row => this.mapToEntity(row))
  }

  private mapToEntity(row: any): InsuranceRecord {
    return new InsuranceRecord(/* ... */)
  }
}

// src/infrastructure/adapters/IndexedDBRepository.ts
export class IndexedDBRepository implements IDataRepository {
  // IndexedDB 具体实现
  // 与 DuckDBRepository 相同的接口，不同的实现
}
```

**任务 3.2：文件解析器适配器**

```typescript
// src/infrastructure/adapters/CSVParser.ts
export class CSVParser implements IFileParser {
  async parse(file: File): Promise<InsuranceRecord[]> {
    const text = await file.text()
    const parsed = Papa.parse(text, { header: true })
    return parsed.data.map(row => this.mapToRecord(row))
  }

  async validate(file: File): Promise<ValidationResult> {
    // 调用 Domain 层的验证规则
    return validateCSVStructure(file)
  }
}
```

**检查清单**：

- [ ] 所有适配器实现了对应的 Port 接口
- [ ] 具体技术实现（DuckDB、CSV）只在 Infrastructure 层
- [ ] 适配器可以轻松替换（如 DuckDB → PostgreSQL）

---

#### Day 8-9：重构 Store

**任务 4.1：拆分巨型 Store**

```typescript
// src/infrastructure/store/dataStore.ts
export const useDataStore = create<DataState>((set, get) => ({
  // 只负责数据存储
  records: [],

  setRecords: records => set({ records }),

  clearRecords: () => set({ records: [] }),

  // 通过 Use Case 操作数据
  uploadData: async (file: File) => {
    const useCase = new UploadDataUseCase(
      new CSVParser(),
      new DuckDBRepository(),
      new DataValidator()
    )
    const result = await useCase.execute(file)
    set({ records: result.records })
  },
}))

// src/infrastructure/store/filterStore.ts
export const useFilterStore = create<FilterState>(set => ({
  // 只负责筛选状态
  filters: defaultFilters,

  updateFilters: newFilters =>
    set(state => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),
}))

// src/infrastructure/store/uiStore.ts
export const useUIStore = create<UIState>(set => ({
  // 只负责 UI 状态
  isLoading: false,
  expandedPanels: new Set(),

  setLoading: loading => set({ isLoading: loading }),
  togglePanel: id =>
    set(state => {
      const newPanels = new Set(state.expandedPanels)
      if (newPanels.has(id)) {
        newPanels.delete(id)
      } else {
        newPanels.add(id)
      }
      return { expandedPanels: newPanels }
    }),
}))
```

**检查清单**：

- [ ] 每个 Store 职责单一
- [ ] Store 不包含业务逻辑（调用 Use Case）
- [ ] Store 文件 < 200 行

---

#### Day 10：依赖注入容器

```typescript
// src/infrastructure/di/container.ts
export class DIContainer {
  private static instance: DIContainer
  private services = new Map<string, any>()

  static getInstance(): DIContainer {
    if (!this.instance) {
      this.instance = new DIContainer()
      this.instance.registerServices()
    }
    return this.instance
  }

  private registerServices() {
    // 注册仓储
    this.register('dataRepository', () => new DuckDBRepository())

    // 注册解析器
    this.register('csvParser', () => new CSVParser())

    // 注册导出器
    this.register('pdfExporter', () => new PDFExporter())

    // 注册 Use Cases
    this.register(
      'uploadDataUseCase',
      () =>
        new UploadDataUseCase(
          this.resolve('csvParser'),
          this.resolve('dataRepository'),
          new DataValidator()
        )
    )
  }

  register(name: string, factory: () => any) {
    this.services.set(name, factory)
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name)
    if (!factory) {
      throw new Error(`Service ${name} not found`)
    }
    return factory()
  }
}

// 使用
const container = DIContainer.getInstance()
const uploadUseCase = container.resolve<UploadDataUseCase>('uploadDataUseCase')
```

**检查清单**：

- [ ] 所有依赖通过 DI 容器管理
- [ ] 便于切换实现（如测试时用 Mock）

---

### 第 3 周：功能切片化（Feature-Sliced Design）

#### Day 11-12：重构文件上传功能

```
src/features/data-upload/
├── ui/
│   ├── FileUpload.tsx           ← 主组件（< 200 行）
│   ├── UploadProgress.tsx       ← 进度显示
│   ├── FileList.tsx             ← 文件列表
│   └── UploadResults.tsx        ← 结果展示
│
├── model/
│   ├── useFileUpload.ts         ← Hook（调用 Use Case）
│   └── uploadStore.ts           ← 上传状态
│
├── lib/
│   └── file-validator.ts        ← 文件验证工具
│
└── index.ts                     ← 公开接口
    export { FileUpload } from './ui/FileUpload'
    export { useFileUpload } from './model/useFileUpload'
```

**任务 5.1：拆分组件**

```typescript
// src/features/data-upload/ui/FileUpload.tsx (< 150 行)
export function FileUpload() {
  const { uploadFile, progress } = useFileUpload()

  return (
    <div>
      {progress.isUploading ? (
        <UploadProgress progress={progress} />
      ) : (
        <FileDropzone onDrop={uploadFile} />
      )}
    </div>
  )
}

// src/features/data-upload/model/useFileUpload.ts
export function useFileUpload() {
  const container = DIContainer.getInstance()
  const uploadUseCase = container.resolve<UploadDataUseCase>('uploadDataUseCase')

  const uploadFile = async (file: File) => {
    // 调用 Use Case，不包含业务逻辑
    const result = await uploadUseCase.execute(file)
    return result
  }

  return { uploadFile, progress: {...} }
}
```

**检查清单**：

- [ ] 每个组件 < 200 行
- [ ] UI 组件不包含业务逻辑
- [ ] Hook 只调用 Use Case

---

#### Day 13-14：重构 KPI 看板功能

```
src/features/kpi-dashboard/
├── ui/
│   ├── KPIDashboard.tsx         ← 仪表盘容器
│   ├── KPICard.tsx              ← 单个 KPI 卡片
│   └── KPIChart.tsx             ← KPI 图表
│
├── model/
│   ├── useKPIData.ts            ← 获取 KPI 数据
│   └── kpiStore.ts              ← KPI 缓存
│
└── index.ts
```

**任务 6.1：重构 KPI 计算**

```typescript
// src/features/kpi-dashboard/model/useKPIData.ts
export function useKPIData() {
  const records = useDataStore(state => state.records)
  const filters = useFilterStore(state => state.filters)

  // 使用 Domain 层的计算规则
  const kpis = useMemo(() => {
    const filteredRecords = filterRecords(records, filters)
    return {
      maturityContribution: calculateMaturityContributionRate(filteredRecords),
      claimRate: calculateClaimRate(filteredRecords),
      averagePremium: calculateAveragePremium(filteredRecords),
      // ...
    }
  }, [records, filters])

  return kpis
}
```

**检查清单**：

- [ ] KPI 计算逻辑在 Domain 层
- [ ] UI 组件只负责展示
- [ ] 使用 useMemo 优化性能

---

#### Day 15：重构数据筛选功能

```
src/features/data-filter/
├── ui/
│   ├── FilterPanel.tsx          ← 筛选面板
│   ├── FilterGroup.tsx          ← 筛选组
│   └── FilterChip.tsx           ← 筛选标签
│
├── model/
│   ├── useFilter.ts             ← 筛选 Hook
│   └── filterStore.ts           ← 筛选状态
│
└── index.ts
```

---

## 🔍 重构验证

### 自动化检查

```bash
# 1. 检查依赖方向
./scripts/check-dependencies.sh

# 2. 检查文件大小
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 300 ]; then
    echo "❌ $file 超过 300 行"
  fi
done

# 3. 运行类型检查
pnpm typecheck

# 4. 运行测试
pnpm test

# 5. 检查测试覆盖率
pnpm test:coverage
```

### 手动检查清单

```markdown
## 架构验证

- [ ] Domain 层不依赖任何外部框架
- [ ] Application 层只依赖 Domain 层
- [ ] Infrastructure 层实现了所有 Port 接口
- [ ] 没有循环依赖

## 代码质量

- [ ] 所有文件 < 300 行
- [ ] 所有函数 < 50 行
- [ ] 没有重复代码（< 5%）
- [ ] 命名清晰一致

## 测试覆盖

- [ ] Domain 层测试覆盖率 > 80%
- [ ] Application 层测试覆盖率 > 60%
- [ ] 关键路径有集成测试

## 文档

- [ ] 架构文档更新
- [ ] ADR 记录重大决策
- [ ] README 更新
```

---

## 📝 风险管理

### 风险识别

| 风险         | 概率 | 影响 | 缓解措施                 |
| ------------ | ---- | ---- | ------------------------ |
| 重构引入 Bug | 高   | 高   | 先写测试，再重构         |
| 工期延误     | 中   | 中   | 分阶段交付，每阶段可运行 |
| 团队学习成本 | 中   | 低   | 提供培训文档和示例代码   |

### 回滚策略

每个重构阶段完成后：

1. 创建 Git Tag（如 `refactor-week1-complete`）
2. 验证所有功能正常
3. 如果出现问题，可以快速回滚到上一个稳定版本

---

## 🎓 团队培训

### 培训材料

1. **架构规则体系** - [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)
2. **重构检查清单** - [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md)
3. **AI 协作约定** - [AI_COLLABORATION.md](./AI_COLLABORATION.md)

### 培训计划

- **第 1 天**：Clean Architecture 原理（2 小时）
- **第 2 天**：Feature-Sliced Design 实践（2 小时）
- **第 3 天**：代码示例和手把手重构（3 小时）

---

## 📊 成功指标

### 定量指标

| 指标         | 重构前 | 目标  | 测量方式                               |
| ------------ | ------ | ----- | -------------------------------------- |
| 平均文件行数 | 450    | < 200 | `find src -name "*.ts" \| xargs wc -l` |
| 代码重复率   | 15%    | < 5%  | SonarQube                              |
| 测试覆盖率   | 0%     | > 60% | Jest Coverage                          |
| 构建时间     | 45s    | < 30s | `pnpm build`                           |

### 定性指标

- [ ] 新功能开发速度提升 30%
- [ ] Bug 修复时间减少 50%
- [ ] 代码审查时间减少 40%
- [ ] 新成员上手时间从 2 周减少到 3 天

---

## 🚀 下一步行动

### 立即开始（本周）

1. **阅读架构文档**
   - [ ] 通读 [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)
   - [ ] 理解依赖方向法则
   - [ ] 理解 FSD 分层模型

2. **准备开发环境**
   - [ ] 创建 `refactor/clean-architecture` 分支
   - [ ] 安装依赖检查工具（dependency-cruiser）
   - [ ] 配置 Git Hooks

3. **开始第一周工作**
   - [ ] Day 1: 创建 Domain 层目录结构
   - [ ] Day 2: 提取保险实体
   - [ ] Day 3: 提取 KPI 计算规则

---

## 📚 参考资料

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [Refactoring.Guru](https://refactoring.guru/)

---

**版本**：v1.0 | 2025-01-13
**作者**：架构团队
**审核**：待审核
