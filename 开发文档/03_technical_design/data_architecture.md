---
id: 03_technical_design_data_architecture
title: 数据架构
author: AI
status: stable
type: technical
domain: tech
tags:
- data-model
- schema
- csv
- validation
created_at: 2024-05-20
updated_at: 2025-10-21
related_code:
- src/lib/schema/insurance.ts
- prisma/schema.prisma
- src/domain/entities/InsuranceRecord.ts
complexity: high
---

# 数据架构

> **[warning] 警告：数据库模型缺失**
> 截至文档更新时（2025-10-21），项目尚未建立数据库持久化层。`prisma` 目录及 `schema.prisma` 文件不存在。当前所有数据处理均在客户端内存中完成。以下数据结构规范基于CSV导入标准，是未来数据库建模的唯一事实来源。

> **[info] 数据持久化更新**
> 截至 2025-01-20，项目已实现基于 LocalStorage 的数据持久化功能。虽然仍未建立数据库层，但数据可在浏览器本地持久保存，支持页面刷新后自动恢复。详见 [F008 数据持久化模块](../01_features/F008_data_persistence/README.md)。

本文档详细定义了车险分析平台的数据结构、验证规则和文件格式，是确保数据一致性与准确性的核心依据。

## 核心原则

1.  **数据结构优先**：文件名可以灵活，但数据结构必须严格遵循规范。
2.  **字段完整性**：所有必需字段必须存在，可选字段允许为空。
3.  **数据类型一致**：相同字段在不同文件中必须保持相同的数据类型。
4.  **编码统一**：统一使用UTF-8编码，支持中文字符。

## 数据结构规范 (27个字段)

CSV文件必须包含以下27个字段（其中2个可选：`second_level_organization` 和 `premium_plan_yuan`）。为保证解析效率，**强烈推荐遵循标准字段顺序**。

| #   | 字段名                                    | 数据类型 | 描述           | 示例/枚举值                              | 可否为空 |
| --- | ----------------------------------------- | -------- | -------------- | ---------------------------------------- | -------- |
| 1   | `snapshot_date`                           | Date     | 快照日期       | `2025-07-13`                             | 否       |
| 2   | `policy_start_year`                       | Integer  | 保单年度       | `2024`                                   | 否       |
| 3   | `business_type_category`                  | String   | 业务类型       | `10吨以上-普货`, `网约车`... (16种)      | 否       |
| 4   | `chengdu_branch`                          | String   | 地域属性       | `成都`, `中支`                           | 否       |
| 5   | `second_level_organization`               | String   | 二级机构       | `四川`, `重庆`...                        | 是       |
| 6   | `third_level_organization`                | String   | 三级机构       | `本部`, `达州`, `德阳`... (13种)         | 否       |
| 7   | `customer_category_3`                     | String   | 客户类型       | `非营业个人客车`, `营业货车`... (11种)   | 否       |
| 8   | `insurance_type`                          | String   | 保险类型       | `商业险`, `交强险`                       | 否       |
| 9   | `is_new_energy_vehicle`                   | Boolean  | 是否新能源     | `True`, `False`                          | 否       |
| 10  | `coverage_type`                           | String   | 险别组合       | `主全`, `交三`, `单交`                   | 否       |
| 11  | `is_transferred_vehicle`                  | Boolean  | 是否过户车     | `True`, `False`                          | 否       |
| 12  | `renewal_status`                          | String   | 新续转状态     | `新保`, `续保`, `转保`                   | 否       |
| 13  | `vehicle_insurance_grade`                 | String   | 车险评级       | `A`, `B`, `C`, `D`, `E`, `F`, `G`, `X`   | 是       |
| 14  | `highway_risk_grade`                      | String   | 高速风险等级   | `A`, `B`, `C`, `D`, `E`, `F`, `X`        | 是       |
| 15  | `large_truck_score`                       | String   | 大货车评分     | `A`, `B`, `C`, `D`, `E`, `X`             | 是       |
| 16  | `small_truck_score`                       | String   | 小货车评分     | `A`, `B`, `C`, `D`, `E`, `X`             | 是       |
| 17  | `terminal_source`                         | String   | 终端来源       | `0101柜面`, `0106移动展业(App)`... (8种) | 否       |
| 18  | `signed_premium_yuan`                     | Number   | 签单保费       | `2958.49`                                | 否       |
| 19  | `matured_premium_yuan`                    | Number   | 满期保费       | `2958.49`                                | 否       |
| 20  | `policy_count`                            | Integer  | 保单件数       | `1`                                      | 否       |
| 21  | `claim_case_count`                        | Integer  | 赔案件数       | `0`                                      | 否       |
| 22  | `reported_claim_payment_yuan`             | Number   | 已报告赔款     | `0.0` (可为负)                           | 否       |
| 23  | `expense_amount_yuan`                     | Number   | 费用金额       | `59.17`                                  | 否       |
| 24  | `commercial_premium_before_discount_yuan` | Number   | 商业险折前保费 | `0.0`                                    | 否       |
| 25  | `premium_plan_yuan`                       | Number   | 保费计划       | `2958.49`                                | 是       |
| 26  | `marginal_contribution_amount_yuan`       | Number   | 边际贡献额     | `2899.32` (可为负)                       | 否       |
| 27  | `week_number`                             | Integer  | 周序号         | `80`                                     | 否       |

