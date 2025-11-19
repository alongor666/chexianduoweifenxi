# Subagents 快速参考

## 📋 一句话说明

| Subagent | 用途 | 常用命令示例 |
|----------|------|--------------|
| **insurance-data-analyst** | 车险数据分析 | 请insurance-data-analyst分析本周数据 |
| **python-data-engineer** | 数据处理优化 | 请python-data-engineer清洗CSV数据 |
| **plotly-visualization** | 可视化图表 | 请plotly-visualization创建仪表板 |
| **code-reviewer** | 代码审查 | 请code-reviewer审查这个文件 |
| **test-engineer** | 测试编写 | 请test-engineer写单元测试 |
| **debugger** | 问题调试 | 请debugger找出这个bug |

## 🎯 典型工作流

### 数据分析项目
```
1. python-data-engineer   → 数据清洗验证
2. insurance-data-analyst → KPI计算分析
3. plotly-visualization   → 创建仪表板
4. code-reviewer          → 代码审查优化
```

### 功能开发
```
1. [你编写代码]
2. test-engineer   → 编写测试
3. code-reviewer   → 代码审查
4. debugger        → 问题修复（如需要）
```

## ⚡ 快速命令

```bash
# 查看所有agents
ls .claude/agents/

# 测试agent是否可用（在Claude Code中）
请insurance-data-analyst介绍一下你的能力

# 查看详细说明
cat .claude/agents/README.md
```

## 💡 使用技巧

1. **明确任务**: 告诉agent具体要做什么
2. **提供上下文**: 给出文件路径、业务背景
3. **串联使用**: 复杂任务分解给多个agents
4. **专业分工**: 让每个agent做它最擅长的事

## 📦 已安装的Subagents

✅ insurance-data-analyst (2.2KB)
✅ python-data-engineer (4.8KB)
✅ plotly-visualization (3.0KB)
✅ code-reviewer (4.2KB)
✅ test-engineer (6.4KB)
✅ debugger (7.4KB)

总计: 6个专业subagents，27.8KB

---

现在你可以开始使用了！试试说："请insurance-data-analyst介绍一下你能做什么"
