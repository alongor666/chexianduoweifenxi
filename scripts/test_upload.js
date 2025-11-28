/*
 * 本地数据上传测试脚本
 * 用法：
 *   node scripts/test_upload.js <csv_file>
 * 示例：
 *   node scripts/test_upload.js test/测试数据2024.csv
 */

const fs = require('fs')
const path = require('path')
const { TextDecoder } = require('util')
const Papa = require('papaparse')

const REQUIRED_FIELDS = [
  'snapshot_date',
  'policy_start_year',
  'business_type_category',
  'chengdu_branch',
  'third_level_organization',
  'customer_category_3',
  'insurance_type',
  'is_new_energy_vehicle',
  'coverage_type',
  'is_transferred_vehicle',
  'renewal_status',
  'vehicle_insurance_grade',
  'highway_risk_grade',
  'large_truck_score',
  'small_truck_score',
  'terminal_source',
  'signed_premium_yuan',
  'matured_premium_yuan',
  'policy_count',
  'claim_case_count',
  'reported_claim_payment_yuan',
  'expense_amount_yuan',
  'commercial_premium_before_discount_yuan',
  'premium_plan_yuan',
  'marginal_contribution_amount_yuan',
  'week_number',
]

const SUPPORTED_ENCODINGS = ['utf-8', 'gb18030', 'gbk', 'gb2312']

function decodeBufferWithEncoding(buffer, encoding) {
  try {
    const decoder = new TextDecoder(encoding, { fatal: false })
    return decoder.decode(buffer)
  } catch (error) {
    console.warn(`[Encoding] Node 环境不支持 ${encoding}: ${error.message}`)
    return null
  }
}

function evaluateDecodedTextQuality(text) {
  const sample = text.slice(0, 20000)
  let cjkCount = 0
  let replacementCount = 0
  let latinExtendedCount = 0

  for (let i = 0; i < sample.length; i += 1) {
    const code = sample.charCodeAt(i)
    if (code === 0xfffd) {
      replacementCount += 1
      continue
    }
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf)
    ) {
      cjkCount += 1
      continue
    }
    if (code >= 0x00c0 && code <= 0x024f) {
      latinExtendedCount += 1
    }
  }

  return cjkCount * 5 - replacementCount * 20 - latinExtendedCount
}

function decodeCSVBuffer(buffer) {
  const sampleSize = Math.min(buffer.length, 256 * 1024)
  const sampleBuffer = buffer.subarray(0, sampleSize)

  const candidates = SUPPORTED_ENCODINGS.map(encoding => {
    const sampleText = decodeBufferWithEncoding(sampleBuffer, encoding)
    if (sampleText === null) {
      return { encoding, score: Number.NEGATIVE_INFINITY }
    }
    return {
      encoding,
      score: evaluateDecodedTextQuality(sampleText),
    }
  })

  const best = candidates.reduce((prev, curr) =>
    curr.score > prev.score ? curr : prev
  )

  const decodedText =
    decodeBufferWithEncoding(buffer, best.encoding) ??
    decodeBufferWithEncoding(buffer, 'utf-8') ??
    buffer.toString('utf8')

  return {
    text: decodedText,
    encoding: best.encoding,
  }
}

function parseNumber(value, fieldName, errors, opts = {}) {
  if (value === null || value === undefined || value === '') return 0
  let processed = value
  if (typeof processed === 'string') {
    processed = processed.trim()
    if (processed === '') return 0
  }
  const num = Number(processed)
  if (Number.isNaN(num)) {
    errors.push(`${fieldName}: 无效的数字格式 "${value}"`)
    return 0
  }
  if (opts.integer && !Number.isInteger(num)) {
    errors.push(`${fieldName}: 必须是整数，当前值 "${value}"`)
  }
  if (opts.min !== undefined && num < opts.min) {
    errors.push(`${fieldName}: 值 ${num} 小于最小值 ${opts.min}`)
  }
  if (opts.max !== undefined && num > opts.max) {
    errors.push(`${fieldName}: 值 ${num} 大于最大值 ${opts.max}`)
  }
  return num
}

