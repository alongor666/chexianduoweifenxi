/**
 * README 自动同步脚本
 *
 * 目标：将 README 中“常用命令”段落与 package.json scripts 保持一致，
 * 避免手工维护造成文档与代码漂移。
 *
 * 用法：
 * - node scripts/sync_readme.js          # 写入 README
 * - node scripts/sync_readme.js --check  # 仅检查，不写入（CI 用）
 */

const fs = require('fs')
const path = require('path')

const README_PATH = path.join(process.cwd(), 'README.md')
const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json')

const START_MARKER = '<!-- AUTO-GENERATED:pnpm-scripts:start -->'
const END_MARKER = '<!-- AUTO-GENERATED:pnpm-scripts:end -->'

const SCRIPT_ENTRIES = [
  { key: 'dev', description: '启动开发服务器' },
  { key: 'build', description: '构建（静态导出到 out/）' },
  { key: 'deploy', description: '生成 out/（用于静态托管）' },
  { key: 'deploy:preview', description: '本地预览 out/（静态）' },
  { key: 'validate', description: '基础校验（lint + tsc + build）' },
  { key: 'test:unit', description: '单元测试（Vitest）' },
  { key: 'test:e2e', description: '端到端测试（Playwright）' },
  { key: 'docs:index', description: '更新知识库索引（开发文档/）' },
]

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
}

function buildScriptsTable(packageScripts) {
  const missing = SCRIPT_ENTRIES.filter(entry => !(entry.key in packageScripts))
  if (missing.length > 0) {
    const keys = missing.map(m => m.key).join(', ')
    throw new Error(`package.json scripts 缺少以下条目：${keys}`)
  }

  const lines = []
  lines.push('| 命令 | 实际执行 | 说明 |')
  lines.push('|---|---|---|')

  for (const { key, description } of SCRIPT_ENTRIES) {
    const scriptValue = String(packageScripts[key])
    lines.push(
      `| \`pnpm ${key}\` | \`${scriptValue}\` | ${description} |`
    )
  }

  return lines.join('\n')
}

function replaceBetween(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker)
  const endIndex = content.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `README 中未找到标记：${startMarker} / ${endMarker}（请保留这两个标记）`
    )
  }
  if (endIndex < startIndex) {
    throw new Error('README 标记顺序错误：endMarker 在 startMarker 之前')
  }

  const before = content.slice(0, startIndex + startMarker.length)
  const after = content.slice(endIndex)

  return `${before}\n${replacement}\n${after}`
}

function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')

  const packageJson = JSON.parse(readText(PACKAGE_JSON_PATH))
  const scripts = packageJson.scripts || {}

  const generated = buildScriptsTable(scripts)
  const readme = readText(README_PATH)

  const nextReadme = replaceBetween(
    readme,
    START_MARKER,
    END_MARKER,
    generated
  )

  if (nextReadme === readme) {
    process.stdout.write('[readme] 已是最新，无需更新。\n')
    return
  }

  if (checkOnly) {
    process.stderr.write(
      '[readme] README 需要更新：请运行 `pnpm readme:sync`。\n'
    )
    process.exit(1)
  }

  writeText(README_PATH, nextReadme)
  process.stdout.write('[readme] 已更新 README 中的自动生成段落。\n')
}

main()
