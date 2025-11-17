---
name: doc-syncer
description: 在代码修改后自动同步更新开发文档，确保文档与代码保持一致。支持功能文档(F001-F014)、技术设计文档、决策文档的更新。触发词："更新文档"、"同步文档"、"完成了XXX功能"。
allowed-tools: Read, Edit, Grep
---

# Instructions

## 核心职责

本技能用于在代码变更后自动识别并更新相关开发文档，确保文档与代码实现保持一致。

**职责范围**：
- ✅ 同步更新现有文档
- ✅ 为全新功能创建文档（仅当明确要求时）
- ✅ 验证文档完整性（链接、代码示例、格式）
- ❌ 不主动创建文档（除非是全新功能）
- ❌ 不删除历史信息（过时内容移到 `archive/`）

遵循原则：**优先修改，而非新建**

## 执行流程

### 1. 识别变更影响
根据用户提供的代码变更类型，确定需要更新的文档：

| 变更类型 | 相关文档 |
|---------|---------|
| CSV 数据结构变更 | `开发文档/03_technical_design/data_architecture.md` |
| KPI 计算逻辑变更 | `开发文档/03_technical_design/core_calculations.md` |
| 新增/修改功能 | `开发文档/01_features/FXXX_功能名/` 对应功能文档 |
| 技术栈更新 | `开发文档/03_technical_design/tech_stack.md` |
| 架构调整 | `开发文档/03_technical_design/architecture_refactoring.md` |
| 维度字典更新 | `开发文档/03_technical_design/dimensions_dictionary.md` |
| 重大决策 | `开发文档/02_decisions/` 对应决策文档 |

### 2. 读取现有文档
```bash
Read 开发文档/03_technical_design/data_architecture.md
```
理解现有内容结构和更新位置。

### 3. 生成更新内容
- 保持原有文档结构和格式
- 使用清晰的中文描述
- 包含代码示例（如适用）
- 标注更新日期

### 4. 执行文档更新
**优先使用 Edit 而非 Write**（遵循"优先修改"原则）：
```bash
Edit file_path="开发文档/03_technical_design/data_architecture.md" \
     old_string="旧内容" \
     new_string="新内容"
```

### 5. 验证文档完整性
- [ ] 所有链接是否有效？
- [ ] 代码示例与实际代码一致？
- [ ] Markdown 格式正确？

### 6. 输出同步报告
必须包含：
- 已更新的文档列表
- 更新详情（新增/修改/删除）
- 验证结果
- 建议（需要人工确认的事项）

## 限制与边界

- **不创建重复文档**：优先更新现有文档
- **不修改历史记录**：保留"更新历史"部分
- **不假设变更内容**：如用户未提供详情，先读取代码确认
- **遇到模糊请求必须追问**：变更范围不明确时

## 文档目录结构

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
│   └── dimensions_dictionary.md
├── archive/                    # 历史归档文档
├── README.md                   # 总览文档
└── 开发记录表.md               # 开发记录
```

详细的文档模板请参考 `templates.md`。

# Examples

## 示例 1：修改 KPI 计算逻辑后同步文档

**用户输入**：
> 我刚修改了满期赔付率的计算公式，请更新相关文档

**正确处理流程**：
1. 识别变更类型：KPI 计算逻辑变更
2. 确定相关文档：`开发文档/03_technical_design/core_calculations.md`
3. 读取现有文档
4. 定位"满期赔付率"章节
5. 使用 Edit 更新公式定义
6. 验证代码示例与实际代码一致
7. 输出同步报告：
   ```
   ✅ 已更新 `开发文档/03_technical_design/core_calculations.md`
   - 更新"满期赔付率"公式定义
   - 验证通过：代码示例一致
   ```

## 示例 2：新增功能后创建文档

**用户输入**：
> 完成了多图表标签页功能（F014），帮我创建功能文档

**正确处理流程**：
1. 确认这是全新功能，需创建新文档
2. 创建 `开发文档/01_features/F014_multi_chart_tabs/` 目录
3. 按照功能文档模板生成 README.md
4. 包含：概述、业务价值、核心功能、技术实现、使用示例、测试要点
5. 更新主文档索引
6. 输出创建报告

## 示例 3：用户未明确变更类型

**用户输入**：
> 帮我更新文档

**正确处理流程**：
询问用户：
> 请问您做了哪些代码变更？这将帮助我确定需要更新哪些文档：
> - 修改 CSV 数据结构？
> - 修改 KPI 计算逻辑？
> - 新增/修改组件？
> - 更新技术栈？
> - 其他类型的变更？

# Version History

## v1.0 (2025-11-17)
- 初始版本，支持功能文档、技术文档、决策文档同步
- 实现文档模板和验证机制
- 遵循 Anthropic 官方 Skills 最佳实践
