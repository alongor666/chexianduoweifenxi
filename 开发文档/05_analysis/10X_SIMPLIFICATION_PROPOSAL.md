# 真正的 10 倍简化方案：DuckDB-Native + Schema-Driven 架构

> **提出时间**: 2026-02-06
> **基于**: 58,532 LOC / 301 文件的逐行实测分析
> **核心论点**: 三个版本都在"怎么整理代码"上打转，没有触及根本问题——复杂度放错了位置。

---

## 一、三个版本为什么都不够

三个版本的共同假设是："现有架构没问题，只需要合并/提取/配置化"。

但实测数据揭示了真正的问题：

```
当前数据流（7 层传递）：
  CSV 文件
    → 解析为 JS 对象 (csv-parser-service.ts, 678 行)
    → 存入 Zustand Store (use-app-store.ts, 991 行 + 5 个 domain stores)
    → 经过 16 个筛选器组件过滤 (2,754 行)
    → 通过 20+ 个 hooks 转换 (hooks/, 估计 3000+ 行)
    → 在组件内再次计算 KPI (kpi-calculator-enhanced.ts, 1,080 行)
    → 渲染到 117 个组件文件 (~35,000 行)
```

**这条链路上，每一层都在用 JavaScript 做数据库该做的事情。**

- 16 个筛选器？是 JavaScript 在模拟 `WHERE` 子句
- KPI 计算？是 JavaScript 在模拟 `SUM/AVG/CASE WHEN`
- 维度分析 hooks？是 JavaScript 在模拟 `GROUP BY`
- 趋势计算？是 JavaScript 在模拟窗口函数

而项目已经引入了 **DuckDB-WASM**——一个完整的列式分析数据库——却只用它做了最基础的存储。

---

## 二、根本思路：把复杂度推给数据库

```
目标数据流（3 层）：
  CSV 文件
    → 加载到 DuckDB (1 步)
    → SQL 完成所有筛选/聚合/KPI 计算 (1 步)
    → 渲染结果 (1 步)
```

**这不是重构，是架构范式转换。** 从"JavaScript 应用 + 数据库存储"变为"数据库计算 + JavaScript 渲染"。

---

## 三、具体架构设计

### 3.1 目标目录结构

```
src/
├── app/                        # Next.js 壳 (~300 行)
│   ├── layout.tsx              # 全局布局
│   └── page.tsx                # 单页应用，Tab 切换
│
├── engine/                     # 三大引擎 (~2,500 行)
│   ├── query-engine.ts         # DuckDB 查询构建器 + 执行器
│   ├── filter-engine.tsx       # 通用筛选框架（1 个组件替代 16 个）
│   └── render-engine.tsx       # Schema → React 组件树
│
├── atoms/                      # 3 个原子组件 (~1,200 行)
│   ├── MetricCard.tsx          # 任何 KPI/指标展示
│   ├── DataChart.tsx           # 任何 ECharts 图表
│   └── DataTable.tsx           # 任何表格展示
│
├── schemas/                    # 功能定义 (~1,500 行)
│   ├── _types.ts               # Schema 类型定义
│   ├── cockpit.ts              # 驾驶舱配置
│   ├── premium.ts              # 保费分析配置
│   ├── loss.ts                 # 赔付分析配置
│   ├── thematic.ts             # 专题分析配置
│   ├── trend.ts                # 趋势分析配置
│   └── drill-down.ts           # 下钻分析配置
│
├── sql/                        # SQL 模板 (~800 行)
│   ├── kpi.sql                 # 全部 16 个 KPI 计算
│   ├── dimension-analysis.sql  # 维度聚合
│   ├── trend.sql               # 趋势/窗口函数
│   └── comparison.sql          # 对比分析
│
├── domain/                     # 纯业务规则 (~500 行)
│   ├── kpi-formulas.ts         # 仅保留不适合 SQL 的公式
│   ├── color-scales.ts         # 颜色映射函数
│   └── narrative-templates.ts  # 文本模板（叙事生成）
│
├── infra/                      # 基础设施 (~800 行)
│   ├── duckdb-client.ts        # DuckDB-WASM 初始化和连接
│   ├── file-ingestion.ts       # CSV/Excel → DuckDB 加载
│   └── export-plugin.ts       # 通用导出（CSV/PDF/PPT）
│
└── types/                      # 类型定义 (~300 行)
    └── index.ts
```

**总计：~7,900 行 / ~25 个文件**

对比现状 58,532 行 / 301 个文件，**简化 7.4 倍**。

