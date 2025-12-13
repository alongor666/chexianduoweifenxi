# GitHub Copilot Instructions - 车险分析平台

## 当前状态

正在进行 Clean Architecture 重构。**必须先阅读 `PROJECT_STATUS.md`**。

## 核心规则

### 依赖方向（最重要）

```
Infrastructure → Application → Domain
```

- Domain 层：不能导入 React、不能调用 API
- Application 层：不能导入 UI 组件
- Infrastructure 层：可以导入其他层

### 代码规范

- 文件 < 300 行
- 函数 < 50 行
- 命名：`kebab-case.ts` / `PascalCase.tsx` / `camelCase()`

### 生成代码前检查

1. 属于哪一层？
2. 依赖方向正确吗？
3. 职责单一吗？

详见：`开发文档/ARCHITECTURE_RULES.md`
