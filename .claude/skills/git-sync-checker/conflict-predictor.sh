#!/bin/bash
# Git Sync Checker - 冲突预测脚本

set -e

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)

# 获取远程仓库名
REMOTE_NAME=$(git remote | head -n 1)

if [ -z "$REMOTE_NAME" ]; then
    echo -e "${RED}❌ 未找到远程仓库${NC}"
    exit 1
fi

echo "🔍 正在分析冲突风险..."
echo "分支: $CURRENT_BRANCH"
echo "远程: $REMOTE_NAME"
echo ""

# 获取远程更新（不拉取）
git fetch $REMOTE_NAME --quiet

# 检查上游分支是否存在
if ! git rev-parse --verify $REMOTE_NAME/$CURRENT_BRANCH &>/dev/null; then
    echo -e "${YELLOW}⚠️ 远程分支 $REMOTE_NAME/$CURRENT_BRANCH 不存在${NC}"
    echo "建议: git push -u $REMOTE_NAME $CURRENT_BRANCH"
    exit 0
fi

# 找到共同祖先
BASE_COMMIT=$(git merge-base HEAD $REMOTE_NAME/$CURRENT_BRANCH)

# 获取本地和远程修改的文件
LOCAL_FILES=$(git diff --name-only $BASE_COMMIT HEAD | sort)
REMOTE_FILES=$(git diff --name-only $BASE_COMMIT $REMOTE_NAME/$CURRENT_BRANCH | sort)

# 找出共同修改的文件
COMMON_FILES=$(comm -12 <(echo "$LOCAL_FILES") <(echo "$REMOTE_FILES"))
COMMON_COUNT=$(echo "$COMMON_FILES" | grep -c . || echo "0")

# 计算修改行数
LOCAL_LINES=$(git diff $BASE_COMMIT HEAD --numstat | awk '{sum+=$1+$2} END {print sum+0}')
REMOTE_LINES=$(git diff $BASE_COMMIT $REMOTE_NAME/$CURRENT_BRANCH --numstat | awk '{sum+=$1+$2} END {print sum+0}')

# 计算冲突分数
CONFLICT_SCORE=0

# 共同修改文件 +30 分/个
CONFLICT_SCORE=$((CONFLICT_SCORE + COMMON_COUNT * 30))

# 本地修改行数 >100 +20 分
if [ $LOCAL_LINES -gt 100 ]; then
    CONFLICT_SCORE=$((CONFLICT_SCORE + 20))
fi

# 远程修改行数 >100 +20 分
if [ $REMOTE_LINES -gt 100 ]; then
    CONFLICT_SCORE=$((CONFLICT_SCORE + 20))
fi

# 检查关键文件（package.json, requirements.txt 等）
CRITICAL_FILES=$(echo "$COMMON_FILES" | grep -E "package\.json|requirements\.txt|go\.mod|Cargo\.toml|pom\.xml" || true)
if [ -n "$CRITICAL_FILES" ]; then
    CONFLICT_SCORE=$((CONFLICT_SCORE + 25))
fi

# 输出风险评估
echo "📊 冲突风险评估"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "共同修改文件: $COMMON_COUNT 个"
echo "本地修改行数: $LOCAL_LINES 行"
echo "远程修改行数: $REMOTE_LINES 行"
echo "冲突分数: $CONFLICT_SCORE 分"
echo ""

# 显示风险等级
if [ $CONFLICT_SCORE -lt 30 ]; then
    echo -e "${GREEN}🟢 低风险${NC} - 合并应该很顺利"
    RISK_LEVEL="low"
elif [ $CONFLICT_SCORE -lt 70 ]; then
    echo -e "${YELLOW}🟡 中风险${NC} - 可能需要手动解决部分冲突"
    RISK_LEVEL="medium"
else
    echo -e "${RED}🔴 高风险${NC} - 很可能遇到冲突，建议备份"
    RISK_LEVEL="high"
fi

echo ""

# 如果有共同修改文件，详细列出
if [ $COMMON_COUNT -gt 0 ]; then
    echo "⚠️ 可能冲突的文件:"
    echo "$COMMON_FILES" | while read -r file; do
        if [ -n "$file" ]; then
            # 计算该文件的修改行数
            local_changes=$(git diff $BASE_COMMIT HEAD -- "$file" | grep -c "^[+-]" || echo "0")
            remote_changes=$(git diff $BASE_COMMIT $REMOTE_NAME/$CURRENT_BRANCH -- "$file" | grep -c "^[+-]" || echo "0")
            
            echo "  - $file"
            echo "    本地: $local_changes 行 | 远程: $remote_changes 行"
        fi
    done
    echo ""
fi

# 提供建议
echo "💡 建议操作:"

if [ "$RISK_LEVEL" = "low" ]; then
    echo "  git pull $REMOTE_NAME $CURRENT_BRANCH"
elif [ "$RISK_LEVEL" = "medium" ]; then
    echo "  # 先备份当前分支"
    echo "  git branch backup-$(date +%Y%m%d-%H%M)"
    echo "  "
    echo "  # 拉取并合并"
    echo "  git pull $REMOTE_NAME $CURRENT_BRANCH"
else
    echo "  # 1. 备份当前分支"
    echo "  git branch backup-$(date +%Y%m%d-%H%M)"
    echo "  "
    echo "  # 2. 使用交互式 rebase（推荐）"
    echo "  git fetch $REMOTE_NAME"
    echo "  git rebase -i $REMOTE_NAME/$CURRENT_BRANCH"
    echo "  "
    echo "  # 或者使用 merge"
    echo "  git merge $REMOTE_NAME/$CURRENT_BRANCH"
    echo "  "
    echo "  # 3. 如果遇到冲突，逐个解决后"
    echo "  git rebase --continue  # 或 git merge --continue"
fi

# 输出 JSON 格式（供其他工具使用）
if [ "$1" = "--json" ]; then
    cat <<EOF
{
  "branch": "$CURRENT_BRANCH",
  "remote": "$REMOTE_NAME",
  "common_files": $COMMON_COUNT,
  "local_changes": $LOCAL_LINES,
  "remote_changes": $REMOTE_LINES,
  "conflict_score": $CONFLICT_SCORE,
  "risk_level": "$RISK_LEVEL"
}
EOF
fi
