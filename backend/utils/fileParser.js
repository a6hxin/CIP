/**
 * utils/fileParser.js — File reading, filtering, and language detection utilities
 */

const path = require('path');
const fs = require('fs-extra');

const LANGUAGE_MAP = {
  '.js':   'javascript',
  '.jsx':  'javascript',
  '.ts':   'typescript',
  '.tsx':  'typescript',
  '.py':   'python',
  '.rb':   'ruby',
  '.go':   'go',
  '.java': 'java',
  '.cs':   'csharp',
  '.cpp':  'cpp',
  '.c':    'c',
  '.php':  'php',
  '.rs':   'rust',
  '.kt':   'kotlin',
  '.swift':'swift',
};

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.cache', 'coverage', 'vendor']);

/**
 * Detect the programming language of a file by its extension
 */
function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

/**
 * Read a source file safely, returning null on failure
 */
async function readSourceFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch {
    return null;
  }
}

/**
 * Walk a directory tree, yielding source file paths
 */
async function* walkDirectory(dir, options = {}) {
  const { maxDepth = 10, depth = 0 } = options;
  if (depth > maxDepth) return;

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath, { ...options, depth: depth + 1 });
    } else if (entry.isFile() && detectLanguage(fullPath) !== 'unknown') {
      yield fullPath;
    }
  }
}

/**
 * Count lines of code, blank lines, and comment lines in a source string
 */
function countLines(content) {
  const lines = content.split('\n');
  const total = lines.length;
  const blank = lines.filter(l => l.trim() === '').length;
  const comment = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*') || t.startsWith('/*');
  }).length;
  return { total, blank, comment, code: total - blank - comment };
}

module.exports = { detectLanguage, readSourceFile, walkDirectory, countLines };
