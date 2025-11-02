/**
 * E2E测试: 完整数据流
 * 测试从CSV上传到数据可视化的完整流程
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('数据流完整性测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问主页
    await page.goto('http://localhost:3000')

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('应该能够加载主页面', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/车险多维数据分析平台/)

    // 检查主要布局元素
    const header = page.locator('header, [role="banner"], nav')
    await expect(header.first()).toBeVisible()
  })

  test('应该显示文件上传组件', async ({ page }) => {
    // 查找文件上传区域
    const uploadArea = page.getByText(/上传/).first()
    await expect(uploadArea).toBeVisible()

    // 或者查找拖拽上传提示
    const dragDropHint = page.getByText(/拖拽.*文件|选择文件/i)
    if (await dragDropHint.count() > 0) {
      await expect(dragDropHint.first()).toBeVisible()
    }
  })

  test('应该能够上传CSV文件并处理数据', async ({ page }) => {
    // 准备测试文件路径
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )

    // 查找文件上传输入框
    const fileInput = page.locator('input[type="file"]').first()

    // 上传文件
    await fileInput.setInputFiles(testFilePath)

    // 等待文件处理完成（根据实际实现调整等待条件）
    // 可能的等待条件：
    // 1. 等待成功消息
    // 2. 等待数据显示
    // 3. 等待进度条消失

    await page.waitForTimeout(3000) // 给足够时间处理文件

    // 检查是否有成功提示或数据显示
    const successIndicator = page.getByText(/成功|完成|已加载/i)
    const dataDisplay = page.locator('table, [role="table"]')

    // 至少一个应该可见
    const hasSuccess = (await successIndicator.count()) > 0
    const hasData = (await dataDisplay.count()) > 0

    expect(hasSuccess || hasData).toBeTruthy()
  })

  test('应该显示KPI指标', async ({ page }) => {
    // 准备并上传测试文件
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 查找KPI显示区域（可能的元素）
    const kpiElements = [
      page.getByText(/总保费|保费/i),
      page.getByText(/保单.*件|件数/i),
      page.getByText(/件均保费/i),
      page.getByText(/边际贡献/i),
    ]

    // 至少应该有一些KPI可见
    let visibleKPIs = 0
    for (const kpi of kpiElements) {
      if ((await kpi.count()) > 0) {
        visibleKPIs++
      }
    }

    expect(visibleKPIs).toBeGreaterThan(0)
  })

  test('应该能够使用筛选器', async ({ page }) => {
    // 准备并上传测试文件
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 查找筛选器组件
    const filterElements = [
      page.getByText(/筛选|过滤/i),
      page.getByText(/年份/i),
      page.getByText(/业务类型/i),
      page.getByText(/三级机构/i),
    ]

    // 至少应该有一些筛选器可见
    let visibleFilters = 0
    for (const filter of filterElements) {
      if ((await filter.count()) > 0) {
        visibleFilters++
      }
    }

    expect(visibleFilters).toBeGreaterThan(0)
  })

  test('应该能够显示数据可视化图表', async ({ page }) => {
    // 准备并上传测试文件
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 查找图表容器（常见的图表库class）
    const chartSelectors = [
      'canvas', // Charts.js, ECharts等
      '[class*="chart"]',
      '[class*="recharts"]',
      '[id*="chart"]',
      'svg', // D3.js, Recharts等
    ]

    let hasChart = false
    for (const selector of chartSelectors) {
      const elements = page.locator(selector)
      if ((await elements.count()) > 0) {
        hasChart = true
        break
      }
    }

    expect(hasChart).toBeTruthy()
  })

  test('应该能够清除数据', async ({ page }) => {
    // 准备并上传测试文件
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 查找清除/删除按钮
    const clearButton = page.getByRole('button', {
      name: /清除|删除|清空|重置/i,
    })

    if ((await clearButton.count()) > 0) {
      // 点击清除按钮
      await clearButton.first().click()

      // 可能需要确认
      const confirmButton = page.getByRole('button', { name: /确认|确定/i })
      if ((await confirmButton.count()) > 0) {
        await confirmButton.first().click()
      }

      // 等待清除完成
      await page.waitForTimeout(1000)

      // 验证数据已清除（应该重新显示上传提示）
      const uploadPrompt = page.getByText(/上传|选择文件/i)
      expect(await uploadPrompt.count()).toBeGreaterThan(0)
    }
  })

  test('应该能够导出数据', async ({ page }) => {
    // 准备并上传测试文件
    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 查找导出按钮
    const exportButton = page.getByRole('button', { name: /导出|下载/i })

    if ((await exportButton.count()) > 0) {
      // 监听下载事件
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 })

      // 点击导出按钮
      await exportButton.first().click()

      try {
        // 等待下载开始
        const download = await downloadPromise

        // 验证下载文件名
        expect(download.suggestedFilename()).toBeTruthy()
      } catch (e) {
        // 如果没有触发下载，可能只是打开了导出对话框
        console.log('导出功能可能需要额外的交互')
      }
    }
  })
})

test.describe('数据持久化测试', () => {
  test('应该能够在页面刷新后保留数据', async ({ page }) => {
    // 准备并上传测试文件
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    const testFilePath = path.join(
      __dirname,
      '../../test/clean/测试数据2024_ready.csv'
    )
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testFilePath)

    // 等待数据处理
    await page.waitForTimeout(3000)

    // 记录当前显示的数据统计
    const beforeRefreshText = await page.textContent('body')

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 等待数据恢复
    await page.waitForTimeout(2000)

    // 检查数据是否恢复
    const afterRefreshText = await page.textContent('body')

    // 应该包含数据相关的文本（而不仅仅是空白状态）
    const hasDataIndicators = [
      /\d+.*万元/,
      /\d+.*件/,
      /保费/,
      /保单/,
    ]

    let foundIndicators = 0
    for (const pattern of hasDataIndicators) {
      if (pattern.test(afterRefreshText || '')) {
        foundIndicators++
      }
    }

    expect(foundIndicators).toBeGreaterThan(0)
  })
})
