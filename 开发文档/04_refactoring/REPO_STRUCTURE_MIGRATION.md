# 仓库结构治理与迁移跟踪（Repo Structure Migration）

> **目标**：建立稳定、单一事实来源的顶层结构（文档/脚本/配置/工具），在不破坏现有使用的前提下渐进收敛。
>
> **最高原则**：任何迁移必须可追踪、可验证、可回滚；链接与入口不得“悄悄失效”。

---

## 0. 范围与不变量

### 本轮范围（Step 1）

- 清理顶层 `docs/`：删除过时/重复/与项目无关内容
- 将 `docs/` 中“更符合现状且有价值”的内容并入 `开发文档/`（优先合入既有文档）
- 迁移后全仓不得再依赖 `docs/` 作为文档入口

### 不变量（必须满足）

- `开发文档/` 是唯一权威文档库入口
- 删除/迁移后：
  - 关键入口文档可被定位（从 `开发文档/KNOWLEDGE_INDEX.md` 与根 `README.md`）
  - 仓库内不再出现面向“当前使用”的 `docs/` 链接（历史归档除外）

---

## 1. docs/ 迁移映射表

| 原路径 | 处理 | 目标/替代 | 说明 |
|---|---|---|---|
| `docs/GITHUB_PAGES_DEPLOYMENT.md` | 合并后删除 | `开发文档/03_technical_design/static_deployment.md` | 合并 GitHub Pages 路径配置与排查要点 |
| `docs/CODE_QUALITY_GUIDELINES.md` | 合并后删除 | `开发文档/00_conventions.md` | 合并“禁止规避式修复 + 强制验证链”准则 |
| `docs/DATA_SYNC_FIX.md` | 提炼后删除 | `开发文档/archive/问题记录表.md` | 以 Issue 形式记录已解决问题与代码证据 |
| `docs/NAMING_CONVENTIONS.md` | 删除 | （无） | 内容与本项目无关（Claude Skills/AgentDB） |
| `docs/PIPELINE_ARCHITECTURE.md` | 删除 | （无） | 内容与本项目无关（Claude Skills/AgentDB） |
| `docs/QUICK_VERIFICATION_GUIDE.md` | 删除 | （无） | 内容与本项目无关（AgentDB CLI） |
| `docs/INTERNAL_FLOW_ANALYSIS.md` | 删除 | （无） | 内容与本项目无关（AgentDB） |
| `docs/DECISION_LOGIC.md` | 删除 | （无） | 内容与本项目无关（技能/流水线决策） |
| `docs/TRY_IT_YOURSELF.md` | 删除 | （无） | 内容与本项目无关（AgentDB） |
| `docs/MIGRATION_PROGRESS.md` | 删除 | （无） | 与现有重构文档体系重复且包含无关内容 |
| `docs/DEVELOPMENT_PROGRESS_SUMMARY.md` | 删除 | （无） | 与现有重构文档体系重复且包含不一致信息 |
| `docs/ARCHITECTURE_REFACTORING_SUMMARY.md` | 删除 | （无） | 与 `开发文档/03_technical_design/architecture_refactoring.md` 重复 |
| `docs/CHANGELOG.md` | 删除 | （无） | 混入无关系统（AgentDB）版本信息，不作为权威记录 |
| `docs/LEARNING_VERIFICATION_REPORT.md` | 删除 | （无） | 内容与本项目无关（AgentDB 学习验证） |
| `docs/CLAUDE_SKILLS_ARCHITECTURE.md` | 删除 | （无） | 内容与本项目无关 |
| `docs/README.md` | 删除 | （无） | 过时副本，会误导入口；根入口以仓库 `README.md` 与 `开发文档/README.md` 为准 |
| `docs/保费目标占比与条形图.html` | 删除 | （无） | 未被引用的临时产物 |
| `docs/测试.html` | 删除 | （无） | 未被引用的临时产物 |

---

## 2. 验收清单（docs/ 清理后必须通过）

### 文档一致性

- `pnpm docs:index` 可成功生成索引
- `开发文档/KNOWLEDGE_INDEX.md` 中不存在 `docs/` 作为当前入口的链接

### 引用扫描（手动/脚本）

- 全仓搜索 `docs/`：除 `开发文档/archive/**` 之外不应再出现面向“当前使用”的引用

---

## 3. 复发预防（顶层设计约束）

### 文档

- 只允许一个“权威文档根”：`开发文档/`
- 任何临时总结/实验记录必须进入 `开发文档/archive/` 或对应功能卡片目录，禁止新建第二套 `docs/` 入口

### 脚本与工具（后续步骤执行）

- `scripts/` 为唯一可执行入口（被 `package.json` 与 CI 调用）
- `tools/` 仅允许一次性调试/实验；禁止与 `scripts/` 同名/同功能重复

### 配置（后续步骤执行）

- 优先回归框架默认入口（根目录 `next.config.mjs` / `tsconfig.json` / `playwright.config.ts` / `vitest.config.*`）
- 若保留 `configs/`，则根目录不得出现同名配置文件，保持单一事实来源

