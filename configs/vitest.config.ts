import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // 改为jsdom以支持localStorage等浏览器API
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**', // 排除 Playwright E2E 测试
      '**/*.spec.ts', // 排除 .spec.ts 文件（专用于 Playwright）
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        'configs/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'), // 修正路径，因为配置在 configs/ 目录
    },
  },
})
