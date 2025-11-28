#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证缓存键计算逻辑
检查是否因为缓存键冲突导致错误
"""

import pandas as pd
import hashlib

def load_week(week_num):
    """加载周数据"""
    file_path = f'实际数据/2025保单第{week_num}周变动成本明细表.csv'
    return pd.read_csv(file_path, encoding='utf-8-sig')

def filter_xindu(df):
    """筛选新都机构"""
    return df[df['third_level_organization'] == '新都']

def generate_cache_key(records, mode='increment', target_override=None):
    """
    模拟 TypeScript 代码中的 generateCacheKey 方法

    原始代码：
    private generateCacheKey(
      records: InsuranceRecord[],
      mode?: string,
      targetOverride?: number | null
    ): string {
      const targetKey = targetOverride ? `_${Math.round(targetOverride)}` : ''
      const key = `${mode || 'current'}_${records.length}_${records.reduce((sum, r) => sum + r.signed_premium_yuan, 0)}${targetKey}`
      return key
    }
    """
    total_premium = records['signed_premium_yuan'].sum()
    target_key = f"_{round(target_override)}" if target_override else ''
    cache_key = f"{mode}_{len(records)}_{total_premium}{target_key}"
    return cache_key

def main():
    print("🔍 缓存键冲突检查")
    print("="*80)

    # 加载数据
    weeks = [42, 43, 44, 45]
    xindu_data = {}

    for week in weeks:
        df = load_week(week)
        xindu_df = filter_xindu(df)
        xindu_data[week] = xindu_df
        print(f"第{week}周新都数据: {len(xindu_df)} 条记录, 保费: {xindu_df['signed_premium_yuan'].sum()/10000:.2f} 万元")

    print()
    print("="*80)
    print("🔑 缓存键计算（周增量模式）")
    print("="*80)
    print()

    # 模拟周增量模式的缓存键计算
    cache_keys = {}

    for week in weeks:
        if week == 42:
            # 第一周使用当周值模式
            cache_key = generate_cache_key(xindu_data[week], mode='current')
            print(f"第{week}周（当周值模式）:")
            print(f"  缓存键: {cache_key}")
        else:
            # 后续周使用周增量模式
            cache_key = generate_cache_key(xindu_data[week], mode='increment')
            print(f"第{week}周（周增量模式）:")
            print(f"  缓存键: {cache_key}")
            print(f"  记录数: {len(xindu_data[week])}")
            print(f"  累计保费: {xindu_data[week]['signed_premium_yuan'].sum()}")

        cache_keys[week] = cache_key
        print()

    # 检查是否有重复的缓存键
    print("="*80)
    print("🔍 缓存键冲突检查")
    print("="*80)
    print()

    unique_keys = set(cache_keys.values())
    if len(unique_keys) == len(cache_keys):
        print("✅ 没有缓存键冲突")
    else:
        print("❌ 发现缓存键冲突！")
        for week1, key1 in cache_keys.items():
            for week2, key2 in cache_keys.items():
                if week1 < week2 and key1 == key2:
                    print(f"  第{week1}周 和 第{week2}周 的缓存键相同: {key1}")

    print()
    print("="*80)
    print("💡 关键发现")
    print("="*80)
    print()

    print("根据 TypeScript 代码，缓存键的生成逻辑是:")
    print("  cacheKey = `${mode}_${records.length}_${totalPremium}`")
    print()
    print("这意味着:")
    print("  - 使用记录的【数量】和【累计保费总和】作为缓存键")
    print("  - 但在周增量模式下，calculateIncrement 接收的是:")
    print("    - currentWeekRecords: 当前周的所有记录（累计数据）")
    print("    - previousWeekRecords: 上周的所有记录（累计数据）")
    print()
    print("⚠️  问题可能在于:")
    print("  1. 缓存键只考虑了 currentWeekRecords")
    print("  2. 没有考虑 previousWeekRecords")
    print("  3. 导致不同的增量计算可能共享同一个缓存")
    print()
    print("例如:")
    print("  - 第44周相对第43周的增量")
    print("  - 第44周相对第42周的增量")
    print("  这两个计算的缓存键可能相同！因为都基于第44周的数据")

if __name__ == "__main__":
    main()
