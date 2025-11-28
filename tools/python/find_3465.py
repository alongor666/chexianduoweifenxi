#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寻找 3,465万元 这个数值的来源
尝试各种可能的筛选和计算方式
"""

import pandas as pd

def load_week(week_num):
    """加载周数据"""
    file_path = f'实际数据/2025保单第{week_num}周变动成本明细表.csv'
    return pd.read_csv(file_path, encoding='utf-8-sig')

def try_various_filters(df, week_num):
    """尝试各种筛选条件"""
    target_value = 3465.0  # 目标值（万元）
    tolerance = 0.5  # 容差（万元）

    print(f"\n🔍 尝试在第{week_num}周数据中找到 {target_value:.1f} 万元")
    print(f"{'='*80}\n")

    results = []

    # 1. 检查是否是某个机构的累计值
    print("1️⃣  按三级机构筛选:")
    org_groups = df.groupby('third_level_organization')['signed_premium_yuan'].sum() / 10000
    for org, value in org_groups.items():
        if abs(value - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {org}: {value:.2f} 万元")
            results.append(('机构', org, value))
        elif value > target_value * 0.5:  # 显示接近的值
            print(f"     {org}: {value:.2f} 万元")

    # 2. 检查业务类型
    print(f"\n2️⃣  按业务类型筛选:")
    biz_groups = df.groupby('business_type_category')['signed_premium_yuan'].sum() / 10000
    for biz, value in biz_groups.items():
        if abs(value - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {biz}: {value:.2f} 万元")
            results.append(('业务类型', biz, value))
        elif value > target_value * 0.5:
            print(f"     {biz}: {value:.2f} 万元")

    # 3. 检查客户类型
    print(f"\n3️⃣  按客户类型筛选:")
    cust_groups = df.groupby('customer_category_3')['signed_premium_yuan'].sum() / 10000
    for cust, value in cust_groups.items():
        if abs(value - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {cust}: {value:.2f} 万元")
            results.append(('客户类型', cust, value))
        elif value > target_value * 0.5:
            print(f"     {cust}: {value:.2f} 万元")

    # 4. 检查保险类型
    print(f"\n4️⃣  按保险类型筛选:")
    ins_groups = df.groupby('insurance_type')['signed_premium_yuan'].sum() / 10000
    for ins, value in ins_groups.items():
        if abs(value - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {ins}: {value:.2f} 万元")
            results.append(('保险类型', ins, value))
        else:
            print(f"     {ins}: {value:.2f} 万元")

    # 5. 检查组合条件（机构+业务类型）
    print(f"\n5️⃣  按机构+业务类型组合筛选（只显示接近的）:")
    combo_groups = df.groupby(['third_level_organization', 'business_type_category'])['signed_premium_yuan'].sum() / 10000
    for (org, biz), value in combo_groups.items():
        if abs(value - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {org} + {biz}: {value:.2f} 万元")
            results.append(('组合', f'{org}+{biz}', value))

    return results

def check_increment_calculation(week43_df, week44_df):
    """检查各种增量计算方式"""
    target_value = 3465.0
    tolerance = 0.5

    print(f"\n{'='*80}")
    print(f"6️⃣  检查周增量计算（第44周 - 第43周）")
    print(f"{'='*80}\n")

    results = []

    # 按机构计算增量
    print("按机构计算增量:")
    w43_org = week43_df.groupby('third_level_organization')['signed_premium_yuan'].sum()
    w44_org = week44_df.groupby('third_level_organization')['signed_premium_yuan'].sum()

    for org in w44_org.index:
        w43_val = w43_org.get(org, 0)
        w44_val = w44_org.get(org, 0)
        increment = (w44_val - w43_val) / 10000

        if abs(increment - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {org} 增量: {increment:.2f} 万元")
            results.append(('机构增量', org, increment))
        elif abs(increment) > 100:  # 显示较大的增量
            print(f"     {org} 增量: {increment:.2f} 万元")

    # 按业务类型计算增量
    print(f"\n按业务类型计算增量:")
    w43_biz = week43_df.groupby('business_type_category')['signed_premium_yuan'].sum()
    w44_biz = week44_df.groupby('business_type_category')['signed_premium_yuan'].sum()

    for biz in w44_biz.index:
        w43_val = w43_biz.get(biz, 0)
        w44_val = w44_biz.get(biz, 0)
        increment = (w44_val - w43_val) / 10000

        if abs(increment - target_value) < tolerance:
            print(f"  ✅ 找到匹配! {biz} 增量: {increment:.2f} 万元")
            results.append(('业务类型增量', biz, increment))

    return results

def main():
    print("🔬 寻找 3,465.0 万元 的数据来源")
    print("="*80)

    # 加载数据
    week43_df = load_week(43)
    week44_df = load_week(44)

    # 尝试在第44周数据中找
    results_44 = try_various_filters(week44_df, 44)

    # 尝试在第43周数据中找
    results_43 = try_various_filters(week43_df, 43)

    # 尝试增量计算
    increment_results = check_increment_calculation(week43_df, week44_df)

    # 汇总结果
    print(f"\n{'='*80}")
    print(f"📊 搜索结果汇总")
    print(f"{'='*80}\n")

    all_results = results_44 + results_43 + increment_results

    if len(all_results) > 0:
        print("找到以下可能的匹配:")
        for category, name, value in all_results:
            print(f"  ✅ {category}: {name} = {value:.2f} 万元")
    else:
        print("❌ 未找到精确匹配的数值")
        print("\n可能的原因:")
        print("  1. 前端使用了多重筛选条件的组合")
        print("  2. 数据经过了其他转换（如按周汇总后的某个特定周）")
        print("  3. 代码bug导致计算错误")
        print("  4. 截图中的数值来自其他数据源")

    # 检查第44周的满期保费（因为您说赔付率是82.32%，可能相关）
    print(f"\n{'='*80}")
    print(f"💡 其他可能性检查")
    print(f"{'='*80}\n")

    # 计算第44周的赔付率
    w44_matured = week44_df['matured_premium_yuan'].sum()
    w44_claim = week44_df['reported_claim_payment_yuan'].sum()
    loss_ratio = (w44_claim / w44_matured * 100) if w44_matured > 0 else 0

    print(f"第44周累计赔付率: {loss_ratio:.2f}%")
    print(f"截图显示赔付率: 82.32%")

    if abs(loss_ratio - 82.32) < 1:
        print("✅ 赔付率匹配！说明数据源正确，但保费值有问题")
    else:
        print(f"⚠️  赔付率不匹配，差异: {abs(loss_ratio - 82.32):.2f}pp")

if __name__ == "__main__":
    main()