## 数据格式与验证规则

### 文件格式

- **文件类型**: CSV (`.csv`)
- **编码**: **UTF-8**
- **分隔符**: 英文逗号 (`,`)
- **首行**: 必须是与上表完全一致的字段名 (`snake_case`)

### 数据类型与格式

- **Date**: `YYYY-MM-DD`
- **Boolean**: `True` 或 `False` (首字母大写)
- **Number**: 使用点号作为小数点，不含千分位分隔符
- **Integer**: 整数
- **空值**: 允许为空的字段使用空字符串 `""`

### 字段验证规则

- **必填字段**: 所有“可否为空”为“否”的字段都必须有值。
- **数值范围**:
  - `policy_start_year`: 2024-2025
  - `week_number`: 28-41
  - 除 `marginal_contribution_amount_yuan` 和 `reported_claim_payment_yuan` 外，所有金额和数量字段 ≥ 0。
- **枚举值**: 严格按照规范中定义的实际枚举值进行匹配。

### 业务类型枚举值详细说明

**数据来源**: 本枚举值定义来自 `/Users/xuechenglong/Library/Mobile Documents/com~apple~CloudDocs/01-正在开发的项目/utoweKPI-py/reference/business_type_mapping.json`

**字段名称**: `business_type_category` (CSV第3列)

#### 标准业务类型（16种）

| # | CSV原始值 | UI短标签 | 代码标识 | 业务分类 |
|---|----------|---------|---------|---------|
| 1 | 非营业客车新车 | 非营客-新 | non_pc_new | 非营业客车 |
| 2 | 非营业客车旧车非过户 | 非营客-旧 | non_pc_used | 非营业客车 |
| 3 | 非营业客车旧车过户 | 非营客-过户 | non_pc_transfer | 非营业客车 |
| 4 | 1吨以下非营业货车 | 非营货-<1t | non_truck_lt1 | 非营业货车 |
| 5 | 1–2吨非营业货车 | 非营货-1–2t | non_truck_1_2 | 非营业货车 |
| 6 | 2吨以下营业货车 | 营货-<2t | biz_truck_lt2 | 营业货车 |
| 7 | 2–9吨营业货车 | 营货-2–9t | biz_truck_2_9 | 营业货车 |
| 8 | 9–10吨营业货车 | 营货-9–10t | biz_truck_9_10 | 营业货车 |
| 9 | 10吨以上营业货车（普货） | 营货-≥10t普 | biz_truck_10_plus | 营业货车 |
| 10 | 10吨以上营业货车（牵引） | 营货-≥10t牵 | biz_truck_10_plus_trac | 营业货车 |
| 11 | 自卸车 | 营货-≥10t卸 | biz_truck_10_plus_dump | 营业货车 |
| 12 | 特种车 | 营货-≥10t特 | biz_truck_10_plus_special | 营业货车 |
| 13 | 其他营业货车 | 营货-其他 | biz_truck_other | 营业货车 |
| 14 | 摩托车 | 摩托 | motorcycle | 其他 |
| 15 | 出租车 | 营客-出租 | biz_pc_taxi | 营业客车 |
| 16 | 网约车 | 营客-网约 | biz_pc_ridehailing | 营业客车 |

**统计**: 共5个分类 - 非营业客车(3种)、非营业货车(2种)、营业货车(8种)、营业客车(2种)、其他(1种)

#### 兼容映射（11种变体形式）

以下变体形式会自动映射到对应的标准业务类型：

| CSV原始值 | 映射到标准类型 | 说明 |
|----------|---------------|------|
| 非营业客车旧车过户车 | 非营业客车旧车过户 | 兼容旧文案 |
| 非营业货车新车 | 1–2吨非营业货车 | 兼容旧分类，暂映射到1–2t档 |
| 非营业货车旧车 | 1–2吨非营业货车 | 兼容旧分类，暂映射到1–2t档 |
| 2-9吨营业货车 | 2–9吨营业货车 | 兼容不同连接符格式 |
| 9-10吨营业货车 | 9–10吨营业货车 | 兼容不同连接符格式 |
| 10吨以上-普货 | 10吨以上营业货车（普货） | 兼容简化格式 |
| 10吨以上普货 | 10吨以上营业货车（普货） | 兼容简化格式 |
| 10吨以上-牵引 | 10吨以上营业货车（牵引） | 兼容简化格式 |
| 10吨以上牵引 | 10吨以上营业货车（牵引） | 兼容简化格式 |
| 自卸 | 自卸车 | 兼容简化格式 |
| 其他 | 其他营业货车 | 默认映射到其他营业货车 |