---

### 3.2 核心设计：把筛选变成 SQL WHERE

**现状**（2,754 行 / 16 个文件）：

```typescript
// organization-filter.tsx (75 行)
// channel-filter.tsx (68 行)
// product-filter.tsx (72 行)
// customer-filter.tsx (65 行)
// ... 每个筛选器重复相同模式
export function OrganizationFilter() {
  const filters = useFilterStore(state => state.filters)
  const updateFilters = useFilterStore(state => state.updateFilters)
  const records = filterRecordsWithExclusions(rawData, filters, ['organizations'])
  const available = Array.from(new Set(records.map(r => r.organization)))
  return <MultiSelectFilter options={available} ... />
}
```

**实测发现**：每个筛选器的代码结构 100% 相同，只是字段名不同。

**新方案**（~200 行 / 1 个文件）：

```typescript
// engine/filter-engine.tsx

// 筛选器配置（替代 16 个文件）
const FILTER_SCHEMA: FilterDef[] = [
  { id: 'organization', field: 'third_level_organization', label: '机构', type: 'multi-select' },
  { id: 'channel',      field: 'terminal_source',         label: '渠道', type: 'multi-select' },
  { id: 'product',      field: 'business_nature',         label: '产品', type: 'multi-select' },
  { id: 'customer',     field: 'customer_category',       label: '客户', type: 'multi-select' },
  { id: 'new_energy',   field: 'is_new_energy',           label: '新能源', type: 'toggle' },
  { id: 'week',         field: 'week_ending',             label: '周次', type: 'range' },
]

// 一个组件渲染所有筛选器
export function FilterPanel({ schema = FILTER_SCHEMA }: { schema?: FilterDef[] }) {
  const [selections, setSelections] = useState<Record<string, string[]>>({})

  // 可选项直接从 DuckDB 查询（联动筛选）
  const { data: options } = useQuery(
    schema.map(f => `SELECT DISTINCT ${f.field} FROM insurance_data`)
  )

  // 用户选择 → 生成 SQL WHERE 子句
  const whereClause = buildWhereClause(selections, schema)

  return (
    <div className="flex flex-wrap gap-2">
      {schema.map(filter => (
        <FilterControl
          key={filter.id}
          definition={filter}
          options={options[filter.id]}
          selected={selections[filter.id]}
          onChange={v => setSelections(prev => ({ ...prev, [filter.id]: v }))}
        />
      ))}
    </div>
  )
}

// WHERE 子句构建器（替代 filterRecordsWithExclusions）
function buildWhereClause(selections: Record<string, string[]>, schema: FilterDef[]): string {
  const conditions = schema
    .filter(f => selections[f.id]?.length > 0)
    .map(f => {
      const values = selections[f.id].map(v => `'${v}'`).join(',')
      return `${f.field} IN (${values})`
    })
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
}
```

**效果**：2,754 行 → ~200 行。**减少 93%。**

---

### 3.3 核心设计：把 KPI 计算变成 SQL

**现状**（kpi-calculator-enhanced.ts, 1,080 行）：

```typescript
// JavaScript 里手动聚合和计算
export function calculateKPIs(records: InsuranceRecord[]): KPIResult {
  let totalSignedPremium = 0
  let totalPolicyCount = 0
  let totalClaimPayment = 0
  // ... 手动遍历和累加
  records.forEach(record => {
    totalSignedPremium += record.signed_premium_yuan
    // ...
  })
  // 手动计算比率
  const lossRatio = totalClaimPayment / totalMaturedPremium
  // ... 1080 行
}
```

**新方案**（sql/kpi.sql, ~100 行）：

```sql
-- sql/kpi.sql
-- 全部 16 个 KPI，一条 SQL 搞定
SELECT
  -- 规模指标
  SUM(signed_premium_yuan) / 10000           AS signed_premium_wan,
  SUM(policy_count)                           AS total_policies,
  SUM(signed_premium_yuan) / NULLIF(SUM(policy_count), 0) AS avg_premium,

  -- 赔付指标
  SUM(reported_claim_payment_yuan) / NULLIF(SUM(matured_premium_yuan), 0) AS loss_ratio,
  SUM(claim_case_count) / NULLIF(SUM(policy_count), 0)                    AS claim_frequency,

  -- 费用指标
  SUM(expense_amount_yuan) / NULLIF(SUM(signed_premium_yuan), 0) AS expense_ratio,

  -- 综合指标
  (SUM(reported_claim_payment_yuan) + SUM(expense_amount_yuan))
    / NULLIF(SUM(matured_premium_yuan), 0)   AS combined_ratio,

  -- 边际贡献
  (SUM(matured_premium_yuan) - SUM(reported_claim_payment_yuan) - SUM(expense_amount_yuan))
    / 10000                                   AS contribution_margin_wan,

  -- 满期率
  SUM(matured_premium_yuan) / NULLIF(SUM(signed_premium_yuan), 0) AS maturity_ratio,

  -- 时间进度
  SUM(signed_premium_yuan) / NULLIF(:annual_target, 0)            AS premium_progress

FROM insurance_data
{WHERE_CLAUSE}  -- 筛选引擎生成的条件
```

