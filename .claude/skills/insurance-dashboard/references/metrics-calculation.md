# 车险业务 KPI 计算公式标准（V3.0）

本文档定义了车险业务分析仪表板的 16 个核心 KPI 的计算公式、字段映射和业务解读，与代码实现完全一致。

**文档来源**：

- 标准定义：`开发文档/03_technical_design/core_calculations.md`
- 代码实现：`src/lib/calculations/kpi-formulas.ts`
- 计算引擎：`src/lib/calculations/kpi-engine.ts`

---

## 一、核心原则

### 1.1 数据驱动

所有 KPI 均源自 `InsuranceRecord` 的 26 个基础字段，不创造字段，不假设数据结构。

### 1.2 计算一致性

- **比率指标**: 先汇总分子分母，再计算比率（避免直接平均）
- **绝对值指标**: 使用增量数据进行周期对比
- **比率指标**: 使用累计数据进行周期对比
- **单位规范**: 金额（万元）、均值（元）、比率（百分比）

### 1.3 除零保护

所有除法运算必须使用 `safeDivide` 函数：

```typescript
function safeDivide(numerator: number, denominator: number): number | null {
  if (!denominator || denominator === 0) {
    return null
  }
  return numerator / denominator
}
```

---

## 二、16 个核心 KPI，15个必选，保费时间进度达成率 (Premium Progress Rate)可选

### 第一行：核心比率指标

#### 1. 满期边际贡献率 (Marginal Contribution Ratio)

**计算公式**:

```
满期边际贡献率 = 100% - 变动成本率
或
满期边际贡献率 = (边际贡献额 / 满期保费) × 100%
```

**字段映射**:

```typescript
numerator: marginal_contribution_amount_yuan  // 边际贡献额（元）
denominator: matured_premium_yuan            // 满期保费（元）
```

**代码实现** (`kpi-formulas.ts:94-104`):

```typescript
contribution_margin_ratio: {
  formula: '(边际贡献额 / 满期保费) × 100%',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 盈利能力的结果指标，衡量最终的盈利空间
- **正常范围**: -20% - 20%

  - \> 15%: 卓越，盈利能力强
  - 15-11%: 优秀
  - 8-11%: 正常
  - 0-8%: 亏损，毛利
  - 小于0%：巨亏
- **关键关系**: `满期边际贡献率 = 100% - (满期赔付率 + 费用率)`

---

#### 2. 保费时间进度达成率 (Premium Progress Rate)

**核心假设：中国特色 50 周工作制**

- 春节长假：约 1 周
- 国庆长假：约 1 周
- 实际工作周数：52 - 2 = **50 周**
- **周计划 = 年度目标 ÷ 50**

**两种计算模式**:

##### 模式 A：当周值模式（累计视角）

```
保费时间进度达成率 = (实际签单保费累计 / 年度目标保费) / (已过天数 / 365) × 100%
```

**示例**：

- 年度目标：10,000 万元
- 第 42 周结束日：2025-10-18（已过 292 天，时间进度 = 80%）
- 实际累计保费：8,500 万元（完成率 = 85%）
- **时间进度达成率 = 85% / 80% = 106.25%**（超前于时间进度）

##### 模式 B：周增量模式（单周视角）

```
保费时间进度达成率 = 周增量 / 周计划 × 100%
其中：周计划 = 年度目标 ÷ 50
```

**示例**：

- 年度目标：10,000 万元
- 周计划：10,000 ÷ 50 = 200 万元/周
- 第 42 周实际增量：215 万元
- **时间进度达成率 = 215 / 200 = 107.5%**（本周超额完成）

**字段映射**:

```typescript
// 模式 A
numerator: signed_premium_yuan_cumulative     // 累计签单保费
denominator: annual_target_yuan * (days_passed / 365)

