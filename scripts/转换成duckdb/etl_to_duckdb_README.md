# ETL 到 DuckDB 脚本说明（动态命名与年度导出）

## 功能概述
- 从指定目录批量读取 `.xlsx`/`.xls`/`.csv` 数据文件（按周分片）。
- 统一字段与数据类型，计算绝对值指标，载入到单一 DuckDB 数据库。
- 创建基础分析视图与索引，支持快速查询。
- 按保单年度导出年度明细 CSV，并基于规则进行“智能动态命名”。

## 动态命名规则
- 智能识别周序号：
  - 优先使用数据列（`week_number`/`周次`），如含多值取最大值作为“截至周”；
  - 若列缺失则从文件名识别，如“第50周”、“W50”、“week 50”等；
  - 若仍无法识别，默认周次为 40。
- 智能识别起保年度（`policy_start_year`）：
  - 自动解析为数值年份，用于导出年度文件（支持多年度）。
- 智能识别机构层级：
  - 若仅包含一个三级机构（`third_level_organization`），文件名使用该三级机构名称；
  - 若包含多个三级机构，文件名使用二级机构（`second_level_organization`），脚本默认统一为“四川”。
- 文件名示例：
  - `四川车险2025年保单变动成本明细_截至第50周.csv`
  - 注：文件名采用年度全称（如“2025年保单”），不再使用“25单”等简称，以避免误解。

## 使用方法
- 默认（输入：`实际数据/`，输出：`insurance_data.duckdb`）：
  - `python scripts/etl_to_duckdb.py`
- 指定输入、输出数据库，并开启年度导出（示例：导入 iCloud 目录数据，导出至项目 `outputs/`）：
  - ```
    python scripts/etl_to_duckdb.py \
      --input-dir "/Users/xuechenglong/Library/Mobile Documents/com~apple~CloudDocs/Desktop/GitHub多项目数据源/变率——转换后清单" \
      --output-db "/Users/xuechenglong/Documents/chexianduoweifenxi/outputs/insurance_data.duckdb" \
      --export-dir "/Users/xuechenglong/Documents/chexianduoweifenxi/outputs" \
      --export-years "2024,2025"
    ```

## 导出结果
- 按年度分别导出 CSV 至 `--export-dir` 指定目录，文件按上述动态规则命名：
  - 示例：`outputs/四川车险2024年保单变动成本明细_截至第50周.csv`
  - 示例：`outputs/四川车险2025年保单变动成本明细_截至第50周.csv`

## 备注
- 每一周更新的年累计数据：本导出为“年累计”数据的周度更新版本，文件名中的“截至第N周”表示该年度截至该周的累计。
- 汇报约束：请勿在汇报中再统计“签单保费”和“保单件数”的合计数据（脚本日志中保留技术统计用于开发调试，不用于业务汇报）。
- 若源数据缺少关键计算所需列（如：`满期净保费(万)`、`跟单保费(万)`等别名列），脚本将给出明确错误并终止，避免产生错误结果。
- 脚本自动为缺失的维度字段设置安全默认值，并统一 `second_level_organization` 为“四川”，以适配命名规则。
