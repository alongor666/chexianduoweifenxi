#!/usr/bin/env python3
"""
数据预处理脚本 - 将英文字段名转换为中文字段名
"""
import pandas as pd
import sys

def preprocess_csv_for_dashboard(input_file: str, output_file: str):
    """
    预处理CSV数据，将英文字段名转换为中文字段名，并计算必需的KPI指标
    """
    # 读取原始数据
    df = pd.read_csv(input_file)

    # 字段映射：英文 -> 中文
    field_mapping = {
        'third_level_organization': '机构',
        'customer_category_3': '客户类别',
        'signed_premium_yuan': '签单保费',
        'matured_premium_yuan': '满期保费',
        'reported_claim_payment_yuan': '已报告赔款',
        'expense_amount_yuan': '费用金额',
        'policy_count': '保单数',
        'claim_case_count': '出险件数'
    }

    # 重命名列
    df_renamed = df.rename(columns=field_mapping)

    # 计算KPI指标（处理除零错误）
    df_renamed['满期赔付率'] = df_renamed.apply(
        lambda x: (x['已报告赔款'] / x['满期保费'] * 100) if x['满期保费'] > 0 else 0, axis=1
    )
    df_renamed['费用率'] = df_renamed.apply(
        lambda x: (x['费用金额'] / x['签单保费'] * 100) if x['签单保费'] > 0 else 0, axis=1
    )
    df_renamed['变动成本率'] = df_renamed['满期赔付率'] + df_renamed['费用率']
    df_renamed['出险率'] = df_renamed.apply(
        lambda x: (x['出险件数'] / x['保单数'] * 100) if x['保单数'] > 0 else 0, axis=1
    )
    df_renamed['案均赔款'] = df_renamed.apply(
        lambda x: (x['已报告赔款'] / x['出险件数']) if x['出险件数'] > 0 else 0, axis=1
    )

    # 选择必需的列
    required_columns = [
        '机构', '客户类别', '签单保费', '满期赔付率', '费用率',
        '变动成本率', '已报告赔款', '出险率', '案均赔款'
    ]

    df_output = df_renamed[required_columns]

    # 保存处理后的数据
    df_output.to_csv(output_file, index=False, encoding='utf-8')

    print(f"✅ 数据预处理完成")
    print(f"📊 输入文件: {input_file}")
    print(f"📊 输出文件: {output_file}")
    print(f"📊 记录数: {len(df_output)}")
    print(f"📊 字段数: {len(df_output.columns)}")

    return output_file

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python preprocess_data.py <输入文件> <输出文件>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        preprocess_csv_for_dashboard(input_file, output_file)
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
