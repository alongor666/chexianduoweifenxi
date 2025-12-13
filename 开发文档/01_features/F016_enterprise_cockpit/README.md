# F016: 企业驾驶舱 (Enterprise Cockpit)

## 概述
统一驾驶舱布局与可视化规范，提供业务健康快照与经营观察入口。替换旧版驾驶舱渲染为 `EnterpriseCockpit`，并接入统一的排序与阈值体系。

## 目标
- 统一 5 级阈值（卓越/优秀/健康/预警/危险）与颜色映射
- 所有图表遵循“最差 → 最好”排序
- 布局采用 16:9 页面主体框架，一行一个图，去网格线、文字加粗、值标签固定

## 布局结构
1. 第一行：核心 KPI（时间进度达成率-保费/件数、变动成本率、满期赔付率、费用率）
2. 第二行：统计指标（落后机构数量、风险机构数量、优秀机构数量、总机构数量）
3. 经营观察模块：
   - 时间进度分析（复用 KPI 行）
   - 成本风险分析（赔付分析条形图）
   - 业务健康度热力图
   - 多维健康度雷达
   - 动态条形图（保费分析）
   - 占比分析图（环形饼图）

## 技术实现
- 主组件：`src/components/features/enterprise-cockpit.tsx`
- 子组件：
  - `src/components/features/cockpit/kpi-metrics-row.tsx`
  - `src/components/features/cockpit/statistics-row.tsx`
  - `src/components/features/cockpit/business-observation/*`
  - 主页面集成：`src/components/dashboard-client.tsx`（在 `cockpit` 标签页渲染 `EnterpriseCockpit`）
- KPI卡片：`src/components/features/compact-kpi-card.tsx`（支持显示公式提示，公式口径来自《核心指标计算引擎 V2.0》）

## 统一规范接入
- 样式（0.1）：去网格线、文字加粗、预警线、X轴不倾斜、自动避让、值标签固定、气泡轴名称可见、16:9 主体框架
- 排序（0.2）：逆向指标（风险/成本类）高→低；正向指标（贡献/达成类）低→高
- 标题（0.3）：主色左对齐，副标题说明排序与口径

## 依赖与口径
- 阈值体系：`src/config/thresholds.ts`
- 排序工具：`src/utils/sorting.ts`
- 指标计算：Domain 层 `src/domain/rules/kpi-calculator-enhanced.ts`；Hook 层调用，不在组件内做业务计算

## 验收
- 视觉一致：所有图表遵循统一主题与构建器
- 排序一致：所有展示均遵循“最差 → 最好”
- 交互一致：兼容筛选器与时间多选，支持后续下钻联动

