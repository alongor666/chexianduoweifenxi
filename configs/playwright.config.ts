import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: path.resolve(__dirname, '../tests/e2e'), // 使用绝对路径
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'http://localhost:3000', // 添加基础 URL
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI, // CI 环境下不复用
  },
})
