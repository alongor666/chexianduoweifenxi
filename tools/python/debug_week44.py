#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深度调试第44周周增量计算问题
对比实际数据和前端显示的差异
"""

import pandas as pd
import os

def load_and_analyze_week(week_number):
    """加载并分析指定周的数据"""
    file_path = f'实际数据/2025保单第{week_number}周变动成本明细表.csv'
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return None

    df = pd.read_csv(file_path, encoding='utf-8-sig')

    print(f"\n{'='*80}")
    print(f"📂 第{week_number}周数据分析")
    print(f"{'='*80}")
    print(f"文件路径: {file_path}")
    print(f"记录总数: {len(df):,} 条")
    print(f"快照日期: {df['snapshot_date'].unique()}")
    print(f"week_number字段值: {df['week_number'].unique()}")

    # 基础汇总
    total_signed_premium = df['signed_premium_yuan'].sum()
    total_matured_premium = df['matured_premium_yuan'].sum()
    total_policy_count = df['policy_count'].sum()
    total_claim_count = df['claim_case_count'].sum()

    print(f"\n📊 全量汇总（无筛选）:")
    print(f"  签单保费: {total_signed_premium/10000:,.2f} 万元")
    print(f"  满期保费: {total_matured_premium/10000:,.2f} 万元")
    print(f"  保单件数: {total_policy_count:,} 件")
    print(f"  赔案件数: {total_claim_count:,} 件")

    # 按year分组看看
    year_groups = df.groupby('policy_start_year').agg({
        'signed_premium_yuan': 'sum',
        'policy_count': 'sum'
    })

    print(f"\n📅 按policy_start_year分组:")
    for year, row in year_groups.iterrows():
        print(f"  {year}年: 签单保费 {row['signed_premium_yuan']/10000:,.2f} 万元, 保单 {row['policy_count']:,} 件")

    # 查看数据的时间范围
    if 'snapshot_date' in df.columns:
        print(f"\n🕒 快照日期范围:")
        print(f"  最早: {df['snapshot_date'].min()}")
        print(f"  最晚: {df['snapshot_date'].max()}")

    return df

def compare_weeks(week1_df, week2_df, week1_num, week2_num):
    """对比两周的差异"""
    print(f"\n{'='*80}")
    print(f"📈 第{week2_num}周 vs 第{week1_num}周 差异分析")
    print(f"{'='*80}")

    # 全量对比
    w1_premium = week1_df['signed_premium_yuan'].sum()
    w2_premium = week2_df['signed_premium_yuan'].sum()
    increment_premium = w2_premium - w1_premium

    w1_policies = week1_df['policy_count'].sum()
    w2_policies = week2_df['policy_count'].sum()
    increment_policies = w2_policies - w1_policies

    print(f"\n💰 签单保费:")
    print(f"  第{week1_num}周累计: {w1_premium/10000:,.2f} 万元")
    print(f"  第{week2_num}周累计: {w2_premium/10000:,.2f} 万元")
    print(f"  周增量 = {increment_premium/10000:,.2f} 万元")
    print(f"  增长率: {(increment_premium/w1_premium*100):.2f}%")

    print(f"\n📋 保单件数:")
    print(f"  第{week1_num}周累计: {w1_policies:,} 件")
    print(f"  第{week2_num}周累计: {w2_policies:,} 件")
    print(f"  周增量 = {increment_policies:,} 件")

    # 记录数差异
    record_diff = len(week2_df) - len(week1_df)
    print(f"\n📂 CSV记录数:")
    print(f"  第{week1_num}周: {len(week1_df):,} 条")
    print(f"  第{week2_num}周: {len(week2_df):,} 条")
    print(f"  新增记录: {record_diff:,} 条")

    return increment_premium / 10000

def check_potential_issues(df, week_num):
    """检查可能导致异常的问题"""
    print(f"\n{'='*80}")
    print(f"🔍 第{week_num}周数据质量检查")
    print(f"{'='*80}")

    # 检查异常大额保单
    high_value_threshold = 100000  # 10万元
    high_value_records = df[df['signed_premium_yuan'] > high_value_threshold]

    if len(high_value_records) > 0:
        print(f"\n⚠️  发现 {len(high_value_records)} 条高额保单 (>10万元):")
        print(f"  总保费: {high_value_records['signed_premium_yuan'].sum()/10000:,.2f} 万元")
        print(f"  占总保费比例: {high_value_records['signed_premium_yuan'].sum()/df['signed_premium_yuan'].sum()*100:.2f}%")

        # 显示TOP5
        top5 = high_value_records.nlargest(5, 'signed_premium_yuan')[
            ['business_type_category', 'third_level_organization', 'signed_premium_yuan', 'policy_count']
        ]
        print("\n  TOP5 高额记录:")
        for idx, row in top5.iterrows():
            print(f"    {row['business_type_category']} | {row['third_level_organization']} | "
                  f"{row['signed_premium_yuan']:,.2f}元 | {row['policy_count']}件")

    # 检查week_number字段
    unique_weeks = df['week_number'].unique()
    print(f"\n📅 week_number字段检查:")
    print(f"  唯一值: {sorted(unique_weeks)}")
    if len(unique_weeks) > 1:
        print(f"  ⚠️  警告: 发现多个周次值！")
        for week in sorted(unique_weeks):
            count = len(df[df['week_number'] == week])
            print(f"    第{week}周: {count:,} 条记录")

    # 检查policy_start_year
    unique_years = df['policy_start_year'].unique()
    print(f"\n📅 policy_start_year字段检查:")
    print(f"  唯一值: {sorted(unique_years)}")

    # 检查负值
    negative_premium = df[df['signed_premium_yuan'] < 0]
    if len(negative_premium) > 0:
        print(f"\n⚠️  发现 {len(negative_premium)} 条负保费记录")
        print(f"  负保费总和: {negative_premium['signed_premium_yuan'].sum()/10000:,.2f} 万元")

def main():
    print("🔬 深度调试第44周周增量计算问题")
    print("="*80)

    # 加载第43周和第44周数据
    week43_df = load_and_analyze_week(43)
    week44_df = load_and_analyze_week(44)

    if week43_df is not None and week44_df is not None:
        # 对比计算
        increment = compare_weeks(week43_df, week44_df, 43, 44)

        # 数据质量检查
        check_potential_issues(week43_df, 43)
        check_potential_issues(week44_df, 44)

        # 最终结论
        print(f"\n{'='*80}")
        print(f"🎯 最终结论")
        print(f"{'='*80}")
        print(f"\n根据实际CSV数据计算:")
        print(f"  第44周的周增量 = {increment:,.2f} 万元")
        print(f"\n您截图中显示的值: 3,465.0 万元")
        print(f"差异: {3465.0 - increment:,.2f} 万元")
        print(f"\n可能的原因:")
        print(f"  1️⃣  前端使用了不同的筛选条件")
        print(f"  2️⃣  calculateIncrement 函数实现有bug")
        print(f"  3️⃣  useTrendData hook 的数据分组逻辑有问题")
        print(f"  4️⃣  图表组件显示了错误的数据字段")
        print(f"\n建议:")
        print(f"  ✅ 在浏览器控制台打印 trendData 查看实际传给图表的数据")
        print(f"  ✅ 检查 weekly-operational-trend.tsx 中的数据处理逻辑")
        print(f"  ✅ 验证 useTrendData 返回的 signed_premium_10k 值")

if __name__ == "__main__":
    main()
