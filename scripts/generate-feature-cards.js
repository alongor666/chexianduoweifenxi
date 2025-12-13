#!/usr/bin/env node
/**
 * 功能卡片生成工具
 * 基于代码分析报告自动生成功能卡片文档
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = __dirname
const DOCS_DIR = path.join(PROJECT_ROOT, '开发文档')
const FEATURES_DIR = path.join(DOCS_DIR, '01_features')
const ANALYSIS_FILE = path.join(PROJECT_ROOT, 'codebase-analysis.json')

// 读取代码分析报告
const analysis = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8'))

// 功能详细信息
const FEATURE_DETAILS = {
  F001_data_import: {
    name: '数据上传与解析模块',
    priority: 'P0',
    version: 'v2.1.0',
    overview:
      '提供CSV/JSON文件上传、解析、验证和预处理能力,支持批量导入和智能纠错',
    capabilities: [
      {
        name: '文件上传',
        desc: '支持拖拽和点击上传,最大200MB',
        status: 'implemented',
      },
      {
        name: 'CSV流式解析',
        desc: '使用Papa Parse分块处理,避免内存溢出',
        status: 'implemented',
      },
      {
        name: '数据验证',
        desc: '基于Zod Schema的26字段验证',
        status: 'implemented',
      },
      {
        name: '智能纠错',
        desc: '模糊匹配修正枚举值错误',
        status: 'implemented',
      },
      { name: '批量导入', desc: '并行处理多文件上传', status: 'partial' },
      {
        name: '错误详情展示',
        desc: '友好的错误列表和修复建议',
        status: 'partial',
      },
    ],
    related_decisions: ['ADR-002', 'ADR-003'],
    related_issues: ['ISSUE-001', 'ISSUE-003'],
    tags: ['数据处理', '用户交互', 'P0'],
  },
  F002_kpi_dashboard: {
    name: '核心KPI看板模块',
    priority: 'P0',
    version: 'v2.3.0',
    overview: '展示8个核心KPI和5个补充指标,支持动态计算、颜色编码和趋势展示',
    capabilities: [
      {
        name: 'KPI计算引擎',
        desc: '聚合优先的高性能计算,支持10万+数据',
        status: 'implemented',
      },
      {
        name: '4x4网格布局',
        desc: '响应式卡片布局,适配桌面和平板',
        status: 'implemented',
      },
      {
        name: '紧凑模式',
        desc: '精简版看板,适用于趋势分析页',
        status: 'implemented',
      },
      {
        name: '公式展示',
        desc: '工具提示显示计算公式和详细值',
        status: 'partial',
      },
      {
        name: '微型趋势图',
        desc: '悬浮显示最近12周KPI趋势',
        status: 'implemented',
      },
      {
        name: '颜色编码',
        desc: '满期边际贡献率5级色谱',
        status: 'implemented',
      },
    ],
    related_decisions: ['ADR-001', 'ADR-004'],
    related_issues: [],
    tags: ['数据可视化', '核心功能', 'P0'],
  },
  F003_trend_analysis: {
    name: '趋势分析图表模块',
    priority: 'P0',
    version: 'v1.3.0',
    overview: '52周时间序列趋势图,支持异常检测、趋势拟合和区间选择',
    capabilities: [
      {
        name: '趋势图表',
        desc: 'Recharts三线图(签单/满期/赔付率)',
        status: 'implemented',
      },
      {
        name: '异常检测',
        desc: 'Z-Score/IQR/MAD三种算法',
        status: 'implemented',
      },
      {
        name: '趋势拟合',
        desc: '线性回归/移动平均/指数平滑',
        status: 'implemented',
      },
      {
        name: '区间选择',
        desc: 'Brush组件支持时间范围筛选',
        status: 'implemented',
      },
      {
        name: '图例联动',
        desc: '点击图例显隐系列,悬浮高亮',
        status: 'implemented',
      },
    ],
    related_decisions: ['ADR-004'],
    related_issues: [],
    tags: ['数据可视化', '智能分析', 'P0'],
  },
  F004_filters: {
    name: '多维度数据筛选与切片模块',
    priority: 'P0',
    version: 'v2.0.0',
    overview: '支持11个业务维度筛选,双模式分析架构,级联响应和预设保存',
    capabilities: [
      {
        name: '时间筛选',
        desc: '年度+周序号,单选/多选模式切换',
        status: 'implemented',
      },
      {
        name: '机构筛选',
        desc: '13个三级机构多选,支持搜索',
        status: 'implemented',
      },
      {
        name: '产品筛选',
        desc: '险种/业务类型/险别组合',
        status: 'implemented',
      },
      {
        name: '客户筛选',
        desc: '客户类型/评级/新续转/新能源',
        status: 'implemented',
      },
      { name: '级联响应', desc: '筛选器选项动态联动收敛', status: 'partial' },
      { name: '筛选预设', desc: '保存/加载常用筛选组合', status: 'partial' },
      {
        name: '双模式架构',
        desc: '单周表现 vs 多周趋势',
        status: 'implemented',
      },
      { name: '筛选反馈', desc: '智能提示和数据统计', status: 'partial' },
    ],
    related_decisions: ['ADR-001'],
    related_issues: [],
    tags: ['数据筛选', '用户交互', 'P0'],
  },
  F005_structure_analysis: {
    name: '结构分析与对比模块',
    priority: 'P1',
    version: 'v1.2.0',
    overview: '提供机构对比、险种结构、客户分群和费用热力图等多维度分析',
    capabilities: [
      { name: '机构对比', desc: 'Top10机构表格+柱状图', status: 'implemented' },
      { name: '险种结构', desc: '饼图+详细卡片', status: 'implemented' },
      { name: '结构柱状图', desc: '机构/产品Top排序', status: 'implemented' },
      { name: '分布饼图', desc: '客户/渠道占比', status: 'implemented' },
      {
        name: '客户分群气泡图',
        desc: '单均保费×赔付率×保单数',
        status: 'implemented',
      },
      {
        name: '费用热力图',
        desc: '13机构×3指标热力矩阵',
        status: 'implemented',
      },
    ],
    related_decisions: ['ADR-004'],
    related_issues: [],
    tags: ['数据分析', '可视化', 'P1'],
  },
  F006_data_export: {
    name: '数据导出与分享模块',
    priority: 'P2',
    version: 'v1.1.0',
    overview: '支持CSV、PNG、PDF多格式导出,满足报告制作和数据分享需求',
    capabilities: [
      { name: 'CSV导出', desc: '全量/筛选数据/KPI汇总', status: 'implemented' },
      {
        name: '图表PNG导出',
        desc: 'html2canvas高清截图',
        status: 'implemented',
      },
      {
        name: 'PDF报告导出',
        desc: '自动生成完整分析报告',
        status: 'implemented',
      },
      { name: '批量导出', desc: '一键导出所有图表', status: 'partial' },
    ],
    related_decisions: [],
    related_issues: [],
    tags: ['数据导出', '用户体验', 'P2'],
  },
  F007_calculation_verification: {
    name: '计算核对与透明化模块',
    priority: 'P1',
    version: 'v0.5.0',
    overview: '展示KPI计算公式、分子分母实际值,确保计算透明可追溯',
    capabilities: [
      { name: '公式定义', desc: '18个KPI完整公式文档', status: 'implemented' },
      { name: '公式展示', desc: '工具提示显示详细公式', status: 'partial' },
      {
        name: '计算过程追溯',
        desc: '显示中间计算步骤',
        status: 'not_implemented',
      },
      {
        name: 'Excel一致性验证',
        desc: '自动对比Excel结果',
        status: 'not_implemented',
      },
    ],
    related_decisions: [],
    related_issues: [],
    tags: ['数据准确性', '透明化', 'P1'],
  },
}

// 状态图标映射
const STATUS_ICONS = {
  to_be_implemented: '⏳',
  in_progress: '🚧',
  partial: '🚧',
  implemented: '✅',
  modified: '🔄',
  deprecated: '⚠️',
}

// 生成功能卡片README.md
function generateFeatureReadme(featureId, analysis, details) {
  const statusIcon = STATUS_ICONS[analysis.status] || '❓'

  let content = `# ${details.name}\n\n`
  content += `> **状态**: ${statusIcon} ${analysis.status}\n`
  content += `> **优先级**: ${details.priority}\n`
  content += `> **完整度**: ${analysis.completeness}%\n`
  content += `> **版本**: ${details.version}\n`
  content += `> **最后验证**: ${new Date().toISOString().split('T')[0]}\n\n`

  content += `## 功能概述\n\n${details.overview}\n\n`

  content += `## 核心能力\n\n`
  details.capabilities.forEach(cap => {
    const icon =
      cap.status === 'implemented'
        ? '✅'
        : cap.status === 'partial'
          ? '🚧'
          : '⏳'
    content += `- ${icon} **${cap.name}**: ${cap.desc}\n`
  })
  content += `\n`

  content += `## 实现文件\n\n`
  content += `### 核心文件 (${analysis.coreFiles.found}/${analysis.coreFiles.total})\n\n`
  analysis.coreFiles.details.forEach(file => {
    const icon = file.exists ? '✅' : '❌'
    content += `- ${icon} [\`${file.file}\`](${path.join('../../../', file.file)})\n`
  })
  content += `\n`

  if (Object.keys(analysis.indicators).length > 0) {
    content += `### 增强功能\n\n`
    for (const [key, present] of Object.entries(analysis.indicators)) {
      const icon = present ? '✅' : '⏳'
      content += `- ${icon} ${key}\n`
    }
    content += `\n`
  }

  if (details.related_decisions.length > 0) {
    content += `## 相关决策\n\n`
    details.related_decisions.forEach(adr => {
      content += `- [${adr}](../../02_decisions/${adr}.md)\n`
    })
    content += `\n`
  }

  if (details.related_issues.length > 0) {
    content += `## 相关问题\n\n`
    details.related_issues.forEach(issue => {
      content += `- [${issue}](../../archive/问题记录表.md#${issue.toLowerCase()})\n`
    })
    content += `\n`
  }

  content += `## 测试覆盖\n\n`
  content += `- [ ] 单元测试\n`
  content += `- [ ] 集成测试\n`
  content += `- [ ] 端到端测试\n\n`

  content += `## 技术栈\n\n`
  if (featureId.includes('data_import')) {
    content += `- **CSV解析**: Papa Parse 5.x\n`
    content += `- **数据验证**: Zod 4.x\n`
    content += `- **模糊匹配**: Levenshtein距离算法\n`
  } else if (featureId.includes('kpi_dashboard')) {
    content += `- **UI组件**: React 18 + Tailwind CSS\n`
    content += `- **图表库**: Recharts 3.x (Sparklines)\n`
    content += `- **工具提示**: Radix UI Tooltip\n`
  } else if (featureId.includes('trend_analysis')) {
    content += `- **图表库**: Recharts 3.x\n`
    content += `- **算法**: Z-Score, IQR, MAD, Linear Regression\n`
  } else if (featureId.includes('filters')) {
    content += `- **状态管理**: Zustand 5.x\n`
    content += `- **UI组件**: Shadcn/ui + Radix UI\n`
    content += `- **持久化**: localStorage\n`
  } else if (featureId.includes('export')) {
    content += `- **CSV生成**: 原生JavaScript\n`
    content += `- **图表截图**: html2canvas 1.4.x\n`
    content += `- **PDF生成**: jsPDF 3.x\n`
  }
  content += `\n`

  content += `---\n\n`
  content += `*本文档基于代码分析自动生成*\n`
  content += `*生成时间: ${new Date().toISOString()}*\n`

  return content
}

// 生成meta.json
function generateMeta(featureId, analysis, details) {
  return {
    id: featureId.split('_')[0].toUpperCase(),
    name: details.name,
    status: analysis.status,
    priority: details.priority,
    completeness: analysis.completeness,
    version: details.version,
    last_updated: new Date().toISOString().split('T')[0],
    last_verified: new Date().toISOString().split('T')[0],
    core_files: analysis.coreFiles.details
      .filter(f => f.exists)
      .map(f => f.file),
    related_decisions: details.related_decisions,
    related_issues: details.related_issues,
    tags: details.tags,
  }
}

// 主函数
function main() {
  console.log('🚀 开始生成功能卡片...\n')

  // 确保目录存在
  if (!fs.existsSync(FEATURES_DIR)) {
    fs.mkdirSync(FEATURES_DIR, { recursive: true })
  }

  let generatedCount = 0

  for (const [featureId, featureAnalysis] of Object.entries(
    analysis.features
  )) {
    const details = FEATURE_DETAILS[featureId]
    if (!details) {
      console.log(`⚠️  跳过 ${featureId}: 缺少详细信息定义`)
      continue
    }

    // 创建功能目录
    const featureDir = path.join(FEATURES_DIR, featureId)
    if (!fs.existsSync(featureDir)) {
      fs.mkdirSync(featureDir, { recursive: true })
    }

    // 生成README.md
    const readme = generateFeatureReadme(featureId, featureAnalysis, details)
    fs.writeFileSync(path.join(featureDir, 'README.md'), readme)

    // 生成meta.json
    const meta = generateMeta(featureId, featureAnalysis, details)
    fs.writeFileSync(
      path.join(featureDir, 'meta.json'),
      JSON.stringify(meta, null, 2)
    )

    console.log(
      `✅ ${featureId}: ${details.name} (${featureAnalysis.completeness}%)`
    )
    generatedCount++
  }

  console.log(`\n✨ 成功生成 ${generatedCount} 个功能卡片\n`)
  console.log(`📂 输出目录: ${FEATURES_DIR}\n`)
}

main()
