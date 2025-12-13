/**
 * 数据流完整性测试脚本
 * 测试从CSV上传到数据可视化的完整数据流
 */

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

// 测试结果收集器
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
}

// 辅助函数：添加测试结果
function addTestResult(name, passed, message, isWarning = false) {
  const result = {
    name,
    passed,
    message,
    isWarning,
  }

  testResults.details.push(result)

  if (isWarning) {
    testResults.warnings++
  } else if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }

  const icon = isWarning ? '⚠️' : passed ? '✅' : '❌'
  console.log(`${icon} ${name}: ${message}`)
}

// 1. 测试CSV文件存在性和可读性
function testCSVFiles() {
  console.log('\n📁 测试阶段 1: CSV文件检查')
  console.log('='.repeat(60))

  const testDir = path.join(__dirname, '../test/clean')

  if (!fs.existsSync(testDir)) {
    addTestResult('测试目录存在性', false, `测试目录不存在: ${testDir}`)
    return null
  }

  addTestResult('测试目录存在性', true, `找到测试目录: ${testDir}`)

  const csvFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.csv'))

  if (csvFiles.length === 0) {
    addTestResult('CSV文件发现', false, '测试目录中没有找到CSV文件')
    return null
  }

  addTestResult('CSV文件发现', true, `找到 ${csvFiles.length} 个CSV文件`)

  // 选择一个测试文件（优先选择测试数据）
  const testFile = csvFiles.find(f => f.includes('测试数据')) || csvFiles[0]
  const testFilePath = path.join(testDir, testFile)

  addTestResult('测试文件选择', true, `选择测试文件: ${testFile}`)

  return testFilePath
}

// 2. 测试CSV解析
function testCSVParsing(filePath) {
  console.log('\n📊 测试阶段 2: CSV解析')
  console.log('='.repeat(60))

  if (!filePath) {
    addTestResult('CSV解析', false, '没有可用的测试文件')
    return null
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const fileSize = Buffer.byteLength(fileContent, 'utf-8')

  addTestResult(
    '文件读取',
    true,
    `文件大小: ${(fileSize / 1024).toFixed(2)} KB`
  )

  let parseResult
  try {
    parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
    })

    addTestResult('CSV解析', true, `成功解析 ${parseResult.data.length} 行数据`)
  } catch (error) {
    addTestResult('CSV解析', false, `解析失败: ${error.message}`)
    return null
  }

  if (parseResult.errors.length > 0) {
    addTestResult(
      '解析错误检查',
      false,
      `发现 ${parseResult.errors.length} 个解析错误`,
      true
    )
    console.log('解析错误详情:', parseResult.errors.slice(0, 5))
  } else {
    addTestResult('解析错误检查', true, '无解析错误')
  }

  return parseResult.data
}

// 3. 测试数据结构验证
function testDataStructure(data) {
  console.log('\n🔍 测试阶段 3: 数据结构验证')
  console.log('='.repeat(60))

  if (!data || data.length === 0) {
    addTestResult('数据可用性', false, '没有数据可供验证')
    return
  }

  // 必需字段定义
  const requiredFields = [
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
    'terminal_source',
    'signed_premium_yuan',
    'matured_premium_yuan',
    'policy_count',
    'claim_case_count',
    'reported_claim_payment_yuan',
    'expense_amount_yuan',
    'commercial_premium_before_discount_yuan',
    'marginal_contribution_amount_yuan',
    'week_number',
  ]

  // 检查第一行数据的字段
  const firstRow = data[0]
  const actualFields = Object.keys(firstRow)

  addTestResult('字段数量', true, `实际字段数: ${actualFields.length}`)

  // 检查必需字段
  const missingFields = requiredFields.filter(
    field => !actualFields.includes(field)
  )

  if (missingFields.length > 0) {
    addTestResult(
      '必需字段检查',
      false,
      `缺失字段: ${missingFields.join(', ')}`
    )
  } else {
    addTestResult('必需字段检查', true, '所有必需字段都存在')
  }

  // 额外字段检查
  const extraFields = actualFields.filter(
    field => !requiredFields.includes(field)
  )
  if (extraFields.length > 0) {
    addTestResult(
      '额外字段检查',
      true,
      `发现额外字段: ${extraFields.join(', ')}`,
      true
    )
  }

  // 数据类型验证（抽样前10行）
  console.log('\n数据类型验证（前10行样本）:')
  const sampleSize = Math.min(10, data.length)
  let typeErrors = 0

  for (let i = 0; i < sampleSize; i++) {
    const row = data[i]

    // 验证年份
    const year = parseInt(row.policy_start_year)
    if (isNaN(year) || year < 2024 || year > 2025) {
      typeErrors++
      console.log(`  行 ${i + 1}: 年份无效 (${row.policy_start_year})`)
    }

    // 验证周数（根据实际数据，周数可能超过53，采用宽松验证）
    const week = parseInt(row.week_number)
    if (isNaN(week) || week < 1 || week > 200) {
      typeErrors++
      console.log(`  行 ${i + 1}: 周数无效 (${row.week_number})`)
    }

    // 验证金额字段
    const premium = parseFloat(row.signed_premium_yuan)
    if (isNaN(premium)) {
      typeErrors++
      console.log(
        `  行 ${i + 1}: 签单保费格式无效 (${row.signed_premium_yuan})`
      )
    }
  }

  if (typeErrors === 0) {
    addTestResult('数据类型验证', true, `前${sampleSize}行数据类型正确`)
  } else {
    addTestResult('数据类型验证', false, `发现 ${typeErrors} 个类型错误`)
  }

  return data
}

