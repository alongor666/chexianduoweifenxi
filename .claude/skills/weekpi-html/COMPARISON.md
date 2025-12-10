# weekpi-html vs insurance-weekly-report

## 技能对比

### 共同点

| 特性 | weekpi-html | insurance-weekly-report |
|------|-------------|------------------------|
| **数据源** | ✅ Excel/CSV/JSON/DuckDB | ✅ Excel/CSV/JSON/DuckDB |
| **必需字段** | ✅ 完全相同 | ✅ 完全相同 |
| **KPI计算** | ✅ 公式一致 | ✅ 公式一致 |
| **配置文件** | ✅ 共享格式 | ✅ 共享格式 |
| **麦肯锡风格** | ✅ 一致 | ✅ 一致 |
| **双维度分析** | ✅ 机构+客户类别 | ✅ 机构+客户类别 |

### 核心差异

| 特性 | weekpi-html | insurance-weekly-report |
|------|-------------|------------------------|
| **输出格式** | HTML网页 | PowerPoint PPT |
| **交互性** | ✅ 高度交互 | ❌ 静态展示 |
| **标签切换** | ✅ 支持 | ❌ 不支持 |
| **下钻分析** | ✅ 动态切换 | ⚠️ 固定页面 |
| **图表缩放** | ✅ 支持 | ❌ 不支持 |
| **移动端适配** | ✅ 响应式布局 | ❌ 固定尺寸 |
| **部署方式** | 单文件/本地 | 文件分发 |
| **数据更新** | 需重新生成 | 需重新生成 |
| **离线使用** | ⚠️ 需CDN | ✅ 完全离线 |
| **打印输出** | ⚠️ 浏览器打印 | ✅ 原生PPT |
| **编辑修改** | ❌ 代码级 | ✅ PPT编辑 |

## 使用场景推荐

### 使用 weekpi-html 的场景

✅ **在线展示和探索**
- 董事会会议前的预览和探索
- 团队内部快速查看和讨论
- 需要动态切换不同维度的数据分析

✅ **自助式分析**
- 用户需要自行切换机构/客户类别
- 需要通过交互探索数据趋势
- 多人协作查看（共享HTML链接）

✅ **移动端查看**
- 需要在平板/手机上查看报告
- 出差期间快速查看数据

✅ **快速迭代**
- 数据频繁更新，需要快速重新生成
- 需要快速验证数据质量

### 使用 insurance-weekly-report 的场景

✅ **正式汇报**
- 董事会正式会议演示
- 需要打印成纸质报告
- 需要添加注释和备注

✅ **离线分发**
- 需要完全离线使用（无网络环境）
- 需要通过邮件分发给多人
- 需要归档和长期保存

✅ **二次编辑**
- 需要在PPT中添加自定义内容
- 需要调整图表样式和布局
- 需要合并到其他PPT中

✅ **标准化报告**
- 需要严格遵循PPT模板规范
- 需要统一的打印输出格式
- 需要嵌入公司Logo和品牌元素

## 工作流集成

### 推荐工作流

```
数据收集
  ↓
生成HTML（weekpi-html）→ 在线预览和探索 → 发现问题
  ↓                                          ↓
确认无误                                  修正数据
  ↓                                          ↓
生成PPT（insurance-weekly-report）→ 正式汇报
  ↓
归档保存
```

### 具体步骤

1. **周五下午**: 收集本周数据
2. **生成HTML**: 使用 weekpi-html 快速生成网页版
3. **团队预览**: 分享HTML链接,团队成员在线查看
4. **问题发现**: 通过交互式图表发现数据异常
5. **数据修正**: 修正发现的问题
6. **生成PPT**: 使用 insurance-weekly-report 生成正式PPT
7. **会议汇报**: 使用PPT进行董事会汇报
8. **归档**: 保存PPT到文档库

## 技术架构对比

### weekpi-html

```
数据文件 (.xlsx/.csv/.json/.db)
  ↓
Python脚本 (generate_html_dashboard.py)
  ↓
数据处理 (pandas + numpy)
  ↓
HTML模板渲染 (内嵌或Jinja2)
  ↓
单文件HTML输出
  ↓
浏览器渲染 (ECharts CDN)
```

### insurance-weekly-report

```
数据文件 (.xlsx/.csv/.json/.db)
  ↓
Python脚本 (generate_report.py)
  ↓
数据处理 (pandas + numpy)
  ↓
PPT生成 (python-pptx)
  ↓
图表绘制 (matplotlib)
  ↓
PowerPoint文件输出 (.pptx)
```

## 性能对比

| 指标 | weekpi-html | insurance-weekly-report |
|------|-------------|------------------------|
| **生成速度** | ~5秒 | ~15秒 |
| **文件大小** | ~100KB | ~2MB |
| **打开速度** | 瞬间（浏览器） | ~2秒（PowerPoint） |
| **内存占用** | 浏览器标签 | PowerPoint进程 |

## 数据一致性验证

两个技能使用相同的:
- ✅ 数据读取逻辑
- ✅ KPI 计算公式
- ✅ 聚合方法
- ✅ 阈值配置

**验证方法**:
```bash
# 使用相同数据生成两种报告
python generate_html_dashboard.py data.xlsx 49 四川分公司 ../references
python generate_report.py data.xlsx 49 四川分公司 ../references

# 对比核心指标
# HTML中的签单保费、变动成本率等应与PPT完全一致
```

## 未来规划

### weekpi-html v1.1 计划
- [ ] 多周数据对比（趋势图）
- [ ] 一键导出所有图表
- [ ] 离线版本（内嵌ECharts）
- [ ] 自定义主题配色
- [ ] 数据筛选器

### insurance-weekly-report v2.2 计划
- [ ] 图表交互元素（PPT动画）
- [ ] 自动生成演讲备注
- [ ] 多机构对比页
- [ ] 行业对标分析

## 总结

| 用途 | 推荐技能 |
|------|---------|
| 快速预览 | weekpi-html |
| 交互探索 | weekpi-html |
| 移动查看 | weekpi-html |
| 正式汇报 | insurance-weekly-report |
| 打印输出 | insurance-weekly-report |
| 离线分发 | insurance-weekly-report |

**最佳实践**: 两个技能配合使用,先用 HTML 探索,再用 PPT 汇报。