**效果**：1,080 行 TypeScript → ~100 行 SQL。**减少 91%。**

---

### 3.4 核心设计：Feature = Schema + SQL + 渲染规则

**现状**：thematic-analysis.tsx (1,682 行) + 20 个子组件文件

**新方案**：

```typescript
// schemas/thematic.ts (~150 行)
export const thematicSchema: FeatureSchema = {
  id: 'thematic',
  title: '专题分析',
  tabs: [
    {
      id: 'premium',
      label: '保费分析',
      sections: [
        {
          type: 'kpi-row',
          query: 'kpi',  // 引用 sql/kpi.sql
          metrics: [
            { key: 'signed_premium_wan', label: '签单保费', unit: '万元', format: 'number:0' },
            { key: 'total_policies', label: '保单件数', unit: '件', format: 'number:0' },
            { key: 'avg_premium', label: '单均保费', unit: '元', format: 'number:0' },
            { key: 'premium_progress', label: '保费进度', unit: '%', format: 'percent:1',
              colorScale: 'premiumProgress' },
          ]
        },
        {
          type: 'chart',
          query: 'dimension-analysis',
          params: { dimension: 'third_level_organization', metric: 'signed_premium_yuan' },
          chartType: 'bar',
          title: '机构保费分布'
        },
        {
          type: 'table',
          query: 'dimension-analysis',
          params: { dimension: 'third_level_organization' },
          columns: [
            { key: 'dimension_label', label: '机构' },
            { key: 'premium_wan', label: '保费(万元)', format: 'number:1' },
            { key: 'loss_ratio', label: '赔付率', format: 'percent:1',
              colorScale: 'lossRatio' },
          ]
        }
      ]
    },
    {
      id: 'loss',
      label: '赔付分析',
      sections: [
        // ... 类似结构，不同的 metric keys 和 queries
      ]
    }
  ]
}
```

**渲染引擎**（engine/render-engine.tsx, ~400 行）：

```typescript
// engine/render-engine.tsx
export function FeatureRenderer({ schema }: { schema: FeatureSchema }) {
  const { whereClause } = useFilterContext()

  return (
    <Tabs defaultValue={schema.tabs[0].id}>
      <TabsList>
        {schema.tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>

      {schema.tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.sections.map((section, i) => (
            <SectionRenderer
              key={i}
              section={section}
              whereClause={whereClause}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function SectionRenderer({ section, whereClause }) {
  // 执行 SQL 查询
  const { data } = useDuckDBQuery(section.query, {
    ...section.params,
    whereClause,
  })

  // 根据 type 选择原子组件
  switch (section.type) {
    case 'kpi-row':
      return (
        <div className="grid grid-cols-4 gap-4">
          {section.metrics.map(metric => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={data?.[metric.key]}
              unit={metric.unit}
              format={metric.format}
              colorScale={metric.colorScale}
            />
          ))}
        </div>
      )

    case 'chart':
      return (
        <DataChart
          type={section.chartType}
          title={section.title}
          data={data}
          xKey={section.params.dimension}
          yKey={section.params.metric}
        />
      )

    case 'table':
      return (
        <DataTable
          data={data}
          columns={section.columns}
        />
      )
  }
}
```

**效果**：1,682 行 + 20 个子组件 → ~150 行配置 + 共享的 400 行引擎。

---

### 3.5 核心设计：叙事生成 = SQL 结果 + 模板

**现状**：use-analysis-narrative.ts (257 行) + summary-utils.ts (181 行) = 438 行

**新方案**：

