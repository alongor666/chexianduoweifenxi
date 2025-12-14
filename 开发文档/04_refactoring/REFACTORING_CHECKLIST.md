---
id: 04_refactoring_refactoring_checklist
title: ✅ 重构检查清单
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

# ✅ 重构检查清单

> **用途**：每次编写/修改代码前必须检查的规则
> **适用于**：开发者自查、Code Review、AI 协作

---

## 📋 使用说明

### 何时使用

- ✅ **创建新文件前** - 确定文件应该放在哪一层
- ✅ **编写代码时** - 实时检查是否符合架构规则
- ✅ **提交代码前** - 完整检查所有规则
- ✅ **Code Review 时** - 审核者检查清单

### 如何使用

```markdown
每个检查项前的符号：

- [ ] 未检查
- [x] 已检查且通过
- [!] 检查发现问题，需要修复
```

---

## 🎯 快速检查（30 秒）

> 提交代码前，快速检查这 5 项

```markdown
- [ ] 文件 < 300 行？
- [ ] 函数 < 50 行？
- [ ] 没有复制粘贴代码？
- [ ] 依赖方向正确？（外→内）
- [ ] 能用一句话描述文件职责？
```

如果全部通过 ✅ → 可以提交
如果任一项不通过 ❌ → 继续完整检查

---

## 📐 第一层：依赖方向检查

> **规则**：依赖只能从外向内（Infrastructure → Application → Domain）

### Domain 层检查

```markdown
## 如果你在 src/domain/ 中工作：

- [ ] 没有 import React？
- [ ] 没有 import 任何 UI 组件？
- [ ] 没有 import API 客户端（fetch、axios、supabase）？
- [ ] 没有 import 任何 Infrastructure 层代码？
- [ ] 只使用纯 TypeScript（无副作用）？
```

**自动检查命令**：

```bash
# 检查 Domain 层是否违规
grep -r "from 'react'" src/domain/ && echo "❌ 违规" || echo "✅ 通过"
grep -r "fetch\|axios\|supabase" src/domain/ && echo "❌ 违规" || echo "✅ 通过"
```

---

### Application 层检查

```markdown
## 如果你在 src/application/ 中工作：

- [ ] 没有 import React 组件？
- [ ] 没有 import Infrastructure 层的具体实现？
- [ ] 只依赖 Port 接口（而非具体实现）？
- [ ] 可以独立测试（不需要真实的 API/数据库）？
```

**反模式识别**：

```typescript
// ❌ 错误：Application 层依赖具体实现
import { DuckDBRepository } from '@/infrastructure/adapters/DuckDBRepository'

// ✅ 正确：依赖抽象接口
import { IDataRepository } from '@/application/ports/IDataRepository'
```

---

### Infrastructure 层检查

```markdown
## 如果你在 src/infrastructure/ 中工作：

- [ ] 实现了对应的 Port 接口？
- [ ] 不包含业务逻辑？（业务逻辑应在 Domain 层）
- [ ] 可以被其他实现替换？（如 DuckDB → PostgreSQL）
```

---

## 🎭 第二层：单一职责检查

> **规则**：一个模块只有一个改变的理由

### 文件职责检查

```markdown
- [ ] 能用一句话描述这个文件的职责？
      （不能用"和"来连接多个职责）

- [ ] 如果删除这个文件的某个函数，其他函数还有意义吗？
      （如果无关联 → 内聚度低）

- [ ] 文件名清晰表达职责？
      ✅ kpi-calculator.ts (计算 KPI)
      ❌ utils.ts (太泛化)
      ❌ helpers.ts (太模糊)
```

### 函数职责检查

```markdown
- [ ] 函数名是动词开头？（表达清晰的操作）
      ✅ calculateKPI()
      ✅ validateData()
      ❌ data() (名词，不清晰)

- [ ] 函数参数 < 5 个？
      （超过 5 个 → 职责可能过多）

- [ ] 函数只做一件事？
      ❌ fetchDataAndCalculateAndSave() (做了 3 件事)
      ✅ fetchData() + calculate() + save()
```

---

## 🧩 第三层：关注点分离检查

> **规则**：不同性质的逻辑必须物理隔离

### UI 组件检查

```markdown
## React 组件检查：

- [ ] 只负责渲染 UI？
- [ ] 不包含业务计算？（通过 Hook 获取数据）
- [ ] 不直接调用 API？（通过 Use Case）
- [ ] 不直接操作 LocalStorage/IndexedDB？

## 组件大小检查：

- [ ] 组件 < 200 行？
- [ ] 如果超过，是否可以拆分为子组件？
- [ ] JSX 嵌套层级 < 5 层？
```

**拆分标准**：

```typescript
// ❌ 臃肿的组件（300+ 行）
function ProductPage() {
  // 50 行状态管理
  // 100 行业务逻辑
  // 150 行 JSX
}

// ✅ 拆分后（每个 < 100 行）
function ProductPage() {
  return (
    <>
      <ProductHeader />
      <ProductInfo />
      <ProductActions />
    </>
  )
}
```

---

### Hook 检查

