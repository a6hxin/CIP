/**
 * services/architectureDetector.js — Detect architectural patterns and module structure
 */

const path = require('path');
const fs = require('fs-extra');
const { glob } = require('glob');
const { getRepoPath } = require('./gitService');

const PATTERNS = {
  mvc: ['controllers', 'models', 'views'],
  layered: ['routes', 'services', 'repositories', 'utils'],
  modular: ['modules', 'features', 'domains'],
  monorepo: ['packages', 'apps', 'libs'],
};

/**
 * Detect the high-level architecture of the repository
 */
async function detect(repoId) {
  const repoPath = getRepoPath(repoId);

  const entries = await fs.readdir(repoPath).catch(() => []);
  const dirs = [];
  for (const entry of entries) {
    const stat = await fs.stat(path.join(repoPath, entry)).catch(() => null);
    if (stat && stat.isDirectory() && entry !== 'node_modules') {
      dirs.push(entry.toLowerCase());
    }
  }

  const detectedPatterns = [];
  for (const [pattern, keywords] of Object.entries(PATTERNS)) {
    const matches = keywords.filter(k => dirs.some(d => d.includes(k)));
    if (matches.length >= 2) {
      detectedPatterns.push({ pattern, matches, confidence: matches.length / keywords.length });
    }
  }

  // Build module relationship map
  const modules = await buildModuleMap(repoPath);

  return {
    repoId,
    topLevelDirs: dirs,
    detectedPatterns,
    primaryPattern: detectedPatterns.sort((a, b) => b.confidence - a.confidence)[0]?.pattern || 'unknown',
    modules,
  };
}

async function buildModuleMap(repoPath) {
  const files = await glob('**/*.js', {
    cwd: repoPath,
    ignore: ['**/node_modules/**', '**/dist/**'],
    absolute: true,
  }).catch(() => []);

  const moduleMap = {};
  const importRegex = /require\(['"]([^'"]+)['"]\)|import\s+.*from\s+['"]([^'"]+)['"]/g;

  for (const filePath of files.slice(0, 100)) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const rel = path.relative(repoPath, filePath);
      const imports = [];
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const dep = match[1] || match[2];
        if (dep && dep.startsWith('.')) imports.push(dep);
      }
      if (imports.length > 0) moduleMap[rel] = imports;
    } catch (_) {}
  }

  return moduleMap;
}

module.exports = { detect };
