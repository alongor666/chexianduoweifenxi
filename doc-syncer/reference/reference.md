# 参考资料与规则

> **作用**: doc-syncer skill 的核心参考资料,包含变更映射表和项目特定注意事项

**版本**: 2.1.0 (与 doc-syncer skill 同步)
**最后更新**: 2025-12-06
**状态**: ✅ 活跃使用
**关联文档**:
- [SKILL.md](../SKILL.md) - 文档同步智能助手主文档
- [sync-rules.md](./sync-rules.md) - 详细的同步规则
- [doc-registry.md](./doc-registry.md) - 文档注册表

---

## 变更影响范围映射表

根据代码变更类型，确定需要更新的文档：

| 变更类型 | 相关文档 |
|---------|---------|
| CSV 数据结构变更 | `开发文档/03_technical_design/data_architecture.md` |
| KPI 计算逻辑变更 | `开发文档/03_technical_design/core_calculations.md` |
| 新增/修改功能 | `开发文档/01_features/FXXX_功能名/` 对应功能文档 |
| 技术栈更新 | `开发文档/03_technical_design/tech_stack.md` |
| 架构调整 | `开发文档/03_technical_design/architecture_refactoring.md` |
| 维度字典更新 | `开发文档/03_technical_design/dimensions_dictionary.md` |
| 重大决策 | `开发文档/02_decisions/` 对应决策文档 |
| 阶段性总结 | `开发文档/03_technical_design/PHASE*_COMPLETION_REPORT.md` |

## 项目特定注意事项

### 文档目录结构
```
开发文档/
├── 00_conventions.md           # 文档约定
├── 01_features/                # 功能文档（F001-F014）
│   ├── F001_data_import/
│   ├── F002_kpi_dashboard/
│   └── ...
├── 02_decisions/               # 重大决策记录
├── 03_technical_design/        # 技术设计文档
│   ├── data_architecture.md    # 26字段CSV数据结构
│   ├── core_calculations.md    # 16个KPI计算公式
│   ├── tech_stack.md           # 技术栈
│   ├── dimensions_dictionary.md # 维度字典
│   └── architecture_refactoring.md
├── archive/                    # 历史归档文档
├── README.md                   # 总览文档
└── 开发记录表.md               # 开发记录
```

### 核心原则
1. **遵循 CLAUDE.md 的五条黄金法则**
   - 优先修改,而非新建
   - 小步快跑,持续验证
   - 文档同步,保持鲜活
   - 保持代码质量
   - 中文沟通

2. **数据架构优先**
   - CSV 数据结构（26字段）是唯一真实来源
   - 不存在 Prisma 或数据库层
   - 使用 LocalStorage 持久化

3. **KPI 计算核心**
   - 所有 KPI 计算逻辑必须与 `core_calculations.md` 一致
   - 16个KPI采用4x4网格布局
   - 支持50周工作制

4. **功能文档编号**
   - 使用 FXXX 格式（F001, F002, ...）
   - 每个功能独立目录
   - 包含 README.md 和测试记录

5. **版本标注**
   - 技术文档需标注版本号和状态
   - 状态标识: ✅ 现行标准 / 📝 草稿 / 🗄️ 已归档
   - 更新历史必须记录
