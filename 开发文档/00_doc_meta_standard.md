---
id: doc_meta_standard
title: 文档元数据规范
author: AI
status: stable
type: other
domain: tech
tags:
- standard
- documentation
- meta
created_at: 2024-05-21
updated_at: 2024-05-21
complexity: medium
---

# 文档元数据规范 (Documentation Metadata Standard)

为了支持 AI 渐进式掌握项目上下文，并实现高效的 RAG (Retrieval-Augmented Generation) 检索，所有开发文档必须包含标准化的 YAML Frontmatter。

## 核心价值

1.  **精准检索**：通过 `domain` 和 `tags` 缩小搜索范围，避免无关信息的干扰。
2.  **代码关联**：通过 `related_code` 建立文档与代码的强连接，帮助 AI 在修改代码时自动索引相关文档。
3.  **时效性判断**：通过 `status` 和 `updated_at` 帮助 AI 识别过时信息，避免基于旧知识产生错误代码。
4.  **知识分层**：通过 `complexity` 区分入门教程与深度架构设计。

## 标准 Schema

在 Markdown 文件顶部添加以下 YAML 块：

```yaml
---
# 基础标识
id: unique_doc_id_snake_case      # [必填] 文档唯一ID，建议与文件名保持一致
title: 文档标题                    # [必填] 清晰的标题，覆盖一级标题
author: Name                      # [必填] 责任人/作者
updated_at: YYYY-MM-DD            # [必填] 最后更新日期
created_at: YYYY-MM-DD            # [选填] 创建日期

# 生命周期与状态
status: stable                    # [必填] 状态枚举: draft | review | stable | deprecated | archived
version: 1.0.0                    # [选填] 适用版本号

# 上下文与分类
domain: claims                    # [必填] 业务域枚举: claims(理赔) | policy(承保) | finance(财务) | tech(技术架构) | product(产品交互)
tags: [kpi, algorithm]            # [必填] 标签列表，至少包含1个
complexity: medium                # [选填] 复杂度枚举: low(入门) | medium(进阶) | high(专家)

# 技术关联 (AI 核心上下文)
related_code:                     # [强烈推荐] 关联的核心代码文件路径（相对项目根目录）
  - src/domain/rules/kpi.ts
  - src/components/KpiCard.tsx
dependencies:                     # [选填] 依赖的其他文档ID
  - data_architecture
  - core_calculations
---
```

## 字段详解

### 1. status (生命周期)

| 状态 | 含义 | AI 行为建议 |
| :--- | :--- | :--- |
| `draft` | 草稿 | 仅供参考，不作为事实依据，需向用户确认 |
| `review` | 审查中 | 包含待定内容，使用时需谨慎 |
| `stable` | **稳定** | **单一事实源 (SSOT)，可完全信赖** |
| `deprecated` | 废弃 | 仅用于了解历史背景，禁止基于此生成新代码 |
| `archived` | 归档 | 历史快照，通常不加载到 Context |

### 2. domain (业务域)

用于划定上下文边界。例如，在处理“赔付率计算”时，AI 应优先检索 `domain: claims` 和 `domain: finance` 的文档。

*   `claims`: 理赔相关（报案、立案、结案、赔款）
*   `policy`: 承保相关（保单、保费、车辆信息）
*   `finance`: 财务相关（KPI、结算、预算）
*   `tech`: 纯技术实现（架构、工具链、部署）
*   `product`: 产品设计、UI/UX、用户流程

### 3. related_code (代码关联)

这是实现 **"Docs as Code"** 的关键。当 AI 阅读代码文件时，可以通过反向索引快速找到解释该代码的文档。

**示例**：
```yaml
related_code:
  - src/domain/rules/kpi-calculator-enhanced.ts
```

## 维护规则

1.  **新建文档**：必须使用上述模板。
2.  **更新代码**：如果修改了 `related_code` 中的文件，必须检查并更新对应文档的 `updated_at`。
3.  **废弃文档**：不要直接删除，将 `status` 改为 `deprecated` 并注明替代文档。
