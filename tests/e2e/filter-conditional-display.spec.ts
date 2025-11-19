/**
 * E2E 测试：评级筛选器的条件显示逻辑
 * 验证不同车辆类型下评级筛选器的显示/隐藏行为
 */

import { test, expect } from '@playwright/test'

test.describe('评级筛选器条件显示', () => {
  test.beforeEach(async ({ page }) => {
    // 假设应用运行在 localhost:3000
    await page.goto('http://localhost:3001')

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')
  })

  test('初始状态：未选择任何筛选条件时，所有评级选项都应显示', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')

    // 等待对话框打开
    await page.waitForSelector('[role="dialog"]')

    // 验证所有评级筛选器都可见
    await expect(page.locator('text=车险分等级')).toBeVisible()
    await expect(page.locator('text=高速风险等级')).toBeVisible()
    await expect(page.locator('text=小货车评分')).toBeVisible()
    await expect(page.locator('text=大货车评分')).toBeVisible()
  })

  test('选择客车类别后，应只显示客车相关评级', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 选择客户分类：非营业个人客车
    const customerCategoryButton = page.locator('button:has-text("选择客户分类")')
    await customerCategoryButton.click()

    // 选择"非营业个人客车"
    await page.click('text=非营业个人客车')

    // 关闭下拉菜单（点击外部）
    await page.keyboard.press('Escape')

    // 等待状态更新
    await page.waitForTimeout(500)

    // 验证客车评级可见
    await expect(page.locator('text=车险分等级')).toBeVisible()
    await expect(page.locator('text=高速风险等级')).toBeVisible()

    // 验证货车评级不可见
    await expect(page.locator('text=小货车评分')).not.toBeVisible()
    await expect(page.locator('text=大货车评分')).not.toBeVisible()
  })

  test('选择小货车业务类型后，应只显示小货车评级', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 切换到产品维度筛选
    // 选择业务类型：2-9吨营业货车
    const businessTypeButton = page.locator('button:has-text("选择业务类型")')
    await businessTypeButton.click()

    // 选择"2-9吨营业货车"
    await page.click('text=2-9吨营业货车')

    // 关闭下拉菜单
    await page.keyboard.press('Escape')

    // 等待状态更新
    await page.waitForTimeout(500)

    // 验证小货车评级可见
    await expect(page.locator('text=小货车评分')).toBeVisible()

    // 验证其他评级不可见
    await expect(page.locator('text=车险分等级')).not.toBeVisible()
    await expect(page.locator('text=高速风险等级')).not.toBeVisible()
    await expect(page.locator('text=大货车评分')).not.toBeVisible()
  })

  test('选择大货车业务类型后，应只显示大货车评级', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 选择业务类型：10吨以上-普货
    const businessTypeButton = page.locator('button:has-text("选择业务类型")')
    await businessTypeButton.click()

    // 选择"10吨以上-普货"
    await page.click('text=10吨以上-普货')

    // 关闭下拉菜单
    await page.keyboard.press('Escape')

    // 等待状态更新
    await page.waitForTimeout(500)

    // 验证大货车评级可见
    await expect(page.locator('text=大货车评分')).toBeVisible()

    // 验证其他评级不可见
    await expect(page.locator('text=车险分等级')).not.toBeVisible()
    await expect(page.locator('text=高速风险等级')).not.toBeVisible()
    await expect(page.locator('text=小货车评分')).not.toBeVisible()
  })

  test('混合选择客车和货车后，应显示所有相关评级', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 选择客户分类：非营业个人客车
    const customerCategoryButton = page.locator('button:has-text("选择客户分类")')
    await customerCategoryButton.click()
    await page.click('text=非营业个人客车')
    await page.keyboard.press('Escape')

    // 选择业务类型：2-9吨营业货车
    const businessTypeButton = page.locator('button:has-text("选择业务类型")')
    await businessTypeButton.click()
    await page.click('text=2-9吨营业货车')
    await page.keyboard.press('Escape')

    // 等待状态更新
    await page.waitForTimeout(500)

    // 验证客车和小货车评级都可见
    await expect(page.locator('text=车险分等级')).toBeVisible()
    await expect(page.locator('text=高速风险等级')).toBeVisible()
    await expect(page.locator('text=小货车评分')).toBeVisible()

    // 大货车评级不应显示
    await expect(page.locator('text=大货车评分')).not.toBeVisible()
  })

  test('清空筛选条件后，应恢复显示所有评级', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 选择一个筛选条件
    const businessTypeButton = page.locator('button:has-text("选择业务类型")')
    await businessTypeButton.click()
    await page.click('text=出租车')
    await page.keyboard.press('Escape')

    // 验证只显示客车评级
    await expect(page.locator('text=车险分等级')).toBeVisible()
    await expect(page.locator('text=小货车评分')).not.toBeVisible()

    // 点击"重置全部"按钮
    const resetButton = page.locator('button:has-text("重置全部")')
    if (await resetButton.isVisible()) {
      await resetButton.click()
    }

    // 等待状态更新
    await page.waitForTimeout(500)

    // 验证所有评级都重新显示
    await expect(page.locator('text=车险分等级')).toBeVisible()
    await expect(page.locator('text=高速风险等级')).toBeVisible()
    await expect(page.locator('text=小货车评分')).toBeVisible()
    await expect(page.locator('text=大货车评分')).toBeVisible()
  })

  test('对话框应该只有一个关闭按钮', async ({ page }) => {
    // 打开"更多筛选"对话框
    await page.click('button:has-text("更多筛选")')
    await page.waitForSelector('[role="dialog"]')

    // 查找所有关闭按钮
    const closeButtons = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has(svg):has-text("")')

    // 验证只有一个关闭按钮
    await expect(closeButtons).toHaveCount(1)

    // 验证关闭按钮可以正常工作
    await closeButtons.first().click()

    // 验证对话框已关闭
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})
