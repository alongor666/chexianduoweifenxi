#!/usr/bin/env python3
"""
开发文档索引生成脚本 - 为车险数据分析平台定制
扫描开发文档目录并生成增强的知识库索引
"""

import os
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any

class DocsIndexer:
    """文档索引器 - 适配车险项目文档结构"""

    def __init__(self, docs_dir: str):
        self.docs_dir = Path(docs_dir)
        self.stats = {
            'features': 0,
            'decisions': 0,
            'technical_docs': 0,
            'refactoring_docs': 0,
            'archived_docs': 0,
            'total_files': 0
        }
        self.index = {
            'features': [],
            'decisions': [],
            'technical': [],
            'refactoring': [],
            'recent_updates': []
        }
        # 新增：标签索引 {tag: [文档列表]}
        self.tags_index: Dict[str, List[Dict]] = {}
        # 新增：文档依赖关系 {文档: [它引用的文档列表]}
        self.dependencies: Dict[str, List[str]] = {}

    def extract_frontmatter(self, file_path: Path) -> Dict[str, Any]:
        """提取 YAML Frontmatter 元数据"""
        metadata = {
            'id': '',
            'title': '',
            'author': '',
            'status': '',
            'created_at': '',
            'updated_at': '',
            'tags': [],
            'domain': '',
            'complexity': ''
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
                if not lines or lines[0].strip() != '---':
                    return metadata
                
                for line in lines[1:]:
                    if line.strip() == '---':
                        break
                    
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        if key == 'tags':
                            # 处理 [tag1, tag2]
                            value = value.strip('[]')
                            tags = [t.strip().strip('"\'') for t in value.split(',') if t.strip()]
                            metadata['tags'] = tags
                        else:
                            metadata[key] = value
                            
        except Exception as e:
            pass
            
        return metadata

    def extract_title(self, file_path: Path, metadata: Dict = {}) -> str:
        """从Markdown文件提取标题，优先使用 metadata"""
        if metadata and metadata.get('title'):
            return metadata['title']
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('# '):
                        return line[2:].strip()
                    elif line.startswith('## '):
                        return line[3:].strip()
            return file_path.stem
        except:
            return file_path.stem

    def extract_summary(self, file_path: Path, max_lines: int = 5) -> str:
        """提取文件的简短摘要"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = []
                in_frontmatter = False
                skip_count = 0

                for line in f:
                    line = line.strip()

                    # 跳过YAML frontmatter
                    if line == '---':
                        if not in_frontmatter:
                            in_frontmatter = True
                            continue
                        else:
                            in_frontmatter = False
                            continue

                    if in_frontmatter:
                        continue

                    # 跳过标题行
                    if line.startswith('#'):
                        skip_count += 1
                        if skip_count > 1:
                            continue
                        continue

                    # 跳过空行
                    if not line:
                        continue

                    # 跳过分隔线
                    if line.startswith('---') or line.startswith('==='):
                        continue

                    # 收集有效内容
                    if len(lines) < max_lines:
                        lines.append(line)
                    else:
                        break

                return ' '.join(lines)[:200] + '...' if lines else ''
        except:
            return ''

    def get_file_stats(self, file_path: Path, metadata: Dict = {}) -> Dict:
        """获取文件统计信息，优先使用 metadata 中的 updated_at"""
        stat = file_path.stat()
        stats = {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime)
        }
        
        if metadata and metadata.get('updated_at'):
            try:
                # 尝试解析 YYYY-MM-DD
                dt = datetime.strptime(metadata['updated_at'], '%Y-%m-%d')
                stats['modified'] = dt
            except:
                pass
                
        return stats

    def extract_tags(self, file_path: Path, metadata: Dict = {}) -> List[str]:
        """从文件中提取标签（frontmatter 和 hashtags）"""
        tags = set()
        
        # 1. 从 metadata 中获取
        if metadata and metadata.get('tags'):
            for tag in metadata['tags']:
                tags.add(tag)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # 2. 提取文档中的 hashtags (#标签)
                hashtag_pattern = re.compile(r'#(\w+[\u4e00-\u9fa5\w]*)')
                for match in hashtag_pattern.finditer(content):
                    tag = match.group(1)
                    # 排除一些常见的非标签用法（如标题）
                    if not tag.isdigit():  # 不是纯数字
                        tags.add(tag)

        except Exception as e:
            pass

        return sorted(list(tags))

    def extract_links(self, file_path: Path) -> List[str]:
        """提取文档中的所有链接"""
        links = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

                # 提取 Markdown 链接 [text](path)
                link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
                for match in link_pattern.finditer(content):
                    link_path = match.group(2)

                    # 只保留相对路径链接（文档内链接）
                    if not link_path.startswith('http') and link_path.endswith('.md'):
                        # 规范化路径
                        if link_path.startswith('./') or link_path.startswith('../'):
                            links.append(link_path)
                        else:
                            links.append(link_path)

        except Exception as e:
            pass

        return links
        
    def get_status_emoji(self, status: str) -> str:
        """获取状态对应的 emoji"""
        status_map = {
            'stable': '✅',
            'draft': '🚧',
            'review': '👀',
            'deprecated': '❌',
            'archived': '📦'
        }
        return status_map.get(status.lower(), '📄') if status else '📄'

    def extract_related_code(self, file_path: Path, metadata: Dict = {}) -> List[str]:
        """提取关联代码 (related_code)"""
        code_files = []
        if metadata and metadata.get('related_code'):
            if isinstance(metadata['related_code'], list):
                code_files = metadata['related_code']
            elif isinstance(metadata['related_code'], str):
                code_files = [metadata['related_code']]
        return code_files

    def process_file(self, file_path: Path, category: str, category_list: List):
        """通用文件处理逻辑"""
        # 映射 category 到 stats key
        stats_key_map = {
            'feature': 'features',
            'decision': 'decisions',
            'technical': 'technical_docs',
            'refactoring': 'refactoring_docs'
        }
        stats_key = stats_key_map.get(category)
        if stats_key:
            self.stats[stats_key] += 1

        self.stats['total_files'] += 1

        metadata = self.extract_frontmatter(file_path)
        title = self.extract_title(file_path, metadata)
        summary = self.extract_summary(file_path)
        stats = self.get_file_stats(file_path, metadata)
        tags = self.extract_tags(file_path, metadata)
        links = self.extract_links(file_path)
        related_code = self.extract_related_code(file_path, metadata)

        relative_path = str(file_path.relative_to(self.docs_dir))
        
        # 确定 ID
        doc_id = metadata.get('id') or file_path.stem

        status_value = metadata.get('status', '')
        entry = {
            'id': doc_id,
            'file': file_path.name,
            'title': title,
            'summary': summary,
            'path': relative_path,
            'modified': stats['modified'],
            'tags': tags,
            'status': status_value,
            'author': metadata.get('author', ''),
            'domain': metadata.get('domain', ''),
            'type': category,
            'related_code': related_code
        }

        category_list.append(entry)

        # 更新标签索引
        for tag in tags:
            if tag not in self.tags_index:
                self.tags_index[tag] = []
            self.tags_index[tag].append({
                'title': title,
                'path': relative_path,
                'type': category,
                'status': status_value
            })

        # 更新依赖关系
        if links:
            self.dependencies[relative_path] = links

        # 检查是否是最近更新的
        if (datetime.now() - stats['modified']).days < 30:
            self.index['recent_updates'].append({
                'type': category,
                'title': title,
                'path': relative_path,
                'modified': stats['modified'],
                'status': status_value
            })

    def scan_features(self):
        """扫描01_features目录"""
        features_dir = self.docs_dir / '01_features'
        if not features_dir.exists():
            return

        for feature_dir in sorted(features_dir.iterdir()):
            if not feature_dir.is_dir():
                continue

            readme = feature_dir / 'README.md'
            if readme.exists():
                self.process_file(readme, 'feature', self.index['features'])

    def scan_decisions(self):
        """扫描02_decisions目录"""
        decisions_dir = self.docs_dir / '02_decisions'
        if not decisions_dir.exists():
            return

        for md_file in sorted(decisions_dir.glob('*.md')):
            self.process_file(md_file, 'decision', self.index['decisions'])

    def scan_technical(self):
        """扫描03_technical_design目录"""
        tech_dir = self.docs_dir / '03_technical_design'
        if not tech_dir.exists():
            return

        for md_file in sorted(tech_dir.glob('*.md')):
            self.process_file(md_file, 'technical', self.index['technical'])

    def scan_refactoring(self):
        """扫描04_refactoring目录"""
        refactor_dir = self.docs_dir / '04_refactoring'
        if not refactor_dir.exists():
            return

        for md_file in sorted(refactor_dir.glob('*.md')):
            self.process_file(md_file, 'refactoring', self.index['refactoring'])

    def count_archived(self):
        """统计归档文档数量"""
        archive_dir = self.docs_dir / 'archive'
        if archive_dir.exists():
            self.stats['archived_docs'] = len(list(archive_dir.glob('*.md')))

    def generate_index_content(self) -> str:
        """生成索引内容"""
        content = f'''# 车险数据分析平台 - 知识库索引

> 📅 最后更新: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
> 🔄 自动生成 by `scripts/generate_docs_index.py`

---

## 📊 知识库概览

| 类别 | 数量 | 说明 |
|------|------|------|
| 🎯 功能模块 | {self.stats['features']} | 产品功能文档（P0/P1/P2优先级） |
| 🏗️ 技术决策 | {self.stats['decisions']} | ADR架构决策记录 |
| ⚙️ 技术设计 | {self.stats['technical_docs']} | 数据架构、计算公式、技术栈 |
| 🔧 重构文档 | {self.stats['refactoring_docs']} | 架构优化和重构计划 |
| 📦 历史归档 | {self.stats['archived_docs']} | 旧版本文档归档 |
| **📝 总计** | **{self.stats['total_files']}** | **活跃文档总数** |

---

## 🔥 最近更新（30天内）

'''
        # 按修改时间排序最近更新
        recent = sorted(self.index['recent_updates'], key=lambda x: x['modified'], reverse=True)

        if recent:
            for item in recent[:10]:  # 显示最近10个
                days_ago = (datetime.now() - item['modified']).days
                time_str = f"{days_ago}天前" if days_ago > 0 else "今天"
                emoji_map = {
                    'feature': '🎯',
                    'decision': '🏗️',
                    'technical': '⚙️',
                    'refactoring': '🔧'
                }
                emoji = emoji_map.get(item['type'], '📄')
                status_emoji = self.get_status_emoji(item.get('status'))
                
                content += f"- {emoji} {status_emoji} [{item['title']}]({item['path']}) - *{time_str}*\n"
        else:
            content += "*暂无最近更新*\n"

        content += "\n---\n\n"

        # 功能模块索引
        content += "## 🎯 功能模块文档\n\n"
        content += "> 按功能ID排序，包含开发状态和优先级\n\n"

        if self.index['features']:
            for feature in self.index['features']:
                # 提取优先级（从ID中）
                priority = "P0" if "F001" in feature['id'] or "F002" in feature['id'] or "F003" in feature['id'] or "F004" in feature['id'] else "P1/P2"
                status_emoji = self.get_status_emoji(feature.get('status'))
                
                content += f"### {status_emoji} [{feature['id']}] {feature['title']}\n\n"
                content += f"- **优先级**: {priority}\n"
                if feature.get('status'):
                    content += f"- **状态**: {feature['status']}\n"
                content += f"- **路径**: [`{feature['path']}`]({feature['path']})\n"
                if feature['summary']:
                    content += f"- **说明**: {feature['summary']}\n"
                content += f"- **最后更新**: {feature['modified'].strftime('%Y-%m-%d')}\n\n"
        else:
            content += "*暂无功能文档*\n\n"

        content += "---\n\n"

        # 技术决策索引
        content += "## 🏗️ 技术决策记录（ADR）\n\n"
        content += "> Architecture Decision Records - 记录关键技术选型和设计决策\n\n"

        if self.index['decisions']:
            content += "| 状态 | ADR编号 | 决策标题 | 摘要 | 文档 |\n"
            content += "|------|---------|---------|------|------|\n"
            for decision in self.index['decisions']:
                # 提取ADR编号
                match = re.search(r'ADR-(\d+)', decision['file'])
                adr_num = match.group(1) if match else "N/A"
                summary_short = decision['summary'][:60] + '...' if len(decision['summary']) > 60 else decision['summary']
                status_emoji = self.get_status_emoji(decision.get('status'))
                
                content += f"| {status_emoji} | ADR-{adr_num} | {decision['title']} | {summary_short} | [`{decision['file']}`]({decision['path']}) |\n"
        else:
            content += "*暂无技术决策文档*\n\n"

        content += "\n---\n\n"

        # 技术设计文档
        content += "## ⚙️ 技术设计文档\n\n"
        content += "> 核心技术架构、数据模型、计算公式等\n\n"

        if self.index['technical']:
            content += "| 状态 | 域 | 标题 | 内容 | 路径 |\n"
            content += "|------|----|------|------|------|\n"
            for tech in self.index['technical']:
                status_emoji = self.get_status_emoji(tech.get('status'))
                domain = tech.get('domain', '-') or '-'
                summary_short = tech['summary'][:50] + '...' if len(tech['summary']) > 50 else tech['summary']
                
                content += f"| {status_emoji} | {domain} | {tech['title']} | {summary_short} | [`{tech['path']}`]({tech['path']}) |\n"
        else:
            content += "*暂无技术设计文档*\n\n"

        content += "\n---\n\n"

        # 重构文档
        content += "## 🔧 重构与优化文档\n\n"
        content += "> 架构演进、代码重构计划和最佳实践\n\n"

        if self.index['refactoring']:
            for refactor in self.index['refactoring']:
                status_emoji = self.get_status_emoji(refactor.get('status'))
                content += f"- {status_emoji} [{refactor['title']}]({refactor['path']})\n"
        else:
            content += "*暂无重构文档*\n\n"

        content += "\n---\n\n"

        # 标签索引
        content += "## 🏷️ 标签索引\n\n"
        content += "> 按标签快速查找相关文档\n\n"

        if self.tags_index:
            # 按标签文档数量排序
            sorted_tags = sorted(self.tags_index.items(), key=lambda x: len(x[1]), reverse=True)

            # 显示热门标签（文档数 >= 2）
            popular_tags = [(tag, docs) for tag, docs in sorted_tags if len(docs) >= 2]

            if popular_tags:
                content += "### 热门标签\n\n"
                for tag, docs in popular_tags[:15]:  # 显示前15个热门标签
                    content += f"**#{tag}** ({len(docs)}个文档)\n"
                    for doc in docs:
                        emoji_map = {
                            'feature': '🎯',
                            'decision': '🏗️',
                            'technical': '⚙️',
                            'refactoring': '🔧'
                        }
                        emoji = emoji_map.get(doc['type'], '📄')
                        status_emoji = self.get_status_emoji(doc.get('status') or '')
                        content += f"- {emoji} {status_emoji} [{doc['title']}]({doc['path']})\n"
                    content += "\n"

            # 所有标签（字母序）
            content += "### 所有标签\n\n"
            content += "| 标签 | 文档数 | 文档列表 |\n"
            content += "|------|--------|----------|\n"

            for tag, docs in sorted(sorted_tags, key=lambda x: x[0]):
                doc_links = ', '.join([f"[{doc['title']}]({doc['path']})" for doc in docs[:3]])
                if len(docs) > 3:
                    doc_links += f" 等{len(docs)}个"
                content += f"| #{tag} | {len(docs)} | {doc_links} |\n"

            content += "\n"
        else:
            content += "*暂无标签*\n\n"

        content += "---\n\n"

        # 文档依赖关系图
        content += "## 🔗 文档依赖关系图\n\n"
        content += "> 显示文档之间的引用关系\n\n"

        if self.dependencies:
            # 统计被引用最多的文档
            referenced_count: Dict[str, int] = {}
            for source, targets in self.dependencies.items():
                for target in targets:
                    # 规范化路径
                    normalized = target.replace('../', '').replace('./', '')
                    referenced_count[normalized] = referenced_count.get(normalized, 0) + 1

            # 显示核心文档（被引用3次以上）
            core_docs = [(path, count) for path, count in referenced_count.items() if count >= 3]

            if core_docs:
                content += "### 🌟 核心文档（被引用≥3次）\n\n"
                for path, count in sorted(core_docs, key=lambda x: x[1], reverse=True):
                    content += f"- `{path}` - 被引用 **{count}** 次\n"
                content += "\n"

            # 显示引用关系
            content += "### 文档引用关系\n\n"
            content += "<details>\n<summary>点击展开完整引用关系</summary>\n\n"

            for source, targets in sorted(self.dependencies.items()):
                content += f"**{source}** 引用:\n"
                for target in targets:
                    content += f"  - `{target}`\n"
                content += "\n"

            content += "</details>\n\n"
        else:
            content += "*暂无文档引用关系*\n\n"

        content += "---\n\n"

        # 使用指南
        content += '''## 📖 使用指南

### 快速导航

1. **新手入门** → 阅读 [README.md](README.md) 了解项目概览
2. **开发协作** → 查看 [00_conventions.md](00_conventions.md) 理解"代码优先"原则
3. **功能开发** → 浏览 `01_features/` 目录找到对应功能文档
4. **技术选型** → 参考 `02_decisions/` 中的ADR文档
5. **架构设计** → 查阅 `03_technical_design/` 了解技术架构
6. **历史查询** → 搜索 `archive/` 目录查找旧版本文档

### 文档维护规范

✅ **必须做的事情**：
- 代码变更后立即更新对应功能文档
- 重大技术决策创建新的ADR文档
- 每次功能发布前运行 `python scripts/generate_docs_index.py 开发文档`

❌ **禁止做的事情**：
- 基于"记忆"而非代码标记功能状态
- 保留与代码实现不符的过期文档
- 直接修改自动生成的索引文件

### 更新索引

```bash
# 扫描开发文档并重新生成索引
python scripts/generate_docs_index.py 开发文档
```
'''
        return content

    def run(self):
        """执行索引生成流程"""
        print(f"正在扫描文档目录: {self.docs_dir}")
        
        self.scan_features()
        self.scan_decisions()
        self.scan_technical()
        self.scan_refactoring()
        self.count_archived()
        
        content = self.generate_index_content()
        
        output_file = self.docs_dir / 'KNOWLEDGE_INDEX.md'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"索引生成完成! 已保存至: {output_file}")
        print(f"总计扫描文件: {self.stats['total_files']}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python generate_docs_index.py <docs_dir>")
        sys.exit(1)
        
    docs_dir = sys.argv[1]
    indexer = DocsIndexer(docs_dir)
    indexer.run()
