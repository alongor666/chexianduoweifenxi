import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // 改为jsdom以支持localStorage等浏览器API
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['./configs/vitest.setup.mts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
})
