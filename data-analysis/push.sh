#!/bin/bash

# 判断是否输入了提交信息
if [ -z "$1" ]; then
  echo "❌ 请输入提交信息，例如：./push.sh \"更新了KPI模块\""
  exit 1
fi

# 添加所有改动
git add .

# 提交并附上用户输入的说明
git commit -m "$1"

# 推送到 main 分支
git push origin main

echo "✅ 代码已成功推送到远程仓库 main 分支！"