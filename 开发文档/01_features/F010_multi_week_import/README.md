# F010 - 多周同时导入功能

> **状态**: 🚧 开发中
> **优先级**: P0
> **版本**: v1.0.0
> **创建日期**: 2025-10-26

## 功能概述

多周同时导入功能增强了数据管理模块，支持一次性导入多个周的业管数据。该功能支持两种导入方式：多个CSV文件（每个文件包含一周或多周数据）和单个CSV文件包含多周数据，大幅提升数据导入效率和用户体验。

## 核心需求

### 1. 多文件导入支持

- ✅ 支持同时选择和上传多个CSV文件
- ✅ 每个文件可包含一个或多个周的数据
- ✅ 允许用户在上传前预览文件列表
- ✅ 支持上传前移除特定文件

### 2. 单文件多周支持

- ✅ 单个CSV文件可包含多个周的数据
- ✅ 自动检测文件中包含的周次范围
- ✅ 智能解析多周数据

### 3. 周次去重验证

- ✅ **禁止重复导入**: 检测数据库中已存在的周次
- ✅ **智能跳过**: 跳过已存在的周次，仅导入新周次数据
- ✅ **用户反馈**: 明确告知用户哪些周次被跳过，哪些被导入
- ✅ **详细报告**: 展示每个文件和每个周次的导入结果

### 4. 导入前验证

- ✅ 文件格式验证（CSV格式、字段完整性）
- ✅ 周次检测和冲突提示
- ✅ 数据量预估和性能提示
- ✅ 可视化展示待导入周次列表

### 5. 导入进度反馈

- ✅ 整体进度条显示
- ✅ 每个文件的处理状态
- ✅ 实时显示处理速度和预计剩余时间
- ✅ 错误和警告实时反馈

### 6. 导入结果统计

- ✅ 按文件统计：每个文件的成功/失败记录数
- ✅ 按周次统计：每个周次的导入状态
- ✅ 总体统计：总文件数、总记录数、成功/失败数
- ✅ 周次冲突详情：哪些周次被跳过及原因

### 7. 导入历史记录

- ✅ 永久保留所有导入记录
- ✅ 记录每次导入的文件名、周次范围、记录数
- ✅ 支持查看历史导入详情
- ✅ 时间线展示导入历史

## 功能特性

### 数据冲突处理策略

**策略**: 跳过重复周次，仅导入新周次

当用户尝试导入已存在的周次数据时：

1. 系统扫描待导入文件中的所有周次
2. 与数据库中已存在的周次进行对比
3. 自动跳过已存在的周次数据
4. 仅处理和保存新周次的数据
5. 在结果报告中明确列出：
   - 跳过的周次及数量
   - 成功导入的新周次及数量
   - 每个文件的处理详情

**示例场景**：

```
已有数据: 2025年 第1-10周
待导入: 文件A包含第8-12周，文件B包含第13-15周

处理结果:
- 文件A: 跳过第8-10周（已存在），导入第11-12周（新数据）
- 文件B: 导入第13-15周（全部为新数据）

最终数据: 2025年 第1-15周
```

### 用户界面增强

#### 1. 文件列表预览

- 显示所有已选择的文件
- 每个文件显示：文件名、大小、检测到的周次
- 支持单个文件移除
- 标注冲突周次（红色）和新周次（绿色）

#### 2. 导入前验证界面

```
┌─────────────────────────────────────┐
│ 📋 导入预览                          │
├─────────────────────────────────────┤
│ 📄 文件1.csv (2.5MB)                │
│    ✅ 新周次: 11, 12 (2周)          │
│    ⚠️  跳过: 8, 9, 10 (已存在)      │
│                                      │
│ 📄 文件2.csv (3.1MB)                │
│    ✅ 新周次: 13, 14, 15 (3周)      │
│                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│ 总计: 5个新周次，3个跳过             │
│ 预计导入: 约15,000条记录             │
└─────────────────────────────────────┘
```

#### 3. 导入进度界面

```
┌─────────────────────────────────────┐
│ 🔄 正在导入数据...                   │
├─────────────────────────────────────┤
│ 文件 1/2: 文件1.csv                  │
│ ████████████████░░░░ 80%            │
│                                      │
│ 整体进度: ████████░░░░░░░░ 40%      │
│                                      │
│ 速度: 1,200 记录/秒                  │
│ 剩余时间: 约8秒                      │
└─────────────────────────────────────┘
```

