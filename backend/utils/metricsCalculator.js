/**
 * utils/metricsCalculator.js — Aggregate metric computation from file-level data
 */

/**
 * Calculate aggregate metrics from an array of file complexity records
 * @param {Array<{name, lines, complexity}>} files
 * @returns {Object} aggregate metrics
 */
function calculateMetrics(files) {
  if (!files || files.length === 0) {
    return {
      totalFiles: 0,
      totalLines: 0,
      avgComplexity: 0,
      maxComplexity: 0,
      highComplexityFiles: 0,
      healthScore: 100,
      churnRate: 0,
      totalDependencies: 0,
      vulnerabilities: 0,
    };
  }

  const totalFiles = files.length;
  const totalLines = files.reduce((s, f) => s + (f.lines || 0), 0);
  const complexities = files.map(f => f.complexity || 1);

  const avgComplexity = parseFloat((complexities.reduce((a, b) => a + b, 0) / totalFiles).toFixed(2));
  const maxComplexity = Math.max(...complexities);
  const highComplexityFiles = files.filter(f => (f.complexity || 0) > 20).length;

  // Health score: starts at 100, penalized by complexity and high-complexity file ratio
  let healthScore = 100;
  if (avgComplexity > 5)  healthScore -= Math.min((avgComplexity - 5) * 3, 30);
  if (highComplexityFiles > 0) healthScore -= Math.min((highComplexityFiles / totalFiles) * 100 * 0.4, 40);
  healthScore = Math.max(0, Math.round(healthScore));

  return {
    totalFiles,
    totalLines,
    avgComplexity,
    maxComplexity,
    highComplexityFiles,
    healthScore,
    churnRate: 0, // populated separately from git log
    totalDependencies: 0,
    vulnerabilities: 0,
  };
}

/**
 * Merge complexity metrics with git churn data
 */
function mergeWithChurn(metrics, churnData) {
  return {
    ...metrics,
    churnRate: churnData.churnRate || 0,
    mostChangedFiles: churnData.mostChanged || [],
  };
}

/**
 * Normalize a complexity value to a 0–100 score
 */
function normalizeComplexity(value, max = 50) {
  return Math.round(Math.max(0, Math.min(100, 100 - (value / max) * 100)));
}

module.exports = { calculateMetrics, mergeWithChurn, normalizeComplexity };
