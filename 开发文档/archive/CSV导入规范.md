# CSV 文件导入规范

## 概述

本规范定义了车险数据分析平台的CSV文件导入标准，确保数据的一致性、完整性和系统兼容性。

## 核心原则

1. **数据结构优先**：文件名可以灵活，但数据结构必须严格遵循规范
2. **字段完整性**：所有必需字段必须存在，可选字段允许为空
3. **数据类型一致**：相同字段在不同文件中必须保持相同的数据类型
4. **编码统一**：统一使用UTF-8编码，支持中文字符

## 数据结构规范

### 必需字段（26个）

CSV文件必须包含以下26个字段，字段顺序已优化匹配实际数据文件：

**标准字段顺序（推荐）：**

1. snapshot_date
2. policy_start_year
3. business_type_category
4. chengdu_branch
5. third_level_organization
6. customer_category_3
7. insurance_type
8. is_new_energy_vehicle
9. coverage_type
10. is_transferred_vehicle
11. renewal_status
12. vehicle_insurance_grade
13. highway_risk_grade
14. large_truck_score
15. small_truck_score
16. terminal_source
17. signed_premium_yuan
18. matured_premium_yuan
19. policy_count
20. claim_case_count
21. reported_claim_payment_yuan
22. expense_amount_yuan
23. commercial_premium_before_discount_yuan
24. premium_plan_yuan
25. marginal_contribution_amount_yuan
26. week_number

#### 时间维度

- `snapshot_date`: 快照日期，格式：YYYY-MM-DD
- `policy_start_year`: 保单年度，整数，实际范围：2024-2025
- `week_number`: 周序号，整数，实际范围：28-41

#### 组织维度

- `chengdu_branch`: 地域属性，枚举值：成都 | 中支
- `third_level_organization`: 三级机构，实际枚举值：本部|达州|德阳|高新|乐山|泸州|绵阳|南充|青羊|天府|武侯|新都|宜宾

#### 客户维度

- `customer_category_3`: 客户类型，实际枚举值：非营业个人客车|非营业货车|非营业机关客车|非营业企业客车|挂车|摩托车|特种车|营业城市公交|营业出租租赁|营业公路客运|营业货车

#### 产品维度

- `insurance_type`: 保险类型，枚举值：商业险 | 交强险
- `business_type_category`: 业务类型，实际枚举值：10吨以上-普货|10吨以上-牵引|2-9吨营业货车|2吨以下营业货车|9-10吨营业货车|出租车|非营业货车旧车|非营业货车新车|非营业客车旧车非过户|非营业客车旧车过户车|非营业客车新车|摩托车|其他|特种车|网约车|自卸
- `coverage_type`: 险别组合，枚举值：主全 | 交三 | 单交

#### 业务属性

- `renewal_status`: 新续转状态，枚举值：新保 | 续保 | 转保
- `is_new_energy_vehicle`: 是否新能源，布尔值：True/False（约15.8%为新能源）
- `is_transferred_vehicle`: 是否过户车，布尔值：True/False（约9.1%为过户车）

#### 评级维度

- `vehicle_insurance_grade`: 车险评级，枚举值：A|B|C|D|E|F|G|X（允许为空，约18.3%为X）
- `highway_risk_grade`: 高速风险等级，枚举值：A|B|C|D|E|F|X（允许为空）
- `large_truck_score`: 大货车评分，枚举值：A|B|C|D|E|X（允许为空）
- `small_truck_score`: 小货车评分，枚举值：A|B|C|D|E|X（允许为空）

#### 渠道维度

- `terminal_source`: 终端来源，实际枚举值：0101柜面|0106移动展业(App)|0107B2B|0110融合销售|0112AI出单|0201PC|0202APP|0301电销

#### 业务指标

- `signed_premium_yuan`: 签单保费，数值，≥0
- `matured_premium_yuan`: 满期保费，数值，≥0
- `policy_count`: 保单件数，整数，≥0
- `claim_case_count`: 赔案件数，整数，≥0
- `reported_claim_payment_yuan`: 已报告赔款，数值，≥0
- `expense_amount_yuan`: 费用金额，数值，≥0
- `commercial_premium_before_discount_yuan`: 商业险折前保费，数值，≥0
- `premium_plan_yuan`: 保费计划，数值（允许为空/null）
- `marginal_contribution_amount_yuan`: 边际贡献额，数值（可为负数）

## 数据格式要求

### 文件格式

- **文件类型**：CSV格式（.csv扩展名）
- **编码**：UTF-8（支持中文字符）
- **分隔符**：英文逗号（,）
- **文件大小**：建议不超过50MB

### 数据类型规范

#### 日期格式

- 统一使用 `YYYY-MM-DD` 格式
- 示例：`2025-07-13`

#### 布尔值格式

- 使用 `True` 或 `False`（首字母大写）
- 不接受：true/false、1/0、是/否

#### 数值格式

- 整数：直接数字，如 `2024`
- 小数：使用点号分隔，如 `2958.49`
- 负数：使用减号前缀，如 `-1000.50`
- 零值：使用 `0` 或 `0.0`

