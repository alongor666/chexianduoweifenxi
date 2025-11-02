# F012 - 数据源选择功能

## 功能概述

支持用户自由选择数据来源，实现 Supabase 云数据库和本地 CSV 文件两种数据源模式的无缝切换。

## 功能特性

### 1. 双数据源支持
- **Supabase 模式**: 从云数据库自动加载数据
- **本地模式**: 仅使用 CSV 文件上传的数据（默认）

### 2. 优雅降级
- Supabase 连接失败时自动降级到本地模式
- 不会因数据库配置问题导致应用无法启动
- 提供清晰的数据源指示器

### 3. 环境变量配置
通过 `.env.local` 文件轻松切换数据源:

```bash
# 数据来源配置
# 可选值: 'supabase' | 'local'
NEXT_PUBLIC_DATA_SOURCE=local

# Supabase 配置 (仅当 DATA_SOURCE=supabase 时需要)
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 技术实现

### 修改的文件

1. **[.env.example](.env.example)** - 新增
   - 提供环境变量配置示例
   - 说明数据源选项和 Supabase 配置

2. **[src/lib/supabase/client.ts](src/lib/supabase/client.ts:1-21)**
   - 添加数据源检测逻辑
   - Supabase 客户端条件初始化
   - 导出 `isSupabaseEnabled` 和 `getDataSource()` 工具函数

3. **[src/services/DataService.ts](src/services/DataService.ts:26-60)**
   - `fetchAllData()` 方法支持数据源判断
   - 本地模式返回空数组，不尝试连接数据库
   - Supabase 模式失败时不抛出错误，而是返回空数组

4. **[src/app/page.tsx](src/app/page.tsx:11-31)**
   - 移除强制 Supabase 连接逻辑
   - 根据数据源配置条件加载数据
   - 即使无初始数据也正常渲染页面

5. **[src/components/dashboard-client.tsx](src/components/dashboard-client.tsx:62-66,179-191)**
   - 添加数据源指示器
   - 显示当前使用的数据模式（Supabase/本地）

### 关键代码

#### 数据源检测
```typescript
// src/lib/supabase/client.ts
const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'local'
export const isSupabaseEnabled = dataSource === 'supabase' && !!supabaseUrl && !!supabaseAnonKey

export function getDataSource(): 'supabase' | 'local' {
  return isSupabaseEnabled ? 'supabase' : 'local'
}
```

#### 条件数据加载
```typescript
// src/app/page.tsx
const dataSource = getDataSource()

if (dataSource === 'supabase') {
  try {
    initialData = await DataService.fetchAllData()
  } catch (e) {
    console.warn('[HomePage] Supabase 数据获取失败，降级到本地模式:', e)
    initialData = []
  }
} else {
  console.log('[HomePage] 当前使用本地数据模式')
}
```

## 使用方式

### 本地模式（默认）

1. 创建 `.env.local` 文件:
   ```bash
   NEXT_PUBLIC_DATA_SOURCE=local
   ```

2. 启动应用:
   ```bash
   pnpm dev
   ```

3. 通过 "导入导出" 页面上传 CSV 文件

### Supabase 模式

1. 配置 `.env.local`:
   ```bash
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. 确保 Supabase 中有 `fact_insurance_cost` 表

3. 启动应用，数据将自动从数据库加载

## UI 变化

### 数据源指示器
在页面标题下方显示当前数据模式:
- **本地模式**: 蓝色图标 + "本地模式"
- **Supabase**: 绿色图标 + "Supabase"

### 落地页改进
- 移除了数据库连接失败的错误页面
- 即使没有数据也能正常进入应用
- 用户可以直接上传 CSV 文件开始使用

## 测试场景

### 场景 1: 纯本地模式
- ✅ 配置 `DATA_SOURCE=local`
- ✅ 应用正常启动
- ✅ 显示 "本地模式" 指示器
- ✅ 可以上传 CSV 文件

### 场景 2: Supabase 模式（正常）
- ✅ 配置 `DATA_SOURCE=supabase` 和有效凭证
- ✅ 应用启动时自动加载数据
- ✅ 显示 "Supabase" 指示器

### 场景 3: Supabase 模式（连接失败）
- ✅ 配置 `DATA_SOURCE=supabase` 但凭证无效
- ✅ 应用正常启动（不崩溃）
- ✅ 自动降级到本地模式
- ✅ 控制台显示警告信息
- ✅ 用户可以上传 CSV 文件

### 场景 4: 未配置环境变量
- ✅ 默认使用本地模式
- ✅ 应用正常运行

## 兼容性

- ✅ 与现有的数据持久化机制完全兼容
- ✅ 与 CSV 上传功能无缝集成
- ✅ 不影响现有的筛选器和 KPI 计算
- ✅ 支持混合模式（Supabase 初始数据 + CSV 追加数据）

## 优势

1. **灵活性**: 用户可以根据需求选择数据源
2. **可靠性**: Supabase 故障不影响应用可用性
3. **易用性**: 默认本地模式，零配置即可使用
4. **透明性**: 清晰的数据源指示器，用户知道当前模式
5. **向后兼容**: 不破坏现有功能，平滑升级

## 后续优化

1. 添加 UI 切换按钮，支持运行时切换数据源
2. 支持更多数据源（如 PostgreSQL、MySQL）
3. 数据源健康检查和状态监控
4. 数据同步功能（本地 ↔ 云端）

## 相关文件

- [src/lib/supabase/client.ts](src/lib/supabase/client.ts)
- [src/services/DataService.ts](src/services/DataService.ts)
- [src/app/page.tsx](src/app/page.tsx)
- [src/components/dashboard-client.tsx](src/components/dashboard-client.tsx)
- [.env.example](.env.example)

## 更新日期

2025-11-02
