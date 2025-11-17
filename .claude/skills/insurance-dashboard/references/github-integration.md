# GitHub 集成指南

## 🔗 将 Skill 连接到 GitHub 项目

### 方法 1: 使用 GitKraken (推荐)

Claude 内置了 GitKraken 工具,可以直接管理 Git 仓库。

#### 第一步: 初始化仓库

```
请帮我将这个 insurance-dashboard skill 初始化为 Git 仓库
```

Claude 会执行:
```bash
cd /mnt/skills/user/insurance-dashboard
git init
git add .
git commit -m "Initial commit: 车险业务分析仪表板 v1.0"
```

#### 第二步: 连接远程仓库

先在 GitHub 上创建一个新仓库,然后:

```
请连接到我的 GitHub 仓库: 
https://github.com/your-username/insurance-analytics
```

Claude 会执行:
```bash
git remote add origin https://github.com/your-username/insurance-analytics.git
git branch -M main
git push -u origin main
```

---

### 方法 2: 手动设置

如果你想要更多控制:

```bash
# 1. 克隆你的 GitHub 项目
git clone https://github.com/your-username/insurance-analytics.git

# 2. 复制 skill 文件到项目目录
cp -r /mnt/skills/user/insurance-dashboard/* insurance-analytics/

# 3. 提交变更
cd insurance-analytics
git add .
git commit -m "Add insurance dashboard skill"
git push
```

---

## 📁 推荐的项目结构

```
insurance-analytics/
├── README.md                    # 项目说明
├── requirements.txt             # Python 依赖
├── .gitignore                   # 忽略文件配置
│
├── skills/                      # Skills 目录
│   └── insurance-dashboard/     # 从 /mnt/skills/user/ 复制
│       ├── SKILL.md
│       ├── scripts/
│       ├── references/
│       └── assets/
│
├── data/                        # 数据目录
│   ├── raw/                     # 原始数据
│   │   └── weekly/              # 每周数据快照
│   │       ├── week_46.csv
│   │       └── week_47.csv
│   └── processed/               # 处理后数据
│
├── outputs/                     # 输出目录
│   ├── dashboards/              # HTML 仪表板
│   ├── reports/                 # PDF 报告
│   └── presentations/           # PPT 文件
│
├── notebooks/                   # Jupyter 笔记本(可选)
│   └── exploratory_analysis.ipynb
│
└── workflows/                   # 自动化脚本
    ├── weekly_update.sh
    └── deploy_dashboard.sh
```

---

## ⚙️ 自动化工作流

### 使用 GitHub Actions

创建 `.github/workflows/weekly-report.yml`:

```yaml
name: 每周业务报告

on:
  schedule:
    # 每周六 UTC 00:00 (北京时间 08:00)
    - cron: '0 0 * * 6'
  workflow_dispatch:  # 手动触发

jobs:
  generate-report:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置 Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: 安装依赖
      run: |
        pip install pandas numpy
    
    - name: 生成仪表板
      run: |
        WEEK=$(date +%V)
        python skills/insurance-dashboard/scripts/generate_dashboard.py \
          data/raw/weekly/week_${WEEK}.csv \
          comprehensive \
          > outputs/dashboards/week_${WEEK}.html
    
    - name: 提交结果
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git add outputs/
        git commit -m "Weekly report: Week $(date +%V)"
        git push
```

---

## 🚀 快速部署到 GitHub Pages

### 步骤 1: 启用 GitHub Pages

1. 进入仓库 Settings
2. 找到 Pages 设置
3. Source 选择 `main` 分支的 `/docs` 目录

### 步骤 2: 调整输出路径

```bash
# 生成到 docs 目录
python scripts/generate_dashboard.py \
  data.csv \
  comprehensive \
  --output docs/index.html
```

### 步骤 3: 提交并推送

```bash
git add docs/
git commit -m "Update dashboard"
git push
```

你的仪表板将发布在:
```
https://your-username.github.io/insurance-analytics/
```

---

## 🔄 持续集成最佳实践

### 1. 数据版本控制

使用 Git LFS 管理大型 CSV 文件:

```bash
# 安装 Git LFS
git lfs install

# 追踪 CSV 文件
git lfs track "*.csv"
git add .gitattributes
```

### 2. 自动化测试

创建 `tests/test_dashboard.py`:

```python
import pandas as pd
from scripts.generate_dashboard import InsuranceDashboard

def test_metrics_calculation():
    dashboard = InsuranceDashboard('test_data.csv')
    dashboard.load_data()
    metrics = dashboard.calculate_metrics()
    
    assert metrics['loss_ratio'] >= 0
    assert metrics['combined_ratio'] >= 0
    assert metrics['total_premium'] >= 0
```

### 3. 数据验证钩子

创建 `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# 提交前验证数据格式
python scripts/validate_data.py data/raw/weekly/*.csv

if [ $? -ne 0 ]; then
    echo "数据验证失败,请检查 CSV 格式"
    exit 1
fi
```

---

## 📊 与团队协作

### 分支策略

```
main          # 生产环境
  ├── develop # 开发环境
  │    ├── feature/nev-analysis      # 新能源车分析功能
  │    ├── feature/risk-prediction   # 风险预测模型
  │    └── hotfix/data-validation    # 数据验证修复
```

### Pull Request 模板

创建 `.github/pull_request_template.md`:

```markdown
## 变更说明
<!-- 描述这次变更的内容 -->

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 性能优化

## 测试清单
- [ ] 数据验证通过
- [ ] 本地测试通过
- [ ] 生成的仪表板正常显示

## 截图
<!-- 如果是 UI 变更,请提供截图 -->
```

---

## 🔐 环境变量管理

对于敏感配置,使用 GitHub Secrets:

```yaml
# .github/workflows/deploy.yml
env:
  DB_CONNECTION_STRING: ${{ secrets.DB_CONNECTION_STRING }}
  API_KEY: ${{ secrets.INSURANCE_API_KEY }}
```

---

## 📦 发布版本

使用语义化版本:

```bash
# 创建发布标签
git tag -a v1.0.0 -m "首次发布:完整的保险业务分析仪表板"
git push origin v1.0.0

# 创建 GitHub Release
# 在 GitHub 网站上 Releases 页面创建,附上编译好的 HTML
```

---

## 🎯 下一步行动

让 Claude 帮你:

```
请帮我:
1. 初始化 Git 仓库
2. 创建 .gitignore 文件
3. 生成 requirements.txt
4. 创建项目 README.md
5. 提交初始代码到 GitHub
```

Claude 会自动完成所有设置! 🚀
