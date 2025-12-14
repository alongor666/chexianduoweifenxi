import os
import yaml
from pathlib import Path
from collections import defaultdict

DOCS_DIR = Path("开发文档")
IGNORE_DIRS = ["00_archive", "archive", "node_modules", ".git"]

def scan_ids():
    id_map = defaultdict(list)
    
    for root, dirs, files in os.walk(DOCS_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if content.startswith('---'):
                            parts = content.split('---\n', 2)
                            if len(parts) >= 3:
                                meta = yaml.safe_load(parts[1])
                                if meta and 'id' in meta:
                                    id_map[meta['id']].append(str(file_path))
                except Exception as e:
                    pass

    print("=== 重复 ID 报告 ===")
    count = 0
    for doc_id, paths in id_map.items():
        if len(paths) > 1:
            count += 1
            print(f"\nID: {doc_id}")
            for p in paths:
                print(f"  - {p}")
    
    if count == 0:
        print("未发现重复 ID。")
    else:
        print(f"\n共发现 {count} 个重复 ID。")

if __name__ == "__main__":
    scan_ids()