**重要提示**:
- ✅ **CSV导入时**: 系统会自动识别标准值和兼容值
- ✅ **数据规范化**: 所有兼容值都会被转换为对应的标准值
- ✅ **UI显示**: 使用短标签（如"非营客-新"）以节省屏幕空间
- ❌ **测试数据**: 必须使用标准值或兼容值，不能使用随意编造的值

### 客户类型枚举值（11种）

**字段名称**: `customer_category_3` (CSV第7列)

| # | 标准值 |
|---|--------|
| 1 | 挂车 |
| 2 | 摩托车 |
| 3 | 特种车 |
| 4 | 营业公路客运 |
| 5 | 营业出租租赁 |
| 6 | 营业城市公交 |
| 7 | 营业货车 |
| 8 | 非营业个人客车 |
| 9 | 非营业企业客车 |
| 10 | 非营业机关客车 |
| 11 | 非营业货车 |

**注意**: 客户类型与业务类型是**完全不同的两个维度**，不可混淆！

### 保险类型枚举值（2种）

**字段名称**: `insurance_type` (CSV第8列)

- `商业险`
- `交强险`

## 文件命名建议 (非强制)

- **周度明细文件**: `YYYY保单第WW周变动成本明细表.csv` (例: `2024保单第28周变动成本明细表.csv`)
- **汇总文件**: `YY年保单WW-WW周变动成本汇总表.csv` (例: `25年保单28-41周变动成本汇总表.csv`)

## 数据合并与清洗脚本（推荐）

当每周数据以多个 CSV 分片存放在 `实际数据/` 时，可使用脚本合并为单一、可直接上传的 CSV：

- 合并清洗（默认输出 27 列标准字段，包含 `second_level_organization`）：
  - `python3 "scripts/合并脚本/merge_actual_data_to_csv.py"`
- 输出文件：
  - `outputs/actual_data_merged_clean.csv`（清洗后的合并文件）
  - `outputs/actual_data_invalid_rows.csv`（被剔除的行与原因；若无无效行则仅保留表头）
- 兼容模式（输出时移除 `second_level_organization` 列）：
  - `python3 "scripts/合并脚本/merge_actual_data_to_csv.py" --drop-second-level-organization`
- 本地快速校验（与上传口径一致的轻量验证）：
  - `node "scripts/test_upload.js" "outputs/actual_data_merged_clean.csv"`

## 错误处理机制

系统在导入时会对每行数据进行验证。

- **严重错误 (跳过该行)**: 缺少必填字段、数据类型错误。
- **警告错误 (尝试修正或记录)**: 枚举值不匹配、数值超出合理范围。
- **信息提示 (正常处理)**: 可选字段为空。

## 目标管理数据结构

目标管理功能的所有配置保存在浏览器 `localStorage` 中的 `insurDashPremiumTargets` 键下，结构如下：

- `year`: 数值，目标适用年度。
- `overall`: 数值，年度总目标（单位：元）。
- `byBusinessType`: 业务类型拆分，用于兼容旧版本逻辑，等价于 `dimensions.businessType.entries`。
- `dimensions`: `Record<TargetDimensionKey, DimensionTargetState>`，支持以下四个维度：
  - `businessType`（业务类型）
  - `thirdLevelOrganization`（三级机构）
  - `customerCategory`（客户分类）
  - `insuranceType`（保险类型）
- `updatedAt`: 字符串，最近一次保存时间（ISO）。

`DimensionTargetState` 定义：

- `entries`: `Record<string, number>`，key 为经过规范化的维度值，value 为元单位目标额。
- `updatedAt`: 字符串或 `null`，该维度最近保存时间。
- `versions`: `TargetVersionSnapshot[]`，按时间倒序排列的历史快照。

`TargetVersionSnapshot` 包含：

- `id`: 版本唯一标识。
- `label`: 版本名称（默认“维度名 + 保存时间”）。
- `createdAt`: 保存时间戳（ISO）。
- `overall`: 保存时的年度总目标（元）。
- `entries`: 该快照下的分配明细（元）。
- `note`: 可选备注。

### 交互约定

- 目标管理页面（`src/app/targets/page.tsx`）中的“年度目标”列采用 Excel 式键盘操作：`Enter` 跳转到下一行，方向键在同一列的上下条目之间移动焦点，便于快速录入。
- 输入框保持手动输入能力，同时设置数值步进为 50（万元），通过浏览器原生的增减控制或键盘调整时都以 50 为最小增量。

