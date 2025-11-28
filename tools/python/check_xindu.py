#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查新都机构的周增量数据
验证是否为 3,465万元
"""

import pandas as pd

def load_week(week_num):
    """加载周数据"""
    file_path = f'实际数据/2025保单第{week_num}周变动成本明细表.csv'
    return pd.read_csv(file_path, encoding='utf-8-sig')

def analyze_xindu(week_num, df):
    """分析新都机构数据"""
    # 筛选新都机构
    xindu_df = df[df['third_level_organization'] == '新都']

    print(f"\n{'='*80}")
    print(f"📊 第{week_num}周 - 新都机构数据分析")
    print(f"{'='*80}")

    if len(xindu_df) == 0:
        print("❌ 未找到新都机构数据")
        return None

    # 汇总统计
    stats = {
        'record_count': len(xindu_df),
        'signed_premium_yuan': xindu_df['signed_premium_yuan'].sum(),
        'matured_premium_yuan': xindu_df['matured_premium_yuan'].sum(),
        'policy_count': xindu_df['policy_count'].sum(),
        'claim_case_count': xindu_df['claim_case_count'].sum(),
        'reported_claim_payment_yuan': xindu_df['reported_claim_payment_yuan'].sum(),
        'expense_amount_yuan': xindu_df['expense_amount_yuan'].sum(),
    }

    print(f"\n基础统计:")
    print(f"  记录数: {stats['record_count']:,} 条")
    print(f"  签单保费: {stats['signed_premium_yuan']/10000:,.2f} 万元")
    print(f"  满期保费: {stats['matured_premium_yuan']/10000:,.2f} 万元")
    print(f"  保单件数: {stats['policy_count']:,} 件")
    print(f"  赔案件数: {stats['claim_case_count']:,} 件")
    print(f"  已报告赔款: {stats['reported_claim_payment_yuan']/10000:,.2f} 万元")
    print(f"  费用金额: {stats['expense_amount_yuan']/10000:,.2f} 万元")

    # 计算赔付率
    if stats['matured_premium_yuan'] > 0:
        loss_ratio = (stats['reported_claim_payment_yuan'] / stats['matured_premium_yuan']) * 100
        print(f"  赔付率: {loss_ratio:.2f}%")
    else:
        loss_ratio = None
        print(f"  赔付率: 无法计算（满期保费为0）")

    return stats

def main():
    print("🔬 新都机构周增量数据验证")
    print("="*80)

    # 加载第43周和第44周数据
    print("\n📂 正在加载CSV数据...")
    week43_df = load_week(43)
    week44_df = load_week(44)

    # 分析各周新都数据
    week43_stats = analyze_xindu(43, week43_df)
    week44_stats = analyze_xindu(44, week44_df)

    if week43_stats and week44_stats:
        # 计算周增量
        print(f"\n{'='*80}")
        print(f"📈 新都机构 - 第44周周增量计算")
        print(f"{'='*80}\n")

        increment = {
            'signed_premium': week44_stats['signed_premium_yuan'] - week43_stats['signed_premium_yuan'],
            'matured_premium': week44_stats['matured_premium_yuan'] - week43_stats['matured_premium_yuan'],
            'policy_count': week44_stats['policy_count'] - week43_stats['policy_count'],
            'claim_count': week44_stats['claim_case_count'] - week43_stats['claim_case_count'],
            'claim_payment': week44_stats['reported_claim_payment_yuan'] - week43_stats['reported_claim_payment_yuan'],
        }

        print(f"签单保费增量:")
        print(f"  第43周累计: {week43_stats['signed_premium_yuan']/10000:,.2f} 万元")
        print(f"  第44周累计: {week44_stats['signed_premium_yuan']/10000:,.2f} 万元")
        print(f"  周增量 = {increment['signed_premium']/10000:,.2f} 万元")
        print(f"  增长率: {(increment['signed_premium']/week43_stats['signed_premium_yuan']*100):.2f}%")

        print(f"\n保单件数增量:")
        print(f"  第43周累计: {week43_stats['policy_count']:,} 件")
        print(f"  第44周累计: {week44_stats['policy_count']:,} 件")
        print(f"  周增量 = {increment['policy_count']:,} 件")

        print(f"\n赔款增量:")
        print(f"  第43周累计赔款: {week43_stats['reported_claim_payment_yuan']/10000:,.2f} 万元")
        print(f"  第44周累计赔款: {week44_stats['reported_claim_payment_yuan']/10000:,.2f} 万元")
        print(f"  赔款增量 = {increment['claim_payment']/10000:,.2f} 万元")

        # 计算增量赔付率（基于累计数据）
        if week44_stats['matured_premium_yuan'] > 0:
            cumulative_loss_ratio = (week44_stats['reported_claim_payment_yuan'] /
                                    week44_stats['matured_premium_yuan']) * 100
            print(f"\n累计赔付率（第44周）: {cumulative_loss_ratio:.2f}%")

        # 与目标值对比
        print(f"\n{'='*80}")
        print(f"🎯 与截图数据对比")
        print(f"{'='*80}\n")

        actual_increment = increment['signed_premium'] / 10000
        screenshot_value = 3465.0

        print(f"计算得到的新都机构第44周周增量: {actual_increment:,.2f} 万元")
        print(f"截图显示的值: {screenshot_value:,.2f} 万元")

        if abs(actual_increment - screenshot_value) < 1.0:
            print(f"\n✅ 完全匹配！问题找到了！")
            print(f"\n问题根源:")
            print(f"  图表显示的 {screenshot_value:,.2f} 万元 就是新都机构的第44周周增量")
            print(f"  说明当前有筛选条件：【三级机构 = 新都】")
            print(f"  代码逻辑正确，只是用户看到的是筛选后的数据")
        else:
            diff = abs(actual_increment - screenshot_value)
            print(f"\n⚠️  不完全匹配，差异: {diff:,.2f} 万元")

            if diff < 100:
                print(f"  差异较小，可能是:")
                print(f"    - 还有其他筛选条件（如业务类型、客户类型等）")
                print(f"    - 数据精度问题")
            else:
                print(f"  差异较大，可能不是新都机构单独的数据")

        # 显示新都机构按业务类型的分布
        print(f"\n{'='*80}")
        print(f"📊 新都机构 - 第44周按业务类型分布")
        print(f"{'='*80}\n")

        xindu_44 = week44_df[week44_df['third_level_organization'] == '新都']
        biz_stats = xindu_44.groupby('business_type_category').agg({
            'signed_premium_yuan': 'sum',
            'policy_count': 'sum'
        }).sort_values('signed_premium_yuan', ascending=False)

        print("业务类型              签单保费(万元)     保单件数")
        print("-" * 60)
        for biz, row in biz_stats.head(10).iterrows():
            print(f"{biz:20s} {row['signed_premium_yuan']/10000:12,.2f} {row['policy_count']:12,.0f}")

if __name__ == "__main__":
    main()
