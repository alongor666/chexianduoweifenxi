#!/bin/bash
# Git Sync Checker - .gitignore 优化脚本

set -e

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 检查 .gitignore 配置..."
echo ""

# 检测项目类型
detect_project_type() {
    if [ -f "package.json" ]; then
        if grep -q "next" package.json; then
            echo "nextjs"
        elif grep -q "react-native" package.json; then
            echo "react-native"
        elif grep -q "react" package.json; then
            echo "react"
        elif grep -q "vue" package.json; then
            echo "vue"
        elif grep -q "angular" package.json; then
            echo "angular"
        else
            echo "nodejs"
        fi
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
        if [ -f "manage.py" ]; then
            echo "django"
        elif [ -f "app.py" ] || [ -f "wsgi.py" ]; then
            echo "flask"
        else
            echo "python"
        fi
    elif [ -f "go.mod" ]; then
        echo "golang"
    elif [ -f "Cargo.toml" ]; then
        echo "rust"
    elif [ -f "pom.xml" ]; then
        echo "java-maven"
    elif [ -f "build.gradle" ]; then
        echo "java-gradle"
    elif [ -f "Gemfile" ]; then
        echo "ruby"
    elif [ -f "composer.json" ]; then
        echo "php"
    else
        echo "unknown"
    fi
}

PROJECT_TYPE=$(detect_project_type)

echo -e "${BLUE}项目类型: $PROJECT_TYPE${NC}"
echo ""

# 检查当前 .gitignore
if [ -f ".gitignore" ]; then
    echo "✅ 找到 .gitignore 文件"
    CURRENT_RULES=$(cat .gitignore)
else
    echo "⚠️ 未找到 .gitignore 文件"
    CURRENT_RULES=""
fi

echo ""

# 推荐规则
get_recommended_rules() {
    local type=$1
    
    case $type in
        nextjs|react|vue|angular|nodejs)
            cat <<'EOF'
# 依赖
node_modules/
.pnp/
.pnp.js
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# 测试
coverage/
.nyc_output/

# 构建产物
build/
dist/
out/
.next/
.nuxt/
.vuepress/dist/

# 缓存
.cache/
.parcel-cache/
.eslintcache
.stylelintcache

# 环境变量
.env
.env*.local
.env.production

# 日志
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# 系统文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/

# Vercel
.vercel/

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF
            ;;
        python|django|flask)
            cat <<'EOF'
# Byte-compiled / optimized
__pycache__/
*.py[cod]
*$py.class

# 虚拟环境
venv/
env/
ENV/
.venv

# Distribution
build/
dist/
*.egg-info/
*.egg

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# Flask
instance/
.webassets-cache

# 测试
.pytest_cache/
.coverage
htmlcov/

# Jupyter
.ipynb_checkpoints

# 环境变量
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# 系统文件
.DS_Store
EOF
            ;;
        golang)
            cat <<'EOF'
# 二进制文件
*.exe
*.exe~
*.dll
*.so
*.dylib

# 测试
*.test
*.out

# 依赖
vendor/

# Go 工作区
go.work

# IDE
.vscode/
.idea/
*.swp

# 系统文件
.DS_Store
EOF
            ;;
        rust)
            cat <<'EOF'
