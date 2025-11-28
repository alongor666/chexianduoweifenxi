#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模拟前端完整计算流程
验证周增量模式下新都机构的数据
"""

import pandas as pd

def load_week(week_num):
    """加载周数据"""
    file_path = f'实际数据/2025保单第{week_num}周变动成本明细表.csv'
    return pd.read_csv(file_path, encoding='utf-8-sig')

def filter_xindu(df):
    """筛选新都机构"""
    return df[df['third_level_organization'] == '新都']

def aggregate_data(df):
    """聚合数据（模拟aggregateData函数）"""
    return {
        'signed_premium_yuan': df['signed_premium_yuan'].sum(),
        'matured_premium_yuan': df['matured_premium_yuan'].sum(),
        'policy_count': df['policy_count'].sum(),
        'claim_case_count': df['claim_case_count'].sum(),
        'reported_claim_payment_yuan': df['reported_claim_payment_yuan'].sum(),
    }

def compute_increment_agg(current_agg, previous_agg):
    """计算增量聚合数据"""
    return {
        'signed_premium_yuan': current_agg['signed_premium_yuan'] - previous_agg['signed_premium_yuan'],
        'matured_premium_yuan': current_agg['matured_premium_yuan'] - previous_agg['matured_premium_yuan'],
        'policy_count': current_agg['policy_count'] - previous_agg['policy_count'],
        'claim_case_count': current_agg['claim_case_count'] - previous_agg['claim_case_count'],
        'reported_claim_payment_yuan': current_agg['reported_claim_payment_yuan'] - previous_agg['reported_claim_payment_yuan'],
    }

def compute_kpis(agg):
    """计算KPI（模拟computeKPIs函数）"""
    # 转换为万元并四舍五入
    signed_premium = round(agg['signed_premium_yuan'] / 10000)
    matured_premium = round(agg['matured_premium_yuan'] / 10000)

    # 计算赔付率
    loss_ratio = None
    if agg['matured_premium_yuan'] > 0:
        loss_ratio = (agg['reported_claim_payment_yuan'] / agg['matured_premium_yuan']) * 100

    return {
        'signed_premium': signed_premium,
        'matured_premium': matured_premium,
        'loss_ratio': loss_ratio,
        'policy_count': agg['policy_count'],
    }

def simulate_use_trend_data(weeks, organization_filter='新都'):
    """模拟useTrendData hook的完整流程"""
    print(f"\n{'='*80}")
    print(f"🔄 模拟 useTrendData Hook（筛选机构：{organization_filter}）")
    print(f"{'='*80}\n")

    # 1. 加载并筛选数据
    filtered_data = {}
    for week in weeks:
        df = load_week(week)
        if organization_filter:
            df = filter_xindu(df)
        filtered_data[week] = df
        print(f"第{week}周筛选后数据: {len(df)} 条记录")

    # 2. 按周分组（模拟groupByYearWeek）
    grouped = {}
    for week, df in filtered_data.items():
        key = f"2025-{str(week).zfill(3)}"
        grouped[key] = df

    sorted_keys = sorted(grouped.keys())
    print(f"\n排序后的周次键: {sorted_keys}")

    # 3. 计算各周的KPI（周增量模式）
    print(f"\n{'='*80}")
    print(f"📊 周增量模式计算过程")
    print(f"{'='*80}\n")

    trend_points = []

    for index, key in enumerate(sorted_keys):
        week_num = int(key.split('-')[1])
        rows = grouped[key]

        print(f"--- 第{week_num}周 ---")

        if index > 0:
            # 周增量模式：计算当前周与前一周的差值
            previous_key = sorted_keys[index - 1]
            previous_rows = grouped[previous_key]

            print(f"  模式: 周增量（相比第{int(previous_key.split('-')[1])}周）")

            # 聚合当前周和前一周数据
            current_agg = aggregate_data(rows)
            previous_agg = aggregate_data(previous_rows)

            print(f"  当前周累计保费: {current_agg['signed_premium_yuan']/10000:,.2f} 万元")
            print(f"  前一周累计保费: {previous_agg['signed_premium_yuan']/10000:,.2f} 万元")

            # 计算增量聚合数据
            increment_agg = compute_increment_agg(current_agg, previous_agg)

            print(f"  增量保费: {increment_agg['signed_premium_yuan']/10000:,.2f} 万元")

            # 基于增量数据计算KPI
            increment_kpi = compute_kpis(increment_agg)

            # 基于累计数据计算比率指标
            cumulative_kpi = compute_kpis(current_agg)

            # 合并结果：绝对值用增量，比率用累计
            kpi = {
                'signed_premium': increment_kpi['signed_premium'],  # 使用增量
                'loss_ratio': cumulative_kpi['loss_ratio'],  # 使用累计
            }

            print(f"  最终KPI - signed_premium: {kpi['signed_premium']} 万元（增量）")
            print(f"  最终KPI - loss_ratio: {kpi['loss_ratio']:.2f}%（累计）")

        else:
            # 第一周：使用当周值
            print(f"  模式: 当周值（第一周，无前一周可比）")

            current_agg = aggregate_data(rows)
            kpi = compute_kpis(current_agg)

            print(f"  signed_premium: {kpi['signed_premium']} 万元（当周值）")
            print(f"  loss_ratio: {kpi['loss_ratio']:.2f}% if kpi['loss_ratio'] else 'N/A'")

        trend_points.append({
            'week': week_num,
            'signed_premium_10k': kpi['signed_premium'],
            'loss_ratio': kpi['loss_ratio'],
        })

        print()

    return trend_points

def main():
    print("🧪 完整前端计算流程模拟")
    print("="*80)

    weeks = [42, 43, 44, 45]

    # 模拟筛选新都机构的情况
    trend_data = simulate_use_trend_data(weeks, organization_filter='新都')

    # 显示最终结果
    print(f"{'='*80}")
    print(f"📈 最终TrendData结果（应该传给图表的数据）")
    print(f"{'='*80}\n")

    print(f"{'周次':<8} {'signed_premium_10k':<20} {'loss_ratio':<15}")
    print("-" * 50)
    for point in trend_data:
        loss_ratio_str = f"{point['loss_ratio']:.2f}%" if point['loss_ratio'] else "N/A"
        print(f"第{point['week']}周   {point['signed_premium_10k']:<20} {loss_ratio_str:<15}")

    # 重点检查第44周
    week44_data = next((p for p in trend_data if p['week'] == 44), None)

    if week44_data:
        print(f"\n{'='*80}")
        print(f"🎯 第44周数据验证")
        print(f"{'='*80}\n")

        print(f"应该传给图表的第44周数据:")
        print(f"  signed_premium_10k: {week44_data['signed_premium_10k']} 万元")
        print(f"  loss_ratio: {week44_data['loss_ratio']:.2f}%")

        print(f"\n您截图中的数据:")
        print(f"  签单保费: 3,465.0 万元")
        print(f"  赔付率: 82.32%")

        print(f"\n对比结果:")
        if week44_data['signed_premium_10k'] == 76:
            print(f"  ✅ 代码逻辑正确！周增量应该是 76 万元")
            print(f"  ❌ 但截图显示 3,465万元，说明：")
            print(f"     1️⃣  图表组件显示了错误的数据字段")
            print(f"     2️⃣  或者没有使用 useTrendData 的返回值")
            print(f"     3️⃣  或者 displayData 处理有问题")
        elif week44_data['signed_premium_10k'] == 3465:
            print(f"  ❌ 代码bug！返回的是累计值，不是增量值")
            print(f"  问题在 calculateIncrement 函数")
        else:
            print(f"  ⚠️  数据不匹配：{week44_data['signed_premium_10k']} vs 3465.0")

if __name__ == "__main__":
    main()
