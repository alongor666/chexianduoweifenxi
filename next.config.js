/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出模式 - 生成纯静态 HTML/CSS/JS
  output: 'export',

  // 静态导出时禁用图片优化（或使用 unoptimized: true）
  images: {
    unoptimized: true,
  },

  // ESLint 检查配置
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer}) => {
    // DuckDB-WASM 仅在客户端使用，服务器端需要排除
    if (!isServer) {
      // 客户端：配置 fallback 避免 Node.js 模块错误
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      }
    } else {
      // 服务器端：完全排除 DuckDB 模块
      config.externals = [
        ...config.externals,
        '@duckdb/duckdb-wasm',
      ]
    }

    // 支持 WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },
}

module.exports = nextConfig
