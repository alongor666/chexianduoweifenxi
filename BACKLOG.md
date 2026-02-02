# BACKLOG

> 状态机：PROPOSED / TRIAGED / IN_PROGRESS / BLOCKED / DONE / DEPRECATED。新增需求先落这里，DONE 必须附佐证。

| ID | 提出时间 | 板块 | 归属对象 | 需求描述 | 优先级 | 状态 | 关联文档 | 关联代码 | 验收/证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SIMPLIFY-001 | 2026-01-05 | 代码质量 | 全代码库 | 极简化代码，保持功能完整性，识别冗余和可简化部分 | H | IN_PROGRESS | 开发文档/00_index/CODE_INDEX.md | src/* | 代码简化报告+功能验证 |
| ECC-001 | 2026-02-01 | 工程效率 | Claude配置 | 引入 everything-claude-code 组件（Hooks/Commands/Rules） | M | DONE | .claude/hooks/, .claude/commands/, .claude/rules/ | N/A | 见 PROGRESS 里程碑记录 |
| FBS-001 | 2026-02-02 | 架构 | 全代码库 | 前后端分离改造：规范化 API、精简 Store、创建业务 Hooks 层 | H | IN_PROGRESS | .claude/plans/前后端分离改造计划.md | src/app/api/v1/, src/lib/api/, src/hooks/api/ | 计划文档+功能验证 |
| TEMPLATE-001 | 2025-02-17 | 治理 | 工程平台 | 示例：完善治理脚本与索引 | M | PROPOSED | 开发文档/00_index/DOC_INDEX.md | N/A | 将此行复制修改，真实任务需补全 |
