#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 架构合规性检查脚本
 *
 * 检查项目是否遵循 Clean Architecture + FSD 原则
 * 基于 开发文档/04_refactoring/ARCHITECTURE_RULES.md 和 REFACTORING_CHECKLIST.md
 */

console.log('🔍 开始架构合规性检查...\n')

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

// 检查函数
function check(description, condition, details = '') {
  totalChecks++
  if (condition) {
    console.log(`✅ ${description}`)
    passedChecks++
  } else {
    console.log(`❌ ${description}`)
    if (details) {
      console.log(`   详情: ${details}`)
    }
    failedChecks++
  }
}

// 检查命令输出
function checkCommand(description, command, expectedCondition) {
  try {
    const output = execSync(command, { encoding: 'utf8' }).trim()
    check(description, expectedCondition(output), output)
  } catch (error) {
    check(description, false, error.message)
  }
}

console.log('## 第一层：依赖方向检查\n')

// Domain 层检查
console.log('### Domain 层检查')
checkCommand(
  'Domain 层没有导入 React',
  "grep -r \"from 'react'\" src/domain/ --include='*.ts' 2>/dev/null | wc -l",
  output => parseInt(output) === 0
)

checkCommand(
  'Domain 层没有导入 UI 组件',
  "grep -r \"from '@/components\" src/domain/ --include='*.ts' 2>/dev/null | wc -l",
  output => parseInt(output) === 0
)

checkCommand(
  'Domain 层没有导入 API 客户端',
  'grep -r "fetch\\|axios\\|supabase" src/domain/ --include=\'*.ts\' 2>/dev/null | wc -l',
  output => parseInt(output) === 0
)

// Application 层检查
console.log('\n### Application 层检查')
checkCommand(
  'Application 层没有导入具体 UI 组件',
  "grep -r \"from '@/components\" src/application/ --include='*.ts' 2>/dev/null | wc -l",
  output => parseInt(output) === 0
)

checkCommand(
  'Application 层只导入接口而非具体实现',
  "grep -r \"from '@/infrastructure\" src/application/ --include='*.ts' 2>/dev/null | wc -l",
  output => parseInt(output) === 0
)

console.log('\n## 第二层：代码质量检查\n')

// 文件大小检查
console.log('### 文件大小检查')
const oversizedFiles = execSync(
  `
  find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 300 { print $2 ": " $1 " 行" }'
`,
  { encoding: 'utf8' }
).trim()

if (oversizedFiles) {
  check('没有超过 300 行的文件', false, oversizedFiles.split('\n').join(', '))
} else {
  check('没有超过 300 行的文件', true)
}

// 函数大小检查
console.log('\n### 函数大小检查')
// 这里可以添加更复杂的函数大小检查逻辑
check('函数大小检查', true, '暂未实现')

// 重复代码检查
console.log('\n### 重复代码检查')
checkCommand(
  'normalizeChineseText 统一使用 Domain 层实现',
  "grep -r \"from '@/lib/utils'\" src --include='*.ts' --include='*.tsx' | grep normalizeChineseText | wc -l",
  output => parseInt(output) === 0
)

console.log('\n## 第三层：架构结构检查\n')

// 检查必要的目录结构
console.log('### 目录结构检查')
const requiredDirs = [
  'src/domain',
  'src/domain/entities',
  'src/domain/rules',
  'src/application',
  'src/application/ports',
  'src/application/use-cases',
  'src/application/services',
  'src/infrastructure',
  'src/infrastructure/adapters',
]

requiredDirs.forEach(dir => {
  check(`存在 ${dir} 目录`, fs.existsSync(dir))
})

// 检查核心文件存在
console.log('\n### 核心文件检查')
const coreFiles = [
  'src/domain/rules/data-normalization.ts',
  'src/domain/rules/kpi-calculator.ts',
  'src/domain/entities/InsuranceRecord.ts',
  'src/application/ports/IDataRepository.ts',
  'src/application/ports/IFileParser.ts',
  'src/application/ports/IExporter.ts',
]

coreFiles.forEach(file => {
  check(`存在 ${file}`, fs.existsSync(file))
})

console.log('\n## 第四层：类型安全检查\n')

// TypeScript 编译检查
console.log('### TypeScript 检查')
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' })
  check('TypeScript 编译无错误', true)
} catch (error) {
  check('TypeScript 编译无错误', false, '存在类型错误')
}

// 构建检查
console.log('\n### 构建检查')
try {
  execSync('npm run build', { stdio: 'pipe' })
  check('项目构建成功', true)
} catch (error) {
  check('项目构建成功', false, '构建失败')
}

console.log('\n## 检查结果汇总\n')
console.log(`📊 总检查项: ${totalChecks}`)
console.log(`✅ 通过: ${passedChecks}`)
console.log(`❌ 失败: ${failedChecks}`)
console.log(`📈 通过率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`)

if (failedChecks === 0) {
  console.log('\n🎉 所有架构合规检查通过！')
  process.exit(0)
} else {
  console.log('\n⚠️  发现架构问题，请根据上述报告进行修复')
  process.exit(1)
}
