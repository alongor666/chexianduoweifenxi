import { expect, test } from '@playwright/test'
import { parseGoalCsv } from '../../src/utils/csvParser'
import { useGoalStore, resetGoalStore, KNOWN_BUSINESS_TYPES } from '../../src/store/goalStore'

const formatCsv = (records: Array<{ bizType: string; value: number }>) => {
  const lines = ['业务类型,年度目标（万）']
  for (const record of records) {
    lines.push(`${record.bizType},${record.value}`)
  }
  return `${lines.join('\n')}\n`
}

test.beforeEach(() => {
  resetGoalStore()
})

test('import tuned goals, switch version and export CSV', async () => {
  const initialRows = useGoalStore.getState().getInitialVersion().rows
  const tunedRows = initialRows.map(row => ({
    bizType: row.bizType,
    value: row.annualTargetInit + 100,
  }))
  const csv = formatCsv(tunedRows)

  const parseResult = parseGoalCsv(csv, {
    knownBusinessTypes: KNOWN_BUSINESS_TYPES,
  })

  const { versionId } = useGoalStore
    .getState()
    .createTunedVersion(parseResult.rows, new Date('2025-10-21T00:00:00.000Z'))

  expect(versionId).toContain('微调目标')
  expect(useGoalStore.getState().currentVersionId).toBe(versionId)

  const exported = useGoalStore.getState().exportCurrentVersionCsv()
  expect(exported).toContain('车险整体,43200')
  expect(exported.split('\n').length).toBe(initialRows.length + 2)

  const initialVersionId = `${useGoalStore.getState().baseYear}-年初目标`
  useGoalStore.getState().switchVersion(initialVersionId)
  expect(useGoalStore.getState().currentVersionId).toBe(initialVersionId)
})
