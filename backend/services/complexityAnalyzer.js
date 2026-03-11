/**
 * services/complexityAnalyzer.js — Cyclomatic complexity + health scoring
 */

const path = require('path');
const fs = require('fs-extra');
const { glob } = require('glob');
const { calculateCyclomatic } = require('../../analyzers/complexity-analyzer/cyclomatic');
const { detectHotspots } = require('../../analyzers/complexity-analyzer/hotspot_detector');
const { calculateMetrics } = require('../utils/metricsCalculator');
const { getRepoPath } = require('./gitService');

/**
 * Run full complexity analysis for a cloned repository
 * Returns per-file metrics, aggregate scores, and AI insight stubs
 */
async function analyze(repoId) {
  const repoPath = getRepoPath(repoId);

  // Find JS/TS/Python source files (exclude node_modules, tests, dist)
  const patterns = ['**/*.js', '**/*.ts', '**/*.py', '**/*.jsx', '**/*.tsx'];
  const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'];

  const files = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd: repoPath, ignore, absolute: true });
    files.push(...found);
  }

  const fileMetrics = [];
  for (const filePath of files.slice(0, 200)) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;
      const complexity = calculateCyclomatic(content, filePath);
      const relativePath = path.relative(repoPath, filePath);
      fileMetrics.push({ name: relativePath, lines, complexity });
    } catch (_) {}
  }

  const hotspots = detectHotspots(fileMetrics);
  const aggregates = calculateMetrics(fileMetrics);

  // Persist report
  const reportPath = path.join(__dirname, '../../data/complexity_reports', `${repoId}.json`);
  await fs.ensureDir(path.dirname(reportPath));
  await fs.writeJson(reportPath, { repoId, analyzedAt: new Date().toISOString(), files: fileMetrics }, { spaces: 2 });

  return {
    ...aggregates,
    files: fileMetrics,
    hotspots,
    aiInsights: generateInsightStubs(aggregates),
  };
}

function generateInsightStubs(metrics) {
  const insights = [];
  if (metrics.avgComplexity > 10) {
    insights.push(`⚠️ Average cyclomatic complexity is ${metrics.avgComplexity.toFixed(1)} — consider breaking down large functions into smaller, single-responsibility units.`);
  }
  if (metrics.highComplexityFiles > 5) {
    insights.push(`🔥 ${metrics.highComplexityFiles} files exceed complexity threshold of 20. These are prime refactoring candidates.`);
  }
  if (metrics.totalFiles > 100) {
    insights.push(`📦 Large codebase (${metrics.totalFiles} files). Consider enforcing module boundaries and barrel exports.`);
  }
  if (insights.length === 0) {
    insights.push('✅ Codebase complexity looks healthy! Keep maintaining low cyclomatic complexity per function.');
  }
  return insights;
}

module.exports = { analyze };