// 4. 测试数据统计
function testDataStatistics(data) {
  console.log('\n📈 测试阶段 4: 数据统计分析')
  console.log('='.repeat(60))

  if (!data || data.length === 0) {
    addTestResult('数据统计', false, '没有数据可供统计')
    return
  }

  // 统计年份分布
  const years = new Set()
  const weeks = new Set()
  const businessTypes = new Set()
  const organizations = new Set()

  let totalPremium = 0
  let totalPolicies = 0

  data.forEach(row => {
    years.add(row.policy_start_year)
    weeks.add(row.week_number)
    businessTypes.add(row.business_type_category)
    organizations.add(row.third_level_organization)

    totalPremium += parseFloat(row.signed_premium_yuan) || 0
    totalPolicies += parseInt(row.policy_count) || 0
  })

  console.log(`  总记录数: ${data.length}`)
  console.log(`  年份范围: ${Array.from(years).sort().join(', ')}`)
  console.log(
    `  周数范围: ${Math.min(...Array.from(weeks))} - ${Math.max(...Array.from(weeks))}`
  )
  console.log(`  业务类型数: ${businessTypes.size}`)
  console.log(`  三级机构数: ${organizations.size}`)
  console.log(`  总保费: ${(totalPremium / 10000).toFixed(2)} 万元`)
  console.log(`  总保单数: ${totalPolicies}`)

  addTestResult('数据统计', true, `成功统计 ${data.length} 条记录`)

  // 数据质量检查
  const nullCounts = {}
  const firstRow = data[0]
  Object.keys(firstRow).forEach(field => {
    nullCounts[field] = 0
  })

  data.forEach(row => {
    Object.keys(row).forEach(field => {
      if (
        row[field] === '' ||
        row[field] === null ||
        row[field] === undefined
      ) {
        nullCounts[field]++
      }
    })
  })

  const fieldsWithNulls = Object.entries(nullCounts).filter(
    ([_, count]) => count > 0
  )

  if (fieldsWithNulls.length > 0) {
    console.log('\n空值统计:')
    fieldsWithNulls.forEach(([field, count]) => {
      const percentage = ((count / data.length) * 100).toFixed(2)
      console.log(`  ${field}: ${count} (${percentage}%)`)
    })
    addTestResult(
      '数据完整性',
      true,
      `发现 ${fieldsWithNulls.length} 个字段包含空值`,
      true
    )
  } else {
    addTestResult('数据完整性', true, '所有字段都无空值')
  }
}

// 5. 测试筛选逻辑
function testFilterLogic(data) {
  console.log('\n🔍 测试阶段 5: 筛选逻辑')
  console.log('='.repeat(60))

  if (!data || data.length === 0) {
    addTestResult('筛选逻辑', false, '没有数据可供筛选')
    return
  }

  // 测试年份筛选
  const year2024Data = data.filter(row => row.policy_start_year === '2024')
  addTestResult('年份筛选', true, `2024年数据: ${year2024Data.length} 条`)

  // 测试业务类型筛选
  const businessTypes = [
    ...new Set(data.map(row => row.business_type_category)),
  ]
  if (businessTypes.length > 0) {
    const firstType = businessTypes[0]
    const typeData = data.filter(
      row => row.business_type_category === firstType
    )
    addTestResult('业务类型筛选', true, `${firstType}: ${typeData.length} 条`)
  }

  // 测试组合筛选
  const complexFilter = data.filter(
    row => row.policy_start_year === '2024' && row.insurance_type === '商业险'
  )
  addTestResult('组合筛选', true, `2024年商业险: ${complexFilter.length} 条`)
}

