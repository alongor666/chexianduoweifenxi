#!/usr/bin/env python3
"""
知识库索引生成脚本
自动扫描知识库内容并生成README索引
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List

class KnowledgeBaseIndexer:
    """知识库索引器"""
    
    def __init__(self, kb_path: str):
        self.kb_path = Path(kb_path)
        self.stats = {
            'docs': 0,
            'decisions': 0,
            'code_patterns': 0,
            'configs': 0
        }
        self.index = {
            'documents': [],
            'decisions': [],
            'code_patterns': [],
            'configs': [],
            'tags': {}
        }
    
    def extract_frontmatter(self, file_path: Path) -> Dict:
        """提取Markdown文件的YAML frontmatter"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 匹配YAML frontmatter
            match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not match:
                return {}
            
            frontmatter = {}
            yaml_content = match.group(1)
            
            for line in yaml_content.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # 处理标签数组
                    if key == '标签' and value.startswith('['):
                        tags = re.findall(r'\w+', value)
                        frontmatter[key] = tags
                    else:
                        frontmatter[key] = value
            
            return frontmatter
        
        except Exception as e:
            print(f"  ⚠️ 提取frontmatter失败 {file_path}: {e}")
            return {}
    
    def scan_documents(self):
        """扫描docs目录"""
        docs_dir = self.kb_path / 'docs'
        if not docs_dir.exists():
            return
        
        for md_file in docs_dir.glob('*.md'):
            self.stats['docs'] += 1
            
            metadata = self.extract_frontmatter(md_file)
            doc_entry = {
                'file': str(md_file.relative_to(self.kb_path)),
                'name': md_file.stem,
                'type': metadata.get('文档类型', '未分类'),
                'created': metadata.get('创建日期', ''),
                'updated': metadata.get('更新日期', ''),
                'tags': metadata.get('标签', [])
            }
            
            self.index['documents'].append(doc_entry)
            
            # 收集标签
            for tag in doc_entry['tags']:
                if tag not in self.index['tags']:
                    self.index['tags'][tag] = []
                self.index['tags'][tag].append(doc_entry['file'])
    
    def scan_decisions(self):
        """扫描decisions目录"""
        decisions_dir = self.kb_path / 'decisions'
        if not decisions_dir.exists():
            return
        
        for md_file in decisions_dir.glob('*.md'):
            self.stats['decisions'] += 1
            
            decision_entry = {
                'file': str(md_file.relative_to(self.kb_path)),
                'name': md_file.stem,
                'created': md_file.stat().st_mtime
            }
            
            self.index['decisions'].append(decision_entry)
    
    def scan_patterns(self):
        """扫描patterns目录"""
        patterns_dir = self.kb_path / 'patterns'
        if not patterns_dir.exists():
            return
        
        # 扫描代码模式
        code_dir = patterns_dir / 'code'
        if code_dir.exists():
            for json_file in code_dir.glob('*.json'):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        patterns = json.load(f)
                        self.stats['code_patterns'] += len(patterns)
                        
                        for pattern in patterns:
                            self.index['code_patterns'].append({
                                'name': pattern.get('name', '未命名'),
                                'file': pattern.get('file', ''),
                                'signature': pattern.get('signature', '')
                            })
                except Exception as e:
                    print(f"  ⚠️ 读取代码模式失败 {json_file}: {e}")
        
        # 扫描配置模板
        config_dir = patterns_dir / 'configs'
        if config_dir.exists():
            for json_file in config_dir.glob('*.json'):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        configs = json.load(f)
                        self.stats['configs'] += len(configs)
                        
                        for config in configs:
                            self.index['configs'].append({
                                'file': config.get('file', ''),
                                'type': config.get('type', ''),
                            })
                except Exception as e:
                    print(f"  ⚠️ 读取配置模板失败 {json_file}: {e}")
    
    def generate_readme(self) -> str:
        """生成README.md"""
        readme = f'''# 项目知识库

> 索引更新于 {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 📁 目录结构

```
{self.kb_path.name}/
├── docs/                  # 项目文档 ({self.stats['docs']}个)
├── decisions/             # 技术决策 ({self.stats['decisions']}条)
├── patterns/              # 可复用模式
│   ├── code/             # 代码模式 ({self.stats['code_patterns']}个)
│   └── configs/          # 配置模板 ({self.stats['configs']}个)
└── reports/              # 分析报告
```

## 📋 文档索引

### 项目文档

'''
        # 添加文档列表
        for doc in self.index['documents']:
            readme += f"- [{doc['name']}]({doc['file']}) - {doc['type']}\n"
            if doc['tags']:
                tags_str = ', '.join([f'`#{tag}`' for tag in doc['tags']])
                readme += f"  - 标签: {tags_str}\n"
            if doc['updated']:
                readme += f"  - 最后更新: {doc['updated']}\n"
        
        readme += "\n### 技术决策\n\n"
        
        if self.index['decisions']:
            for dec in self.index['decisions']:
                readme += f"- [{dec['name']}]({dec['file']})\n"
        else:
            readme += "*尚未提取技术决策，运行 `extract_patterns.py` 后自动生成*\n"
        
        readme += "\n### 代码模式\n\n"
        
        if self.index['code_patterns']:
            # 只展示前10个
            for pattern in self.index['code_patterns'][:10]:
                readme += f"- `{pattern['name']}` - 来自 `{pattern['file']}`\n"
            
            if len(self.index['code_patterns']) > 10:
                readme += f"\n*共 {len(self.index['code_patterns'])} 个代码模式，查看 patterns/code/ 获取完整列表*\n"
        else:
            readme += "*尚未提取代码模式，运行 `extract_patterns.py` 后自动生成*\n"
        
        readme += "\n## 🏷️ 标签索引\n\n"
        
        if self.index['tags']:
            for tag, files in sorted(self.index['tags'].items()):
                readme += f"### #{tag}\n"
                for file in files:
                    readme += f"- [{Path(file).stem}]({file})\n"
                readme += "\n"
        else:
            readme += "*文档中尚未使用标签*\n"
        
        readme += f'''
## 📊 知识库统计

- 项目文档: {self.stats['docs']}
- 技术决策: {self.stats['decisions']}
- 代码模式: {self.stats['code_patterns']}
- 配置模板: {self.stats['configs']}
- 标签数量: {len(self.index['tags'])}
- 最后更新: {datetime.now().strftime("%Y-%m-%d")}

---

**使用说明**: 
- 本索引由 `generate_index.py` 自动生成
- 修改文档后运行 `python scripts/generate_index.py <知识库路径>` 更新索引
- 通过 `project-knowledge-base` Skill 管理知识库
'''
        
        return readme
    
    def save_readme(self):
        """保存README.md"""
        readme_path = self.kb_path / 'README.md'
        readme_content = self.generate_readme()
        
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        return readme_path

