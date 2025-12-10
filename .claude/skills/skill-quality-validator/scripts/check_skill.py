#!/usr/bin/env python3
"""
技能质量检查器 - 验证Claude技能是否符合官方最佳实践

用法: python check_skill.py <skill_path>
参数: skill_path - 技能目录路径或.skill文件路径
"""

import os
import sys
import re
import json
import zipfile
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple

class SkillQualityChecker:
    """技能质量检查器"""
    
    def __init__(self, skill_path: str):
        self.skill_path = Path(skill_path)
        self.is_packaged = self.skill_path.suffix == '.skill'
        self.temp_dir = None
        self.work_dir = None
        self.issues = {
            'critical': [],  # 致命问题
            'warning': [],   # 警告
            'suggestion': [] # 建议
        }
        self.score = 100
        
    def run(self) -> Dict:
        """执行完整检查流程"""
        try:
            # 准备工作目录
            self._prepare_workspace()
            
            # 执行各项检查
            self._check_structure()
            self._check_yaml_frontmatter()
            self._check_description_quality()
            self._check_skill_md_content()
            self._check_file_references()
            self._check_scripts()
            self._check_references()
            
            # 生成报告
            return self._generate_report()
            
        finally:
            self._cleanup()
    
    def _prepare_workspace(self):
        """准备工作目录"""
        if self.is_packaged:
            # 解压.skill文件
            self.temp_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(self.skill_path, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)
            self.work_dir = Path(self.temp_dir)
        else:
            self.work_dir = self.skill_path
    
    def _cleanup(self):
        """清理临时目录"""
        if self.temp_dir:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def _check_structure(self):
        """检查目录结构完整性"""
        # 必需文件
        skill_md = self.work_dir / 'SKILL.md'
        if not skill_md.exists():
            self._add_issue('critical', '缺少必需文件: SKILL.md', 
                          '创建SKILL.md文件，这是技能的核心文档')
            self.score -= 30
            return
        
        # 推荐目录
        recommended_dirs = {
            'scripts': '存放可重用的Python脚本',
            'references': '存放参考文档和配置文件',
            'assets': '存放输出使用的资源文件'
        }
        
        for dir_name, purpose in recommended_dirs.items():
            dir_path = self.work_dir / dir_name
            if not dir_path.exists():
                self._add_issue('suggestion', 
                              f'建议创建{dir_name}/目录',
                              f'{purpose}。如果技能不需要此类资源可忽略')
        
        # 检查是否有未清理的示例文件
        example_files = []
        for root, dirs, files in os.walk(self.work_dir):
            for f in files:
                if 'example' in f.lower():
                    example_files.append(os.path.join(root, f))
        
        if example_files:
            self._add_issue('warning', 
                          f'发现{len(example_files)}个示例文件未清理',
                          f'删除以下文件: {", ".join(example_files)}')
            self.score -= 5
    
    def _check_yaml_frontmatter(self):
        """检查YAML前置信息"""
        skill_md = self.work_dir / 'SKILL.md'
        if not skill_md.exists():
            return
        
        content = skill_md.read_text(encoding='utf-8')
        
        # 检查YAML块
        yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not yaml_match:
            self._add_issue('critical', 
                          'SKILL.md缺少YAML frontmatter',
                          '在文件开头添加---包裹的YAML块，包含name和description字段')
            self.score -= 20
            return
        
        yaml_content = yaml_match.group(1)
        
        # 检查必需字段
        if 'name:' not in yaml_content:
            self._add_issue('critical', 'YAML缺少name字段',
                          '添加 name: your-skill-name')
            self.score -= 10
        
        if 'description:' not in yaml_content:
            self._add_issue('critical', 'YAML缺少description字段',
                          '添加 description: > 后跟详细描述')
            self.score -= 10
        else:
            # 提取description内容进行质量检查
            self.yaml_description = yaml_content
    
    def _check_description_quality(self):
        """检查description质量"""
        skill_md = self.work_dir / 'SKILL.md'
        if not skill_md.exists():
            return
        
        content = skill_md.read_text(encoding='utf-8')
        yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not yaml_match:
            return
        
        yaml_content = yaml_match.group(1)
        
        # 提取description
        desc_match = re.search(r'description:\s*[>|]\s*(.*?)(?=\n\w+:|$)', 
                              yaml_content, re.DOTALL)
        if not desc_match:
            return
        
        description = desc_match.group(1).strip()
        
        # 检查"何时使用"
        if not any(keyword in description.lower() for keyword in 
                   ['use when', 'use for', '何时使用', '触发', 'trigger']):
            self._add_issue('warning', 
                          'description缺少"何时使用"说明',
                          '添加 "Use when..." 或 "适用于..." 描述触发场景')
            self.score -= 8
        
        # 检查具体场景数量
        scenario_patterns = [
            r'\(\d+\)',  # (1), (2), (3)
            r'\d+\.',    # 1. 2. 3.
            r'-\s+\*\*', # - **场景**
        ]
        scenario_count = 0
        for pattern in scenario_patterns:
            scenario_count = max(scenario_count, 
                               len(re.findall(pattern, description)))
        
        if scenario_count < 3:
            self._add_issue('warning', 
                          f'description只列举了{scenario_count}个场景，建议3-5个',
                          '补充更多具体使用场景，帮助Claude理解何时触发技能')
            self.score -= 5
        
        # 检查长度
        if len(description) < 100:
            self._add_issue('warning', 
                          'description过短（<100字符）',
                          '补充功能说明、触发场景和具体用途')
            self.score -= 5
    
    def _check_skill_md_content(self):
        """检查SKILL.md内容质量"""
        skill_md = self.work_dir / 'SKILL.md'
        if not skill_md.exists():
            return
        
        content = skill_md.read_text(encoding='utf-8')
        
        # 去除YAML部分
        content_without_yaml = re.sub(r'^---\n.*?\n---\n', '', content, 
                                     flags=re.DOTALL)
        
        # 检查长度
        lines = content_without_yaml.split('\n')
        line_count = len([l for l in lines if l.strip()])
        
        if line_count > 500:
            self._add_issue('warning', 
                          f'SKILL.md内容过长（{line_count}行，建议<500行）',
                          '将详细内容移至references/目录，SKILL.md保持简洁')
            self.score -= 10
        
        # 检查关键章节
        recommended_sections = {
            '快速开始': r'##\s*快速开始|##\s*Quick Start',
            '工作流程': r'##\s*工作流程|##\s*Workflow|##\s*Usage',
        }
        
        missing_sections = []
        for section_name, pattern in recommended_sections.items():
            if not re.search(pattern, content_without_yaml, re.IGNORECASE):
                missing_sections.append(section_name)
        
        if missing_sections:
            self._add_issue('suggestion', 
                          f'建议添加章节: {", ".join(missing_sections)}',
                          '这些章节帮助用户快速理解如何使用技能')
        
        # 检查是否有内联长代码块
        code_blocks = re.findall(r'```.*?```', content_without_yaml, re.DOTALL)
        long_code_blocks = [cb for cb in code_blocks if len(cb.split('\n')) > 50]
        
        if long_code_blocks:
            self._add_issue('suggestion', 
                          f'发现{len(long_code_blocks)}个长代码块（>50行）',
                          '考虑将代码移至scripts/目录并在SKILL.md中引用')
    
    def _check_file_references(self):
        """检查文件引用有效性"""
        skill_md = self.work_dir / 'SKILL.md'
        if not skill_md.exists():
            return
        
        content = skill_md.read_text(encoding='utf-8')
        
        # 查找所有文件引用
        ref_patterns = [
            r'`([^`]+\.(py|md|json|yaml|yml|txt|sh))`',  # `file.ext`
            r'\[.*?\]\(([^)]+\.(py|md|json|yaml|yml|txt|sh))\)',  # [text](file)
        ]
        
        broken_refs = []
        for pattern in ref_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                file_ref = match[0] if isinstance(match, tuple) else match
                
                # 清理路径
                file_ref = file_ref.strip('`')
                if file_ref.startswith('/'):
                    continue  # 跳过绝对路径
                
                ref_path = self.work_dir / file_ref
                if not ref_path.exists():
                    broken_refs.append(file_ref)
        
        if broken_refs:
            self._add_issue('warning', 
                          f'发现{len(broken_refs)}个失效文件引用',
                          f'修复或删除这些引用: {", ".join(set(broken_refs))}')
            self.score -= 10
    
    def _check_scripts(self):
        """检查scripts目录"""
        scripts_dir = self.work_dir / 'scripts'
        if not scripts_dir.exists():
            return
        
        py_files = list(scripts_dir.glob('*.py'))
        if not py_files:
            self._add_issue('suggestion', 
                          'scripts/目录为空',
                          '如不需要可删除，否则添加可重用脚本')
            return
        
        for py_file in py_files:
            content = py_file.read_text(encoding='utf-8')
            
            # 检查shebang
            if not content.startswith('#!/usr/bin/env python'):
                self._add_issue('suggestion', 
                              f'{py_file.name}缺少shebang',
                              f'在文件开头添加 #!/usr/bin/env python3')
            
            # 检查docstring
            if not re.search(r'"""[\s\S]*?"""', content[:500]):
                self._add_issue('suggestion', 
                              f'{py_file.name}缺少文档字符串',
                              '添加模块级docstring说明用途和用法')
            
            # 基础语法检查
            try:
                compile(content, py_file.name, 'exec')
            except SyntaxError as e:
                self._add_issue('critical', 
                              f'{py_file.name}存在语法错误: {e}',
                              '修复Python语法错误')
                self.score -= 15
    
    def _check_references(self):
        """检查references目录"""
        refs_dir = self.work_dir / 'references'
        if not refs_dir.exists():
            return
        
        md_files = list(refs_dir.glob('*.md'))
        if not md_files:
            self._add_issue('suggestion', 
                          'references/目录为空',
                          '如不需要可删除，否则添加参考文档')
            return
        
        for md_file in md_files:
            content = md_file.read_text(encoding='utf-8')
            
            # 检查基本Markdown结构
            if not re.search(r'^#\s+', content, re.MULTILINE):
                self._add_issue('suggestion', 
                              f'{md_file.name}缺少标题',
                              '添加一级标题说明文档主题')
            
            # 检查是否为空或只有示例内容
            if len(content.strip()) < 50 or 'This is a reference document' in content:
                self._add_issue('warning', 
                              f'{md_file.name}内容不足或为示例',
                              '补充实际参考内容或删除此文件')
                self.score -= 3
    
    def _add_issue(self, level: str, message: str, suggestion: str):
        """添加问题记录"""
        self.issues[level].append({
            'message': message,
            'suggestion': suggestion
        })
    
    def _generate_report(self) -> Dict:
        """生成检查报告"""
        total_issues = sum(len(issues) for issues in self.issues.values())
        
        # 计算等级
        if self.score >= 90:
            grade = 'A - 优秀'
        elif self.score >= 80:
            grade = 'B - 良好'
        elif self.score >= 70:
            grade = 'C - 合格'
        elif self.score >= 60:
            grade = 'D - 需改进'
        else:
            grade = 'F - 不合格'
        
        return {
            'skill_name': self.skill_path.name,
            'score': max(0, self.score),
            'grade': grade,
            'total_issues': total_issues,
            'issues': self.issues,
            'passed': self.score >= 70 and len(self.issues['critical']) == 0
        }


