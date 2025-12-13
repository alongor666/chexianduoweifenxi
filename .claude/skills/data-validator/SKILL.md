---
name: data-validator
description: 验证车险CSV数据的完整性和正确性,检查26个必需字段,验证数据类型、枚举值和业务规则。当用户提到"验证数据"、"检查数据"、"数据导入"、"CSV"时使用。
allowed-tools: Read, Grep, Bash
---

# 车险 CSV 数据验证专家

## 目标

自动验证车险业务CSV数据的完整性、格式正确性和业务规则合规性,确保数据符合 `InsuranceRecord` 26字段标准。

## 何时使用

- 导入新的 CSV 数据时
- 数据迁移前的验证
- 发现数据异常时
- 用户提到"数据有问题"、"验证"、"检查数据"时

## 验证流程

### 步骤 1: 读取数据架构文档

首先阅读项目的数据架构规范:

```bash
Read 开发文档/03_technical_design/data_architecture.md
Read src/types/insurance.ts
```

### 步骤 2: 验证CSV文件格式

**基础格式检查**:

- 文件编码: UTF-8
- 分隔符: 英文逗号 (`,`)
- 首行: 必须包含26个标准字段名

### 步骤 3: 验证必填字段（26个字段）

**时间维度（3个字段）**:

- `snapshot_date` - 快照日期 (YYYY-MM-DD)
- `policy_start_year` - 保单年度 (2024-2025)
- `week_number` - 周序号 (28-105)

**组织维度（2个字段）**:

- `chengdu_branch` - 地域属性 (`成都` 或 `中支`)
- `third_level_organization` - 三级机构 (13种机构之一)

**客户维度（1个字段）**:

- `customer_category_3` - 客户类型 (11种类型之一)

**产品维度（3个字段）**:

- `insurance_type` - 保险类型 (`商业险` 或 `交强险`)
- `business_type_category` - 业务类型 (16种类型之一)
- `coverage_type` - 险别组合 (`主全`, `交三`, `单交`)

**业务属性（3个字段）**:

- `renewal_status` - 新续转状态 (`新保`, `续保`, `转保`)
- `is_new_energy_vehicle` - 是否新能源 (`True` 或 `False`)
- `is_transferred_vehicle` - 是否过户车 (`True` 或 `False`)

**评级维度（4个字段，可选）**:

- `vehicle_insurance_grade` - 车险评级 (A-G/X，可为空)
- `highway_risk_grade` - 高速风险等级 (A-F/X，可为空)
- `large_truck_score` - 大货车评分 (A-E/X，可为空)
- `small_truck_score` - 小货车评分 (A-E/X，可为空)

**渠道维度（1个字段）**:

- `terminal_source` - 终端来源 (8种来源之一)

**业务指标（9个字段）**:

- `signed_premium_yuan` - 签单保费 (≥0，单位：元)
- `matured_premium_yuan` - 满期保费 (≥0，单位：元)
- `policy_count` - 保单件数 (≥0，整数)
- `claim_case_count` - 赔案件数 (≥0，整数)
- `reported_claim_payment_yuan` - 已报告赔款 (≥0，单位：元)
- `expense_amount_yuan` - 费用金额 (≥0，单位：元)
- `commercial_premium_before_discount_yuan` - 商业险折前保费 (≥0，单位：元)
- `premium_plan_yuan` - 保费计划 (可为空，单位：元)
- `marginal_contribution_amount_yuan` - 边际贡献额 (可为负，单位：元)

### 步骤 4: 验证数据类型

- **Date**: `YYYY-MM-DD` 格式
- **Boolean**: `True` 或 `False` (首字母大写)
- **Number**: 使用点号作为小数点,不含千分位分隔符
- **Integer**: 整数
- **空值**: 可选字段允许空字符串 `""`

### 步骤 5: 业务规则验证

- `policy_start_year` 范围: 2024-2025
- `week_number` 范围: 28-105
- 除 `marginal_contribution_amount_yuan` 外,所有金额和数量字段 ≥ 0
- Boolean 字段必须是 `True` 或 `False`
- 枚举字段必须在规范定义的值范围内

