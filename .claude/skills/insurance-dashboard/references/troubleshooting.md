# 故障排除指南

## 常见问题

### 1. 数据加载失败

**问题**: `✗ 数据加载失败: 'utf-8' codec can't decode`

**解决方案**:
```bash
# 检查文件编码
file -I data.csv

# 转换编码为 UTF-8
iconv -f GBK -t UTF-8 data.csv > data_utf8.csv
```

或在 Python 中指定编码:
```python
df = pd.read_csv('data.csv', encoding='gbk')
```

---

### 2. 除零错误

**问题**: `ZeroDivisionError: division by zero`

**原因**: 某些分组的满期保费或签单保费为零

**解决方案**:
脚本已内置安全除法，如果仍出现此错误，检查数据完整性:
```python
# 检查空值
df[df['matured_premium_yuan'] == 0]
```

---

### 3. 图表不显示

**问题**: HTML 打开后图表区域空白

**原因**:
1. Chart.js CDN 加载失败
2. 浏览器控制台有 JavaScript 错误
3. 数据格式不匹配

**解决方案**:
1. 检查网络连接
2. 打开浏览器开发者工具 (F12) 查看错误
3. 验证生成的 JSON 数据格式

---

### 4. 内存不足

**问题**: 处理大数据集时 Python 崩溃

**解决方案**:
```python
# 分块读取
chunks = pd.read_csv('large_file.csv', chunksize=10000)
for chunk in chunks:
    process(chunk)
```

或使用数据抽样:
```python
# 随机抽取 10% 数据
df_sample = df.sample(frac=0.1)
```

---

### 5. 日期解析错误

**问题**: `ValueError: time data does not match format`

**解决方案**:
```python
# 指定日期格式
df['snapshot_date'] = pd.to_datetime(
    df['snapshot_date'], 
    format='%Y-%m-%d'
)
```

---

### 6. 中文乱码

**问题**: 图表或报告中中文显示为方块

**解决方案**:
```python
# 确保字体支持中文
import matplotlib
matplotlib.rcParams['font.sans-serif'] = ['SimHei']
matplotlib.rcParams['axes.unicode_minus'] = False
```

或在 HTML 中:
```html
<meta charset="UTF-8">
<style>
body {
    font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}
</style>
```

---

### 7. 缺失字段

**问题**: `KeyError: 'is_new_energy_vehicle'`

**原因**: CSV 文件缺少必需字段

**解决方案**:
运行数据验证脚本:
```bash
python scripts/validate_data.py data.csv
```

查看缺失字段并补充数据。

---

### 8. 性能优化

**问题**: 仪表板生成速度慢

**优化建议**:

1. **使用 categorical 类型**:
```python
categorical_cols = [
    'business_type_category',
    'insurance_type',
    'coverage_type'
]
for col in categorical_cols:
    df[col] = df[col].astype('category')
```

2. **预聚合数据**:
```python
# 缓存聚合结果
cached_metrics = df.groupby('week_number').agg({...})
```

3. **减少图表数量**:
根据实际需求选择性生成图表。

---

## 调试技巧

### 启用详细日志

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 检查数据摘要

```python
print(df.info())
print(df.describe())
print(df.head())
```

### 验证计算结果

```python
# 手动验证赔付率
sample_loss_ratio = (
    df['reported_claim_payment_yuan'].sum() / 
    df['matured_premium_yuan'].sum() * 100
)
print(f"赔付率: {sample_loss_ratio:.2f}%")
```

---

## 获取帮助

如果以上方法无法解决问题:

1. 检查 Python 和依赖包版本:
```bash
python --version
pip list | grep pandas
pip list | grep numpy
```

2. 提供错误堆栈信息和数据样本
3. 描述期望的输出结果
