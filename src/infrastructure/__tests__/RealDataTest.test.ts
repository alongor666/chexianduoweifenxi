import { describe, expect, it } from 'vitest'
import fs from 'fs'
// path is unused
// import path from 'path'
import { CSVParser } from '../adapters/CSVParser'
import { calculateKPIs } from '../../domain'
import { InsuranceRecord } from '../../domain/entities/InsuranceRecord'

describe('Real Data Test', () => {
  const realDataPath =
    '/Users/xuechenglong/Desktop/数据源(家)__chexianduoweifenxi/2025年/2025保单第40周变动成本明细表.csv'

  it('should parse real data correctly', async () => {
    // 检查文件是否存在
    if (!fs.existsSync(realDataPath)) {
      console.warn(
        `Real data file not found at ${realDataPath}, skipping test.`
      )
      return
    }

    const content = fs.readFileSync(realDataPath, 'utf-8')
    const file = new File([content], 'real_data.csv', { type: 'text/csv' })

    // Polyfill file.text() if missing (JSDOM/Node environment issue)
    if (!file.text) {
      Object.defineProperty(file, 'text', {
        value: async () => content,
        writable: true,
      })
    }

    const parser = new CSVParser()
    const records = await parser.parse(file)

    console.log(`Parsed ${records.length} records from real data.`)

    expect(records.length).toBeGreaterThan(0)

    // 验证第一条记录的关键字段
    const firstRecord = records[0]
    expect(firstRecord.snapshot_date).toBe('2025-10-05')
    expect(firstRecord.policy_start_year).toBe(2025)
    expect(firstRecord.business_type_category).toBe('10吨以上-普货')
    expect(firstRecord.chengdu_branch).toBe('中支')

    // 验证数值字段
    expect(firstRecord.signed_premium_yuan).toBeCloseTo(6762.26)

    // 验证布尔字段 (根据 CSV 内容 'False' -> false)
    expect(firstRecord.is_new_energy_vehicle).toBe(false)

    // 转换为领域模型以进行 KPI 计算
    const domainRecords = records.map(r => InsuranceRecord.fromRawData(r))

    // 尝试计算 KPI
    const kpi = calculateKPIs(domainRecords)
    expect(kpi).toBeDefined()
    console.log('Calculated KPI:', {
      signedPremium: kpi.signedPremium,
      policyCount: kpi.policyCount,
      lossRatio: kpi.lossRatio,
    })

    expect(kpi.policyCount).toBeGreaterThan(0)
  })
})
