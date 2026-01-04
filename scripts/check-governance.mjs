#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredFiles = [
  'CLAUDE.md',
  'AGENTS.md',
  'BACKLOG.md',
  'PROGRESS.md',
];

const indexFiles = [
  '开发文档/00_index/DOC_INDEX.md',
  '开发文档/00_index/CODE_INDEX.md',
  '开发文档/00_index/PROGRESS_INDEX.md',
];

const coreDirs = [
  'src/domain',
  'src/application',
  'src/app',
  '开发文档/03_technical_design',
  '开发文档/01_features',
  '开发文档/00_standards',
];

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function checkRequired() {
  requiredFiles.forEach((file) => {
    if (!exists(file)) {
      errors.push(`缺失必备文件：${file}`);
    }
  });
}

function checkIndexes() {
  indexFiles.forEach((file) => {
    if (!exists(file)) {
      errors.push(`索引缺失：${file}`);
    }
  });
}

function checkCoreDirectories() {
  const codeIndex = exists(indexFiles[1]) ? read(indexFiles[1]) : '';
  const docIndex = exists(indexFiles[0]) ? read(indexFiles[0]) : '';

  coreDirs.forEach((dir) => {
    const indexPath = path.join(dir, 'INDEX.md');
    const indexedInParent = codeIndex.includes(dir) || docIndex.includes(dir);
    if (!exists(indexPath) && !indexedInParent) {
      errors.push(`核心目录未登记：${dir} 需要 INDEX.md 或在 CODE/DOC 索引中显式登记`);
    }
  });
}

function parseBacklog() {
  if (!exists('BACKLOG.md')) return;
  const lines = read('BACKLOG.md').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!line.startsWith('|') || line.startsWith('| ---')) return;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 10) return;
    const [id, date, board, owner, desc, priority, status, docPath, codePath, evidence] = cells;
    if (status === 'DONE') {
      if (!docPath) {
        errors.push(`BACKLOG ${id || `行${idx + 1}`}: DONE 但关联文档为空`);
      }
      if (!evidence) {
        errors.push(`BACKLOG ${id || `行${idx + 1}`}: DONE 但缺少验收/证据`);
      }
      if ((codePath || '').toUpperCase() !== 'N/A' && !codePath) {
        errors.push(`BACKLOG ${id || `行${idx + 1}`}: DONE 但关联代码为空（非 N/A）`);
      }
    }
  });
}

function main() {
  checkRequired();
  checkIndexes();
  checkCoreDirectories();
  parseBacklog();

  if (errors.length) {
    console.error('治理检查失败：');
    errors.forEach((err) => console.error(`- ${err}`));
    process.exit(1);
  }

  console.log('治理检查通过：核心文件与索引齐备。');
}

main();
