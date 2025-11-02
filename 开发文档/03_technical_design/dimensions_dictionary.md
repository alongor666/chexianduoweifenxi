# 维度字典与枚举值（Insuralytics）

本文档汇总平台内所有可选维度及其对应的枚举值，作为代码与数据规范的统一参考。适用于：目标管理、筛选器系统、CSV 导入、统计分析模块。

- 单一事实来源（SoT）：`src/constants/dimensions.ts`（客户类别、业务类型）
- 规范参考：`开发文档/archive/CSV导入规范.md`（完整字段与枚举清单）
- 规范化策略：`normalizeChineseText` 与 `fuzzy-matcher.ts/ENUM_MAPPINGS`（同义词归一）

## 维度总览
- 时间维度：`snapshot_date`、`policy_start_year`、`week_number`
- 组织维度：`chengdu_branch`、`third_level_organization`
- 客户维度：`customer_category_3`
- 产品维度：`insurance_type`、`business_type_category`、`coverage_type`
- 业务属性：`renewal_status`、`is_new_energy_vehicle`、`is_transferred_vehicle`
- 评级维度：`vehicle_insurance_grade`、`highway_risk_grade`、`large_truck_score`、`small_truck_score`
- 渠道维度：`terminal_source`

## 枚举值定义（Canonical Sets）

### 组织维度
- `chengdu_branch`：成都 | 中支
- `third_level_organization`：本部 | 达州 | 德阳 | 高新 | 乐山 | 泸州 | 绵阳 | 南充 | 青羊 | 天府 | 武侯 | 新都 | 宜宾

### 客户维度
- `customer_category_3`（11）：
  - 非营业个人客车
  - 非营业货车
  - 非营业机关客车
  - 非营业企业客车
  - 挂车
  - 摩托车
  - 特种车
  - 营业城市公交
  - 营业出租租赁
  - 营业公路客运
  - 营业货车

### 产品维度
- `insurance_type`：商业险 | 交强险
- `business_type_category`（16）：
  - 10吨以上-普货
  - 10吨以上-牵引
  - 2-9吨营业货车
  - 2吨以下营业货车
  - 9-10吨营业货车
  - 出租车
  - 非营业货车旧车
  - 非营业货车新车
  - 非营业客车旧车非过户
  - 非营业客车旧车过户车
  - 非营业客车新车
  - 摩托车
  - 其他
  - 特种车
  - 网约车
  - 自卸
- `coverage_type`：主全 | 交三 | 单交

### 业务属性
- `renewal_status`：新保 | 续保 | 转保
- `is_new_energy_vehicle`：True | False
- `is_transferred_vehicle`：True | False

### 评级维度
- `vehicle_insurance_grade`：A | B | C | D | E | F | G | X
- `highway_risk_grade`：A | B | C | D | E | F | X
- `large_truck_score`：A | B | C | D | E | X
- `small_truck_score`：A | B | C | D | E | X

### 渠道维度
- `terminal_source`（8）：0101柜面 | 0106移动展业(App) | 0107B2B | 0110融合销售 | 0112AI出单 | 0201PC | 0202APP | 0301电销

## 代码关联与使用
- `src/constants/dimensions.ts`：
  - `CANONICAL_CUSTOMER_CATEGORIES`（客户类别，11项）
  - `CANONICAL_BUSINESS_TYPES`（业务类型，16项）
- `src/hooks/use-premium-targets.ts`：将客户类别与业务类型选项输出为上述 Canonical 集合；其他维度从数据中收集并标准化。
- `src/app/targets/page.tsx`：
  - 过滤实体列表与保存逻辑：非 Canonical 值不展示、不保存
  - CSV 导入校验：忽略非 Canonical 值并提示缺失标签

## 归一化与同义词
- 文本归一：`normalizeChineseText`（去除空白/变体统一）
- 同义词映射：`src/lib/fuzzy-matcher.ts/ENUM_MAPPINGS`
  - 示例：保险类型、险别组合、新续转状态等常见别名 → Canonical 值
- 建议：如需扩展同义词，请同时更新此文档与 `ENUM_MAPPINGS`

## 变更管理
- 如 Canonical 集合更新（新增/调整）：
  - 更新 `src/constants/dimensions.ts`
  - 同步更新本文件与 `CSV导入规范.md`
  - 若涉及 UI/解析逻辑，同步验证并更新相关模块文档

## 目标管理维度拆解
- 保险类型维度：
  - 目标拆解：按 `insurance_type`（商业险、交强险）分别设置年度目标；CSV 模板列：`insurance_type`, `target_wan`。
  - 结构均衡：页面展示险种合计与总体差额（万元），并自动计算周均/日均；用于结构均衡与产品配比。
  - UI位置：目标管理页 `src/app/targets/page.tsx` → 维度标签「保险类型」。
- 三级机构维度：
  - 目标拆解：按 `third_level_organization`（13个机构）设置年度目标；CSV 模板列：`third_level_organization`, `target_wan`。
  - 竞赛与追踪：保存后生成版本快照（时间戳标记），支持按版本回溯比较，便于竞赛与进度跟踪。
  - UI位置：目标管理页 `src/app/targets/page.tsx` → 维度标签「三级机构」。

注意事项：
- 规范值限制仅对「客户分类」「业务类型」执行（见 `CANONICAL_SETS`）；「保险类型」「三级机构」以数据源枚举为准（归一化后使用）。
- CSV 导入严格校验枚举值，详见 `开发文档/archive/CSV导入规范.md`。

## 参考与来源
- 规范来源：`开发文档/archive/CSV导入规范.md`
- 业务描述：`开发文档/archive/PRD-best.md`（筛选维度体系）
- 数据架构：`开发文档/03_technical_design/data_architecture.md`