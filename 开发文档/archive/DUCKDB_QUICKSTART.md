# DuckDB 快速入门指南

> 🚀 5 分钟上手 DuckDB 高性能数据分析

## 📋 前置条件

- Python 3.7+ (用于数据转换)
- 现代浏览器 (Chrome 87+, Firefox 78+, Safari 14+)

## 🎯 快速开始

### 第1步: 安装 Python 依赖 (2分钟)

```bash
# 安装 DuckDB Python 包
pip install duckdb

# 或使用虚拟环境(推荐)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install duckdb
```

### 第2步: 转换 CSV 文件 (1分钟)

```bash
# 确保 CSV 文件在 实际数据/ 目录下
cd /path/to/project

# 运行转换脚本
python scripts/csv_to_duckdb.py

# 输出示例:
# ================================================================================
# 🚀 CSV 转 DuckDB 转换工具
# ================================================================================
# 📁 找到 4 个 CSV 文件
# ✅ 转换成功完成！
# 💾 数据库文件: insurance_data.duckdb (2.85 MB)
```

### 第3步: 在网页中使用 (1分钟)

1. 打开车险分析平台网页
2. 点击"上传数据"按钮
3. 选择生成的 `insurance_data.duckdb` 文件
4. 等待加载完成（< 0.5秒）
5. 开始分析！✨

## ✅ 验证安装

```bash
# 测试 Python 脚本
python3 -c "import duckdb; print('✅ DuckDB 安装成功!')"

# 检查数据库文件
ls -lh insurance_data.duckdb
# 应显示文件大小约 2-5 MB
```

## 🎁 即时收益

- ⚡ **页面刷新**: 从 2-5秒 → < 0.5秒
- 🚀 **查询速度**: 提升 10-20倍
- 💾 **文件大小**: 减少 80%
- 🔍 **SQL 查询**: 支持复杂分析

## 📚 下一步

- [完整文档](开发文档/03_technical_design/duckdb_integration.md)
- [Python 脚本说明](scripts/README.md)
- [故障排除](#常见问题)

## ❓ 常见问题

### Q: 转换脚本报错 "找不到 CSV 文件"

**A**: 确保 CSV 文件在 `实际数据/` 目录下：

```bash
ls 实际数据/*.csv
```

### Q: 网页加载数据库文件失败

**A**: 确认文件格式正确：

1. 文件扩展名为 `.duckdb` 或 `.db`
2. 文件由 Python 脚本生成（不是手动重命名）
3. 文件未损坏（尝试重新生成）

### Q: Python 提示 "No module named 'duckdb'"

**A**: 安装 DuckDB：

```bash
pip install duckdb
# 或
pip3 install duckdb
```

### Q: 性能没有明显提升

**A**: 检查以下几点：

1. 确认使用的是 `.duckdb` 文件（不是 CSV）
2. 检查浏览器控制台是否有警告信息
3. 确认数据量足够大（小于 1000 行差异不明显）

## 🔧 高级选项

### 自定义输入输出路径

```bash
# 修改 scripts/csv_to_duckdb.py 的参数
converter = CSVToDuckDBConverter(
    csv_pattern="your/path/*.csv",
    output_db="custom_name.duckdb"
)
```

### 增量更新

```bash
# 只添加新周数据（示例）
python3 << 'EOF'
import duckdb
conn = duckdb.connect('insurance_data.duckdb')
conn.execute("INSERT INTO insurance_records SELECT * FROM '实际数据/第46周.csv'")
conn.close()
EOF
```

## 💡 提示

- ✅ 每周更新数据时，重新运行转换脚本即可
- ✅ `.duckdb` 文件可以版本控制（使用 Git LFS）
- ✅ 支持离线使用（数据在浏览器本地）
- ✅ 可以同时保留 CSV 和 DuckDB 两种格式

## 🎉 完成！

现在您已成功集成 DuckDB，享受极速数据分析体验！

---

**遇到问题？** 查看[完整文档](开发文档/03_technical_design/duckdb_integration.md#故障排除)或提交 Issue。
