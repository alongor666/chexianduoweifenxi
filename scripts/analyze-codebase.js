#!/usr/bin/env node
/**
 * 代码库功能分析工具
 * 目标: 从实际代码提取功能实现状态,作为"代码是唯一事实"的证据
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(PROJECT_ROOT, 'src')

// 功能特征定义 (基于代码结构推断功能)
const FEATURE_SIGNATURES = {
  F001_data_import: {
    name: '数据上传与解析模块',
    files: [
      'src/components/features/file-upload.tsx',
      'src/lib/parsers/csv-parser.ts',
      'src/lib/validations/insurance-schema.ts',
      'src/hooks/use-file-upload.ts',
    ],
    indicators: {
      fuzzy_match: ['src/lib/parsers/fuzzy-matcher.ts'],
      batch_upload: ['use-file-upload.ts.*parallel'],
      error_handling: ['upload-results-detail.tsx'],
    },
  },
  F002_kpi_dashboard: {
    name: '核心KPI看板模块',
    files: [
      'src/components/features/kpi-dashboard.tsx',
      'src/components/features/compact-kpi-dashboard.tsx',
      'src/lib/calculations/kpi-engine.ts',
      'src/lib/calculations/kpi-formulas.ts',
    ],
    indicators: {
      formula_display: ['kpi-formulas.ts.*getKPIFormula'],
      sparkline: ['src/components/ui/sparkline.tsx'],
      compact_mode: ['compact-kpi-dashboard.tsx'],
    },
  },
  F003_trend_analysis: {
    name: '趋势分析图表模块',
    files: [
      'src/components/features/trend-chart.tsx',
      'src/lib/analytics/anomaly-detection.ts',
      'src/lib/analytics/trend-fitting.ts',
    ],
    indicators: {
      anomaly_detection: ['anomaly-detection.ts.*(zScore|iqr|mad)'],
      trend_fitting: ['trend-fitting.ts.*(linear|moving|exponential)'],
    },
  },
  F004_filters: {
    name: '多维度数据筛选与切片模块',
    files: [
      'src/components/filters/filter-panel.tsx',
      'src/components/filters/time-filter.tsx',
      'src/components/filters/organization-filter.tsx',
      'src/components/filters/compact-time-filter.tsx',
      'src/components/filters/compact-organization-filter.tsx',
    ],
    indicators: {
      cascade: ['filter-interaction-manager.tsx'],
      presets: ['filter-presets.tsx'],
      dual_mode: ['view-mode-selector.tsx'],
      feedback: ['filter-feedback.tsx'],
    },
  },
  F005_structure_analysis: {
    name: '结构分析与对比模块',
    files: [
      'src/components/features/comparison-analysis.tsx',
      'src/components/features/structure-bar-chart.tsx',
      'src/components/features/distribution-pie-chart.tsx',
      'src/components/features/thematic-analysis.tsx',
    ],
    indicators: {
      bubble_chart: ['customer-segmentation-bubble.tsx'],
      heatmap: ['expense-heatmap.tsx'],
    },
  },
  F006_data_export: {
    name: '数据导出与分享模块',
    files: [
      'src/components/features/data-export.tsx',
      'src/lib/export/csv-exporter.ts',
      'src/lib/export/chart-exporter.ts',
      'src/lib/export/pdf-exporter.ts',
      'src/components/features/pdf-report-export.tsx',
    ],
    indicators: {
      chart_export: ['chart-exporter.ts'],
      pdf_export: ['pdf-exporter.ts'],
    },
  },
  F007_calculation_verification: {
    name: '计算核对与透明化模块',
    files: ['src/lib/calculations/kpi-formulas.ts'],
    indicators: {
      formula_tooltip: ['kpi-formulas.ts.*getKPIFormula'],
    },
  },
}

// 架构决策特征
const ARCHITECTURE_PATTERNS = {
  state_management: {
    name: '状态管理架构',
    patterns: ['zustand', 'create.*useStore', 'FilterState'],
  },
  data_validation: {
    name: '数据验证架构',
    patterns: ['zod', 'z\\.object', 'insuranceRecordSchema'],
  },
  csv_parsing: {
    name: 'CSV解析策略',
    patterns: ['PapaParse', 'parseCSVFile', 'chunkSize'],
  },
  chart_library: {
    name: '图表库选型',
    patterns: [
      'echarts',
      'BaseEChart',
      'ReactECharts',
      'recharts',
      'LineChart',
      'BarChart',
    ],
  },
  ui_framework: {
    name: 'UI组件库',
    patterns: ['radix-ui', 'shadcn', 'cn\\('],
  },
  storage_strategy: {
    name: '数据持久化策略',
    patterns: ['localStorage', 'IndexedDB', 'saveToLocalStorage'],
  },
}

// 工具函数
function fileExists(filePath) {
  return fs.existsSync(path.join(PROJECT_ROOT, filePath))
}

function searchInFile(filePath, pattern) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath)
    if (!fs.existsSync(fullPath)) return false

    const content = fs.readFileSync(fullPath, 'utf-8')
    const regex = new RegExp(pattern, 'i')
    return regex.test(content)
  } catch (err) {
    return false
  }
}

function getAllFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const filePath = path.join(dirPath, file)
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.relative(PROJECT_ROOT, filePath))
    }
  })

  return fileList
}

// 分析功能实现状态
function analyzeFeature(featureId, feature) {
  const result = {
    id: featureId,
    name: feature.name,
    status: 'not_implemented',
    coreFiles: {
      found: 0,
      total: feature.files.length,
      details: [],
    },
    indicators: {},
    completeness: 0,
  }

  // 检查核心文件
  feature.files.forEach(file => {
    const exists = fileExists(file)
    result.coreFiles.details.push({ file, exists })
    if (exists) result.coreFiles.found++
  })

  // 检查指标
  for (const [key, patterns] of Object.entries(feature.indicators || {})) {
    result.indicators[key] = false
    for (const pattern of patterns) {
      const [file, searchPattern] = pattern.split('.*')
      if (searchPattern) {
        if (searchInFile(file, searchPattern)) {
          result.indicators[key] = true
          break
        }
      } else {
        if (fileExists(pattern)) {
          result.indicators[key] = true
          break
        }
      }
    }
  }

  // 计算完整度
  const coreScore = result.coreFiles.found / result.coreFiles.total
  const indicatorKeys = Object.keys(result.indicators)
  const indicatorScore =
    indicatorKeys.length > 0
      ? Object.values(result.indicators).filter(v => v).length /
        indicatorKeys.length
      : 0

  result.completeness = Math.round(
    (coreScore * 0.7 + indicatorScore * 0.3) * 100
  )

  // 判断状态
  if (result.completeness >= 90) {
    result.status = 'implemented'
  } else if (result.completeness >= 50) {
    result.status = 'partial'
  } else if (result.completeness > 0) {
    result.status = 'in_progress'
  }

  return result
}

// 分析架构决策
function analyzeArchitecture() {
  const results = {}
  const allFiles = getAllFiles(SRC_DIR)

  for (const [key, arch] of Object.entries(ARCHITECTURE_PATTERNS)) {
    results[key] = {
      name: arch.name,
      adopted: false,
      evidence: [],
    }

    for (const pattern of arch.patterns) {
      for (const file of allFiles) {
        if (searchInFile(file, pattern)) {
          results[key].adopted = true
          results[key].evidence.push({
            file: file.replace(PROJECT_ROOT + '/', ''),
            pattern,
          })
          break
        }
      }
      if (results[key].adopted) break
    }
  }

  return results
}

// 生成报告
function generateReport() {
  console.log('🔍 代码库功能分析报告\n')
  console.log('='.repeat(80))

  // 功能分析
  console.log('\n## 功能实现状态\n')
  const features = {}

  for (const [id, feature] of Object.entries(FEATURE_SIGNATURES)) {
    const analysis = analyzeFeature(id, feature)
    features[id] = analysis

    const statusIcon = {
      implemented: '✅',
      partial: '🚧',
      in_progress: '🔄',
      not_implemented: '❌',
    }[analysis.status]

    console.log(`${statusIcon} ${id}: ${analysis.name}`)
    console.log(
      `   状态: ${analysis.status} | 完整度: ${analysis.completeness}%`
    )
    console.log(
      `   核心文件: ${analysis.coreFiles.found}/${analysis.coreFiles.total}`
    )

    if (Object.keys(analysis.indicators).length > 0) {
      console.log('   增强功能:')
      for (const [key, present] of Object.entries(analysis.indicators)) {
        console.log(`     - ${key}: ${present ? '✓' : '✗'}`)
      }
    }
    console.log('')
  }

  // 架构分析
  console.log('\n## 技术架构决策\n')
  const architecture = analyzeArchitecture()

  for (const [key, arch] of Object.entries(architecture)) {
    const icon = arch.adopted ? '✅' : '❌'
    console.log(`${icon} ${arch.name}`)
    if (arch.adopted && arch.evidence.length > 0) {
      console.log(`   证据: ${arch.evidence[0].file}`)
    }
  }

  // 统计信息
  console.log('\n## 统计信息\n')
  const implementedCount = Object.values(features).filter(
    f => f.status === 'implemented'
  ).length
  const totalCount = Object.keys(features).length
  const avgCompleteness = Math.round(
    Object.values(features).reduce((sum, f) => sum + f.completeness, 0) /
      totalCount
  )

  console.log(
    `已实现功能: ${implementedCount}/${totalCount} (${Math.round((implementedCount / totalCount) * 100)}%)`
  )
  console.log(`平均完整度: ${avgCompleteness}%`)
  console.log(
    `已采用架构: ${Object.values(architecture).filter(a => a.adopted).length}/${Object.keys(architecture).length}`
  )

  // 保存JSON报告
  const report = {
    timestamp: new Date().toISOString(),
    features,
    architecture,
    statistics: {
      implemented: implementedCount,
      total: totalCount,
      completeness: avgCompleteness,
    },
    metrics_definition: {
      implemented: '仅统计 status=implemented 的模块数量',
      completeness:
        'partial / in_progress 模块不计入已实现，但纳入平均完整度计算',
    },
  }

  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'codebase-analysis.json'),
    JSON.stringify(report, null, 2)
  )

  console.log('\n✅ 详细报告已保存到: codebase-analysis.json\n')
  console.log('='.repeat(80))
}

// 执行分析
generateReport()