def format_report(report: Dict) -> str:
    """格式化输出报告"""
    lines = []
    lines.append("=" * 70)
    lines.append("技能质量检查报告")
    lines.append("=" * 70)
    lines.append(f"\n技能名称: {report['skill_name']}")
    lines.append(f"综合评分: {report['score']}/100")
    lines.append(f"评级等级: {report['grade']}")
    lines.append(f"总问题数: {report['total_issues']}")
    lines.append(f"检查结果: {'✅ 通过' if report['passed'] else '❌ 未通过'}")
    
    # 致命问题
    if report['issues']['critical']:
        lines.append("\n" + "=" * 70)
        lines.append("🔴 致命问题 (Critical Issues)")
        lines.append("=" * 70)
        for i, issue in enumerate(report['issues']['critical'], 1):
            lines.append(f"\n{i}. {issue['message']}")
            lines.append(f"   💡 改进建议: {issue['suggestion']}")
    
    # 警告
    if report['issues']['warning']:
        lines.append("\n" + "=" * 70)
        lines.append("⚠️  警告 (Warnings)")
        lines.append("=" * 70)
        for i, issue in enumerate(report['issues']['warning'], 1):
            lines.append(f"\n{i}. {issue['message']}")
            lines.append(f"   💡 改进建议: {issue['suggestion']}")
    
    # 建议
    if report['issues']['suggestion']:
        lines.append("\n" + "=" * 70)
        lines.append("💡 优化建议 (Suggestions)")
        lines.append("=" * 70)
        for i, issue in enumerate(report['issues']['suggestion'], 1):
            lines.append(f"\n{i}. {issue['message']}")
            lines.append(f"   💡 改进建议: {issue['suggestion']}")
    
    if report['passed']:
        lines.append("\n" + "=" * 70)
        lines.append("✅ 恭喜！该技能符合官方最佳实践标准")
        lines.append("=" * 70)
    else:
        lines.append("\n" + "=" * 70)
        lines.append("❌ 请优先修复致命问题和警告，然后重新检查")
        lines.append("=" * 70)
    
    return "\n".join(lines)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python check_skill.py <skill_path>")
        print("参数: skill_path - 技能目录路径或.skill文件路径")
        sys.exit(1)
    
    skill_path = sys.argv[1]
    
    if not os.path.exists(skill_path):
        print(f"错误: 路径不存在: {skill_path}")
        sys.exit(1)
    
    checker = SkillQualityChecker(skill_path)
    report = checker.run()
    
    print(format_report(report))
    
    # 返回适当的退出码
    sys.exit(0 if report['passed'] else 1)