```markdown
## 自定义 Hook 检查：

- [ ] Hook 职责单一？
      ✅ useProductData() (获取产品数据)
      ✅ useCart() (购物车操作)
      ❌ useEverything() (包罗万象)

- [ ] Hook 不包含业务计算？
      （业务计算应在 Domain 层）

- [ ] Hook 可复用？
      （不绑定特定页面）
```

---

### Store 检查

```markdown
## 状态管理检查：

- [ ] Store 只负责状态存储？
      （不包含业务逻辑）

- [ ] 状态更新是 immutable 的？
      ❌ state.data.push(item)
      ✅ set({ data: [...state.data, item] })

- [ ] Store 文件 < 200 行？
      （超过 → 拆分为多个 Store）

- [ ] Store 不直接调用 API？
      （通过 Use Case）
```

---

## 🔄 第四层：DRY 原则检查

> **规则**：每个知识点只有一个权威表示

### 重复代码检查

```markdown
- [ ] 有复制粘贴的代码吗？
      （超过 3 行 → 必须提取）

- [ ] 相同逻辑出现超过 2 次？
      （必须抽象）

- [ ] 相似的 if-else 结构？
      （考虑策略模式）
```

**检测方法**：

```bash
# 查找可能的重复代码
pnpm add -D jscpd
npx jscpd src/
```

---

### 业务规则重复检查

```markdown
- [ ] 业务规则是否散落各处？
      ❌ if (premium > 10000) { ... } // 出现在 5 个文件中
      ✅ isHighValuePolicy(premium) // 集中定义在 Domain 层

- [ ] 验证逻辑是否重复？
      ❌ 每个表单都写一遍邮箱验证
      ✅ 使用统一的 validator

- [ ] 数据转换逻辑是否重复？
      ❌ 多处写 JSON.parse
      ✅ 使用统一的 parseData() 函数
```

---

## 🏗️ 第五层：命名规范检查

> **规则**：命名必须清晰、一致、有意义

### 文件命名检查

```markdown
- [ ] 使用 kebab-case？
      ✅ kpi-calculator.ts
      ✅ data-service.ts
      ❌ KPICalculator.ts (PascalCase 用于类名)
      ❌ kpi_calculator.ts (snake_case 用于 Python)

- [ ] 组件文件用 PascalCase？
      ✅ ProductCard.tsx
      ✅ UserProfile.tsx
      ❌ productCard.tsx

- [ ] 测试文件命名？
      ✅ kpi-calculator.test.ts
      ✅ ProductCard.test.tsx
```

---

### 变量命名检查

```markdown
- [ ] 布尔值用 is/has/can 开头？
      ✅ isLoading
      ✅ hasPermission
      ✅ canEdit
      ❌ loading (不清楚类型)

- [ ] 数组用复数？
      ✅ products
      ✅ users
      ❌ productList (冗余)

- [ ] 函数用动词开头？
      ✅ calculateTotal()
      ✅ fetchData()
      ❌ total() (名词)

- [ ] 常量用 UPPER_SNAKE_CASE？
      ✅ MAX_RETRY_COUNT
      ✅ API_BASE_URL
      ❌ maxRetryCount (常量应全大写)
```

---

### 类型命名检查

```markdown
- [ ] 接口用 I 开头（可选）或描述性名称？
      ✅ IDataRepository / DataRepository
      ✅ IUserService / UserService
      ❌ Data (太泛化)

- [ ] 类型用 PascalCase？
      ✅ InsuranceRecord
      ✅ KPIResult
      ❌ insurance_record

- [ ] 枚举用 PascalCase，值用 UPPER_SNAKE_CASE？
      ✅ enum Status { ACTIVE = 'ACTIVE', PENDING = 'PENDING' }
      ❌ enum status { active = 'active' }
```

---

## 📦 第六层：模块导出检查

> **规则**：明确的公开接口（Public API）

### Feature 公开接口检查（FSD）

```markdown
## 如果你在 features/ 中工作：

- [ ] 有 index.ts 文件？
- [ ] index.ts 明确声明导出内容？
- [ ] 只导出必要的符号？
      ✅ export { ProductList } from './ui/ProductList'
      ❌ export \* from './ui' (导出所有，破坏封装)

- [ ] 内部实现不被外部直接导入？
      ❌ import { ProductCard } from '@/features/products/ui/ProductCard'
      ✅ import { ProductList } from '@/features/products'
```

**示例**：

```typescript
// src/features/kpi-dashboard/index.ts
export { KPIDashboard } from './ui/KPIDashboard'
export { useKPIData } from './model/useKPIData'
export type { KPIResult } from './types'

// 不导出内部组件
// ❌ export { KPICard } from './ui/KPICard'  (内部实现)
```

---

## 🧪 第七层：测试检查

> **规则**：关键逻辑必须有测试

### 测试覆盖检查

```markdown
- [ ] Domain 层所有函数有单元测试？
- [ ] Application 层所有 Use Case 有测试？
- [ ] 关键业务流程有集成测试？
- [ ] 测试覆盖率 > 60%？
```

**检测命令**：