// 模式 B
numerator: signed_premium_yuan_weekly         // 周增量签单保费
denominator: annual_target_yuan / 50          // 周计划
```

**代码实现** (`kpi-formulas.ts:140-150`):

```typescript
premium_progress: {
  formula: '(签单保费 / 保费计划) / (已过天数 / 365) × 100%',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 衡量保费收入与年度目标的匹配程度
- **正常范围**: 90% - 110%
  - \> 110%: 超额完成，进度领先
  - 90-110%: 正常，与时间进度匹配
  - < 90%: 滞后，需要加强业务推进

---

#### 3. 满期赔付率 (Loss Ratio)

**计算公式**:

```
满期赔付率 = (已报告赔款 / 满期保费) × 100%
```

**字段映射**:

```typescript
numerator: reported_claim_payment_yuan   // 已报告赔款（元）
denominator: matured_premium_yuan        // 满期保费（元）
```

**代码实现** (`kpi-formulas.ts:58-68`):

```typescript
loss_ratio: {
  formula: '(已报告赔款 / 满期保费) × 100%',
  description: '每100元满期保费对应的赔款支出',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 反映保险业务的风险成本
- **正常范围**: 60% - 80%
  - < 60%: 可能定价过高或理赔审核过严
  - 60-70%: 优秀
  - 70-80%: 正常
  - \> 80%: 风险较高，需要调整定价或风控

---

#### 4. 费用率 (Expense Ratio)

**计算公式**:

```
费用率 = (费用金额 / 签单保费) × 100%
```

**字段映射**:

```typescript
numerator: expense_amount_yuan      // 费用金额（元）
denominator: signed_premium_yuan    // 签单保费（元）
```

**代码实现** (`kpi-formulas.ts:70-80`):

```typescript
expense_ratio: {
  formula: '(费用金额 / 签单保费) × 100%',
  description: '每100元签单保费对应的费用支出',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 衡量获取和管理业务所需成本的效率
- **正常范围**: 15% - 25%
  - < 15%: 优秀，运营效率高
  - 15-25%: 正常
  - \> 25%: 费用偏高，需优化运营

---

### 第二行：核心金额指标（万元）

#### 5. 满期边际贡献额 (Marginal Contribution Amount)

**计算公式**:

```
满期边际贡献额 = 满期保费 × 满期边际贡献率
或
满期边际贡献额 = 满期保费 - 已报告赔款 - 费用金额
```

**字段映射**:

```typescript
matured_premium_yuan           // 满期保费（元）
marginal_contribution_amount_yuan / 10000  // 转换为万元
```

**代码实现** (`kpi-formulas.ts:213-221`):

```typescript
contribution_margin_amount: {
  formula: 'Σ 边际贡献额（元）/ 10000',
  description: '边际利润总和，单位万元',
  unit: '万元',
}
```

**业务解读**:

- **核心意义**: 利润的绝对值贡献，定位利润来源
- **应用场景**:
  - 对比不同分支机构的利润贡献
  - 识别高盈利的业务类型
  - 评估边际贡献的变化趋势

---

#### 6. 签单保费 (Signed Premium)

**计算公式**:

```
签单保费 = Σ 签单保费（元）/ 10000
```

**字段映射**:

```typescript
signed_premium_yuan / 10000  // 转换为万元
```

**代码实现** (`kpi-formulas.ts:153-161`):

```typescript
signed_premium: {
  formula: 'Σ 签单保费（元）/ 10000',
  description: '所有保单的签单保费总和，单位万元',
  unit: '万元',
}
```

**业务解读**:

- **核心意义**: 业务规模的核心体现，是最基础的业务量指标
- **应用场景**:
  - 评估市场份额
  - 对比不同时期的业务增长
  - 计算其他衍生指标的基础

---

#### 7. 已报告赔款 (Reported Claim Payment)

**计算公式**:

```
已报告赔款 = Σ 已报告赔款（元）/ 10000
```

**字段映射**:

```typescript
reported_claim_payment_yuan / 10000  // 转换为万元
```

**代码实现** (`kpi-formulas.ts:193-201`):

```typescript
reported_claim_payment: {
  formula: 'Σ 已报告赔款（元）/ 10000',
  description: '已报告的赔款支出总和，单位万元',
  unit: '万元',
}
```

**业务解读**:

- **核心意义**: 已发生并上报的赔案金额，反映赔款成本的绝对规模
- **注意事项**:
  - 不包含未报告赔款（IBNR）
  - 与满期保费匹配使用计算赔付率

---

#### 8. 费用额 (Expense Amount)

**计算公式**:

```
费用额 = Σ 费用金额（元）/ 10000
```

**字段映射**:

```typescript
expense_amount_yuan / 10000  // 转换为万元
```

**代码实现** (`kpi-formulas.ts:203-211`):

```typescript
expense_amount: {
  formula: 'Σ 费用金额（元）/ 10000',
  description: '业务费用支出总和，单位万元',
  unit: '万元',
}
```

**业务解读**:

- **核心意义**: 业务相关的总费用支出
- **包含项**: 手续费、佣金、运营成本等
- **应用场景**: 成本控制、费用率计算的基础

---

### 第三行：结构与效率指标

#### 9. 变动成本率 (Variable Cost Ratio)

**计算公式**:

```
变动成本率 = 满期赔付率 + 费用率
```

**字段映射**:

```typescript
// 从其他 KPI 计算得出
loss_ratio + expense_ratio
```

**代码实现** (`kpi-formulas.ts:106-114`):

```typescript
variable_cost_ratio: {
  formula: '费用率 + 满期赔付率',
  description: '综合成本率，包含费用和赔款',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 成本控制能力，诊断成本端的整体表现
- **正常范围**: 70% - 85%
  - < 70%: 优秀，成本控制良好
  - 70-85%: 正常
  - \> 85%: 成本过高，盈利空间小
- **关键关系**: `满期边际贡献率 = 100% - 变动成本率`

---

#### 10. 满期率 (Maturity Ratio)

**计算公式**:

```
满期率 = (满期保费 / 签单保费) × 100%
```

**字段映射**:

```typescript
numerator: matured_premium_yuan   // 满期保费（元）
denominator: signed_premium_yuan  // 签单保费（元）
```

**代码实现** (`kpi-formulas.ts:82-92`):

```typescript
maturity_ratio: {
  formula: '(满期保费 / 签单保费) × 100%',
  description: '签单保费中已满期保费的占比',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 反映当期保费中已实现风险价值的部分
- **典型值**:
  - 新业务期: 满期率较低（20-40%）
  - 稳定期: 满期率较高（80-90%）
- **应用场景**: 评估保单的成熟度和风险暴露程度

---

#### 11. 满期出险率 (Matured Claim Ratio)

**计算公式**:

```
满期出险率 = (赔案件数 / 保单件数) × 满期率
或
满期出险率 = (赔案件数 / 满期保单数) × 100%
```

**字段映射**:

```typescript
numerator: claim_case_count     // 赔案件数
denominator: policy_count       // 保单件数
adjustment: maturity_ratio      // 满期率调整
```

**代码实现** (`kpi-formulas.ts:116-126`):

```typescript
matured_claim_ratio: {
  formula: '(赔案件数 / 保单件数) × 满期率',
  description: '考虑满期因素的出险率',
  unit: '%',
}
```

**业务解读**:

- **核心意义**: 衡量已满期保单的出险频率
- **正常范围**: 3% - 8%
  - < 3%: 客户质量好或风控严格
  - 3-8%: 正常
  - \> 8%: 出险频繁，需要风险评估
- **注意事项**: 必须考虑满期因素，否则会低估出险率

---

#### 12. 保单件数 (Policy Count)

**计算公式**:

```
保单件数 = COUNT(保单)
```

**字段映射**:

```typescript
policy_count  // 保单数量（件）
```

**代码实现** (`kpi-formulas.ts:173-181`):

```typescript
policy_count: {
  formula: 'Σ 保单件数',
  description: '保单的总数量',
  unit: '件',
}
```

**业务解读**:

- **核心意义**: 业务规模的辅助指标，从数量维度衡量业务量
- **应用场景**:
  - 计算件均指标的基础
  - 评估客户覆盖范围
  - 与保费金额配合分析业务结构

---

### 第四行：单均质量指标（元）

#### 13. 赔案件数 (Claim Case Count)

**计算公式**:

```
赔案件数 = COUNT(赔案)
```

**字段映射**:

```typescript
claim_case_count  // 赔案数量（件）
```

**代码实现** (`kpi-formulas.ts:183-191`):

```typescript
claim_case_count: {
  formula: 'Σ 赔案件数',
  description: '发生理赔的案件总数',
  unit: '件',
}
```

**业务解读**:

- **核心意义**: 赔付发生的频率，反映出险的绝对数量
- **应用场景**:
  - 计算出险率
  - 计算案均赔款
  - 评估理赔工作量

---

#### 14. 单均保费 (Average Premium per Policy)

**计算公式**:

```
单均保费 = 签单保费（元）/ 保单件数
```

**字段映射**:

```typescript
numerator: signed_premium_yuan  // 签单保费（元）
denominator: policy_count       // 保单件数
```

**代码实现** (`kpi-formulas.ts:224-234`):

```typescript
average_premium: {
  formula: '签单保费（元）/ 保单件数',
  description: '每张保单的平均保费',
  unit: '元',
}
```

**业务解读**:

- **核心意义**: 业务质量指标，衡量平均每张保单的保费收入
- **典型值**:
  - 交强险: 800-1,200 元/件
  - 商业险: 2,000-5,000 元/件
  - 综合: 3,000-6,000 元/件
- **应用场景**:
  - 评估客户质量
  - 对比不同渠道的业务价值
  - 识别高价值业务

---

#### 15. 案均赔款 (Average Claim per Incident)

**计算公式**:

```
案均赔款 = 已报告赔款（元）/ 赔案件数
```

**字段映射**:

```typescript
numerator: reported_claim_payment_yuan  // 已报告赔款（元）
denominator: claim_case_count           // 赔案件数
```

**代码实现** (`kpi-formulas.ts:236-246`):

```typescript
average_claim: {
  formula: '已报告赔款（元）/ 赔案件数',
  description: '每个赔案的平均赔款金额',
  unit: '元',
}
```

**业务解读**:

- **核心意义**: 风险成本指标，衡量平均每起赔案的赔付金额
- **典型值**:
  - 小额赔案: 1,000-3,000 元/件
  - 中等赔案: 5,000-15,000 元/件
  - 重大赔案: > 30,000 元/件
- **应用场景**:
  - 评估案件严重程度
  - 对比不同业务类型的风险水平
  - 识别异常赔案

---

#### 16. 单均费用 (Average Expense per Policy)

**计算公式**:

```
单均费用 = 费用金额（元）/ 保单件数
```

**字段映射**:

```typescript
numerator: expense_amount_yuan  // 费用金额（元）
denominator: policy_count       // 保单件数
```

**代码实现** (`kpi-formulas.ts:248-258`):

```typescript
average_expense: {
  formula: '费用金额（元）/ 保单件数',
  description: '每张保单的平均费用支出',
  unit: '元',
}
```

**业务解读**:

- **核心意义**: 运营效率指标，衡量平均每张保单的费用成本
- **典型值**: 500-1,500 元/件
- **应用场景**:
  - 评估运营效率
  - 对比不同渠道的获客成本
  - 优化费用结构

---

## 三、边际贡献分析专题

边际贡献分析是对核心盈利指标的深度下钻，包含四个维度：

### 3.1 满期边贡率（盈利能力结果）

```
满期边贡率 = 100% - 变动成本率
```

**解读**: 每 100 元满期保费的净剩余

### 3.2 变动成本率（成本控制能力）

```
变动成本率 = 满期赔付率 + 费用率
```

**解读**: 业务的直接成本结构

### 3.3 满期边贡额（利润绝对值）

```
满期边贡额 = 满期保费 × 满期边际贡献率
```

**解读**: 利润的绝对贡献额

### 3.4 单均边贡额（盈利质量）

```
单均边贡额 = (满期边贡额 × 10000) / 保单件数
```

**解读**: 判断增长是否为高质量的盈利性增长

**代码实现位置**: `src/components/marginal-contribution-analysis.tsx`

---

## 四、数据聚合与计算规则

### 4.1 比率指标的正确聚合方式

**❌ 错误做法**:

```python
# 不要直接平均赔付率
avg_loss_ratio = df['loss_ratio'].mean()
```

**✅ 正确做法**:

```python
# 先汇总分子分母，再计算比率
total_claim = df['reported_claim_payment_yuan'].sum()
total_premium = df['matured_premium_yuan'].sum()
loss_ratio = total_claim / total_premium * 100
```

**原因**: 直接平均会导致权重错误，小保费保单和大保费保单权重相同。

---

### 4.2 增量 vs 累计值计算规则

这是周期对比计算中的**核心规则**：

#### 绝对值指标（使用增量数据）

适用于: 签单保费、保单件数、赔案件数、已报告赔款、费用额等

```python
# 计算周增量
current_week_premium = currentAgg.signed_premium_yuan - previousAgg.signed_premium_yuan
current_week_policy_count = currentAgg.policy_count - previousAgg.policy_count

# 环比变化
change_amount = current_week_premium - previous_week_premium
change_percent = (current_week_premium - previous_week_premium) / previous_week_premium * 100
```

**示例**：

- 第 41 周累计签单保费: 8,000 万元
- 第 42 周累计签单保费: 8,200 万元
- **第 42 周增量签单保费 = 8,200 - 8,000 = 200 万元**

#### 比率指标（使用累计数据）

适用于: 赔付率、费用率、边际贡献率、满期率等

```python
# ✅ 必须基于累计数据计算
loss_ratio_current = (累计赔款 / 累计满期保费) × 100%
loss_ratio_previous = (上期累计赔款 / 上期累计满期保费) × 100%

# 环比变化（绝对值和百分比）
change_pp = loss_ratio_current - loss_ratio_previous  // 百分点变化
change_percent = (loss_ratio_current - loss_ratio_previous) / loss_ratio_previous * 100
```

**❌ 错误做法**:

```python
# 不要对增量计算比率（会导致波动过大）
weekly_loss_ratio = (周增量赔款 / 周增量保费) × 100%  # ❌ 错误
```

**原因**: 周增量数据波动大，直接计算比率会失真。例如某周新保单多但赔案少，赔付率会异常偏低。

---

### 4.3 加权平均计算

当需要计算平均值时，应使用加权平均：

```python
# 加权平均件均保费
weighted_avg_premium = (
    df['signed_premium_yuan'].sum() /
    df['policy_count'].sum()
)

# 而不是简单平均
simple_avg_premium = df['average_premium'].mean()  # ❌ 错误
```

---

### 4.4 按维度聚合示例

#### 按业务类型聚合

```python
grouped = df.groupby('business_type_category').agg({
    'signed_premium_yuan': 'sum',
    'matured_premium_yuan': 'sum',
    'reported_claim_payment_yuan': 'sum',
    'expense_amount_yuan': 'sum',
    'policy_count': 'sum',
    'claim_case_count': 'sum'
})

# 计算衍生指标
grouped['loss_ratio'] = (
    grouped['reported_claim_payment_yuan'] /
    grouped['matured_premium_yuan'] * 100
)
grouped['expense_ratio'] = (
    grouped['expense_amount_yuan'] /
    grouped['signed_premium_yuan'] * 100
)
```

#### 按时间趋势分析

```python
weekly_trend = df.groupby('week_number').agg({
    'signed_premium_yuan': 'sum',
    'marginal_contribution_amount_yuan': 'sum'
}).sort_index()

# 计算周增量
weekly_trend['signed_premium_increment'] = weekly_trend['signed_premium_yuan'].diff()
```

---

## 五、数据清洗与异常值处理

### 5.1 除零保护

**标准实现**:

```python
def safe_divide(numerator, denominator, default=None):
    """安全除法，避免除零错误

    Args:
        numerator: 分子
        denominator: 分母
        default: 分母为0时的默认返回值（None 或 0）

    Returns:
        计算结果或默认值
    """
    if denominator == 0 or pd.isna(denominator):
        return default
    return numerator / denominator
```

**TypeScript 实现** (`src/lib/calculations/kpi-engine.ts`):

```typescript
function safeDivide(
  numerator: number | null,
  denominator: number | null
): number | null {
  if (!numerator || !denominator || denominator === 0) {
    return null
  }
  return numerator / denominator
}
```

---

### 5.2 异常值识别规则

| 指标       | 异常阈值               | 处理方式                               |
| :--------- | :--------------------- | :------------------------------------- |
| 赔付率     | > 200%                 | 标记为异常，单独分析（可能是重大赔案） |
| 费用率     | > 50%                  | 检查数据质量（可能是数据错误）         |
| 边际贡献率 | < -50%                 | 正常（严重亏损业务），但需重点关注     |
| 件均保费   | < 100 元或 > 50,000 元 | 检查数据质量                           |
| 案均赔款   | > 100,000 元           | 标记为重大赔案                         |

---

### 5.3 NULL 值处理

**原则**:

- 绝对值指标: NULL 视为 0
- 比率指标: 分母为 0 或 NULL 时返回 NULL（不返回 0）

**示例**:

```python
# 处理 NULL 值
df['signed_premium_yuan'] = df['signed_premium_yuan'].fillna(0)

# 计算比率时保留 NULL
df['loss_ratio'] = df.apply(
    lambda row: safe_divide(
        row['reported_claim_payment_yuan'],
        row['matured_premium_yuan'],
        default=None  # 返回 NULL 而非 0
    ),
    axis=1
)
```

---

## 六、周次与日期映射规则

### 6.1 周次定义

- **第 1 周**: 从 1 月 1 日开始，到第一个周六结束
- **后续周**: 每周从周日开始，到周六结束（完整 7 天）

### 6.2 2025 年示例

- 第 1 周：2025-01-01（周三）~ 2025-01-04（周六）= 4 天
- 第 2 周：2025-01-05（周日）~ 2025-01-11（周六）= 7 天
- 第 42 周：2025-10-13（周一）~ 2025-10-18（周六）= 7 天

### 6.3 计算公式

```javascript
// 计算第 N 周的结束日期
const firstWeekEndDate = getFirstSaturday(year)  // 获取第一个周六
const weekNEndDate = addDays(firstWeekEndDate, (N - 1) * 7)

// 计算已过天数（从 1 月 1 日到第 N 周结束日）
const daysPassed = differenceInDays(weekNEndDate, new Date(year, 0, 1)) + 1
```

**代码实现**: `src/lib/calculations/time-progress.ts:getTimeProgressForWeek`

---

## 七、显示格式与单位规范

### 7.1 数值格式

| 指标类型 | 单位 | 小数位数         | 示例           |
| :------- | :--- | :--------------- | :------------- |
| 比率指标 | %    | 1-2 位           | 65.5%, 106.25% |
| 金额指标 | 万元 | 0-2 位           | 1,234.56 万元  |
| 均值指标 | 元   | 0 位（四舍五入） | 3,456 元       |
| 数量指标 | 件   | 0 位             | 10,234 件      |

### 7.2 颜色编码规则

**正向指标**（越高越好）:

- 边际贡献率、保费达成率、单均保费等
- 使用绿色系表示优秀，红色系表示不佳

**逆向指标**（越低越好）:

- 赔付率、费用率、变动成本率等
- 使用红色系表示风险，绿色系表示优秀

**中性指标**:

- 签单保费、保单件数等
- 使用灰色系或蓝色系

---

## 八、最佳实践

### 8.1 代码层面

1. ✅ **总是使用 `safeDivide`** - 防止除零错误
2. ✅ **明确注释计算逻辑** - 在代码中说明公式来源
3. ✅ **保持公式与文档同步** - 修改计算逻辑时同步更新文档
4. ✅ **验证单位转换** - 元、万元、百分比要清晰标注
5. ✅ **区分累计值和增量值** - 特别是在周期对比中

### 8.2 业务分析层面

1. ✅ **多维度交叉分析** - 结合业务类型、分支机构、时间趋势
2. ✅ **关注异常值** - 及时识别和处理数据异常
3. ✅ **环比同比结合** - 既看短期变化，也看长期趋势
4. ✅ **绝对值和比率结合** - 既看规模，也看效率
5. ✅ **边际贡献分析** - 深入理解盈利结构

### 8.3 数据质量层面

1. ✅ **验证数据完整性** - 确保 26 个基础字段齐全
2. ✅ **检查数据一致性** - 签单保费 ≥ 满期保费
3. ✅ **识别异常数据** - 使用业务规则识别异常
4. ✅ **处理缺失值** - 明确 NULL 值的业务含义
5. ✅ **周次范围控制** - 28-105 周（过滤异常周次）

---

## 九、常见问题排查

### 问题 1: KPI 数值为 NaN 或 Infinity

**原因**: 除零错误
**解决**: 检查是否使用 `safeDivide` 函数

### 问题 2: 赔付率异常高（> 150%）

**原因**: 可能是重大赔案或数据错误
**解决**:

- 检查赔款金额是否正确
- 确认满期保费与赔款是否匹配
- 查看是否有大额赔案

### 问题 3: 保费时间进度达成率为 NaN

**原因**: 年度目标保费未配置或为 0
**解决**:

- 确认年度目标配置
- 检查时间进度计算逻辑
- 验证周次到日期的映射

### 问题 4: 周增量数据异常波动

**原因**: 使用增量数据计算比率指标
**解决**:

- 绝对值指标使用增量
- 比率指标使用累计值计算

### 问题 5: 前端显示与计算结果不一致

**原因**: 数据精度或四舍五入差异
**解决**:

- 统一小数位数规则
- 检查单位转换（元 ↔ 万元）
- 验证百分比转换（× 100）

---

## 十、文档维护

### 10.1 版本历史

- **V1.0** (2024-09-01): 初始版本
- **V2.0** (2024-10-15): 新增 50 周工作制、增量 vs 累计值规则
- **V3.0** (2025-01-17): 完全对齐代码实现，新增 16 个 KPI 完整定义

### 10.2 相关文档

- **标准定义**: `开发文档/03_technical_design/core_calculations.md`
- **代码实现**: `src/lib/calculations/kpi-formulas.ts`
- **计算引擎**: `src/lib/calculations/kpi-engine.ts`
- **功能文档**: `开发文档/02_functional_documentation/F001-F014.md`

### 10.3 维护规则

1. 修改计算公式时，必须同步更新本文档和 `core_calculations.md`
2. 代码实现变更时，必须在 commit message 中引用相关文档
3. 每次更新需在版本历史中记录变更内容
4. 保持与 `kpi-formulas.ts` 的 100% 一致性

---

## 附录：字段映射表

基于 `InsuranceRecord` 的 26 个标准字段：

| 字段英文名                            | 字段中文名   | 单位 | 用途                   |
| :------------------------------------ | :----------- | :--- | :--------------------- |
| `signed_premium_yuan`               | 签单保费     | 元   | 业务规模、费用率计算   |
| `matured_premium_yuan`              | 满期保费     | 元   | 赔付率、边际贡献率计算 |
| `reported_claim_payment_yuan`       | 已报告赔款   | 元   | 赔付率、案均赔款计算   |
| `expense_amount_yuan`               | 费用金额     | 元   | 费用率、单均费用计算   |
| `marginal_contribution_amount_yuan` | 边际贡献额   | 元   | 边际贡献率计算         |
| `policy_count`                      | 保单件数     | 件   | 件均指标计算           |
| `claim_case_count`                  | 赔案件数     | 件   | 出险率、案均赔款计算   |
| `week_number`                       | 周次         | -    | 时间维度聚合           |
| `branch_code`                       | 分支机构代码 | -    | 机构维度聚合           |
| `business_type_category`            | 业务类型分类 | -    | 业务类型维度聚合       |

完整字段定义请参考：`开发文档/03_technical_design/data_structure.md`

---

**文档状态**: ✅ 现行标准
**最后更新**: 2025-01-17
**维护人**: KPI Calculator Skill
