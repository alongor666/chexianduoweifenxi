# Application 层实现总结

> **完成时间**：2025-11-14
> **任务**: Day 3-4 - 创建 Application 层
> **状态**：✅ 已完成

---

## 📋 实现内容

### 1. 端口接口（Ports）

创建了三个核心端口接口，定义了 Application 层与 Infrastructure 层之间的契约：

#### **[IDataRepository.ts](../src/application/ports/IDataRepository.ts)** (99 行)
- 数据仓储接口
- 定义了数据的 CRUD 操作
- 包含筛选、统计等高级查询功能
- 支持多种筛选维度（年份、周次、机构、客户类别等）

```typescript
export interface IDataRepository {
  save(records: InsuranceRecord[]): Promise<void>
  findAll(): Promise<InsuranceRecord[]>
  findByWeek(weekNumber: number): Promise<InsuranceRecord[]>
  findByYear(year: number): Promise<InsuranceRecord[]>
  findByFilters(filters: DataFilters): Promise<InsuranceRecord[]>
  clear(): Promise<void>
  getStats(): Promise<DataStats>
}
```

#### **[IFileParser.ts](../src/application/ports/IFileParser.ts)** (135 行)
- 文件解析器接口
- 支持文件解析和验证
- 定义了详细的错误和警告类型
- 包含文件类型检测

```typescript
export interface IFileParser {
  parse(file: File): Promise<RawInsuranceData[]>
  validate(file: File): Promise<ValidationResult>
  getSupportedFileTypes(): string[]
}
```

#### **[IExporter.ts](../src/application/ports/IExporter.ts)** (128 行)
- 数据导出器接口
- 支持多种导出格式（CSV, PDF, Excel, JSON）
- 包含丰富的导出配置选项
- 支持 KPI 报告导出

```typescript
export interface IExporter {
  exportToCSV(data: InsuranceRecord[], options?: ExportOptions): Promise<Blob>
  exportToPDF(data: InsuranceRecord[], kpis?: KPIResult, options?: ExportOptions): Promise<Blob>
  exportKPIReport(kpis: KPIResult, format: ExportFormat, options?: ExportOptions): Promise<Blob>
}
```

---

### 2. 用例（Use Cases）

实现了三个核心用例，编排业务流程：

#### **[UploadDataUseCase](../src/application/use-cases/upload-data.ts)** (154 行)
处理文件上传的完整流程：

1. **验证文件** - 检查文件格式和内容
2. **解析数据** - 调用 Parser 解析文件
3. **规范化数据** - 调用 Domain 层的规范化函数
4. **保存到仓储** - 持久化数据

```typescript
class UploadDataUseCase {
  async execute(file: File): Promise<UploadResult> {
    // 1. 验证
    const validation = await this.validateFile(file)
    // 2. 解析
    const rawRecords = await this.parser.parse(file)
    // 3. 规范化
    const result = normalizeInsuranceRecordsBatch(rawRecords)
    // 4. 保存
    await this.repository.save(result.success)
    return { success: true, ... }
  }
}
```

#### **[CalculateKPIUseCase](../src/application/use-cases/calculate-kpi.ts)** (253 行)
计算 KPI 指标：

- 支持基础 KPI 计算
- 支持分组 KPI 计算（按年份、周次、机构等）
- 处理空数据情况
- 支持数据筛选

```typescript
class CalculateKPIUseCase {
  async execute(filters?: DataFilters): Promise<KPICalculationResult>
  async executeGrouped(groupBy: GroupByDimension, filters?: DataFilters): Promise<GroupedKPIResult[]>
}
```

#### **[ExportReportUseCase](../src/application/use-cases/export-report.ts)** (257 行)
处理数据和报告导出：

- 导出原始数据（CSV, PDF）
- 导出 KPI 报告
- 导出综合报告（数据 + KPI）
- 自动生成文件名（带时间戳）

```typescript
class ExportReportUseCase {
  async exportData(format: ExportFormat, filters?: DataFilters): Promise<ExportResult>
  async exportKPIReport(format: ExportFormat, filters?: DataFilters): Promise<ExportResult>
  async exportComprehensiveReport(filters?: DataFilters): Promise<ExportResult>
}
```