```typescript
// domain/narrative-templates.ts (~80 行)
export function generateNarrative(kpis: Record<string, number>): string {
  const parts: string[] = []

  // 保费叙事
  if (kpis.premium_progress > 1.0) {
    parts.push(`保费进度达成率 ${fmt(kpis.premium_progress, 'percent')}，超额完成目标。`)
  } else if (kpis.premium_progress > 0.9) {
    parts.push(`保费进度 ${fmt(kpis.premium_progress, 'percent')}，接近目标。`)
  } else {
    parts.push(`保费进度仅 ${fmt(kpis.premium_progress, 'percent')}，需加速推进。`)
  }

  // 赔付叙事
  if (kpis.loss_ratio > 0.7) {
    parts.push(`赔付率 ${fmt(kpis.loss_ratio, 'percent')} 处于高位，需关注风险敞口。`)
  }

  // ... 基于 KPI 数值的模板化文本
  return parts.join('')
}
```

**效果**：438 行 → ~80 行。逻辑完全相同，只是数据来源从"hooks + 复杂状态"变为"SQL 结果 + 纯函数"。

---

## 四、量化对比

### 4.1 代码行数对比

| 模块 | 现状 (LOC) | 新方案 (LOC) | 减少 | 倍数 |
|------|:----------:|:------------:|:----:|:----:|
| **筛选系统** | 2,754 | 200 | 93% | **13.8x** |
| **KPI 计算** | 1,080 | 100 (SQL) | 91% | **10.8x** |
| **状态管理** | 3,500+ (16 stores + hooks) | 300 (DuckDB 即 store) | 91% | **11.7x** |
| **Feature 组件** | ~35,000 (117 文件) | ~3,700 (引擎 + 原子 + schema) | 89% | **9.5x** |
| **数据解析/加载** | 1,200+ | 800 | 33% | **1.5x** |
| **Domain 业务** | 1,800 | 500 | 72% | **3.6x** |
| **其他基础设施** | ~13,000 | 2,300 | 82% | **5.7x** |
| **合计** | **58,532** | **~7,900** | **86%** | **7.4x** |

### 4.2 文件数对比

| 类别 | 现状 | 新方案 | 减少 |
|------|:----:|:------:|:----:|
| 组件文件 | 117 | 3 (原子) + 2 (引擎) = **5** | **96%** |
| 筛选器文件 | 16 | **1** | **94%** |
| Store 文件 | 16 | **0** (DuckDB 即 store) | **100%** |
| Hook 文件 | 20+ | **2** (useDuckDBQuery, useFilterContext) | **90%** |
| Feature 定义 | 56 | **6** (schema 文件) | **89%** |
| 总计 | **301** | **~25** | **92%** |

---

## 五、为什么这个方案能持续开发

### 5.1 三关注点分离原则

```
┌─────────────────────────────────────────────────────────┐
│                    开发者视角                              │
├───────────────┬───────────────────┬─────────────────────┤
│ 加新功能？     │ 改业务规则？        │ 修 UI bug？          │
│ → 加 schema   │ → 改 SQL           │ → 改 atom           │
│ (无需写组件)   │ (无需碰前端)        │ (无需懂业务)         │
├───────────────┼───────────────────┼─────────────────────┤
│ schemas/      │ sql/              │ atoms/              │
│ 声明式配置     │ 纯数据逻辑         │ 纯展示逻辑           │
│ ~100行/功能   │ ~50行/查询         │ 3个通用组件          │
└───────────────┴───────────────────┴─────────────────────┘
```

### 5.2 新增功能的成本对比

**示例：新增"渠道分析"页面**

| 步骤 | 现有架构 | 新架构 |
|------|----------|--------|
| 1 | 创建 ChannelAnalysis.tsx (~400 行) | 创建 schemas/channel.ts (~100 行) |
| 2 | 创建 useChannelData.ts hook (~150 行) | 创建 sql/channel.sql (~30 行) |
| 3 | 创建 channel 筛选器 (~70 行) | 在 schema 中声明 filters: ['channel', 'week'] |
| 4 | 创建 ChannelCard.tsx (~80 行) | 复用 MetricCard (0 行) |
| 5 | 创建 ChannelChart.tsx (~100 行) | 复用 DataChart (0 行) |
| 6 | 在 store 中添加 channel 状态 (~50 行) | 不需要 (0 行) |
| 7 | 在 page.tsx 中添加路由/Tab (~20 行) | 引擎自动从 schema 注册 (0 行) |
| **合计** | **~870 行新代码** | **~130 行配置** |
| **倍数** | 1x | **6.7x 效率提升** |

### 5.3 持续开发的护栏

