import os
import re
import yaml
from datetime import datetime
from pathlib import Path

# 定义项目根目录和文档目录
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "开发文档"

# 默认忽略的目录
IGNORE_DIRS = ["00_archive", "archive", "node_modules", ".git"]

# 领域映射
DOMAIN_MAP = {
    "product": ["requirement", "feature", "prd", "story"],
    "tech": ["technical", "architecture", "design", "refactor", "api", "schema"],
    "claims": ["claim", "loss", "赔付"],
    "policy": ["policy", "premium", "保费", "承保"],
    "finance": ["kpi", "finance", "ratio", "经营"],
}

# 类型映射
TYPE_MAP = {
    "01_features": "feature",
    "02_decisions": "decision",
    "03_technical_design": "technical",
    "04_refactoring": "refactoring",
    "专题分析系统": "analysis"
}

def get_file_stats(file_path):
    stat = file_path.stat()
    return {
        "created_at": datetime.fromtimestamp(stat.st_ctime).strftime("%Y-%m-%d"),
        "updated_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
    }

def infer_domain(content, file_path):
    # 优先根据内容关键词
    content_lower = content.lower()
    for domain, keywords in DOMAIN_MAP.items():
        for keyword in keywords:
            if keyword in content_lower:
                return domain
    
    # 其次根据路径
    path_str = str(file_path).lower()
    if "technical" in path_str or "refactor" in path_str:
        return "tech"
    if "feature" in path_str:
        return "product"
        
    return "general"

def extract_metadata_from_block(content):
    """从 Markdown 引用块提取元数据"""
    metadata = {}
    lines = content.split('\n')
    for line in lines[:20]: # 只看前20行
        if line.strip().startswith('>'):
            # 尝试匹配 key: value
            match = re.search(r'> \*\*?(.+?)\*\*?:\s*(.+)', line)
            if match:
                key = match.group(1).strip()
                value = match.group(2).strip()
                if "状态" in key:
                    metadata['status'] = 'stable' if 'stable' in value.lower() or '已采纳' in value or '完成' in value else 'draft'
                if "日期" in key:
                    try:
                        # 尝试提取日期格式
                        date_match = re.search(r'\d{4}-\d{2}-\d{2}', value)
                        if date_match:
                            metadata['created_at'] = date_match.group(0)
                    except:
                        pass
                if "作者" in key or "决策人" in key:
                    metadata['author'] = value
    return metadata

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return

    # 检查是否已有 Frontmatter
    has_frontmatter = content.startswith('---\n')
    existing_frontmatter = {}
    body = content

    if has_frontmatter:
        try:
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                existing_frontmatter = yaml.safe_load(parts[1]) or {}
                body = parts[2]
        except Exception as e:
            print(f"Error parsing existing frontmatter in {file_path}: {e}")

    # 检查 ID 是否需要修复
    current_id = existing_frontmatter.get('id', '')
    is_invalid_id = (
        not current_id or
        current_id == 'readme' or
        current_id == file_path.stem.lower().replace(' ', '_') or
        current_id == '_' or 
        (current_id.endswith('_') and len(current_id) > 20)
    )

    # 强制全量检查，不跳过，确保 ID 一致性
    # if all(field in existing_frontmatter for field in required_fields) and not is_invalid_id:
    #     print(f"Skipping {file_path.name}: Metadata complete")
    #     return

    # 提取信息
    inferred_meta = extract_metadata_from_block(body)
    stats = get_file_stats(file_path)
    
    # 构建新元数据
    new_meta = existing_frontmatter.copy()
    
    # 1. ID Generation Strategy (Path-based to ensure uniqueness)
    # 计算相对于 DOCS_DIR 的路径
    try:
        rel_path = file_path.relative_to(DOCS_DIR)
        # 将路径分隔符转换为下划线，去除扩展名
        # 保留中文，只替换空格和路径分隔符，以及可能导致 YAML 解析问题的特殊字符
        path_id = str(rel_path.with_suffix('')).replace(os.sep, '_').replace(' ', '_')
        path_id = path_id.replace(':', '').replace('#', '').replace('.', '_')
        
        # 如果 ID 需要修复，则更新
        if is_invalid_id or 'id' not in new_meta:
             new_meta['id'] = path_id
            
    except Exception as e:
        print(f"Error generating ID for {file_path}: {e}")
        if 'id' not in new_meta:
            new_meta['id'] = file_path.stem.replace(' ', '_').lower()

    # 2. Title
    if 'title' not in new_meta:
        title_match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
        if title_match:
            new_meta['title'] = title_match.group(1).strip()
        else:
            new_meta['title'] = file_path.stem

    # 3. Status
    if 'status' not in new_meta:
        new_meta['status'] = inferred_meta.get('status', 'stable') # 默认为 stable，假设存量文档多为已完成

    # 4. Author
    if 'author' not in new_meta:
        new_meta['author'] = inferred_meta.get('author', 'AI_Refactor')

    # 5. Dates
    if 'created_at' not in new_meta:
        new_meta['created_at'] = inferred_meta.get('created_at', stats['created_at'])
    if 'updated_at' not in new_meta:
        new_meta['updated_at'] = stats['updated_at']

    # 6. Domain & Type
    parent_dir = file_path.parent.name
    grandparent_dir = file_path.parent.parent.name
    
    if 'type' not in new_meta:
        # 尝试匹配父目录或祖父目录
        new_meta['type'] = TYPE_MAP.get(grandparent_dir, TYPE_MAP.get(parent_dir, 'other'))
        
    if 'domain' not in new_meta:
        new_meta['domain'] = infer_domain(body, file_path)
        
    # 7. Tags
    if 'tags' not in new_meta:
        new_meta['tags'] = []
        if new_meta['type'] != 'other':
            new_meta['tags'].append(new_meta['type'])
        if new_meta['domain'] != 'general':
            new_meta['tags'].append(new_meta['domain'])

    # 8. Related Code (默认空)
    if 'related_code' not in new_meta:
        # 简单的启发式：如果文件名匹配 src 下的某个文件
        # 这里先留空，避免错误关联
        pass

    # 重新组合文件
    print(f"Updating {file_path.name}...")
    
    # 按照标准顺序排序字段
    ordered_meta = {}
    field_order = ['id', 'title', 'author', 'status', 'type', 'domain', 'tags', 'created_at', 'updated_at', 'related_code']
    
    for field in field_order:
        if field in new_meta:
            ordered_meta[field] = new_meta[field]
            
    # 添加剩余字段
    for k, v in new_meta.items():
        if k not in ordered_meta:
            ordered_meta[k] = v

    yaml_str = yaml.dump(ordered_meta, allow_unicode=True, sort_keys=False).strip()
    new_content = f"---\n{yaml_str}\n---\n\n{body.lstrip()}"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    print("Starting documentation metadata refactoring...")
    for root, dirs, files in os.walk(DOCS_DIR):
        # 排除忽略目录
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                
                # 双重检查路径中不包含 archive
                if "archive" in str(file_path).lower():
                    continue
                    
                process_file(file_path)
    
    print("Refactoring complete.")

if __name__ == "__main__":
    main()
