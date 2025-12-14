#!/usr/bin/env python3
"""
开发记录维护脚本 v2.1
1. 验证开发记录表中的链接有效性
2. 统计开发记录表中的任务进度
3. [NEW] 扫描全库散落的待办事项
"""

import re
import os
from pathlib import Path

def check_links(file_path):
    """检查Markdown文件中的链接是否有效"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return

    content = Path(file_path).read_text(encoding='utf-8')
    base_dir = os.path.dirname(file_path)
    
    # 匹配链接 [text](path)
    # 使用排除字符集来避免过度匹配
    links = re.findall(r'\[([^\[\]\n]+)\]\(([^)\n]+)\)', content)
    
    broken_links = []
    valid_links = 0
    
    print(f"🔍 正在检查 {len(links)} 个链接...")
    
    for text, link in links:
        if link.startswith('http') or link.startswith('#') or link.startswith('mailto:'):
            continue
            
        # 处理相对路径
        clean_link = link.split('#')[0].split('?')[0].strip()
        full_path = os.path.normpath(os.path.join(base_dir, clean_link))
        
        if not os.path.exists(full_path):
            broken_links.append((text, link))
        else:
            valid_links += 1
            
    if broken_links:
        print(f"\n❌ 发现 {len(broken_links)} 个失效链接:")
        for text, link in broken_links:
            print(f"  - [{text}]({link})")
    else:
        print("\n✅ 所有本地链接均有效！")
        
    print(f"✅ 有效链接数: {valid_links}")

def count_tasks(file_path):
    """统计任务状态"""
    content = Path(file_path).read_text(encoding='utf-8')
    
    done = len(re.findall(r'-\s*\[[xX]\]', content))
    todo = len(re.findall(r'-\s*\[\s\]', content))
    
    print(f"\n📊 [开发记录表] 任务统计:")
    print(f"  ✅ 已完成: {done}")
    print(f"  ⬜ 待办: {todo}")
    if (done + todo) > 0:
        print(f"  📈 完成率: {done / (done + todo) * 100:.1f}%")
    else:
        print("  📈 完成率: N/A")

def scan_scattered_tasks(docs_dir, exclude_files):
    """扫描散落的待办事项"""
    print(f"\n🔍 开始全库扫描待办事项 (排除 archive 和 开发记录表)...")
    
    total_todos = 0
    file_count = 0
    exclude_paths = [os.path.abspath(f) for f in exclude_files]
    
    for root, dirs, files in os.walk(docs_dir):
        # 排除 archive 目录
        if 'archive' in dirs:
            dirs.remove('archive')
            
        for file in files:
            if not file.endswith('.md'):
                continue
                
            full_path = os.path.join(root, file)
            # 排除指定文件
            if os.path.abspath(full_path) in exclude_paths:
                continue
                
            try:
                content = Path(full_path).read_text(encoding='utf-8')
                # 匹配 - [ ] 且排除模板占位符
                todos = re.findall(r'-\s*\[\s\]\s*([^{}\n]+)', content)
                todos = [t.strip() for t in todos if t.strip()] # 过滤空行
                
                if todos:
                    file_count += 1
                    total_todos += len(todos)
                    rel_path = os.path.relpath(full_path, docs_dir)
                    print(f"\n📄 {rel_path} ({len(todos)}个):")
                    for todo in todos[:3]: # 只显示前3个
                        print(f"  - [ ] {todo[:60]}..." if len(todo) > 60 else f"  - [ ] {todo}")
                    if len(todos) > 3:
                        print(f"  ... 等 {len(todos)-3} 个")
                        
            except Exception as e:
                print(f"无法读取文件 {file}: {e}")

    print(f"\n📊 全库散落任务统计:")
    print(f"  在 {file_count} 个活跃文档中发现了 {total_todos} 个待办事项。")
    print("  建议将这些高优先级的任务迁移至 [开发记录表.md]。")

if __name__ == "__main__":
    target_file = "开发文档/开发记录表.md"
    docs_dir = "开发文档"
    
    print(f"🚀 开始分析开发记录表: {target_file}\n")
    check_links(target_file)
    count_tasks(target_file)
    
    scan_scattered_tasks(docs_dir, [target_file])