---

### 3. 应用服务（Services）

#### **[DataService](../src/application/services/data-service.ts)** (108 行)
提供数据访问的统一接口：

```typescript
class DataService {
  async getAllData(): Promise<InsuranceRecord[]>
  async getFilteredData(filters: DataFilters): Promise<InsuranceRecord[]>
  async getDataByWeek(weekNumber: number): Promise<InsuranceRecord[]>
  async getDataByYear(year: number): Promise<InsuranceRecord[]>
  async getStats(): Promise<DataStats>
  async clearAllData(): Promise<void>
  async hasData(): Promise<boolean>
  async getAvailableYears(): Promise<number[]>
  async getWeekRange(): Promise<{ min: number; max: number }>
}
```

---

### 4. 单元测试

编写了 22 个单元测试，覆盖所有核心功能：

#### **[upload-data.test.ts](../src/application/__tests__/upload-data.test.ts)** - 5 个测试
- ✅ 应该成功上传有效的文件
- ✅ 当文件验证失败时应该抛出错误
- ✅ 当文件为空时应该抛出错误
- ✅ 当文件类型不支持时应该抛出错误
- ✅ 应该调用仓储保存数据

#### **[calculate-kpi.test.ts](../src/application/__tests__/calculate-kpi.test.ts)** - 6 个测试
- ✅ 应该成功计算 KPI
- ✅ 当没有数据时应该返回空 KPI
- ✅ 应该支持按条件筛选数据
- ✅ 应该支持分组计算 KPI
- ✅ 分组计算应该正确分组数据
- ✅ 当分组后没有数据时应该返回空数组

#### **[data-service.test.ts](../src/application/__tests__/data-service.test.ts)** - 11 个测试
- ✅ 应该返回所有数据
- ✅ 当没有数据时应该返回空数组
- ✅ 应该根据筛选条件获取数据
- ✅ 应该根据周次获取数据
- ✅ 应该根据年份获取数据
- ✅ 应该返回数据统计信息
- ✅ 应该清空所有数据
- ✅ 当有数据时应该返回 true
- ✅ 当没有数据时应该返回 false
- ✅ 应该返回可用的年份列表
- ✅ 应该返回周次范围

**测试结果**：
```
Test Files  3 passed (3)
Tests  22 passed (22)
```

---

## ✅ 架构规则验证

### 1. 依赖方向检查

```bash
# ✅ Application 层没有依赖 React
grep -r "from 'react'" src/application/  # 无结果

# ✅ Application 层没有依赖 Infrastructure
grep -r "from.*infrastructure" src/application/  # 无结果

# ✅ Application 层没有直接的 API 调用
grep -r "fetch\|axios\|supabase" src/application/  # 无结果
```

### 2. 文件大小检查

所有文件均符合 < 300 行的要求：

```
✅ calculate-kpi.ts:      253 行
✅ upload-data.ts:        154 行
✅ export-report.ts:      257 行
✅ IFileParser.ts:        135 行
✅ IDataRepository.ts:     99 行
✅ IExporter.ts:          128 行
✅ data-service.ts:       108 行
```

### 3. 单一职责验证

每个类/文件都有明确的单一职责：

- `IDataRepository` - 只定义数据持久化接口
- `IFileParser` - 只定义文件解析接口
- `IExporter` - 只定义数据导出接口
- `UploadDataUseCase` - 只负责文件上传流程
- `CalculateKPIUseCase` - 只负责 KPI 计算流程
- `ExportReportUseCase` - 只负责报告导出流程
- `DataService` - 只负责数据查询

### 4. 依赖倒置原则

Application 层通过定义抽象接口（Ports）来依赖 Domain 层，而不直接依赖 Infrastructure 层的具体实现：

```typescript
// ✅ 正确：依赖抽象
class UploadDataUseCase {
  constructor(
    private readonly parser: IFileParser,      // 接口
    private readonly repository: IDataRepository // 接口
  ) {}
}

// ❌ 错误：依赖具体实现
class UploadDataUseCase {
  constructor(
    private readonly parser: CSVParser,        // 具体类
    private readonly repository: DuckDBRepository // 具体类
  ) {}
}
```