### 步骤 6: 输出验证报告

## 输出格式

生成清晰的验证报告,包括:

- ✅ 通过的验证项
- ❌ 失败的验证项
- ⚠️ 警告信息
- 📊 数据统计 (总记录数、错误数、错误率)

**验证报告模板**:

```markdown
# CSV 数据验证报告

## 📊 概览

- 总记录数: 1,234
- 验证通过: 1,200 条
- 验证失败: 34 条
- 错误率: 2.75%
- 文件名: `2024保单第28周变动成本明细表.csv`

## ✅ 通过的验证

- 所有26个必需字段存在
- 日期格式符合 YYYY-MM-DD 标准
- 枚举值在允许范围内
- 数值字段类型正确

## ❌ 失败的验证

### 数据类型错误

1. **第 45 行**: `signed_premium_yuan` 为负数 (-1000)，违反业务规则（必须 ≥0）
2. **第 78 行**: `snapshot_date` 格式错误，应为 `YYYY-MM-DD`

### 必填字段缺失

3. **第 156 行**: 缺少必填字段 `third_level_organization`

### 枚举值错误

4. **第 203 行**: `insurance_type` 值为 `意外险`，应为 `商业险` 或 `交强险`

### 数值范围错误

5. **第 301 行**: `week_number` 值为 150，超出允许范围（28-105）

## ⚠️ 警告

### 数据异常（不阻止导入，但需人工确认）

- **12 条记录**: `marginal_contribution_amount_yuan` 为负值（合法但需关注）
- **5 条记录**: `claim_case_count` 大于 `policy_count`（不合理但可能是聚合数据）
- **3 条记录**: 评级字段全部为 `X`（未评级）

## 📋 建议操作

1. **必须修复**: 修复所有数据类型错误和必填字段缺失
2. **建议检查**: 确认枚举值错误的数据来源
3. **可选优化**: 填充评级字段的空值

## 📁 相关文档

- 数据架构规范: `开发文档/03_technical_design/data_architecture.md`
- TypeScript 类型定义: `src/types/insurance.ts`
```

## 常见问题排查

### 问题 1: 字段数量不匹配

**原因**: CSV 文件缺少必需字段或字段顺序错误
**检查点**:

- 使用 `Read` 读取 CSV 文件首行
- 对比 26 个标准字段名
- 检查是否有多余字段或缺失字段

### 问题 2: 编码问题导致中文乱码

**原因**: CSV 文件不是 UTF-8 编码
**检查点**:

```bash
file -I your_file.csv  # 检查文件编码
```

### 问题 3: Boolean 值格式错误

**原因**: 使用了 `true/false` 而非 `True/False`
**检查点**:

- 搜索 `is_new_energy_vehicle` 和 `is_transferred_vehicle` 字段
- 确认值为 `True` 或 `False`（首字母大写）

### 问题 4: 数值格式错误

**原因**: 包含千分位分隔符或使用逗号作为小数点
**检查点**:

- 数值应为 `2958.49` 而非 `2,958.49` 或 `2958,49`

## 工具使用指南

### 使用 Read 读取文件

```bash
Read your_data_file.csv
Read 开发文档/03_technical_design/data_architecture.md
```

### 使用 Grep 搜索问题

```bash
# 搜索负数保费
Grep pattern="-\d+" glob="*.csv"

# 搜索格式错误的日期
Grep pattern="\d{4}/\d{2}/\d{2}" glob="*.csv"
```

### 使用 Bash 运行类型检查

```bash
# 如果项目有验证脚本
pnpm run validate-data
```

## 最佳实践

1. **验证前先备份数据** - 不要修改原始 CSV 文件
2. **优先修复严重错误** - 必填字段缺失 > 数据类型错误 > 枚举值错误 > 警告
3. **记录验证结果** - 保存验证报告供后续参考
4. **使用中文输出** - 所有报告和建议都用中文

## 注意事项

- ⚠️ 本 skill 只能**读取和分析**数据,不能修改 CSV 文件
- ⚠️ 发现错误时,提供清晰的修复建议而非直接修改
- ⚠️ 对于大文件（>10000行），建议抽样验证前100行
