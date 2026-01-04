# AGENTS.md

## 可读入口
- 文档导航：`开发文档/00_index/DOC_INDEX.md`
- 代码导航：`开发文档/00_index/CODE_INDEX.md`
- 进展导航：`开发文档/00_index/PROGRESS_INDEX.md`
- 需求与进展：`BACKLOG.md`、`PROGRESS.md`

## 必须回写
- 新增或调整需求：先在 BACKLOG 登记，按状态机推进并在 PROGRESS 留痕。
- 触达核心目录（src/domain、src/application、src/app、开发文档/03_technical_design、开发文档/01_features、开发文档/00_standards）时，如有新增入口需同步更新对应 INDEX.md 与 CODE/DOC 索引。
- DONE 前补齐：关联文档、关联代码（如适用）与验收/证据三要素。

## 禁止触碰
- 不改业务口径、数据字典与指标定义文件（如 `开发文档/03_technical_design/core_calculations.md`、`data_architecture.md`）。
- 不在 /src 下随意重构业务实现；仅可添加索引或路径登记。
- 不跳过治理校验：提交前必须运行 `node scripts/check-governance.mjs` 或等待 CI 通过。