#### 空值处理

- 允许为空的字段：评级维度字段、`premium_plan_yuan`
- 空值表示：留空或使用空字符串 `""`
- 不使用：NULL、null、N/A、-

### 字段验证规则

#### 必填字段验证

- 时间维度：`snapshot_date`、`policy_start_year`、`week_number`
- 组织维度：`chengdu_branch`、`third_level_organization`
- 产品维度：`insurance_type`、`coverage_type`
- 业务属性：`renewal_status`
- 业务指标：所有金额和数量字段（除`premium_plan_yuan`外）

#### 数值范围验证

- `policy_start_year`: 2024-2025（实际数据范围）
- `week_number`: 28-41（实际数据范围）
- 所有金额字段：≥0（除`marginal_contribution_amount_yuan`可为负）
- 所有数量字段：≥0

#### 枚举值验证

严格按照规范中定义的实际枚举值，不接受其他变体：

- `third_level_organization`: 必须为13个实际机构之一
- `customer_category_3`: 必须为11个实际客户类型之一
- `business_type_category`: 必须为16个实际业务类型之一
- `terminal_source`: 必须为8个实际终端来源之一
- 其他枚举字段按照定义的实际值验证

## 文件命名建议

虽然文件名不影响数据导入，但建议使用以下命名规范便于管理：

### 周度明细文件

- 格式：`YYYY保单第WW周变动成本明细表.csv`
- 示例：`2024保单第28周变动成本明细表.csv`

### 汇总文件

- 格式：`YY年保单WW-WW周变动成本汇总表.csv`
- 示例：`25年保单28-41周变动成本汇总表.csv`

## 错误处理机制

### 数据验证

系统会对每行数据进行验证，包括：

1. 字段完整性检查
2. 数据类型验证
3. 枚举值验证
4. 数值范围验证

### 错误分类

- **严重错误**：缺少必填字段、数据类型错误
- **警告错误**：枚举值不匹配、数值超出合理范围
- **信息提示**：可选字段为空、文件名格式不标准

### 处理策略

- 严重错误：跳过该行数据，记录错误信息
- 警告错误：尝试修正或使用默认值，记录警告
- 信息提示：正常处理，记录提示信息

## 性能优化建议

### 文件大小

- 单文件建议不超过50MB
- 大数据集建议拆分为多个文件分批导入

### 数据质量

- 导入前检查数据完整性
- 清理重复数据和异常值
- 确保日期格式统一

### 批量导入

- 支持多文件同时上传
- 系统自动合并相同结构的数据
- 提供导入进度和结果反馈

## 测试验证记录

### 最新测试（2025年1月）

- **测试文件**: 测试数据.csv
- **文件大小**: 16,968行数据
- **字段验证**: ✅ 26个必需字段全部匹配
- **字段顺序**: ✅ 已优化匹配实际数据文件顺序
- **数据类型**: ✅ 所有字段类型验证通过
- **解析性能**: ✅ 大文件解析正常，支持流式处理
- **错误处理**: ✅ 详细错误日志和修复建议

### 已解决问题

1. **字段顺序不匹配**: 已调整解析器字段顺序匹配实际CSV文件
2. **大文件解析**: 优化Papa Parse配置，支持64KB分块处理
3. **错误诊断**: 增强错误日志，提供具体字段和行号信息
4. **性能优化**: 实现流式解析，避免内存溢出

### 系统兼容性

- ✅ Next.js 14.2.33
- ✅ Papa Parse 5.x
- ✅ TypeScript 严格模式
- ✅ Zod 数据验证
- ✅ UTF-8 编码支持

## 示例数据

### 标准CSV格式示例

```csv
snapshot_date,policy_start_year,business_type_category,chengdu_branch,third_level_organization,customer_category_3,insurance_type,is_new_energy_vehicle,coverage_type,is_transferred_vehicle,renewal_status,vehicle_insurance_grade,highway_risk_grade,large_truck_score,small_truck_score,terminal_source,signed_premium_yuan,matured_premium_yuan,policy_count,claim_case_count,reported_claim_payment_yuan,expense_amount_yuan,commercial_premium_before_discount_yuan,premium_plan_yuan,marginal_contribution_amount_yuan,week_number
2025-07-13,2024,10吨以上-普货,中支,乐山,营业货车,交强险,False,主全,False,续保,,,D,,0106移动展业(App),2958.49,2958.49,1,0,0.0,59.17,0.0,2958.49,2899.32,80
```

## 常见问题解决

### Q: 文件名不符合规范怎么办？

A: 文件名不影响导入，系统主要验证数据结构和内容。

### Q: 某些评级字段为空是否正常？

A: 正常，评级维度字段允许为空，系统会自动设置为默认值'X'。

### Q: 如何处理数据中的特殊字符？

A: 确保文件使用UTF-8编码，系统支持中文和特殊字符。

### Q: 导入失败如何排查？

A: 查看错误报告，重点检查必填字段、数据类型和枚举值是否符合规范。

---

**版本**: v1.0  
**更新日期**: 2025-01-27  
**维护者**: 车险数据分析平台开发团队
