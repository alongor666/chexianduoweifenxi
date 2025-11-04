---
name: doc-syncer
description: 在代码修改后自动同步更新开发文档,确保文档与代码保持一致。支持功能文档(F001-F014)、技术设计文档、决策文档的更新。触发词包括"更新文档"、"同步文档"、"完成了XXX功能"。
allowed-tools: Read, Edit, Grep
---

# 文档同步助手

## 目标
遵循 CLAUDE.md 中的"文档同步,保持鲜活"原则,在每次代码变更后自动更新相关文档。

## 何时使用
- ✅ 完成新功能开发后（F001-F014系列功能）
- ✅ 修改 CSV 数据结构（26个字段的 InsuranceRecord）
- ✅ 修改核心计算逻辑（16个KPI的计算公式）
- ✅ 调整组件结构或新增组件
- ✅ 更新技术栈或依赖包
- ✅ 做出重大架构或设计决策

## 文档同步流程

### 1. 识别变更影响范围

根据代码变更类型,确定需要更新的文档:

| 变更类型 | 相关文档 |
|---------|---------|
| CSV 数据结构变更 | `开发文档/03_technical_design/data_architecture.md` |
| KPI 计算逻辑变更 | `开发文档/03_technical_design/core_calculations.md` |
| 新增/修改功能 | `开发文档/01_features/FXXX_功能名/` 对应功能文档 |
| 技术栈更新 | `开发文档/03_technical_design/tech_stack.md` |
| 架构调整 | `开发文档/03_technical_design/architecture_refactoring.md` |
| 维度字典更新 | `开发文档/03_technical_design/dimensions_dictionary.md` |
| 重大决策 | `开发文档/02_decisions/` 对应决策文档 |
| 阶段性总结 | `开发文档/03_technical_design/PHASE*_COMPLETION_REPORT.md` |

### 2. 读取现有文档

使用 `Read` 工具读取需要更新的文档,理解现有内容结构。

### 3. 生成更新内容

基于代码变更,生成文档更新:
- 保持原有文档结构和格式
- 使用清晰的中文描述
- 包含代码示例(如适用)
- 标注更新日期

### 4. 更新文档

使用 `Edit` 工具精确更新文档:
- 优先使用 `Edit` 而非 `Write` (遵循"优先修改,而非新建"原则)
- 保持文档的连贯性
- 不删除有价值的历史信息

### 5. 验证文档完整性

检查更新后的文档:
- 所有链接是否有效
- 代码示例是否与实际代码一致
- 格式是否正确 (Markdown 语法)

## 文档更新模板

### 功能文档模板（参考现有 F001-F014）
```markdown
# 功能名称

## 概述
[功能的简要描述，1-2句话]

## 业务价值
[为什么需要这个功能，解决什么问题]

## 核心功能
1. [功能点1]
2. [功能点2]
3. [功能点3]

## 技术实现

### 数据结构
[相关的数据类型、接口定义]

### 核心组件
- 主组件: `src/components/features/xxx.tsx`
- Hook: `src/hooks/use-xxx.ts`
- 服务: `src/services/XXXService.ts`（如适用）

### 计算逻辑（如涉及KPI）
[引用 core_calculations.md 中的公式]

## 使用示例
```typescript
// 代码示例
```

## 测试要点
- [ ] 基础功能验证
- [ ] 边界条件测试
- [ ] 性能测试（如适用）

## 相关文档
- 数据架构: `开发文档/03_technical_design/data_architecture.md`
- KPI计算: `开发文档/03_technical_design/core_calculations.md`（如适用）

## 更新历史
- 2025-XX-XX: 初始版本
- 2025-XX-XX: [更新说明]
```

### 技术设计文档模板
```markdown
# 文档标题

## 版本信息
- 版本: X.X
- 最后更新: 2025-XX-XX
- 状态: ✅ 现行标准 / 📝 草稿 / 🗄️ 已归档

## 核心内容
[主要技术设计内容]

## 实现细节
[详细的技术实现说明]

## 相关文档
- [关联文档列表]

## 更新历史
- 2025-XX-XX: [变更说明]
```

## 输出格式

更新完成后,提供清晰的总结:

```markdown
# 文档同步完成

## 已更新的文档
✅ `开发文档/03_technical_design/data_architecture.md`
   - 新增 XXX 字段说明
   - 更新数据关系图

✅ `开发文档/01_features/F001_xxx.md`
   - 更新技术实现部分
   - 添加使用示例

## 验证结果
- [x] 所有链接有效
- [x] 代码示例与实际一致
- [x] Markdown 格式正确

## 建议
- 建议添加功能截图到 F001 文档
```

## 项目特定注意事项

### 文档目录结构
```
开发文档/
├── 00_conventions.md           # 文档约定
├── 01_features/                # 功能文档（F001-F014）
│   ├── F001_data_import/
│   ├── F002_kpi_dashboard/
│   └── ...
├── 02_decisions/               # 重大决策记录
├── 03_technical_design/        # 技术设计文档
│   ├── data_architecture.md    # 26字段CSV数据结构
│   ├── core_calculations.md    # 16个KPI计算公式
│   ├── tech_stack.md           # 技术栈
│   ├── dimensions_dictionary.md # 维度字典
│   └── architecture_refactoring.md
├── archive/                    # 历史归档文档
├── README.md                   # 总览文档
└── 开发记录表.md               # 开发记录
```

### 核心原则
1. **遵循 CLAUDE.md 的五条黄金法则**
   - 优先修改,而非新建
   - 小步快跑,持续验证
   - 文档同步,保持鲜活
   - 保持代码质量
   - 中文沟通

2. **数据架构优先**
   - CSV 数据结构（26字段）是唯一真实来源
   - 不存在 Prisma 或数据库层
   - 使用 LocalStorage 持久化

3. **KPI 计算核心**
   - 所有 KPI 计算逻辑必须与 `core_calculations.md` 一致
   - 16个KPI采用4x4网格布局
   - 支持50周工作制

4. **功能文档编号**
   - 使用 FXXX 格式（F001, F002, ...）
   - 每个功能独立目录
   - 包含 README.md 和测试记录

5. **版本标注**
   - 技术文档需标注版本号和状态
   - 状态标识: ✅ 现行标准 / 📝 草稿 / 🗄️ 已归档
   - 更新历史必须记录

## 通用注意事项
- 使用中文编写所有文档
- 保持文档结构清晰
- 代码示例要准确且可运行
- 优先使用 `Edit` 工具修改现有文档
- 不要创建新文档,除非功能确实是全新的
- 归档过时文档到 `archive/` 目录