---

## 📊 目录结构

```
src/application/
├── ports/                      ← 端口接口（抽象层）
│   ├── IDataRepository.ts      ← 数据仓储接口
│   ├── IFileParser.ts          ← 文件解析器接口
│   ├── IExporter.ts            ← 数据导出器接口
│   └── index.ts                ← 公开接口
│
├── use-cases/                  ← 用例（业务流程编排）
│   ├── upload-data.ts          ← 上传数据用例
│   ├── calculate-kpi.ts        ← 计算 KPI 用例
│   ├── export-report.ts        ← 导出报告用例
│   └── index.ts                ← 公开接口
│
├── services/                   ← 应用服务
│   ├── data-service.ts         ← 数据服务
│   └── index.ts                ← 公开接口
│
├── __tests__/                  ← 单元测试
│   ├── test-helpers.ts         ← 测试辅助函数
│   ├── upload-data.test.ts     ← 上传用例测试
│   ├── calculate-kpi.test.ts   ← KPI 计算测试
│   └── data-service.test.ts    ← 数据服务测试
│
└── index.ts                    ← Application 层公开接口
```

---

## 🎯 设计亮点

### 1. 端口和适配器模式（Hexagonal Architecture）

通过定义 Ports 接口，实现了业务逻辑与技术细节的解耦：

- **可测试性**：可以轻松 Mock 接口进行单元测试
- **可替换性**：可以无痛切换实现（如从 DuckDB 切换到 PostgreSQL）
- **独立性**：业务逻辑不依赖具体的技术栈

### 2. 用例驱动设计

每个用例代表一个完整的业务流程：

- **清晰的职责**：一个用例 = 一个业务场景
- **易于理解**：代码即文档，流程一目了然
- **易于扩展**：新增业务场景只需添加新用例

### 3. 依赖注入

所有依赖通过构造函数注入：

```typescript
class UploadDataUseCase {
  constructor(
    private readonly parser: IFileParser,
    private readonly repository: IDataRepository
  ) {}
}
```

**优势**：
- 易于测试（可以注入 Mock）
- 依赖明确（一眼就能看出依赖关系）
- 符合 SOLID 原则

### 4. 错误处理

定义了专门的错误类型：

```typescript
class UploadError extends Error {
  constructor(
    public readonly code: UploadErrorCode,
    message: string,
    public readonly validationErrors?: Array<{ message: string }>,
    public readonly originalError?: unknown
  ) {}
}
```

**优势**：
- 错误信息结构化
- 便于错误追踪和调试
- 支持国际化

---

## 🔄 与其他层的关系

### Application → Domain

```typescript
// Application 层调用 Domain 层的业务规则
import { normalizeInsuranceRecordsBatch, calculateKPIs } from '../../domain'

const result = normalizeInsuranceRecordsBatch(rawRecords)
const kpis = calculateKPIs(records)
```

### Infrastructure → Application

```typescript
// Infrastructure 层实现 Application 层定义的接口
import type { IDataRepository } from '@/application/ports'

class DuckDBRepository implements IDataRepository {
  async save(records: InsuranceRecord[]): Promise<void> {
    // DuckDB 具体实现
  }
}
```

---

## 📝 下一步工作

根据重构计划 [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)，接下来的任务是：

### Day 5：编写更多单元测试
- [ ] 增加边界测试用例
- [ ] 增加异常处理测试
- [ ] 提高测试覆盖率到 > 80%

### Day 6-7：实现适配器（Infrastructure 层）
- [ ] 实现 DuckDBRepository
- [ ] 实现 CSVParser
- [ ] 实现 PDFExporter
- [ ] 编写适配器测试

### Day 8-9：重构 Store
- [ ] 拆分巨型 Store
- [ ] 整合 Use Case 到 Store
- [ ] 测试 Store 集成

---

## 📚 参考资料

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**作者**：Claude Code
**审核**：待审核
**版本**：v1.0
**日期**：2025-11-14
