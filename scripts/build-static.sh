#!/bin/bash

# 车险分析平台 - 静态构建脚本
# 用于本地构建和预览静态部署版本

set -e  # 遇到错误时退出

echo "========================================="
echo "  车险分析平台 - 静态构建"
echo "========================================="
echo ""

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: pnpm 未安装"
    echo "请运行: npm install -g pnpm"
    exit 1
fi

echo "✓ 检测到 pnpm"
echo ""

# 设置环境变量
export NEXT_PUBLIC_DEPLOY_MODE=static
export NEXT_PUBLIC_DATA_SOURCE=local
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

echo "📦 安装依赖..."
pnpm install

echo ""
echo "🏗️  构建静态文件..."
echo "   - 部署模式: $NEXT_PUBLIC_DEPLOY_MODE"
echo "   - 数据源: $NEXT_PUBLIC_DATA_SOURCE"
echo ""

pnpm build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "  ✅ 构建成功！"
    echo "========================================="
    echo ""
    echo "静态文件位置: ./out/"
    echo ""
    echo "本地预览选项:"
    echo "  1. npx serve out"
    echo "  2. python3 -m http.server 8000 -d out"
    echo ""
    echo "部署选项:"
    echo "  - GitHub Pages: 推送到 main 分支自动部署"
    echo "  - Vercel: vercel --prod"
    echo "  - Netlify: netlify deploy --prod --dir=out"
    echo "  - 自托管: 将 out/ 目录内容复制到 Web 服务器"
    echo ""
else
    echo ""
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
