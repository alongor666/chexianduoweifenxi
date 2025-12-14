---
id: 03_technical_design_insurance_kpi_standard_layer
title: 车险KPI标准层定义
author: AI
status: stable
type: technical
domain: insurance
tags:
- kpi
- data-model
- insurance
- standard-layer
created_at: 2025-12-13
updated_at: 2025-12-14
related_code:
- src/domain/rules/kpi-calculator-enhanced.ts
- src/domain/entities/InsuranceRecord.ts
- src/components/features/cockpit/kpi-metrics-row.tsx
complexity: high
---

# 车险KPI标准层定义

> **范围与权威**：仅汇总现行的 /开发文档 定义，排除已归档/废弃内容；冲突时遵循“全局规范 > 数据字典 > 专题说明 > 代码注释/临时记录”。
>
> **落地要求**：所有指标均给出来源、口径、边界处理、映射命名与可聚合维度，支持环比/同比/多维聚合，确保可计算可复现。

## 索引

```text
1) 指标总览与命名映射（原始字段 + 衍生指标，含别名）
2) 统一计算公式库（含防御式处理、环比/同比）
3) 聚合与口径（时间/机构/业务等维度）
4) 业务规则体系（影响计算的口径约束）
5) 数据字典规范（27字段CSV + 关键枚举 + 上传名映射）
```

## 1) 指标总览与命名映射

> 所有“有数据的字段”均视为指标。表中列出：
>
> - **技术ID**：Domain 层实体属性使用 camelCase；KPI 计算结果使用 snake_case（与数据库和 Types 保持一致）；
> - **上传字段名**：CSV 原始名（snake_case）；**UI 名**：前端展示名；**英文名/别名**：用于跨系统或历史表述的映射，避免匹配错误。
> - **源头**：数据来源或依赖字段；**类型/单位**；**可聚合维度**（支持 sum/count/avg 等）；**是否原子**：原始数据 or 由因子计算。

### 1.1 原始字段（CSV上传即得）

