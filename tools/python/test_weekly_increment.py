#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试周增量模式下的保费计算逻辑
验证代码实现是否正确
"""

import pandas as pd
import os

def load_week_data(week_number):
    """加载指定周的CSV数据"""
    file_path = f'实际数据/2025保单第{week_number}周变动成本明细表.csv'
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return None

    df = pd.read_csv(file_path, encoding='utf-8-sig')
    return df

def aggregate_week_data(df):
    """聚合单周数据（模拟 aggregateData 函数）"""
    if df is None or len(df) == 0:
        return None

    agg = {
        'signed_premium_yuan': df['signed_premium_yuan'].sum(),
        'matured_premium_yuan': df['matured_premium_yuan'].sum(),
        'policy_count': df['policy_count'].sum(),
        'claim_case_count': df['claim_case_count'].sum(),
        'reported_claim_payment_yuan': df['reported_claim_payment_yuan'].sum(),
        'expense_amount_yuan': df['expense_amount_yuan'].sum(),
        'commercial_premium_before_discount_yuan': df['commercial_premium_before_discount_yuan'].sum(),
        'marginal_contribution_amount_yuan': df['marginal_contribution_amount_yuan'].sum(),
        'row_count': len(df)
    }

    return agg

def calculate_increment(current_agg, previous_agg):
    """计算周增量（模拟 calculateIncrement 逻辑）"""
    if current_agg is None or previous_agg is None:
        return None

    increment = {
        'signed_premium_yuan': current_agg['signed_premium_yuan'] - previous_agg['signed_premium_yuan'],
        'matured_premium_yuan': current_agg['matured_premium_yuan'] - previous_agg['matured_premium_yuan'],
        'policy_count': current_agg['policy_count'] - previous_agg['policy_count'],
        'claim_case_count': current_agg['claim_case_count'] - previous_agg['claim_case_count'],
        'reported_claim_payment_yuan': current_agg['reported_claim_payment_yuan'] - previous_agg['reported_claim_payment_yuan'],
        'expense_amount_yuan': current_agg['expense_amount_yuan'] - previous_agg['expense_amount_yuan'],
    }

    return increment

def format_yuan_to_wan(yuan):
    """将元转换为万元"""
    return round(yuan / 10000, 2)

def main():
    print("=" * 80)
    print("🧪 周增量模式保费计算逻辑测试")
    print("=" * 80)
    print()

    weeks = [42, 43, 44, 45]

    # 加载各周数据
    print("📂 正在加载CSV数据...")
    week_data = {}
    for week in weeks:
        df = load_week_data(week)
        if df is not None:
            week_data[week] = df
            print(f"✅ 第{week}周: {len(df)} 条记录")
        else:
            print(f"❌ 第{week}周: 数据加载失败")

    print()
    print("-" * 80)
    print("📊 各周汇总数据（聚合所有记录）")
    print("-" * 80)

    # 聚合各周数据
    week_agg = {}
    for week in weeks:
        if week in week_data:
            agg = aggregate_week_data(week_data[week])
            week_agg[week] = agg
            print(f"\n第{week}周汇总:")
            print(f"  - 记录数: {agg['row_count']:,} 条")
            print(f"  - 签单保费: {format_yuan_to_wan(agg['signed_premium_yuan']):,.2f} 万元 ({agg['signed_premium_yuan']:,.2f} 元)")
            print(f"  - 满期保费: {format_yuan_to_wan(agg['matured_premium_yuan']):,.2f} 万元")
            print(f"  - 保单件数: {agg['policy_count']:,} 件")
            print(f"  - 赔案件数: {agg['claim_case_count']:,} 件")

    print()
    print("-" * 80)
    print("📈 周增量计算（当前周 - 前一周）")
    print("-" * 80)

    # 计算周增量
    for i in range(1, len(weeks)):
        current_week = weeks[i]
        previous_week = weeks[i-1]

        if current_week in week_agg and previous_week in week_agg:
            increment = calculate_increment(week_agg[current_week], week_agg[previous_week])

            print(f"\n第{current_week}周相比第{previous_week}周的增量:")
            print(f"  - 签单保费增量: {format_yuan_to_wan(increment['signed_premium_yuan']):,.2f} 万元")
            print(f"    （计算：{format_yuan_to_wan(week_agg[current_week]['signed_premium_yuan']):,.2f} - {format_yuan_to_wan(week_agg[previous_week]['signed_premium_yuan']):,.2f}）")
            print(f"  - 保单件数增量: {increment['policy_count']:,} 件")
            print(f"  - 赔案件数增量: {increment['claim_case_count']:,} 件")

    print()
    print("=" * 80)
    print("🔍 关键发现")
    print("=" * 80)
    print()
    print("CSV数据结构分析:")
    print("  ✅ 每行是一个保单记录（或一个业务组合）")
    print("  ✅ signed_premium_yuan 是该记录的保费金额（不是累计值）")
    print("  ✅ week_number 标记该记录所属的周次")
    print()
    print("代码逻辑验证:")
    print("  1️⃣  groupByYearWeek() 将同一周的所有记录分组")
    print("  2️⃣  aggregateData() 对每周的记录求和 → 得到该周的总保费")
    print("  3️⃣  calculateIncrement() 计算 当周总和 - 上周总和")
    print()
    print("⚠️  核心问题:")
    print("  CSV中的数据是【明细数据】，每行是一个保单")
    print("  aggregateData()聚合后得到的是【该周的总保费】（单周值）")
    print("  calculateIncrement()计算的是【两个单周值的差值】")
    print()
    print("  如果CSV数据已经是单周汇总，那么【不应该再做差值计算】！")
    print("  当前代码逻辑假设：CSV是累计值，通过差值得到增量")
    print("  实际情况：CSV是明细数据，聚合后就是单周值")
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
