#!/usr/bin/env python3
"""
归档文档清理工具 - 分析和清理过期的归档文档

功能：
1. 扫描 archive/ 目录，分析归档文档
2. 检测文档的年龄、大小、引用关系
3. 提供清理建议
4. 支持交互式和自动清理模式
"""

import os
import re
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Set, Tuple
import argparse


class ArchiveAnalyzer:
    """归档文档分析器"""

    def __init__(self, docs_dir: str):
        self.docs_dir = Path(docs_dir)
        self.archive_dir = self.docs_dir / 'archive'
        self.archived_files: List[Dict] = []
        self.active_docs: List[Path] = []
        self.references: Dict[str, Set[str]] = {}  # 归档文件 -> 引用它的活跃文档

    def scan_archive(self):
        """扫描归档目录"""
        if not self.archive_dir.exists():
            print(f"❌ 归档目录不存在: {self.archive_dir}")
            return

        print(f"📁 扫描归档目录: {self.archive_dir}\n")

        for file_path in self.archive_dir.glob('*.md'):
            stat = file_path.stat()

            file_info = {
                'path': file_path,
                'name': file_path.name,
                'size': stat.st_size,
                'size_kb': stat.st_size / 1024,
                'created': datetime.fromtimestamp(stat.st_ctime),
                'modified': datetime.fromtimestamp(stat.st_mtime),
                'age_days': (datetime.now() - datetime.fromtimestamp(stat.st_mtime)).days
            }

            self.archived_files.append(file_info)

        print(f"✓ 找到 {len(self.archived_files)} 个归档文档\n")

    def scan_active_docs(self):
        """扫描活跃文档"""
        print("📁 扫描活跃文档...\n")

        # 扫描所有非归档的 markdown 文件
        for pattern in ['01_features/**/*.md', '02_decisions/*.md',
                       '03_technical_design/*.md', '04_refactoring/*.md', '*.md']:
            for file_path in self.docs_dir.glob(pattern):
                if 'archive' not in str(file_path):
                    self.active_docs.append(file_path)

        print(f"✓ 找到 {len(self.active_docs)} 个活跃文档\n")

    def analyze_references(self):
        """分析引用关系"""
        print("🔍 分析文档引用关系...\n")

        # 为每个归档文件初始化引用集合
        for file_info in self.archived_files:
            self.references[file_info['name']] = set()

        # 检查活跃文档中的链接
        link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

        for active_doc in self.active_docs:
            try:
                with open(active_doc, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # 查找所有链接
                    for match in link_pattern.finditer(content):
                        link_path = match.group(2)

                        # 检查是否链接到归档文件
                        if 'archive/' in link_path:
                            # 提取文件名
                            archive_file = Path(link_path).name
                            if archive_file in self.references:
                                self.references[archive_file].add(str(active_doc.relative_to(self.docs_dir)))
            except Exception as e:
                print(f"⚠️  无法读取 {active_doc}: {e}")

        # 统计被引用的文件数量
        referenced_count = sum(1 for refs in self.references.values() if refs)
        print(f"✓ 找到 {referenced_count} 个被引用的归档文件\n")

    def generate_report(self) -> Dict:
        """生成分析报告"""
        now = datetime.now()

        # 按年龄分类
        very_old = []  # > 365天
        old = []       # 180-365天
        recent = []    # < 180天

        # 按引用状态分类
        referenced = []    # 被引用的
        unreferenced = []  # 未被引用的

        # 按大小分类
        large = []     # > 100KB
        medium = []    # 10-100KB
        small = []     # < 10KB

        for file_info in self.archived_files:
            # 按年龄
            if file_info['age_days'] > 365:
                very_old.append(file_info)
            elif file_info['age_days'] > 180:
                old.append(file_info)
            else:
                recent.append(file_info)

            # 按引用
            if self.references[file_info['name']]:
                referenced.append(file_info)
            else:
                unreferenced.append(file_info)

            # 按大小
            if file_info['size_kb'] > 100:
                large.append(file_info)
            elif file_info['size_kb'] > 10:
                medium.append(file_info)
            else:
                small.append(file_info)

        return {
            'total': len(self.archived_files),
            'very_old': very_old,
            'old': old,
            'recent': recent,
            'referenced': referenced,
            'unreferenced': unreferenced,
            'large': large,
            'medium': medium,
            'small': small
        }

    def print_report(self, report: Dict):
        """打印分析报告"""
        print("=" * 70)
        print("📊 归档文档分析报告")
        print("=" * 70)
        print()

        print(f"📦 总计: {report['total']} 个归档文件\n")

        # 按年龄统计
        print("🕒 按年龄分类:")
        print(f"  - 非常旧 (>365天): {len(report['very_old'])} 个")
        print(f"  - 较旧 (180-365天): {len(report['old'])} 个")
        print(f"  - 较新 (<180天): {len(report['recent'])} 个")
        print()

        # 按引用统计
        print("🔗 按引用状态:")
        print(f"  - 被引用: {len(report['referenced'])} 个")
        print(f"  - 未被引用: {len(report['unreferenced'])} 个")
        print()

        # 按大小统计
        total_size_mb = sum(f['size_kb'] for f in self.archived_files) / 1024
        print("💾 按文件大小:")
        print(f"  - 大型文件 (>100KB): {len(report['large'])} 个")
        print(f"  - 中型文件 (10-100KB): {len(report['medium'])} 个")
        print(f"  - 小型文件 (<10KB): {len(report['small'])} 个")
        print(f"  - 总大小: {total_size_mb:.2f} MB")
        print()

        # 清理建议
        print("=" * 70)
        print("💡 清理建议")
        print("=" * 70)
        print()

        # 建议删除：超过1年且未被引用的文档
        candidates_for_deletion = [
            f for f in report['very_old']
            if f['name'] in [u['name'] for u in report['unreferenced']]
        ]

        if candidates_for_deletion:
            print(f"🗑️  建议删除 ({len(candidates_for_deletion)} 个):")
            print("   这些文档超过1年未更新且未被其他文档引用\n")
            for file_info in sorted(candidates_for_deletion, key=lambda x: x['age_days'], reverse=True):
                print(f"   • {file_info['name']}")
                print(f"     最后修改: {file_info['modified'].strftime('%Y-%m-%d')} "
                      f"({file_info['age_days']}天前)")
                print(f"     大小: {file_info['size_kb']:.1f} KB")
                print()
        else:
            print("✅ 没有明显需要删除的文档")
            print()

        # 建议保留：被引用的文档
        if report['referenced']:
            print(f"⚠️  建议保留 ({len(report['referenced'])} 个):")
            print("   这些文档被活跃文档引用，不应删除\n")
            for file_info in report['referenced']:
                refs = self.references[file_info['name']]
                print(f"   • {file_info['name']}")
                print(f"     引用自: {', '.join(refs)}")
                print()

        # 需要审查：较旧但被引用的文档
        old_referenced = [
            f for f in report['old']
            if f['name'] in [r['name'] for r in report['referenced']]
        ]

        if old_referenced:
            print(f"🔍 需要审查 ({len(old_referenced)} 个):")
            print("   这些文档较旧但仍被引用，建议检查是否需要更新或移除引用\n")
            for file_info in old_referenced:
                refs = self.references[file_info['name']]
                print(f"   • {file_info['name']}")
                print(f"     最后修改: {file_info['modified'].strftime('%Y-%m-%d')} "
                      f"({file_info['age_days']}天前)")
                print(f"     引用自: {', '.join(refs)}")
                print()

    def interactive_cleanup(self, report: Dict):
        """交互式清理"""
        candidates_for_deletion = [
            f for f in report['very_old']
            if f['name'] in [u['name'] for u in report['unreferenced']]
        ]

        if not candidates_for_deletion:
            print("✅ 没有建议删除的文档")
            return

        print("\n" + "=" * 70)
        print("🗑️  交互式清理")
        print("=" * 70)
        print()

        deleted_count = 0

        for file_info in candidates_for_deletion:
            print(f"文件: {file_info['name']}")
            print(f"  最后修改: {file_info['modified'].strftime('%Y-%m-%d')} ({file_info['age_days']}天前)")
            print(f"  大小: {file_info['size_kb']:.1f} KB")

            while True:
                response = input("\n  删除此文件? (y/n/q=退出): ").lower().strip()

                if response == 'q':
                    print(f"\n✅ 已删除 {deleted_count} 个文件")
                    return
                elif response == 'y':
                    try:
                        file_info['path'].unlink()
                        print(f"  ✓ 已删除: {file_info['name']}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"  ❌ 删除失败: {e}")
                    break
                elif response == 'n':
                    print(f"  ⊘ 保留: {file_info['name']}")
                    break
                else:
                    print("  请输入 y, n, 或 q")

            print()

        print(f"✅ 清理完成！共删除 {deleted_count} 个文件")

    def auto_cleanup(self, report: Dict, dry_run: bool = True):
        """自动清理"""
        candidates_for_deletion = [
            f for f in report['very_old']
            if f['name'] in [u['name'] for u in report['unreferenced']]
        ]

        if not candidates_for_deletion:
            print("✅ 没有建议删除的文档")
            return

        print("\n" + "=" * 70)
        print("🤖 自动清理模式")
        print("=" * 70)
        print()

        if dry_run:
            print("⚠️  DRY RUN 模式 - 不会实际删除文件\n")

        deleted_count = 0

        for file_info in candidates_for_deletion:
            print(f"{'[DRY RUN] ' if dry_run else ''}删除: {file_info['name']}")
            print(f"  最后修改: {file_info['modified'].strftime('%Y-%m-%d')} ({file_info['age_days']}天前)")

            if not dry_run:
                try:
                    file_info['path'].unlink()
                    print(f"  ✓ 已删除")
                    deleted_count += 1
                except Exception as e:
                    print(f"  ❌ 删除失败: {e}")

            print()

        if dry_run:
            print(f"📋 预计删除 {len(candidates_for_deletion)} 个文件")
            print("   使用 --auto-clean 参数实际执行删除")
        else:
            print(f"✅ 清理完成！共删除 {deleted_count} 个文件")


def main():
    parser = argparse.ArgumentParser(
        description='归档文档清理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 分析归档文档（仅报告）
  python clean_archive.py 开发文档

  # 交互式清理
  python clean_archive.py 开发文档 --interactive

  # 自动清理（dry-run）
  python clean_archive.py 开发文档 --auto-clean --dry-run

  # 自动清理（实际执行）
  python clean_archive.py 开发文档 --auto-clean
        '''
    )

    parser.add_argument('docs_dir', help='开发文档目录路径')
    parser.add_argument('--interactive', '-i', action='store_true',
                       help='交互式清理模式')
    parser.add_argument('--auto-clean', '-a', action='store_true',
                       help='自动清理模式')
    parser.add_argument('--dry-run', '-d', action='store_true',
                       help='Dry run模式（不实际删除文件）')

    args = parser.parse_args()

    if not os.path.exists(args.docs_dir):
        print(f"❌ 文档目录不存在: {args.docs_dir}")
        return 1

    print("🚀 归档文档清理工具")
    print("=" * 70)
    print()

    # 创建分析器
    analyzer = ArchiveAnalyzer(args.docs_dir)

    # 扫描文档
    analyzer.scan_archive()
    analyzer.scan_active_docs()
    analyzer.analyze_references()

    # 生成报告
    report = analyzer.generate_report()
    analyzer.print_report(report)

    # 根据参数执行清理
    if args.interactive:
        analyzer.interactive_cleanup(report)
    elif args.auto_clean:
        analyzer.auto_cleanup(report, dry_run=args.dry_run)
    else:
        print("\n💡 提示:")
        print("  - 使用 --interactive 进入交互式清理模式")
        print("  - 使用 --auto-clean --dry-run 预览自动清理")
        print("  - 使用 --auto-clean 执行自动清理")

    print("\n✨ 分析完成!")
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