#### 4. 导入结果界面

```
┌─────────────────────────────────────┐
│ ✅ 导入完成                          │
├─────────────────────────────────────┤
│ 📊 总体统计                          │
│ • 成功导入: 5个周次 (15,234条记录)   │
│ • 跳过周次: 3个周次 (已存在)          │
│ • 失败: 0条记录                      │
│                                      │
│ 📋 详细结果                          │
│ ┌─ 文件1.csv                        │
│ │  ✅ 第11周: 2,345条                │
│ │  ✅ 第12周: 2,567条                │
│ │  ⚠️  第8-10周: 已跳过              │
│ │                                   │
│ └─ 文件2.csv                        │
│    ✅ 第13周: 3,112条                │
│    ✅ 第14周: 3,456条                │
│    ✅ 第15周: 3,754条                │
│                                      │
│ 🕐 导入时间: 2025-10-26 14:30:25    │
└─────────────────────────────────────┘
```

## 技术实现

### 核心文件结构

```
src/
├── lib/
│   ├── storage/
│   │   └── data-persistence.ts      # 添加周次去重逻辑
│   └── parsers/
│       └── csv-parser.ts            # 周次检测和提取
│
├── hooks/
│   └── use-file-upload.ts           # 增强多文件和周次验证
│
├── components/features/
│   ├── file-upload.tsx              # 文件列表预览和周次冲突提示
│   ├── upload-week-preview.tsx      # 新增：周次预览组件
│   ├── upload-results-detail.tsx    # 增强：周次级别结果展示
│   └── upload-history.tsx           # 增强：显示周次信息
│
└── types/
    └── upload.ts                    # 新增：上传相关类型定义
```

### 核心数据结构

#### WeekInfo - 周次信息

```typescript
interface WeekInfo {
  weekNumber: number // 周次号
  year: number // 年份
  recordCount: number // 该周记录数
  isConflict: boolean // 是否与已有数据冲突
  source: 'existing' | 'new' // 数据来源
}
```

#### FileWeekAnalysis - 文件周次分析

```typescript
interface FileWeekAnalysis {
  fileName: string // 文件名
  fileSize: number // 文件大小
  detectedWeeks: WeekInfo[] // 检测到的周次
  newWeeks: WeekInfo[] // 新周次（将被导入）
  conflictWeeks: WeekInfo[] // 冲突周次（将被跳过）
  estimatedRecords: number // 预计记录数
}
```

#### WeekImportResult - 周次导入结果

```typescript
interface WeekImportResult {
  weekNumber: number // 周次号
  year: number // 年份
  status: 'success' | 'skipped' | 'failed' // 导入状态
  recordCount: number // 导入的记录数
  error?: string // 错误信息（如有）
  skipReason?: string // 跳过原因（如有）
}
```

#### EnhancedBatchUploadResult - 增强的批量导入结果

```typescript
interface EnhancedBatchUploadResult extends BatchUploadResult {
  weekAnalysis: {
    totalWeeks: number // 总周次数
    newWeeks: number // 新导入周次数
    skippedWeeks: number // 跳过的周次数
    weekResults: WeekImportResult[] // 每个周次的详细结果
  }
  fileResults: {
    fileName: string
    weekResults: WeekImportResult[] // 该文件的周次结果
  }[]
}
```

### 核心算法

#### 1. 周次检测算法

```typescript
/**
 * 从CSV文件中检测所有周次
 * @param file CSV文件
 * @returns 检测到的周次列表
 */
async function detectWeeksInFile(file: File): Promise<WeekInfo[]> {
  const records = await parseCSVFile(file)

  // 按周次分组统计
  const weekMap = new Map<string, WeekInfo>()

  records.data.forEach(record => {
    const key = `${record.policy_start_year}-${record.week_number}`

    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekNumber: record.week_number,
        year: record.policy_start_year,
        recordCount: 0,
        isConflict: false,
        source: 'new',
      })
    }

    const weekInfo = weekMap.get(key)!
    weekInfo.recordCount++
  })

  return Array.from(weekMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.weekNumber - b.weekNumber
  })
}
```

#### 2. 周次冲突检测算法

