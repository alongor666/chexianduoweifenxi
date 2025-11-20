/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,

  // 图片优化配置
  images: {
    unoptimized: true, // 静态导出时需要
  },

  // ESLint 配置
  eslint: {
    // 在构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },

  // TypeScript 配置
  typescript: {
    // 在构建时忽略TypeScript错误（谨慎使用）
    ignoreBuildErrors: false,
  },

  // 安全头配置
  // 注意：静态导出模式下，这些 headers 不会自动生效
  // 需要在托管平台（GitHub Pages/Netlify/Vercel）层面配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // GitHub Pages 部署时的基础路径
  basePath: process.env.NODE_ENV === 'production' ? '/insuralytics' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/insuralytics/' : '',

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
  },
};

export default nextConfig;
