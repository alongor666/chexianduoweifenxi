# AI 协作导航 (CLAUDE.md)

## 必经入口
- 文档总览：[开发文档/00_index/DOC_INDEX.md](开发文档/00_index/DOC_INDEX.md)
- 代码入口：[开发文档/00_index/CODE_INDEX.md](开发文档/00_index/CODE_INDEX.md)
- 进展入口：[开发文档/00_index/PROGRESS_INDEX.md](开发文档/00_index/PROGRESS_INDEX.md)
- 需求台账：[BACKLOG.md](BACKLOG.md)
- 进展记录：[PROGRESS.md](PROGRESS.md)

## 护栏
- 禁改业务口径与数据字典：`开发文档/03_technical_design/core_calculations.md`、`开发文档/03_technical_design/data_architecture.md` 等仅可追加且需证据。
- 禁随意改动 /src 业务实现；如需触达核心目录（domain/application/app），必须先更新索引路径并在 BACKLOG 登记。
- 状态机固定：PROPOSED / TRIAGED / IN_PROGRESS / BLOCKED / DONE / DEPRECATED；DONE 必须提供文档、代码（如适用）与验收证据。

## 交付协议
- 任何新增需求、缺陷或文档工作先写入 BACKLOG，再按状态机推进并在 PROGRESS 留痕。
- 涉及核心层目录或关键文档的改动：同步更新对应 INDEX.md，并保持与 DOC_INDEX/CODE_INDEX 互链。
- 提交前运行治理校验：`node scripts/check-governance.mjs`（CI 会在 PR/Push 自动执行）。
