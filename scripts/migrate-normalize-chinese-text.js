#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 迁移脚本：将 normalizeChineseText 从 @/lib/utils 迁移到 @/domain/rules/data-normalization
 *
 * 这是为了消除代码重复，统一使用 Domain 层的实现
 */

console.log('🔄 开始迁移 normalizeChineseText 调用...\n')

// 获取需要迁移的文件列表
const filesToMigrate = execSync(`
  grep -r "from '@/lib/utils'" src --include="*.ts" --include="*.tsx" |
  grep "normalizeChineseText" |
  cut -d: -f1 |
  sort |
  uniq
`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean)

console.log(`📁 找到 ${filesToMigrate.length} 个需要迁移的文件:`)
filesToMigrate.forEach(file => console.log(`  - ${file}`))

console.log('\n🔄 开始迁移...')

let successCount = 0
let errorCount = 0

filesToMigrate.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath)

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  文件不存在: ${filePath}`)
      return
    }

    let content = fs.readFileSync(fullPath, 'utf8')

    // 检查是否真的需要迁移
    if (!content.includes("import { normalizeChineseText } from '@/lib/utils'")) {
      console.warn(`⚠️  ${filePath}: 不需要迁移`)
      return
    }

    // 替换导入语句
    content = content.replace(
      /import { normalizeChineseText } from '@\/lib\/utils'/g,
      "import { normalizeChineseText } from '@/domain/rules/data-normalization'"
    )

    fs.writeFileSync(fullPath, content)

    console.log(`✅ ${filePath}`)
    successCount++

  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`)
    errorCount++
  }
})

console.log(`\n📊 迁移结果:`)
console.log(`✅ 成功: ${successCount}`)
console.log(`❌ 失败: ${errorCount}`)

console.log('\n🔍 验证迁移结果...')
try {
  // 检查是否还有遗漏的导入
  const remaining = execSync(`
    grep -r "from '@/lib/utils'" src --include="*.ts" --include="*.tsx" |
    grep "normalizeChineseText" |
    wc -l
  `, { encoding: 'utf8' }).trim()

  if (remaining === '0') {
    console.log('✅ 所有 normalizeChineseText 调用已成功迁移到 Domain 层')
  } else {
    console.log(`⚠️  还有 ${remaining} 个文件需要手动检查`)
  }

  // 检查构建是否正常
  console.log('🔨 检查编译...')
  execSync('npm run build', { stdio: 'inherit', encoding: 'utf8' })
  console.log('✅ 编译通过')

} catch (error) {
  console.error('❌ 验证失败:', error.message)
  process.exit(1)
}

console.log('\n🎉 迁移完成！')