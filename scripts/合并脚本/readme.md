# 实际数据合并与清洗脚本

将 `实际数据/` 目录下的周度明细 CSV 合并为单一 CSV，并进行必要清洗，使其满足项目的 CSV 上传规范。

## 入口与用法

- 脚本：`scripts/合并脚本/merge_actual_data_to_csv.py`
- 默认执行（输入：`实际数据/`；输出：`outputs/`）：
  - `python3 "scripts/合并脚本/merge_actual_data_to_csv.py"`
- 兼容模式（输出移除 `second_level_organization` 列）：
  - `python3 "scripts/合并脚本/merge_actual_data_to_csv.py" --drop-second-level-organization`
- 指定路径：
  - `python3 "scripts/合并脚本/merge_actual_data_to_csv.py" --input-dir "实际数据" --output-csv "outputs/actual_data_clean.csv"`

## 输出说明

- `outputs/actual_data_merged_clean.csv`：清洗后的合并文件（默认）
- `outputs/actual_data_invalid_rows.csv`：被剔除的行与原因（默认；若无无效行则仅保留表头）

## 本地校验（推荐）

使用与上传口径一致的轻量校验脚本验证输出文件：

- `node "scripts/test_upload.js" "outputs/actual_data_merged_clean.csv"`

## 清洗规则（概要）

- 编码与文本：读取 `utf-8-sig`（去 BOM），移除零宽字符/全角空格，合并多余空白。
- 枚举值：对常见兼容值做映射（例如 `insurance_type=商业保险 → 商业险`）。
- 日期/布尔/数值：规范化为项目要求的格式（`YYYY-MM-DD`、`True/False`、无千分位数字）。
- 规则一致性：与项目数据规范保持一致（例如 `reported_claim_payment_yuan` 允许为负数）。

## 相关文档索引

- 数据结构与上传规范：`../../开发文档/03_technical_design/data_architecture.md`
- CSV 解析策略（ADR）：`../../开发文档/02_decisions/ADR-002_CSV解析策略-流式处理.md`
- DuckDB 校验指南（如需落库验证）：`../../开发文档/03_technical_design/duckdb_validation_guide.md`