```typescript
/**
 * 检测周次冲突
 * @param detectedWeeks 待导入的周次
 * @param existingData 已有数据
 * @returns 分析结果（新周次和冲突周次）
 */
function analyzeWeekConflicts(
  detectedWeeks: WeekInfo[],
  existingData: InsuranceRecord[]
): { newWeeks: WeekInfo[]; conflictWeeks: WeekInfo[] } {
  // 提取已有数据中的周次
  const existingWeeks = new Set<string>()
  existingData.forEach(record => {
    const key = `${record.policy_start_year}-${record.week_number}`
    existingWeeks.add(key)
  })

  const newWeeks: WeekInfo[] = []
  const conflictWeeks: WeekInfo[] = []

  detectedWeeks.forEach(week => {
    const key = `${week.year}-${week.weekNumber}`

    if (existingWeeks.has(key)) {
      conflictWeeks.push({ ...week, isConflict: true, source: 'existing' })
    } else {
      newWeeks.push({ ...week, isConflict: false, source: 'new' })
    }
  })

  return { newWeeks, conflictWeeks }
}
```

#### 3. 按周次过滤导入数据算法

```typescript
/**
 * 过滤出新周次的数据
 * @param records 所有解析的记录
 * @param newWeeks 允许导入的新周次列表
 * @returns 过滤后的记录
 */
function filterRecordsByNewWeeks(
  records: InsuranceRecord[],
  newWeeks: WeekInfo[]
): InsuranceRecord[] {
  const allowedWeeks = new Set<string>()
  newWeeks.forEach(week => {
    const key = `${week.year}-${week.weekNumber}`
    allowedWeeks.add(key)
  })

  return records.filter(record => {
    const key = `${record.policy_start_year}-${record.week_number}`
    return allowedWeeks.has(key)
  })
}
```

### 存储增强

#### UploadHistoryRecord 扩展

```typescript
interface EnhancedUploadHistoryRecord extends UploadHistoryRecord {
  weekInfo: {
    totalWeeks: number // 总周次数
    newWeeks: number[] // 新导入的周次号列表
    skippedWeeks: number[] // 跳过的周次号列表
    yearRange: number[] // 年份范围
  }
  files: Array<{
    name: string
    size: number
    hash: string
    weekRange: string // 例如: "2025年第11-12周"
    newWeekCount: number // 新导入周次数
    skippedWeekCount: number // 跳过周次数
    recordCount: number
    validRecords: number
    invalidRecords: number
  }>
}
```

## 用户流程

### 标准导入流程

```
1. 用户选择文件
   ↓
2. 系统检测每个文件中的周次
   ↓
3. 系统与已有数据对比，识别冲突
   ↓
4. 显示预览界面
   • 列出所有文件和检测到的周次
   • 标注新周次（绿色）和冲突周次（黄色）
   • 显示预计导入统计
   ↓
5. 用户确认或调整
   • 可以移除某些文件
   • 查看详细的周次信息
   ↓
6. 开始导入
   • 显示进度条
   • 实时更新处理状态
   ↓
7. 显示结果
   • 按文件和周次展示详细结果
   • 显示总体统计
   • 提供导出报告选项
   ↓
8. 记录历史
   • 永久保存导入记录
   • 包含周次信息
```

### 冲突处理流程

```
场景: 用户导入包含已存在周次的文件

1. 文件分析阶段
   系统检测到文件包含第8-12周
   已有数据包含第1-10周

2. 冲突识别
   • 冲突周次: 第8、9、10周
   • 新周次: 第11、12周

3. 用户提示
   ⚠️ 检测到周次冲突

   文件: data.csv
   • 将跳过: 第8、9、10周 (已存在)
   • 将导入: 第11、12周 (新数据)

   是否继续导入?
   [继续] [取消]

4. 导入执行
   仅导入第11、12周的数据

5. 结果反馈
   ✅ 导入完成
   • 成功导入: 第11、12周 (5,912条记录)
   • 跳过: 第8、9、10周 (已存在)
```

## UI/UX 优化点

### 1. 视觉设计

- **颜色编码**:
  - 绿色 - 新周次，可导入
  - 黄色 - 冲突周次，将跳过
  - 灰色 - 已处理完成
  - 红色 - 错误或失败

- **图标使用**:
  - ✅ 成功/可导入
  - ⚠️ 警告/冲突
  - ❌ 错误/失败
  - 🔄 处理中
  - 📊 统计信息
  - 📁 文件
  - 📅 周次

