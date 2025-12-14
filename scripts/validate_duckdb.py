import duckdb
import sys

db_path = '/Users/xuechenglong/Documents/chexianduoweifenxi/insurance_data.duckdb'

print(f"🚀 开始验证 DuckDB 文件: {db_path}")

try:
    # 连接数据库
    con = duckdb.connect(db_path)
    print("✅ 成功连接到数据库")

    # 获取所有表名
    tables = con.execute("SHOW TABLES").fetchall()
    print(f"📋 发现 {len(tables)} 个表: {[t[0] for t in tables]}")

    target_table = 'insurance_records'
    if (target_table,) in tables:
        # 统计行数
        count = con.execute(f"SELECT COUNT(*) FROM {target_table}").fetchone()[0]
        print(f"📊 表 '{target_table}' 包含 {count} 条记录")

        # 验证关键字段
        print("\n🔍 数据预览 (前 3 条):")
        df = con.execute(f"SELECT * FROM {target_table} LIMIT 3").df()
        print(df.to_string())
        
        # 验证视图
        views = con.execute("SELECT * FROM information_schema.tables WHERE table_type='VIEW'").fetchall()
        print(f"\n👁️  发现 {len(views)} 个视图")
        
    else:
        print(f"❌ 未找到目标表 '{target_table}'")

    con.close()
    print("\n✅ 验证完成：文件有效且可读")

except Exception as e:
    print(f"\n❌ 验证失败: {e}")
    sys.exit(1)