| 技术ID (camelCase)                  | 上传字段名                              | UI 名                | 英文名/别名               | 类型/单位         | 源头/口径说明                | 聚合方式/维度                   |
| :---------------------------------- | :-------------------------------------- | :------------------- | :------------------------ | :---------------- | :--------------------------- | :------------------------------ |
| snapshotDate                        | snapshot_date                           | 数据日期             | snapshot date             | Date (YYYY-MM-DD) | 取快照日；必填               | 维度：日/周/年                  |
| policyStartYear                     | policy_start_year                       | 保单起保年度         | policy start year         | Integer           | 保单起保年份；必填           | 维度：年                        |
| businessTypeCategory                | business_type_category                  | 业务类型             | business type / bt        | String            | 16种标准类型，兼容旧文案映射 | 维度：业务类型                  |
| chengduBranch                       | chengdu_branch                          | 一级机构             | branch                    | String            | 机构名称                     | 维度：机构                      |
| secondLevelOrganization             | second_level_organization               | 二级机构             | org lvl2                  | String            | 可选机构层级                 | 维度：机构                      |
| thirdLevelOrganization              | third_level_organization                | 三级机构             | org lvl3                  | String            | 13种标准值                   | 维度：机构                      |
| customerCategory3                   | customer_category_3                     | 客户类型             | customer category         | String            | 11种标准值                   | 维度：客户类型                  |
| insuranceType                       | insurance_type                          | 保险类型             | insurance type            | String            | 商业险/交强险                | 维度：险种                      |
| isNewEnergyVehicle                  | is_new_energy_vehicle                   | 是否新能源           | new energy flag           | Boolean           | 车辆属性                     | 维度：车辆类型                  |
| coverageType                        | coverage_type                           | 保障类型             | coverage type             | String            | 主全/交三/单交               | 维度：产品类型                  |
| isTransferredVehicle                | is_transferred_vehicle                  | 是否过户车           | transferred flag          | Boolean           | 车辆属性                     | 维度：车辆类型                  |
| renewalStatus                       | renewal_status                          | 保续状态             | renewal status            | String            | 新保/续保/转保               | 维度：保续类型                  |
| vehicleInsuranceGrade               | vehicle_insurance_grade                 | 车辆保险等级         | vehicle grade             | String            | A–G/X，可空                 | 维度：等级                      |
| highwayRiskGrade                    | highway_risk_grade                      | 高速风险等级         | highway risk              | String            | A–F/X，可空                 | 维度：等级                      |
| largeTruckScore                     | large_truck_score                       | 大货车评分           | large truck score         | String            | A–E/X，可空                 | 维度：评分                      |
| smallTruckScore                     | small_truck_score                       | 小货车评分           | small truck score         | String            | A–E/X，可空                 | 维度：评分                      |
| terminalSource                      | terminal_source                         | 终端来源             | terminal source           | String            | 8种标准值                    | 维度：渠道                      |
| signedPremiumYuan                   | signed_premium_yuan                     | 签单保费             | written premium           | Number / 元       | 原始签单保费，≥0            | 聚合：sum；维度：时间/机构/业务 |
| maturedPremiumYuan                  | matured_premium_yuan                    | 满期保费             | matured premium           | Number / 元       | 满期保费，≥0                | 聚合：sum；维度同上             |
| policyCount                         | policy_count                            | 保单件数             | policy count              | Integer           | 满期保单数，≥0              | 聚合：sum；维度同上             |
| claimCaseCount                      | claim_case_count                        | 赔案件数             | claim count               | Integer           | 报案件数，≥0                | 聚合：sum；维度同上             |
| reportedClaimPaymentYuan            | reported_claim_payment_yuan             | 已报告赔款           | reported claim            | Number / 元       | 可为负（冲销）               | 聚合：sum；维度同上             |
| expenseAmountYuan                   | expense_amount_yuan                     | 费用额               | expense amount            | Number / 元       | 费用支出，≥0                | 聚合：sum；维度同上             |
| commercialPremiumBeforeDiscountYuan | commercial_premium_before_discount_yuan | 商业险自主系数(原始) | premium before discount   | Number / 元       | 折前商业险保费，≥0          | 聚合：sum；维度同上             |
| premiumPlanYuan                     | premium_plan_yuan                       | 年度保费目标         | premium target            | Number / 元       | 年度签单保费目标，可空       | 聚合：max/latest；维度：年/机构 |
| marginalContributionAmountYuan      | marginal_contribution_amount_yuan       | 满期边际贡献额(原始) | marginal contribution amt | Number / 元       | 可为负；如缺失用公式重算     | 聚合：sum；维度同上             |
| weekNumber                          | week_number                             | 周次                 | week number               | Integer (1-53)    | 50周工作制映射值             | 维度：周                        |

### 1.2 衍生指标（由因子计算）