# 编译产物
/target/
**/*.rs.bk

# Cargo
Cargo.lock

# IDE
.vscode/
.idea/
*.swp

# 系统文件
.DS_Store
EOF
            ;;
        java-maven|java-gradle)
            cat <<'EOF'
# 编译产物
target/
build/
*.class

# 日志
*.log

# Maven
.mvn/
mvnw
mvnw.cmd

# Gradle
.gradle/
gradle/
gradlew
gradlew.bat

# IDE
.idea/
.vscode/
*.iml
*.ipr
*.iws
.project
.classpath
.settings/

# 系统文件
.DS_Store
EOF
            ;;
        *)
            cat <<'EOF'
# 系统文件
.DS_Store
.DS_Store?
._*
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# 日志
*.log

# 环境变量
.env
.env.local
EOF
            ;;
    esac
}

# 检查不该提交的文件
check_sensitive_files() {
    echo "🔍 检查敏感文件..."
    
    local sensitive_patterns=(
        "\.env$"
        "\.env\.local$"
        "\.env\.production$"
        ".*\.key$"
        ".*\.pem$"
        ".*\.p12$"
        ".*\.secret$"
        "id_rsa"
        "id_dsa"
        "config/database\.yml"
        "config/secrets\.yml"
    )
    
    local found_sensitive=false
    
    for pattern in "${sensitive_patterns[@]}"; do
        local files=$(git ls-files | grep -E "$pattern" || true)
        if [ -n "$files" ]; then
            if [ "$found_sensitive" = false ]; then
                echo ""
                echo -e "${RED}⚠️ 发现已跟踪的敏感文件:${NC}"
                found_sensitive=true
            fi
            echo "$files" | while read -r file; do
                echo "  - $file"
            done
        fi
    done
    
    if [ "$found_sensitive" = true ]; then
        echo ""
        echo "💡 清理建议:"
        echo "  git rm --cached <文件名>"
        echo "  # 将文件添加到 .gitignore"
        echo "  git commit -m \"chore: 移除敏感文件\""
    else
        echo -e "${GREEN}✅ 未发现已跟踪的敏感文件${NC}"
    fi
    
    echo ""
}

# 检查不该提交的大文件
check_large_files() {
    echo "🔍 检查大文件 (>5MB)..."
    
    local found_large=false
    
    git ls-files -z | while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            if [ $size -gt 5242880 ]; then  # 5MB
                if [ "$found_large" = false ]; then
                    echo ""
                    echo -e "${YELLOW}⚠️ 发现大文件:${NC}"
                    found_large=true
                fi
                local size_mb=$(echo "scale=2; $size/1024/1024" | bc)
                echo "  - $file (${size_mb}MB)"
            fi
        fi
    done
    
    if [ "$found_large" = false ]; then
        echo -e "${GREEN}✅ 未发现大文件${NC}"
    else
        echo ""
        echo "💡 建议:"
        echo "  - 使用 Git LFS 管理大文件"
        echo "  - 或将大文件添加到 .gitignore"
    fi
    
    echo ""
}

# 生成优化建议
generate_recommendations() {
    echo "📝 .gitignore 优化建议"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    RECOMMENDED=$(get_recommended_rules "$PROJECT_TYPE")
    
    # 检查缺失的规则
    local missing_rules=""
    while IFS= read -r rule; do
        # 跳过空行和注释
        [[ -z "$rule" || "$rule" =~ ^[[:space:]]*# ]] && continue
        
        # 检查规则是否存在
        if ! echo "$CURRENT_RULES" | grep -qF "$rule"; then
            missing_rules="$missing_rules$rule"$'\n'
        fi
    done <<< "$RECOMMENDED"
    
    if [ -n "$missing_rules" ]; then
        echo -e "${YELLOW}建议添加的规则:${NC}"
        echo ""
        echo "$RECOMMENDED"
        echo ""
        echo "💡 应用优化:"
        echo "  1. 手动添加上述规则到 .gitignore"
        echo "  2. 或运行: cat >> .gitignore <<'EOF'"
        echo "$RECOMMENDED"
        echo "EOF"
    else
        echo -e "${GREEN}✅ 当前 .gitignore 配置良好${NC}"
    fi
}

# 执行检查
check_sensitive_files
check_large_files
generate_recommendations

# 生成报告文件
if [ "$1" = "--save-report" ]; then
    REPORT_FILE="gitignore-report-$(date +%Y%m%d-%H%M%S).md"
    
    {
        echo "# .gitignore 检查报告"
        echo ""
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "项目类型: $PROJECT_TYPE"
        echo ""
        echo "## 当前配置"
        echo '```'
        echo "$CURRENT_RULES"
        echo '```'
        echo ""
        echo "## 推荐配置"
        echo '```'
        get_recommended_rules "$PROJECT_TYPE"
        echo '```'
    } > "$REPORT_FILE"
    
    echo ""
    echo "✅ 报告已保存: $REPORT_FILE"
fi
