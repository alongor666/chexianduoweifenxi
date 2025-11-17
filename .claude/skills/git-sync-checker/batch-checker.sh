#!/bin/bash
# Git Sync Checker - 批量检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认值
SEARCH_DIR="${1:-.}"
MAX_DEPTH=3
OUTPUT_FORMAT="${2:-text}"  # text, markdown, json

echo "🔍 扫描 Git 仓库..."
echo "目录: $SEARCH_DIR"
echo ""

# 查找所有 Git 仓库
REPOS=$(find "$SEARCH_DIR" -maxdepth $MAX_DEPTH -type d -name ".git" 2>/dev/null | sed 's/\/.git$//')

if [ -z "$REPOS" ]; then
    echo -e "${RED}❌ 未找到任何 Git 仓库${NC}"
    exit 1
fi

REPO_COUNT=$(echo "$REPOS" | wc -l | tr -d ' ')
echo "找到 $REPO_COUNT 个仓库"
echo ""

# 统计计数器
CLEAN_COUNT=0
WARN_COUNT=0
ERROR_COUNT=0

# 存储结果
declare -a RESULTS

# 检查函数
check_repo() {
    local repo_path=$1
    local repo_name=$(basename "$repo_path")
    
    cd "$repo_path"
    
    # 获取基本信息
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local remote=$(git remote | head -n 1 || echo "none")
    
    # 检查工作区状态
    local status=$(git status --porcelain 2>/dev/null)
    local uncommitted=0
    if [ -n "$status" ]; then
        uncommitted=$(echo "$status" | wc -l | tr -d ' ')
    fi
    
    # 检查未推送提交
    local unpushed=0
    if [ "$remote" != "none" ] && git rev-parse --verify $remote/$branch &>/dev/null; then
        git fetch $remote --quiet 2>/dev/null || true
        unpushed=$(git log $remote/$branch..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
    fi
    
    # 检查远程更新
    local unpulled=0
    if [ "$remote" != "none" ] && git rev-parse --verify $remote/$branch &>/dev/null; then
        unpulled=$(git log HEAD..$remote/$branch --oneline 2>/dev/null | wc -l | tr -d ' ')
    fi
    
    # 检查敏感文件
    local sensitive=""
    if echo "$status" | grep -qE "\.env$|\.key$|\.pem$|\.secret"; then
        sensitive="⚠️ 有敏感文件"
    fi
    
    # 判断状态
    local status_icon="✅"
    local status_text="已同步"
    local needs_action=false
    
    if [ $uncommitted -gt 0 ] || [ $unpushed -gt 0 ] || [ $unpulled -gt 0 ] || [ -n "$sensitive" ]; then
        if [ $uncommitted -gt 0 ] || [ -n "$sensitive" ]; then
            status_icon="🔴"
            status_text="需要立即处理"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        else
            status_icon="⚠️"
            status_text="需要处理"
            WARN_COUNT=$((WARN_COUNT + 1))
        fi
        needs_action=true
    else
        CLEAN_COUNT=$((CLEAN_COUNT + 1))
    fi
    
    # 存储结果
    RESULTS+=("{\"path\":\"$repo_path\",\"name\":\"$repo_name\",\"branch\":\"$branch\",\"status\":\"$status_text\",\"uncommitted\":$uncommitted,\"unpushed\":$unpushed,\"unpulled\":$unpulled,\"sensitive\":\"$sensitive\"}")
    
    # 输出（根据格式）
    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo -e "${status_icon} ${BLUE}$repo_name${NC} ($branch)"
        if [ "$needs_action" = true ]; then
            [ $uncommitted -gt 0 ] && echo "   📝 $uncommitted 个未提交文件"
            [ $unpushed -gt 0 ] && echo "   ⬆️  $unpushed 个未推送提交"
            [ $unpulled -gt 0 ] && echo "   ⬇️  $unpulled 个未拉取提交"
            [ -n "$sensitive" ] && echo "   $sensitive"
        fi
        echo ""
    fi
}

# 处理每个仓库
ORIGINAL_DIR=$(pwd)

if [ "$OUTPUT_FORMAT" = "markdown" ]; then
    echo "# Git 仓库批量检查报告"
    echo ""
    echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "检查目录: $SEARCH_DIR"
    echo ""
    echo "## 概览"
    echo ""
fi

while IFS= read -r repo; do
    check_repo "$repo"
done <<< "$REPOS"

cd "$ORIGINAL_DIR"

# 输出总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 检查完成"
echo ""
echo "总计: $REPO_COUNT 个仓库"
echo -e "${GREEN}✅ 已同步: $CLEAN_COUNT${NC}"
echo -e "${YELLOW}⚠️ 需要处理: $WARN_COUNT${NC}"
echo -e "${RED}🔴 需要立即处理: $ERROR_COUNT${NC}"

# JSON 输出
if [ "$OUTPUT_FORMAT" = "json" ]; then
    echo "{"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"search_dir\": \"$SEARCH_DIR\","
    echo "  \"total\": $REPO_COUNT,"
    echo "  \"clean\": $CLEAN_COUNT,"
    echo "  \"warning\": $WARN_COUNT,"
    echo "  \"error\": $ERROR_COUNT,"
    echo "  \"repositories\": ["
    
    first=true
    for result in "${RESULTS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo "    $result"
    done
    
    echo ""
    echo "  ]"
    echo "}"
fi

# Markdown 输出
if [ "$OUTPUT_FORMAT" = "markdown" ]; then
    echo ""
    echo "## 详细信息"
    echo ""
    echo "| 仓库 | 分支 | 状态 | 未提交 | 未推送 | 未拉取 |"
    echo "|------|------|------|--------|--------|--------|"
    
    while IFS= read -r repo; do
        cd "$repo"
        local repo_name=$(basename "$repo")
        local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        local status=$(git status --porcelain 2>/dev/null)
        local uncommitted=$(echo "$status" | wc -l | tr -d ' ')
        
        local remote=$(git remote | head -n 1 || echo "none")
        local unpushed=0
        local unpulled=0
        
        if [ "$remote" != "none" ] && git rev-parse --verify $remote/$branch &>/dev/null; then
            git fetch $remote --quiet 2>/dev/null || true
            unpushed=$(git log $remote/$branch..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
            unpulled=$(git log HEAD..$remote/$branch --oneline 2>/dev/null | wc -l | tr -d ' ')
        fi
        
        local status_icon="✅"
        [ $uncommitted -gt 0 ] || [ $unpushed -gt 0 ] || [ $unpulled -gt 0 ] && status_icon="⚠️"
        
        echo "| $repo_name | $branch | $status_icon | $uncommitted | $unpushed | $unpulled |"
        
        cd "$ORIGINAL_DIR"
    done <<< "$REPOS"
    
    echo ""
    echo "## 快速操作"
    echo ""
    echo "### 一键推送所有未推送的提交"
    echo '```bash'
    
    while IFS= read -r repo; do
        cd "$repo"
        local branch=$(git branch --show-current 2>/dev/null)
        local remote=$(git remote | head -n 1)
        
        if [ "$remote" != "none" ] && git rev-parse --verify $remote/$branch &>/dev/null; then
            git fetch $remote --quiet 2>/dev/null || true
            local unpushed=$(git log $remote/$branch..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
            
            if [ $unpushed -gt 0 ]; then
                echo "cd $repo && git push $remote $branch"
            fi
        fi
        
        cd "$ORIGINAL_DIR"
    done <<< "$REPOS"
    
    echo '```'
fi
