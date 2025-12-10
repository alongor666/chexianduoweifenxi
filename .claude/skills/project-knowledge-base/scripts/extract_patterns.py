#!/usr/bin/env python3
"""
知识模式提取脚本（MVP版本）
使用正则表达式提取技术决策和代码模式
"""

import os
import re
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

class PatternExtractor:
    """模式提取器 - 使用正则匹配关键模式"""
    
    # 正则模式定义
    PATTERN_DECISION = r'#\s*@decision:\s*(.+?)(?:\n|$)'
    PATTERN_FUNCTION = r'def\s+(\w+)\s*\(([^)]*)\):\s*\n\s*"""([^"]*?)"""'
    PATTERN_CONFIG_JSON = r'"(\w+)":\s*(\{[^}]+\}|\[[^\]]+\]|[^,\n]+)'
    
    def __init__(self, source_dir: str, output_dir: str):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.stats = {
            'files_scanned': 0,
            'decisions_found': 0,
            'code_patterns_found': 0,
            'configs_found': 0
        }
    
    def extract_from_python(self, file_path: Path) -> Tuple[List[Dict], List[Dict]]:
        """从Python文件提取决策和代码模式"""
        decisions = []
        code_patterns = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取@decision
            for match in re.finditer(self.PATTERN_DECISION, content):
                decisions.append({
                    'file': str(file_path.relative_to(self.source_dir)),
                    'decision': match.group(1).strip(),
                    'extracted_at': datetime.now().isoformat()
                })
                self.stats['decisions_found'] += 1
            
            # 提取函数定义
            for match in re.finditer(self.PATTERN_FUNCTION, content, re.MULTILINE):
                func_name = match.group(1)
                func_args = match.group(2)
                func_doc = match.group(3).strip()
                
                code_patterns.append({
                    'file': str(file_path.relative_to(self.source_dir)),
                    'type': 'function',
                    'name': func_name,
                    'signature': f"def {func_name}({func_args})",
                    'docstring': func_doc,
                    'extracted_at': datetime.now().isoformat()
                })
                self.stats['code_patterns_found'] += 1
        
        except Exception as e:
            print(f"  ⚠️ 读取文件失败 {file_path}: {e}")
        
        return decisions, code_patterns
    
    def extract_from_markdown(self, file_path: Path) -> List[Dict]:
        """从Markdown文件提取决策"""
        decisions = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取@decision（Markdown中可能在代码块或注释中）
            for match in re.finditer(self.PATTERN_DECISION, content):
                decisions.append({
                    'file': str(file_path.relative_to(self.source_dir)),
                    'decision': match.group(1).strip(),
                    'extracted_at': datetime.now().isoformat()
                })
                self.stats['decisions_found'] += 1
        
        except Exception as e:
            print(f"  ⚠️ 读取文件失败 {file_path}: {e}")
        
        return decisions
    
    def extract_from_json(self, file_path: Path) -> List[Dict]:
        """从JSON配置文件提取结构模式"""
        configs = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 提取配置结构
            config_entry = {
                'file': str(file_path.relative_to(self.source_dir)),
                'type': 'json_config',
                'structure': self._extract_json_structure(data),
                'sample': data,
                'extracted_at': datetime.now().isoformat()
            }
            
            configs.append(config_entry)
            self.stats['configs_found'] += 1
        
        except Exception as e:
            print(f"  ⚠️ 读取JSON失败 {file_path}: {e}")
        
        return configs
    
    def _extract_json_structure(self, data, prefix='') -> List[str]:
        """递归提取JSON结构"""
        structure = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                path = f"{prefix}.{key}" if prefix else key
                value_type = type(value).__name__
                structure.append(f"{path}: {value_type}")
                
                if isinstance(value, (dict, list)):
                    structure.extend(self._extract_json_structure(value, path))
        
        elif isinstance(data, list) and data:
            structure.append(f"{prefix}[]: {type(data[0]).__name__}")
        
        return structure
    
    def scan_directory(self, extensions: List[str] = None):
        """扫描目录并提取模式"""
        if extensions is None:
            extensions = ['.py', '.md', '.json']
        
        all_decisions = []
        all_code_patterns = []
        all_configs = []
        
        print(f"🔍 扫描目录: {self.source_dir}")
        
        for ext in extensions:
            for file_path in self.source_dir.rglob(f'*{ext}'):
                self.stats['files_scanned'] += 1
                print(f"  📄 处理: {file_path.name}")
                
                if ext == '.py':
                    decisions, code_patterns = self.extract_from_python(file_path)
                    all_decisions.extend(decisions)
                    all_code_patterns.extend(code_patterns)
                
                elif ext == '.md':
                    decisions = self.extract_from_markdown(file_path)
                    all_decisions.extend(decisions)
                
                elif ext == '.json':
                    configs = self.extract_from_json(file_path)
                    all_configs.extend(configs)
        
        return all_decisions, all_code_patterns, all_configs
    
    def save_results(self, decisions: List[Dict], code_patterns: List[Dict], configs: List[Dict]):
        """保存提取结果"""
        # 创建输出目录
        decisions_dir = self.output_dir / 'decisions'
        code_dir = self.output_dir / 'patterns' / 'code'
        config_dir = self.output_dir / 'patterns' / 'configs'
        
        for dir_path in [decisions_dir, code_dir, config_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # 保存技术决策
        if decisions:
            decisions_file = decisions_dir / f'decisions_{datetime.now().strftime("%Y%m%d")}.md'
            with open(decisions_file, 'w', encoding='utf-8') as f:
                f.write(f"# 技术决策记录\n\n")
                f.write(f"> 自动提取于 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                for i, dec in enumerate(decisions, 1):
                    f.write(f"## 决策 {i}: {dec['decision']}\n\n")
                    f.write(f"- **来源文件**: `{dec['file']}`\n")
                    f.write(f"- **提取时间**: {dec['extracted_at']}\n\n")
                    f.write("---\n\n")
            
            print(f"  ✅ 技术决策保存至: {decisions_file}")
        
        # 保存代码模式
        if code_patterns:
            code_file = code_dir / f'code_patterns_{datetime.now().strftime("%Y%m%d")}.json'
            with open(code_file, 'w', encoding='utf-8') as f:
                json.dump(code_patterns, f, indent=2, ensure_ascii=False)
            
            # 同时生成Markdown可读版本
            code_md = code_dir / f'code_patterns_{datetime.now().strftime("%Y%m%d")}.md'
            with open(code_md, 'w', encoding='utf-8') as f:
                f.write(f"# 代码模式库\n\n")
                f.write(f"> 自动提取于 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                for pattern in code_patterns:
                    f.write(f"## {pattern['name']}\n\n")
                    f.write(f"**文件**: `{pattern['file']}`\n\n")
                    f.write(f"**函数签名**:\n```python\n{pattern['signature']}\n```\n\n")
                    if pattern['docstring']:
                        f.write(f"**说明**:\n{pattern['docstring']}\n\n")
                    f.write("---\n\n")
            
            print(f"  ✅ 代码模式保存至: {code_file} 和 {code_md}")
        
        # 保存配置模板
        if configs:
            config_file = config_dir / f'config_templates_{datetime.now().strftime("%Y%m%d")}.json'
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(configs, f, indent=2, ensure_ascii=False)
            
            print(f"  ✅ 配置模板保存至: {config_file}")

def main():
    if len(sys.argv) < 3:
        print("用法: python extract_patterns.py <源代码目录> <知识库目录>")
        print("示例: python extract_patterns.py /path/to/source /home/claude/kb")
        sys.exit(1)
    
    source_dir = sys.argv[1]
    kb_dir = sys.argv[2]
    
    if not os.path.exists(source_dir):
        print(f"❌ 源代码目录不存在: {source_dir}")
        sys.exit(1)
    
    if not os.path.exists(kb_dir):
        print(f"❌ 知识库目录不存在: {kb_dir}")
        sys.exit(1)
    
    print(f"🚀 开始提取知识模式")
    print(f"📂 源代码目录: {source_dir}")
    print(f"📁 知识库目录: {kb_dir}\n")
    
    # 创建提取器并执行
    extractor = PatternExtractor(source_dir, kb_dir)
    decisions, code_patterns, configs = extractor.scan_directory()
    
    # 保存结果
    print(f"\n💾 保存提取结果...")
    extractor.save_results(decisions, code_patterns, configs)
    
    # 输出统计
    print(f"\n📊 提取统计:")
    print(f"  - 扫描文件数: {extractor.stats['files_scanned']}")
    print(f"  - 技术决策: {extractor.stats['decisions_found']}")
    print(f"  - 代码模式: {extractor.stats['code_patterns_found']}")
    print(f"  - 配置模板: {extractor.stats['configs_found']}")
    
    print(f"\n✨ 提取完成!")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