| 技术ID (snake_case)                         | UI 名                | 英文名/别名                  | 计算依赖                                               | 类型/单位     | 聚合方式/维度 | 备注                                 |
| :------------------------------------------ | :------------------- | :--------------------------- | :----------------------------------------------------- | :------------ | :------------ | :----------------------------------- |
| matured_premium                             | 满期保费（校验口径） | matured premium (derived)    | maturedPremiumYuan                                     | Number / 元   | sum           | 与原始字段一致，缺失时为0参与计算    |
| autonomy_coefficient                        | 商业险自主系数       | autonomy coefficient         | signedPremiumYuan, commercialPremiumBeforeDiscountYuan | Number / 系数 | avg           | 签单保费 / 折前商业险保费            |
| premium_time_progress_achievement_rate      | 保费时间进度达成率   | premium progress achievement | signedPremiumYuan, premiumPlanYuan, weekNumber         | Percent       | avg/最新      | 支持累计(A)与单周(B)模式             |
| policy_count_time_progress_achievement_rate | 件数时间进度达成率   | policy progress achievement  | policyCount, annualPolicyCountTarget                   | Percent       | avg/最新      | 目标缺失返回 null                    |
| contribution_margin_ratio                   | 满期边际贡献率       | marginal contribution rate   | variableCostRate                                       | Percent       | avg           | 100% - 变动成本率                    |
| loss_ratio                                  | 满期赔付率           | matured loss ratio           | reportedClaimPaymentYuan, maturedPremiumYuan           | Percent       | avg           | 防御式分母检查                       |
| expense_ratio                               | 费用率               | expense ratio                | expenseAmountYuan, signedPremiumYuan                   | Percent       | avg           | 分母≤0返回 null                     |
| variable_cost_ratio                         | 变动成本率           | variable cost rate           | lossRatio, expenseRatio                                | Percent       | avg           | 相加求和                             |
| contribution_margin_amount                  | 满期边际贡献额       | matured contribution amount  | maturedPremiumYuan, contributionMarginRatio            | Number / 元   | sum           | 若已有原始值则以公式校验并可覆盖缺失 |
| maturity_ratio                              | 满期率               | matured rate                 | maturedPremiumYuan, signedPremiumYuan                  | Percent       | avg           | 满期保费/签单保费                    |
| matured_claim_ratio                         | 满期出险率           | matured claim frequency      | claimCaseCount, policyCount                            | Percent       | avg           | 件数不足返回 null                    |
| average_premium                             | 单均保费             | avg premium per policy       | signedPremiumYuan, policyCount                         | Number / 元   | avg           |                                      |
| average_claim                               | 案均赔款             | avg claim payment            | reportedClaimPaymentYuan, claimCaseCount               | Number / 元   | avg           |                                      |
| average_expense                             | 单均费用             | avg expense per policy       | expenseAmountYuan, policyCount                         | Number / 元   | avg           |                                      |
| average_contribution                        | 单均边贡额           | avg marginal contribution    | contributionMarginAmount, policyCount                  | Number / 元   | avg           |                                      |
| annual_policy_count_target                  | 年度件数目标         | policy_plan_count            | 业务规划                                               | Integer       | max/latest    | 如无规划为 null                      |
| annual_premium_target                       | 年度保费目标         | premium_plan_yuan            | premiumPlanYuan                                        | Number / 元   | max/latest    | 同上                                 |

## 2) 统一计算公式库

```text
记号
- 金额字段基础单位“元”，展示可换算“万”；比率以百分比显示。
- 防御式处理：若分母≤0或缺失，返回 null；除非另有声明。
- ratio(x, y) = (y > 0 ? x / y * 100 : null)。

核心公式
- 变动成本率 = 满期赔付率 + 费用率
- 满期边际贡献率 = 100% - 变动成本率
- 满期赔付率 = ratio(已报告赔款, 满期保费)
- 费用率 = ratio(费用额, 签单保费)
- 满期边际贡献额 = 满期保费 * (满期边际贡献率 / 100)
- 满期率 = ratio(满期保费, 签单保费)
- 满期出险率 = ratio(赔案件数, 保单件数)
- 单均保费 = 签单保费 / 保单件数（缺件数→null）
- 案均赔款 = 已报告赔款 / 赔案件数（缺件数→null）
- 单均费用 = 费用额 / 保单件数（缺件数→null）
- 单均边贡额 = 满期边际贡献额 / 保单件数（缺件数→null）

时间进度与目标
- 保费时间进度达成率 (累计模式A)
    = ratio(实际签单保费累计, premiumPlanYuan) / min(当前周次/50, 1) * 100
- 保费时间进度达成率 (单周模式B)
    = ratio(当周实际签单保费, premiumPlanYuan / 50)
- 保费达成率 = ratio(实际签单保费累计, premiumPlanYuan)
- 件数时间进度达成率 = ratio(保单件数累计, policyProgressTarget) / min(当前周次/50, 1) * 100

环比/同比
- 环比增长率 = (本期值 - 上周值) / |上周值| * 100；若上周值==0，向前追溯最多5周非零值，否则返回 null。
- 同比增长率 = (本期值 - 去年同期值) / |去年同期值| * 100；若去年同期缺失则返回 null。

聚合规则
- 金额/件数类：sum
- 比率类：以明细重算比率，不做简单平均；无分母或分子缺失的明细将跳过。
```

## 3) 聚合与口径

