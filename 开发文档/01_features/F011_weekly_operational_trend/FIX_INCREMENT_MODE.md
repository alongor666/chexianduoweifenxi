# 周增量模式赔付率计算逻辑修复

> **修复日期**: 2025-10-26
> **问题级别**: ⚠️ 严重 - 影响数据准确性
> **影响范围**: 周增量模式下的所有比率指标

## 问题发现

用户指出数据理解错误：

> "你看看文档中是如何定义当前周值与周增量的，你的理解错了，我的每一周对应的值都是年累计的值，而不是当周值"

## 问题分析

### CSV原始数据特性

- 每周的数据是**年度累计值**（从1月1日到该周结束的累计）
- 例如：
  - 第1周：1月1-4日的累计数据
  - 第42周：1月1日-10月18日的累计数据

### 原有问题

在 `kpi-engine.ts` 的 `calculateIncrement` 方法中：

```typescript
// 问题代码（修复前）
const incrementAgg = {
  signed_premium_yuan:
    currentAgg.signed_premium_yuan - previousAgg.signed_premium_yuan,
  reported_claim_payment_yuan:
    currentAgg.reported_claim_payment_yuan -
    previousAgg.reported_claim_payment_yuan,
  // ...
}

// 直接用增量数据计算KPI
const result = computeKPIs(incrementAgg, { mode: 'increment' })
```

**错误原因**：

- 在`computeKPIs`函数中，赔付率计算为：`reported_claim_payment_yuan / matured_premium_yuan`
- 当传入增量数据时，实际计算的是：**单周增量赔款 / 单周增量保费**
- 这导致赔付率异常波动（某周可能无赔款，某周赔款集中）

### 正确逻辑

- **绝对值指标**（签单保费、件数等）：应该显示增量（当周累计 - 上周累计）
- **比率指标**（赔付率、费用率等）：应该基于累计数据计算（累计赔款 / 累计保费）

## 修复方案

### 修改位置

文件：`src/lib/calculations/kpi-engine.ts`
方法：`calculateIncrement`

### 修复逻辑

```typescript
// 1. 计算增量数据（用于绝对值指标）
const incrementAgg = {
  signed_premium_yuan:
    currentAgg.signed_premium_yuan - previousAgg.signed_premium_yuan,
  // ...其他增量字段
}

// 2. 计算增量KPI（绝对值指标使用增量数据）
const incrementResult = computeKPIs(incrementAgg, {
  premiumTargetYuan: annualTargetYuan,
  mode: 'increment',
})

// 3. 计算基于累计数据的比率指标
const cumulativeResult = computeKPIs(currentAgg, {
  premiumTargetYuan: annualTargetYuan,
  mode: 'current', // ✅ 使用当周值模式计算比率
})

// 4. 合并结果
const result = {
  // 比率指标：使用累计数据计算
  loss_ratio: cumulativeResult.loss_ratio,
  expense_ratio: cumulativeResult.expense_ratio,
  // ...其他比率

  // 绝对值指标：使用增量数据
  signed_premium: incrementResult.signed_premium,
  policy_count: incrementResult.policy_count,
  // ...其他绝对值
}
```

### 关键改动

| 指标类型 | 修复前               | 修复后                   |
| -------- | -------------------- | ------------------------ |
| 签单保费 | 增量 ✅              | 增量 ✅（无变化）        |
| 赔付率   | 增量赔款/增量保费 ❌ | **累计赔款/累计保费** ✅ |
| 费用率   | 增量费用/增量保费 ❌ | **累计费用/累计保费** ✅ |
| 满期率   | 增量满期/增量签单 ❌ | **累计满期/累计签单** ✅ |

## 数据含义对比

### 修复前（错误）

```
第41周: 赔付率 = (第41周赔款 - 第40周赔款) / (第41周满期 - 第40周满期)
          = 单周赔款 / 单周满期
          = 可能极大波动（0% ~ 300%+）
```

### 修复后（正确）

```
第41周: 赔付率 = 第41周累计赔款 / 第41周累计满期
          = (1月1日-10月11日累计赔款) / (1月1日-10月11日累计满期)
          = 年初至今整体赔付率
          = 稳定反映风险水平
```

## 影响范围

### 受影响的指标

在**周增量模式**下，以下指标的计算方式被修正：

1. **赔付率** (`loss_ratio`)
2. **费用率** (`expense_ratio`)
3. **满期率** (`maturity_ratio`)
4. **边际贡献率** (`contribution_margin_ratio`)
5. **变动成本率** (`variable_cost_ratio`)
6. **满期出险率** (`matured_claim_ratio`)
7. **商业险自主系数** (`autonomy_coefficient`)

### 不受影响的指标

以下指标仍然使用增量数据（这是正确的）：

1. **签单保费** - 显示周增量
2. **保单件数** - 显示周增量
3. **赔案件数** - 显示周增量
4. **单均保费** - 增量保费 / 增量件数
5. **时间进度达成率** - 周增量 / 周计划

## 验证方法

### 1. 数据一致性检查

```typescript
// 在浏览器控制台运行
const currentData = /* 第42周数据 */
const previousData = /* 第41周数据 */

// 验证赔付率
console.log('当周值模式赔付率:', currentData.loss_ratio)
console.log('周增量模式赔付率:', /* 应该与当周值模式相同 */)

// 验证签单保费
console.log('当周值模式签单:', currentData.signed_premium)
console.log('周增量模式签单:', currentData.signed_premium - previousData.signed_premium)
```

### 2. 业务逻辑验证

- 赔付率应该稳定，不应在周之间剧烈波动
- 赔付率应该在合理范围内（通常40%-90%）
- 赔付率趋势应该平滑，反映长期趋势

## 相关文档

- [核心计算逻辑](../../03_technical_design/core_calculations.md) - 保费时间进度达成率双模式
- [数据架构](../../03_technical_design/data_architecture.md) - CSV数据累计值特性
- [功能说明](./README.md#数据含义说明) - 当周值vs周增量模式说明

## 后续建议

1. **单元测试**: 为 `calculateIncrement` 方法添加单元测试
2. **集成测试**: 验证趋势图在两种模式下的数据正确性
3. **文档同步**: 确保所有文档明确说明数据含义
4. **UI提示**: 在界面上明确标注"累计赔付率"

## 总结

✅ **修复完成**：周增量模式下，比率指标现在正确使用累计数据计算
✅ **数据准确**：赔付率现在能够准确反映年初至今的整体风险水平
✅ **业务价值**：管理层可以正确监控赔付率是否超过70%阈值
✅ **文档完整**：所有相关文档已更新说明

---

_修复记录由 Claude Code 创建_
_最后更新: 2025-10-26_
