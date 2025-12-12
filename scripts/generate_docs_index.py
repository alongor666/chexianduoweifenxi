#!/usr/bin/env python3
"""
开发文档索引生成脚本 - 为车险数据分析平台定制
扫描开发文档目录并生成增强的知识库索引
"""

import os
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

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

    def extract_title(self, file_path: Path) -> str:
        """从Markdown文件提取标题"""
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

    def get_file_stats(self, file_path: Path) -> Dict:
        """获取文件统计信息"""
        stat = file_path.stat()
        return {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime)
        }

    def extract_tags(self, file_path: Path) -> List[str]:
        """从文件中提取标签（frontmatter 和 hashtags）"""
        tags = set()

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

                # 1. 提取 YAML frontmatter 中的标签
                if lines and lines[0].strip() == '---':
                    in_frontmatter = True
                    for i, line in enumerate(lines[1:], 1):
                        if line.strip() == '---':
                            break
                        # tags: [tag1, tag2] 或 tags: tag1, tag2
                        if line.strip().startswith('tags:'):
                            tags_str = line.split(':', 1)[1].strip()
                            # 移除方括号
                            tags_str = tags_str.strip('[]')
                            # 分割并清理
                            for tag in tags_str.split(','):
                                tag = tag.strip().strip('"\'')
                                if tag:
                                    tags.add(tag)

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
                self.stats['features'] += 1
                self.stats['total_files'] += 1

                title = self.extract_title(readme)
                summary = self.extract_summary(readme)
                stats = self.get_file_stats(readme)
                tags = self.extract_tags(readme)
                links = self.extract_links(readme)

                relative_path = str(readme.relative_to(self.docs_dir))

                feature_entry = {
                    'id': feature_dir.name,
                    'title': title,
                    'summary': summary,
                    'path': relative_path,
                    'modified': stats['modified'],
                    'tags': tags
                }

                self.index['features'].append(feature_entry)

                # 更新标签索引
                for tag in tags:
                    if tag not in self.tags_index:
                        self.tags_index[tag] = []
                    self.tags_index[tag].append({
                        'title': title,
                        'path': relative_path,
                        'type': 'feature'
                    })

                # 更新依赖关系
                if links:
                    self.dependencies[relative_path] = links

                # 检查是否是最近更新的
                if (datetime.now() - stats['modified']).days < 30:
                    self.index['recent_updates'].append({
                        'type': 'feature',
                        'title': title,
                        'path': relative_path,
                        'modified': stats['modified']
                    })

    def scan_decisions(self):
        """扫描02_decisions目录"""
        decisions_dir = self.docs_dir / '02_decisions'
        if not decisions_dir.exists():
            return

        for md_file in sorted(decisions_dir.glob('*.md')):
            self.stats['decisions'] += 1
            self.stats['total_files'] += 1

            title = self.extract_title(md_file)
            summary = self.extract_summary(md_file)
            stats = self.get_file_stats(md_file)
            tags = self.extract_tags(md_file)
            links = self.extract_links(md_file)

            relative_path = str(md_file.relative_to(self.docs_dir))

            decision_entry = {
                'file': md_file.name,
                'title': title,
                'summary': summary,
                'path': relative_path,
                'modified': stats['modified'],
                'tags': tags
            }

            self.index['decisions'].append(decision_entry)

            # 更新标签索引
            for tag in tags:
                if tag not in self.tags_index:
                    self.tags_index[tag] = []
                self.tags_index[tag].append({
                    'title': title,
                    'path': relative_path,
                    'type': 'decision'
                })

            # 更新依赖关系
            if links:
                self.dependencies[relative_path] = links

            if (datetime.now() - stats['modified']).days < 30:
                self.index['recent_updates'].append({
                    'type': 'decision',
                    'title': title,
                    'path': relative_path,
                    'modified': stats['modified']
                })

    def scan_technical(self):
        """扫描03_technical_design目录"""
        tech_dir = self.docs_dir / '03_technical_design'
        if not tech_dir.exists():
            return

        for md_file in sorted(tech_dir.glob('*.md')):
            self.stats['technical_docs'] += 1
            self.stats['total_files'] += 1

            title = self.extract_title(md_file)
            summary = self.extract_summary(md_file)
            stats = self.get_file_stats(md_file)
            tags = self.extract_tags(md_file)
            links = self.extract_links(md_file)

            relative_path = str(md_file.relative_to(self.docs_dir))

            tech_entry = {
                'file': md_file.name,
                'title': title,
                'summary': summary,
                'path': relative_path,
                'modified': stats['modified'],
                'tags': tags
            }

            self.index['technical'].append(tech_entry)

            # 更新标签索引
            for tag in tags:
                if tag not in self.tags_index:
                    self.tags_index[tag] = []
                self.tags_index[tag].append({
                    'title': title,
                    'path': relative_path,
                    'type': 'technical'
                })

            # 更新依赖关系
            if links:
                self.dependencies[relative_path] = links

            if (datetime.now() - stats['modified']).days < 30:
                self.index['recent_updates'].append({
                    'type': 'technical',
                    'title': title,
                    'path': relative_path,
                    'modified': stats['modified']
                })

    def scan_refactoring(self):
        """扫描04_refactoring目录"""
        refactor_dir = self.docs_dir / '04_refactoring'
        if not refactor_dir.exists():
            return

        for md_file in sorted(refactor_dir.glob('*.md')):
            self.stats['refactoring_docs'] += 1
            self.stats['total_files'] += 1

            title = self.extract_title(md_file)
            summary = self.extract_summary(md_file)
            stats = self.get_file_stats(md_file)
            tags = self.extract_tags(md_file)
            links = self.extract_links(md_file)

            relative_path = str(md_file.relative_to(self.docs_dir))

            refactor_entry = {
                'file': md_file.name,
                'title': title,
                'summary': summary,
                'path': relative_path,
                'modified': stats['modified'],
                'tags': tags
            }

            self.index['refactoring'].append(refactor_entry)

            # 更新标签索引
            for tag in tags:
                if tag not in self.tags_index:
                    self.tags_index[tag] = []
                self.tags_index[tag].append({
                    'title': title,
                    'path': relative_path,
                    'type': 'refactoring'
                })

            # 更新依赖关系
            if links:
                self.dependencies[relative_path] = links

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
                    'technical': '⚙️'
                }
                emoji = emoji_map.get(item['type'], '📄')
                content += f"- {emoji} [{item['title']}]({item['path']}) - *{time_str}*\n"
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
                content += f"### [{feature['id']}] {feature['title']}\n\n"
                content += f"- **优先级**: {priority}\n"
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
            content += "| ADR编号 | 决策标题 | 摘要 | 文档 |\n"
            content += "|---------|---------|------|------|\n"
            for decision in self.index['decisions']:
                # 提取ADR编号
                match = re.search(r'ADR-(\d+)', decision['file'])
                adr_num = match.group(1) if match else "N/A"
                summary_short = decision['summary'][:80] + '...' if len(decision['summary']) > 80 else decision['summary']
                content += f"| ADR-{adr_num} | {decision['title']} | {summary_short} | [`{decision['file']}`]({decision['path']}) |\n"
        else:
            content += "*暂无技术决策文档*\n\n"

        content += "\n---\n\n"

        # 技术设计文档
        content += "## ⚙️ 技术设计文档\n\n"
        content += "> 核心技术架构、数据模型、计算公式等\n\n"

        if self.index['technical']:
            for tech in self.index['technical']:
                content += f"### {tech['title']}\n\n"
                content += f"- **路径**: [`{tech['path']}`]({tech['path']})\n"
                if tech['summary']:
                    content += f"- **内容**: {tech['summary']}\n"
                content += f"- **最后更新**: {tech['modified'].strftime('%Y-%m-%d')}\n\n"
        else:
            content += "*暂无技术设计文档*\n\n"

        content += "---\n\n"

        # 重构文档
        content += "## 🔧 重构与优化文档\n\n"
        content += "> 架构演进、代码重构计划和最佳实践\n\n"

        if self.index['refactoring']:
            for refactor in self.index['refactoring']:
                content += f"- [{refactor['title']}]({refactor['path']})\n"
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
                        content += f"- {emoji} [{doc['title']}]({doc['path']})\n"
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

