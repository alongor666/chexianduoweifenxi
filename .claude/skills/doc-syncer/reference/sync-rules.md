# 文档同步规则 (Sync Rules)

> **作用**: 定义代码变更到文档更新的自动映射规则

**最后更新**: 2025-12-06

---

## 🎯 核心原则

1. **代码优先**: 代码是唯一真实来源，文档跟随代码变化
2. **自动检测**: 尽可能自动识别需要更新的文档
3. **优先级明确**: P0必须更新，P1建议更新，P2可选更新
4. **用户确认**: 批量更新前必须征求用户同意

---

## 📊 变更影响映射表

### 数据层变更

| 代码路径                                  | 变更类型     | 影响文档               | 优先级 | 更新内容           |
| ----------------------------------------- | ------------ | ---------------------- | ------ | ------------------ |
| `src/types/insurance.ts`                  | 数据类型定义 | `data_architecture.md` | **P0** | 字段定义、类型描述 |
| `src/lib/validations/insurance-schema.ts` | 验证规则     | `data_architecture.md` | **P0** | 验证规则、枚举值   |
| `src/types/goal.ts`                       | 目标管理类型 | `data_architecture.md` | **P1** | 目标数据结构       |

**触发条件**:

- InsuranceRecord 接口有任何字段增删改
- Zod schema 验证规则变更
- 枚举类型定义变更

---

### 业务逻辑层变更

| 代码路径                               | 变更类型 | 影响文档               | 优先级 | 更新内容           |
| -------------------------------------- | -------- | ---------------------- | ------ | ------------------ |
| `src/domain/rules/kpi-calculator.ts`   | KPI计算  | `core_calculations.md` | **P0** | 计算公式、函数签名 |
| `src/lib/calculations/kpi-formulas.ts` | 公式文档 | `core_calculations.md` | **P0** | 公式说明、示例     |
| `src/lib/calculations/kpi-engine.ts`   | 计算引擎 | `core_calculations.md` | **P1** | 实现细节           |

**触发条件**:

- KPIResult 接口字段增删改
- 计算函数签名变更
- 新增或删除KPI指标

---

### 前端组件层变更

| 代码路径                                    | 变更类型 | 影响文档         | 优先级 | 更新内容          |
| ------------------------------------------- | -------- | ---------------- | ------ | ----------------- |
| `src/components/features/file-upload.tsx`   | 上传组件 | `F001/README.md` | **P1** | 组件API、使用示例 |
| `src/components/features/kpi-dashboard.tsx` | KPI看板  | `F002/README.md` | **P1** | 组件功能、截图    |
| `src/components/features/trend-chart/`      | 趋势图   | `F003/README.md` | **P1** | 图表配置、示例    |
| `src/components/filters/`                   | 筛选器   | `F004/README.md` | **P1** | 筛选逻辑、API     |

**触发条件**:

- 组件Props接口变更
- 新增或删除主要功能
- UI交互逻辑重大变更

---

### 配置与基础设施变更

| 代码路径                      | 变更类型    | 影响文档                   | 优先级 | 更新内容           |
| ----------------------------- | ----------- | -------------------------- | ------ | ------------------ |
| `package.json`                | 依赖更新    | `tech_stack.md`            | **P1** | 依赖版本、新库说明 |
| `next.config.js`              | Next.js配置 | `static_deployment.md`     | **P1** | 部署配置           |
| `src/config/features.ts`      | 功能开关    | `F012/README.md`           | **P1** | 功能配置           |
| `src/constants/dimensions.ts` | 维度常量    | `dimensions_dictionary.md` | **P0** | 维度枚举值         |

**触发条件**:

- 新增或移除依赖包
- 修改构建配置
- 更新环境变量

---

## 🔍 自动检测规则

### 规则1: 文件路径匹配

```yaml
path_patterns:
  - pattern: 'src/types/**/*.ts'
    docs: ['开发文档/03_technical_design/data_architecture.md']
    priority: P0

  - pattern: 'src/domain/rules/**/*.ts'
    docs: ['开发文档/03_technical_design/core_calculations.md']
    priority: P0

  - pattern: 'src/components/features/[feature-name].tsx'
    docs: ['开发文档/01_features/F[XXX]_[feature-name]/README.md']
    priority: P1
```

### 规则2: 关键词检测

在代码注释或commit message中检测关键词:

```yaml
keywords:
  - keyword: 'BREAKING CHANGE'
    action: '提醒用户检查所有相关文档'
    priority: P0

  - keyword: '新增KPI'
    docs: ['开发文档/03_technical_design/core_calculations.md']
    priority: P0

  - keyword: '数据结构变更'
    docs: ['开发文档/03_technical_design/data_architecture.md']
    priority: P0
```

### 规则3: 依赖分析

分析代码的import/export关系:

```yaml
dependency_analysis:
  - if_imports: 'src/types/insurance.ts'
    then_check: ['data_architecture.md']

  - if_exports_changed: 'src/domain/rules/kpi-calculator.ts'
    then_update: ['core_calculations.md', 'F002/README.md']
```

---

## 🚦 优先级定义

### P0 - 必须立即更新

**条件**:

- 破坏性变更（BREAKING CHANGE）
- 核心数据结构变更
- KPI计算逻辑变更
- 枚举值或常量变更

**行动**:

- 自动生成更新计划
- 强烈建议立即执行
- 更新完成前警告用户

---

### P1 - 建议尽快更新

**条件**:

- 功能组件API变更
- 新增或废弃功能
- 依赖包版本升级
- 配置文件变更

**行动**:

- 提示用户需要更新
- 提供更新计划
- 用户可选择延后

---

### P2 - 可选更新

**条件**:

- UI样式调整
- 性能优化（无API变更）
- Bug修复（无逻辑变更）
- 代码重构（无对外影响）

**行动**:

- 记录到待办清单
- 累积到一定数量后批量处理

---

## 📝 更新模式

### 模式1: 自动同步模式

**适用场景**: 明确的1对1映射关系

```yaml
auto_sync:
  - trigger: 'src/types/insurance.ts 字段增删'
    action: '自动更新 data_architecture.md 字段表格'
    approval: false # 无需用户确认

  - trigger: 'package.json 依赖变更'
    action: '自动更新 tech_stack.md 依赖列表'
    approval: false
```

---

### 模式2: 半自动模式（推荐）

**适用场景**: 大部分文档更新

```yaml
semi_auto:
  - trigger: 'KPI计算函数变更'
    action: '生成更新计划 → 用户确认 → 执行更新'
    approval: true # 需要用户确认

  - trigger: '组件Props变更'
    action: '提示更新建议 → 用户选择'
    approval: true
```

---

### 模式3: 手动模式

**适用场景**: 复杂变更或不确定的情况

```yaml
manual:
  - trigger: '重大架构重构'
    action: '提示用户手动检查所有文档'
    approval: required
```

---

## 🎨 更新模板

### 版本号更新规则

```
主版本号.次版本号.修订号

- 主版本号: 破坏性变更（BREAKING CHANGE）
- 次版本号: 新增功能（向后兼容）
- 修订号: Bug修复或小改进
```

**示例**:

```markdown
## 版本信息

- 版本: 2.0 → 3.0 （新增7个辅助KPI字段）
- 最后更新: 2025-12-06
- 状态: ✅ 现行标准
```

---

### 更新历史模板

```markdown
## 更新历史

### 2025-12-06 (V3.0)

- **重大变更**: 补充辅助计算字段说明（7个）
- **新增**: 命名约定章节（camelCase vs snake_case）
- **修正**: KPI数量描述（16 → 23字段）
- **验证**: 与代码完全一致 ✅

### 2025-10-21 (V2.0)

- **新增**: 50周工作制说明
- **优化**: 保费时间进度达成率双模式计算
```

---

## 🔔 触发词表

用户输入以下词语时，自动触发文档同步:

| 触发词          | 含义     | 行动                     |
| --------------- | -------- | ------------------------ |
| "更新文档"      | 明确请求 | 执行完整同步流程         |
| "同步文档"      | 明确请求 | 执行完整同步流程         |
| "完成了XXX功能" | 隐式请求 | 检查对应功能文档         |
| "重构了XXX"     | 隐式请求 | 检查相关技术文档         |
| "新增了XXX字段" | 隐式请求 | 检查data_architecture.md |
| "修改了KPI计算" | 隐式请求 | 检查core_calculations.md |

---

## 🛡️ 安全检查

### 更新前检查

- [ ] 确认更新的文档确实需要更新
- [ ] 避免误删除历史信息
- [ ] 检查是否破坏现有结构
- [ ] 验证所有链接的有效性

### 更新后验证

- [ ] 文档格式正确
- [ ] 代码示例可运行
- [ ] 版本号已递增
- [ ] 更新日期已标注

---

_此规则由 doc-syncer skill 自动应用_
_最后更新: 2025-12-06_