def main():
    if len(sys.argv) < 2:
        print("用法: python generate_index.py <知识库目录>")
        print("示例: python generate_index.py /home/claude/kb")
        sys.exit(1)
    
    kb_path = sys.argv[1]
    
    if not os.path.exists(kb_path):
        print(f"❌ 知识库目录不存在: {kb_path}")
        sys.exit(1)
    
    print(f"🚀 开始生成知识库索引")
    print(f"📁 知识库路径: {kb_path}\n")
    
    # 创建索引器
    indexer = KnowledgeBaseIndexer(kb_path)
    
    # 扫描各目录
    print("🔍 扫描文档...")
    indexer.scan_documents()
    
    print("🔍 扫描技术决策...")
    indexer.scan_decisions()
    
    print("🔍 扫描可复用模式...")
    indexer.scan_patterns()
    
    # 生成README
    print("\n💾 生成README索引...")
    readme_path = indexer.save_readme()
    print(f"  ✅ README保存至: {readme_path}")
    
    # 输出统计
    print(f"\n📊 知识库统计:")
    print(f"  - 项目文档: {indexer.stats['docs']}")
    print(f"  - 技术决策: {indexer.stats['decisions']}")
    print(f"  - 代码模式: {indexer.stats['code_patterns']}")
    print(f"  - 配置模板: {indexer.stats['configs']}")
    print(f"  - 标签数量: {len(indexer.index['tags'])}")
    
    print(f"\n✨ 索引生成完成!")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