### CSV 模板与导入规范

每个维度均可导出/导入 CSV 模板，列规范如下：

| 维度     | 维度列名                   | 汇总行标识   | 说明                                   |
| -------- | -------------------------- | ------------ | -------------------------------------- |
| 业务类型 | `business_type`            | `车险整体`   | 兼容旧模板；导入时自动更新年度总目标。 |
| 三级机构 | `third_level_organization` | `年度总目标` | 未提供汇总行则总目标保持当前值。       |
| 客户分类 | `customer_category_3`      | `年度总目标` | 同上。                                 |
| 保险类型 | `insurance_type`           | `年度总目标` | 同上。                                 |

## 年度计划数据结构

### 数据源位置

**文件路径**: `src/data/reference/year-plans.json`

### 数据结构

年度计划数据按年份组织，支持多年度管理：

```json
{
  "year_plans_2025": [
    {
      "policy_start_year": 2025,
      "second_level_organization": "四川",
      "third_level_organization": "天府",
      "premium_plan_yuan": 197300000
    }
  ]
}
```

### 字段定义

| 字段名                    | 类型   | 说明                                   | 示例值     |
| ------------------------- | ------ | -------------------------------------- | ---------- |
| `policy_start_year`       | number  | 保单年度                               | 2025       |
| `second_level_organization`| string  | 二级机构名称                           | "四川"     |
| `third_level_organization` | string  | 三级机构名称                           | "天府"     |
| `premium_plan_yuan`       | number  | 年度保费计划（元）                     | 197300000  |

### 机构覆盖范围

**二级机构**: 四川（全覆盖）

**三级机构**（共13个）:
- 本部、天府、武侯、高新、青羊、新都、德阳、宜宾、泸州、乐山、自贡、资阳、达州

### 使用场景

1. **机构维度KPI计算**: 为每个三级或二级机构提供专属年度目标
2. **保费时间进度达成率**: 基于机构年度目标计算时间进度达成率
3. **机构对比分析**: 支持多机构KPI对比和排名
4. **目标管理**: 作为年度计划分配的基准数据

### 技术实现

- **数据加载**: 通过 `YearPlanRepository` 类动态加载JSON数据
- **类型安全**: 使用 TypeScript 接口确保数据结构正确
- **缓存机制**: Repository 内置缓存，避免重复加载
- **维度支持**: 同时支持二级和三级机构查询

### 数据存储约定模板中的 `target_wan` 列以“万元”为单位，系统会自动转换为“元”进行存储；未在 CSV 中出现的维度值将保留原有配置。

## 更新记录

### 2025-01-12: 新增二级机构字段与缓存键优化

#### 字段更新

- **新增字段**: `second_level_organization`（二级机构），位于第5列，为可选字段
- **字段总数**: 从26个增加到27个（其中2个可选：`second_level_organization` 和 `premium_plan_yuan`）
- **数据验证**: 已更新 Zod schema 和 TypeScript 类型定义以支持新字段

#### 缓存键设计缺陷修复

**问题根源**：

1. 原缓存键仅依赖记录数量和保费总和（浮点数）
2. 不同筛选条件下的数据集，如果保费总和恰好相同，会产生缓存冲突
3. 导致用户在切换筛选条件或周次时看到错误的计算结果

**解决方案**：

- 缓存键现在包含以下信息：
  - 当前周的年份和周次
  - 当前周的所有关键业务指标（签单保费、满期保费、保单件数、赔案件数、赔款、费用）
  - 前一周的年份和周次
  - 前一周的所有关键业务指标
  - 年度目标（如果有）
- **新缓存键格式**: `inc_{年份}w{周次}_{数据哈希}_{年份}w{周次}_{数据哈希}_t{目标}`
- **数据哈希**: 将6个关键指标组合成唯一字符串，确保数据集的唯一性

**技术细节**：

```typescript
// 数据哈希包含：
;[
  signed_premium_yuan, // 签单保费
  matured_premium_yuan, // 满期保费
  policy_count, // 保单件数
  claim_case_count, // 赔案件数
  reported_claim_payment_yuan, // 赔款
  expense_amount_yuan, // 费用
].join('_')
```

**优势**：

- ✅ 杜绝了不同数据集产生相同缓存键的可能性
- ✅ 周次信息明确，便于调试
- ✅ 保持了缓存的性能优势
- ✅ 确保用户始终看到正确的计算结果

## 相关文档

- **[CSV导入规范](../archive/CSV导入规范.md)**: 本数据架构的原始需求和详细解释，包含了更详细的字段枚举值、业务背景和测试记录。
