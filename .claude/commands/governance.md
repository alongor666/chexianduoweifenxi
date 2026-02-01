---
description: 运行项目治理检查，验证护栏规则遵守情况
---

# 治理检查命令 (/governance)

运行项目治理检查脚本，确保遵守 CLAUDE.md 中定义的护栏规则。

## 用法

```
/governance [选项]
```

## 参数

- `--fix` - 自动修复可修复的问题
- `--verbose` - 显示详细检查过程
- `--report` - 生成检查报告文件

## 快速启动

```
/governance           # 运行标准检查
/governance --fix     # 检查并自动修复
/governance --verbose # 详细输出
```

## 检查项目

### 1. 护栏规则检查

- [ ] 核心业务文档未被非法修改
  - `开发文档/03_technical_design/core_calculations.md`
  - `开发文档/03_technical_design/data_architecture.md`
- [ ] 仅追加操作有证据支持

### 2. 索引一致性检查

- [ ] `DOC_INDEX.md` 与实际文档同步
- [ ] `CODE_INDEX.md` 与实际代码同步
- [ ] `PROGRESS_INDEX.md` 有最新记录
- [ ] 各 `INDEX.md` 与父目录文件列表一致

### 3. 状态机检查

- [ ] BACKLOG 中的状态仅使用允许值:
  - PROPOSED / TRIAGED / IN_PROGRESS / BLOCKED / DONE / DEPRECATED
- [ ] DONE 状态有完整验收证据

### 4. 核心目录变更检查

- [ ] 核心目录变更已在 BACKLOG 登记:
  - `src/domain/`
  - `src/application/`
  - `src/app/`
- [ ] 对应的 INDEX.md 已更新

## 输出示例

```
治理检查结果
============

护栏规则:    ✓ 通过
索引一致性:  ✓ 通过
状态机:      ✓ 通过
核心目录:    ⚠ 1 个警告

警告:
- src/domain/rules/kpi-calculator.ts 有变更
  建议: 确认已在 BACKLOG 登记

总体结果: 通过 (1 警告)
```

## 执行的脚本

```bash
node scripts/check-governance.mjs
```

## CI 集成

此检查在 PR/Push 时自动执行。本地运行可提前发现问题。

## 参考

- 护栏定义: `CLAUDE.md`
- 治理脚本: `scripts/check-governance.mjs`
- 文档索引: `开发文档/00_index/DOC_INDEX.md`
- 代码索引: `开发文档/00_index/CODE_INDEX.md`