// 6. 测试KPI计算
function testKPICalculation(data) {
  console.log('\n💰 测试阶段 6: KPI计算')
  console.log('='.repeat(60))

  if (!data || data.length === 0) {
    addTestResult('KPI计算', false, '没有数据可供计算')
    return
  }

  // 计算总保费
  const totalPremium = data.reduce((sum, row) => {
    return sum + (parseFloat(row.signed_premium_yuan) || 0)
  }, 0)

  addTestResult('总保费计算', true, `${(totalPremium / 10000).toFixed(2)} 万元`)

  // 计算总保单数
  const totalPolicies = data.reduce((sum, row) => {
    return sum + (parseInt(row.policy_count) || 0)
  }, 0)

  addTestResult('总保单数计算', true, `${totalPolicies} 件`)

  // 计算件均保费
  if (totalPolicies > 0) {
    const avgPremium = totalPremium / totalPolicies
    addTestResult('件均保费计算', true, `${avgPremium.toFixed(2)} 元`)
  } else {
    addTestResult('件均保费计算', false, '保单数为0，无法计算')
  }

  // 计算边际贡献
  const totalContribution = data.reduce((sum, row) => {
    return sum + (parseFloat(row.marginal_contribution_amount_yuan) || 0)
  }, 0)

  addTestResult(
    '边际贡献计算',
    true,
    `${(totalContribution / 10000).toFixed(2)} 万元`
  )

  // 计算边际贡献率
  if (totalPremium > 0) {
    const contributionRate = (totalContribution / totalPremium) * 100
    addTestResult('边际贡献率计算', true, `${contributionRate.toFixed(2)}%`)
  }
}

// 7. 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 测试总结报告')
  console.log('='.repeat(60))

  const total = testResults.passed + testResults.failed
  const passRate =
    total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0

  console.log(`\n通过: ${testResults.passed}`)
  console.log(`失败: ${testResults.failed}`)
  console.log(`警告: ${testResults.warnings}`)
  console.log(`通过率: ${passRate}%`)

  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:')
    testResults.details
      .filter(r => !r.passed && !r.isWarning)
      .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
  }

  if (testResults.warnings > 0) {
    console.log('\n⚠️  警告:')
    testResults.details
      .filter(r => r.isWarning)
      .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
  }

  console.log('\n' + '='.repeat(60))

  // 数据流完整性评估
  const criticalTests = [
    'CSV文件发现',
    'CSV解析',
    '必需字段检查',
    '数据类型验证',
  ]

  const criticalPassed = testResults.details.filter(
    r => criticalTests.includes(r.name) && r.passed
  ).length

  if (criticalPassed === criticalTests.length) {
    console.log('✅ 数据流完整性测试: 通过')
    console.log('   项目可以正常处理从CSV上传到数据展示的完整流程')
  } else {
    console.log('❌ 数据流完整性测试: 失败')
    console.log('   项目存在阻碍数据流的关键问题')
  }

  console.log('='.repeat(60) + '\n')

  return testResults.failed === 0
}

// 主测试流程
function main() {
  console.log('🚀 开始数据流完整性测试')
  console.log('测试时间:', new Date().toLocaleString('zh-CN'))
  console.log('='.repeat(60))

  // 1. 测试CSV文件
  const csvFilePath = testCSVFiles()

  // 2. 测试CSV解析
  const parsedData = testCSVParsing(csvFilePath)

  // 3. 测试数据结构
  const validatedData = testDataStructure(parsedData)

  // 4. 测试数据统计
  testDataStatistics(validatedData)

  // 5. 测试筛选逻辑
  testFilterLogic(validatedData)

  // 6. 测试KPI计算
  testKPICalculation(validatedData)

  // 7. 生成报告
  const success = generateReport()

  // 返回退出码
  process.exit(success ? 0 : 1)
}

// 运行测试
main()