```bash
pnpm test:coverage
# 查看覆盖率报告
```

---

### 测试质量检查

```markdown
- [ ] 测试有清晰的描述？
      ✅ it('应该正确计算满期赔付率', ...)
      ❌ it('test 1', ...)

- [ ] 测试独立运行？
      （不依赖其他测试的执行顺序）

- [ ] 测试数据清晰？
      ✅ const testUser = { id: '1', name: 'Alice' }
      ❌ const data = {...} (不知道是什么)

- [ ] 测试断言明确？
      ✅ expect(result).toBe(0.85)
      ❌ expect(result).toBeTruthy() (太模糊)
```

---

## 📝 第八层：文档检查

> **规则**：复杂逻辑必须有文档

### 代码注释检查

```markdown
- [ ] 复杂算法有注释？
      （如 KPI 计算公式）

- [ ] 反直觉的代码有注释？
      （解释"为什么"而非"是什么"）

- [ ] 公开接口有 JSDoc？
      /\*\*
      _ 计算满期赔付率
      _ @param records - 保险记录数组
      _ @returns 赔付率（0-1 之间的小数）
      _/
      export function calculateClaimRate(records: InsuranceRecord[]): number

- [ ] 没有过时的注释？
      （代码改了，注释也要改）
```

---

### 架构决策记录（ADR）

```markdown
## 重大架构决策是否记录？

- [ ] 为什么选择这个技术方案？
- [ ] 有哪些替代方案？
- [ ] 优缺点是什么？
- [ ] 记录在 docs/adr/ 目录？
```

---

## 🚀 第九层：性能检查

> **规则**：避免明显的性能问题

### React 性能检查

```markdown
- [ ] 避免在 render 中创建函数？
      ❌ onClick={() => handleClick()}
      ✅ onClick={handleClick}

- [ ] 昂贵计算使用 useMemo？
      ✅ const result = useMemo(() => heavyCalculation(), [deps])

- [ ] 列表渲染有 key？
      ✅ {items.map(item => <div key={item.id}>...)}
      ❌ {items.map(item => <div>...)} (会导致重渲染)

- [ ] 避免不必要的重渲染？
      （使用 React.memo、useCallback）
```

---

### 数据处理性能检查

```markdown
- [ ] 大数据集使用虚拟滚动？
      （> 1000 条记录）

- [ ] 避免嵌套循环？
      ❌ O(n²) 算法
      ✅ O(n) 算法（使用 Map/Set）

- [ ] 数据库查询有索引？
      （DuckDB 查询）
```

---

## ✅ 提交前最终检查

> **最后一步**：提交代码前，完整执行

```bash
#!/bin/bash
echo "🔍 执行提交前检查..."

# 1. 代码格式化
echo "1️⃣ 格式化代码..."
pnpm format

# 2. Lint 检查
echo "2️⃣ Lint 检查..."
pnpm lint

# 3. 类型检查
echo "3️⃣ 类型检查..."
pnpm typecheck

# 4. 单元测试
echo "4️⃣ 运行测试..."
pnpm test

# 5. 构建检查
echo "5️⃣ 构建检查..."
pnpm build

# 6. 架构规则检查
echo "6️⃣ 架构规则检查..."
./scripts/check-architecture.sh

echo "✅ 所有检查通过！可以提交代码。"
```

**保存为 `.git/hooks/pre-commit`**

---

## 📊 检查清单评分

### 自评表

| 检查项       | 权重    | 通过？ | 得分     |
| ------------ | ------- | ------ | -------- |
| 依赖方向正确 | 20      | [ ]    | /20      |
| 单一职责     | 15      | [ ]    | /15      |
| 关注点分离   | 15      | [ ]    | /15      |
| 无重复代码   | 10      | [ ]    | /10      |
| 命名规范     | 10      | [ ]    | /10      |
| 公开接口清晰 | 10      | [ ]    | /10      |
| 有测试覆盖   | 10      | [ ]    | /10      |
| 有必要文档   | 5       | [ ]    | /5       |
| 性能优化     | 5       | [ ]    | /5       |
| **总分**     | **100** |        | **/100** |

**评级**：

- 90-100：优秀 ⭐⭐⭐⭐⭐
- 70-89：良好 ⭐⭐⭐⭐
- 50-69：及格 ⭐⭐⭐
- < 50：需要改进 ⭐⭐

---

## 🎯 快速参考卡

打印出来贴在显示器旁边：

```
┌─────────────────────────────────────┐
│   重构检查清单（快速版）             │
├─────────────────────────────────────┤
│ ✅ 文件 < 300 行                    │
│ ✅ 函数 < 50 行                     │
│ ✅ 依赖方向：外→内                  │
│ ✅ 一个文件一个职责                 │
│ ✅ 没有重复代码                     │
│ ✅ 命名清晰一致                     │
│ ✅ 有公开接口                       │
│ ✅ 有单元测试                       │
│ ✅ 有必要注释                       │
│ ✅ 性能无明显问题                   │
└─────────────────────────────────────┘
```

---

**版本**：v1.0 | 2025-01-13
