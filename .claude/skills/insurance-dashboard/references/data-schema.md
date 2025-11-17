# 数据字段说明

## 基础字段

| 字段名            | 类型 | 说明         | 示例       |
| ----------------- | ---- | ------------ | ---------- |
| snapshot_date     | date | 快照日期     | 2025-11-16 |
| policy_start_year | int  | 保单起期年份 | 2025       |
| week_number       | int  | 周数（1-53） | 46         |

## 业务分类

| 字段名                 | 类型   | 说明         | 枚举值示例                       |
| ---------------------- | ------ | ------------ | -------------------------------- |
| business_type_category | string | 业务类型分类 | "10吨以上-普货", "10吨以下-危货" |
| customer_category_3    | string | 客户三级分类 | "营业货车", "非营业客车"         |
| insurance_type         | string | 险种         | "交强险", "商业保险"             |
| coverage_type          | string | 承保类型     | "主全", "交三", "单交"           |

## 组织维度

| 字段名                    | 类型   | 说明     | 层级 |
| ------------------------- | ------ | -------- | ---- |
|                           |        |          |      |
| second_level_organization | string | 二级机构 | L2   |
| third_level_organization  | string | 三级机构 | L3   |

## 车辆特征

| 字段名                 | 类型    | 说明         | 值域           |
| ---------------------- | ------- | ------------ | -------------- |
| is_new_energy_vehicle  | boolean | 是否新能源车 | True/False     |
| is_transferred_vehicle | boolean | 是否过户车   | True/False     |
| renewal_status         | string  | 续转保状态   | "续保", "转保" |

## 风险评级

| 字段名                  | 类型   | 说明         | 等级      |
| ----------------------- | ------ | ------------ | --------- |
| vehicle_insurance_grade | string | 车险风险等级 | A/B/C/D/E |
| highway_risk_grade      | string | 高速风险等级 | A/B/C/D/E |
| large_truck_score       | string | 大货车评分   | A/B/C/D/E |
| small_truck_score       | string | 小货车评分   | A/B/C/D/E |

## 渠道

| 字段名          | 类型   | 说明     |
| --------------- | ------ | -------- |
| terminal_source | string | 终端来源 |

## 财务指标（核心）

| 字段名                                  | 类型  | 说明           | 单位 |
| --------------------------------------- | ----- | -------------- | ---- |
| signed_premium_yuan                     | float | 签单保费       | 元   |
| matured_premium_yuan                    | float | 满期保费       | 元   |
| premium_plan_yuan                       | float | 保费计划       | 元   |
| commercial_premium_before_discount_yuan | float | 商业险折前保费 | 元   |
| reported_claim_payment_yuan             | float | 已发生赔款     | 元   |
| expense_amount_yuan                     | float | 费用金额       | 元   |
| marginal_contribution_amount_yuan       | float | 边际贡献金额   | 元   |

## 业务量指标

| 字段名           | 类型 | 说明     |
| ---------------- | ---- | -------- |
| policy_count     | int  | 保单件数 |
| claim_case_count | int  | 出险件数 |

## 重要说明

### 保费类型区别

- **签单保费**: 实际签订时的保费，包含所有折扣后金额
- **满期保费**: 按会计准则计算的已赚保费
- **保费计划**: 预算或目标保费

### 风险等级

A 级风险最低，E 级风险最高。空值表示未评级或不适用。

### 新能源车标识

该字段对于 NEV 专项分析至关重要，用于对比传统车和新能源车的业务表现。