```text
可选维度
- 时间：日、周（week_number）、月、年
- 机构：一级/二级/三级机构
- 业务：业务类型、险种、渠道终端、保障类型、新能源/过户标记、车辆/高速风险等级、客户类型

聚合口径
- sum：金额、件数类（签单保费、满期保费、费用、赔付、件数等）
- avg：均值类（单均保费、案均赔款、单均费用、单均边贡额）
- ratio：比率类按“聚合后重算”原则：ratio(sum(分子), sum(分母))

时间序列
- 周次基于 50 周工作制：第1周为1月1日至首个周六，之后每7天一周；周次超过50按50计封顶。
- 环比：与上一统计周（或向前最多5周的最近有效周）比较；同比：与去年同周比较。
```

## 4) 业务规则体系

```text
口径显示
- 正向指标（数值越高越好）使用绿色系；逆向指标（越低越好，如赔付率、费用率、变动成本率）使用红色系；中性指标使用灰色。
- 比率保留1-2位小数；金额默认“万”，件数为整数。

数据质量
- 金额/件数字段（除已报告赔款、边际贡献额可为负）要求≥0；缺失必填字段或类型错误视为严重错误并跳过该行；枚举不匹配按兼容映射或记录警告。
- 参与比率计算的分母≤0或缺失时返回 null，不以0替代。

命名层次
- Domain 层 camelCase (Entity) / snake_case (KPI Result)，Types/数据库层 snake_case；通过映射工具转换，禁止重复实现计算逻辑。

校验与回填
- 若上传的 marginal_contribution_amount_yuan 缺失或异常，可用公式重算并回填；若存在且与公式差异>1%，以上传值为准并记录校验差异。
```

## 5) 数据字典规范

```text
CSV必备字段（27项，顺序可固定）
1. snapshot_date (Date，YYYY-MM-DD)
2. policy_start_year (Integer，2024-2025)
3. business_type_category (String，16种标准类型，含兼容映射)
4. chengdu_branch (String)
5. second_level_organization (String，可选)
6. third_level_organization (String，13种)
7. customer_category_3 (String，11种)
8. insurance_type (String，商业险/交强险)
9. is_new_energy_vehicle (Boolean)
10. coverage_type (String，主全/交三/单交)
11. is_transferred_vehicle (Boolean)
12. renewal_status (String，新保/续保/转保)
13. vehicle_insurance_grade (String，A–G/X，可空)
14. highway_risk_grade (String，A–F/X，可空)
15. large_truck_score (String，A–E/X，可空)
16. small_truck_score (String，A–E/X，可空)
17. terminal_source (String，8种)
18. signed_premium_yuan (Number，≥0)
19. matured_premium_yuan (Number，≥0)
20. policy_count (Integer，≥0)
21. claim_case_count (Integer，≥0)
22. reported_claim_payment_yuan (Number，可为负)
23. expense_amount_yuan (Number，≥0)
24. commercial_premium_before_discount_yuan (Number，≥0)
25. premium_plan_yuan (Number，可选)
26. marginal_contribution_amount_yuan (Number，可为负)
27. week_number (Integer，1-53)

上传名映射与别名
- business_type_category: 可兼容“业务类型”、“业务大类”。
- terminal_source: 可兼容“渠道”、“终端来源”。
- signed_premium_yuan: 别名“签单保费(元)”“WP”。
- matured_premium_yuan: 别名“满期保费(元)” “EP”。
- reported_claim_payment_yuan: 别名“已决赔款”“赔付额”。
- expense_amount_yuan: 别名“费用”“佣金费用”。
- marginal_contribution_amount_yuan: 别名“边际贡献额”“毛利额”。

关键枚举速查
- 业务类型: 非营业客车(3)、非营业货车(2)、营业货车(8)、营业客车(2)、其他(1)；兼容简化/旧文案自动映射为标准值。
- 客户类型: 11种（挂车、摩托车、特种车、营业公路客运、营业出租租赁、营业城市公交、营业货车、非营业个人客车、非营业企业客车、非营业机关客车、非营业货车）。
- 保险类型: 商业险、交强险。
- 三级机构: 13种（本部、达州、德阳、高新、乐山、泸州、青羊、天府、武侯、新都、宜宾、资阳、自贡）。

文件格式
- CSV，UTF-8，逗号分隔，首行字段名使用 snake_case；可选字段允许空字符串，其余必填。
```
