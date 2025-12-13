# 常见问题快速修复指南

本文档提供针对常见问题的快速修复方案和代码模板。

## 🔴 致命问题修复

### 问题1: 缺少SKILL.md

**修复方案:**

```bash
# 创建基础SKILL.md
cat > SKILL.md << 'EOF'
---
name: my-skill
description: >
  技能功能描述。Use when [场景1], [场景2], [场景3].
  适用于: (1) [用途1] (2) [用途2] (3) [用途3]
---

# 技能名称

## 快速开始

1. [步骤1]
2. [步骤2]
3. [步骤3]

## 使用说明

[详细说明]
EOF
```

### 问题2: 缺少YAML Frontmatter

**修复方案:**
在SKILL.md文件开头添加:

```yaml
---
name: your-skill-name
description: >
  [功能描述]. Use when [触发场景1], [触发场景2], [触发场景3].
  适用于: (1) [用途1] (2) [用途2] (3) [用途3]
---
```

**填写技巧:**

- name: 小写,用连字符,如 `excel-analyzer`
- description: 至少100字符,包含3-5个场景

### 问题3: Scripts语法错误

**修复方案:**

```bash
# 检查所有Python文件语法
for f in scripts/*.py; do
    python -m py_compile "$f" 2>&1 | grep -v "^$" && echo "❌ $f 有语法错误"
done

# 使用pylint深度检查
pip install pylint --break-system-packages
pylint scripts/*.py
```

**常见语法错误:**

```python
# 错误1: 缩进混乱
def func():
print("错误")  # 缺少缩进

# 修复:
def func():
    print("正确")

# 错误2: 引号不匹配
text = "hello'  # 不匹配

# 修复:
text = "hello"

# 错误3: 括号不闭合
result = func(a, b  # 缺少)

# 修复:
result = func(a, b)
```

---

## ⚠️ 警告修复

### 问题4: Description缺少"何时使用"

**当前状态:**

```yaml
description: >
  这是一个数据分析工具
```

**修复方案:**

```yaml
description: >
  数据分析工具,用于处理和分析Excel文件。Use when 需要分析数据字段结构、
  生成数据字典或验证数据质量。适用于: (1) Excel字段分析 (2) 数据质量检查 
  (3) 字段映射生成 (4) 统计报告创建
```

**触发词清单:**

- "Use when..."
- "Use for..."
- "适用于..."
- "触发场景包括..."
- "当用户需要..."

### 问题5: Description场景数量不足

**当前状态:**

```yaml
description: >
  报告生成工具。Use when 需要生成报告
```

**修复方案:**

```yaml
description: >
  自动化报告生成工具。Use when:
  (1) 生成周报和月报
  (2) 创建数据分析报告
  (3) 制作管理层汇报材料
  (4) 导出可视化图表
  (5) 批量生成标准化文档
```

### 问题6: 失效的文件引用

**检测方法:**

