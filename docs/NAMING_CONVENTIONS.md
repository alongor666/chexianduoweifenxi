# 命名规范

本规范定义 Claude Skills/AgentDB 相关的命名模式，确保目录结构与技能标识统一。

## "-cskill" 后缀
- 所有技能文件与导出名称应以 `-cskill` 结尾，例如 `math-cskill`、`summary-cskill`。
- 套件入口文件可使用 `*-suite` 命名，但子技能仍需 `-cskill` 后缀。

## 技能命名模式
- 采用 `功能-对象-cskill` 结构，如 `calc-number-cskill`、`fetch-policy-cskill`。
- 避免模糊词（如 smart、auto），使用动词 + 名词的清晰组合。
- 对需要权限的技能在名称中加入限定，如 `admin-sync-cskill`。

## 目录结构
```
skills/
  common/           # 共享工具与类型
  simple/           # 简单技能
  suites/           # 技能套件入口
  registry.ts       # 统一注册入口
```

## 最佳实践
- 在注册表中添加中文注释，说明技能用途、输入输出与依赖。
- 技能文件名与导出名称保持一致，便于搜索与替换。
- 版本升级时使用语义化标签（如 v2、v2.1），并在 CHANGELOG 中记录差异。