# 或使用相对路径
cd scripts
python generate_docs_index.py ../开发文档
```

---

## 🔗 相关资源

- **项目主页**: [../README.md](../README.md)
- **AI协作指南**: [../CLAUDE.md](../CLAUDE.md)
- **开发约定**: [00_conventions.md](00_conventions.md)
- **历史归档**: [archive/](archive/)

---

*本索引由 `scripts/generate_docs_index.py` 自动生成*
*如需更新，请运行: `python scripts/generate_docs_index.py 开发文档`*
'''

        return content

    def save_index(self):
        """保存索引文件"""
        index_path = self.docs_dir / 'KNOWLEDGE_INDEX.md'
        content = self.generate_index_content()

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return index_path

def main():
    import sys

    if len(sys.argv) < 2:
        print("用法: python generate_docs_index.py <开发文档目录>")
        print("示例: python generate_docs_index.py 开发文档")
        sys.exit(1)

    docs_dir = sys.argv[1]

    if not os.path.exists(docs_dir):
        print(f"❌ 文档目录不存在: {docs_dir}")
        sys.exit(1)

    print(f"🚀 开始生成知识库索引")
    print(f"📁 文档目录: {docs_dir}\n")

    # 创建索引器
    indexer = DocsIndexer(docs_dir)

    # 扫描各类文档
    print("🔍 扫描功能模块文档...")
    indexer.scan_features()
    print(f"  ✓ 找到 {indexer.stats['features']} 个功能模块")

    print("🔍 扫描技术决策文档...")
    indexer.scan_decisions()
    print(f"  ✓ 找到 {indexer.stats['decisions']} 个ADR文档")

    print("🔍 扫描技术设计文档...")
    indexer.scan_technical()
    print(f"  ✓ 找到 {indexer.stats['technical_docs']} 个技术文档")

    print("🔍 扫描重构文档...")
    indexer.scan_refactoring()
    print(f"  ✓ 找到 {indexer.stats['refactoring_docs']} 个重构文档")

    print("🔍 统计归档文档...")
    indexer.count_archived()
    print(f"  ✓ 找到 {indexer.stats['archived_docs']} 个归档文档")

    # 生成索引
    print("\n💾 生成知识库索引...")
    index_path = indexer.save_index()
    print(f"  ✅ 索引保存至: {index_path}")

    # 输出统计
    print(f"\n📊 知识库统计:")
    print(f"  - 功能模块: {indexer.stats['features']}")
    print(f"  - 技术决策: {indexer.stats['decisions']}")
    print(f"  - 技术设计: {indexer.stats['technical_docs']}")
    print(f"  - 重构文档: {indexer.stats['refactoring_docs']}")
    print(f"  - 历史归档: {indexer.stats['archived_docs']}")
    print(f"  - 活跃文档: {indexer.stats['total_files']}")
    print(f"  - 最近更新: {len(indexer.index['recent_updates'])} 个（30天内）")

    print(f"\n✨ 索引生成完成!")
    print(f"📖 查看索引: {index_path}")

    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