```bash
# 在SKILL.md中查找所有文件引用
grep -o '`[^`]*\.\(py\|md\|json\)`' SKILL.md

# 检查文件是否存在
for file in $(grep -o '`[^`]*\.\(py\|md\|json\)`' SKILL.md | tr -d '`'); do
    [ ! -f "$file" ] && echo "❌ 缺失: $file"
done
```

**修复方案:**

```bash
# 方案1: 创建缺失的文件
touch scripts/missing_script.py
touch references/missing_doc.md

# 方案2: 删除引用
# 在SKILL.md中搜索并删除对应的引用行
```

### 问题7: SKILL.md过长

**检测:**

```bash
# 统计非空行数（不含YAML）
tail -n +$(grep -n "^---$" SKILL.md | tail -1 | cut -d: -f1) SKILL.md | grep -c .
```

**修复策略:**

**当前结构 (600行):**

```markdown
# 技能名称

## 快速开始

[50行]

## 详细配置

[200行配置说明]

## API参考

[150行API文档]

## 示例代码

[200行示例]
```

**优化后结构 (200行):**

```markdown
# 技能名称

## 快速开始

[50行]

## 配置

参见 `references/config.md` 了解所有配置参数

## API使用

详细API文档见 `references/api.md`

## 示例

常用示例见 `references/examples.md`
```

**迁移清单:**

- [ ] 详细配置 → `references/config.md`
- [ ] API文档 → `references/api.md`
- [ ] 示例代码 → `references/examples.md`
- [ ] 高级功能 → `references/advanced.md`

### 问题8: 未清理的示例文件

**检测:**

```bash
find . -iname "*example*" -type f
```

**修复:**

```bash
# 删除所有示例文件
rm scripts/example.py
rm references/api_reference.md
rm assets/example_asset.txt

# 或批量删除
find . -iname "*example*" -type f -delete
```

---

## ⭐ 优化建议实施

### 建议1: 添加推荐章节

**基础模板:**

```markdown
# 技能名称

## 快速开始

最简使用流程:

1. [第一步]
2. [第二步]
3. [第三步]

## 工作流程

完整处理流程:

1. **准备阶段**: [说明]
2. **执行阶段**: [说明]
3. **输出阶段**: [说明]

## 配置说明

参见 `references/config.md` 了解详细参数

## 常见问题

- **问题1**: [解决方案]
- **问题2**: [解决方案]
```

### 建议2: 改进Scripts文档

**标准模板:**

```python
#!/usr/bin/env python3
"""
[脚本名称] - [一句话功能描述]

详细说明:
    [2-3句话说明脚本用途和工作原理]

用法:
    python script.py <arg1> <arg2> [options]

参数:
    arg1        必需参数说明
    arg2        必需参数说明
    --option    可选参数说明

示例:
    # 基础用法
    python script.py input.csv output.json

    # 高级用法
    python script.py input.csv output.json --verbose

返回值:
    0  - 成功
    1  - 参数错误
    2  - 处理失败
"""

import sys
import argparse

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='脚本描述')
    # ... 参数定义
    args = parser.parse_args()

    # 处理逻辑
    pass

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
```

### 建议3: 完善References文档

**配置文档模板 (config.md):**

````markdown
# 配置参数说明

## 必需参数

| 参数名     | 类型   | 说明         | 示例       |
| ---------- | ------ | ------------ | ---------- |
| input_file | string | 输入文件路径 | "data.csv" |
| output_dir | string | 输出目录     | "./output" |

## 可选参数

| 参数名    | 类型  | 默认值 | 说明         | 示例 |
| --------- | ----- | ------ | ------------ | ---- |
| threshold | float | 0.8    | 阈值设定     | 0.95 |
| max_rows  | int   | 1000   | 最大处理行数 | 5000 |

## 配置示例

```json
{
  "input_file": "data.csv",
  "output_dir": "./output",
  "threshold": 0.9,
  "max_rows": 2000
}
```
````

## 高级配置

### 性能优化

- `batch_size`: 批处理大小,默认100
- `parallel`: 是否并行处理,默认false

### 输出格式

- `format`: 输出格式,支持 json/csv/xlsx
- `encoding`: 文件编码,默认 utf-8

```

---

## 🚀 完整修复流程示例

### 场景: 新创建的技能评分60分

**检查结果:**
```

🔴 致命问题:

1. YAML缺少description字段

⚠️ 警告:

1. Description缺少"何时使用"说明
2. 发现3个示例文件未清理
3. scripts/process.py缺少文档字符串

⭐ 建议:

1. 建议添加"快速开始"章节
2. references/api_reference.md内容不足

````

**修复步骤:**

**步骤1: 修复致命问题**
```bash
# 添加description到YAML
cat > SKILL.md << 'EOF'
---
name: data-analyzer
description: >
  数据分析工具,支持Excel/CSV文件分析。Use when 需要分析数据字段、
  生成数据字典或验证数据质量。适用于: (1) 字段结构分析
  (2) 数据质量检查 (3) 统计报告生成 (4) 字段映射创建
---

# 数据分析器
...
EOF
````

**步骤2: 解决警告**

```bash
# 清理示例文件
rm scripts/example.py references/api_reference.md assets/example_asset.txt

# 为脚本添加文档字符串
cat >> scripts/process.py << 'EOF'
"""
数据处理脚本 - 分析Excel/CSV文件字段

用法: python process.py <input_file>
参数: input_file - 待分析的数据文件
"""
EOF
```

**步骤3: 实施建议**

```bash
# 添加快速开始章节
# 完善references文档
```

**步骤4: 重新检查**

```bash
python scripts/check_skill.py .
# 预期评分: 85-90分
```

---

## 📊 问题优先级矩阵

| 问题类型          | 影响 | 紧急度 | 修复难度 | 建议处理顺序 |
| ----------------- | ---- | ------ | -------- | ------------ |
| 缺少SKILL.md      | 致命 | 高     | 低       | 1️⃣           |
| YAML格式错误      | 致命 | 高     | 低       | 1️⃣           |
| Scripts语法错误   | 致命 | 高     | 中       | 1️⃣           |
| Description质量低 | 警告 | 中     | 低       | 2️⃣           |
| 失效文件引用      | 警告 | 中     | 低       | 2️⃣           |
| SKILL.md过长      | 警告 | 中     | 中       | 2️⃣           |
| 示例文件未清理    | 警告 | 低     | 低       | 3️⃣           |
| 缺少推荐章节      | 建议 | 低     | 低       | 3️⃣           |
| Scripts缺文档     | 建议 | 低     | 低       | 3️⃣           |

**处理原则:**
1️⃣ **立即修复**: 致命问题必须先解决
2️⃣ **尽快处理**: 警告会影响技能质量
3️⃣ **逐步优化**: 建议可以在后续版本改进
