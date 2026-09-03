'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SELF = path.relative(ROOT, __filename).split(path.sep).join('/');
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.py',
  '.sh',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);

// 다른 웹 프로젝트의 고유 식별자를 조각으로 조합해 검사한다.
// 문자열을 그대로 적지 않아 이 검사 파일 자체가 오탐되지 않도록 한다.
const FORBIDDEN_MARKERS = [
  ['office', 'toolbox'].join(''),
  ['office', ' toolbox'].join(''),
  ['office', '-toolbox-site'].join(''),
  ['office', 'toolbox.online'].join(''),
  ['사무실', ' 공구함'].join(''),
  ['업무', ' 도구함'].join(''),
  ['G-83', 'L4XP2KD0'].join(''),
  ['/char', '-counter'].join(''),
  ['/business', '-status'].join(''),
];

const EXCLUDED_DIRECTORIES = new Set(['.git', 'node_modules']);
const EXCLUDED_FILES = new Set([SELF]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, files);
      continue;
    }

    const relativePath = path.relative(ROOT, absolutePath).split(path.sep).join('/');
    if (EXCLUDED_FILES.has(relativePath)) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    files.push({ absolutePath, relativePath });
  }
  return files;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

const violations = [];
for (const file of walk(ROOT)) {
  let content;
  try {
    content = fs.readFileSync(file.absolutePath, 'utf8');
  } catch (_error) {
    continue;
  }

  const normalized = content.toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    const index = normalized.indexOf(marker.toLowerCase());
    if (index === -1) continue;
    violations.push({
      file: file.relativePath,
      line: lineNumberAt(content, index),
      marker,
    });
  }
}

if (violations.length) {
  console.error('Cross-project content was found in the Japanese diagnosis repository:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} (${violation.marker})`);
  }
  process.exit(1);
}

console.log('PASS: repository scope is limited to the Japanese shindan24.com project.');