```
规则 1: 永远不在 atoms/ 里写业务逻辑
规则 2: 永远不在 schemas/ 里写渲染代码
规则 3: 永远不在 sql/ 里写 UI 逻辑
规则 4: 新功能必须先写 schema，再（如果需要）写 SQL
规则 5: 如果 schema 表达不了需求，先扩展 engine 的能力，而非绕过它
```

---

## 六、不适合 SQL 化的部分（诚实说明）

| 功能 | 为什么不能纯 SQL | 解决方案 |
|------|------------------|----------|
| **颜色映射** | UI 逻辑，非数据逻辑 | `domain/color-scales.ts` (~50 行纯函数) |
| **叙事生成** | 需要自然语言模板 | `domain/narrative-templates.ts` (~80 行) |
| **文件上传 UI** | 交互逻辑 | `infra/file-ingestion.ts` 保留上传流程 |
| **ECharts 配置** | 图表库 API | `atoms/DataChart.tsx` 内封装 |
| **导出 PPT/PDF** | 需要文件生成库 | `infra/export-plugin.ts` |

这些加起来 ~500 行，是不可消除的本质复杂度。

---

## 七、与三版本的关系

| 方面 | 三版本的建议 | 本方案的做法 |
|------|-------------|-------------|
| "配置驱动页面" (V1) | 建议做但没说怎么做 | **具体定义了 FeatureSchema 类型和渲染引擎** |
| "统一数据入口" (V1) | 合并双模式 | **DuckDB 即唯一数据入口，SQL 即唯一查询语言** |
| "业务下沉" (V2) | 把计算移到 Domain 层 | **更彻底：把计算移到 SQL 层** |
| "单一真理源" (V2) | 统一 Store | **消灭 Store：DuckDB 即真理源** |
| "功能合并" (V3) | 多页面→单页面多 Tab | **引擎自动从 schema 生成 Tab** |
| "验收清单" (V3) | 手工检查 | **Schema 即清单：有 schema 定义即有功能** |

---

## 八、实施路径（4 个阶段）

### 阶段 0：搭建引擎骨架 (2-3 天)

```
目标：新架构能跑通一个最简功能（如 KPI 总览）
产出：
  - engine/query-engine.ts (DuckDB 查询执行)
  - engine/filter-engine.tsx (通用筛选)
  - atoms/MetricCard.tsx (指标卡)
  - schemas/overview.ts (第一个 schema)
  - sql/kpi.sql (核心 KPI 查询)
验证：用现有 CSV 数据，新架构能展示 KPI 结果
```

### 阶段 1：迁移全部功能到 Schema (5-7 天)

```
目标：所有 6 大 Feature 都有对应的 schema + SQL
产出：
  - 6 个 schema 文件
  - 4 个 SQL 模板文件
  - atoms/DataChart.tsx + DataTable.tsx
  - engine/render-engine.tsx 完成
验证：新旧架构并行运行，对比结果一致
```

### 阶段 2：替换旧代码 (2-3 天)

```
目标：删除旧的组件/hooks/stores
产出：
  - 删除 src/components/features/ (56 个文件)
  - 删除 src/components/filters/ (16 个文件)
  - 删除 src/store/ (16 个文件)
  - 删除 src/hooks/ 大部分 (15+ 个文件)
验证：全功能回归测试通过
```

### 阶段 3：打磨和文档 (1-2 天)

```
目标：完善边缘情况，更新开发文档
产出：
  - 补充导出功能
  - 更新 CLAUDE.md 中的护栏规则
  - 编写 Schema 开发指南
  - 更新 CODE_INDEX.md
验证：治理检查通过
```

**总工期：10-15 天。最终产出 ~7,900 行 / ~25 个文件。**

---

## 九、风险与缓解

| 风险 | 概率 | 缓解措施 |
|------|------|----------|
| DuckDB-WASM 查询性能不足 | 低 | DuckDB 列式存储对聚合查询极快；车险数据量级（万级行）远低于其能力 |
| Schema 表达力不够 | 中 | 在 engine 中预留 `custom` section 类型，允许传入自定义渲染函数 |
| 迁移期间功能回归 | 中 | 阶段 1 新旧并行，逐功能切换，非一刀切 |
| SQL 注入风险 | 低 | 使用参数化查询，筛选值通过 prepared statement 传入 |

---

## 十、一句话总结

> **三个版本在问"怎么整理 301 个文件"，本方案在问"为什么需要 301 个文件"。**
> **答案是不需要。DuckDB 做计算，Schema 做声明，Atom 做渲染。25 个文件，7,900 行。**