function parseEnum(value, validValues, def) {
  const str = String(value ?? '').trim()
  if (!str) return def
  const mappings = { '商业保险': '商业险' }
  const mapped = mappings[str] || str
  return validValues.includes(mapped) ? mapped : def
}

function parseOptionalEnum(value, validValues) {
  const str = String(value ?? '').trim()
  if (!str) return undefined
  const mappings = { '商业保险': '商业险' }
  const mapped = mappings[str] || str
  return validValues.includes(mapped) ? mapped : undefined
}

function parseBoolean(value, fieldName, warnings) {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim()
  if (raw === 'True') return true
  if (raw === 'False') return false
  const normalized = raw.toLowerCase()
  const truthy = ['true', '1', 'yes', 'y', '是']
  const falsy = ['false', '0', 'no', 'n', '否']
  if (truthy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 True 处理`)
    return true
  }
  if (falsy.includes(normalized)) {
    warnings.push(`${fieldName}: 非标准布尔值 "${raw}" 已按 False 处理`)
    return false
  }
  warnings.push(`${fieldName}: 无效布尔值 "${raw}"，已默认 False`)
  return false
}

function transformRow(row, index, warnOut) {
  const errors = []
  const warnings = warnOut || []
  const data = {
    snapshot_date: String(row.snapshot_date ?? '').trim(),
    policy_start_year: parseNumber(row.policy_start_year, 'policy_start_year', errors, { min: 2020, max: 2030, integer: true }),
    week_number: parseNumber(row.week_number, 'week_number', errors, { min: 1, max: 105, integer: true }),
    chengdu_branch: parseEnum(row.chengdu_branch, ['成都', '中支'], '成都'),
    third_level_organization: String(row.third_level_organization ?? '').trim(),
    customer_category_3: String(row.customer_category_3 ?? '').trim(),
    insurance_type: parseEnum(row.insurance_type, ['商业险', '交强险'], '商业险'),
    business_type_category: String(row.business_type_category ?? '').trim(),
    coverage_type: parseEnum(row.coverage_type, ['主全', '交三', '单交'], '主全'),
    renewal_status: parseEnum(row.renewal_status, ['新保', '续保', '转保'], '新保'),
    is_new_energy_vehicle: parseBoolean(row.is_new_energy_vehicle, 'is_new_energy_vehicle', warnings),
    is_transferred_vehicle: parseBoolean(row.is_transferred_vehicle, 'is_transferred_vehicle', warnings),
    vehicle_insurance_grade: parseOptionalEnum(row.vehicle_insurance_grade, ['A', 'B', 'C', 'D', 'E', 'F', 'G']),
    highway_risk_grade: parseOptionalEnum(row.highway_risk_grade, ['A', 'B', 'C', 'D', 'E', 'F', 'X']),
    large_truck_score: parseOptionalEnum(row.large_truck_score, ['A', 'B', 'C', 'D', 'E', 'X']),
    small_truck_score: parseOptionalEnum(row.small_truck_score, ['A', 'B', 'C', 'D', 'E', 'X']),
    terminal_source: String(row.terminal_source ?? '').trim(),
    signed_premium_yuan: parseNumber(row.signed_premium_yuan, 'signed_premium_yuan', errors, { min: 0, max: 1e7 }),
    matured_premium_yuan: parseNumber(row.matured_premium_yuan, 'matured_premium_yuan', errors, { min: 0, max: 1e7 }),
    policy_count: parseNumber(row.policy_count, 'policy_count', errors, { min: 0, integer: true }),
    claim_case_count: parseNumber(row.claim_case_count, 'claim_case_count', errors, { min: 0, integer: true }),
    reported_claim_payment_yuan: parseNumber(row.reported_claim_payment_yuan, 'reported_claim_payment_yuan', errors, { min: 0 }),
    expense_amount_yuan: parseNumber(row.expense_amount_yuan, 'expense_amount_yuan', errors, { min: 0 }),
    commercial_premium_before_discount_yuan: parseNumber(row.commercial_premium_before_discount_yuan, 'commercial_premium_before_discount_yuan', errors, { min: 0 }),
    premium_plan_yuan: row.premium_plan_yuan !== null && row.premium_plan_yuan !== undefined && row.premium_plan_yuan !== ''
      ? parseNumber(row.premium_plan_yuan, 'premium_plan_yuan', errors, { min: 0 })
      : null,
    marginal_contribution_amount_yuan: parseNumber(row.marginal_contribution_amount_yuan, 'marginal_contribution_amount_yuan', errors),
  }

  // 轻量级规则校验（与前端 zod 核心一致）
  // 日期格式 YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.snapshot_date)) {
    errors.push('snapshot_date: 快照日期格式必须为 YYYY-MM-DD')
  }
  const d = new Date(data.snapshot_date)
  if (Number.isNaN(d.getTime()) || d < new Date('2020-01-01') || d > new Date()) {
    errors.push('snapshot_date: 快照日期必须在 2020-01-01 至今之间')
  }
  if (data.matured_premium_yuan > data.signed_premium_yuan) {
    errors.push('matured_premium_yuan: 满期保费不能超过签单保费')
  }
  // 放宽以下规则（不再作为错误）：
  // - 赔案件数 ≤ 保单件数
  // - 商业险折前保费 ≥ 签单保费
  // - 非营业个人客车评级不能为 X

  return { data, errors, warnings }
}

function checkHeaders(rows) {
  if (!rows || rows.length === 0) return { ok: false, missing: REQUIRED_FIELDS }
  const fields = Object.keys(rows[0])
  const missing = REQUIRED_FIELDS.filter(f => !fields.includes(f))
  const extra = fields.filter(f => !REQUIRED_FIELDS.includes(f))
  return { ok: missing.length === 0, missing, extra, fields }
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('请提供 CSV 文件路径，如：node scripts/test_upload.js test/测试数据2024.csv')
    process.exit(1)
  }
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    console.error(`未找到文件：${abs}`)
    process.exit(1)
  }
  const stat = fs.statSync(abs)
  const start = Date.now()
  const buffer = fs.readFileSync(abs)
  const { text: content, encoding } = decodeCSVBuffer(buffer)
  console.log(`检测到文件编码: ${encoding}`)
  const parsed = Papa.parse(content, { header: true, dynamicTyping: false, skipEmptyLines: true })
  const rows = Array.isArray(parsed.data) ? parsed.data.filter(r => r && Object.keys(r).length > 0) : []
  const headerCheck = checkHeaders(rows)
  if (!headerCheck.ok) {
    console.error(`CSV 表头缺失必需字段 (${headerCheck.missing.length} 个)：${headerCheck.missing.join(', ')}`)
    process.exit(2)
  }
  if (headerCheck.extra && headerCheck.extra.length > 0) {
    console.warn(`发现额外字段 (${headerCheck.extra.length} 个)：${headerCheck.extra.join(', ')}`)
  }
  let valid = 0
  let invalid = 0
  const errors = []
  let warningsCount = 0
  rows.forEach((row, idx) => {
    const { errors: es, warnings } = transformRow(row, idx)
    warningsCount += warnings.length
    if (es.length > 0) {
      invalid++
      if (errors.length < 20) {
        errors.push({ row: idx + 2, errors: es })
      }
    } else {
      valid++
    }
  })
  const ms = Date.now() - start
  console.log('===== 数据上传解析测试结果 =====')
  console.log(`文件: ${path.basename(abs)}`)
  console.log(`大小: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`)
  console.log(`总行数: ${rows.length}`)
  console.log(`有效行: ${valid}`)
  console.log(`无效行: ${invalid}`)
  console.log(`解析耗时: ${ms} ms`)
  console.log(`平均处理速度: ${(rows.length / (ms / 1000)).toFixed(0)} 行/秒`)
  if (warningsCount > 0) {
    console.log(`注意: 解析过程中产生 ${warningsCount} 条非致命警告（布尔值规范等）`)
  }
  if (errors.length > 0) {
    console.log('\n前若干条错误示例:')
    errors.forEach(e => {
      console.log(`- 行 ${e.row}: ${e.errors.join('; ')}`)
    })
  } else {
    console.log('\n未发现结构性或规则性错误，数据可用于前端分析。')
  }
}

main().catch(err => {
  console.error('执行失败:', err)
  process.exit(1)
})