### 2. 交互优化

- **拖拽支持**: 继续支持拖拽上传多个文件
- **即时反馈**: 文件选择后立即显示周次检测结果
- **可撤销操作**: 上传前可随时移除文件
- **批量操作**: 一键清除所有文件、一键选择推荐操作

### 3. 信息展示

- **分组展示**: 按文件分组显示周次
- **时间线视图**: 在导入历史中使用时间线布局
- **统计卡片**: 使用卡片式布局展示关键统计数据
- **工具提示**: 关键操作提供工具提示说明

## 性能优化

### 1. 大文件处理

- 使用 Web Workers 进行 CSV 解析
- 流式处理，避免内存溢出
- 分批次导入数据

### 2. 周次检测优化

- 早期终止：如果文件中所有周次都是新的，提前结束检测
- 增量检测：只检测必要的行数（采样检测）
- 缓存检测结果：避免重复检测同一文件

### 3. UI 响应性

- 虚拟滚动：大量文件时使用虚拟滚动
- 懒加载：按需加载详细信息
- 防抖处理：用户操作的防抖处理

## 错误处理

### 1. 文件格式错误

```
❌ 文件格式错误

文件: invalid.csv
问题: 缺少必需字段 'week_number'

建议: 请使用标准格式的CSV文件
[查看CSV格式要求] [重新选择文件]
```

### 2. 周次数据异常

```
⚠️ 周次数据异常

文件: data.csv
问题: 检测到周次号 > 53

详情:
• 第55周: 123条记录 (无效周次)
• 第56周: 89条记录 (无效周次)

这些数据将被跳过，是否继续?
[继续] [取消]
```

### 3. 导入部分失败

```
⚠️ 部分导入成功

文件1.csv: ✅ 成功 (3,456条)
文件2.csv: ❌ 失败 - 文件损坏
文件3.csv: ✅ 成功 (2,789条)

成功导入: 2个文件, 6,245条记录
失败: 1个文件

[查看详情] [重试失败文件] [完成]
```

## 测试计划

### 1. 单元测试

- [ ] 周次检测算法
- [ ] 冲突识别算法
- [ ] 数据过滤算法
- [ ] 哈希计算函数

### 2. 集成测试

- [ ] 多文件上传流程
- [ ] 周次去重完整流程
- [ ] 导入历史记录功能
- [ ] 错误处理流程

### 3. 端到端测试

- [ ] 用户完整导入流程
- [ ] 冲突处理场景
- [ ] 大文件导入性能
- [ ] 边界情况处理

### 4. 测试场景

| 场景         | 输入                                  | 预期结果             |
| ------------ | ------------------------------------- | -------------------- |
| 单文件单周   | 1个文件，第1周                        | 成功导入第1周        |
| 单文件多周   | 1个文件，第1-5周                      | 成功导入第1-5周      |
| 多文件无冲突 | 文件A(1-5周), 文件B(6-10周)           | 全部导入             |
| 多文件有冲突 | 文件A(1-5周), 文件B(4-8周), 已有1-5周 | 导入6-8周，跳过1-5周 |
| 全部冲突     | 所有周次已存在                        | 全部跳过，友好提示   |
| 大文件       | 100MB+ 文件                           | 流式处理，成功导入   |
| 格式错误     | 缺少字段                              | 明确错误提示         |

## 未来扩展

### 1. 高级去重策略

- 支持基于数据内容的智能去重
- 提供"覆盖"选项（谨慎使用）
- 数据版本管理和回滚

### 2. 数据合并

- 支持部分周次数据的增量更新
- 智能识别新增记录 vs 更新记录

### 3. 批量操作

- 支持拖拽排序文件导入顺序
- 批量下载导入报告
- 导入模板管理

### 4. 性能监控

- 导入性能指标收集
- 可视化性能报告
- 优化建议

## 相关文档

- [F001 - 数据上传与解析模块](../F001_data_import/README.md)
- [F008 - 数据持久化与上传历史模块](../F008_data_persistence/README.md)
- [数据架构设计](../../03_technical_design/data_architecture.md)
- [CSV解析策略](../../02_decisions/ADR-002_CSV解析策略-流式处理.md)

## 更新日志

### v1.0.0 (2025-10-26)

- 初始版本
- 完整的功能规格定义
- 技术实现方案设计
- UI/UX 优化方案
